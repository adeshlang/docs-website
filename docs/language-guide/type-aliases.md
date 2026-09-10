---
id: type-aliases
title: "Type Aliases & Higher-Kinded Function Signatures"
description: "Formal specification of type alias expansion, generic type aliases, record literals, optional fields, defaults, and closure function pointer memory representations in AdeshLang."
sidebar_label: "Type Aliases & Signatures"
---

# Type Aliases & Higher-Kinded Function Signatures

This document defines the formal rules for compile-time type alias expansion, record literal syntax `type Foo = { ... }`, generic and optional-field type aliases, default values, and the memory representation of higher-kinded function pointers in AdeshLang.

---

## 1. Type Alias Expansion Mechanics

A type alias introduces a new identifier for an existing type expression using the `type` keyword. AdeshLang supports three forms:

```adesh
type Kilobytes = u64;                          // (1) alias to existing type
type Matrix = [[f64]];                         // (1) alias to existing type
type User = { name: string, age: u64 };       // (2) record literal (new structural type)
type MaybeString = string | null;              // (3) union alias (if enabled)
```

Lowered in `src/parsing/ast.rs` as:

```rust
struct TypeAliasDecl {
    name: String,
    type_params: Vec<String>,        // generic params
    fields: Vec<(String, bool, String)>, // (field_name, is_optional, type_name)
    defaults: Vec<(String, Expr)>,   // default value expressions
}
```

And surfaced in HIR via `src/parsing/hir.rs`.

### 1.1 Zero-Cost Compile-Time Expansion

Type aliases are purely compile-time concepts. They do not introduce new runtime types, vtables, or memory overhead. During semantic analysis (`src/semantics/hir_lower.rs`, `src/typesystem`), the compiler replaces every alias identifier with its fully expanded target type:

```
[ Code Source ]               [ Semantic Analysis ]             [ Lowered Type ]
  let size: Kilobytes = 512;  -->  Expand Kilobytes -> u64  -->  let size: u64 = 512;
  let m: Matrix = [[1.0]];    -->  Expand Matrix -> [[f64]] -->  let m: [[f64]] = [[1.0]];
```

Type equivalence between an alias and its underlying target type is **symmetric, reflexive, and transitive**: `Kilobytes` and `u64` are completely interchangeable in function signatures, casts, generics, and return types.

```adesh
type UserId = u64;
fn get_user(id: UserId): string { return f"user:{id}"; }
let raw: u64 = 42;
print(get_user(raw));          // OK: u64 <: UserId
let aliased: UserId = raw;     // OK: same representation
let back: u64 = aliased;       // OK: symmetric
```

### 1.2 Alias to Existing Type

The simplest form re-exports an existing type under a domain-specific name:

```adesh
type FileDescriptor = i32;
type JsonString = string;
type Callback = fn(event: string): bool;
type IntList = [i64];
```

```ebnf
TypeAliasDecl ::= "type" IDENT [ TypeParams ] "=" TypeExpr [ ";" ]
TypeExpr      ::= IDENT [ GenericArgs ] | "[" TypeExpr "]" | "(" TypeList ")" | "{" RecordFields "}"
```

Use cases: domain modeling, shortening deeply nested generics, API clarity.

---

## 2. Record-Literal Type Alias `type Foo = { ... }`

AdeshLang's idiomatic way to define structural records is `type` with an inline object literal:

```adesh
type User = {
    name: string,
    age: u64,
    email: string,
}
let u: User = { name: "Ada", age: 30, email: "ada@example.com" };
print(u.name);
```

This is **not** `struct` or `class` — it is a structural type alias whose expanded type is an anonymous object shape. It is lowered to `TypeAliasDecl.fields`.

### 2.1 Syntax Variants

```adesh
// Minimal
type Point = { x: f64, y: f64 }

// With optional fields (?)
type Config = {
    host: string,
    port: u64?,
    timeout: f64?,
}

// With defaults (field = expr)
type Options = {
    retries: u64 = 3,
    verbose: bool = false,
    label: string = "default",
}

// Combined: optional + default
type Request = {
    url: string,
    method: string = "GET",
    headers: [string]?,
    body: string?,
}
```

| Syntax | Fields Entry | Semantics |
|---|---|---|
| `name: string` | `("name", false, "string")` | Required field |
| `port: u64?` | `("port", true, "u64")` | Optional: may be absent |
| `retries: u64 = 3` | `("retries", false, "u64")` + default `3` | Required but defaulted if omitted |
| `timeout: f64? = 30.0` | `("timeout", true, "f64")` + default `30.0` | Optional with fallback |

