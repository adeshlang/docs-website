---
id: extend
title: extend — Retroactive Type Extension
sidebar_label: extend
description: The `extend` keyword with mandatory `on` — production reference for retroactive extension blocks (anonymous, named, generics, async/unsafe, enums, builtins).
---

# `extend` … `on` — Retroactive Type Extension

`extend` introduces a **retroactive extension block** that attaches new methods to an *already-declared* type without modifying its source or wrapping it. It is the AdeshLang analogue of Rust's `impl Trait for Type`, Swift/Dart extension methods, and Kotlin extension functions — but unified into a single `extend on` form that works for `class`, `struct`, `enum`, and selected builtins.

:::caution Mandatory `on`
The parser **requires** `on`. The form `extend Point { ... }` without `on` is a compile error (`Expect 'on' after extend`). Always write `extend on Type { ... }` or the named form `extend Name on Type { ... }`.
:::

## Syntax

```ebnf
ExtendDecl     ::= "extend" [ ExtensionName ] "on" TargetType "{" Method* "}"
ExtensionName  ::= IDENT                          (* optional, for diagnostics/doc grouping *)
TargetType     ::= IDENT                          (* class | struct | enum | builtin *)
Method         ::= [ "unsafe" ] [ "async" ] "fn" [ "unsafe" ] IDENT [ "<" TypeParam ("," TypeParam)* ">" ]
                   "(" ParamList ")" [ ":" | "->" | "=>" ReturnType ] [ "unsafe" ] "{" Block "}"
ParamList      ::= ( IDENT [ ":" Type ] [ "=" Expr ] ("," IDENT [ ":" Type ] [ "=" Expr ] )* )?
```

Two canonical spellings:

```adesh
// 1. Anonymous — most common
extend on Person {
    fn greet() { print("Hello from " + this.name); }
}

// 2. Named — optional label before `on`, purely for diagnostics / grouping
extend PersonCore on Person {
    fn greet() { print("Hello from " + this.name); }
}
```

Named and anonymous blocks are semantically identical. The name (`PersonCore`) does **not** create a new type; it is stored as `Option<String>` in `StmtKind::Extend(name, target, methods, exported)` (`src/parsing/ast.rs:638`) and surfaced in diagnostics and the ALS symbol index.

---

## Semantics & Compilation Model

### No Layout Mutation, No VTable Slots

```
Source class layout (heap)                 After `extend on`

+---------------------------+              +---------------------------+
| VTable*  (8 B)           |              | VTable*  (unchanged)    |
| RC / GC header (8 B)     |              | RC header (unchanged)   |
| fields: name, age, ...   |              | fields: (unchanged)     |
+---------------------------+              +---------------------------+
                                                  |
                     Extended symbol table (compile-time only)
                     ┌─────────────────────────────────┐
                     │ Person → [+greet, +isAdult, ...]│  monomorphic fn(Person, …)
                     └─────────────────────────────────┘
```

* `extend on` **does not** grow the object header, add fields, or allocate VTable slots. It registers methods in the *extended symbol namespace* for the target type during `extend_decl()` (`src/parsing/parser/type_decls.rs:18-120`).
* Calls `p.greet()` are resolved **monomorphically at compile time** to `Person_greet(Person self, …)` with `self`/`this` passed as the first implicit argument. No virtual dispatch, no pointer adjustment — zero-cost.
* Because there is no VTable entry, `extend` methods cannot be `virtual`/`override` targets and cannot be reached via `super`.

### Target Type Resolution

| Target | Example | Notes |
|--------|---------|-------|
| `class` | `extend on Counter { fn inc() { this.value += 1; } }` | Primary use. `this` parameter binds to the instance. |
| `struct` | `extend on Vec2 { fn len() -> f64 { return Math.sqrt(this.x*this.x+this.y*this.y); } }` | Value semantics — `this` is a copy unless borrowed. |
| `enum` | `extend on Direction { fn opposite() { return match this { North => Direction.South(), … } } }` | `this` exposes `.tag`, `.value`, `.__enum`; full `match` support. See `examples/extend/05_enum_extend.adesh`. |
| builtin | `extend on string { fn isBlank() -> bool { return this.trim().len()==0; } }` | Retroactive builtin augmentation; same monomorphic lowering. |
| generic instantiation | `extend on Container<T>` not at block level — **method-level** generics only | Put `<T>` on each `fn`, not on the `extend on` header. |

### Method Modifiers Inside `extend on`

Each method may independently be:

* `async fn` / `async unsafe fn` — `method_is_async` flag in `type_decls.rs:46-51`.
* `unsafe fn` — before or after `fn`, or trailing (`fn foo() unsafe { … }`). Collapsed to `is_unsafe`.
* Generic: `fn wrap<T>(value: T) -> T` — `method_type_params` (`type_decls.rs:58-69`).
* Typed params & return: `fn scale(factor: f64) -> f64` — accepts `:`, `->`, or `=>` (`type_decls.rs:92-97`).

```adesh
extend AdvancedOps on Container {
    // async + generic + typed return: all legal inside extend
    async fn fetchAsync<T>(key: string) -> Option<T> {
        let v = await store.get(key);
        return v;
    }

    unsafe fn rawBits(self) -> u64 {
        return unsafe { reinterpret(self.value); };
    }

    fn map<U>(transform: fn(T) -> U) -> Container<U> {
        return new Container(transform(this.value));
    }
}
```

