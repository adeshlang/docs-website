---
id: diagnostics
title: Compiler Diagnostics & Error Tables
sidebar_label: Diagnostics & Error Tables
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# AdeshLang Compiler Diagnostics & Error Tables

<FeatureStatus status="STABLE" details="Production-quality compiler diagnostics with Rust error code equivalence and JSON reporting" />

The AdeshLang compiler diagnostics system is built to the highest modern standard of clarity, actionability, and elegance. Inspired by the usability of the Rust compiler, it replaces ad-hoc print statements with a structured, multi-error diagnostic architecture featuring:

1. **Rust Error-Code Equivalence**: Canonical Rust error codes (`E0106`, `E0277`, `E0308`, `E0381`, `E0382`, `E0384`, `E0416`, `E0425`, `E0428`, `E0499`, `E0502`, `E0505`, `E0506`, `E0515`, `E0597`, `E0631`, `E0733`) are assigned to matching semantic conditions with verified rationale.
2. **Distinct Adesh Namespace (`AD0001`–`AD0007`)**: Custom Adesh semantics (lexer tokens, parser recovery, async context, embedded heap prohibitions, ADOB binaries, and runtime traps) reside in a dedicated namespace.
3. **Rust-Style Terminal Error Tables**: Clear line-number gutters, precise carets (`^` and `~`), primary/secondary labels, notes, actionable remediation hints, and automatic explain referrals.
4. **Interactive Explanation Tooling**: `adesh --explain <CODE>` and `adesh --explain list` CLI commands for developer documentation lookup.
5. **Machine-Readable JSON Diagnostics (`schema_version: "1.0.0"`)**: Fully serializable reports for IDEs, language servers, and CI pipelines.
6. **Elimination of Leaked Internal Traces**: Adesh compiler panics or unexpected crashes are intercepted by an internal panic hook, presenting an Adesh-branded internal compiler error (ICE) directed to `ADESH_BACKTRACE=1` or `adesh --debug-backtrace`.

---

## Visual Presentation & Error Tables

Adesh errors are rendered as clean, legible tables matching the Rust diagnostic standard:

```text
error[E0308]: mismatched types
  --> examples/types.adesh:4:18
   |
 4 | let count: i32 = "seven";
   |                  ^^^^^^^ expected `i32`, found string
   |
   = note: this declaration requires an integer value
   = help: provide an integer or change the declared type
   = help: run `adesh --explain E0308` for more information
```

### Terminal Styling & Environment Controls

- **Colors**: Enabled by default in interactive TTYs using ANSI escape codes (red for errors, yellow for warnings, cyan for line markers and helps, green for suggestions).
- **`NO_COLOR`**: When the `NO_COLOR` environment variable is set (or `CLICOLOR=0`), the renderer strips all ANSI styling and outputs clean plain text.
- **Visual Gutter Width**: Dynamically calculated based on the maximum line number being displayed, ensuring aligned vertical separator bars (`|`).
- **Carets & Tildes**: Primary error spans are underlined with `^` and `~` for the exact visual column width of the token.

---

## Core Diagnostic Data Model

The shared diagnostics subsystem resides in `src/diagnostics/` and is exposed via `adeshlang::diagnostics`:

- **`Diagnostic`**: Core structured diagnostic containing:
  - `code: Option<String>`: Canonical error code (e.g. `"E0308"`, `"AD0001"`).
  - `severity: DiagnosticSeverity`: `Error`, `Warning`, or `Info`.
  - `phase: DiagnosticPhase`: Compiler stage (`Lexer`, `Parser`, `Semantic`, `TypeCheck`, `Ownership`, `Lowering`, `Codegen`, `Linker`, `Runtime`, `Cli`).
  - `message: String`: Concise diagnostic title.
  - `file: Option<String>`: Source file path.
  - `primary_span: Option<Span>`: Primary source location and line text.
  - `labels: Vec<Label>`: Primary and secondary annotations pointing to declarations or related sites.
  - `notes: Vec<String>`: Background context or invariant descriptions.
  - `helps: Vec<String>`: Actionable remediation suggestions.
  - `suggestions: Vec<Suggestion>`: Machine-applicable source replacements.

