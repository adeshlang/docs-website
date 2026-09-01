---
id: int-type
title: Int
sidebar_label: Int
description: The `Int` keyword is a case-sensitive alias mapping to the integer type token.
---

# `Int`

The `Int` keyword (with an uppercase `I`) is a case-sensitive reserved word. Both `int` and `Int` are lexed as the same integer-type token, but they are two distinct reserved spellings: neither may be used as an identifier.

---

## Syntax & Example

```adesh
let total: Int = -5;
fn offset(x: Int) -> Int {
    return x + 1;
}
```

---

## Use Cases

- Providing an alternative spelling for the integer type.
- Matching naming conventions that prefer capitalized type names.

:::note Case sensitivity
Keyword matching is case sensitive. `int` and `Int` are two distinct reserved words that map to the same integer-type token. `int` is not interchangeable with `uint`.
:::
