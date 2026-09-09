---
id: typecheck
title: typecheck
sidebar_label: typecheck
description: The typecheck keyword — compile-time type assertions and the typecheck phase inside decorators. Validates types at build time and fails compilation on mismatch.
---

# `typecheck`

`typecheck` is the **type-constraint phase** of AdeshLang's metaprogramming system. `typecheck(expr)` / `typecheck(expr) is Type` and the `typecheck { ... }` decorator phase run **at compile time** during type resolution — they verify that an expression has the expected type and **fail the build** if it does not. Unlike `require` (value preconditions) or `compile` (AST rewriting), `typecheck` operates purely on the type table.

> **Ground truth:** Lexer `TokenKind::Typecheck` (`src/parsing/lexer.rs:1018`, keyword `"typecheck"`), AST `DecoratorPhase::Typecheck(Arc<Vec<Stmt>>)` (`src/parsing/ast.rs:705-706`), `DecoratorDef` (`ast.rs:711-718`), `StmtKind::Decorator`, `TypeAliasDecl`/`StructDecl` type annotation strings used by the checker.

---

## Syntax

```text
typecheck_stmt   ::= "typecheck" expr ("is" type)? ";"
typecheck_phase  ::= "typecheck" "{" stmt* "}"         // inside decorator
typecheck_expr   ::= "typecheck" "(" expr ")" "is" type
type_expr        ::= ident ("[" type "]" | "<" type ("," type)* ">")?
                   | type "|" type                     // union
                   | type "&" type                     // intersection
```

`typecheck` is reserved (`TokenKind::Typecheck`). Three forms are recognized:

### 1. Expression assertion — `typecheck x is T;`

```adesh
fn identity<T>(x: T) -> T { return x; }
let v = identity(42);
typecheck v is i32; // compile-time assert: fails build if v is not i32
```

### 2. Functional form — `typecheck(x) is T` / `typecheck(x)`

```adesh
typecheck(value) is Numeric; // used inside generic decorator bodies
```

### 3. Decorator phase — `typecheck { ... }`

```adesh
decorator numeric_only(target) {
    typecheck {
        // runs once per decoration site during type resolution
        if !(target.params[0].type is Numeric) {
            typecheck(target.params[0]) is Numeric; // emits TypeError at build
        }
    }
    runtime { return call.proceed(); }
}
```

Parser expects `typecheck { ... }` with braces for the phase form, and `typecheck <expr> [is <type>] ;` for the statement form. Omitting `is T` asserts truthiness of the type object itself.

---

## Semantics

### Compilation model — where `typecheck` runs

```
Lex(typecheck) ──► Parse(DecoratorPhase::Typecheck) ──► HIR build
                                                        │
                                         compile{} executed (AST mutated)
                                                        │
                                                        ▼
                                                  Type resolution
                                                  ┌──────────────────────┐
                                                  │ typecheck{} phases  │
                                                  │ typecheck x is T;    │
                                                  │ TypeAlias/Struct     │
                                                  │ field types checked  │
                                                  └──────────────────────┘
                                                        │
                                                   pass? ──► Lower ► LIR ► runtime
                                                     │
                                                   fail ──► LangError with span
                                                            + line_text
```

1. **Lex/Parse** — `typecheck` captured as `DecoratorPhase::Typecheck(Arc<Vec<Stmt>>)` (`ast.rs:705`). Standalone `typecheck x is T;` becomes a special `StmtKind` lowered for the type checker.
2. **Type resolution** — after HIR is built and `compile{}` phases have mutated the AST, the checker walks every `typecheck` assertion. `is` maps to `UserFn::type_distance` / `is_subtype` checks (`ast.rs:1337-1371`) for custom types, and to primitive table lookups for `i32/u64/f64/string/bool`.
3. **Failure** — on mismatch, the compiler emits a `LangError { kind: Type, line, col, line_text, hint }` and aborts; no artifact is produced.
4. **Success** — the assertion is erased (no runtime cost). Passing `typecheck` leaves no trace in the emitted program.

