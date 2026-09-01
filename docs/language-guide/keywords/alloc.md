---
id: alloc
title: alloc
sidebar_label: alloc
description: The `alloc` keyword allocates memory.
---

# `alloc`

The `alloc` keyword allocates memory, typically returning a pointer to a newly allocated region of the requested type and size. It is usually paired with `free` for manual memory management, often inside `unsafe` blocks.

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

- Manually allocating buffers or arrays outside the GC'd heap.
- Implementing custom allocators and arenas.
- Pairing with `free` and `region` for deterministic memory control.

See also: [free](./free), [unsafe](./unsafe), [Memory & Safety](../../advanced/memory-safety).
