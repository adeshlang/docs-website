---
id: adl-editor-support
title: ADL Editor Support
sidebar_label: Editor Support
description: Set up ADL editing in VS Code, Neovim, Helix, Emacs, and Sublime Text — syntax highlighting, completion, validation, formatting, snippets, and ALS (Adesh Language Server) integration for adesh.adl and adesh.lock.adl files.
---

# ADL Editor Support

ADL files (`adesh.adl` and `adesh.lock.adl`) are supported by every major editor through the **ALS (Adesh Language Server)** and the per-editor language packages. You get syntax highlighting, auto-completion, validation diagnostics (ADL001–ADL013), quick fixes, formatting, hover documentation, and more — the same editing experience `package.json` users get in VS Code.

The language is registered under the id **`adl`** (scope `source.adl`) in every editor below, with filename detection for both `adesh.adl` and `adesh.lock.adl`.

---

## Visual Studio Code

The official extension is **Adesh Language Support** (`adesh-vscode`, publisher `adesh-lang`).

### What you get

- **Syntax highlighting** — TextMate grammar (`adl.tmLanguage.json`): sections, `lock`/`confidential` keywords, `import`, `let`/`const`, `if`/`else`, version requirements, strings, numbers, keys.
- **Auto-completion** — context-aware: section headers at top level, field keys inside sections, enum values after `=`, dependency forms, lockfile keys, `import`/`if`/`if-else` snippets.
- **Hover hints** — type and documentation for any ADL key, section, or enum value.
- **Validation diagnostics** — ADL001–ADL013 inline errors/warnings (see [ADL Validation & Diagnostics](./adl-validation)).
- **Code actions / quick fixes** — add missing sections/fields, replace invalid enum values, generate a full manifest template.
- **Formatting** — `adesh fmt` integration on format request/save.
- **Document links** — ctrl+click on `import "./x.adl"` and `location = "…"` values.
- **Snippets** — full manifest, per-section, dependency (`dep`, `dep-path`, `dep-git`, `dep-registry`, `dep-workspace`), standard-library (`dep-crypto` … `dep-dns`), conditional (`if`, `if-else`, `if-platform`, `if-target`, `if-debug`), and lockfile templates.
- **Commands** — `Adesh: Validate ADL Manifest`, `Adesh: Create Lockfile Template`, `Adesh: Add Dependency`.

### JSON Schema validation

The extension wires the ADL JSON schema (`adl-schema.json`) to validate structure:

```json
"jsonValidation": [
  { "fileMatch": "adesh.adl", "url": "./schemas/adl-schema.json" },
  { "fileMatch": "*.adl", "url": "./schemas/adl-schema.json" }
]
```

### Installation

From the marketplace, or build from source:

```bash
# Build the extension package (.vsix) with vsce
npm install
npm run compile
npx vsce package

# Install the packaged extension
code --install-extension adesh-vscode-0.3.0.vsix
```

### ADL-specific settings

Add to `.vscode/settings.json`:

```json
{
  "adesh.adl.validate.enabled": true,
  "adesh.adl.validate.requireProjectSection": true,
  "adesh.adl.completion.suggestVersions": true,
  "adesh.adl.format.alignKeys": true,
  "adesh.adl.format.sortSections": false,
  "editor.formatOnSave": true
}
```

| Setting | Default | Description |
|---|---|---|
| `adesh.adl.validate.enabled` | `true` | Enable ADL validation diagnostics |
| `adesh.adl.validate.requireProjectSection` | `true` | Require `[project]` in manifests |
| `adesh.adl.completion.suggestVersions` | `true` | Suggest version strings in dependency completions |
| `adesh.adl.format.alignKeys` | `true` | Align key-value pairs in sections |
| `adesh.adl.format.sortSections` | `false` | Sort sections alphabetically |

---

## Neovim

Use the bundled `als.lua` config (in `als-neovim/`) or wire ALS manually.

### Filetype detection

```lua
vim.filetype.add({
  extension = {
    adl = 'adl',
  },
  filename = {
    ['adesh.adl'] = 'adl',
    ['adesh.lock.adl'] = 'adl',
  },
})
```

### LSP configuration

```lua
local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

configs.als = {
  default_config = {
    cmd = { 'als' },
    filetypes = { 'adesh', 'adl' },
    root_dir = function(fname)
      local util = require('lspconfig.util')
      return util.find_git_ancestor(fname)
        or util.root_pattern('Cargo.toml', 'package.json', '.adesh', 'adesh.adl')(fname)
        or vim.fn.getcwd()
    end,
    single_file_support = true,
  },
}

lspconfig.als.setup({})
```

### Syntax highlighting

The bundled config adds an `adl` FileType autocmd with highlight groups for:

- Comments: `//`, `#`, and `/* … */`
- Section headers `[project]`, `[compiler]`, etc.
- Keywords: `lock`, `confidential`, `import`, `let`, `const`, `if`, `else`
- Typed values: `path`, `url`, `duration`, `version`
- Version requirements (`^1.0.0`, `~1.2.3`, `>=2.0.0`)
- Strings, numbers, property keys, known section names, and operators

---

## Helix

Add to `~/.config/helix/languages.toml`:

```toml
[[language]]
name = "adl"
scope = "source.adl"
injection-regex = "adl"
file-types = ["adl"]
comment-token = "//"
comment-tokens = ["//", "#"]
block-comment-tokens = { start = "/*", end = "*/" }
indent = { tab-width = 2, unit = "  " }
language-servers = ["als"]
auto-format = true
roots = ["adesh.adl"]

[language-server.als]
command = "als"

[language-server.als.config.adl]
validate = { enabled = true, requireProjectSection = true }
completion = { suggestVersions = true }
format = { alignKeys = true, sortSections = false }
```

