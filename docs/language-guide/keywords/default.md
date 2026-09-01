---
id: default
title: default
sidebar_label: default
description: The `default` keyword marks a default export/import or a fallback branch.
---

# `default`

The `default` keyword marks a module's default export (the value imported when no specific name is given) and is also used as a fallback branch in some match/switch forms.

---

## Syntax & Example

```adesh
export default fn main() {
    print("entry point");
}
```

---

## Use Cases

- Designating a module's primary export.
- Providing a fallback case in pattern matching or switch-like constructs.
- Pairing with `export` to define a single, prominent module member.

See also: [export](./export), [import](./import).
