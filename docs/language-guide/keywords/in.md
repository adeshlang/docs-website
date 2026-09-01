---
id: in
title: in
sidebar_label: in
description: The `in` keyword introduces the iteration membership clause of a `for` loop.
---

# `in`

The `in` keyword introduces the membership clause of a `for` loop. It binds the loop variable to each element drawn from the iterable on its right.

---

## Syntax & Example

```adesh
for item in [1, 2, 3] {
    print(item);
}

for key in map {
    print(key);
}
```

---

## Use Cases

- Iterating over the elements of an array, range, or collection.
- Binding a name to each successive element inside a `for` loop.

See also: [for](./for), [of](./of).
