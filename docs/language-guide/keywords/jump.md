---
id: jump
title: jump
sidebar_label: jump
description: The `jump` keyword is a reserved, context-specific control-flow token.
---

# `jump`

The `jump` keyword is reserved by the lexer as a control-flow token. It is intended for unconditional local jumps (for example, structured `goto`-like transfers within a restricted scope).

---

## Syntax & Example

```adesh
// Reserved; parser support is narrow/experimental.
jump label;
```

---

## Use Cases

- Reserved for future structured local-jump control flow.

:::warning Experimental
`jump` is reserved by the lexer but has narrow parser support in the current implementation. Treat it as experimental and avoid relying on it in production code.
:::
