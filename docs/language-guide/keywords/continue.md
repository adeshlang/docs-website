---
id: continue
title: continue
sidebar_label: continue
description: The `continue` keyword skips to the next loop iteration.
---

# `continue`

The `continue` keyword skips the rest of the current loop iteration and jumps to the next iteration of the nearest enclosing loop.

---

## Syntax & Example

```adesh
for n in [1, 2, 3, 4, 5] {
    if n % 2 == 0 { continue; }
    print(n);
}
// Prints: 1, 3, 5
```

---

## Use Cases

- Skipping elements that don't need processing.
- Filtering within a loop without restructuring it.

:::note
`continue` triggers any `defer` statements registered in the current iteration's scope before moving on.
:::
