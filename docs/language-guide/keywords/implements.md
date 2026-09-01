---
id: implements
title: implements
sidebar_label: implements
description: The `implements` keyword declares that a type implements an interface.
---

# `implements`

The `implements` keyword explicitly states that a type satisfies one or more interfaces. It documents the conformance relationship and lets the compiler verify that all required members are present.

---

## Syntax & Example

```adesh
interface Drawable {
    fn draw();
}

struct Button implements Drawable {
    pub fn draw() {
        print("drawing button");
    }
}
```

---

## Use Cases

- Making interface conformance explicit and checked at declaration time.
- Distinguishing inheritance (`extends`) from contract conformance (`implements`).
- Listing multiple implemented interfaces on a single type.
