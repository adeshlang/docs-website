---
id: and
title: and
sidebar_label: and
description: The `and` keyword is the logical AND operator.
---

# `and`

The `and` keyword is the logical AND operator. It returns `true` when both operands are truthy and short-circuits: if the left operand is falsy, the right operand is not evaluated.

---

## Syntax & Example

```adesh
if active and ready {
    print("go");
}

let canFly = hasWings and isLightweight;
```

---

## Use Cases

- Combining two conditions that must both hold.
- Short-circuiting past an expensive check when an earlier check fails.
- Building compound Boolean expressions readably.
