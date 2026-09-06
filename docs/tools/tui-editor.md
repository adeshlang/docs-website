---
id: tui-editor
title: Bundled TUI Code Editor
sidebar_label: TUI Code Editor
description: Fast, lightweight, cross-platform terminal code editor bundled with AdeshLang featuring LSP diagnostics, multiple buffers, file explorer, and interactive backend runner.
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Bundled TUI Code Editor

<FeatureStatus status="STABLE" details="Native cross-platform terminal editor built with Rust, Ratatui, Crossterm, and Tokio" />

AdeshLang includes a lightning-fast, full-featured **Terminal User Interface (TUI) Code Editor** built directly into the toolchain. It provides a complete IDE experience directly inside your terminal with sub-5ms cold startup, zero graphical dependencies, and a memory footprint under 15 MB.

```text
 ┌─ [File] [Edit] [View] [Run] [Info] ───────────────────────────────────────────────┐
 │ 📁 EXPLORER    │ main.adesh* ✕ │ math.adesh ✕                                    │
 │ ▾ src/         │ 1 │ import { println } from "std:io";                           │
 │   ▸ net/       │ 2 │ import { JITCompiler } from "std:jit";                      │
 │   • app.adesh  │ 3 │                                                             │
 │   • main.adesh │ 4 │ fn main() -> int {                                          │
 │ ▾ tests/       │ 5 │     let numbers = [10, 20, 30, 40];                         │
 │   • jit_test   │ 6 │     let total = numbers.reduce(0, fn(a, b) => a + b);       │
 │                │ 7 │     println("Total: {total}");                              │
 │                │ 8 │     return 0;                                               │
 │                │ 9 │ }                                                           │
 ├────────────────┴─────────────────────────────────────────────────────────────────┤
 │ ⚡ RUNNER [Cranelift JIT] — Status: Success (exit 0) — Execution time: 1.42ms    │
 │ Total: 100                                                                       │
 ├──────────────────────────────────────────────────────────────────────────────────┤
 │ NORMAL │ UTF-8 │ AdeshLang │ Ln 6, Col 24 │ Backend: Native JIT │ F5: Run │ Ctrl+P│
 └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Launch

Launch the bundled editor using either the `adesh editor` subcommand or the standalone `adesh-editor` binary:

```bash
# Open editor in the current directory with workspace file explorer
adesh editor .

# Open a specific file
adesh editor src/main.adesh

# Open multiple files into separate buffer tabs
adesh editor src/main.adesh src/lib.adesh tests/bench.adesh

# Open directly with a specific execution backend
adesh editor --backend jit-native main.adesh
```

---

## Architectural Highlights

- **Native Rust Engine**: Built on top of `ratatui` (v0.26), `crossterm` (v0.27), and `tokio` multi-threaded asynchronous runtime.
- **ALS Language Server Protocol**: Embedded real-time diagnostics, type hover tooltips, code completion, and document formatting.
- **Multi-Buffer Tab Bar**: Seamlessly switch between open files, split views, and scratch buffers.
- **Built-in Execution Runner**: Execute your code directly within the editor using the **Interpreter**, **Bytecode VM**, **Cranelift Native JIT**, or **Native AOT** linker.
- **Interactive Terminal & Output Panel**: Test CLI commands and view live streaming execution output without leaving the editor.
- **Fuzzy Command Palette**: Quick access to all actions, files, themes, and configuration commands.
- **Hybrid Input System**: Supports both modern desktop shortcuts (`Ctrl+S`, `Ctrl+P`, `Ctrl+F`) and classic modal navigation (`Normal`, `Insert`, `Visual`, `Command-Line`).
- **Mouse & Trackpad Support**: Click to position cursor, select text by dragging, switch tabs, scroll with mouse wheel, and click top-bar menus.

---

## User Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Menu Bar (Alt+F, Alt+E, Alt+V, Alt+R, Alt+I)             │
├──────────────┬──────────────────────────────────────────────┤
│              │ 2. Buffer Tabs Bar (Ctrl+Tab, Alt+1..9)      │
│              ├──────────────────────────────────────────────┤
│ 3. File Tree │                                              │
│    Explorer  │ 4. Code Editor Pane                          │
│    (Ctrl+E)  │    • Syntax highlighting                     │
│              │    • Line numbers (absolute/relative)        │
│              │    • Diagnostic error/warning gutter markers │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│ 5. Execution Runner / Interactive Terminal Drawer (Ctrl+`, Ctrl+J) │
├─────────────────────────────────────────────────────────────┤
│ 6. Status Bar (Mode, Position, Backend, Git, Diagnostics)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Editing Modes

