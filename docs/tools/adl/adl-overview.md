---
id: adl-overview
title: ADL Package Manager
sidebar_label: Overview
description: Overview of ADL (Adesh Package Manager) — the package manifest and dependency management format for the Adesh programming language, including the adesh.adl manifest, adesh.lock.adl lockfile, and the .adl project directory layout.
---

# ADL Package Manager

**ADL (Adesh Package Manifest)** is the package management format for the Adesh programming language. Think of it as Adesh's answer to `npm`/`package.json` (Node.js) and `cargo`/`Cargo.toml` (Rust): a declarative, project-local file format that describes what a project is, how it should be compiled, and which external packages it depends on.

This guide is the entry point into the ADL documentation set. Use it to understand the format at a high level, then dive into the reference pages for details.

---

## What is ADL?

ADL is a lightweight, TOML-like configuration format defined by the Adesh toolchain. It is:

- **Declarative** — you describe *what* you want (project metadata, dependencies, compiler settings), not *how* to fetch or build it.
- **Project-local** — all package state lives inside your project directory under `.adl/`, so projects remain self-contained and reproducible.
- **Deterministic** — a generated lockfile records the exact resolved version of every dependency, so builds are reproducible across machines and over time.
- **Secret-safe** — sensitive values (tokens, passwords, API keys) are automatically stripped from the manifest and stored in the lockfile instead.

ADL files are plain text and use a simple `key = value` syntax. **The `=` sign is mandatory — ADL never uses the TOML/JSON colon form (`key: value`)**, and code examples in this documentation always use `=`.

```adl
// adesh.adl — comments start with // or #
[project]
name = "my_app"
version = "0.1.0"
template = "app"
```

---

## The Two File Types

Every ADL-managed project uses two files at its root:

| File | Purpose | Who writes it |
|---|---|---|
| `adesh.adl` | The **manifest** — hand-edited project configuration | You (and `adesh init`) |
| `adesh.lock.adl` | The **lockfile** — machine-generated dependency snapshot | `adesh`, regenerated on install/update |

### `adesh.adl` — the manifest

The manifest is the canonical project configuration. It declares the project identity, compiler settings, dependencies, scripts, and workspace layout. It uses `[section]` headers and `key = value` pairs:

```adl
[project]
name = "my_app"
version = "0.1.0"
template = "app"

[compiler]
backend = "interpreter"
opt-level = "debug"

[dependencies]
Crypto = "^1.0.0"
HTTP = "^4.0.0"
```

### `adesh.lock.adl` — the lockfile

The lockfile is generated from the manifest by the resolver. It records the **exact** version, integrity checksum, and source of every dependency (including transitive ones), plus a signature that detects tampering:

```adl
lock {
  version = "1"
  generated-at = "2026-07-01T00:00:00Z"
  compiler-version = "0.4.0"
  adl-version = "0.4.0"
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

Commit `adesh.lock.adl` to version control. It is what makes builds reproducible.

---

## ADL vs `package.json` / `Cargo.toml`

ADL occupies the same role as Node.js `package.json`+`package-lock.json` and Rust `Cargo.toml`+`Cargo.lock`, but with its own spin:

| Capability | ADL (`adesh.adl`) | `package.json` | `Cargo.toml` |
|---|---|---|---|
| Syntax | `key = value` (own format) | JSON | TOML |
| Manifest file | `adesh.adl` | `package.json` | `Cargo.toml` |
| Lockfile | `adesh.lock.adl` | `package-lock.json` | `Cargo.lock` |
| Registry deps | `{ source = "registry", location = "official" }` | semver range string | `"1.0" = "1.0"` |
| Git deps | `{ source = "git", location = "https://…" }` | `git+https://…` URLs | `{ git = "…", tag = "…" }` |
| Path deps | `{ source = "path", location = "../lib" }` | `file:../lib` | `{ path = "../lib" }` |
| Workspace deps | `{ source = "workspace", location = "packages/x" }` | npm workspaces | workspace inheritance |
| Scripts | `[scripts]` with `const`/`let` bindings | `"scripts"` object | no built-in equivalent |
| Conditional deps | `if`/`else` blocks in-file | platform-specific optional deps | target-specific deps |
| Confidential secrets | auto-stripped into lockfile | `.npmrc`/env vars | no built-in equivalent |
| Compiler config | `[compiler]` backend + opt-level | build scripts | `[profile]` tables |

Unlike `package.json` (which is strict JSON) and `Cargo.toml` (which is TOML), ADL is a **purpose-built format**: it understands semantic versions, version requirements, dependency sources, workspace members, and secrets natively without translation layers.

---

## The `.adl` Directory

Every ADL project owns a hidden `.adl/` directory at its root, created automatically by `adesh init`. It keeps *all* package-manager state project-local — no global `node_modules`-style surprises:

```text
my_project/
├── adesh.adl            # manifest (you edit this)
├── adesh.lock.adl       # lockfile (generated)
├── src/
│   └── main.adesh       # source code
└── .adl/                # package-manager state
    ├── packages/        # installed package sources
    ├── cache/           # cached package metadata and indexes
    ├── registry/        # local registry mirror data (official/<name>/<version>/)
    ├── git/             # cloned git dependency checkouts
    ├── downloads/       # downloaded archives before extraction
    └── artifacts/       # build artifacts
```

| Subdirectory | Contents |
|---|---|
| `.adl/packages/` | Extracted, ready-to-use copies of installed packages |
| `.adl/cache/` | Cached registry metadata and dependency indexes |
| `.adl/registry/` | Local registry storage, e.g. `registry/official/<name>/<version>/` |
| `.adl/git/` | Git dependency checkouts keyed by checksum |
| `.adl/downloads/` | Downloaded package archives before they are unpacked |
| `.adl/artifacts/` | Build outputs produced by `adesh build` |

The toolchain also maintains a `credentials` file inside `.adl/` when you log in with `adesh login`:

```text
.adl/credentials
```

```adl
token = "your-registry-token"
```

The layout is intentionally symmetrical with the lockfile: every locked dependency maps back to one directory under `.adl/`, which is how `adesh restore` and `adesh clean` stay simple and predictable.

---

## A Minimal End-to-End Example

```bash
# 1. Scaffold a new application
adesh init
# or: adl new app my_app

# 2. Add a dependency
adesh add Crypto ^1.0.0

# 3. Resolve and write the lockfile
adesh lock

# 4. Build and run
adesh build
adesh run
```

`adesh.adl` afterwards:

```adl
[project]
name = "my_app"
version = "0.1.0"
template = "app"

[compiler]
backend = "interpreter"
opt-level = "debug"

[dependencies]
Crypto = "^1.0.0"
```

---

## Where to Go Next

- **Manifest reference** — every section and field of `adesh.adl`: [Manifest Reference (`adesh.adl`)](./adl-manifest)
- **Lockfile reference** — every field inside `lock { }`: [Lockfile Reference (`adesh.lock.adl`)](./adl-lockfile)
- **Dependency management** — version requirements, sources, and best practices: [Dependency Management](./adl-dependencies)
- **CLI commands** — `adesh init`, `add`, `build`, `lock`, and more: [ADL CLI Commands](./adl-cli)
- **Editor support** — VS Code, Neovim, Helix, Emacs, Sublime Text: [ADL Editor Support](./adl-editor-support)
- **Validation & diagnostics** — the ADL001–ADL013 error codes and quick fixes: [ADL Validation & Diagnostics](./adl-validation)
