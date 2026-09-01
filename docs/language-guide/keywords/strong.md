---
id: strong
title: strong
sidebar_label: strong
description: The `strong` keyword is a strong reference qualifier.
---

# `strong`

The `strong` keyword qualifies a reference as strong: it keeps the referenced value alive for as long as the strong reference exists. Strong references participate in automatic reference counting (ARC) ownership.

---

## Syntax & Example

```adesh
let node = strong alloc<Node>();
```

---

## Use Cases

- Holding an owning/retaining reference that prevents deallocation.
- Building graph and tree structures with clear ownership.
- Contrasting with `weak` references that do not retain.

See also: [weak](./weak), [ARC](../../advanced/arc).