### `is` vs. `instanceof` vs. `typeof`

| Expression | When | What it checks |
|---|---|---|
| `typecheck x is T` | **compile time** | Static type of `x` vs. `T`; build fails on mismatch |
| `x instanceof T` (`TokenKind::Instanceof`) | **runtime** | Prototype chain / structural check on live `Value` |
| `typeof x` (`TokenKind::Typeof`) | **runtime** | Returns type-name string |

Use `typecheck` for generic constraints and decorator contracts; use `instanceof`/`typeof` for runtime branching.

### What `typecheck` can see

- Parameter and field type annotations (`Function.params[*].2: Option<String>`, `StructDecl.fields`) (`ast.rs:738-922`).
- `TypeAliasDecl` and `EnumDecl` definitions.
- `target` inside a `typecheck` phase — the decorated declaration's type metadata (param types, return type, type params).

It **cannot** see runtime `Value`s — only their declared types. For value preconditions use `require`.

### Interaction with generics

```adesh
type Numeric = i8 | i16 | i32 | i64 | f32 | f64;

decorator clamp<N: Numeric>(target)
    where N: Numeric { // type param bound
    typecheck {
        require N is Numeric; // redundant with bound, explicit for diagnostics
        typecheck(target.params[0]) is N;
    }
    runtime { return call.proceed(); }
}
```

`typecheck` is the enforcement point for `where`/`:` bounds: violations surface as `TypeError` at decoration sites.

---

## Examples

### Example 1 — Standalone type assertions at module scope

```adesh
// Validate assumptions about inferred types — documents intent and catches drift.
let count = 42;
typecheck count is i64;   // AdeshLang infers i64 for integer literals (ast.rs:444 fallthrough)
typecheck count is i8;    // ← TypeError: expected 'i8', found 'i64'

struct Config { host: string, port: u16 }
let cfg = Config { host: "localhost", port: 8080u16 };
typecheck cfg is Config;
typecheck cfg.port is u16;

// Generic helper: require that T implements a shape
fn first<T>(arr: [T]) -> T { return arr[0]; }
typecheck first([1, 2, 3]) is i64; // inferred i64 from DynamicArray::infer_concrete_type (ast.rs:304)
typecheck first(["a", "b"]) is string;

// Template helper — runtime typeof vs. compile typecheck:
print(typeof cfg.port); // "u16" at runtime
typecheck cfg.port is u16; // same fact, but verified at build time
```

### Example 2 — `typecheck` phase inside a decorator (generic constraint)

```adesh
// Enforces that any function decorated with @numeric must accept only Numeric params
// and return a Numeric result. Uses the typecheck phase so errors appear at build time
// with file:line:col + hint (LangError::with_auto_hints).

decorator numeric(target) {
    typecheck {
        for param in target.params {
            typecheck(param) is Numeric
                or typecheck(param) is i8 | i16 | i32 | i64 | u8 | u16 | u32 | u64 | f32 | f64;
            // Equivalent short-hand via helper:
            // require param.type is Numeric, "param '" + param.name + "' must be Numeric";
        }
        typecheck(target.ret_type) is Numeric;
    }
    runtime {
        return call.proceed();
    }
}

@numeric
fn add(a: i32, b: i64) -> i64 { return a as i64 + b; } // ok — both params numeric

// @numeric
// fn bad(s: string) -> string { return s; } // compile fails:
// // TypeError at bad:1:1 — typecheck failed: expected 'Numeric', found 'string'
// // hint: consider changing param type to i32/f64 or removing @numeric

@numeric
fn scale(v: f64, factor: f64) -> f64 { return v * factor; } // ok

print(scale(2.0, 3.0)); // 6.0
```

### Example 3 — Combining `typecheck`, `require`, and `compile` across phases

