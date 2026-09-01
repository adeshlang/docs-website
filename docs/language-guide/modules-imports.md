---
id: modules-imports
title: Modules and Imports
description: How to organize code into modules, import namespaces and symbols, and reuse standard library functionality in AdeshLang.
sidebar_label: Modules & Imports
---

# Modules and Imports

As programs become larger, it is not practical to keep everything in a single file. AdeshLang supports modular organization so code can be separated into files, reused across projects, and composed cleanly.

This page explains the common import patterns, the structure of module usage, and how to think about reusable code in a real project.

---

## Why modules matter

Modules help with:

- separating responsibilities
- reusing functions and data structures
- organizing library code
- keeping larger codebases maintainable
- hiding implementation details behind a clear interface

A module in AdeshLang is typically a source file that exports reusable names and can then be imported elsewhere.

---

## Import basics

The general import pattern looks like this:

```adesh
import "./helpers.adesh" as Helpers;
```

This imports the file as a namespace named `Helpers`, so its exported contents are accessed through that namespace.

```adesh
let total = Helpers.format_currency(42);
print(total);
```

---

## Local file modules

Importing a local file is the standard way to split code into reusable units.

```adesh
import "./math_utils.adesh" as MathUtils;

let area = MathUtils.circle_area(10);
print(area);
```

### Example module

`math_utils.adesh`:

```adesh
fn circle_area(radius: f64): f64 {
    return 3.14159 * radius * radius;
}
```

Then in another file:

```adesh
import "./math_utils.adesh" as MathUtils;

print(MathUtils.circle_area(3));
```

This pattern keeps your business logic and helper functions separate.

---

## Destructured imports

If you want to import only specific items, you can pull them directly into local scope.

```adesh
import { sqrt, pow, PI } from Math;

print(sqrt(25.0));
print(PI * pow(3, 2));
```

This is convenient when you want direct access to a few API functions without a namespace prefix.

---

## Builtin and standard library imports

AdeshLang exposes a set of standard libraries and namespaces, such as:

- `Math`
- `FS`
- `Path`
- `Process`
- `JSON`
- `IO`
- `Time`
- `Regex`
- `Env`
- `Random`
- `Collections`
- `Crypto`
- `Encoding`
- `Compression`
- `Net`
- `URL`
- `DNS`

### Example

```adesh
import Math;
import DNS;

print(Math.sqrt(16));
let ips = DNS.resolve("google.com");
```

The standard library API is designed to make common system and application tasks easier without adding heavy syntax overhead.

---

## Namespace import pattern

A namespace import gives structure to a module’s exported API.

```adesh
import Net;

let result = Net.request("https://example.com");
print(result);
```

This is often the preferred style for larger libraries because it keeps names clear and avoids collisions.

---

## Relative imports

Relative imports are resolved from the current file location.

```adesh
import "./helpers.adesh" as Helpers;
import "../common/config.adesh" as Config;
```

### Good practice

- keep file-level imports predictable
- avoid deep relative chains when a clearer module structure is possible
- prefer a consistent directory layout for project modules

---

## Exporting module members

A module usually exposes the names it wants to share with other code.

```adesh
fn add(a: i64, b: i64): i64 {
    return a + b;
}

fn multiply(a: i64, b: i64): i64 {
    return a * b;
}
```

The imported file then exposes those functions to callers when the module is loaded.

---

## API-style reference

| Import style | Syntax | Use case |
|---|---|---|
| Namespace import | `import Math;` | Use a library as a named namespace |
| File import | `import "./lib.adesh" as Lib;` | Reuse a local module |
| Destructured import | `import { sqrt, PI } from Math;` | Bring a few members into scope |
| Mixed usage | `Lib.fn()` or `sqrt()` | Either structured or direct access |

---

## Common usage patterns

### 1. Helper modules

```adesh
import "./strings.adesh" as Strings;

print(Strings.uppercase("hello"));
```

### 2. Shared configuration

```adesh
import "./config.adesh" as Config;

print(Config.app_name);
```

### 3. Standard library access

```adesh
import Math;
import Env;

let x = Math.sqrt(9);
let user = Env.get("USER");
```

---

## Import rules and semantics

A good mental model is:

- import brings a module or namespace into scope
- exported names become accessible through that namespace or directly
- module boundaries help reduce global clutter
- local modules are typically resolved relative to the importing file

This mirrors the way modern languages manage code organization: modules represent a unit of code, imports define access, and names stay explicit.

---

## Best practices

- put related utilities in their own module
- use namespace imports for bigger libraries
- use destructuring only for a small number of selected APIs
- avoid circular dependency chains when possible
- keep files and import paths consistent across the project

---

## Related examples and source references

### Examples

- project examples under `examples/modules/`
- project example files and standard library usage patterns in `examples/stdlib/`

### Source references

The module system and import mechanics are implemented in the compiler frontend and runtime loader. If you want to go deeper, inspect the project source tree around:

- `src/main.rs`
- `src/frontend/`
- `src/runtime/`
- `src/stdlib/`

This gives you a direct view of how source files are discovered, parsed, and bound to runtime APIs.

---

## Summary

Modules and imports are how AdeshLang scales beyond tiny scripts. They let you split code into clear units, reuse functions and libraries, and build larger programs without mixing unrelated responsibilities into one file.

The most important patterns are:

- namespace imports for libraries
- file imports for project modules
- destructured imports for a few specific symbols
- clear and maintainable relative paths

Once you understand imports, the language becomes much easier to structure and extend over time.

