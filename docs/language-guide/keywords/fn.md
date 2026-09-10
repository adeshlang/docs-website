---
id: fn
title: fn
sidebar_label: fn
description: The `fn` keyword declares a function.
---

# `fn`

The `fn` keyword declares a function: a named, reusable block of code with parameters and an optional return type.

---

## Syntax & Example

```adesh
fn add(a: i32, b: i32): i32 {
    return a + b;
}

// No explicit return type: inferred
fn greet(name: string) {
    print(f"Hello, {name}!");
}

print(add(2, 3));
greet("Adesh");
```

---

## Use Cases

- Encapsulating reusable logic with a name and parameters.
- Declaring methods on structs/classes (with `pub` for visibility).
- Defining callbacks and higher-order functions.

See also: [Functions](../functions).
