---
id: overview
title: Execution Backends Overview
sidebar_label: Overview
---

# Execution Backends Overview

Adesh separates the source language from the execution model, so the same program can run in the interpreter during development or be compiled for a native or web target.

:::important Primary Execution Reference & Experimental Status
**Adesh is an Experimental Programming Language.**

The **Tree-Walk Interpreter** (`adesh run file.adesh`) is currently the **main reflection and primary source of truth** for Adesh execution, evaluation logic, and standard library behavior.

The supported execution targets are:
1. **Interpreter** (Reference implementation & source of truth)
2. **JIT Compiler** (Native machine code generation at runtime)
3. **AOT Native Compilation** (Self-contained native compilation without LLVM or external toolchain dependencies)
4. **WASM** (WebAssembly for browser and edge deployment)

The JIT compiler, native AOT, and WASM targets are under **active development** (`EXPERIMENTAL` / `PARTIAL` status).
:::

## Execution targets

| Target | Status | Best For | Command |
|--------|--------|----------|---------|
| **Interpreter** | Reference | Development, debugging, REPL | `adesh run file.adesh` |
| **JIT Compiler** | Partial | Compute-heavy workloads | `adesh run --njit file.adesh` |
| **AOT Native Compilation** | Partial | Standalone native binaries (zero LLVM dependency) | `adesh build file.adesh` |
| **WASM** | Partial | Web and edge deployment | `adesh compile-wasm file.adesh` |

## Performance & Baseline

No speedup guarantees are published while the native targets are experimental. Run the bundled programs on your own hardware with the exact toolchain version you plan to deploy:

- [`examples/fib/`](https://github.com/adeshlang/adeshlang/tree/main/examples/fib)
- [`examples/backends/`](https://github.com/adeshlang/adeshlang/tree/main/examples/backends)
- [`examples/benchmarks/`](https://github.com/adeshlang/adeshlang/tree/main/examples/benchmarks)

The interpreter is the correctness baseline: every optimized target must match its observable semantics before it is considered complete.

## Choosing a target

### Development

**Recommended: Interpreter**

```bash
adesh run src/main.adesh
```

Instant startup, the best diagnostics, and the easiest debugging experience.

### Compute-heavy workloads

**JIT Compiler**

```bash
adesh run --njit src/main.adesh
```

Compiles hot code to native machine code at runtime without requiring an ahead-of-time build step.

### Standalone Distribution

**AOT Native Compilation**

```bash
adesh build src/main.adesh -o myapp
./myapp
```

Produces a standalone native executable using the built-in compiler, ADOB v3 object format, and `adeshlink` linker—with **no dependency on LLVM, Clang, GCC, MSVC, or external linkers**.

### Web and Edge

**WASM**

```bash
adesh compile-wasm src/lib.adesh -o lib.wasm
```

```html
<script type="module">
  import { AdeshModule } from './lib.wasm';
  const module = await AdeshModule.instantiate();
</script>
```

Sandboxed execution that runs in browsers and edge runtimes.

## Backend Architecture

### Native Compilation Pipeline

```
Source Code (.adesh)
    ↓
┌─────────────────────────────────────────┐
│ Frontend (src/parsing/)                 │
│  • Lexer → Parser → AST                 │
│  • Type checking & Semantic Analysis    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ High-Level IR (HIR)                     │
│  • Desugaring & Scope Explicitation     │
│  • Constant Folding                     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Borrow Checker & MIR                    │
│  • Ownership Graph & ARC Insertion      │
│  • Move Analysis (Compile-Time Safety)  │
└─────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────┐
│ Target Selection                                 │
├──────────────┬──────────────┬─────────────┬──────┤
│ Interpreter  │ JIT Compiler │ AOT Native  │ WASM │
└──────────────┴──────────────┴─────────────┴──────┘
```

For the **AOT Native Compilation** path, lowering proceeds through Machine IR directly into the **ADOB v3** binary container and links via `adeshlink` into native PE, ELF, and Mach-O executables without invoking any external compiler or linker.

### Key Components

1. **Frontend** (`src/parsing/`)
   - Lexer: Tokenization and source tracking
   - Parser: Typed Abstract Syntax Tree generation
   - Semantic Engine: Static type inference, generic resolution, and safety verification

2. **IR Layers**
   - HIR (`src/ir/hir/`): High-level intermediate representation
   - MIR (`src/ir/mir/`): Middle-level IR for borrow checking and move semantics
   - Machine IR (`crates/adesh-codegen/`): Platform register allocation and instruction emission

3. **Execution targets**
   - **Interpreter**: AST tree-walk reference interpreter
   - **JIT Compiler**: Runtime machine code generator (Cranelift)
   - **AOT Native**: Self-contained native compilation toolchain (ADOB v3 + `adeshlink`)
   - **WASM**: Standalone WebAssembly emitter

## Usage Examples

### Switching targets

```bash
# Development: run via the interpreter
adesh run compute.adesh

# Compute acceleration: run via the JIT compiler
adesh run --njit compute.adesh

# Compile to a standalone native binary (zero LLVM/C dependencies)
adesh build compute.adesh -o compute
./compute

# Compile to WebAssembly
adesh compile-wasm compute.adesh -o compute.wasm
```

### Profiling and Analysis

```bash
# Dump intermediate representations
adesh run --dump-ast program.adesh
adesh run --dump-hir program.adesh

# Performance profiling
adesh run --profile program.adesh

# Trace execution
adesh run --trace program.adesh
```

### Optimization Levels for Native Builds

```bash
# Debug / fast compilation
adesh build -O0 program.adesh -o program

# Default optimizations
adesh build -O2 program.adesh -o program

# Maximum optimization (inlining, linker ICF & GC sections)
adesh build -O3 program.adesh -o program

# Size-optimized binary
adesh build -Os program.adesh -o program
```

## Target-specific considerations

### Interpreter

**Pros:**
- ✅ Instant startup
- ✅ Authoritative source of truth and best diagnostics
- ✅ Easy debugging and full REPL environment

**Cons:**
- ❌ Slower execution for tight numeric loops
- ❌ Higher memory per operation

**Best for:** Development, prototyping, testing, scripts

### JIT Compiler

**Pros:**
- ✅ Runtime native code generation
- ✅ No manual build step required
- ✅ Native CPU execution speed for compute-intensive functions

**Cons:**
- ❌ JIT runtime compilation overhead on startup
- ❌ Memory footprint from in-memory code generation

**Best for:** Compute-heavy scripts and server workloads

### AOT Native Compilation

**Pros:**
- ✅ Standalone native executables with instant startup
- ✅ Zero external dependencies: no LLVM, Clang, GCC, or MSVC needed
- ✅ Compact binaries (Windows PE from ~4 KB)
- ✅ Zero runtime garbage collection

**Cons:**
- ❌ Ahead-of-time compile step required
- ❌ Platform-specific binaries

**Best for:** CLI tools, distributed applications, systems software

### WASM

**Pros:**
- ✅ Browser and edge deployment
- ✅ Sandboxed security
- ✅ Portable bytecode execution

**Cons:**
- ❌ Requires a WebAssembly host runtime or browser environment

**Best for:** Web applications, serverless edge computing

## Next steps

- **[Interpreter](interpreter)** — Direct tree-walk interpretation & REPL details
- **[JIT Compiler](native-jit)** — Runtime native machine code compilation
- **[AOT (Native)](aot)** — Ahead-of-time native compilation without LLVM or external tools
- **[WebAssembly](webassembly)** — WASM compilation and browser integration
