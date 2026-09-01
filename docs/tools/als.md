---
id: als
title: AdeshLang Language Server (ALS)
sidebar_label: ALS (Language Server)
description: Complete guide to setup and configure the AdeshLang Language Server (ALS) across VS Code, Neovim, Helix, Emacs, and Sublime Text.
---

# AdeshLang Language Server (ALS)

The **AdeshLang Language Server (ALS)** implements the official [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/), bringing rich IDE capabilities to any modern text editor or development environment.

```
┌───────────────────────────────────────────────────────────┐
│              Editor (VS Code / Neovim / Helix)            │
└─────────────────────────────▲─────────────────────────────┘
                              │ JSON-RPC over stdio
┌─────────────────────────────▼─────────────────────────────┐
│             AdeshLang Language Server (ALS)               │
├───────────────────────────────────────────────────────────┤
│ • Incremental AST Parsing  • Type Checking & Inference    │
│ • Symbol Indexing          • Code Action Engine           │
└───────────────────────────────────────────────────────────┘
```

---

## 1. Features Supported

- 🔍 **Real-Time Diagnostics**: Instant syntax errors, type mismatches, and memory safety / borrow checker diagnostics as you type.
- 💡 **Intelligent Auto-Completion**: Context-aware suggestions for keywords, variables, types, methods, and module exports.
- 📖 **Hover Documentation**: View function signatures, return types, markdown docstrings, and parameter documentation.
- 🎯 **Go to Definition**: Jump directly to variable declarations, struct definitions, trait methods, and imported functions.
- 🔎 **Find References**: Find all usages of a function, struct, or variable across the entire workspace.
- ✏️ **Symbol Renaming**: Safe semantic refactoring across files.
- 🪄 **Code Actions & Quick Fixes**: Automated fixes for missing imports, unresolved symbols, and unhandled `Result` errors.
- 🎨 **Semantic Syntax Highlighting**: Accurate token classification (types, traits, decorators, macros, keywords).
- 🧹 **Document Formatting**: Integrated with `adesh fmt` on format request / save.

---

## 2. Starting ALS Manually

ALS is built directly into the `adesh` CLI binary:

```bash
# Start ALS over standard I/O (default for editors)
adesh lsp

# Start with verbose debug logging to file
adesh lsp --log-file=als.log --log-level=trace
```

---

## 3. Editor Configurations

### Visual Studio Code
Install the official extension from the marketplace or configure via `.vscode/settings.json`:
```json
{
  "adesh.lsp.path": "adesh",
  "adesh.lsp.trace": "messages",
  "editor.formatOnSave": true
}
```

---

### Neovim (Built-in LSP + `nvim-lspconfig`)

In your `init.lua`:

```lua
local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

if not configs.adesh_lsp then
  configs.adesh_lsp = {
    default_config = {
      cmd = { 'adesh', 'lsp' },
      filetypes = { 'adesh' },
      root_dir = lspconfig.util.root_pattern('.git', 'Adesh.toml'),
      settings = {},
    },
  }
end

lspconfig.adesh_lsp.setup({
  on_attach = function(client, bufnr)
    local opts = { noremap = true, silent = true, buffer = bufnr }
    vim.keymap.set('n', 'gd', vim.lsp.buf.definition, opts)
    vim.keymap.set('n', 'K', vim.lsp.buf.hover, opts)
    vim.keymap.set('n', '<leader>rn', vim.lsp.buf.rename, opts)
    vim.keymap.set('n', '<leader>ca', vim.lsp.buf.code_action, opts)
  end,
})
```

---

### Helix Editor

In `~/.config/helix/languages.toml`:

```toml
[[language]]
name = "adesh"
scope = "source.adesh"
file-types = ["adesh"]
roots = ["Adesh.toml", ".git"]
language-servers = ["adesh-lsp"]

[language-server.adesh-lsp]
command = "adesh"
args = ["lsp"]
```

---

### Emacs (`lsp-mode` / `eglot`)

#### Using `eglot` (Built-in in Emacs 29+):
```elisp
(with-eval-after-load 'eglot
  (add-to-list 'eglot-server-programs
               '(adesh-mode . ("adesh" "lsp"))))
```

#### Using `lsp-mode`:
```elisp
(use-package lsp-mode
  :hook (adesh-mode . lsp-deferred)
  :commands lsp
  :config
  (lsp-register-client
   (make-lsp-client :new-connection (lsp-stdio-connection '("adesh" "lsp"))
                    :major-modes '(adesh-mode)
                    :server-id 'adesh-lsp)))
```

---

### Sublime Text (LSP Package)

In `LSP.sublime-settings`:

```json
{
  "clients": {
    "adesh-lsp": {
      "command": ["adesh", "lsp"],
      "enabled": true,
      "selector": "source.adesh"
    }
  }
}
```

---

## 4. Performance & Memory Profile

- **Startup Latency**: < 15ms.
- **Memory Footprint**: ~25MB RSS for standard 50k LOC projects.
- **Incremental Cache**: Fast re-indexing via differential AST caching.
