---
id: instanceof
title: instanceof
sidebar_label: instanceof
description: The `instanceof` keyword performs a runtime type test.
---

# `instanceof`

The `instanceof` keyword performs a runtime type test. It returns `true` when the value on the left is an instance of (or a subtype of) the type on the right, and `false` otherwise.

---

## Syntax & Example

```adesh
let shape: Shape = Circle { radius: 2.0 };

if shape instanceof Circle {
    print("it is a circle");
}
```

---

## Use Cases

- Checking the dynamic type of a value before downcasting.
- Guarding branches that depend on a specific runtime subtype.
- Distinguishing `instanceof` (runtime check) from `typeof` (compile-time query).
