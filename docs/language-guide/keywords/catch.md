---
id: catch
title: catch
sidebar_label: catch
description: The `catch` keyword catches a thrown error.
---

# `catch`

The `catch` keyword introduces a handler for errors raised in a preceding `try` block. It binds the thrown error to a name so it can be inspected and handled.

---

## Syntax & Example

```adesh
try {
    let n = "abc".parse_int().unwrap();
} catch (e: Error) {
    print(f"caught: {e}");
}
```

---

## Use Cases

- Recovering from expected errors without crashing.
- Inspecting and logging error details.
- Translating an error into a fallback value or re-throwing a different one.

See also: [try](./try), [throw](./throw).
