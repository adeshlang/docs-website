---
id: require
title: require
sidebar_label: require
description: The `require` keyword states a compile-time precondition.
---

# `require`

The `require` keyword states a compile-time precondition or constraint. It is used in metaprogramming and contract contexts to assert that a condition holds before proceeding with generation or compilation.

---

## Syntax & Example

```adesh
require T is Numeric;
```

---

## Use Cases

- Enforcing constraints on generic type parameters.
- Stating compile-time preconditions for macros and generated code.
- Producing clear errors when a precondition is not met.

:::note
`require` is reserved by the lexer; parser support is focused on metaprogramming and may be experimental in places.
:::