Optional fields use the `bool` flag in `TypeAliasDecl.fields` (second tuple element). Defaults are stored in `TypeAliasDecl.defaults`.

### 2.2 Record Literal Construction

```adesh
type User = { name: string, age: u64, email: string? }

let u1: User = { name: "Ada", age: 30 };                          // email omitted (optional)
let u2: User = { name: "Bob", age: 25, email: "bob@example.com" }; // email present

// With defaults
type Counter = { value: i64 = 0, step: i64 = 1 }
let c1: Counter = {};                    // { value: 0, step: 1 }
let c2: Counter = { value: 10 };         // { value: 10, step: 1 }
let c3: Counter = { value: 10, step: 5 };// { value: 10, step: 5 }
```

Construction is checked in `src/semantics/engine.rs`: missing required fields emit `E0201`, unknown fields emit `E0202`, type mismatches emit `E0203`.

### 2.3 Structural Typing & Width Subtyping

Record aliases are **structurally typed**: two aliases with identical fields are compatible. Extra fields are allowed when passing to a narrower expected type (width subtyping) if the alias is used as `type` (not `class`):

```adesh
type Point2D = { x: f64, y: f64 }
type Point3D = { x: f64, y: f64, z: f64 }

fn len2(p: Point2D): f64 { return p.x + p.y; }
let p3: Point3D = { x: 1.0, y: 2.0, z: 3.0 };
// len2(p3); // May be allowed via structural coercion depending on strictness flag
```

---

## 3. Generic Type Aliases

Type aliases can accept generic type parameters, declared in `TypeAliasDecl.type_params`:

```adesh
type ResultMap<K, V> = HashMap<K, Result<V, string>>;
type Point2D<T> = (T, T);
type Pair<A, B> = { first: A, second: B }
type Maybe<T> = T?;
type Callback<T> = fn(value: T): bool;
```

### 3.1 Monomorphization of Generic Aliases

When a generic type alias is instantiated, the type checker substitutes concrete type parameters into the underlying type template during type resolution (same engine as `generics.md`):

```adesh
let coordinates: Point2D<f64> = (10.5, 20.25);
// Expanded internally to: (f64, f64)

let p: Pair<string, i64> = { first: "hello", second: 42 };
// Expanded to: { first: string, second: i64 }
```

Nested substitution:

```adesh
type Wrapper<T> = { value: T, tags: [string]? }
type WrappedPair<A, B> = Wrapper<Pair<A, B>>
let w: WrappedPair<i64, string> = { value: { first: 1, second: "hi" } };
```

### 3.2 Generic Record Aliases with Optional & Defaults

Generics interact with optional/default fields:

```adesh
type Paginated<T> = {
    items: [T],
    page: u64 = 1,
    per_page: u64 = 20,
    next_token: string?,
}
let page1: Paginated<string> = { items: ["a", "b"] };
let page2: Paginated<i64> = { items: [1,2,3], page: 2, per_page: 50 };
```

Expanded types carry the concrete `T` through all fields. Defaults are type-checked against the substituted type.

### 3.3 Variance of Generic Aliases

Generic alias variance follows the same rules as generic structs (`src/parsing/variance.rs`):

```
type ReadOnly<T> = { value: T }        // Covariant in T (read-only)
type Handler<T> = fn(T): bool         // Contravariant in T
type Pair<A,B> = { first: A, second: B} // Invariant if mutable
```

---

## 4. Optional Fields `?` & Default Values — Detailed Semantics

### 4.1 Optional Field `?`

`field: Type?` marks the field as **optionally present**. At the value level, absence is represented as `null` or field omission; presence carries the inner type.

```adesh
type Profile = {
    bio: string?,
    avatar_url: string?,
    age: u64,
}
let p1: Profile = { age: 30 };                              // OK: optionals omitted
let p2: Profile = { age: 30, bio: "Engineer" };             // OK: partial
let p3: Profile = { bio: null, age: 30, avatar_url: null }; // explicit null
if (p2.bio != null) { print(p2.bio); }

// Access requires null check; direct use without check warns W0200
// print(p1.bio.len()); // W0200: possible null dereference
```

Memory: optional fields are stored as nullable slots; `null` is a sentinel. No extra discriminant byte per field — absence is `Value::Null` in `src/parsing/ast.rs`.

### 4.2 Default Values `= expr`

