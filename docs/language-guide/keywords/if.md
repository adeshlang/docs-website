---
id: if
title: if
sidebar_label: if
description: The `if` keyword begins a conditional branch.
---

# `if`

The `if` keyword begins a conditional branch. It evaluates an expression and runs the following block only when the expression is truthy. It may be followed by `elif` and `else`.

---

## Syntax & Example

```adesh
let score = 85;
if score >= 90 {
    print("A");
} elif score >= 80 {
    print("B");
} else {
    print("C");
}
```

```adesh
// As an expression
let parity = if n % 2 == 0 { "even" } else { "odd" };
```

---

## Use Cases

- Branching on a boolean condition.
- Forming multi-branch ladders with `elif`/`else`.
- Producing values conditionally when used as an expression.

See also: [Control Flow](../control-flow).
