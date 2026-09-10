---
id: sealed
title: sealed
sidebar_label: sealed
description: The `sealed` keyword restricts subtyping to a closed set of types.
---

# `sealed`

The `sealed` keyword marks a type as closed to extension: only a known set of subtypes (declared in the same scope/module) may inherit from it. This enables exhaustive pattern matching over a fixed family of types.

---

## Syntax & Example

```adesh
sealed interface Shape {
    fn area(): f64;
}

struct Circle(radius: f64): Shape { /* ... */ }
struct Square(side: f64): Shape { /* ... */ }
// No further subtypes of Shape are permitted outside this set.
```

---

## Use Cases

- Modeling a closed algebraic data type where all variants are known up front.
- Enabling the compiler to verify exhaustive `match` arms over a sealed hierarchy.
- Preventing third-party code from adding new subtypes to a domain type.
