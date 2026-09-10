---
id: operator
title: operator
sidebar_label: operator
description: The `operator` keyword declares an overloaded operator.
---

# `operator`

The `operator` keyword declares an overloaded operator on a type. It lets a type define custom behavior for built-in operators such as `+`, `-`, `==`, and others.

---

## Syntax & Example

```adesh
struct Vec2 {
    x: f64,
    y: f64,

    pub operator fn +(other: Vec2): Vec2 {
        return Vec2 { x: self.x + other.x, y: self.y + other.y };
    }
}

let a = Vec2 { x: 1.0, y: 2.0 };
let b = Vec2 { x: 3.0, y: 4.0 };
let c = a + b;
```

---

## Use Cases

- Making user-defined types work naturally with built-in operators.
- Implementing arithmetic, comparison, or indexing for domain types.
- Keeping operator semantics co-located with the type they apply to.
