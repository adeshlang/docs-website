---
id: adl-cli
title: ADL CLI Commands
sidebar_label: CLI Commands
description: Reference for the ADL command-line interface — adesh init, build, run, test, add, remove, update, lock, publish, clean, doctor, and fmt, plus the .adl directory layout, environment variables, and configuration.
---

# ADL CLI Commands

ADL ships as part of the Adesh toolchain. The commands below manage the project lifecycle: scaffolding, building, running, testing, dependency management, lockfile generation, publishing, cleaning, diagnostics, and formatting.

Throughout this page, ADL commands are shown under the toolchain's `adesh` entry point (e.g. `adesh init`); the package-manager layer is also reachable through the standalone `adl` binary, which exposes the same ecosystem commands (`adl new`, `adl install`, `adl publish`, …). Both operate on the same `adesh.adl` manifest and `adesh.lock.adl` lockfile.

---

## Command Overview

| Command | Purpose |
|---|---|
| `adesh init` | Create a new project from a template |
| `adesh build` | Build the project |
| `adesh run` | Run the project |
| `adesh test` | Run tests |
| `adesh add <package>` | Add a dependency |
| `adesh remove <package>` | Remove a dependency |
| `adesh update` | Update dependencies, regenerate lockfile |
| `adesh lock` | Generate/regenerate the lockfile |
| `adesh publish` | Publish to a registry |
| `adesh clean` | Clean build artifacts |
| `adesh doctor` | Diagnose the environment |
| `adesh fmt` | Format ADL files |

Common global flags: `-h/--help`, `-v/--verbose`, `--release`, `--debug`, `--offline`, `--force`, `--dry-run`.

---

## `adesh init` — Create a New Project

Scaffolds a new project and writes an initial `adesh.adl` manifest. The `template` value in `[project]` is chosen from one of five project templates.

```bash
# Interactive/scaffold init in the current directory
adesh init

# Explicit template + name
adesh init app my_app
adesh init lib my_lib
adesh init workspace my_workspace
adesh init plugin my_plugin
adesh init package my_package
```

| Template | Generated layout | Manifest `template` |
|---|---|---|
| `app` | `src/main.adesh` entry point | `"app"` |
| `lib` | `src/lib.adesh` library entry | `"lib"` |
| `workspace` | `packages/` directory + `[workspace]` members | `"workspace"` |
| `plugin` | `src/main.adesh`, native backend defaults | `"plugin"` |
| `package` | `src/main.adesh`, distributable package | `"package"` |

All templates create `src/`, `tests/`, `examples/`, `assets/`, and the `.adl/` state directory, plus a manifest like:

```adl
[project]
name = "my_app"
version = "0.1.0"
template = "app"

[compiler]
backend = "interpreter"
opt-level = "debug"

[scripts]
const build = "default"
const test = "default"
```

> The package manager also exposes `new` as an alias-with-template form: `adl new app myapp` and `adl new lib mylib` create app/library projects in a fresh directory.

---

## `adesh build` — Build the Project

Builds the project according to the `[compiler]` section (backend + opt-level) and the lockfile:

```bash
adesh build            # default profile (manifest [compiler] settings)
adesh build --release  # optimized release mode
adesh build --debug    # debug symbols / intermediate dumps
```

Build behavior is governed by the manifest:

```adl
[compiler]
backend = "llvm"       // interpreter | llvm | native
opt-level = "release"  // debug | release | fast
```

The build resolves the manifest + lockfile first, then prints a build plan (project, mode, backend, opt-level, dependency count, lockfile path, package cache path).

---

## `adesh run` — Run the Project

Builds and executes the project's main entry point:

```bash
adesh run
adesh run -- --port=8080     # pass arguments to the program
adesh run --release          # run optimized
```

In a `[scripts]`-driven project, a named script can be invoked:

```bash
adesh run build      # runs the `build` script from [scripts]
adesh run deploy     # runs the `deploy` script
```

