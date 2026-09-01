---
id: export
title: export
sidebar_label: export
description: The `export` keyword exports a symbol from a module.
---

# `export`

The `export` keyword marks a declaration as part of a module's public interface, making it available to other modules that import it.

---

## Syntax & Example

```adesh
export fn helper() {
    print("exported");
}

export const VERSION: string = "1.0.0";
```

---

## Use Cases

- Publishing functions, types, and constants from a module.
- Selectively exposing only the intended public API.
- Pairing with `default` to mark a module's primary export.

See also: [import](./import), [default](./default).
