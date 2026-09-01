---
id: unsafe
title: unsafe
sidebar_label: unsafe
description: The `unsafe` keyword marks an unchecked/unsafe block.
---

# `unsafe`

The `unsafe` keyword marks a block or operation as unchecked: it opts out of certain safety guarantees so that operations the compiler cannot verify (raw pointer arithmetic, FFI calls, manual memory management) can be performed. The programmer takes responsibility for upholding invariants inside the block.

---

## Syntax & Example

```adesh
unsafe {
    let p = alloc<u8>(64);
    // raw pointer / FFI operations
    free(p);
}
```

---

## Use Cases

- Performing raw memory operations the compiler cannot verify.
- Calling FFI functions that may violate AdeshLang's safety model.
- Isolating dangerous operations so they are easy to audit.

See also: [Memory & Safety](../../advanced/memory-safety).
