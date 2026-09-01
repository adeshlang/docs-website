---
id: emit
title: emit
sidebar_label: emit
description: The `emit` keyword emits code or a directive.
---

# `emit`

The `emit` keyword emits generated code or a compiler directive from within a metaprogramming context. It is used to inject code into the surrounding program at compile time.

---

## Syntax & Example

```adesh
compile {
    emit "let x = 42;";
}
```

---

## Use Cases

- Generating declarations or statements during compilation.
- Implementing macros and code-generation utilities.
- Emitting backend-specific directives.

:::note
`emit` is reserved by the lexer; parser support is focused on metaprogramming and may be experimental in places.
:::
