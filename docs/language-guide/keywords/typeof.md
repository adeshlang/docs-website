---
id: typeof
title: typeof
sidebar_label: typeof
description: The `typeof` keyword queries the type of an expression — yielding a type value for aliases, generics, and metaprogramming.
---

# `typeof`

`typeof` queries the **type of an expression**, yielding the **type itself** as a first-class type value rather than a runtime type tag. It is the compile-time / semantic type-query operator, used to derive type aliases, drive generic helpers, and distinguish static type derivation from runtime checks (`instanceof`). In some contexts it can also be evaluated at runtime to produce a type name string.

> **Ground truth:** Lexer `TokenKind::Typeof` (`src/parsing/lexer.rs:1021`, keyword `"typeof"`), hover doc *Type query operator: returns the type of an expression* (`als/src/hover.rs:388`), contrast `instanceof` (`hover.rs:389`). `type` aliases (`type T = ...`) are the primary consumer.

---

## Syntax

```text
typeof_expr  ::= "typeof" expr
expr         ::= primary | member_expr | call_expr
type_alias   ::= "type" ident "=" type_expr ";"
type_expr    ::= typeof_expr
              |  ident ("<" type_expr ("," type_expr)* ">")? ("?")?
              |  "{" fields "}"
              |  "(" type_expr ")"
```

`typeof` is a **unary prefix** keyword, like `await` and `not`, but specific to type queries. It takes one expression operand and produces a type value.

### Canonical forms

```adesh
let x = 10;
type T = typeof x;           // T is the type of x (e.g., i32)

let name = "hi";
type S = typeof name;        // S is string

let xs = [1, 2, 3];
type E = typeof xs[0];       // E is element type (e.g., i32)

fn identity(v) {
    type V = typeof v;       // derive parameter's type for aliases or generics
    let w: V = v;
    return w;
}

// Contrasted with runtime check:
if obj instanceof User { print("is User"); } // runtime instance test
type U = typeof obj;         // compile-time type of obj (static)
```

### Value- vs type-position

```adesh
let t1 = typeof 42;          // value position: may yield type descriptor / string per build
type T = typeof someExpr;    // type position: alias T to the type of someExpr
```

Whether `typeof` in **value position** yields a first-class type tag, a string name (`"i32"`, `"string"`), or is restricted to type positions depends on backend. The portable guarantee is `type T = typeof expr`.

---

## Semantics

### Static vs. runtime

`typeof` sits in a spectrum with `instanceof` and `is`:

| Operator | When it runs | What it yields | Use |
|---|---|---|---|
| `typeof expr` | **Compile-time** (and optionally runtime) | **Type itself** (`i32`, `string`, `User`) | Type aliases, generics, metaprogramming |
| `expr instanceof Type` | **Runtime** | `bool` | Instance / subtype test of an existing value |
| `typeof value` (value pos.) | Runtime (if supported) | Type descriptor / string | Reflection / logging |

`typeof` does **not** evaluate its operand for side effects in type-position — it only inspects the static type. `instanceof` **does** evaluate the value and walks its runtime class chain.

### Type inference and generics

`typeof` interacts with inference. Given:

```adesh
let x = 10;              // inferred i32
type T = typeof x;       // T = i32
let y: T = 20;           // y: i32
```

In generic contexts, `typeof` can propagate constraints without naming the type explicitly:

```adesh
fn clone_of(v) {
    type V = typeof v;
    let w: V = v; // V tracks whatever type v had
    return w;
}
```

Future generic sugar (`where` clauses, `T: Trait`) may use `typeof` in constraints, but currently `typeof` is primarily for **type aliases**.

### Type values are not runtime tags

`typeof x` yields the compiler's internal type (`i32`, `string?`, `[i32]`, `User`), not a vtable pointer. Printing a `typeof` value in value-position may be rendered as a string (`"int"`, `"string"`) but that is a debug representation, not the core semantics:

```adesh
let x = 42;
print(typeof x);       // may print "int" / "i32" as string in some builds — not portable
type T = typeof x;     // portable — T is i32
let y: T = 10;         // y uses derived type
```

Use `instanceof` when you need a runtime branch on the value's actual class.

### Compilation pipeline

1. **Lex** `typeof` → `TokenKind::Typeof`.
2. **Parse** as `Typeof(Box<Expr>)` (unary type query).
3. **Hir** — resolve operand type via symbol table / inference (`SemanticIndex`).
4. **Type alias** — `type T = typeof expr` stores `T` → `resolvedType` in type table.
5. **Codegen** — type-position: erased (no runtime code); value-position: emit type-name string or type descriptor per backend.
6. **Diagnostics** — `typeof` of unresolved / error type yields diagnostic rather than alias.

---

## Examples

### Example 1 — Type aliases, element types, and generic helpers

