---
id: cli
title: Command-Line Interface (CLI) Reference
sidebar_label: CLI Reference
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Adesh CLI Reference

<FeatureStatus status="STABLE" details="CLI toolchain for running, compiling, testing, and formatting Adesh projects" />

The `adesh` command-line tool manages the lifecycle of Adesh applications: running, type checking, native building, package management, formatting, and diagnostics.

---

## Command Syntax

```bash
adesh <COMMAND> [OPTIONS] <FILE> [-- <ARGS>...]
```

---

## Primary Commands

### `adesh run <file>`
Executes an Adesh script file using the selected execution backend (default: Interpreter).

```bash
# Run with default interpreter
adesh run app.adesh

# Run with Native JIT compilation
adesh run --jit-native app.adesh
```

---

### `adesh build <file>`
Compiles an Adesh program ahead-of-time (AOT) into a standalone native binary executable, ADOB object, static archive, or shared library.

```bash
# Build native executable directly with native Adesh Linker
adesh build main.adesh -o bin/app.exe

# Emit native ADOB (Adesh Native Object Binary) object file
adesh build main.adesh --emit-adob -o target/main.adob

# Build static library (.lib / .a)
adesh build math.adesh --lib -o libmath.lib

# Build shared library (.dll / .so)
adesh build api.adesh --shared -o api.dll

# Fast iterative development build (skip optimizations)
adesh build main.adesh --fast

# Deterministic reproducible release build with stripped symbols
adesh build main.adesh --release --deterministic --strip -o app.exe
```

---

### `adesh adob <subcommand>`
Inspects, validates, and manages ADOB (`.adob`) object binaries.

```bash
# Inspect object headers, target architecture, and exports
adesh adob inspect target/main.adob

# Validate file integrity, alignment, and bounds
adesh adob validate target/main.adob

# Dump symbol table
adesh adob dump-symbols target/main.adob

# Dump section table
adesh adob dump-sections target/main.adob

# Dump relocation table
adesh adob dump-relocations target/main.adob
```

---

### `adesh toolchain <subcommand>`
Manages installed toolchain profiles, cross-compilation targets, and external toolchains.

```bash
# List available and active toolchains
adesh toolchain list

# Discover and register host system compilers and linkers into Adesh
adesh toolchain --external install

# Install a specific cross-compilation toolchain
adesh toolchain install aarch64-unknown-linux-gnu
```

---

### `adesh doctor`
Scans system dependencies, environment variables, compiler toolchain health, and native linker availability.

```bash
adesh doctor
```

---

### `adesh env`
Displays current Adesh environment paths, installation directories, and system configuration.

```bash
adesh env
```

---

### `adesh repair`
Automatically repairs broken environment settings, toolchain configurations, or corrupted local caches.

```bash
adesh repair
```

---

### `adesh pkg <subcommand>`
Manages Adesh package dependencies.

```bash
adesh pkg init
adesh pkg install <package_name>
adesh pkg list
```

---

### `adesh check <file>`
Runs full type checking and semantic borrow analysis on a source file without executing it.

```bash
adesh check src/main.adesh
```

---

### `adesh format <file>` / `adesh fmt <file>`
Formats Adesh source code according to official style guidelines.

```bash
# Preview formatting changes
adesh fmt main.adesh

# Apply formatting directly to the file
adesh fmt --write main.adesh
```

---

### `adesh repl`
Starts an interactive Read-Eval-Print Loop (REPL) shell for rapid experimentation.

```bash
adesh repl
```

---

### `adesh editor [file]`
Launches the bundled cross-platform TUI code editor with LSP diagnostics, multiple buffer tabs, workspace explorer, and interactive backend runner.

```bash
# Open editor in current workspace
adesh editor .

# Open specific source file
adesh editor src/main.adesh
```

For full details and keybindings, see the [TUI Code Editor Documentation](/docs/tools/tui-editor).

---

## Testing Options (`adesh run --test`)

Adesh includes a built-in test runner.

```bash
# Run all tests in a test file
adesh run --test tests/math_test.adesh

# Run a specific test by name
adesh run --test --test-name test_addition tests/math_test.adesh

# Stop on first test failure
adesh run --test --fail-fast tests/suite.adesh

# Benchmark across backends (Interpreter vs JIT vs Native JIT)
adesh run --test --backend-check tests/integration.adesh

# Output machine-readable JSON for CI pipelines
adesh run --test --format json tests/suite.adesh > results.json
```

---

## Execution Backend Flags

| Flag | Backend Mode | Description |
|---|---|---|
| `--interpreter` | Interpreter | Standard interpreter (default, 100% feature coverage) |
| `--jit-native`, `--njit` | Native Cranelift JIT | Compiles LIR directly to native x86_64/ARM machine code at runtime |
| `--gpu` | GPU MLIR | Experimental MLIR lowering target for CUDA/Vulkan (debug builds) |

---

## Environment Variables

Adesh respects environment variables to configure toolchain execution, process watchdog limits, build defaults, and MLIR GPU pipeline tools.

| Environment Variable | Description | Default / Format |
|---|---|---|
| `ADESH_RUN_TIMEOUT_MS` | Process watchdog timeout in milliseconds for `adesh run`. Terminates long-running or hung processes automatically. | e.g., `15000` (15s) |
| `ADESH_FAST_COMPILE` | Default to fast compile mode (`--fast`) for `adesh build`, skipping optimization passes for ~0.3s builds. | `1` or `0` |
| `ADESH_ENABLE_LTO` | Automatically enable Link-Time Optimization (LTO) for production builds. | `1` or `0` |
| `ADESH_ENABLE_DCE` | Automatically enable Dead-Code Elimination (DCE) in linker for smaller binaries. | `1` or `0` |
| `ADESH_VERBOSE` | Enable detailed compiler debug logging and linker command invocations. | `1` or `0` |
| `ADESHLANG_HOME` | Custom root installation directory for Adesh libraries and package cache. | Path (e.g. `~/.adeshlang`) |
| `ADESHLANG_TOOLCHAIN` | Path override for native linker and compiler toolchains (`clang`, `gcc`, `lld`). | Path |
| `ADESH_USE_VIR` | Toggle whether JIT engine uses VIR (Value IR) or LIR (Low-level IR). | `1` (on) or `0` (off) |
| `ADESH_MLIR_OPT` | Path override for `mlir-opt` tool in MLIR GPU backend pipeline. | Executable path |
| `ADESH_MLIR_TRANSLATE` | Path override for `mlir-translate` tool in MLIR GPU backend pipeline. | Executable path |
| `ADESH_LLC` | Path override for LLVM `llc` code generator in MLIR GPU backend pipeline. | Executable path |
| `ADESH_CLANG` | Path override for `clang` compiler driver in MLIR GPU backend pipeline. | Executable path |
| `NO_COLOR` | Disable ANSI color codes in terminal output. | Any value |

