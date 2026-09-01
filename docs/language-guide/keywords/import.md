---
id: import
title: import
sidebar_label: import
description: The `import` keyword imports a module or symbol.
---

# `import`

The `import` keyword brings a module or specific symbols into the current scope so they can be used by name.

---

## Syntax & Example

```adesh
import FS;
import Net;

import { HashMap } from "adesh_alloc";
import { adesh_alloc::HashMap } from "adesh_alloc";
```

---

## Use Cases

- Pulling in standard library modules (`FS`, `Net`, `IO`).
- Importing specific symbols from a module with `from`.
- Aliasing imports with `as` to avoid name clashes.

See also: [from](./from), [as](./as), [Modules & Imports](../modules-imports).
