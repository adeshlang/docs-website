---
id: super
title: super
sidebar_label: super
description: The `super` keyword references the parent type or its members.
---

# `super`

The `super` keyword references the parent type (or its members) from within a subtype. It is used to call inherited implementations, including overridden ones.

---

## Syntax & Example

```adesh
class Animal {
    pub fn speak() {
        print("generic sound");
    }
}

class Dog extends Animal {
    pub fn speak() {
        super.speak();
        print("woof");
    }
}
```

---

## Use Cases

- Calling a parent implementation from an overriding method.
- Accessing inherited members that have been shadowed.
- Forwarding to the base constructor during construction.
