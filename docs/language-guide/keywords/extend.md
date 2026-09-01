---
id: extend
title: extend
sidebar_label: extend
description: The `extend` keyword extends a type with additional members.
---

# `extend`

The `extend` keyword adds members to an existing type without modifying its original declaration. This allows augmenting types (including those from other modules) with new methods or conformances.

---

## Syntax & Example

```adesh
extend Point {
    pub fn magnitude() -> f64 {
        return (self.x * self.x + self.y * self.y).sqrt();
    }
}
```

---

## Use Cases

- Adding helper methods to a type defined elsewhere.
- Attaching new interface conformances to an existing type.
- Keeping domain-specific extensions separate from core declarations.
