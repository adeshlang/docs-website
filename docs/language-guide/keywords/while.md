---
id: while
title: while
sidebar_label: while
description: The `while` keyword begins a conditional loop.
---

# `while`

The `while` keyword begins a conditional loop. It evaluates a condition before each iteration and runs the body while the condition is truthy. The body may not run at all if the condition is initially falsy.

---

## Syntax & Example

```adesh
let mut n = 10;
while n > 0 {
    print(n);
    n -= 1;
}
```

---

## Use Cases

- Repeating work while a condition holds, with an unknown number of iterations.
- Polling or waiting until a state changes.
- Combining with `break`/`continue` for early exit or skipping.

See also: [do](./do), [Control Flow](../control-flow).
