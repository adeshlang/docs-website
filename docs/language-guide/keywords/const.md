---
id: const
title: const
sidebar_label: const
description: The `const` keyword declares a compile-time constant.
---

# `const`

The `const` keyword declares a value that is evaluated at compile time. Constants require an explicit type annotation and may appear at global or local scope.

---

## Syntax & Example

```adesh
const MAX_BUFFER_SIZE: usize = 1024 * 1024;
const DEFAULT_TIMEOUT: u64 = 30;
const APP_NAME: string = "AdeshServer";
```

---

## Use Cases

- Defining fixed configuration values used across the program.
- Eliminating magic numbers by giving them named, typed constants.
- Allowing the compiler to fold the value into every use site.

See also: [Variables & Mutability](../variables).
