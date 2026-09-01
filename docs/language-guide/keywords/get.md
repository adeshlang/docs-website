---
id: get
title: get
sidebar_label: get
description: The `get` keyword declares a property getter accessor.
---

# `get`

The `get` keyword declares a property getter accessor. It defines the code that runs when a computed property is read, allowing field-like access syntax backed by a method.

---

## Syntax & Example

```adesh
struct Circle {
    radius: f64,

    get area() -> f64 {
        return 3.14159 * self.radius * self.radius;
    }
}

let c = Circle { radius: 2.0 };
print(c.area); // accessed like a field
```

---

## Use Cases

- Exposing computed values with field-like read syntax.
- Deriving properties from underlying state without storing them.
- Pairing with `set` to form a full read/write property.
