---
id: elif
title: elif
sidebar_label: elif
description: The `elif` keyword introduces an else-if chain branch.
---

# `elif`

The `elif` keyword introduces an additional condition in an `if` chain. It is evaluated only when the preceding `if`/`elif` conditions were all falsy, providing a more compact form than nested `else { if ... }`.

---

## Syntax & Example

```adesh
let temp = 22;
if temp < 0 {
    print("freezing");
} elif temp < 15 {
    print("cold");
} elif temp < 25 {
    print("comfortable");
} else {
    print("hot");
}
```

---

## Use Cases

- Building multi-way decision ladders without deep nesting.
- Expressing ordered ranges or priority-ordered conditions.
