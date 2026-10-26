---
id: adl-dependencies
title: Dependency Management
sidebar_label: Dependencies
description: How dependency management works in ADL — version requirements (^, ~, >=, <=, >, <, =, *, any), semantic versioning, path/git/registry/workspace sources, conditional and multi-target dependencies, standard library packages, resolution, and best practices.
---

# Dependency Management

Dependencies are the heart of ADL. This page explains everything you need to declare, resolve, and reason about them: version requirements and semantic versioning, the four dependency source kinds, conditional and multi-target declarations, the standard libraries, and how resolution produces the lockfile.

All examples use ADL's mandatory `key = value` syntax — **never colon syntax**.

---

## Version Requirements

A **version requirement** is a string describing the range of versions a dependency declaration accepts. Requirements appear as the value of a dependency key:

```adl
[dependencies]
Crypto = "^1.0.0"
```

### The requirement operators

| Requirement | Meaning | Example match |
|---|---|---|
| `*` | Any version (wildcard) | `1.0.0`, `2.5.3`, `0.1.0` |
| `any` | Any version (alias of `*`) | `1.0.0`, `2.5.3` |
| `=1.2.3` | Exact version only | only `1.2.3` |
| `^1.2.3` | Caret: compatible with `1.2.3` | `>=1.2.3 <2.0.0` |
| `~1.2.3` | Tilde: same minor, patch-range | `>=1.2.3 <1.3.0` |
| `>=1.2.3` | Greater than or equal | `1.2.3`, `2.0.0` |
| `>1.2.3` | Strictly greater than | `1.2.4`, `2.0.0` |
| `<=1.2.3` | Less than or equal | `1.2.3`, `0.9.0` |
| `<1.2.3` | Strictly less than | `1.2.2`, `0.9.0` |
| `1.2.3` | Bare semver (exact) | only `1.2.3` |
| `>=1.0.0, <2.0.0` | Comma range: both bounds | `1.5.0`, `1.9.9` |

### Examples

```adl
[dependencies]
A = "^1.0.0"                            // compatible with 1.x, at least 1.0.0
B = "~1.2.3"                            // 1.2.x, at least 1.2.3
C = ">=2.0.0"                           // any 2.0.0 or newer
D = "<=1.5.0"                           // at most 1.5.0
E = ">0.9.0"                            // strictly newer than 0.9.0
F = "<2.0.0"                            // strictly older than 2.0.0
G = "=1.0.0"                            // exactly 1.0.0
H = "*"                                 // anything
I = "any"                               // anything (alias)
J = ">=1.0.0, <2.0.0"                   // bounded range
```

### Caret `^` semantics (semver-compatible ranges)

The caret operator allows updates that do not break the versioning contract:

| Requirement | Allowed range | Why |
|---|---|---|
| `^1.2.3` | `>=1.2.3 <2.0.0` | major > 0: only same major |
| `^0.2.3` | `>=0.2.3 <0.3.0` | major = 0, minor > 0: only same minor |
| `^0.0.3` | `>=0.0.3 <0.0.4` | major = minor = 0: only same patch |

### Tilde `~` semantics

The tilde operator pins the minor version and allows patch updates:

| Requirement | Allowed range |
|---|---|
| `~1.2.3` | `>=1.2.3 <1.3.0` |
| `~1.2` | `>=1.2.0 <1.3.0` |
| `~1` | `>=1.0.0 <2.0.0` |

### Bare semver

A bare `MAJOR.MINOR.PATCH` value (e.g. `1.2.3`) is treated as an exact requirement, equivalent to `=1.2.3`.

```adl
[dependencies]
Time = "1.4.0"    // equivalent to =1.4.0
```

---

## Semantic Versioning

