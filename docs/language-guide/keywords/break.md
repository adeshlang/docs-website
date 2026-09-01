---
id: break
title: break
sidebar_label: break
description: The `break` keyword exits the nearest enclosing loop.
---

# `break`

The `break` keyword immediately exits the nearest enclosing `for`, `while`, or `do...while` loop. Control resumes after the loop.

---

## Syntax & Example

```adesh
for n in [1, 2, 3, 4, 5] {
    if n == 3 { break; }
    print(n);
}
// Prints: 1, 2
```

---

## Use Cases

- Stopping a loop as soon as a search condition is met.
- Exiting early on an error or sentinel value.

:::note
`break` triggers any `defer` statements registered in the current loop iteration's scope.
:::
