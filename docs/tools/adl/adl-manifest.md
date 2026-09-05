---
id: adl-manifest
title: Manifest Reference (adesh.adl)
sidebar_label: Manifest
description: Complete reference for the adesh.adl ADL manifest — every section ([project], [compiler], [dependencies], [scripts], [workspace]), field, dependency form, top-level keyword, and comment syntax with examples.
---

# Manifest Reference (`adesh.adl`)

The **manifest** is the canonical project configuration file that you edit by hand. It lives at the project root as `adesh.adl` and uses the ADL format: `[section]` headers with `key = value` entries.

**Cardinal rule: values are assigned with `=`.** ADL never uses the `key: value` colon syntax found in TOML/JSON/YAML. Every example below uses `=`.

```adl
[project]
name = "my_app"
```

Comments may appear anywhere whitespace is allowed and use either `//` or `#`:

```adl
// A line comment with double slashes
# A line comment with a hash
[project] // trailing comments are allowed too
name = "my_app" # inline comment
```

---

## Global Syntax

- Section headers look like `[name]` and introduce a named block.
- Each `key = value` pair belongs to the section that precedes it.
- Strings are double-quoted; bare identifiers, numbers, booleans, and version requirements may appear unquoted where unambiguous.
- Version requirements (`^1.0.0`, `>=2.0.0`) are written as quoted strings in dependencies, or as bare tokens.
- Inline objects use braces and `=` inside them: `{ source = "path", location = "../lib" }`.
- Arrays use square brackets: `["a", "b"]` or `["packages/*", "tools/cli"]`.

---

## `[project]` — Project Metadata

The `[project]` section is **required** in every manifest. It declares the identity and kind of the project.

| Field | Required | Type | Description |
|---|---|---|---|
| `name` | yes | string | Project name; valid identifier (letters, digits, hyphens, underscores) |
| `version` | yes | semver | Semantic version, `MAJOR.MINOR.PATCH`, e.g. `"0.1.0"` |
| `template` | yes | enum | `"app"`, `"lib"`, `"workspace"`, `"plugin"`, or `"package"` |
| `libs` | no | array&lt;string&gt; | Native libraries to link against (used by native backends) |

Example:

```adl
[project]
name = "my_app"
version = "0.1.0"
template = "app"
libs = ["mylib", "sqlite3"]
```

### `template` values

| Value | Meaning |
|---|---|
| `"app"` | Executable application (`src/main.adesh`) |
| `"lib"` | Reusable library (`src/lib.adesh`) |
| `"workspace"` | Multi-package workspace owner |
| `"plugin"` | Compiler plugin |
| `"package"` | Distributable package |

The template drives what `adesh init` scaffolds (see [ADL CLI Commands](./adl-cli)).

---

## `[compiler]` — Compiler Configuration

The `[compiler]` section is optional and controls how the project is compiled. When absent, the defaults (`interpreter` backend, `debug` opt-level) are used.

| Field | Required | Type | Description |
|---|---|---|---|
| `backend` | no | enum | `"interpreter"`, `"llvm"`, or `"native"` |
| `opt-level` | no | enum | `"debug"`, `"release"`, or `"fast"` |

Example:

```adl
[compiler]
backend = "llvm"
opt-level = "release"
```

### `backend` values

| Value | Description |
|---|---|
| `"interpreter"` | Tree-walking interpreter (default, full feature coverage) |
| `"llvm"` | LLVM-based native compilation |
| `"native"` | Direct native code generation |

### `opt-level` values

| Value | Description |
|---|---|
| `"debug"` | No optimizations, full debug info |
| `"release"` | Full optimizations, no debug info |
| `"fast"` | Fast compilation with basic optimizations |

---

## `[dependencies]` — Dependencies

The `[dependencies]` section lists every external package the project depends on. Each key is the **package name**, and the value is either:

1. a **version-requirement string**, or
2. an **inline object** describing the dependency source and location.

### Version-requirement dependencies

```adl
[dependencies]
Crypto = "^1.0.0"
HTTP = ">=2.0.0"
IO = "~1.2.3"
Math = "*"
Time = "=1.0.0"
DNS = "1.4.0"
```