ADL versions follow **semantic versioning (semver)**: `MAJOR.MINOR.PATCH`.

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
1.0.0
0.2.3-alpha.1
2.1.0+build.42
```

- **MAJOR** increments on incompatible API changes (`1.0.0` → `2.0.0`).
- **MINOR** increments on backward-compatible new functionality (`1.0.0` → `1.1.0`).
- **PATCH** increments on backward-compatible bug fixes (`1.0.0` → `1.0.1`).
- **PRERELEASE** (`-alpha.1`, `-beta.2`, `-rc.1`) marks unstable releases; prerelease versions sort *before* their release (per semver rules).
- **BUILD** (`+build.42`) is build metadata that does not affect precedence.

The project's own `version` in `[project]` must be a valid semver, and dependency `requirement`/`version` fields in the lockfile are validated the same way:

```adl
[project]
name = "my_app"
version = "0.1.0"        // valid semver
```

Invalid versions (`"1.0"`, `"1.0.0.0"`, `"abc"`) produce ADL validation errors — see [ADL Validation & Diagnostics](./adl-validation).

---

## Dependency Sources

Beyond plain version requirements, ADL supports four explicit source kinds. Each is an inline object `{ source = "<kind>", location = "<...>" }` — note the `=` inside the object too.

### Path dependencies

A path dependency resolves from a local directory. Use it for sibling libraries, vendored code, or packages that don't need publishing.

```adl
[dependencies]
MyLib = { source = "path", location = "../my-lib" }
Utils = { source = "path", location = "./vendor/utils" }
```

- `location` is a filesystem path, usually relative to the project root.
- Path dependencies are ideal for monorepos and local development.

### Git dependencies

A git dependency clones a repository at resolution time.

```adl
[dependencies]
Toolkit = { source = "git", location = "https://github.com/user/toolkit" }
Experimental = { source = "git", location = "git@github.com:user/experimental.git" }
```

- `location` is any git URL: HTTPS, SSH, or a local git remote path.
- Clones are cached under `.adl/git/` so the lockfile stays reproducible.

### Registry dependencies

A registry dependency downloads a published package from a named registry. The default and best-known registry is `"official"`.

```adl
[dependencies]
Crypto = { source = "registry", location = "official" }
HTTP = { source = "registry", location = "official" }
```

Version requirements can be attached to registry objects by combining forms — a plain requirement string is equivalent to `{ source = "registry", location = "official" }`:

```adl
[dependencies]
Crypto = "^1.0.0"                                       // shorthand
Crypto = { source = "registry", location = "official" } // explicit
```

### Workspace dependencies

A workspace dependency resolves from a member of the current `[workspace]`:

```adl
[dependencies]
SharedCore = { source = "workspace", location = "packages/shared-core" }
```

- `location` is the member path relative to the workspace root.
- Workspace deps always resolve to the same version as the member's own `[project]` `version`.
- They never hit the network — great for cross-package development inside a monorepo.

---

## Conditional Dependencies

Use top-level `if`/`else` blocks to make dependencies conditional on platform, target, profile, or any condition ADL evaluates:

```adl
// Platform-specific dependencies
if platform == "windows" {
  [dependencies]
  WinAPI = "^1.0.0"
}

if platform == "linux" {
  [dependencies]
  LinuxAPI = "^1.0.0"
}

// Target-specific dependencies
if target == "wasm" {
  [dependencies]
  WasmBindings = "^0.4.0"
}

// Profile-specific dependencies
if debug {
  [dependencies]
  DebugUtils = "~0.4.0"
} else {
  [dependencies]
  Profiler = "^2.0.0"
}
```

### Multi-target dependencies

Conditionals are the recommended way to manage multi-target dependency sets — one manifest, many targets:

```adl
[project]
name = "my_app"
version = "0.1.0"
template = "app"

[compiler]
backend = "native"
opt-level = "release"

// Common dependencies apply everywhere.
[dependencies]
Crypto = "^1.0.0"
HTTP = "^4.0.0"

// Desktop targets.
if platform == "windows" {
  [dependencies]
  WinAPI = "^1.0.0"
}

if platform == "linux" || platform == "macos" {
  [dependencies]
  PosixAPI = "^1.0.0"
}