`field: Type = expr` provides a **compile-time default expression** evaluated at construction time if the field is omitted:

```adesh
type ServerConfig = {
    host: string = "localhost",
    port: u64 = 8080,
    tls: bool = false,
}
let s1: ServerConfig = {};                              // { host:"localhost", port:8080, tls:false }
let s2: ServerConfig = { host: "example.com" };        // { host:"example.com", port:8080, tls:false }
let s3: ServerConfig = { host: "example.com", port: 443, tls: true };
```

Defaults may reference earlier fields or constants, but not later fields (forward reference is `E0204`):

```adesh
type Box = {
    width: f64 = 10.0,
    height: f64 = 10.0,
    area: f64 = width * height, // OK if supported: references prior fields; else use const
}
```

Defaults are stored as `Expr` in `TypeAliasDecl.defaults` and injected by the HIR lowering pass if the construction site omits the field.

### 4.3 Combined `?` with Default

```adesh
type FetchOptions = {
    timeout: f64? = 30.0,   // optional + default: omitted -> 30.0
    retries: u64? = 3,      // omitted -> 3, explicit null -> null
    label: string?,         // optional, no default -> null if omitted
}
```

Evaluation order:

```
Construction { timeout: X }
  1. If X provided (including explicit null) => use X
  2. Else if default exists => evaluate default expr
  3. Else if optional (?) => set to null
  4. Else => E0201 (missing required field)
```

---

## 5. Function Type Signatures & Memory Representation

Type aliases are frequently used to define clean function pointer and callback signatures:

```adesh
type EventHandler = fn(event_type: string, payload: [u8]): bool;
type Predicate<T> = fn(item: &T): bool;
type Mapper<A, B> = fn(value: A): B;
```

### 5.1 Function Pointer Memory Layout (16-Byte Fat Pointer)

Function types in AdeshLang (`fn(A): B`) are stored in memory as **16-byte fat pointers** consisting of a code address pointer and an environment context pointer:

```
Function Pointer / Closure Layout (16 bytes)
+------------------------------------+------------------------------------+
|  Code Address Pointer (8 Bytes)    |  Environment Context Pointer (8B)  |
+------------------------------------+------------------------------------+
  Points to native instructions        Points to captured heap values
  or VM function block stub.           (or 0x00 for top-level functions).
  Offset 0x00                         Offset 0x08
```

- **Top-level functions**: The environment pointer is null (`0x0000000000000000`). Call is a direct indirect branch to code address.
- **Closures**: The environment pointer references an allocated heap capture context struct holding captured variable references. Captures are analyzed in `src/parsing/closure_capture.rs` and optimized via `src/parsing/escape_analysis.rs`.
- **Bound methods**: Stored as `Value::BoundMethod` / `Value::BoundNative` (see `src/parsing/ast.rs:Value`).

Calling convention:

```
call fn_ptr:
  load code_addr = fn_ptr[0]
  load env_ptr   = fn_ptr[8]
  push env_ptr as implicit first arg (if non-null)
  jump code_addr
```

### 5.2 Higher-Kinded Aliases (Type Constructors as Parameters)

While AdeshLang does not support full higher-kinded types (HKT) in the Haskell sense, generic aliases that wrap type constructors are idiomatic:

```adesh
type Handler<T> = fn(T): Result<T, string>;
type Store<T> = { get: fn(key: string): T?, set: fn(key: string, value: T): bool };

fn use_store<T>(s: Store<T>, key: string, val: T) {
    s.set(key, val);
    let v = s.get(key);
    if (v != null) { print(f"got {v}"); }
}
```

These are still first-order generics — the alias expands before monomorphization, so `Store<string>` becomes a concrete record of function pointers with substituted `T`.

---

## 6. Compilation Pipeline

```
Source: type Foo<T> = { x: T, y: T? = 0 }
   |
   v
Lexer (src/parsing/lexer.rs) -- tokenizes 'type', IDENT, '=', '{', ':', '?', '=', expr
   |
   v
Parser (src/parsing/parser/*) -- builds StmtKind::TypeAlias(TypeAliasDecl { name, type_params, fields, defaults })
   |
   v
HIR Lower (src/parsing/hir_lower.rs, src/semantics/hir_lower.rs)
   -- resolves field type strings to HirType, validates defaults expr types
   -- injects defaults at construction sites missing fields
   |
   v
Type Check (src/semantics/engine.rs, src/typesystem)
   -- verifies field assignments, optional nullability, generic substitution
   |
   v
Ownership/Borrow (src/parsing/ownership.rs) -- record fields are tracked per-field for moves
   |
   v
Codegen -- records lowered to object layouts (HashMap<String, Value> in interpreter,
          contiguous struct in native backends with field offset tables)
```