The editor features a familiar modal architecture with intuitive transitions:

| Mode | Trigger | Description |
|---|---|---|
| **Normal Mode** | <kbd>Esc</kbd> | Rapid navigation, buffer manipulation, code jumping, and command execution. |
| **Insert Mode** | <kbd>i</kbd>, <kbd>a</kbd>, <kbd>o</kbd>, <kbd>I</kbd>, <kbd>A</kbd> | Standard text entry with auto-closing brackets, smart indent, and autocomplete popups. |
| **Visual Mode** | <kbd>v</kbd> (char) / <kbd>V</kbd> (line) | Text block selection for copying, cutting, formatting, and indentation shifts. |
| **Command-Line Mode** | <kbd>:</kbd> | Ex-style command prompt for `:w`, `:q`, `:theme`, `:backend`, and settings. |
| **Terminal Mode** | <kbd>Ctrl</kbd>+<kbd>J</kbd> | Direct focus on the embedded interactive terminal emulator. |

---

## Comprehensive Keybinding Reference

### Global & File Operations

| Shortcut | Action | Description |
|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | **Command Palette** | Open fuzzy command & action palette. |
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | **Open File** | Open file prompt with fuzzy path autocomplete. |
| <kbd>Ctrl</kbd>+<kbd>S</kbd> | **Save Buffer** | Write current buffer to disk. |
| <kbd>Ctrl</kbd>+<kbd>W</kbd> | **Close Buffer** | Close active buffer tab (prompts if unsaved). |
| <kbd>Ctrl</kbd>+<kbd>Q</kbd> | **Quit Editor** | Exit editor safely. |
| <kbd>Ctrl</kbd>+<kbd>Tab</kbd> | **Next Tab** | Cycle to the next open buffer tab. |
| <kbd>Alt</kbd>+<kbd>1</kbd>..<kbd>9</kbd> | **Jump to Tab** | Direct switch to buffer tab by number. |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | **Toggle Explorer** | Show/hide workspace file tree sidebar. |

---

### Navigation & Search

| Shortcut | Action | Description |
|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>F</kbd> | **Find in File** | Incremental search with live highlight. |
| <kbd>Ctrl</kbd>+<kbd>H</kbd> | **Find & Replace** | Search and replace single or all matches. |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> | **Workspace Grep** | Global regex search across all project files. |
| <kbd>Ctrl</kbd>+<kbd>G</kbd> | **Go to Line** | Jump directly to line number or line:column. |
| <kbd>n</kbd> / <kbd>N</kbd> | **Next / Prev Match** | Jump between search occurrences in Normal mode. |
| <kbd>g</kbd><kbd>d</kbd> / <kbd>F12</kbd> | **Go to Definition** | Jump to symbol declaration via ALS language server. |

---

### Editing & Formatting

| Shortcut | Action | Description |
|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>u</kbd> | **Undo** | Undo last edit action. |
| <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Ctrl</kbd>+<kbd>R</kbd> | **Redo** | Redo previously undone action. |
| <kbd>Ctrl</kbd>+<kbd>/</kbd> | **Toggle Comment** | Toggle line or block comments (`//` or `/* */`). |
| <kbd>Ctrl</kbd>+<kbd>D</kbd> | **Duplicate Line** | Duplicate current line or selected block. |
| <kbd>Ctrl</kbd>+<kbd>K</kbd>, <kbd>F</kbd> | **Format Code** | Auto-format current buffer using AdeshLang formatter. |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | **Indent / Outdent** | Shift line or visual selection by tab width. |

---

### Execution & Running

