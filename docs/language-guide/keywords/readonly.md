---
id: readonly
title: readonly
sidebar_label: readonly
description: The `readonly` keyword marks a field as read-only.
---

# `readonly`

The `readonly` keyword marks a field as read-only: it may be read but not reassigned after construction. Unlike `const`, a `readonly` field's value is set at construction time rather than being a compile-time constant.

---

## Syntax & Example

```adesh
struct Config {
    readonly port: u16,
    readonly host: string,
}

let cfg = Config { port: 8080, host: "0.0.0.0" };
print(cfg.port);
// cfg.port = 9090; // ERROR: readonly field
```

---

## Use Cases

- Exposing fields that are fixed after construction.
- Preventing accidental mutation of configuration or identity fields.
- Distinguishing a runtime-fixed value (`readonly`) from a compile-time constant (`const`).
