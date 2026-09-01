---
id: abstract
title: abstract
sidebar_label: abstract
description: The `abstract` keyword marks a type or member as abstract.
---

# `abstract`

The `abstract` keyword marks a type or member as abstract: it declares a shape without a complete implementation. Abstract types cannot be instantiated directly and abstract members must be implemented by a concrete subtype.

---

## Syntax & Example

```adesh
abstract interface Shape {
    fn area() -> f64;
}

struct Circle(radius: f64): Shape {
    pub fn area() -> f64 {
        return 3.14159 * self.radius * self.radius;
    }
}
```

---

## Use Cases

- Defining base interfaces or classes that only describe behavior.
- Forcing subtypes to provide concrete implementations of specific members.
- Building shared contracts across a family of related types.

:::note
`abstract` is reserved by the lexer. Parser support is focused on interface/type declarations; treat partial forms as experimental.
:::