| Shortcut | Action | Description |
|---|---|---|
| <kbd>F5</kbd> | **Run Program** | Execute active file with current backend. |
| <kbd>Ctrl</kbd>+<kbd>F5</kbd> | **Run with Backend** | Choose execution backend (JIT, VM, Interpreter, AOT) and run. |
| <kbd>F6</kbd> | **Stop Execution** | Terminate currently running process/runner. |
| <kbd>Ctrl</kbd>+<kbd>`</kbd> | **Toggle Output Drawer** | Open/collapse the bottom execution output log. |
| <kbd>Ctrl</kbd>+<kbd>J</kbd> | **Toggle Interactive Terminal** | Focus interactive terminal shell. |

---

## Command-Line (`:`) Reference

Press <kbd>:</kbd> in Normal mode to open the command prompt:

| Command | Arguments | Description |
|---|---|---|
| `:w` | `[filename]` | Save current file (optionally with new name). |
| `:q` | | Quit active buffer / exit if last buffer. |
| `:wq`, `:x` | | Save and quit. |
| `:q!` | | Force quit discarding unsaved modifications. |
| `:e <path>` | `<filepath>` | Open file at specified relative or absolute path. |
| `:theme <name>` | `emerald`, `dracula`, `monokai`, `nord`, `github-dark` | Change color theme instantly. |
| `:backend <name>` | `interpreter`, `vm`, `jit`, `native`, `aot` | Set default execution backend. |
| `:set <option>` | `wrap`, `nowrap`, `relativenumber`, `number`, `tabsize=4` | Toggle editor configuration options. |
| `:format` | | Format current document. |
| `:goto <num>` | `<line_number>` | Jump to specific line. |
| `:grep <query>` | `<pattern>` | Search workspace files for string pattern. |

---

## ALS (Language Server) Integration

The bundled editor connects seamlessly with the **Adesh Language Server (ALS)** to provide real-time IDE intelligence:

1. **Inline Diagnostics**: Syntax errors and borrow-checker violations appear with underlined squigglies and status indicators in the gutter.
2. **Contextual Completion**: Typing identifiers, object dots (`.`), or import paths opens an autocomplete dropdown with docstrings and type signatures.
3. **Type Hovers**: Pressing <kbd>K</kbd> over any token in Normal mode displays its type signature and documentation.
4. **Auto-Format on Save**: Automatically standardizes indentation, spacing, and bracket placement whenever a buffer is saved.

---

## Configuration (`editor.toml`)

Customize your editor preferences by creating or editing `~/.adesh/editor.toml` (Windows: `%USERPROFILE%\.adesh\editor.toml`):

```toml
# AdeshLang TUI Editor Configuration
# Location: ~/.adesh/editor.toml

[editor]
theme = "emerald-dark"        # Options: "emerald-dark", "dracula", "monokai", "nord", "github-dark", "github-light"
tab_size = 4                  # Number of spaces per tab
insert_spaces = true          # Convert tabs to spaces
word_wrap = false             # Enable word wrapping
line_numbers = "absolute"     # Options: "absolute", "relative", "none"
highlight_current_line = true # Highlight active cursor line
auto_close_brackets = true    # Auto-insert closing brackets and quotes
format_on_save = true         # Format document on Ctrl+S

[runner]
default_backend = "jit-native"# Options: "interpreter", "bytecode-vm", "jit-native", "aot"
auto_open_output = true       # Automatically open output drawer on execution
timeout_seconds = 15          # Watchdog execution timeout

[lsp]
enabled = true                # Enable ALS language server integration
show_diagnostics = true       # Show gutter error/warning markers
hover_tooltips = true         # Enable hover inspection

[explorer]
show_hidden_files = false     # Show dotfiles (.git, .env, etc.)
default_width = 28            # Explorer sidebar width in columns
```

---

## Available Color Themes

| Theme Name | Style / Palette | Best For |
|---|---|---|
| **`emerald-dark`** *(default)* | Deep obsidian background (`#0B0F19`) with vibrant emerald green (`#10B981`) and cyan accents. | Official AdeshLang brand experience. |
| **`dracula`** | Classic dark purple/violet palette with pink and yellow highlights. | Low-light coding environments. |
| **`monokai`** | High-contrast dark charcoal with green, yellow, and magenta tones. | Maximum token contrast. |
| **`nord`** | Calming arctic blue and frosted slate palette. | Minimalist, soothing aesthetic. |
| **`github-dark`** | Standard GitHub dark mode palette with crisp blue and orange tokens. | Consistency with web workflows. |
| **`github-light`** | Clean light paper background with sharp syntax coloring. | Bright ambient environments. |

---

## Troubleshooting & Tips

- **Terminal Mouse Clicking**: If your terminal supports mouse events (Windows Terminal, iTerm2, Alacritty, Kitty, WezTerm), you can click tabs, scroll, select text, and click top-bar menus directly with your mouse.
- **Fast Exit**: In any mode, pressing <kbd>Ctrl</kbd>+<kbd>Q</kbd> safely exits the editor.
- **Diagnostics Inspection**: Place the cursor over a marked line to read the exact compiler error and recommended fix in the status line.
- **Backend Switching**: Press <kbd>Ctrl</kbd>+<kbd>F5</kbd> to benchmark and compare execution speeds across backends on the fly.
