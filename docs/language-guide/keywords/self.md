---
id: self
title: self
sidebar_label: self
description: The `self` keyword references the current type or self receiver.
---

# `self`

The `self` keyword refers to the current type or self receiver. It is commonly used as the receiver type in method signatures and to refer to the implementing type from within its own members.

---

## Syntax & Example

```adesh
interface Comparable {
    fn compare(other: &Self) -> i32;
}

struct Order(value: i64): Comparable {
    pub fn compare(other: &Order) -> i32 {
        if self.value < other.value { return -1; }
        if self.value > other.value { return 1; }
        return 0;
    }
}
```

---

## Use Cases

- Naming the implementing type generically (as `Self`) in interface contracts.
- Referring to the current receiver in method bodies.
- Writing methods that return or accept values of the current type.