---

## `adesh test` — Run Tests

Executes the project's test suite (tests defined via `test` scripts or the Adesh test runner):

```bash
adesh test
adesh test --release
```

Definition of test scripts lives in the manifest:

```adl
[scripts]
const test = "adesh test"
```

---

## `adesh add <package>` — Add a Dependency

Adds a dependency to the `[dependencies]` section of `adesh.adl`:

```bash
adesh add Crypto ^1.0.0
adesh add HTTP >=2.0.0
adesh add MyLib ../my-lib      # path-style shorthand
```

Effect on the manifest:

```adl
[dependencies]
Crypto = "^1.0.0"
HTTP = ">=2.0.0"
MyLib = { source = "path", location = "../my-lib" }
```

After adding, run `adesh lock` (or `adesh install`) to resolve and lock the new dependency.

---

## `adesh remove <package>` — Remove a Dependency

Removes a dependency from `[dependencies]`:

```bash
adesh remove Crypto
```

```adl
// before
[dependencies]
Crypto = "^1.0.0"
HTTP = "^4.0.0"

// after adesh remove Crypto
[dependencies]
HTTP = "^4.0.0"
```

Regenerate the lockfile afterwards to drop the now-unused entry.

---

## `adesh update` — Update Dependencies

Re-resolves all dependencies to the newest versions that still satisfy the declared requirements, then regenerates `adesh.lock.adl`:

```bash
adesh update
adesh update --dry-run   # preview what would change
adesh update --offline   # only use cached package data
```

`update` respects the ranges you declared: a `^1.0.0` requirement can move to `1.9.x` but never to `2.0.0`.

---

## `adesh lock` — Generate/Regenerate the Lockfile

Solves the manifest and writes `adesh.lock.adl` with the exact resolution of every dependency:

```bash
adesh lock
adesh lock --dry-run    # print the would-be lockfile without writing
```

The lockfile records resolved versions, checksums, sources, features, and transitive relationships, plus an FNV-1a `signature` — see [Lockfile Reference (`adesh.lock.adl`)](./adl-lockfile). Equivalent commands that also regenerate it: `install`, `resolve`, and `restore`.

Example output file:

```adl
lock {
  version = "1"
  generated-at = "2026-07-01T00:00:00Z"
  compiler-version = "0.3.0"
  adl-version = "0.3.0"
  package-id = "my_app"
  dependencies = [
    {
      package-id = "Crypto@1.0.0"
      name = "Crypto"
      version = "1.0.0"
      requirement = "^1.0.0"
      checksum = "1a2b3c4d5e6f7a8b"
      sha256 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
      source = { kind = "registry", location = "official" }
    }
  ]
  signature = "9f5c2a1b8e7d6c4f"
}
```

---

## `adesh publish` — Publish to a Registry

Publishes the current package to a registry:

```bash
adesh login <token>        # authenticate first (stores token in .adl/credentials)
adesh publish              # publish the current package version
adesh publish --dry-run    # preview without publishing
```

Publishing requires:

- A valid manifest (`[project]` with `name` and `version`).
- Logged-in credentials (`.adl/credentials`).

The published artifact (a package tarball plus the sanitized manifest — confidential values stripped) lands in the local registry mirror under `.adl/registry/official/<name>/<version>/`:

```text
.adl/registry/official/my_app/0.1.0/
├── package.tar.gz
└── adesh.adl
```

To unpublish a version:

```bash
adesh unpublish 0.1.0
```

---

## `adesh clean` — Clean Build Artifacts

Removes build artifacts and caches under the project's `.adl/` tree:

```bash
adesh clean
adesh clean --dry-run   # show what would be removed
```

`clean` targets `.adl/artifacts/` (and by extension the derived caches), returning the project to a from-scratch build state without touching the manifest or lockfile.

---

## `adesh doctor` — Diagnose the Environment

Checks the project and toolchain health:

