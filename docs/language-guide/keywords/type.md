---
id: type
title: type
sidebar_label: type
description: The `type` keyword declares a type alias or custom type in Adesh.
---

# `type`

The `type` keyword introduces a type alias: a new name for an existing (possibly complex) type. Aliases have zero runtime cost and are structurally transparent to the underlying type.

---

## Syntax & Example

```adesh
type UserID = u64;
type Coordinates = (f64, f64);
type Cache<K, V> = HashMap<K, (V, u64)>;
```

```adesh
type Port = u16;
type Milliseconds = u64;

fn connect(host: string, port: Port, timeout: Milliseconds): bool {
    return true;
}
```

---

## Use Cases

- Giving domain-meaningful names to primitive types (`Port`, `Milliseconds`).
- Simplifying long generic signatures into a single alias.
- Defining function-signature aliases for callbacks and handlers.
- Building union/sum aliases (`type Json = string | i64 | bool | null`).

See also: [Type Aliases & Custom Types](../type-aliases).
