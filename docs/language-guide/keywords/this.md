---
id: this
title: this
sidebar_label: this
description: The `this` keyword references the current instance.
---

# `this`

The `this` keyword refers to the current instance within a method. It accesses the instance's fields and methods, and is the implicit receiver for unqualified member access.

---

## Syntax & Example

```adesh
struct Counter {
    count: i64,

    pub fn increment() {
        this.count += 1;
    }

    pub fn double() -> i64 {
        return this.count * 2;
    }
}
```

---

## Use Cases

- Accessing instance fields and methods from within a method.
- Disambiguating a field from a parameter of the same name.
- Passing the current instance to another function.
