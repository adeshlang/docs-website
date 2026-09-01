---
id: int
title: int
sidebar_label: int
description: The `int` keyword is the signed integer type keyword.
---

# `int`

The `int` keyword is a primitive signed integer type keyword. It denotes a signed integer type used in type annotations and declarations. Note that the uppercase spelling `Int` is a separate reserved word that maps to the same integer-type token.

---

## Syntax & Example

```adesh
let total: int = -5;
fn offset(x: int) -> int {
    return x + 1;
}
```

---

## Use Cases

- Annotating signed integer values, including negative numbers.
- Declaring function parameters and return types for integer values.
- Pairing with the wider family of fixed-size signed types (`i8`, `i16`, `i32`, `i64`, `isize`).

See also: [uint](./uint), [Int](./int-type).
