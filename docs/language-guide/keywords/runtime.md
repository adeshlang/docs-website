---
id: runtime
title: runtime
sidebar_label: runtime
description: The `runtime` keyword marks a runtime-evaluation block or marker.
---

# `runtime`

The `runtime` keyword marks a block or expression for runtime evaluation, in contrast to `compile`. It is used in metaprogramming contexts to make explicit that work happens when the program runs.

---

## Syntax & Example

```adesh
runtime {
    print("evaluated when the program runs");
}
```

---

## Use Cases

- Explicitly marking runtime evaluation in mixed compile/runtime code.
- Contrasting with `compile` blocks in metaprogramming.
- Annotating behavior that must remain dynamic.

:::note
`runtime` is reserved by the lexer; parser support is focused on metaprogramming and may be experimental in places.
:::
