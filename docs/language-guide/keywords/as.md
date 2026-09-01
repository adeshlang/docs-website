---
id: as
title: as
sidebar_label: as
description: The `as` keyword renames an imported symbol or performs a cast.
---

# `as`

The `as` keyword renames an imported symbol (to avoid clashes) and is also used for explicit type conversions/casts.

---

## Syntax & Example

```adesh
import { HashMap as Map } from "adesh_alloc";

let big: i64 = 256;
let small = big as u8;
```

---

## Use Cases

- Aliasing imports to resolve name conflicts.
- Performing explicit, checked type conversions.
- Renaming exports for a cleaner public API.

See also: [import](./import), [export](./export).
