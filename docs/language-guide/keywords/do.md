---
id: do
title: do
sidebar_label: do
description: The `do` keyword introduces the body of a `do...while` loop.
---

# `do`

The `do` keyword introduces the body of a `do...while` loop, which executes its block at least once and then repeats while the trailing `while` condition is truthy.

---

## Syntax & Example

```adesh
let mut i = 0;
do {
    print(i);
    i += 1;
} while i < 3;
```

---

## Use Cases

- Loops that must run their body at least once before testing a condition.
- Prompt-then-retry interactions and retry loops.

See also: [while](./while).
