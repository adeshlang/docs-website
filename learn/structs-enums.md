---
id: structs-enums
title: Structs, Enums & Pattern Matching - Modeling Data
sidebar_label: 13. Structs, Enums & Matching
---

# Structs, Enums & Pattern Matching — Modeling Data

Real programs work with real-world data: products, orders, customers, messages,
errors. Adesh models data with **structs**, **enums**, and **pattern
matching** — the same trio used by Rust, and proven in the examples
repository's e-commerce demo.

## Structs: named fields

A `struct` is a record with named fields. Think of it as a form you fill in:

```adesh
struct Price {
    amount: f64;
    currency: string;
}

struct Product {
    id: i32;
    name: string;
    price: Price;
    inStock: bool;
    quantity: i32;
}
```

Create one with a struct literal:

```adesh
let laptop = Product {
    id: 1001,
    name: "Premium Laptop",
    price: Price { amount: 29.99, currency: "USD" },
    inStock: true,
    quantity: 15,
};

print(laptop.name);       // Premium Laptop
print(laptop.price.amount); // 29.99
```

**Output:**
```
Premium Laptop
29.99
```

That is exactly `examples/structures/ecommerce_example.adesh`, which models a
complete e-commerce system with nested structs (`Order` holds a `Customer` and
a `Product`).

### Structs with functions

Structs can carry behavior via `extend on`:

```adesh
struct Point {
    x: f64;
    y: f64;
}

extend on Point {
    fn magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

let p = Point { x: 3.0, y: 4.0 };
print(p.magnitude());    // 5.0
```

**Output:**
```
5.0
```

## Enums: a value that is one of several variants

An `enum` describes a choice. Variants can carry no payload, one payload, or
several:

```adesh
enum Direction {
    North,
    South,
    East,
    West
}

enum Message {
    Quit,
    Move(coords),
    Write(text)
}
```

From `examples/enum/basic_enum.adesh` and `examples/enum/payload_enum.adesh`.

```adesh
let dir = Direction.North();
print(dir.tag);          // North

let move = Message.Move(100, 200);
print(move.tag);         // Move
print(move.value);       // [100, 200]  (multiple payloads become an array)
```

**Output:**
```
North
Move
[100, 200]
```

## `Option` and `Result`: the two enums you will use every day

Adesh ships two enums that turn "a missing value" and "a possible failure"
into types you must handle:

```adesh
let some = Some("Ajay");
let none = None();
print(some.tag);   // Some
print(none.tag);   // None
```

**Output:**
```
Some
None
```

```adesh
enum Result {
    Ok(value),
    Err(error)
}

let ok   = Result.Ok(42);
let fail = Result.Err("Something went wrong");
```

See `examples/advanced_types/02_result_type.adesh` — it builds `Result` from
scratch and matches on both variants.

## Pattern matching with `match`

`match` lets you handle each variant explicitly and safely:

```adesh
enum Status {
    Pending,
    Active(string),
    Failed(i32)
}

let current = Status.Active("Session_89");

match current {
    Status.Pending => print("Status is pending"),
    Status.Active(info) => print("Active session:", info),
    Status.Failed(code) => print("Failed with error code:", code)
}
```

**Output:**
```
Active session: Session_89
```

Matching on a `Result`:

```adesh
fn safeDivide(a: f64, b: f64): Result {
    if b == 0 {
        return Result.Err("Division by zero");
    }
    return Result.Ok(a / b);
}

let res = safeDivide(10.0, 0.0);

match res {
    Result.Ok(value) => print("Got:", value),
    Result.Err(msg)  => print("Error:", msg)
}
```

**Output:**
```
Error: Division by zero
```

Pattern matching replaces whole `if/elif/else` chains and, when used with
enums, guarantees you handled every case. See
`docs/language-guide/enums-pattern-matching` for the deep reference.

## Real-world modeling example

This is how the repository models an order system
(`examples/structures/ecommerce_example.adesh`, condensed):

```adesh
struct Customer {
    customerId: i32;
    name: string;
    email: string;
}

let alice = Customer {
    customerId: 5001,
    name: "Alice Johnson",
    email: "alice@example.com",
};

print(alice.name, alice.email);
```

**Output:**
```
Alice Johnson alice@example.com
```

## Practice

Create `grade.adesh`:

```adesh
enum Grade {
    Excellent,
    Good,
    Fair,
    Poor
}

fn gradeFor(score: i32): Grade {
    if score >= 90 { return Grade.Excellent(); }
    if score >= 75 { return Grade.Good(); }
    if score >= 60 { return Grade.Fair(); }
    return Grade.Poor();
}

let s = 82;
let g = gradeFor(s);

match g {
    Grade.Excellent => print("Outstanding!"),
    Grade.Good => print("Nice work!"),
    Grade.Fair => print("Keep practicing."),
    Grade.Poor => print("Ask for help — everyone starts somewhere.")
}
```

**Output:**
```
Nice work!
```

## Summary

✅ **You learned:**
- `struct` defines a named record of fields
- struct literals: `Product { id: 1001, name: "…", ... }`
- nested structs model real-world hierarchies
- `extend on` adds methods to a struct
- `enum` defines one-of-many variants, with payloads
- `Some`/`None` (Option) and `Result.Ok`/`Result.Err`
- `match` handles every variant explicitly

## Next Step

Now let's give our structs real behavior with classes and **object-oriented
programming**. Continue to **[OOP](/learn/oop)** →