Version requirements are covered in depth in [Dependency Management](./adl-dependencies).

### Path dependencies

Resolve from a local directory on disk. The `source` kind is `"path"` and `location` is a filesystem path, usually relative to the project root.

```adl
[dependencies]
MyLib = { source = "path", location = "../my-lib" }
Utils = { source = "path", location = "./vendor/utils" }
```

### Git dependencies

Clone from a git repository:

```adl
[dependencies]
MyLib = { source = "git", location = "https://github.com/user/repo" }
Toolkit = { source = "git", location = "git@github.com:user/toolkit.git" }
```

### Registry dependencies

Download from a named registry. The default registry is `"official"`:

```adl
[dependencies]
Crypto = { source = "registry", location = "official" }
HTTP = { source = "registry", location = "official" }
```

### Workspace dependencies

Resolve from a member of the current workspace:

```adl
[dependencies]
MyLib = { source = "workspace", location = "packages/my-lib" }
SharedCore = { source = "workspace", location = "packages/shared-core" }
```

### Mixing forms

All four source kinds can coexist:

```adl
[dependencies]
Crypto = "^1.0.0"                                             // registry requirement
HTTP = { source = "registry", location = "official" }          // explicit registry object
MyLib = { source = "path", location = "../my-lib" }                        // local path
Toolkit = { source = "git", location = "https://github.com/user/toolkit" } // git
SharedCore = { source = "workspace", location = "packages/shared-core" }  // workspace
```

---

## `[scripts]` — Named Scripts

The `[scripts]` section defines named project scripts using **`const`** (fixed) or **`let`** (parameterized) bindings. This is different from plain keys — a script entry is a binding of the form `const <name> = "<command>"`.

```adl
[scripts]
const build = "adesh build"
const test = "adesh test"
const run = "adesh run"
let deploy = "adesh publish --registry official"
```

| Form | Meaning |
|---|---|
| `const <name> = "..."` | Fixed script; the value never changes |
| `let <name> = "..."` | Mutable/parameterized script; can be overridden |

The convenience shortcuts `build`, `test`, and `run` map to `adesh build`, `adesh test`, and `adesh run` respectively, so the default template ships:

```adl
[scripts]
const build = "default"
const test = "default"
```

Run a script with:

```bash
adesh run build
```

`let` bindings are also used inside conditional blocks to vary script values per platform or profile (see below).

---

## `[workspace]` — Workspace Members

The `[workspace]` section declares the members of a multi-package workspace. The `members` field is an array of paths and supports the `/*` glob pattern to include every subdirectory:

```adl
[workspace]
members = ["packages/*", "tools/cli"]
```

| Field | Required | Type | Description |
|---|---|---|---|
| `members` | yes | array&lt;string&gt; | Member paths; glob `/*` expands to all subdirectories with a manifest |

Member paths may be direct (a single package) or globbed:

```adl
[workspace]
members = [
  "packages/*",
  "tools/cli",
  "examples/hello"
]
```

A `[workspace]` project uses `template = "workspace"` in `[project]`:

```adl
[project]
name = "my_workspace"
version = "0.1.0"
template = "workspace"

[workspace]
members = ["packages/*"]
```

Workspace members can then be referenced by other packages with `{ source = "workspace", location = "packages/my-lib" }` or by path.

---

## Top-Level Keywords

In addition to sections, ADL supports a small set of top-level keywords.

### `import`

Import another ADL manifest file, merging its declarations into the current project. Imports may appear multiple times and can appear at the top level (before or between sections):

```adl
import "./shared/dependencies.adl"
import "./profiles/release.adl"

[project]
name = "my_app"
version = "0.1.0"
template = "app"
```

Imports are resolved relative to the importing file, and the ALS treats them as navigable document links.

### `if` / `else` conditionals

Conditional blocks apply configuration only when a condition holds. They are commonly used for platform-, target-, or profile-specific configuration:

```adl
if platform == "windows" {
  [dependencies]
  WinAPI = "^1.0.0"
}

if platform == "linux" {
  [dependencies]
  LinuxAPI = "^1.0.0"
}

if debug {
  [compiler]
  opt-level = "debug"
} else {
  [compiler]
  opt-level = "release"
}
```

