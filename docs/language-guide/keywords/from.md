---
id: from
title: from
sidebar_label: from
description: The `from` keyword names the source module in an import.
---

# `from`

The `from` keyword names the source module in a selective import, specifying which module the listed symbols come from.

---

## Syntax & Example

```adesh
import { HashMap } from "adesh_alloc";
import { open, readAll } from "fs";
```

---

## Use Cases

- Importing specific named symbols from a module.
- Combining with `import` and `as` for fine-grained, renamed imports.

See also: [import](./import), [as](./as).
