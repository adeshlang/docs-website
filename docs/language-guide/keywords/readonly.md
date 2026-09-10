---
id: readonly
title: readonly
sidebar_label: readonly
description: The readonly keyword — immutable field and binding modifier. Marks fields that may be read but not reassigned after construction, enforced at type-check time.
---

# `readonly`

`readonly` marks a binding or field as **immutable after initialization** — it may be read freely but any reassignment after construction is a type error. Unlike `const` (compile-time inlined constants), `readonly` fields are set **at runtime during construction** and then frozen. It applies to `let` bindings and to `struct`/`class` fields, and is enforced by the type checker via `StmtKind::Let(..., readonly)` and class/struct field flags.

> **Ground truth:** Lexer `TokenKind::Readonly` (`src/parsing/lexer.rs:1005`, keyword `"readonly"`), AST `StmtKind::Let(_,_,_,_,_, readonly: bool)` (`src/parsing/ast.rs:590-597`), `StmtKind::LetTuple(..., readonly)` (`ast.rs:600-607`), `StmtKind::LetObject(..., readonly)` (`ast.rs:610-618`), `ClassDecl.fields: Vec<(String,String,Visibility,Vec<Expr>,Option<Expr>)>` with decorator/field metadata, `TokenKind::Const` vs. `Readonly`.

---

## Syntax

```text
let_stmt        ::= ("readonly")? ("let" | "const") ident (":" type)? ("=" expr)? ";"
                  | "readonly" ident (":" type)? ("=" expr)? ";"   // shorthand in some branches
field_decl      ::= "readonly"? ident ":" type ("," | "}")
class_field     ::= ("readonly" | "pub" | "priv")* ident ":" type ("=" expr)? ";"
struct_field    ::= "readonly" ident ":" type ("," )*
declaration     ::= class_decl | struct_decl | let_stmt
class_decl      ::= "class" ident "{" class_field* method* "}"
struct_decl     ::= "struct" ident "{" struct_field* "}"
```

`readonly` is reserved (`TokenKind::Readonly`). It may appear **before** `let` (`readonly let x = 1` and `let readonly x` are both accepted in some parser revisions; canonical is `readonly let` / `readonly` field), and as a **field prefix** inside `struct`/`class`.

### Variable binding

```adesh
readonly let host: string = "0.0.0.0";
let readonly port: u16 = 8080; // alternate position — parser normalizes to StmtKind::Let(readonly=true)
readonly x = 42;              // without let, treated as readonly binding in some contexts
```

### Field declaration

```adesh
struct Config {
    readonly host: string,
    readonly port: u16,
    mutable_counter: i32, // not readonly — freely assignable
}

class Account {
    readonly id: string,
    balance: f64,
}
```

Parser maps `readonly` to the final `bool` in `StmtKind::Let(..., readonly)` and to field-level flags on `ClassDecl`/`StructDecl` field tuples.

---

## Semantics

### Compilation model — when `readonly` is checked

```
Source ──► Lex(Readonly) ──► Parse(StmtKind::Let(readonly=true) / field flag)
                               │
                               ▼
                          Type checker
                          ┌──────────────────────────────┐
                          │ • readonly let: assignment  │
                          │   after init is TypeError    │
                          │ • readonly field: this.field │
                          │   write after construction   │
                          │   is TypeError               │
                          │ • readonly does NOT imply    │
                          │   deep immutability          │
                          └──────────────────────────────┘
                               │
                               ▼
                           HIR/LIR ──► Runtime (reads succeed, writes would have been rejected)
```

1. **Lex/Parse** — `readonly` → `TokenKind::Readonly` (`lexer.rs:1005`); parser sets `readonly: true` on the `Let`/`Field` node (`src/parsing/parser/declarations.rs:228`).
2. **Type checking** — any `Assign`/`AssignOp`/`Set` targeting a `readonly` binding or field outside its declaring constructor/initializer produces `TypeError: cannot assign to readonly field/binding '<name>'` with span and `line_text`.
3. **Lowering** — no special codegen; `readonly` is erased after verification. Reads lower identically to mutable fields.
4. **Runtime** — reads succeed; a write would have been rejected statically — there is no runtime `LangError` for `readonly` (unlike `require` inside `runtime`).

### `readonly` vs. `const` vs. `let`

