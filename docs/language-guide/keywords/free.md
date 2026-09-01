---
id: free
title: free
sidebar_label: free
description: The `free` keyword frees memory.
---

# `free`

The `free` keyword releases memory previously allocated with `alloc`. It is used for manual memory management and is typically wrapped in `unsafe` blocks because the compiler cannot verify the pointer is valid.

---

## Syntax & Example

```adesh
unsafe {
    let buf = alloc<u8>(1024);
    // ... use buf ...
    free(buf);
}
```

---

## Use Cases

- Releasing manually allocated buffers.
- Implementing custom allocators that return memory to a pool.
- Pairing with `alloc` for deterministic, GC-free memory control.

See also: [alloc](./alloc), [unsafe](./unsafe).