Field offset tables for native backends are analogous to struct field layouts but derived from the alias's expanded shape.

---

## 7. Comparison Table

| Define as | Structural / Nominal | Instantiation | Use For |
|---|---|---|---|
| `type Foo = { ... }` | Structural | `let x: Foo = { ... }` | Lightweight data carriers, DTOs, config |
| `struct Foo { ... }` | Nominal | `Foo { ... }` or `new Foo()` | Method impls, ownership semantics, `extend on` |
| `class Foo { ... }` | Nominal + inheritance | `new Foo()` | OOP, `extends`/`implements`, constructors |
| `type Bar = Existing` | Alias | `let x: Bar = ...` | Domain naming, shortening generics |
| `type Box<T> = { v: T }` | Structural generic | `Box<i64>` | Generic containers without class overhead |

---

## 8. Common Errors

| Code | Message | Fix |
|---|---|---|
| `E0201` | `missing required field 'x' in type 'Foo'` | Add `x` or make it `x: T?` / `x: T = default` |
| `E0202` | `unknown field 'y' in type 'Foo'` | Remove `y` or add to alias definition |
| `E0203` | `type mismatch for field 'x': expected string, found i64` | Correct type or convert |
| `E0204` | `forward reference in default expression` | Reorder fields or use const |
| `E0205` | `generic alias arity mismatch: expected 1, found 2` | Match `type_params` count |
| `E0206` | `cyclic type alias` | Break cycle: `type A = B` + `type B = A` is rejected |
| `W0200` | `possible null dereference of optional field` | Check `!= null` before use |

---

## 9. Extended Examples

### 9.1 API Response Envelope

```adesh
type ApiError = { code: i64, message: string }
type ApiResponse<T> = {
    ok: bool,
    data: T?,
    error: ApiError?,
    request_id: string = "unknown",
}
fn fetch_user(id: string): ApiResponse<User> {
    if (id == "") {
        return { ok: false, error: { code: 400, message: "bad id" } };
    }
    return { ok: true, data: { name: "Ada", age: 30 } };
}
let res: ApiResponse<User> = fetch_user("123");
if (res.ok && res.data != null) { print(res.data.name); }
```

### 9.2 Event System with Typed Handlers

```adesh
type Event<T> = { kind: string, payload: T, timestamp: u64 = 0 }
type EventHandler<T> = fn(event: Event<T>): bool;

let string_handler: EventHandler<string> = (e) => {
    print(f"[{e.kind}] {e.payload}");
    return true;
};
let evt: Event<string> = { kind: "log", payload: "hello" };
string_handler(evt);
```

### 9.3 Configuration with Defaults and Optional Overrides

```adesh
type DbConfig = {
    host: string = "localhost",
    port: u64 = 5432,
    user: string,
    password: string?,
    pool_size: u64 = 10,
}
fn connect(cfg: DbConfig): bool {
    let host = cfg.host; // defaults already injected if omitted
    print(f"connecting to {host}:{cfg.port}");
    return true;
}
connect({ user: "admin" });                              // uses all defaults
connect({ user: "admin", host: "prod.db", pool_size: 20 });
```

### 9.4 Generic Pair with Destructuring

```adesh
type Pair<A, B> = { first: A, second: B }
let p: Pair<i64, string> = { first: 42, second: "answer" };
let { first, second } = p; // object destructuring (see StmtKind::LetObject)
print(f"{first} -> {second}");

type Point<T> = { x: T, y: T }
let origin: Point<f64> = { x: 0.0, y: 0.0 };
```

---

## 10. Best Practices

1. Use `type Foo = { ... }` for data that is constructed, passed, and pattern-matched without methods; use `struct`/`class` when you need `extend on`, constructors, or encapsulation.
2. Prefer `?` for truly absent data and `= default` for sensible fallbacks; combining both (`field: T? = value`) is allowed but document whether `null` is a valid explicit override.
3. Keep generic alias depth shallow — alias chains are expanded eagerly, so `type A = B` where `B` is `type C = ...` incurs compile-time expansion cost.
4. For function aliases, name the parameter (`fn(event: string)`) for documentation; the type checker ignores parameter names but tooling shows them.
5. Run `adesh check --strict-optional` to enforce explicit null checks on `?` fields.
