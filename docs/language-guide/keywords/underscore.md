---
id: underscore
title: _ (underscore)
sidebar_label: _ (underscore)
description: The `_` keyword is a wildcard/placeholder token, not an ordinary identifier.
---

# `_` (underscore)

The `_` keyword is a wildcard/placeholder token. Unlike an ordinary identifier, `_` does not bind a name; it signals "match anything" or "discard this value". Because it is a reserved token, it cannot be used as a variable, function, type, or parameter name.

---

## Syntax & Example

As a catch-all pattern in `match`:

```adesh
match n {
    0 => print("zero"),
    _ => print("many"),
}
```

As a placeholder for unused values:

```adesh
let _, value = pair;
```

---

## Use Cases

- Writing a catch-all arm in a `match` expression.
- Discarding parts of a tuple or struct during destructuring.
- Marking intentionally unused bindings or parameters.

:::note Not an identifier
`_` is lexed as the `Underscore` token, not as an `Identifier`. It is a wildcard/placeholder and cannot be used as an ordinary binding name.
:::
