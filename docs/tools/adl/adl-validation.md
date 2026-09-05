---
id: adl-validation
title: ADL Validation & Diagnostics
sidebar_label: Validation
description: Reference for ADL validation — the ADL001 through ADL013 diagnostic error codes with severity, trigger examples, and available code actions/quick fixes, plus JSON Schema validation in VS Code.
---

# ADL Validation & Diagnostics

ADL files are validated on the fly by the **Adesh Language Server (ALS)** and structurally by the **JSON Schema** in VS Code. Together they catch typos, malformed values, missing required fields, and lockfile tampering before they reach the resolver.

This page is the complete reference for the diagnostic error codes — **ADL001 through ADL013** — including severity, triggers, examples, and the quick fixes available for each.

---

## How Validation Works

- **ALS diagnostics** run when you open or type in an `adesh.adl` or `adesh.lock.adl` file. Manifest files and lockfiles are validated with different rules (the manifest has sections and required fields; the lockfile has the `lock { }` block and dependency entries).
- **Severity** — each diagnostic is either an **ERROR** (blocking — the file is invalid) or a **WARNING** (advisory — worth fixing, but the file can still be processed).
- **Code** — every diagnostic carries an `ADL0xx` code so you can filter, ignore, or test against it.
- **Quick fixes** — ALS offers code actions for the most common errors (missing sections, missing fields, invalid enum values, and full-template generation).

Errors are reported against the exact line (and, for value problems, the exact value range) that caused them.

---

## Error Code Reference

### Manifest diagnostics (applied to `adesh.adl`)

