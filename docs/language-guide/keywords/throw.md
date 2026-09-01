---
id: throw
title: throw
sidebar_label: throw
description: The `throw` keyword raises an error.
---

# `throw`

The `throw` keyword raises an error, transferring control to the nearest enclosing `catch` (or propagating out of the function if none handles it). It also triggers any `defer` statements registered in the scopes being exited.

---

## Syntax & Example

```adesh
fn lookup(key: string) -> i64 {
    if key == "" {
        throw Error("empty key");
    }
    return 0;
}
```

---

## Use Cases

- Signaling that an operation cannot proceed normally.
- Propagating failures up to a layer that can handle them.
- Combining with `try`/`catch` for structured error handling.

See also: [try](./try), [catch](./catch), [Error Handling](../error-handling).
