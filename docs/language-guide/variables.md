---
id: variables
title: Variables, Mutability & Scope
sidebar_label: Variables & Mutability
description: Variable bindings, mutability semantics, type inference, shadowing, scope lifetimes, and multi-variable assignments in AdeshLang.
---

# Variables, Mutability & Scope

In AdeshLang, variables are **immutable by default**. This design prevents accidental state corruption and simplifies concurrent, race-free programming.

---

## 1. Declaring Variables with `let`

Declare variables using the `let` keyword:

```adesh
let name = "Alice";       // Inferred as string
let age = 30;             // Inferred as i64
let ratio = 3.14159;      // Inferred as f64
let is_admin = false;     // Inferred as bool
```

### Explicit Type Annotations

You can optionally provide explicit type annotations:

```adesh
let count: i32 = 100;
let balance: f64 = 4500.50;
let active: bool = true;
let label: string = "Production";
```

---

## 2. Mutability with `mut`

By default, variables cannot be reassigned after initialization. To allow modification, add the `mut` modifier:

```adesh
// Immutable:
let score = 10;
// score = 20; // COMPILE ERROR: Cannot reassign to immutable variable `score`

// Mutable:
let mut counter = 0;
counter += 1;
counter = 42;
print(counter); // Prints: 42
```

---

## 3. Constants with `const`

Constants are evaluated at compile time, must have an explicit type, and can be placed in global or local scopes:

```adesh
const MAX_BUFFER_SIZE: usize = 1024 * 1024; // 1MB
const DEFAULT_TIMEOUT_SECONDS: u64 = 30;
const APP_NAME: string = "AdeshServer";
```

---

## 4. Variable Shadowing

AdeshLang allows you to declare a new variable with the same name as a previous variable in the same or an inner scope:

```adesh
let raw_input = "  120  ";

// Shadow raw_input with trimmed string
let raw_input = raw_input.trim();

// Shadow again with parsed integer type
let raw_input: i64 = raw_input.parse_int().unwrap();

print(raw_input * 2); // Prints: 240
```

Shadowing lets you transform values and types without inventing artificial names like `raw_input_trimmed` or `raw_input_as_int`.

---

## 5. Scope & Lexical Lifetimes

Variables exist only within the block (`{ ... }`) where they are declared:

```adesh
fn main() {
    let outer = "I am outside";

    {
        let inner = "I am inside";
        print(outer); // Valid
        print(inner); // Valid
    } // `inner` is dropped here deterministically (0ns GC)

    print(outer); // Valid
    // print(inner); // COMPILE ERROR: `inner` is not found in this scope
}
```

---

## 6. Multi-Variable Declarations & Variable Swapping

AdeshLang supports declaring, unpacking, and swapping multiple variables in a single statement without temporary variables:

```adesh
// Declare multiple variables simultaneously
let x, y, z = 10, 20, 30;

// Typed multi-variable declaration
let a: i32, b: string = 100, "Ready";

// Safe zero-cost variable swapping
let mut first = "A";
let mut second = "B";

first, second = second, first;

print(f"first: {first}, second: {second}"); // Output: first: B, second: A
```

Under the hood, expressions on the right-hand side are evaluated into compiler temporary registers before bindings are updated, guaranteeing memory safety without race conditions or data corruption.