| Form | TokenKind(s) | When value fixed | Reassignable? | Storage | Example |
|---|---|---|---|---|---|
| `const X = 42` | `Const` | **compile time** (folded/inlined) | No | no slot | `const MAX = 100;` |
| `readonly let x = 1` | `Readonly` + `Let` | **construction/init** | **No** after init | slot, frozen | `readonly let port = 8080;` |
| `let x = 1` | `Let` | runtime init | Yes | slot, mutable | `let count = 0; count = 1;` |
| `readonly field: T` | `Readonly` (field) | **instance construction** | No (instance) | per-instance | `struct C { readonly id: string }` |

`const` values may not depend on runtime state; `readonly` values **may** (e.g., `readonly let id = uuid();` is valid, `const id = uuid();` is not).

### Field assignment rules

- **Inside the same declaration or constructor** — assignment **is allowed** once:
  ```adesh
  class Account {
      readonly id: string,
      constructor(id: string) { this.id = id; } // ok — construction
  }
  ```
- **Outside construction** — assignment **is forbidden**:
  ```adesh
  let a = Account { id: "abc", balance: 10.0 };
  a.id = "xyz"; // TypeError: cannot assign to readonly field 'id'
  a.balance = 20.0; // ok — balance is mutable
  ```
- **Shadowing vs. mutation** — `let readonly x = 1; let x = 2;` is a *new* binding that shadows; it is not a reassignment error, but linters may warn.

### Deep vs. shallow immutability

`readonly` is **shallow**: it freezes the binding/field slot itself, not the object behind it:

```adesh
readonly let arr = [1, 2, 3];
arr = [4, 5, 6]; // TypeError — cannot reassign readonly binding
arr.push(4);     // ok — the DynArray behind the readonly slot is still mutable
// For deep immutability, use frozen collections or wrapper types.
```

Similarly:

```adesh
struct Box { readonly items: [i32] }
let b = Box { items: [1, 2] };
b.items = [3, 4]; // TypeError
b.items.push(3);  // ok — readonly protects the field, not the array's elements
```

### Decorator interaction

`readonly` fields can be set via `compile`-phase `emit` that injects initialization (since injection happens during construction):

```adesh
decorator auto_id(target) {
    compile { emit(`target.__id_seq = 0;`); }
    runtime {
        if (call.is_constructor) { call.this.id = auto_uuid(); } // allowed in constructor
        return call.proceed();
    }
}
```

### Tuple/object destructuring

`readonly` propagates to destructuring forms (`StmtKind::LetTuple` / `LetObject`, `ast.rs:600-618`):

```adesh
readonly let (a, b) = (1, 2); // both a and b are readonly
readonly let { x, y } = point; // x and y readonly
```

---

## Examples

### Example 1 — Immutable configuration after initialization

```adesh
// readonly lets values be determined at runtime (unlike const) but still guarded.

struct Config {
    readonly host: string,
    readonly port: u16,
    readonly tls: bool,
    retries: u8, // mutable — operational tuning may change at runtime
}

fn load_config(): Config {
    let host = env("HOST") ?? "0.0.0.0";
    let port_str = env("PORT") ?? "8080";
    let port = port_str as u16;
    return Config { host: host, port: port, tls: true, retries: 3u8 };
}

let cfg = load_config();
print(cfg.host); // "0.0.0.0" — read ok
print(cfg.port); // 8080
cfg.retries = 5u8; // ok — mutable field
// cfg.host = "1.2.3.4"; // TypeError: cannot assign to readonly field 'host'
// cfg.port = 9090u16;   // TypeError: cannot assign to readonly field 'port'
readonly let frozen_host = cfg.host;
// frozen_host = "evil"; // TypeError: cannot assign to readonly binding 'frozen_host'
```

`readonly` protects `host/port/tls` for the lifetime of the `Config` value; `retries` remains tunable.

### Example 2 — `readonly` bindings vs. `const` and reassignment diagnostics

```adesh
// Demonstrates the three declaration kinds side-by-side.

const MAX_RETRIES: u8 = 5u8;              // compile-time constant — zero-cost
readonly let instance_id: string = uuid(); // runtime-fixed — frozen after next line
let request_count: i32 = 0;               // fully mutable

print(MAX_RETRIES);   // 5 — inlined
print(instance_id);   // e.g., "550e8400-..." — read ok
// instance_id = uuid(); // TypeError: cannot assign to readonly binding 'instance_id'
request_count += 1;    // ok — 1
request_count = 42;    // ok — 42

// readonly fields inside a class — frozen after constructor:
class Session {
    readonly token: string,
    readonly created_at: i64,
    hits: i64,
    constructor(token: string) {
        this.token = token;         // ok — construction
        this.created_at = now_ms(); // ok — construction
        this.hits = 0;
    }
    bump() { this.hits += 1; } // ok — hits is mutable
    // rotate(new_tok: string) { this.token = new_tok; } // TypeError — token is readonly
}

let s = Session("abc");
print(s.token); // abc
s.bump();       // hits = 1
// s.token = "xyz"; // TypeError outside constructor

// Destructuring with readonly (ast.rs:600-618):
readonly let (a, b): (i32, i32) = (10, 20);
// a = 99; // TypeError — a is readonly via tuple destructure
print(a + b); // 30
```

