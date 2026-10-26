---
id: adl-lockfile
title: Lockfile Reference (adesh.lock.adl)
sidebar_label: Lockfile
description: Complete reference for the adesh.lock.adl ADL lockfile — the lock { } block, every top-level field, dependency entry fields, source objects, the confidential block, and FNV-1a signature verification.
---

# Lockfile Reference (`adesh.lock.adl`)

The **lockfile** is the machine-generated companion to `adesh.adl`. It lives at the project root as `adesh.lock.adl` and records the *exact* resolved state of every dependency — the precise version, integrity checksum, source, features, and transitive relationships — so that every build is reproducible.

Unlike the manifest, you normally never edit the lockfile by hand. It is written by the resolver when you run `adesh lock`, `adesh install`, `adesh update`, `adesh resolve`, or `adesh restore` (see [ADL CLI Commands](./adl-cli)). But reading it is essential for debugging resolution problems — and it is a first-class ADL file that the language server validates, completes, and formats.

All lockfile content lives inside a **single `lock { }` block**, using the same `key = value` syntax as the manifest. **Never use colon syntax** — both in code and in this reference, assignments always use `=`.

---

## Why a Lockfile?

- **Reproducible builds** — the same `adesh.lock.adl` produces the same dependency set on every machine, CI runner, and future date, regardless of what was published to the registry in the meantime.
- **Integrity** — every entry carries a `checksum`/`sha256`; the whole file carries a `signature` that detects tampering or accidental edits.
- **Deterministic resolution** — the resolver (`adesh lock`) solves the dependency graph once, then downstream builds use the locked versions instead of re-solving.
- **Secret containment** — values that are confidential in the manifest (tokens, passwords, API keys) are stripped from `adesh.adl` and preserved here in the `confidential` block.

Commit `adesh.lock.adl` to version control. Treat it as part of the build contract.

---

## The `lock { }` Block

The entire lockfile is one `lock { }` object:

```adl
lock {
  version = "1"
  generated-at = "2026-07-01T00:00:00Z"
  compiler-version = "0.4.0"
  adl-version = "0.4.0"
  package-id = "my_app"
  dependencies = [
    // ... dependency entry objects ...
  ]
  confidential = {
    // ... secrets stripped from the manifest ...
  }
  signature = "9f5c2a1b8e7d6c4f"
}
```

---

## Top-Level Fields

These keys may appear directly inside `lock { }`.

| Field | Required | Type | Description |
|---|---|---|---|
| `version` | yes | string | Lockfile format version (currently `"1"`) |
| `generated-at` | no | ISO-8601 | Timestamp the lockfile was generated (RFC 3339), e.g. `"2026-07-01T00:00:00Z"` |
| `compiler-version` | no | semver | Version of the Adesh compiler that generated the lockfile |
| `adl-version` | no | semver | Version of the ADL package manager that generated the lockfile |
| `package-id` | no | string | Unique identifier of the package this lockfile belongs to |
| `dependencies` | no | array&lt;object&gt; | Locked dependency entries |
| `confidential` | no | object | Sensitive key-value pairs stripped from the manifest |
| `signature` | no | hex string | FNV-1a integrity hash over all lockfile content |

Example of a minimal valid lockfile:

```adl
lock {
  version = "1"
  generated-at = "2026-07-01T00:00:00Z"
  compiler-version = "0.4.0"
  adl-version = "0.4.0"
  package-id = "my_app"
  dependencies = []
  signature = "0000000000000000"
}
```

### Field details

**`version`** — the ADL lockfile format version. Format `"1"` is the current version; the value is a quoted string so future format changes can be detected through signature verification rather than a parser bump.

**`generated-at`** — RFC 3339 (ISO-8601) UTC timestamp produced by the resolver at generation time. Useful for auditing when a dependency set was frozen.

**`compiler-version`** — the Adesh compiler release, e.g. `"0.4.0"`. Useful for reproducing a build with the toolchain that produced it.

**`adl-version`** — the ADL package-manager release that generated the file.

**`package-id`** — a stable identifier for *this* package, typically the manifest `name`. It is the same value used as the root node of the dependency graph.

**`dependencies`** — the ordered array of locked dependency entries (see below). Sorted by `package-id` for deterministic diffs.

