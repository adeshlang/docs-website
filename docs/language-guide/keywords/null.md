---
id: "null"
title: "null"
sidebar_label: "null"
description: The `null` keyword is the null reference literal.
---

# `null`

The `null` keyword is the null reference literal. It represents the absence of a value for reference/nullable types and can be matched explicitly in a `match`.

---

## Syntax & Example

```adesh
let name: string? = null;

match name {
    null => print("no name"),
    n => print(n),
}
```

```adesh
type Json = string | i64 | f64 | bool | null;

fn print_json(v: Json) {
    match v {
        null => print("null"),
        s: string => print(s),
        _ => print("other"),
    }
}
```

---

## Use Cases

- Representing the absence of a value for nullable types.
- Distinguishing "no value" from a present value in `match` arms.
- Initializing optional references before they are assigned.
