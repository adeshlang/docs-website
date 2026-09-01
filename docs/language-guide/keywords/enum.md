---
id: enum
title: enum
sidebar_label: enum
description: The `enum` keyword declares an enumeration.
---

# `enum`

The `enum` keyword declares an enumeration: a type whose values are a fixed set of named variants. Enums may carry associated data in their variants and are commonly combined with `match`.

---

## Syntax & Example

```adesh
enum Color {
    Red,
    Green,
    Blue,
}

let c = Color::Red;
match c {
    Color::Red => print("red"),
    Color::Green => print("green"),
    Color::Blue => print("blue"),
}
```

---

## Use Cases

- Modeling a closed set of alternatives (states, options, statuses).
- Tagged-union variants that carry payload data.
- Combining with `match` for exhaustive, compiler-checked branching.

See also: [Enums & Pattern Matching](../enums-pattern-matching).
