---
id: semantic-analysis
title: Semantic Analysis & HIR - Types, Symbol Resolution, Desugaring
sidebar_label: Semantic Analysis & HIR
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Semantic Analysis & HIR — Types, Symbols, and Desugaring

<FeatureStatus status="STABLE" details="Type inference, symbol resolution, HIR lowering, scoping rules" />

The parser gives us a **syntax tree**. The next stage checks whether the
program *means* anything coherent: are names defined? do types line up? is
control flow legal? This is **semantic analysis**, and it runs on an
intermediate representation called **HIR** (High-Level IR).

> Core invariant: *semantic analysis runs on desugared HIR before any LIR
> lowering* — the checker always sees the simplified, canonical form of your
> code.

## Stage 3 — HIR: the desugared program

The HIR pass ([`src/ir/hir`](file:///d:/Projects/AdeshLang/src/ir/hir) and
[`src/parsing/hir_lower.rs`](file:///d:/Projects/AdeshLang/src/parsing/hir_lower.rs))
takes the AST and produces a cleaned, fully-resolved intermediate tree:

- **Desugar control flow** — `elif` chains, ternary expressions, and other
  sugar are normalized into their canonical forms
- **Resolve symbols** — names are bound to their declarations (variables,
  functions, classes, imports)
- **Normalize receivers** — both `this` and `self` are normalized to one
  canonical form
- **Scoping** — variable scopes are explicit, matching the semantics rules in
  the [Language Guide](/docs/language-guide/semantics-rules)

## Stage 4 — The semantic/type checker

The semantic engine
([`src/semantics/engine.rs`](file:///d:/Projects/AdeshLang/src/semantics/engine.rs))
performs **type inference and type checking** over the HIR:

### What it checks

| Check | What it catches |
|---|---|
| **Name resolution** | using an undefined variable, function, or type |
| **Type compatibility** | `let count: i32 = "hello"` → mismatch error |
| **Function signatures** | wrong argument count or argument types |
| **Field/property access** | accessing a field that doesn't exist |
| **Control flow** | `break` outside a loop, `return` outside a function |
| **Class/struct rules** | `extends` targets, `super(...)` calls, visibility |
| **Pattern matching** | match arms against the enum/structure being matched |

### Type inference

AdeshLang infers types in many places without explicit annotations:

```adesh
let count = 42;          // inferred: i32-ish numeric type
let name = "Adesh";      // inferred: String
let items = [1, 2, 3];   // inferred: array of numbers
```

Annotations refine the inference:

```adesh
let precise: u64 = 18446744073709551615;   // explicit 64-bit unsigned
let ratio: f64 = 10 / 3;                    // explicit double
```

### Semantics rules

The rules checked here are the ones documented in the
[Semantics Rules reference](/docs/language-guide/semantics-rules): mutability,
shadowing, scoping, and the exact evaluation order of expressions.

## The Type System & TypeScript-style `Type` aliases

Type aliases (`type Pair<A, B> = {...}`), generic bounds, and the full type
system are handled between HIR and semantic analysis. See
[Type System](/docs/language-guide/type-system) and
[Type Aliases](/docs/language-guide/type-aliases) for the language-facing view.

## Where this happens in the source tree

| Concern | Source |
|---|---|
| HIR definition & lowering | `src/ir/hir`, `src/parsing/hir_lower.rs`, `src/parsing/hir_passes.rs` |
| Semantic engine (type inference/check) | `src/semantics/engine.rs` |
| Type system & type checking | `src/types`, `src/typesystem` |
| Scope resolution | `src/parsing/ast.rs` (scoped nodes) |

## After semantics: safety analysis

Once types check, the compiler moves to the **ownership & borrow checker**
stage — see [Memory Safety Analysis](/docs/compiler/borrow-checker).

## The full context

- Previous stage: [Lexer & Parser](/docs/compiler/lexer-parser)
- Next stage: [Intermediate Representations](/docs/compiler/ir)
- Language-facing semantics: [Semantics Rules](/docs/language-guide/semantics-rules)
