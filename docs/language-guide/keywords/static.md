---
id: static
title: static
sidebar_label: static
description: The `static` keyword marks a member as associated with the type, not an instance.
---

# `static`

The `static` keyword marks a member as belonging to the type itself rather than to any single instance. Static members are accessed through the type name and shared across all instances.

---

## Syntax & Example

```adesh
struct Math {
    pub static fn square(x: i64) -> i64 {
        return x * x;
    }
}

print(Math::square(4)); // 16
```

---

## Use Cases

- Defining helper functions that do not need instance state.
- Sharing a single value or method across all instances of a type.
- Grouping related utilities under a type namespace.