```adesh
let x = 10;
type X = typeof x;         // X = i32 (or int) per inference
let y: X = 20;             // y: i32
print(y); // 20

let name: string = "Ada";
type S = typeof name;      // S = string
let greeting: S = "hello";
print(greeting); // "hello"

// Element type via indexing expression — useful for container generics
let nums = [1, 2, 3];
type Elem = typeof nums[0]; // Elem = i32
let e: Elem = 99;
print(e); // 99

// Generic helper that derives return type from argument
fn echo(v) -> typeof v {
    type V = typeof v;
    let w: V = v;
    return w;
}
print(echo(42));        // 42, type i32
print(echo("hi"));      // "hi", type string

// Nullable propagation
let maybe: string? = null;
type M = typeof maybe;  // M = string?
let m: M = "ok";
print(m); // "ok"
```

### Example 2 — `typeof` vs `instanceof` vs runtime `typeof` string

```adesh
class Animal {}
class Dog extends Animal {}

let pet: Animal = new Dog();

 // Compile-time: typeof pet is Animal (static type)
type Static = typeof pet; // Static = Animal — alias, erased
let a: Static = new Dog(); // ok — Dog is Animal

 // Runtime: instanceof walks class chain
if pet instanceof Dog { print("is Dog"); }    // true — runtime check
if pet instanceof Animal { print("is Animal"); } // true

// Runtime string via `typeof` in value position (if backend supports)
// In builds where value-position typeof yields a string name:
let tag = typeof pet;        // may be "Animal" / "Dog" / "object" per backend
print(tag);

// Portable runtime dispatch uses instanceof + match, not typeof strings:
match pet {
    _ if pet instanceof Dog => print("dog"),
    _                        => print("animal"),
}

// Type narrowing pattern: use `is` / `instanceof` for branching, `typeof` for aliasing
fn handle(x) {
    if x instanceof Dog {
        // x is Dog in this branch (per guard)
        print("woof");
    }
    type X = typeof x; // X is the static type before narrowing
}
```

### Example 3 — Collections, `raw`, and metaprogramming-scale usage

```adesh
// Infer collection type then derive iterator helpers
let matrix: [[i32]] = [[1, 2], [3, 4]];
type Row = typeof matrix[0];     // Row = [i32]
type Cell = typeof matrix[0][0]; // Cell = i32
let r: Row = [5, 6];
let c: Cell = 7;
print(r[0], c); // 5 7

// Raw storage: typeof reports the element type, not metadata size
let buf: raw u8[256] = raw u8[256];
type B = typeof buf[0]; // B = u8
let b: B = 42u8;
print(b); // 42

// Factory + typeof alias — keep API type in sync with impl
struct Config { host: string, port: i32 }
fn default_config() -> Config { return Config { host: "localhost", port: 8080 }; }
type C = typeof default_config(); // C = Config
let cfg: C = default_config();
print(cfg.host, cfg.port); // "localhost" 8080

// Pair with alloc/region where type is derived
fn make_buf(n: i32) {
    type Elem = u8;
    unsafe {
        let p: *mut Elem = alloc<Elem>(n);
        defer free(p);
        for i in 0..n { p[i] = (i & 0xFF) as Elem; }
        print(p[0]); // 0
    }
}
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let typeof = 1` | `unexpected token 'typeof', expected identifier` | `TokenKind::Typeof` reserved (`lexer.rs:1021`) |
| **Parse** | `typeof;` with no operand | `expected expression after 'typeof'` | Write `typeof expr` |
| **Parse** | `type T = typeof;` | `expected expression after 'typeof'` | Provide `typeof someExpr` |
| **Type** | `type T = typeof unknownVar` (unresolved) | `cannot resolve type of 'unknownVar'` | Ensure operand is in scope and has a type |
| **Position** | `typeof` in invalid type context (e.g., `let x: typeof { }`) | `invalid type expression` | Use `typeof` with a concrete expression, not a bare block |
| **Value pos.** | `print(typeof x)` expecting string in strict type-only build | `typeof is only valid in type position` | Use `instanceof` or runtime reflection API instead |
| **Generic** | `typeof` of generic param before inference | `cannot infer type of generic parameter` | Annotate (`let v: i32 = ...`) or use `where` bound |

**Common pitfall — confusing `typeof` with `instanceof`:**

```adesh
let pet: Animal = new Dog();

type T = typeof pet;           // T = Animal (static type) — not "Dog"
if pet instanceof Dog { ... }  // true — runtime instance test

// `typeof` does not narrow — use `instanceof` / `is` for branching:
if typeof pet == "Dog" { ... } // ❌ never true as written — typeof yields a type, not a string comparison
if pet instanceof Dog { ... }  // ✅ correct
```

**Pitfall — `typeof` does not execute side effects in type position:**

```adesh
type T = typeof compute(); // compute() is analyzed for its return type, not called at alias time
```

---

## See Also

- [type](./type) — type aliases `type T = ...`
- [instanceof](./instanceof) — runtime instance check `expr instanceof Type`
- [as](./as) — type casts `expr as Type`
- [struct](./struct) / [class](./class) / [interface](./interface) — types whose names are yielded by `typeof`
- [raw](./raw) — `raw T[N]` storage vs. `DynArray` — element types seen by `typeof`
- `src/parsing/lexer.rs:1021`, `als/src/hover.rs:388-389`
