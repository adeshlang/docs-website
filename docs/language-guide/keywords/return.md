---
id: return
title: return
sidebar_label: return
description: The `return` keyword returns a value from a function.
---

# `return`

The `return` keyword exits the current function and yields a value to the caller. A bare `return;` returns from a function with no value.

---

## Syntax & Example

```adesh
fn square(x: i32): i32 {
    return x * x;
}

fn earlyExit(items: [i32]): i32 {
    for it in items {
        if it < 0 { return it; }
    }
    return 0;
}
```

---

## Use Cases

- Producing a function's result.
- Short-circuiting out of a loop or branch.
- Returning early from guards and validation checks.

:::note
`return` also triggers any `defer` statements registered in the enclosing scope before control leaves the function.
:::