- **`Span`**: Represents a contiguous range in source code:
  - `start_line: usize`, `start_col: usize` (1-based)
  - `end_line: usize`, `end_col: usize` (1-based)
  - `start_offset: Option<usize>`, `end_offset: Option<usize>` (byte offsets)
  - `line_text: String`

- **`SourceMap`**: Efficient line index structure:
  - Stores line start byte-offsets in a monotonic table.
  - Computes visual columns accounting for tab stops (default 4 columns) and multi-byte Unicode characters.
  - Gracefully handles LF and CRLF line breaks, empty files, and unexpected EOF spans.

---

## Diagnostic Phases & Lifecycle

The compiler pipeline passes diagnostics through well-defined stages:

```
[Source Code]
      │
      ▼
1. Lexer ──────────────► (AD0001: Malformed token / invalid escape)
      │
      ▼
2. Parser ─────────────► (AD0002: Syntax error / unexpected token)
      │
      ▼
3. Semantic Indexing ──► (E0425: Undefined variable / E0428: Duplicate name)
      │
      ▼
4. Type Checking ──────► (E0308: Type mismatch / AD0003: Await outside async)
      │
      ▼
5. Memory Safety ──────► (E0382: Use after move / E0502: Borrow conflict / AD0004: Embedded heap)
      │
      ▼
6. Lowering / Codegen ─► (E0515: Return local reference)
      │
      ▼
7. Linker ─────────────► (AD0005: Corrupt object / AD0006: Relocation overflow / LNK001-LNK016)
      │
      ▼
8. Runtime / VM ───────► (AD0007: Unhandled runtime trap / panic)
```

### Cascading Error Suppression

When multiple syntax or semantic errors occur, compiler passes attempt recovery:
- The lexer skips corrupt byte sequences and resumes at the next valid token boundary.
- The parser synchronizes on statement boundaries (semicolons, closing braces `}`, or statement keywords `let`, `fn`, `struct`).
- Type inference substitutes an `Unknown` sentinel type for failed expressions, preventing a cascade of secondary mismatch errors downstream.
- A configurable diagnostic cap (default 30) prevents log flooding on truncated inputs.

---

## Command-Line Interface

### Explaining Error Codes

Developers can view detailed explanations, common causes, erroneous code examples, and suggested resolutions using `--explain`:

```bash
# Explain a specific Rust-compatible error code
adesh --explain E0308

# Explain an Adesh-specific diagnostic code
adesh --explain AD0001

# List all registered diagnostic codes in a formatted table
adesh --explain list
```

### Structured JSON Output

For IDE language servers (LSP), automated linters, and CI checks, diagnostics can be emitted as JSON:

```bash
adesh build main.adesh --diagnostic-format=json
```

Output Schema (`schema_version: "1.0.0"`):

```json
{
  "schema_version": "1.0.0",
  "has_errors": true,
  "error_count": 1,
  "warning_count": 0,
  "diagnostics": [
    {
      "code": "E0308",
      "severity": "error",
      "phase": "typecheck",
      "message": "mismatched types",
      "file": "examples/types.adesh",
      "primary_span": {
        "start_line": 4,
        "start_col": 18,
        "end_line": 4,
        "end_col": 24,
        "line_text": "let count: i32 = \"seven\";"
      },
      "labels": [
        {
          "file": null,
          "span": {
            "start_line": 4,
            "start_col": 18,
            "end_line": 4,
            "end_col": 24,
            "line_text": "let count: i32 = \"seven\";"
          },
          "message": "expected `i32`, found string",
          "is_primary": true
        }
      ],
      "notes": [
        "this declaration requires an integer value"
      ],
      "helps": [
        "provide an integer or change the declared type"
      ],
      "suggestions": []
    }
  ]
}
```

### Compiler Panic & Backtrace Control

In the event of an internal compiler defect:
- By default, Adesh suppresses internal implementation stack traces and displays a clean message:
  ```text
  error: internal compiler error: Adesh encountered an unexpected failure
    = note: this is a compiler bug, not an error in your code
    = note: to inspect the full compiler backtrace, set ADESH_BACKTRACE=1 or run with --debug-backtrace
    = help: please report this issue at https://github.com/adeshlang/adeshlang/issues
  ```
- Setting `ADESH_BACKTRACE=1` or running `adesh <COMMAND> --debug-backtrace` prints the full internal stack frame trace for compiler developers.
