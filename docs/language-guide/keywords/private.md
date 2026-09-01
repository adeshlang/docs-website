---
id: private
title: private
sidebar_label: private
description: The `private` keyword is the most restrictive visibility modifier.
---

# `private`

The `private` keyword is the most restrictive visibility modifier. A `private` member is only visible inside the type or module that declares it.

---

## Syntax & Example

```adesh
struct Account {
    private balance: f64,

    pub fn deposit(amount: f64) {
        self.balance += amount;
    }
}
// Account.balance is not accessible outside the struct.
```

---

## Use Cases

- Hiding internal state from external callers.
- Restricting helper methods to the declaring type.
- Enforcing encapsulation boundaries.

See also: [protected](./protected), [public](./public).
