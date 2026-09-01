---
id: raw
title: raw
sidebar_label: raw
description: The `raw` keyword is a raw/verbatim marker.
---

# `raw`

The `raw` keyword is reserved as a raw/verbatim marker. It is associated with raw string literals (the `r"..."` / `R"..."` forms) and verbatim code regions where escaping and interpolation are disabled.

---

## Syntax & Example

```adesh
let pattern = raw"\d+\.\d+";
let path = r"C:\Users\Adesh";
```

---

## Use Cases

- Writing regular expressions and Windows paths without double-escaping backslashes.
- Embedding verbatim text where escape sequences should be taken literally.
- Marking code regions for compile-time/metaprogramming handling.
