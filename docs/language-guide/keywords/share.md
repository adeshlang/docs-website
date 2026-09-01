---
id: share
title: share
sidebar_label: share
description: The `share` keyword shares a reference.
---

# `share`

The `share` keyword shares a reference, producing a shared (potentially read-only or borrowed) handle to a value that can be passed to other scopes while the original retains ownership.

---

## Syntax & Example

```adesh
let data = [1, 2, 3];
let view = share data;
```

---

## Use Cases

- Lending access to a value without transferring ownership.
- Passing read-only views of data to functions or tasks.
- Combining with `strong`/`weak` to control reference strength.

:::note
`share` is reserved by the lexer; parser support is focused on memory-safety features and may be experimental in places.
:::
