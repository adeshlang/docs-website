---
id: set
title: set
sidebar_label: set
description: The `set` keyword declares a property setter accessor.
---

# `set`

The `set` keyword declares a property setter accessor. It defines the code that runs when a computed property is assigned, allowing field-like assignment syntax backed by a method.

---

## Syntax & Example

```adesh
struct Thermostat {
    private temp: f64,

    get target() -> f64 {
        return self.temp;
    }

    set target(value: f64) {
        self.temp = if value > 100.0 { 100.0 } else { value };
    }
}
```

---

## Use Cases

- Validating or clamping values on assignment.
- Triggering side effects when a property changes.
- Pairing with `get` to form a full read/write computed property.
