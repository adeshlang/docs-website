---
id: extends
title: extends
sidebar_label: extends
description: The `extends` keyword declares inheritance in a class header.
---

# `extends`

The `extends` keyword declares that a class inherits from a parent class. The subclass inherits the parent's members and may override or add to them.

---

## Syntax & Example

```adesh
class Animal {
    pub fn speak() {
        print("...");
    }
}

class Dog extends Animal {
    pub fn speak() {
        print("woof");
    }
}
```

---

## Use Cases

- Modeling single-inheritance relationships between classes.
- Reusing and overriding parent behavior in a subclass.
- Distinguishing inheritance (`extends`) from contract conformance (`implements`).
