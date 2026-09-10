---
id: public
title: public
sidebar_label: public
description: The `public` keyword is the fully visible access modifier.
---

# `public`

The `public` keyword is the most permissive visibility modifier. A `public` member is visible to all callers, including code outside the declaring type or module.

---

## Syntax & Example

```adesh
struct Counter {
    private count: i64,

    pub fn increment() {
        self.count += 1;
    }

    pub fn value(): i64 {
        return self.count;
    }
}
```

---

## Use Cases

- Exposing a type's API to external callers.
- Publishing methods that form the public surface of a module.
- Pairing with `private` fields to keep state internal while exposing behavior.

See also: [private](./private), [protected](./protected).
