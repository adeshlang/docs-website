---
id: protected
title: protected
sidebar_label: protected
description: The `protected` keyword is an inheritance-aware visibility modifier.
---

# `protected`

The `protected` keyword is an inheritance-aware visibility modifier. A `protected` member is visible inside the declaring type and within its subtypes, but not to unrelated external code.

---

## Syntax & Example

```adesh
class Base {
    protected fn hook() {
        print("base hook");
    }
}

class Derived extends Base {
    pub fn run() {
        self.hook(); // visible to subtypes
    }
}
```

---

## Use Cases

- Sharing members with subclasses while keeping them from general callers.
- Providing overridable extension points for derived types.

See also: [private](./private), [public](./public).
