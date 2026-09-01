---
id: decorator
title: decorator
sidebar_label: decorator
description: The `decorator` keyword declares or attaches a decorator.
---

# `decorator`

The `decorator` keyword declares a decorator or attaches one to a declaration. Decorators are reusable compile-time transformations that modify or augment declarations (functions, types, members). AdeshLang also supports the `@name` symbol form for applying decorators.

---

## Syntax & Example

```adesh
decorator fn logged(target) {
    // wrap/transform the target declaration
}

@logged
fn process(data: string) {
    print(data);
}
```

---

## Use Cases

- Adding cross-cutting behavior (logging, caching, validation) to declarations.
- Reusing transformations across many declarations without boilerplate.
- Combining with the `@` symbol form for concise application.

See also: [Decorators](../../advanced/decorators).
