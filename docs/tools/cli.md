---
id: cli
title: Command-Line Interface (CLI) Reference
sidebar_label: CLI Reference
slug: /tools/cli
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# AdeshLang CLI Reference

<FeatureStatus status="STABLE" details="CLI toolchain for running, compiling, testing, and formatting AdeshLang projects" />

The `adesh` command-line tool manages the lifecycle of AdeshLang applications: running, type checking, native building, package management, formatting, and diagnostics.

---

## Command Syntax

```bash
adesh <COMMAND> [OPTIONS] <FILE> [-- <ARGS>...]
```

---

## Primary Commands

### `adesh run <file>`
Executes an AdeshLang script file using the selected execution backend (default: Interpreter).

```bash
# Run with default interpreter
adesh run app.adesh

# Run with Native JIT compilation (10-230x speedup)
adesh run --jit-native app.adesh

# Run with Bytecode VM engine
adesh run --bytecode app.adesh
```

---

### `adesh build <file>`
Compiles an AdeshLang program ahead-of-time (AOT) into a standalone native binary executable.

```bash
adesh build main.adesh -o bin/app.exe
```

---

### `adesh doctor`
Scans system dependencies, environment variables, compiler toolchain health, and native linker availability.

```bash
adesh doctor
```

---

### `adesh env`
Displays current AdeshLang environment paths, installation directories, and system configuration.

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
Manages AdeshLang package dependencies.

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
Formats AdeshLang source code according to official style guidelines.

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

## Testing Options (`adesh run --test`)

AdeshLang includes a built-in test runner.

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
| `--bytecode`, `--vm` | Bytecode VM | LIR stack-based bytecode virtual machine |
| `--jit` | LIR JIT | Intermediate LIR JIT compiler |
| `--jit-native`, `--njit` | Native Cranelift JIT | Compiles LIR directly to native x86_64/ARM machine code at runtime |
| `--adaptive`, `--ajit` | Adaptive JIT | Tiered speculative optimization JIT |
| `--gpu` | GPU MLIR | Experimental MLIR lowering target for CUDA/Vulkan (debug builds) |

---

## Environment Variables

AdeshLang respects environment variables to configure toolchain execution, process watchdog limits, build defaults, and MLIR GPU pipeline tools.

| Environment Variable | Description | Default / Format |
|---|---|---|
| `ADESH_RUN_TIMEOUT_MS` | Process watchdog timeout in milliseconds for `adesh run`. Terminates long-running or hung processes automatically. | e.g., `15000` (15s) |
| `ADESH_FAST_COMPILE` | Default to fast compile mode (`--fast`) for `adesh build`, skipping optimization passes for ~0.3s builds. | `1` or `0` |
| `ADESH_ENABLE_LTO` | Automatically enable Link-Time Optimization (LTO) for production builds. | `1` or `0` |
| `ADESH_ENABLE_DCE` | Automatically enable Dead-Code Elimination (DCE) in linker for smaller binaries. | `1` or `0` |
| `ADESH_VERBOSE` | Enable detailed compiler debug logging and linker command invocations. | `1` or `0` |
| `ADESHLANG_HOME` | Custom root installation directory for AdeshLang libraries and package cache. | Path (e.g. `~/.adeshlang`) |
| `ADESHLANG_TOOLCHAIN` | Path override for native linker and compiler toolchains (`clang`, `gcc`, `lld`). | Path |
| `ADESH_USE_VIR` | Toggle whether JIT engine uses VIR (Value IR) or LIR (Low-level IR). | `1` (on) or `0` (off) |
| `ADESH_MLIR_OPT` | Path override for `mlir-opt` tool in MLIR GPU backend pipeline. | Executable path |
| `ADESH_MLIR_TRANSLATE` | Path override for `mlir-translate` tool in MLIR GPU backend pipeline. | Executable path |
| `ADESH_LLC` | Path override for LLVM `llc` code generator in MLIR GPU backend pipeline. | Executable path |
| `ADESH_CLANG` | Path override for `clang` compiler driver in MLIR GPU backend pipeline. | Executable path |
| `NO_COLOR` | Disable ANSI color codes in terminal output. | Any value |

