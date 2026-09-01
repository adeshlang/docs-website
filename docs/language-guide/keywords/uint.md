---
id: uint
title: uint
sidebar_label: uint
description: The `uint` keyword is the unsigned integer type keyword.
---

# `uint`

The `uint` keyword is a primitive unsigned integer type keyword. It denotes an unsigned integer type used in type annotations and declarations.

---

## Syntax & Example

```adesh
let count: uint = 100;
fn hash_code() -> uint {
    return 0;
}
```

---

## Use Cases

- Annotating values that are non-negative by construction.
- Returning unsigned hash codes or sizes from functions.
- Pairing with the wider family of fixed-size unsigned types (`u8`, `u16`, `u32`, `u64`, `usize`).

See also: [int](./int), [Int](./int-type).
