---
id: for
title: for
sidebar_label: for
description: The `for` keyword begins an iterator loop.
---

# `for`

The `for` keyword begins an iterator loop. It binds a variable to each element of an iterable and runs the body once per element, typically using `in` (and optionally `of`).

---

## Syntax & Example

```adesh
for item in [10, 20, 30] {
    print(item);
}

for i in 0..5 {
    print(i);
}
```

---

## Use Cases

- Iterating over arrays, ranges, and other iterables.
- Processing each element of a collection.
- Combining with `break`/`continue` for early exit or filtering.

See also: [in](./in), [of](./of), [Control Flow](../control-flow).
