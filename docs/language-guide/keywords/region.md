---
id: region
title: region
sidebar_label: region
description: The `region` keyword declares a memory region.
---

# `region`

The `region` keyword declares a memory region: a named scope for allocation whose lifetime and ownership can be tracked by the compiler. Regions support region-based memory management, where allocations are tied to a scope and released when it ends.

---

## Syntax & Example

```adesh
region scratch {
    let buf = alloc<u8>(1024);
    // ... use buf ...
} // buf is released when the region ends
```

---

## Use Cases

- Bounding allocations to a scope for deterministic cleanup.
- Implementing arena/scratch allocators for hot paths.
- Giving the compiler a basis for borrow and lifetime checking.

:::note
`region` is reserved by the lexer; parser support is focused on memory-safety features and may be experimental in places.
:::