```bash
adesh doctor
```

Reports:

- Project root and `.adl/` directory location
- Manifest and lockfile paths
- Toolchain readiness (compiler, linker availability)

Use `doctor` before filing issues or after a broken install.

---

## `adesh fmt` — Format ADL Files

Formats `adesh.adl` (and any `.adl` file) according to the official ADL style:

```bash
adesh fmt                  # format ADL files in the project
adesh fmt --check          # CI-friendly: exit non-zero if unformatted
adesh fmt --write          # apply changes in place
```

The formatter:

- Normalizes indentation to 2 spaces per nesting level.
- Adds blank lines between sections and before `lock { }`.
- Trims trailing whitespace and ensures the file ends with a newline.
- Preserves comments.

```adl
// before
[project]
name = "my_app"
[compiler]
backend = "interpreter"

// after adesh fmt
[project]
name = "my_app"

[compiler]
backend = "interpreter"
```

---

## Additional Commands

The ecosystem layer ships more commands for inspection, cache, and workspace management (also reachable via `adl`):

| Command | Purpose |
|---|---|
| `adesh tree` | Print the dependency tree |
| `adesh graph` | Print the dependency graph |
| `adesh why <pkg>` | Explain why a package is present |
| `adesh list` | List resolved packages |
| `adesh info` | Show project metadata and lock summary |
| `adesh cache` | Show cache/package store locations |
| `adesh workspace` | Discover/manage workspace members |
| `adesh env` | Show environment paths and config |
| `adesh version` | Print ADL version |

---

## The `.adl` Directory

Every ADL project maintains a `.adl/` state directory (plus derived `adl_modules/` at the root):

```
my_app/
├── adesh.adl
├── adesh.lock.adl
├── src/
└── .adl/
    ├── packages/       # installed package sources
    ├── cache/          # cached metadata and indexes
    ├── registry/       # local registry mirror: official/<name>/<version>/
    ├── git/            # git dependency checkouts
    ├── downloads/      # downloaded archives
    ├── artifacts/      # build artifacts
    └── credentials     # login token (created by adesh login)
```

| Path | Created by | Contents |
|---|---|---|
| `.adl/packages/` | resolve/install | Extracted installed packages |
| `.adl/cache/` | resolve | Cached package metadata |
| `.adl/registry/` | publish/install | Local registry data, `official/<name>/<version>/` |
| `.adl/git/` | git deps | Git dependency checkouts |
| `.adl/downloads/` | registry deps | Downloaded archives before unpacking |
| `.adl/artifacts/` | build | Build outputs (removed by `adesh clean`) |
| `.adl/credentials` | `adesh login` | Authentication token |

---

## Environment Variables and Configuration

ADL respects the same Toolchain environment variables as the Adesh CLI:

| Variable | Description | Default |
|---|---|---|
| `ADESHLANG_HOME` | Custom root for AdeshLang libraries and the package cache | `~/.adeshlang` |
| `ADESHLANG_TOOLCHAIN` | Override for native linker/compiler toolchain paths | auto-detected |
| `ADESH_VERBOSE` | Verbose resolver/command logging | `0` |
| `ADESH_FAST_COMPILE` | Default to fast compile mode | `0` |
| `ADESH_ENABLE_LTO` | Enable link-time optimization in release builds | `0` |
| `ADESH_ENABLE_DCE` | Enable dead-code elimination in the linker | `0` |
| `NO_COLOR` | Disable ANSI colors in CLI output | unset |

Configuration that matters to ADL:

- **Registry name** — set per dependency via `{ source = "registry", location = "<name>" }`; `official` is the default.
- **Offline mode** — `--offline` flag or `ADESH_OFFLINE=1` prevents network access during resolve.
- **Formatter settings** — the `fmt` command's style is fixed (opinionated); IDEs can configure `alignKeys`/`sortSections` via the language server settings (see [ADL Editor Support](./adl-editor-support)).