Typical conditions:

| Condition | Meaning |
|---|---|
| `platform == "windows"` | Only on Windows |
| `platform == "linux"` | Only on Linux |
| `target == "wasm"` | Only when targeting WebAssembly |
| `debug` / `release` | Profile-specific configuration |
| `else` | Fallback branch |

Inside a conditional you may put sections, fields, dependencies, and `let`/`const` bindings:

```adl
if debug {
  [compiler]
  backend = "interpreter"
  opt-level = "debug"

  [scripts]
  let test = "adesh test --verbose"
} else {
  [compiler]
  backend = "native"
  opt-level = "release"
}
```

---

## Comments

Both `//` and `#` introduce a comment that runs to the end of the line. Comments are ignored by the parser and the formatter preserves them.

```adl
// A double-slash comment
# A hash comment

[project]
name = "my_app" // trailing double-slash comment
version = "0.1.0" # trailing hash comment
template = "app"  // template controls what `adesh init` scaffolds
```

Block comments `/* ... */` are also recognized for highlighting purposes, though `//` and `#` are the canonical line forms.

---

## Full Annotated Example

The manifest below exercises every section and keyword, with a comment explaining each part:

```adl
// =====================================================================
// adesh.adl — annotated example manifest
// Shows every section, all dependency forms, scripts, and a conditional
// =====================================================================

// Import shared dependency declarations from another ADL file.
import "./shared/dependencies.adl"

// ---------------------------------------------------------------------
// [project] — required. Identity of the project.
// ---------------------------------------------------------------------
[project]
name = "my_app"            // required: project name (letters, digits, -, _)
version = "0.1.0"          // required: semantic version MAJOR.MINOR.PATCH
template = "app"           // required: app | lib | workspace | plugin | package
libs = ["mylib"]           // optional: native libraries to link

// ---------------------------------------------------------------------
// [compiler] — optional. Controls backend and optimization.
// ---------------------------------------------------------------------
[compiler]
backend = "interpreter"    // interpreter | llvm | native
opt-level = "debug"        // debug | release | fast

// ---------------------------------------------------------------------
// [dependencies] — optional. Every external package.
// ---------------------------------------------------------------------
[dependencies]
Crypto = "^1.0.0"                                       // version requirement
HTTP = ">=2.0.0"                                        // range requirement
IO = "~1.2.3"                                           // tilde (patch-range)
Math = "*"                                              // any version
Time = "=1.0.0"                                         // exact version
DNS = "1.4.0"                                           // bare semver works too
MyLib = { source = "path", location = "../my-lib" }     // path dependency
Toolkit = { source = "git", location = "https://github.com/user/toolkit" }   // git dependency
SharedCore = { source = "workspace", location = "packages/shared-core" }    // workspace member
RegistryDep = { source = "registry", location = "official" }                // explicit registry

// ---------------------------------------------------------------------
// [scripts] — optional. Named scripts via const/let bindings.
// ---------------------------------------------------------------------
[scripts]
const build = "default"     // fixed script binding
const test = "default"      // fixed script binding
let deploy = "adesh publish --registry official"  // parameterized binding

// ---------------------------------------------------------------------
// [workspace] — optional. Multi-package members, with glob support.
// ---------------------------------------------------------------------
[workspace]
members = ["packages/*", "tools/cli"]   // every package under packages/, plus tools/cli

// ---------------------------------------------------------------------
// Conditional configuration — platform-specific dependencies.
// ---------------------------------------------------------------------
if platform == "windows" {
  [dependencies]
  WinAPI = "^1.0.0"        // only present on Windows builds
}

if platform == "linux" {
  [dependencies]
  LinuxAPI = "^1.0.0"      // only present on Linux builds
}

// ---------------------------------------------------------------------
// Conditional configuration — profile-specific compiler settings.
// ---------------------------------------------------------------------
if debug {
  [compiler]
  backend = "interpreter"  // fast iteration in debug
  opt-level = "debug"
} else {
  [compiler]
  backend = "native"       // optimized native builds in release
  opt-level = "release"
}
```

This annotated manifest is also what the VS Code snippet `manifest` and the ALS "Generate full manifest template" code action produce, expanded with real values.
