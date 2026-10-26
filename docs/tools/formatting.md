---
id: formatting
title: Code Formatting (adesh fmt)
sidebar_label: Formatting
description: Official code formatter for Adesh ensuring deterministic, uniform code style across projects.
---

# Code Formatting (`adesh fmt`)

Adesh includes a fast, opinionated built-in code formatter: `adesh fmt`. It enforces consistent formatting conventions across codebases, eliminates bike-shedding in code reviews, and integrates seamlessly with IDEs and CI/CD pipelines.

---

## 1. CLI Usage

The formatter can format individual files, multiple directories, or stdin:

```bash
# Format a specific file in-place
adesh fmt src/main.adesh --write

# Format all .adesh files in the project recursively
adesh fmt . --write

# Check if files conform to formatting without modifying them (for CI)
adesh fmt src/ --check

# Display diff between current file and formatted version
adesh fmt src/main.adesh --diff
```

### Command-Line Options

| Flag | Short | Description |
|------|-------|-------------|
| `--write` | `-w` | Overwrite source files in place with formatted output. |
| `--check` | `-c` | Return exit code `1` if any file is unformatted; `0` if all files conform. |
| `--diff` | `-d` | Print unified diffs showing formatting adjustments. |
| `--quiet` | `-q` | Suppress non-error output. |
| `--config <path>` | | Path to a custom formatting configuration file. |

---

## 2. Default Style Conventions

`adesh fmt` follows clear and ergonomic standard rules:

- **Indentation**: 4 spaces per indentation level (no hard tabs).
- **Line Length**: Soft line wrap limit of 100 characters.
- **Braces**: K&R style / 1TBS (opening brace `{` on the same line as declaration, closing brace `}` on its own line).
- **Semicolons**: Mandatory statement terminators for unambiguous parsing.
- **Spacing**:
  - Exactly one space around binary operators (`+`, `-`, `*`, `/`, `=`, `==`, `!=`, etc.).
  - Exactly one space after commas and colons (`let x: i64 = 10, y: i64 = 20;`).
  - No space between function names and opening argument parentheses (`fn compute(a: i64)`).
- **Imports**: Sorted alphabetically by module path, grouped into standard library imports first, followed by external and internal project modules.

### Formatting Before & After Example

#### Before:
```adesh
fn  calculate_total(items:[Item],discount:f64): f64{
let total:f64=0.0;
for item in items{total+=item.price*(1.0-discount);}
return total;}
```

#### After `adesh fmt`:
```adesh
fn calculate_total(items: [Item], discount: f64): f64 {
    let total: f64 = 0.0;
    for item in items {
        total += item.price * (1.0 - discount);
    }
    return total;
}
```

---

## 3. IDE Integration

### Visual Studio Code
With the **Adesh** extension installed:
1. Open Settings (`Ctrl+,` or `Cmd+,`).
2. Search for `Format On Save`.
3. Check **Editor: Format On Save**.
4. Ensure default formatter is set to `Adesh`.

### Neovim
Using `conform.nvim` or `null-ls`:
```lua
require("conform").setup({
  formatters_by_ft = {
    adesh = { "adesh_fmt" },
  },
})

require("conform.formatters").adesh_fmt = {
  command = "adesh",
  args = { "fmt", "$FILENAME", "--write" },
  stdin = false,
}
```

### Helix Editor
In `~/.config/helix/languages.toml`:
```toml
[[language]]
name = "adesh"
scope = "source.adesh"
file-types = ["adesh"]
formatter = { command = "adesh", args = ["fmt", "--write"] }
auto-format = true
```

---

## 4. Continuous Integration (CI)

Add a formatting check step in your GitHub Actions workflow:

```yaml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Adesh
        run: |
          # Download the latest Debian package from
          # https://github.com/adeshlang/adeshlang/releases
          sudo dpkg -i adeshlang_*.deb
      - name: Check Code Formatting
        run: adesh fmt . --check
```
