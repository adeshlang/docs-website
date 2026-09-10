---
id: struct
title: struct
sidebar_label: struct
description: The `struct` keyword declares a structure type.
---

# `struct`

The `struct` keyword declares a structure: a nominal record type with named fields and (optionally) methods. Structs are the primary data-modelling construct in AdeshLang.

---

## Syntax & Example

```adesh
struct Point {
    x: f64,
    y: f64,

    pub fn origin(): Point {
        return Point { x: 0.0, y: 0.0 };
    }
}

let p = Point { x: 1.0, y: 2.0 };
print(p.x);
```

---

## Use Cases

- Grouping related fields into a single named value.
- Building domain entities and value objects.
- Attaching methods to a data layout (with `pub` visibility).

See also: [Structs & Classes](../structs-classes).
