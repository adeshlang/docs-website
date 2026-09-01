---
id: try
title: try
sidebar_label: try
description: The `try` keyword begins a protected block.
---

# `try`

The `try` keyword begins a protected block of code that may raise an error. It is paired with one or more `catch` clauses to handle errors thrown within the block.

---

## Syntax & Example

```adesh
try {
    let data = FS.open(path, "r").readAll();
} catch (e: Error) {
    print(f"failed: {e}");
}
```

---

## Use Cases

- Protecting code that may raise errors (I/O, parsing, FFI).
- Combining with `catch` to recover from specific error types.
- Pairing with `defer` to guarantee cleanup whether or not an error occurs.

See also: [catch](./catch), [throw](./throw), [Error Handling](../error-handling).
