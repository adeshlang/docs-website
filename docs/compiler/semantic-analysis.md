---
id: semantic-analysis
title: Semantic Analysis & HIR - Types, Symbol Resolution, Desugaring
sidebar_label: Semantic Analysis & HIR
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Semantic Analysis & HIR — Types, Symbols, and Desugaring

<FeatureStatus status="STABLE" details="Type inference, symbol resolution, HIR lowering, scoping rules, generic bounds" />

The parser gives us a **syntax tree**. The next stage checks whether the
program *means* anything coherent: are names defined? do types line up? is
control flow legal? This is **semantic analysis**, and it runs on an
intermediate representation called **HIR** (High-Level IR).

> Core invariant: *semantic analysis runs on desugared HIR before any LIR
> lowering* — the checker always sees the simplified, canonical form of your
> code.

---

## Pipeline Position

```
Source → Lexer → Parser → AST ──► HIR ──► Semantic Analysis ──► MIR/Borrow → VIR → Backends
                          │         │              │
                       desugar  resolve+scopes  type check
```

HIR is the bridge: the AST is syntax-faithful; HIR is semantics-ready.

---

## Stage 3 — HIR: the desugared program

**Sources:** [`src/ir/hir`](file:///d:/Projects/AdeshLang/src/ir/hir) (`mod.rs`, `lower.rs`), `src/parsing/hir_lower.rs`, `src/parsing/hir_passes.rs`, `src/parsing/hir.rs`

The HIR pass takes the AST and produces a cleaned, fully-resolved intermediate tree:

### Desugaring Table

| Surface Syntax | HIR Canonical Form | Notes |
|---|---|---|
| `if cond { } elif cond2 { } else { }` | nested `if` with `else` branches | elif is sugar |
| `cond ? a : b` / ternary | `if cond { a } else { b }` | normalized early |
| `a ?? b` (nullish coalesce) | `if a != null { a } else { b }` | desugared |
| `a?.b` (optional chaining) | `if a != null { a.b } else { null }` | desugared |
| `...spread` in arrays/calls | explicit `Spread` HIR node | lowered explicitly |
| `for x in iter { }` | `while` + iterator protocol | desugared |
| `this` / `self` receivers | single canonical `self` | unified in HIR |
| Decorators `@pure` | attached metadata on HIR node | validated later |

### What HIR Resolves

- **Symbol binding** — every `Identifier` is bound to its declaration (variable, function, class, struct, enum, import, generic param). Unbound names are an error here.
- **Scope explicitation** — block scopes, function scopes, class scopes, loop scopes, and closure captures are explicit nodes. Shadowing is validated.
- **Receiver normalization** — both `this` and `self` become one canonical form so later passes have a single case to handle.
- **Import resolution** — `import Foo from "./bar.adesh"` is resolved to a module path; missing modules are reported with source spans.

### HIR Node Sketch (ASCII)

```
HIR Module
 ├── HIR Item: Function `main`
 │    ├── params: [HirParam { name, ty, span }]
 │    ├── body: HirBlock
 │    │    ├── HirStmt::Let { name, ty?, init, scope_id }
 │    │    ├── HirStmt::Expr( HirExpr::Call { callee, args } )
 │    │    └── HirStmt::Return( HirExpr::Literal )
 │    └── scope: ScopeId(3) ──► SymbolTable entry
 ├── HIR Item: Class `Counter`
 │    ├── fields: [HirField { name, ty, visibility }]
 │    ├── methods: [HirFunction]
 │    └── extends: Option<HirType>
 └── imports: [HirImport { path, alias, span }]
```

---

## Symbol Table & Scope Model

**Sources:** `src/parsing/ast.rs` (scoped nodes), `src/semantics/engine.rs`, `src/ir/hir/mod.rs`

### Scope Hierarchy

```
Global Scope (module)
 ├── Function Scope (fn foo)
 │    ├── Block Scope (if/while body)
 │    │    └── Loop Scope (for/while)
 │    └── Closure Scope (captures parent bindings)
 └── Class Scope (class Bar)
      └── Method Scope (fn method(self))
```

Scopes are **lexically nested** and form a tree. Each scope owns a `SymbolTable`:

| Concept | Representation |
|---|---|
| `ScopeId` | Arena index into scope tree |
| `Symbol` | `{ name, kind, type, span, scope_id, mutable, shadowed_from }` |
| `SymbolKind` | `Variable`, `Function`, `Class`, `Struct`, `Enum`, `EnumVariant`, `Param`, `Import`, `GenericParam`, `Field` |
| `Resolution` | `Resolved(SymbolId)` or `Unresolved` (error) |

### Resolution Algorithm

```
resolve(name, current_scope):
  1. look in current_scope.table[name] → if found, return SymbolId
  2. else walk parent scopes outward (lexical chain)
  3. if reached global and not found → check imports
  4. if still not found → emit E0001 "undefined variable `name`"
  5. if found but in wrong kind (call variable as function) → emit E0002
```

Shadowing is **allowed within nested blocks** but the HIR records `shadowed_from` so diagnostics can note `previous declaration at line X`.

```adesh
let x = 10;
{
    let x = 20;  // shadows outer x — legal, HIR tracks shadow chain
    print(x);    // 20 — resolves to inner scope
}
print(x);        // 10 — resolves to outer scope
```

### Closure Capture Analysis

**Source:** `src/parsing/closure_capture.rs`

Closures capture variables from enclosing scopes by reference. HIR annotates each closure with its capture set:

```adesh
fn makeCounter(start: i32) {
    let n = start;
    return fn() { n += 1; return n; }; // captures `n`
}
```

HIR marks `n` as `Captured(Mutable)` — later MIR decides whether this needs an `Arc<Mutex>` or stack slot.

---

## Stage 4 — The Semantic / Type Checker

**Source:** [`src/semantics/engine.rs`](file:///d:/Projects/AdeshLang/src/semantics/engine.rs), `src/semantics/mod.rs`, `src/types`, `src/typesystem`

The semantic engine performs **type inference, type checking, and legality validation** over the HIR.

### What It Checks

| Check | What It Catches | Example Error |
|---|---|---|
| **Name resolution** | undefined variable, function, or type | `use of undeclared variable 'foo'` |
| **Type compatibility** | assignment / argument / return mismatch | `expected i32, found string` |
| **Function signatures** | arg count / type mismatch, missing return | `fn foo(a: i32) called with 0 args` |
| **Field / property access** | non-existent field, wrong receiver | `type 'User' has no field 'email2'` |
| **Control flow** | `break`/`continue` outside loop, `return` outside fn | `break outside loop` |
| **Class / struct rules** | bad `extends`, missing `super()`, visibility | `super() must be first in derived constructor` |
| **Pattern matching** | non-exhaustive match, wrong arm types | `match arm type mismatch` |
| **Mutability** | assign to immutable, move of borrowed | `cannot assign to immutable 'x'` |
| **Decorator legality** | unknown / misplaced decorators | `unknown decorator @pure2` |
| **Generic bounds** | unsatisfied trait bounds | `type 'T' does not satisfy bound 'Comparable'` |
| **Variance** | invalid variance in generic positions | `invariant type parameter used covariantly` |

### Type Inference

AdeshLang infers types without annotations where possible:

```adesh
let count = 42;          // inferred: i32 (numeric default)
let name = "Adesh";      // inferred: String
let items = [1, 2, 3];   // inferred: Array<i32>
let flag = true;         // inferred: bool

fn add(a, b) { return a + b; } // params inferred from call sites if possible

// Annotations refine inference
let precise: u64 = 18446744073709551615;
let ratio: f64 = 10 / 3;
let typed: Array<i32> = [1, 2, 3];
```

Inference produces a `TypeVar` that is later unified. Widening rules (e.g., `i32` + `f64` → `f64`) are applied at operator sites.

### Type System Reference

| Type | Syntax | Notes |
|---|---|---|
| Primitives | `i32`, `i64`, `u64`, `f32`, `f64`, `bool`, `string`, `char` | value types |
| BigInt | `bigint` (`42n`) | arbitrary precision |
| Complex | `complex` | via `cmath` |
| Arrays | `Array<T>` / `[T]` | growable |
| Tuples | `[T, U]` | fixed arity |
| Objects | `{ key: Type }` | structural |
| Functions | `fn(T) -> U` | first-class |
| Generics | `Vec<T>`, `HashMap<K,V>` | with bounds |
| Type alias | `type Pair<A,B> = [A, B]` | alias + generics |
| Union/Option | `T \| null` | nullable |
| Decorators | `@pure`, `@noalloc` | affect checking |

Generic bounds and `type` aliases are resolved between HIR and semantic analysis. See [Type System](/docs/language-guide/type-system) and [Type Aliases](/docs/language-guide/type-aliases).

### Resolution vs Inference — Order of Operations

```
HIR ──► 1. Scope resolution (bind names → SymbolId)
     ──► 2. Type variable creation (fresh TypeVar per unannotated binding)
     ──► 3. Constraint collection (unify call args, assignments, returns)
     ──► 4. Constraint solving (fix TypeVars, emit mismatches)
     ──► 5. Control-flow / decorator / class-rule validation
     ──► 6. Emit diagnostics (grouped, sorted by span)
```

---

## Diagnostics & Error Table

| Code | Category | Example Message | Source Span |
|---|---|---|---|
| E0001 | Name | `undefined variable 'x'` | identifier span |
| E0002 | Type | `mismatched types: expected 'i32', found 'string'` | expression span |
| E0003 | Signature | `expected 2 arguments, found 3` | call span |
| E0004 | Control | `break outside loop` | keyword span |
| E0005 | Class | `class 'Foo' does not extend anything, super() is illegal` | super() span |
| E0006 | Pattern | `non-exhaustive match: missing variant 'None'` | match span |
| E0007 | Mutability | `cannot assign to immutable binding 'x'` | assignment span |
| E0008 | Decorator | `decorator '@pure' not allowed on class` | decorator span |
| E0009 | Generic | `type argument count mismatch: expected 2, found 1` | type annotation span |
| E0010 | Borrow* | `use of moved value 'v'` | use span (MIR, but surfaced here) |

`*` Borrow errors are technically MIR-stage but surfaced through the same diagnostic pipeline (`src/parsing/error.rs`).

Error rendering:

```text
  --> src/main.adesh:3:8
   |
 3 | let x: i32 = "hello";
   |        ---   ^^^^^^^ expected `i32`, found `string`
   |        |
   |        type annotated here
```

---

## Semantics Rules (Language-Facing)

The rules checked here are documented in [Semantics Rules](/docs/language-guide/semantics-rules):

- **Mutability**: `let` vs `let mut`, field mutability, borrow exclusivity.
- **Shadowing**: allowed in nested blocks, not in same scope.
- **Evaluation order**: left-to-right for arguments, short-circuit for `&&`/`||`/`??`.
- **Hoisting**: functions hoisted within module scope; variables not hoisted (temporal dead zone).
- **Decorator effects**: `@pure` forbids I/O and mutation of captured state.

---

## Worked Lowering Example

Source:

```adesh
fn sum(arr: Array<i32>) -> i32 {
    let total = 0;
    for x in arr { total += x; }
    return total;
}
```

HIR (pseudo):

```
HirFn sum(arr: Array<i32>) -> i32
  HirBlock scope#1
    HirLet total: i32 = 0  (scope#1)
    HirWhile desugared from for:
      HirLet x = iterator.next()
      HirAssign total = total + x
    HirReturn total
  Symbols: arr→Param#0, total→Var#1, x→Var#2
  Types: total:i32, x:i32, arr:Array<i32>
```

Semantic checks pass: `arr` has `.next()` (iterable), `total + x` unifies to `i32`, `return` matches declared `-> i32`.

---

## Where This Happens in the Source Tree

| Concern | Source |
|---|---|
| HIR definition & lowering | `src/ir/hir` (`mod.rs`, `lower.rs`), `src/parsing/hir_lower.rs`, `src/parsing/hir_passes.rs`, `src/parsing/hir.rs` |
| Semantic engine (type inference/check) | `src/semantics/engine.rs`, `src/semantics/mod.rs` |
| Type system & type checking | `src/types`, `src/typesystem`, `src/typesystem/value_optimized.rs` |
| Scope resolution | `src/parsing/ast.rs` (scoped nodes), `src/ir/hir/mod.rs` |
| Closure captures | `src/parsing/closure_capture.rs` |
| Variance & generics | `src/parsing/variance.rs`, `src/parsing/type_decls.rs` |
| Decorators | `src/parsing/decorator_compile.rs`, `decorator_pipeline.rs`, `decorator_registry.rs` |
| Unused / warning lints | `src/parsing/unused_warnings.rs` |
| Error rendering | `src/parsing/error.rs` |

---

## After Semantics: Safety Analysis

Once types check, the compiler moves to the **ownership & borrow checker** stage — see [Memory Safety Analysis](/docs/compiler/borrow-checker) — then to [Intermediate Representations](/docs/compiler/ir).

## The Full Context

- Previous stage: [Lexer & Parser](/docs/compiler/lexer-parser)
- Next stage: [Intermediate Representations](/docs/compiler/ir)
- Language-facing semantics: [Semantics Rules](/docs/language-guide/semantics-rules)
- Pipeline overview: [Compiler Architecture Overview](/docs/compiler/overview)
