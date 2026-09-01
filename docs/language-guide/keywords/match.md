---
id: match
title: match
sidebar_label: match
description: The `match` keyword begins a pattern-matching expression.
---

# `match`

The `match` keyword begins a pattern-matching expression. It compares a value against a series of patterns and runs the arm whose pattern matches first, binding any captured sub-values for use in that arm.

---

## Syntax & Example

```adesh
enum Shape {
    Circle(f64),
    Square(f64),
}

fn area(s: Shape) -> f64 {
    return match s {
        Shape::Circle(r) => 3.14159 * r * r,
        Shape::Square(side) => side * side,
    };
}
```

```adesh
let n = 3;
match n {
    0 => print("zero"),
    1 | 2 => print("one or two"),
    _ => print("many"),
}
```

---

## Use Cases

- Dispatching over enum variants with exhaustive checking.
- Destructuring structured values into their parts.
- Replacing long `if`/`elif` ladders with concise pattern arms.

See also: [Enums & Pattern Matching](../enums-pattern-matching).
