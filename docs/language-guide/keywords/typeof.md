---
id: typeof
title: typeof
sidebar_label: typeof
description: The `typeof` keyword performs a compile-time type query.
---

# `typeof`

The `typeof` keyword queries the (compile-time) type of an expression. It yields the type itself rather than a runtime type tag, and is useful in generic and metaprogramming contexts.

---

## Syntax & Example

```adesh
let x = 10;
type T = typeof x; // T is the type of x (e.g., i64)
```

---

## Use Cases

- Obtaining the type of an expression for use in a `type` alias.
- Building generic helpers that derive types from their arguments.
- Distinguishing `typeof` (compile-time query) from `instanceof` (runtime check).
