---
id: weak
title: weak
sidebar_label: weak
description: The `weak` keyword is a weak reference qualifier.
---

# `weak`

The `weak` keyword qualifies a reference as weak: it does not keep the referenced value alive and must be upgraded to a strong reference before use. Weak references help avoid reference cycles in ARC-managed graphs.

---

## Syntax & Example

```adesh
let parent = strong alloc<Node>();
let back_ref = weak parent;
```

---

## Use Cases

- Breaking reference cycles in parent/child graphs.
- Observing a value without preventing its deallocation.
- Caching that should not extend an object's lifetime.

See also: [strong](./strong), [ARC](../../advanced/arc).
