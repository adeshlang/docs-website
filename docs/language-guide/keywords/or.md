---
id: or
title: or
sidebar_label: or
description: The `or` keyword is the logical OR operator.
---

# `or`

The `or` keyword is the logical OR operator. It returns `true` when either operand is truthy and short-circuits: if the left operand is truthy, the right operand is not evaluated.

---

## Syntax & Example

```adesh
if isWeekend or isHoliday {
    print("day off");
}

let hasAccess = isAdmin or isEditor;
```

---

## Use Cases

- Combining conditions where any one being true is sufficient.
- Short-circuiting past an expensive check when an earlier check succeeds.
- Providing fallback conditions in validation logic.
