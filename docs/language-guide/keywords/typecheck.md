---
id: typecheck
title: typecheck
sidebar_label: typecheck
description: The `typecheck` keyword performs a compile-time type assertion.
---

# `typecheck`

The `typecheck` keyword performs a compile-time type assertion or check. It verifies that an expression has an expected type during compilation, failing the build if it does not.

---

## Syntax & Example

```adesh
typecheck x is i64;
```

---

## Use Cases

- Asserting type expectations in generic or macro-like code.
- Producing clear compile errors when a type assumption is violated.
- Supporting metaprogramming that branches on type information.

:::note
`typecheck` is reserved by the lexer; parser support is focused on metaprogramming and may be experimental in places.
:::