---

## Examples

### 1 — Anonymous vs Named vs Multiple Blocks (all equivalent)

```adesh
class Person {
    Person(name, age) { this.name = name; this.age = age; }
    fn introduce() { print("Hi, I'm", this.name); }
}

// anonymous — common for one-off augmentations
extend on Person {
    fn isAdult() -> bool { return this.age >= 18; }
}

// named — groups related methods for readability
extend PersonGreetings on Person {
    fn greet() { print("Hello from " + this.name + "!"); }
    fn farewell() { print("Goodbye from " + this.name + "!"); }
}

// multiple blocks on same target — all accumulate
extend on Person {
    fn birthday() { this.age += 1; print("Now", this.age); }
}

let p = new Person("Alice", 25);
p.greet();       // via named block
p.isAdult();     // via anonymous block
p.birthday();    // via second anonymous block
```

Named blocks are idiomatic for *concern separation* (`extend PersonValidation on Person`, `extend PersonDisplay on Person`) — see `examples/extend/02_use_cases.adesh` (OrderSerialization, UserValidation/UserDisplay patterns).

### 2 — Extending Structs and Enums

```adesh
struct Point { x: f64, y: f64 }

extend on Point {
    fn magnitude() -> f64 {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
    fn add(other: Point) -> Point {
        return Point { x: this.x + other.x, y: this.y + other.y };
    }
}

enum Direction { North, South, East, West }

extend DirectionHelpers on Direction {
    fn opposite() {
        return match this {
            North => Direction.South(),
            South => Direction.North(),
            East  => Direction.West(),
            West  => Direction.East()
        };
    }
    fn isCardinal() -> bool { return true; }
}

let p = Point { x: 3.0, y: 4.0 };
print(p.magnitude());               // 5.0
print(Direction.North().opposite().tag); // "South"
```

### 3 — Generic & Async Methods Inside `extend on`

```adesh
class Box<T> {
    Box(value: T) { this.value = value; }
}

extend on Box {
    // method-level generic (block-level generics not yet supported)
    fn map<U>(f: fn(T) -> U) -> Box<U> {
        return new Box(f(this.value));
    }

    async fn mapAsync<U>(f: async fn(T) -> U) -> Box<U> {
        let v = await f(this.value);
        return new Box(v);
    }
}

let b = new Box(21);
let doubled = b.map(fn(x) => x * 2); // Box<int> with 42
```

### 4 — Real-world Use Cases (condensed from `examples/extend/02_use_cases.adesh`)

```adesh
class Rectangle {
    Rectangle(w, h) { this.width=w; this.height=h; }
}
extend on Rectangle {
    fn area()      -> f64 { return this.width * this.height; }
    fn perimeter() -> f64 { return 2.0*(this.width+this.height); }
    fn isSquare()  -> bool { return this.width == this.height; }
}

class Order {
    Order(id, item, price, qty) {
        this.id=id; this.item=item; this.price=price; this.qty=qty;
    }
    fn total() -> f64 { return this.price * this.qty; }
}
extend OrderSerialization on Order {
    fn summary() -> string {
        return "Order #" + this.id + ": " + this.qty + "x " + this.item
             + " = $" + this.total();
    }
}
```

---

## `extend` vs `extends` vs `implements`

| Keyword | Role | Example |
|---------|------|---------|
| `extend on` | **Retroactive** — adds methods to an *existing* type, no inheritance | `extend on Person { fn greet() }` |
| `extends` | **Inheritance** — declares a subclass relationship in the class header | `class Dog extends Animal { ... }` |
| `implements` | **Contract** — states a class fulfills an interface | `class Canvas implements Resizable` |

`extends` participates in single-inheritance field offset accumulation and VTable construction. `extend on` participates only in symbol-table expansion. They are not interchangeable.

---

## Restrictions & Diagnostics

* `extend` **must** be followed by `[Name] on Target {` — diagnostics: `Expect 'on' after extend`, `Expect target type name after 'on'`, `Expect '{' before extension body` (`type_decls.rs:35-38`).
* Duplicate method names within the same `extend on Target` are rejected during semantic analysis.
* Extending a `sealed` class from another module is forbidden (`E0043`).
* Inside the block, only `fn` items are accepted; fields, `let`, or nested `type` declarations are illegal (`Expect 'fn' for method`).
* `self`/`this` inside extended methods is the receiver — typed as `Target` for method resolution and borrow-checking.

---

## See Also

* [`on`](./on) — the mandatory companion keyword
* [`extends`](./extends) — class inheritance
* [Structs, Classes & Extensions — §4 Retroactive Type Extension](../structs-classes) — memory & dispatch deep-dive with VTable diagrams
* [Data Structure Operations](../datatype-methods) — method dispatch lowering for builtins
* `examples/extend/01_basic_extend.adesh`, `02_use_cases.adesh`, `05_enum_extend.adesh` — runnable reference implementations
* [`proceed`](./proceed) — decorator continuation (often confused spelling with `extend`)
