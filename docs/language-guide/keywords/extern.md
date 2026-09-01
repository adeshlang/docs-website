---
id: extern
title: extern
sidebar_label: extern
description: The `extern` keyword declares external/FFI linkage.
---

# `extern`

The `extern` keyword declares that a function or symbol has external linkage, typically pointing to an implementation provided by native code (C/C++) through the FFI layer. AdeshLang's FFI also uses the special `$cImport` directive for header imports.

---

## Syntax & Example

```adesh
$cImport "stdio.h";

extern fn printf(fmt: *u8, ...) -> i32;

fn main() {
    printf("Hello from C\n");
}
```

---

## Use Cases

- Declaring native functions to call from AdeshLang via FFI.
- Linking against existing C libraries.
- Marking symbols resolved by the linker rather than defined in AdeshLang source.

See also: [FFI](../../tools/ffi).
