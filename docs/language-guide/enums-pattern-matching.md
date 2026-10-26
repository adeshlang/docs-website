---
id: enums-pattern-matching
title: "Enums, Tagged Unions & Pattern Lowering"
description: "Formal specification of scalar enums, tagged union memory offsets, discriminant optimization, decision tree generation, and pattern lowering in Adesh."
sidebar_label: "Enums & Pattern Matching"
---

# Enums, Tagged Unions & Pattern Lowering

This document specifies the physical memory layouts of scalar enumerations and tagged unions (sum types), discriminant byte-width optimizations, decision tree generation algorithms, and pattern matching lowering in Adesh.

---

## 1. Scalar Enums

Scalar enums define a set of distinct named integral constants — no payload data:

```adesh
enum Severity {
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3,
}

enum Direction { North, South, East, West } // auto-numbered 0..N-1
```

Lowered in `src/parsing/ast.rs:EnumDecl { name, variants: Vec<(String, Option<String>)> }` where the `Option<String>` is an optional discriminant expression.

### 1.1 Memory Representation

Scalar enums require no heap headers and are stored directly as fixed-width integers. The compiler selects the smallest integer type that fits all discriminants (see §2.2):

```
Scalar Enum Memory:
  Severity::Critical  -->  i64(3)   // default width i64
  Direction::North    -->  i64(0)
```

With explicit width annotation (where supported):

```adesh
enum Flags: u8 { None = 0, Read = 1, Write = 2, ReadWrite = 3 }
```

No discriminant byte is stored separately — the scalar value *is* the discriminant. This makes scalar enums ABI-compatible with C enums for FFI (`extern "C"`).

---

## 2. Tagged Unions (Sum Types / ADTs)

Enums can attach heterogeneous payload data to individual variants, forming **Tagged Unions** (algebraic data types):

```adesh
enum Message {
    Quit,
    Move { x: i64, y: i64 },
    Write(string),
    ChangeColor(u8, u8, u8),
}

enum Shape {
    Circle { radius: f64 },
    Rect { width: f64, height: f64 },
    Point,
}

enum Option<T> { Some(T), None, }
enum Result<T, E> { Ok(T), Err(E), }
```

### 2.1 Memory Layout & Discriminant Optimization

A tagged union buffer consists of a **Discriminant Tag** followed by a **Payload Union Buffer**:

```
Tagged Union Memory Layout (8-byte aligned, native backend)
+--------------------------+----------------------------------------------------+
|  Discriminant Tag (1B)   |  Payload Union Buffer (max payload size across all variants) |
+--------------------------+----------------------------------------------------+
|  Variant Index (0..N-1)  |  Max variant payload (e.g., sizeof(Write)=24B string header) |
|                          |  Struct payloads laid out inline per variant                |
+--------------------------+----------------------------------------------------+
|<---- Tag Offset 0x00 --->|<---------------- Payload Offset 0x08 ------------------------>|
|  padding 7B after 1B tag |  aligned to 8B                               |
+--------------------------+----------------------------------------------------+
```

Concrete example:

```
Message::Move { x:10, y:20 }  (assume Message has tag 1)
Offset 0x00: [ 01 00 00 00 00 00 00 00 ]  // tag=1, 7 padding
Offset 0x08: [ 0A 00 00 00 00 00 00 00 ]  // x = 10 (i64)
Offset 0x10: [ 14 00 00 00 00 00 00 00 ]  // y = 20 (i64)
           // no heap allocation for this payload; string payloads store header inline

Message::Write("hello")
Offset 0x00: [ 02 00 00 00 00 00 00 00 ]  // tag=2
Offset 0x08: [ string header 24B: ptr(8) len(8) cap(8) ] // payload
```

### 2.2 Discriminant Tag Byte-Width Optimization

The compiler automatically selects the minimum byte width required to represent all variant tags, minimizing memory:

```text
Discriminant Tag Width:
  - 1 Byte  (u8)  if N_variants <= 256
  - 2 Bytes (u16) if 256 < N_variants <= 65,536
  - 4 Bytes (u32) if N_variants > 65,536
```

7/6/4 padding bytes are inserted after a 1/2/4-byte discriminant to align the payload to 8 bytes. For interpreter mode (`Value::Enum` / `Value::EnumCtor`), the discriminant is a logical index without physical padding.

For `Option<T>` where `T` is a non-nullable pointer type, the backend may apply **niche optimization**: `None` is represented as null pointer, `Some(ptr)` as the pointer itself, with no discriminant byte at all.

### 2.3 Generic Enums & Monomorphization

Generic enums (`Option<T>`, `Result<T,E>`) are monomorphized per instantiation (§ `generics.md`). Each instantiation may have different payload sizes and thus different union buffer sizes:

