---
id: class
title: class
sidebar_label: class
description: The `class` keyword declares a class.
---

# `class`

The `class` keyword declares a class: a nominal reference type that supports fields, methods, inheritance (via `extends`), and interface conformance (via `implements`).

---

## Syntax & Example

```adesh
class Animal {
    name: string,

    pub fn speak() {
        print(f"{self.name} makes a sound");
    }
}

class Dog extends Animal {
    pub fn speak() {
        print(f"{self.name} barks");
    }
}
```

---

## Use Cases

- Modeling reference-typed objects with identity and inheritance.
- Building object hierarchies with shared and overridden behavior.
- Combining fields, methods, and access modifiers in one declaration.

See also: [Structs & Classes](../structs-classes).