### Example 3 — Shallow immutability and safe patterns

```adesh
// readonly is shallow — the container behind it may still mutate.
// Show the pitfall and the defensive-copy/freeze pattern.

struct Envelope {
    readonly tags: [string], // field is readonly — slot frozen
    readonly meta: { string: string },
}

let e = Envelope { tags: ["inbox"], meta: { "priority": "high" } };
print(e.tags[0]); // inbox
// e.tags = ["sent"]; // TypeError — cannot reassign readonly field
e.tags.push("archived"); // ok (!) — readonly protects the field, not the array contents
print(e.tags); // [inbox,archived] — shallow

// Deep-freeze pattern — wrap in a helper that produces a frozen snapshot:
fn freeze_envelope(src: Envelope): Envelope {
    // Defensive copy: callers mutate the copy, not the original's arrays
    return Envelope { tags: src.tags.clone(), meta: src.meta.clone() };
}

let snapshot = freeze_envelope(e);
snapshot.tags.push("temp"); // mutates snapshot's copy only
print(e.tags);        // [inbox,archived] — original unaffected if clones are deep
print(snapshot.tags); // [inbox,archived,temp]

// When deep immutability is required, prefer frozen/value types or region-scoped copies
// over relying on readonly alone. readonly prevents slot reassignment; it does not imply
// the pointee is immutable.

// Contrast with const: const cannot be runtime-derived
// const TAGS: [string] = fetch_tags(); // error: const must be compile-time evaluable
readonly let tags: [string] = fetch_tags(); // ok — frozen after this init
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `readonly` misused as value | `unexpected token 'readonly'` in expr position | `readonly` is a modifier, not a standalone expression — use `let`/`field:` with prefix |
| **Parse** | `let readonly readonly x = 1` duplicate | `duplicate 'readonly' modifier` | Write `readonly let x = 1` once |
| **Semantic** | `x = 2` where `let readonly x = 1` | `TypeError: cannot assign to readonly binding 'x'` | Use a new binding `let y = 2` or remove `readonly` |
| **Semantic** | `this.field = v` where `field: readonly` outside constructor | `TypeError: cannot assign to readonly field 'field'` | Set readonly fields only at construction / inside constructor |
| **Semantic** | `readonly` on `const` | `TypeError: 'const' is already immutable; 'readonly' is redundant` (linter) | Write `const` alone |
| **Semantic** | `readonly` field without initializer and no constructor assignment | `TypeError: readonly field 'f' must be initialized` | Add `= expr` or assign in constructor |
| **Type** | Deep-mutation expectation `readonly let arr = [1]; arr.push(2)` surprising | No error (intentional shallow) | Clone/freeze the container if deep immutability is needed |
| **Decorator** | `compile { emit }` injecting readonly field after construction | No error — injection is part of construction | Ensure emission site is before `typecheck` so the field is known |

**Common pitfall — expecting `readonly` to mean deep freeze:**

```adesh
readonly let obj = { count: 0 };
obj.count = 1; // ok — readonly froze `obj`, not `obj.count`
// Fix: make the pointee itself value-typed, or expose only getters:
struct Counter { readonly count: i32 } // still shallow, but struct semantics help
```

Prefer `readonly` on **value fields** (`string`, `u16`, `f64`, other structs) for strongest guarantees; for collections, pair `readonly` with defensive copies or frozen container types.

---

## See Also

- [const](../variables/const) — `TokenKind::Const` compile-time constants vs. `readonly` runtime-fixed
- [let](../variables/let) — `StmtKind::Let(..., readonly)` binding declaration
- [struct](../types/struct) / [class](../types/class) — `readonly` field declarations inside aggregates
- [decorator](./decorator) — `compile { emit }` can inject `readonly` fields
- [require](./require) — `TokenKind::Require` field invariants complement `readonly` slot protection
- [Memory & Safety](../../advanced/memory-safety) — shallow vs. deep immutability and SSAO
- `src/parsing/lexer.rs:1005`, `src/parsing/ast.rs:590-618`, `src/parsing/parser/declarations.rs:228`
