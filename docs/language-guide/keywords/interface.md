---
id: interface
title: interface
sidebar_label: interface
description: The `interface` keyword declares an interface (a contract of methods).
---

# `interface`

The `interface` keyword declares an interface: a named contract consisting of method signatures (and optionally associated types/values) that conforming types must satisfy.

---

## Syntax & Example

```adesh
interface Comparable {
    fn compare(other: &Self): i32;
}

struct Order(value: i64): Comparable {
    pub fn compare(other: &Order): i32 {
        if self.value < other.value { return -1; }
        if self.value > other.value { return 1; }
        return 0;
    }
}
```

---

## Use Cases

- Defining shared behavior that multiple unrelated types can implement.
- Decoupling callers from concrete types via the interface type.
- Supporting polymorphic dispatch over a set of implementors.
