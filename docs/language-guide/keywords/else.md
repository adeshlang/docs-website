---
id: else
title: else
sidebar_label: else
description: The `else` keyword introduces the alternative branch of an `if`.
---

# `else`

The `else` keyword introduces the alternative branch of an `if` statement (or expression). It runs when the preceding `if`/`elif` conditions are all falsy.

---

## Syntax & Example

```adesh
if x > 0 {
    print("positive");
} else {
    print("zero or negative");
}
```

```adesh
let abs = if x >= 0 { x } else { -x };
```

---

## Use Cases

- Providing a fallback branch when no `if`/`elif` condition matches.
- Pairing with `if` expressions to guarantee a value in all cases.