```adesh
enum Result<T, E> { Ok(T), Err(E) }
let r1: Result<i64, string> = Result::Ok(42);    // payload max(8, 24) = 24B
let r2: Result<bool, u8> = Result::Err(255);      // payload max(1,1)=1B (+ padding -> 8B)
```

The compiler generates per-instantiation layouts and mangled symbols (`_Adesh_M_main_Result_Ok_i64_string`).

---

## 3. Pattern Matching Compiler Lowering

Pattern matching expressions (`match`) evaluate a selector against structured patterns with exhaustive checking:

```adesh
let msg = Message::Move { x: 10, y: 20 };

match msg {
    Message::Quit => print("Exiting"),
    Message::Move { x, y } => print(f"Move to {x}, {y}"),
    Message::Write(text) => print(text),
    Message::ChangeColor(r, g, b) => print(f"Color: {r},{g},{b}"),
}
```

### 3.1 Pattern Forms (EBNF)

```ebnf
MatchExpr   ::= "match" Expr "{" MatchArm { "," MatchArm } [ "," ] "}"
MatchArm    ::= Pattern "=>" ( Expr | Block )
Pattern     ::= "_"                          (* wildcard *)
              | IDENT                        (* variable binding: x *)
              | Literal                      (* 42, "hi", true *)
              | IDENT "::" IDENT [ "(" Pattern { "," Pattern } ")" ]  (* Enum variant *)
              | IDENT "{" FieldPat { "," FieldPat } "}"              (* struct-like variant *)
              | Pattern "|" Pattern          (* or pattern *)
              | "(" Pattern { "," Pattern } ")" (* tuple pattern *)
              | "[" Pattern { "," Pattern } "]" (* array pattern, if supported *)
FieldPat    ::= IDENT [ ":" Pattern ]

LetPattern  ::= "let" Pattern "=" Expr       (* if let / while let / let destructuring *)
```

In AST: `Pattern` enum in `src/parsing/ast.rs:92-98` (`Literal`, `Variable`, `Wildcard`, `Or`, `EnumVariant`), and `ExprKind::Match(Box<Expr>, Vec<(Pattern, Expr)>)`.

### 3.2 Decision Tree & Jump Table Generation

For dense variant tags without complex guards, the compiler lowers `match` into an $O(1)$ native **Jump Table** (`SWITCH_TAG` bytecode instruction):

```text
               [ Read Discriminant Tag at Offset 0x00 ]
                                 |
         +-----------------------+-----------------------+-----------------------+
         | (Tag = 0)             | (Tag = 1)             | (Tag = 2)             | (Tag = 3)
         v                       v                       v                       v
  [ Jump to Quit Block ]   [ Extract x, y Payload ]  [ Extract String Ptr ]  [ Extract r,g,b ]
                           [ Jump to Move Block ]    [ Jump to Write Block ] [ Jump to Color ]
```

For sparse tags or guarded arms, the compiler emits a **Decision Tree** with binary search or if-else chains:

```text
[ Read tag ]
  if tag == 0 => Quit
  else if tag < 2 => Move
  else if tag == 2 => Write
  else => ChangeColor
```

Guards (if present) become nested `if` after tag dispatch:

```adesh
match msg {
    Message::Move { x, y } if x > 0 => print("positive move"),
    Message::Move { x, y } => print("any move"),
    _ => print("other"),
}
```

### 3.3 Exhaustiveness & Reachability Checking

The type checker verifies that `match` is **exhaustive** — every variant has an arm, or a wildcard `_` covers the remainder:

```adesh
enum Color { Red, Green, Blue }
let c = Color::Red;
match c {
    Color::Red => print("red"),
    Color::Green => print("green"),
    // E0300: non-exhaustive match, missing pattern `Color::Blue`
}
```

Fixes:

```adesh
match c {
    Color::Red => print("red"),
    Color::Green => print("green"),
    Color::Blue => print("blue"),
}
// or
match c {
    Color::Red => print("red"),
    _ => print("other"),
}
```

Reachability: an arm after a wildcard or after all variants are covered is `W0301: unreachable pattern`. The pass lives in `src/parsing/hir_passes.rs` / `src/semantics/engine.rs`.

### 3.4 Desugaring `if let` and `while let`

`if let` and `while let` are syntactic sugar desugared during parsing into single-arm `match` with a wildcard fallback:

```adesh
// Source
if let Message::Write(text) = msg {
    print(text);
}
```

Desugared AST:

```adesh
match msg {
    Message::Write(text) => { print(text); },
    _ => ()
}
```

Similarly:

```adesh
// Source
while let Some(item) = iter.next() {
    print(item);
}
// Desugared:
while (true) {
    match iter.next() {
        Some(item) => { print(item); },
        _ => break,
    }
}
```

`let` destructuring (`let (a, b) = pair;` / `let { x, y } = obj;`) uses `StmtKind::LetTuple` / `LetObject` in `src/parsing/ast.rs` and is verified by the same exhaustiveness logic.

