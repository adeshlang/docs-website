---
id: of
title: of
sidebar_label: of
description: The `of` keyword introduces a value-iteration clause.
---

# `of`

The `of` keyword is reserved for value-iteration forms. Where `in` binds to elements (or keys), `of` is used to iterate over the values of a collection.

---

## Syntax & Example

```adesh
for value of map {
    print(value);
}
```

---

## Use Cases

- Iterating over the values of a map or keyed collection.
- Distinguishing value iteration from key/element iteration.

:::note
`of` is reserved by the lexer; parser support is focused on iteration forms. Treat uncommon uses as context-specific.
:::
