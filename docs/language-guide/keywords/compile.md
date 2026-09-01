---
id: compile
title: compile
sidebar_label: compile
description: The `compile` keyword marks a compile-time evaluation block.
---

# `compile`

The `compile` keyword marks a block or expression for compile-time evaluation. Code inside a `compile` context runs during compilation, and its results become part of the generated program.

---

## Syntax & Example

```adesh
compile {
    const TABLE: [u32] = build_lookup_table();
}
```

---

## Use Cases

- Precomputing lookup tables and constants at build time.
- Running metaprogramming logic that emits or shapes generated code.
- Distinguishing compile-time work from runtime execution.

:::note
`compile` is reserved by the lexer; parser support is focused on metaprogramming and may be experimental in places.
:::