| Code | Name | Severity |
|---|---|---|
| [ADL001](#adl001-unknown-section) | Unknown section | WARNING |
| [ADL002](#adl002-duplicate-section) | Duplicate section | ERROR |
| [ADL003](#adl003-duplicate-key) | Duplicate key | ERROR |
| [ADL004](#adl004-invalid-enum-value) | Invalid enum value | ERROR |
| [ADL005](#adl005-invalid-semantic-version) | Invalid semantic version | ERROR |
| [ADL006](#adl006-invalid-version-requirement) | Invalid version requirement | WARNING |
| [ADL007](#adl007-missing-required-section) | Missing required section | ERROR |
| [ADL008](#adl008-missing-required-field) | Missing required field | ERROR |

### Lockfile diagnostics (applied to `adesh.lock.adl`)

| Code | Name | Severity |
|---|---|---|
| [ADL010](#adl010-missing-required-dependency-field) | Missing required dependency field | WARNING |
| [ADL011](#adl011-unknown-key-in-dependency-entry) | Unknown key in dependency entry | WARNING |
| [ADL012](#adl012-unknown-key-in-lock-block) | Unknown key in lock block | WARNING |
| [ADL013](#adl013-duplicate-key-in-lock-block) | Duplicate key in lock block | ERROR |

> **ADL009** is reserved and currently unused — it is not emitted. All other codes in the ADL001–ADL013 range are documented below.

---

## ADL001: Unknown Section

**Severity:** WARNING

**Trigger:** a `[section]` header is not one of the known sections (`project`, `compiler`, `dependencies`, `scripts`, `workspace`).

**Example:**

```adl
[project]
name = "my_app"
version = "0.1.0"
template = "app"

[packaging]        // unknown section -> ADL001
output = "bin"
```

**Message:** `Unknown section `[packaging]`. Known sections: project, compiler, dependencies, scripts, workspace`

**Quick fix:** none directly (rename the section yourself, or use `adesh fmt` — typos are usually the culprit). The completion list shows the five valid section names.

---

## ADL002: Duplicate Section

**Severity:** ERROR

**Trigger:** the same `[section]` appears more than once.

**Example:**

```adl
[project]
name = "my_app"
version = "0.1.0"
template = "app"

[project]            // duplicate -> ADL002
name = "other"
```

**Message:** `Duplicate section `[project]``

**Quick fix:** none directly. Merge the entries into a single section and delete the duplicate header — the second section's keys would otherwise be flagged too.

---

## ADL003: Duplicate Key

**Severity:** ERROR

**Trigger:** the same key is defined twice within one section.

**Example:**

```adl
[project]
name = "my_app"
version = "0.1.0"
template = "app"
name = "my_other_name"    // duplicate key -> ADL003
```

**Message:** `Duplicate key `name` in section `[project]``

**Quick fix:** none directly. Remove or rename the second key — ADL keys are unique per section.

---

## ADL004: Invalid Enum Value

**Severity:** ERROR

**Trigger:** a value must be one of a fixed set (enum), and the current value isn't in it. Applies to `template`, `backend`, `opt-level`, and lockfile `profile`/`source.kind` values.

**Example:**

```adl
[project]
name = "my_app"
version = "0.1.0"
template = "executable"    // invalid -> ADL004; allowed: app, lib, workspace, plugin, package
```

**Message:** `Invalid value `executable` for `template`. Allowed: app, lib, workspace, plugin, package`

**Quick fix:** yes — one action per allowed value, e.g. **"Use \"app\" for `template`"**, **"Use \"lib\" for `template`"**, and so on. Pick the one you meant and the value is replaced.

Enum fields and their allowed values:

| Field | Allowed values |
|---|---|
| `project.template` | `app`, `lib`, `workspace`, `plugin`, `package` |
| `compiler.backend` | `interpreter`, `llvm`, `native` |
| `compiler.opt-level` | `debug`, `release`, `fast` |
| lockfile `profile` | `debug`, `release`, `fast` |
| lockfile `source.kind` | `registry`, `git`, `path`, `local`, `workspace` |

---

## ADL005: Invalid Semantic Version

**Severity:** ERROR

**Trigger:** a field that must hold a semver (`project.version`, lockfile `version`, `compiler-version`, `adl-version`) does not match `MAJOR.MINOR.PATCH`.

**Example:**

```adl
[project]
name = "my_app"
version = "1.0"        // invalid semver -> ADL005 (expected MAJOR.MINOR.PATCH)
template = "app"
```

**Message:** `Invalid semantic version `1.0`. Expected format: `MAJOR.MINOR.PATCH` (e.g. `0.1.0`)`

**Quick fix:** none automatically (there is no way to know the version you meant) — correct the value by hand. Valid examples: `0.1.0`, `1.2.3`, `10.20.30` with optional `-prerelease` / `+build` metadata.

---

## ADL006: Invalid Version Requirement

**Severity:** WARNING

**Trigger:** a dependency value is a version requirement but doesn't look like one (`^1.0.0`, `~1.2.3`, `>=2.0.0`, `=1.2.3`, `*`, bare semver, or a comma range).

**Example:**

```adl
[dependencies]
Crypto = "latest"      // not a version requirement -> ADL006
```

**Message:** `Potentially invalid version requirement `latest`. Expected: `^1.0.0`, `~1.2.3`, `>=2.0.0`, `*`, etc.`

**Quick fix:** none directly. Use one of the supported forms from the [Dependency Management](./adl-dependencies) reference, e.g. `Crypto = "^1.0.0"`.

---

## ADL007: Missing Required Section

**Severity:** ERROR

**Trigger:** the manifest has no `[project]` section (the only required section).

**Example:**

```adl
[compiler]             // [project] missing -> ADL007
backend = "interpreter"
```

**Message:** `Missing required section `[project]`. Add `[project]` to the manifest.`

**Quick fix:** yes — **"Add [project] section"**. It inserts a ready-made snippet at the top of the file:

```adl
[project]
name = "my_project"
version = "0.1.0"
template = "app"
```

---

## ADL008: Missing Required Field

**Severity:** ERROR

**Trigger:** a known section exists but is missing one of its required fields. In `[project]`, `name`, `version`, and `template` are required.

**Example:**

```adl
[project]
name = "my_app"
version = "0.1.0"
// template missing -> ADL008
```

**Message:** `Missing required field `template` in section `[project]``

**Quick fix:** yes — **"Add `template` field to [project]"**, which inserts the appropriate snippet (e.g. `template = "app"` with a placeholder).

---

## ADL010: Missing Required Dependency Field

**Severity:** WARNING

**Trigger:** a lockfile dependency entry is missing one of `package-id`, `name`, or `version`.

**Example (`adesh.lock.adl`):**

```adl
lock {
  version = "1"
  dependencies = [
    {
      package-id = "Crypto@1.0.0"
      // name and version missing -> ADL010
      checksum = "1a2b3c4d5e6f7a8b"
    }
  ]
}
```

**Message:** `Dependency entry missing required field `name`` (one warning per missing field)

**Quick fix:** none directly — regenerate the lockfile (`adesh lock` / `adesh install`) to produce a complete entry.

---

## ADL011: Unknown Key in Dependency Entry

**Severity:** WARNING

**Trigger:** a key inside a lockfile dependency entry is not a known dependency field (`package-id`, `name`, `version`, `requirement`, `checksum`, `sha256`, `source`, `features`, `registries`, `transitive`, `target`, `profile`).

**Example:**

```adl
lock {
  version = "1"
  dependencies = [
    {
      package-id = "Crypto@1.0.0"
      name = "Crypto"
      version = "1.0.0"
      verify = true        // unknown key -> ADL011
    }
  ]
}
```

**Message:** `Unknown key `verify` in dependency entry`

**Quick fix:** none directly — remove the key or fix the spelling. (The `source` object is allowed in addition to the key list.)

---

## ADL012: Unknown Key in Lock Block

**Severity:** WARNING

**Trigger:** a top-level key inside `lock { }` is not one of the known lockfile keys (`version`, `generated-at`, `compiler-version`, `adl-version`, `package-id`, `dependencies`, `confidential`, `signature`).

**Example:**

```adl
lock {
  version = "1"
  environment = "prod"    // unknown key -> ADL012
}
```

**Message:** `Unknown key `environment` in lock block`

**Quick fix:** none directly — remove or rename the key, or regenerate the lockfile.

---

## ADL013: Duplicate Key in Lock Block

**Severity:** ERROR

**Trigger:** the same top-level key appears twice inside `lock { }`.

**Example:**

```adl
lock {
  version = "1"
  package-id = "my_app"
  package-id = "other"    // duplicate -> ADL013
}
```

**Message:** `Duplicate key `package-id` in lock block`

**Quick fix:** none directly — delete the duplicate, then regenerate the lockfile so the `signature` matches the content.

---

## Code Actions / Quick Fixes Summary

| Code | Quick fix | Action title |
|---|---|---|
| ADL004 | Replace with each valid enum value | `Use "app" for `template`` (one per value) |
| ADL007 | Insert full `[project]` section | `Add [project] section` |
| ADL008 | Insert the missing required field | `Add `template` field to [project]` |
| — (always) | Generate a complete manifest template | `Generate full manifest template` (offered when the file is empty or has no `[project]`) |

The **"Generate full manifest template"** refactor action produces:

```adl
[project]
name = "my_project"
version = "0.1.0"
template = "app"

[compiler]
backend = "interpreter"
opt-level = "debug"

[dependencies]

[scripts]
const build = "default"
const test = "default"
```

---

## JSON Schema Validation in VS Code

The ADL JSON Schema (`adl-schema.json`) provides a second validation layer in VS Code, applied to `adesh.adl` and all `*.adl` files via the extension's `jsonValidation` contributions:

```json
{
  "jsonValidation": [
    { "fileMatch": "adesh.adl", "url": "./schemas/adl-schema.json" },
    { "fileMatch": "*.adl", "url": "./schemas/adl-schema.json" }
  ]
}
```

Schema coverage:

- **Names** — `project.name` must match `^[a-zA-Z_][a-zA-Z0-9_-]*$`.
- **Semver** — `version` fields validated against the semver pattern; invalid versions get an explicit `errorMessage` (e.g. `Value must be a valid semantic version such as "0.1.0"`).
- **Version requirements** — dependency values validated against the requirement pattern (`^1.0.0`, `>=2.0.0`, `~1.2.3`, `=1.2.3`, `*`).
- **Enums** — `template` (`app|lib|workspace|plugin|package`), `backend`, `opt-level`, dependency `source` kinds, lockfile `profile`.
- **Required fields** — `project.name`, `project.version`, `project.template`; `workspace.members`; dependency objects require `source` + `location`.
- **Structure** — `additionalProperties: false` on most sections catches stray keys; the `lock { }` block is validated permissively so lockfile-only keys don't flag regular manifests.

Because ADL is not JSON, the schema is used for *structural* guidance — completions, missing-property hints, and enum pickers — while **ALS diagnostics (ADL001–ADL013)** remain the authoritative source for semantic validation of both manifests and lockfiles.
