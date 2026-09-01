---
id: constructor
title: constructor
sidebar_label: constructor
description: The `constructor` keyword is lexed but rejected by the parser; use the class name instead.
---

# `constructor`

The `constructor` keyword is reserved by the lexer and tokenized as a keyword, but the parser **explicitly rejects** it. AdeshLang does not use a `constructor` keyword to declare constructors; instead, the supported constructor form is a method named after the class itself.

---

## Syntax & Example

```adesh
class Vec2 {
    x: f64,
    y: f64,

    // Supported constructor form: a method named after the class.
    pub fn Vec2(x: f64, y: f64) {
        self.x = x;
        self.y = y;
    }
}

let v = new Vec2(1.0, 2.0);
```

The following is **not** supported and will be rejected:

```adesh
class Vec2 {
    constructor(x: f64, y: f64) { // REJECTED by the parser
        // ...
    }
}
```

---

## Use Cases

- There is no use case for the `constructor` keyword itself; it is reserved but unsupported.
- Use a method named after the class to declare the constructor.

:::warning Rejected by the parser
`constructor` is lexed as a keyword but the parser explicitly rejects it. Do not use it; declare constructors as a method named after the class.
:::
