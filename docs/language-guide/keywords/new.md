---
id: new
title: new
sidebar_label: new
description: The `new` keyword allocates and constructs an instance.
---

# `new`

The `new` keyword allocates and constructs a new instance of a type, invoking its constructor and returning the new object.

---

## Syntax & Example

```adesh
class Vec2 {
    x: f64,
    y: f64,
}

let v = new Vec2 { x: 1.0, y: 2.0 };
```

---

## Use Cases

- Explicitly allocating a new instance of a class or reference type.
- Invoking a constructor with initial field values.
- Distinguishing heap-allocated construction from struct literals.