// Web target.
if target == "wasm" {
  [dependencies]
  WasmBindings = "^0.4.0"
}
```

---

## Standard Libraries

Adesh ships a set of standard library packages installable through ADL. Add them like any other dependency:

```adl
[dependencies]
Crypto = "^1.0.0"
HTTP = "^4.0.0"
IO = "^1.0.0"
Math = "^1.0.0"
Time = "^1.0.0"
Regex = "^1.0.0"
Encoding = "^1.0.0"
DNS = "^1.0.0"
```

| Package | Typical requirement | Purpose |
|---|---|---|
| `Crypto` | `^1.0.0` | Cryptographic primitives and hashing |
| `HTTP` | `^4.0.0` | HTTP client/server |
| `IO` | `^1.0.0` | Filesystem and stream I/O |
| `Math` | `^1.0.0` | Mathematical functions and constants |
| `Time` | `^1.0.0` | Time, dates, and durations |
| `Regex` | `^1.0.0` | Regular expressions |
| `Encoding` | `^1.0.0` | Text and binary encodings |
| `DNS` | `^1.0.0` | Domain name resolution |

The editor snippets (`dep-crypto`, `dep-http`, `dep-io`, `dep-math`, `dep-time`, `dep-regex`, `dep-encoding`, `dep-dns`) insert these exact declarations for you.

---

## Resolution and the Lockfile

### How resolution works

1. `adesh lock` (or `adesh install`, `adesh update`, `adesh resolve`, `adesh restore`) reads `adesh.adl`.
2. The resolver expands every declaration — version requirement, path, git, registry, workspace — into candidate versions.
3. It solves the full dependency graph, including **transitive** dependencies (dependencies of dependencies).
4. It picks the best matching version for each requirement and writes the result to `adesh.lock.adl` as locked entries.
5. It populates `.adl/packages/` (and `adl_modules/`) with the resolved package content.

### What the lockfile records

For every dependency (direct and transitive), the lockfile stores:

```adl
lock {
  dependencies = [
    {
      package-id = "Crypto@1.0.0"   // graph identity
      name = "Crypto"
      version = "1.0.0"             // exact resolved version
      requirement = "^1.0.0"        // range that produced it
      checksum = "1a2b3c4d5e6f7a8b"
      sha256 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
      source = { kind = "registry", location = "official" }
      transitive = ["Hash@0.9.1"]   // its transitive children
    }
  ]
}
```

### Inspecting the resolved graph

The CLI offers graph-introspection commands:

```bash
adesh tree     # hierarchical dependency tree
adesh graph    # full dependency graph
adesh why <pkg>  # why is this package present?
```

### Keeping the lockfile fresh

- `adesh lock` / `adesh install` — generate or regenerate the lockfile from the manifest.
- `adesh update` — re-resolve against newest compatible versions and regenerate.
- `adesh remove <pkg>` then `adesh lock` — remove a dependency and its now-unused transitive entries.

---

## Common Patterns and Best Practices

### 1. Commit the lockfile

`adesh.lock.adl` ensures reproducibility. Commit it and let CI use it verbatim.

### 2. Prefer caret for libraries, exact for applications

```adl
// Library: allow compatible upgrades
[dependencies]
Crypto = "^1.0.0"

// Application: pin precisely
[dependencies]
Time = "=1.4.0"
```

### 3. Use path deps during development, registry at release

```adl
// Local development
MyLib = { source = "path", location = "../my-lib" }

// Release (switch to registry)
MyLib = "^1.2.0"
```

The lockfile makes switching painless — resolve once per form.

### 4. Keep secrets out of the manifest

Values whose keys contain `token`, `secret`, `password`, `api_key`, etc. are automatically moved to the lockfile's `confidential` block. Never hardcode real credentials in `adesh.adl`; rely on the auto-redaction instead.

### 5. Scope platform-specific deps with conditionals

Keep one manifest for all targets instead of forking files:

```adl
if platform == "windows" {
  [dependencies]
  WinAPI = "^1.0.0"
}
```

### 6. Validate with the language server

Run validation as you type (ADL001–ADL013 diagnostics) or on the command line so bad requirements surface immediately — see [ADL Validation & Diagnostics](./adl-validation).

---

## Quick Reference Table

| You want to... | Write |
|---|---|
| Any version | `Pkg = "*"` |
| Exact version | `Pkg = "=1.2.3"` |
| Compatible with 1.x | `Pkg = "^1.2.3"` |
| Patch updates only | `Pkg = "~1.2.3"` |
| Minimum version | `Pkg = ">=1.2.3"` |
| Bounded range | `Pkg = ">=1.0.0, <2.0.0"` |
| Local directory | `Pkg = { source = "path", location = "../lib" }` |
| Git repository | `Pkg = { source = "git", location = "https://github.com/user/repo" }` |
| Official registry | `Pkg = { source = "registry", location = "official" }` |
| Workspace member | `Pkg = { source = "workspace", location = "packages/x" }` |
| Platform-specific | `if platform == "windows" { [dependencies] WinAPI = "^1.0.0" }` |