**`signature`** — a 64-bit FNV-1a hash formatted as 16 lowercase hex characters. See [Signature Verification](#signature-verification-fnv-1a).

---

## Dependency Entry Fields

Each object inside `dependencies = [ ... ]` describes one locked dependency. The required fields are `package-id`, `name`, and `version`; the rest are populated when available.

```adl
{
  package-id = "Crypto@1.0.0"
  name = "Crypto"
  version = "1.0.0"
  requirement = "^1.0.0"
  checksum = "1a2b3c4d5e6f7a8b"
  sha256 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  source = { kind = "registry", location = "official" }
  features = ["sha256", "aes"]
  registries = ["official"]
  transitive = ["Hash@0.9.1"]
  target = "x86_64-pc-windows-msvc"
  profile = "release"
}
```

| Field | Required | Type | Description |
|---|---|---|---|
| `package-id` | yes | string | Unique identifier, conventionally `Name@version` |
| `name` | yes | string | The package name |
| `version` | yes | semver | Exact resolved version |
| `requirement` | no | version-requirement | The manifest requirement that resolved to this version (e.g. `^1.0.0`) |
| `checksum` | no | hex string | Short integrity checksum (16 hex chars) |
| `sha256` | no | hex string | SHA-256 content checksum |
| `source` | no | object | Source descriptor (`kind` + `location`) |
| `features` | no | array&lt;string&gt; | Feature flags enabled for this dependency |
| `registries` | no | array&lt;string&gt; | Registries consulted during resolution |
| `transitive` | no | array&lt;string&gt; | Package IDs pulled in transitively by this entry |
| `target` | no | string | Platform triple this entry is scoped to (absent = all targets) |
| `profile` | no | enum | Build profile: `"debug"`, `"release"`, or `"fast"` |

### Field details

- **`package-id`** — the graph identifier; two entries with the same `package-id` are considered the same node. Format is conventionally `Name@version`.
- **`requirement`** — the original requirement from the manifest (`^1.0.0`) preserved next to the resolved version (`1.0.0`), making it easy to see what range landed where.
- **`checksum`** — a short integrity value (16 hex characters) used for fast verification.
- **`sha256`** — the full SHA-256 hex digest of the package content, used for strong integrity verification.
- **`features`** — enabled optional features as an array of feature names.
- **`registries`** — the registries (e.g. `"official"`) consulted when resolving this dependency.
- **`transitive`** — the `package-id`s of packages pulled in by this one, i.e. its children in the dependency graph. This is what powers `adesh tree` and `adesh why`.
- **`target`** — an optional target platform triple such as `x86_64-pc-windows-msvc`. When present, the entry applies only to that target; when absent, it applies to all targets.
- **`profile`** — the build profile this entry was resolved/locked for: `"debug"`, `"release"`, or `"fast"`.

A run producing both a debug and a release lock will carry separate entries or entries with distinct `profile` values.

---

## Source Object

Every locked dependency's `source` is an inline object with two keys:

```adl
source = { kind = "registry", location = "official" }
```

| Key | Required | Type | Description |
|---|---|---|---|
| `kind` | yes | enum | `"registry"`, `"git"`, `"path"`, `"local"`, or `"workspace"` |
| `location` | yes | string | Registry name, git URL, or filesystem path |

### `kind` values

| Value | Description | Example `location` |
|---|---|---|
| `"registry"` | Downloaded from a named registry | `"official"` |
| `"git"` | Cloned from a git repository | `"https://github.com/user/repo"` |
| `"path"` | Resolved from a local filesystem path | `"../my-lib"` |
| `"local"` | Local path, not published | `"./vendor/utils"` |
| `"workspace"` | Resolved from a workspace member | `"packages/my-lib"` |

Examples:

```adl
source = { kind = "git", location = "https://github.com/user/repo" }
source = { kind = "path", location = "../my-lib" }
source = { kind = "workspace", location = "packages/shared-core" }
source = { kind = "local", location = "./vendor/utils" }
```

The `location` meaning depends on `kind`: for `registry` it is the registry name, for `git` a repository URL, and for `path`/`local`/`workspace` a filesystem path.

---

## Confidential Block

The `confidential` block holds sensitive key-value pairs that the resolver **strips out of `adesh.adl`** before saving the manifest. Keys whose name contains markers such as `token`, `secret`, `password`, `passwd`, `passphrase`, `private_key`, `api_key`, `client_secret`, `auth_token`, `registry_token`, `license_key`, or `credential` are automatically detected and moved here.

```adl
confidential = {
  registry_token = "abc123secret"
  api_key = "sk-live-9f8a7b"
}
```

Because the manifest is published while the lockfile stays local (or is distributed separately), secrets never leak into a public `adesh.adl`. Tools that consume the lockfile can read the `confidential` block when an authenticated operation (publish, private registry download) needs the secret.

The `confidential` object accepts any key-value pair — it is deliberately schema-free so credentials formats can evolve without a format bump.

---

## Signature Verification (FNV-1a)

The lockfile protects itself against tampering with a **64-bit FNV-1a hash** stored in `signature` as 16 lowercase hex characters.

The hash is computed over the lockfile's stable content, in order:

1. `lock_version`
2. `generated_at`
3. `compiler_version`
4. `adl_version`
5. `package_id`
6. For each dependency (in sorted order): `package_id`, `name`, `version`, `checksum`

The FNV-1a algorithm used is the classic 64-bit variant:

```text
offset basis h = 0
for each byte b:
    h = (h XOR b) * 16777619  (mod 2^64)
signature = h formatted as 16 lowercase hex digits
```

Every load of the lockfile (for example by `adesh build` or `adesh restore`) recomputes this value and compares it to `signature`. A mismatch raises an integrity error similar to:

```text
lockfile integrity check failed: signature mismatch.
expected: 9f5c2a1b8e7d6c4f, computed: 0d1e2f3a4b5c6d7e
```

This means:

- **Hand edits break the file** — the resolver will refuse to trust a manually altered lockfile until you regenerate it with `adesh lock`.
- **Corruption is caught early** — a truncated or bit-flipped file fails at load time instead of mid-build.
- **The signature is scoped to the dependency contract** — it covers the fields that determine reproducibility, so formatting-only changes that alter nothing in the contract still verify when regenerated.

Regenerate the signature with any command that rewrites the lockfile:

```bash
adesh lock
# or
adesh install
# or
adesh update
```

---

## Full Annotated Example

```adl
// =====================================================================
// adesh.lock.adl — annotated example lockfile
// Generated by ADL 0.4.0 / Adesh compiler 0.4.0
// =====================================================================
lock {
  version = "1"                            // lockfile format version
  generated-at = "2026-07-01T00:00:00Z"    // RFC 3339 generation timestamp
  compiler-version = "0.4.0"               // Adesh compiler that produced this
  adl-version = "0.4.0"                    // ADL package manager version
  package-id = "my_app"                    // identity of the owning package

  dependencies = [
    // Direct dependency, resolved from the official registry.
    {
      package-id = "Crypto@1.0.0"          // graph id: Name@version
      name = "Crypto"                      // package name
      version = "1.0.0"                    // exact resolved version
      requirement = "^1.0.0"               // manifest requirement it satisfies
      checksum = "1a2b3c4d5e6f7a8b"        // short integrity checksum
      sha256 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" // full digest
      source = { kind = "registry", location = "official" }  // where it came from
      features = ["sha256", "aes"]         // enabled features
      registries = ["official"]            // registries consulted
      transitive = ["Hash@0.9.1"]          // pulled in by this package
    },

    // Transitive dependency, resolved from the official registry.
    {
      package-id = "Hash@0.9.1"
      name = "Hash"
      version = "0.9.1"
      requirement = ">=0.8.0"
      checksum = "0f1e2d3c4b5a6978"
      sha256 = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
      source = { kind = "registry", location = "official" }
    },

    // Workspace dependency: resolved from a local workspace member.
    {
      package-id = "SharedCore@0.2.0"
      name = "SharedCore"
      version = "0.2.0"
      requirement = "^0.2.0"
      checksum = "a1b2c3d4e5f60718"
      sha256 = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
      source = { kind = "workspace", location = "packages/shared-core" }
      target = "x86_64-pc-windows-msvc"    // scoped to this platform only
      profile = "release"                  // locked for the release profile
    }
  ]

  // Secrets stripped from the manifest surface.
  confidential = {
    registry_token = "abc123secret"        // e.g. publish/private-registry token
    api_key = "sk-live-9f8a7b"             // never published in adesh.adl
  }

  signature = "9f5c2a1b8e7d6c4f"            // FNV-1a integrity hash
}
```

For a walkthrough of the manifest that feeds this lockfile, see the [Manifest Reference](./adl-manifest); for how the resolver creates both, see [Dependency Management](./adl-dependencies).