---

## 4. `Option<T>` & `Result<T, E>` — Idiomatic Usage

### 4.1 `Option<T>` for Nullable Values

```adesh
fn find_user(id: string): Option<User> {
    for u in users { if (u.id == id) { return Option::Some(u); } }
    return Option::None;
}

let user = find_user("42");
match user {
    Option::Some(u) => print(f"found {u.name}"),
    Option::None => print("not found"),
}

// Combinators (via extend on)
let name = find_user("42").map((u) => u.name).unwrap_or("guest");
let email = find_user("42").and_then((u) => u.email); // Option<string>
```

### 4.2 `Result<T, E>` for Fallible Operations

```adesh
fn parse_int(s: string): Result<i64, string> {
    // ...
    if (valid) { return Result::Ok(n); } else { return Result::Err("invalid"); }
}
let res = parse_int("42");
match res {
    Result::Ok(n) => print(f"ok {n}"),
    Result::Err(e) => print(f"err {e}"),
}
let n = parse_int("42")?; // early return Err on failure (see error-handling.md)
```

`Option` and `Result` are enums like any other — `extend on` can add methods, `match` is exhaustive, and they participate in generic monomorphization (§ `generics.md`).

---

## 5. `extend on` for Enums

Enums support retroactive method extension via `extend on`, identical to `struct`/`class` extension:

```adesh
enum Shape {
    Circle { radius: f64 },
    Rect { width: f64, height: f64 },
}

extend on Shape {
    fn area(&self): f64 {
        match self {
            Shape::Circle { radius } => 3.1415926535 * radius * radius,
            Shape::Rect { width, height } => width * height,
        }
    }
    fn is_circle(&self): bool {
        match self {
            Shape::Circle { .. } => true,
            _ => false,
        }
    }
}
let c = Shape::Circle { radius: 10.0 };
print(c.area());
print(c.is_circle());
```

 Method generics on enums are also supported:

```adesh
enum Wrapper<T> { Value(T), Empty, }

extend on Wrapper<T> {
    fn map<U>(self: Wrapper<T>, f: fn(T): U): Wrapper<U> {
        match self {
            Wrapper::Value(v) => Wrapper::Value(f(v)),
            Wrapper::Empty => Wrapper::Empty,
        }
    }
}
let w: Wrapper<i64> = Wrapper::Value(42);
let w2 = w.map<string>((n) => f"{n}");
```

Desugaring: each `extend on` enum method is a function taking `self: &Shape` or `self: Shape` (move/borrow) and dispatched after `match` tag check. See `src/parsing/ast.rs:StmtKind::Extend`.

---

## 6. Advanced Patterns

### 6.1 Or Patterns `|`

```adesh
match severity {
    Severity::Low | Severity::Medium => print("low"),
    Severity::High | Severity::Critical => print("high"),
}
```

Lowered as `Pattern::Or(Box<Pattern>, Box<Pattern>)` — multiple discriminant checks share the same arm body.

### 6.2 Nested & Tuple Patterns

```adesh
enum Tree<T> { Leaf(T), Node { left: Tree<T>, right: Tree<T> }, }

fn sum(tree: Tree<i64>): i64 {
    match tree {
        Tree::Leaf(n) => n,
        Tree::Node { left, right } => sum(left) + sum(right),
    }
}

let pair: (Option<i64>, Option<i64>) = (Option::Some(1), Option::None);
match pair {
    (Option::Some(a), Option::Some(b)) => print(f"both {a},{b}"),
    (Option::Some(a), Option::None) => print(f"only a {a}"),
    (Option::None, Option::Some(b)) => print(f"only b {b}"),
    (Option::None, Option::None) => print("neither"),
}
```

### 6.3 Wildcard & Variable Binding

```adesh
match msg {
    Message::Move { x, y } => print(f"{x},{y}"), // binds x, y from payload
    Message::Write(text) => print(text),          // binds text
    _ => print("other"),                          // wildcard, no binding
}
```

Variable patterns introduce new `let` bindings in the arm's scope; wildcard `_` binds nothing.

---

## 7. Compilation Pipeline & Source References

```
Source: enum E { A, B(T) } / match x { ... }
       |
       v
Lexer (src/parsing/lexer.rs: "enum", "match")
       |
       v
Parser --> EnumDecl { name, variants } (src/parsing/ast.rs:933-937)
        --> ExprKind::Match(Box<Expr>, Vec<(Pattern, Expr)>) (src/parsing/ast.rs:564)
        --> Pattern::{Literal, Variable, Wildcard, Or, EnumVariant} (src/parsing/ast.rs:92-98)
       |
       v
HIR Lower (src/parsing/hir_lower.rs) --> HirType::Enum, payload size = max variant size
       |
       v
Type Check (src/semantics/engine.rs) --> variant existence, exhaustiveness E0300, reachability W0301
       |
       v
Pattern Lowering (src/parsing/hir_passes.rs) --> jump table vs decision tree
       |
       v
Codegen (src/backends/*) --> SWITCH_TAG bytecode / native jump table, payload extraction
Interpreter --> Value::Enum / EnumCtor (src/parsing/ast.rs:1003-1005)
```

