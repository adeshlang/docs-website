---
id: let
title: let
sidebar_label: let
description: The `let` keyword binds a variable.
---

# `let`

The `let` keyword introduces a variable binding. Variables declared with `let` are mutable by default.

---

## Syntax & Example

```adesh
let name = "Alice";        // inferred string
let count: i32 = 100;      // explicit type
let counter = 0;           // reassignable
counter += 1;
```

```adesh
// Multi-binding and destructuring
let x, y = 10, 20;
let (a, b) = point;
```

---

## Use Cases

- Declaring local and scoped variables.
- Binding pattern-match results and tuple unpacks.
- Shadowing an earlier binding with a transformed value or type.

See also: [Variables & Mutability](../variables).