```adesh
// A decorator that only applies to single-param functions whose param is an array
// of a numeric element type. Demonstrates phase ordering: compile → typecheck → runtime.

decorator map_numeric(target) {
    compile {
        require target.params.len() == 1, "map_numeric expects exactly one param";
        // Inject a helper constant based on element type — folded at compile time
        let elem = target.params[0].element_type; // e.g., "i32" from [i32]
        emit(`const __elem_${target.name} = "${elem}";`);
    }
    typecheck {
        // elem must be numeric: validate the array's element type, not the array itself
        let elem_ty = target.params[0].element_type;
        typecheck(elem_ty) is Numeric;
        // Also ensure return type is array-like
        typecheck(target.ret_type) is Array;
    }
    runtime {
        let arr = call.args[0];
        // Runtime precondition too — in case type system was bypassed via any
        require(arr is Array, "expected array at runtime");
        let out = [];
        for x in arr { out.push(call.proceed_single(x)); } // hypothetical per-element delegate
        return out;
    }
}

@map_numeric
fn doubled(arr: [i32]) -> [i32] {
    return arr.map(x => x * 2);
}

print(doubled([1, 2, 3])); // [2,4,6]
// If someone writes:
// @map_numeric
// fn bad2(arr: [string]) -> [string] { return arr; }
// typecheck phase error: expected 'Numeric' for element type, found 'string'
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let typecheck = 1` | `unexpected token 'typecheck', expected identifier` | `TokenKind::Typecheck` is reserved (`lexer.rs:1018`) |
| **Parse** | `typecheck;` with no expr | `Expect expression after 'typecheck'` | Write `typecheck x is T;` or `typecheck { ... }` |
| **Parse** | `typecheck {` without `}` | `Unterminated typecheck block` | Close the block with `}` |
| **Semantic** | `typecheck v is u8` where `v: i64` | `TypeError: expected 'u8', found 'i64'` | Change annotation or use `as` cast |
| **Semantic** | `typecheck(target) is T` outside type resolution | `typecheck is only valid at compile time` | Standalone checks must be at module/compile scope; inside decorator use `typecheck{}` |
| **Type** | Unknown type name `typecheck x is Unknown` | `TypeError: unknown type 'Unknown'` | Define `type Unknown = ...` or `struct Unknown` first |
| **Phase** | `call.proceed()` inside `typecheck` | `proceed is only valid inside runtime phase` | Types are not values — move logic to `runtime{}` |
| **Subtyping** | `typecheck child is Parent` where unrelated | `TypeError: 'Child' is not a subtype of 'Parent'` (`UserFn::is_subtype`, `ast.rs:1356`) | Add `extends Parent` or remove assertion |

**Common pitfall — confusing `typecheck` (compile-time) with `instanceof` (runtime):**

```adesh
fn maybe(x: any) { return x; }
typecheck maybe(42) is i64; // compile error if maybe returns any and any ∉ i64
// Runtime alternative (no build failure):
if (maybe(42) instanceof i64) { print("is i64 at runtime"); }
```

Prefer `typecheck` when you want the **build to break** on type drift; prefer `instanceof` for **runtime branching** on live values.

---

## See Also

- [compile](./compile) — `TokenKind::Compile` phase that runs before `typecheck`
- [runtime](./runtime) — `TokenKind::Runtime` and `call.proceed()` (invalid inside `typecheck`)
- [emit](./emit) — `TokenKind::Emit` backend hooks (no type checking)
- [require](./require) — `TokenKind::Require` value preconditions vs. `typecheck` type preconditions
- [decorator](./decorator) — defining multi-phase `typecheck{}` blocks (`src/parsing/ast.rs:705-718`)
- [readonly](./readonly) — `TokenKind::Readonly` field modifier (type-checked immutability)
- `src/parsing/lexer.rs:1018`, `src/parsing/ast.rs:705-738,1337-1371`, `src/parsing/decorator_pipeline.rs`