Key points:

- `file-types = ["adl"]` with `roots = ["adesh.adl"]` for project detection.
- `comment-tokens = ["//", "#"]` — both comment styles are recognized.
- `auto-format = true` — formatting on save via ALS.
- The language server option block enables ADL validation, version suggestions, and key alignment.

---

## Emacs

The `adesh-mode.el` major mode (in `als-emacs/`) supports ADL files and integrates ALS through `lsp-mode` or `eglot`.

### Register the mode

```elisp
(add-to-list 'auto-mode-alist '("\\.adl\\'" . adesh-mode))
(add-to-list 'auto-mode-alist '("adesh\\.adl\\'" . adesh-mode))
(add-to-list 'auto-mode-alist '("adesh\\.lock\\.adl\\'" . adesh-mode))
```

### LSP integration

#### With `eglot` (built into Emacs 29+)

```elisp
(with-eval-after-load 'eglot
  (add-to-list 'eglot-server-programs
               '(adesh-mode . ("als"))))
```

#### With `lsp-mode`

```elisp
(use-package lsp-mode
  :hook (adesh-mode . lsp-deferred)
  :config
  (lsp-register-client
   (make-lsp-client :new-connection (lsp-stdio-connection '("als"))
                    :major-modes '(adesh-mode)
                    :server-id 'adesh-lsp)))
```

`adesh-mode` provides syntax highlighting plus indentation; ALS adds completion, diagnostics, hover, and formatting.

---

## Sublime Text

### TextMate grammar

The `als-sublime/` package ships `Adl.tmLanguage` — install it so `.adl` files get the `source.adl` scope with full highlighting (sections, keywords, version requirements, strings, comments).

### LSP settings

Install the `LSP` package from Package Control, then in `LSP.sublime-settings`:

```json
{
  "clients": {
    "als": {
      "enabled": true,
      "command": ["/path/to/AdeshLang/als/target/release/als"],
      "selector": "source.adesh, source.adl",
      "syntaxes": ["Packages/Adesh/Adl.tmLanguage"],
      "scopes": ["source.adl"],
      "settings": {
        "format": { "indentSize": 2, "useTabs": false, "enable": true },
        "diagnostics": { "enabled": true, "refreshOnSave": true },
        "completion": { "enabled": true, "includeKeywords": true, "includeBuiltins": true }
      }
    }
  },
  "show_diagnostics_in_view": true,
  "semantic_tokens_enabled": true,
  "show_code_actions_bulb": true
}
```

The `selector: "source.adesh, source.adl"` ensures ALS attaches to both Adesh source and ADL manifest files.

---

## ALS Features for ADL

The **Adesh Language Server** is the engine behind all of the above. For `.adl` files it provides the full LSP surface:

| Feature | What it does for ADL |
|---|---|
| **Completion** | Section headers, field keys, enum values, dependency snippets, lockfile keys, `import`/`if` keywords — context-aware (top-level vs section vs lock block vs source object) |
| **Hover** | Type + documentation for keys, sections, enums (`name`, `template`, `backend`, `source`, …) |
| **Diagnostics** | ADL001–ADL013 validation for manifests and lockfiles |
| **Code actions** | Add missing `[section]`, add missing `field`, replace invalid enum value, generate full manifest template |
| **Formatting** | `adesh fmt` rules: 2-space indent, blank lines between sections, normalized lockfiles |
| **Semantic tokens** | Property, keyword, string, number, enum, macro (section), comment, operator, namespace tokens; `readonly` (const) / `modification` (let) modifiers |
| **Document links** | Navigable `import "./x.adl"` paths and `location = "…"` values |
| **Folding ranges** | Fold `lock { }` blocks, dependency arrays, and objects |
| **Selection ranges** | Smart expand: word → key/value → line → section → document |
| **Document symbols** | Outline view: sections, lock block, fields, and script bindings |

### Starting ALS

ALS is built into the `adesh`/`adl` toolchain (and ships as the `als` binary):

```bash
# Over stdio (default for editors)
adesh lsp
# or
als

# Verbose logging for debugging
adesh lsp --log-file=als.log --log-level=trace
```

### ADL semantic token types

| Token | Meaning |
|---|---|
| `property` | field/keys |
| `keyword` | `lock`, `import`, `if`, `let`, `const` |
| `string` / `number` | string and numeric values |
| `enum` | enum values (`app`, `interpreter`, `debug`, …) |
| `macro` | section header brackets |
| `comment` | `//` and `#` comments |
| `operator` | `=` assignment |
| `namespace` | section names |

---

## Quick Setup Cheat-Sheet

| Editor | File to configure | Key setup |
|---|---|---|
| VS Code | install `adesh-vscode` | grammar + snippets + schema + ALS |
| Neovim | `init.lua` using `als-neovim/als.lua` | `vim.filetype.add` + `lspconfig.als` |
| Helix | `languages.toml` | `[[language]] name = "adl"` + `[language-server.als]` |
| Emacs | `init.el` + `adesh-mode.el` | `auto-mode-alist` + `eglot`/`lsp-mode` |
| Sublime | `LSP.sublime-settings` | `Adl.tmLanguage` + `als` LSP client |

For diagnostics details and the error-code reference, see [ADL Validation & Diagnostics](./adl-validation).