---

## 8. Common Errors

| Code | Message | Fix |
|---|---|---|
| `E0300` | `non-exhaustive match, missing pattern X` | Add missing arm or `_ => ...` |
| `E0301` | `unknown variant 'X' for enum 'E'` | Check spelling or import |
| `E0302` | `wrong number of fields for variant 'V': expected 2, found 1` | Match variant arity |
| `E0303` | `cannot match on non-enum type` | Ensure selector is enum |
| `W0301` | `unreachable pattern` | Remove arm after exhaustive coverage |
| `W0302` | `wildcard `_` matches everything, subsequent arms unreachable` | Move wildcard to last arm |

---

## 9. Extended Examples

### 9.1 State Machine with Enums

```adesh
enum State { Idle, Running { progress: f64 }, Done { result: string }, Failed { error: string }, }

fn poll_state(s: State): string {
    match s {
        State::Idle => "idle",
        State::Running { progress } => f"running {progress}%",
        State::Done { result } => f"done: {result}",
        State::Failed { error } => f"failed: {error}",
    }
}
let states: [State] = [State::Idle, State::Running { progress: 50.0 }, State::Done { result: "ok" }];
for st in states { print(poll_state(st)); }
```

### 9.2 Recursive Enum & Match

```adesh
enum List<T> { Nil, Cons { head: T, tail: List<T> }, }

extend on List<T> {
    fn len(&self): u64 {
        match self {
            List::Nil => 0,
            List::Cons { head, tail } => 1 + tail.len(),
        }
    }
    fn map<U>(self: List<T>, f: fn(T): U): List<U> {
        match self {
            List::Nil => List::Nil,
            List::Cons { head, tail } => List::Cons { head: f(head), tail: tail.map(f) },
        }
    }
}
let lst: List<i64> = List::Cons { head: 1, tail: List::Cons { head: 2, tail: List::Nil } };
print(lst.len()); // 2
```

### 9.3 `Option`/`Result` Composition with Match

```adesh
fn get_user_email(id: string): Option<string> {
    let user = find_user(id)?; // Option early return (desugars to match None => return None)
    return user.email;          // Option<string>
}
fn parse_user_id(s: string): Result<string, string> {
    let n = parse_int(s).map_err((e) => f"bad id: {e}")?;
    if (n < 0) { return Result::Err("negative id"); }
    return Result::Ok(f"{n}");
}
match parse_user_id("42") {
    Result::Ok(id) => print(get_user_email(id).unwrap_or("no email")),
    Result::Err(e) => print(f"error: {e}"),
}
```

### 9.4 Or Pattern with Guards

```adesh
fn classify(msg: Message): string {
    match msg {
        Message::Quit | Message::Write("") => "empty/quit",
        Message::Move { x, y } if x == 0 && y == 0 => "origin",
        Message::Move { x, y } => f"move {x},{y}",
        Message::Write(text) => f"write {text}",
        Message::ChangeColor(r, g, b) => f"color {r},{g},{b}",
    }
}
```

### 9.5 Extending `Result` with Combinators

```adesh
extend on Result<T, E> {
    fn is_ok(&self): bool {
        match self {
            Result::Ok(_) => true,
            Result::Err(_) => false,
        }
    }
    fn unwrap_or(self: Result<T, E>, default: T): T {
        match self {
            Result::Ok(v) => v,
            Result::Err(_) => default,
        }
    }
}
let r: Result<i64, string> = Result::Ok(42);
print(r.is_ok());       // true
print(r.unwrap_or(0));  // 42
```

---

## 10. Best Practices

1. Prefer `match` over `if let` chains when more than two arms — exhaustiveness checking catches missing variants at compile time.
2. Place wildcard `_` last; keep concrete variants before wildcards to avoid `W0301`.
3. Use `Option<T>` and `Result<T,E>` for nullable/fallible APIs instead of sentinel values or exceptions where errors are expected.
4. Keep enum variant payloads consistent: prefer named fields (`Move { x, y }`) over positional (`Move(i64,i64)`) for readability.
5. Extend enums with `extend on` for behavior, but keep core enum definitions minimal and stable — adding variants is a breaking change for exhaustive matches.
6. For large enums (> 256 variants), be aware discriminant widens to 2/4 bytes — benchmark if cache-sensitive.
7. Leverage niche optimization: use `Option<Share<T>>` or `Option<&T>` where possible to avoid discriminant overhead.
