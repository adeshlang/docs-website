---
id: not
title: not
sidebar_label: not
description: The `not` keyword is the logical NOT operator.
---

# `not`

The `not` keyword is the logical NOT operator. It negates a Boolean operand, returning `true` when the operand is falsy and `false` when it is truthy.

---

## Syntax & Example

```adesh
let done = false;
if not done {
    print("still working");
}

let isEmpty = not items.any();
```

---

## Use Cases

- Inverting a Boolean condition.
- Expressing negative guards readably (`if not valid`).
- Combining with `and`/`or` to build compound expressions.
