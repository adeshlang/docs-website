---
id: overview
title: Execution Backends Overview
sidebar_label: Overview
---

# Execution Backends Overview

Adesh separates the source language from the execution model, so the same program can run in the interpreter during development or be compiled for a native, browser, or accelerated target.

:::important Primary Execution Reference & Experimental Status
**Adesh is an Experimental Programming Language.**

The **Tree-Walk Interpreter** (`adesh run file.adesh`) is currently the **main reflection and primary source of truth** for Adesh execution, evaluation logic, and standard library behavior.

The execution targets are **Interpreter**, **Native JIT**, **AOT Native Compilation**, **WASM**, and **GPU** (planned for a future release). The native, WASM, and GPU targets are under **active development** (`EXPERIMENTAL` / `PARTIAL` status). No stable performance claims are published until these targets reach a stable release.
:::

## Execution targets

| Target | Status | Best For | Command |
|--------|--------|----------|---------|
| **Interpreter** | Reference | Development, debugging, REPL | `adesh run file.adesh` |
| **Native JIT** | Partial | Compute-heavy workloads | `adesh run --jit-native file.adesh` |
| **AOT Native Compilation** | Partial | Standalone native binaries | `adesh build file.adesh` |
| **WASM** | Partial | Web and edge deployment | `adesh compile-wasm file.adesh` |
| **GPU** | Planned | Parallel workloads | `adesh run --gpu file.adesh` |

## Performance

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

**Native JIT**

```bash
adesh run --jit-native src/main.adesh
```

Compiles hot code to native machine code at runtime without a separate build step.

### Distribution

**AOT Native Compilation**

```bash
adesh build src/main.adesh -o myapp
./myapp
```

Produces a standalone executable with no runtime dependency on the Adesh toolchain.

### Web and edge

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

### GPU acceleration (planned)

The GPU target is planned for a future release. The `--gpu` flag exists in preview builds and lowers parallel work through MLIR to GPU kernels:

```bash
adesh run --gpu program.adesh
```

## Backend Architecture

### Compilation Pipeline

```
Source Code (.adesh)
    ↓
┌─────────────────────────────────────┐
│ Frontend                            │
│  • Lexer → Parser → AST             │
│  • Type checking                    │
│  • Ownership/borrow analysis        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ HIR (High-level IR)                 │
│  • Semantic analysis                │
│  • Optimization passes              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ LIR (Low-level IR)                  │
│  • SSA form                         │
│  • Type specialization              │
│  • Dead code elimination            │
└─────────────────────────────────────┘
    ↓
┌───────────┬────────────┬──────┬──────┬──────┐
│ Interp    │ Native JIT │ AOT  │ WASM │ GPU  │
└───────────┴────────────┴──────┴──────┴──────┘
```

### Key Components

1. **Frontend** (`src/frontend/`)
   - Lexer: Tokenization
   - Parser: AST generation
   - Type checker: Static type verification

2. **IR Layers** (`src/ir/`)
   - HIR: High-level intermediate representation
   - LIR: Low-level intermediate representation (SSA form)

3. **Execution targets** (`src/backends/`)
   - Interpreter: tree-walk interpreter
   - Native JIT: in-memory native compiler (Cranelift)
   - AOT: standalone ahead-of-time native compilation
   - WASM: WebAssembly target
   - GPU: MLIR-based GPU compiler (planned)

## Usage Examples

### Switching targets

```bash
# Same code, different execution targets
adesh run compute.adesh              # Interpreter
adesh run --jit-native compute.adesh # Native JIT

# Compile to a native binary
adesh build compute.adesh -o compute
./compute

# Compile to WebAssembly
adesh compile-wasm compute.adesh -o compute.wasm
wasmtime compute.wasm
```

### GPU Backend Usage

```bash
# Auto-detect GPU (CUDA > ROCm > Vulkan > Metal)
adesh run --gpu kernel.adesh

# Specify GPU target
adesh run --gpu --gpu-target=cuda kernel.adesh
adesh run --gpu --gpu-target=rocm kernel.adesh
adesh run --gpu --gpu-target=vulkan kernel.adesh

# Custom thread configuration
adesh run --gpu --gpu-grid=256,1,1 --gpu-block=128,1,1 kernel.adesh

# Inspect generated MLIR
adesh run --gpu --dump-mlir kernel.adesh
```

### Profiling and Analysis

```bash
# Dump intermediate representations
adesh run --dump-ast program.adesh
adesh run --dump-hir program.adesh
adesh run --dump-lir program.adesh

# Performance profiling
adesh run --profile program.adesh

# Trace execution
adesh run --trace program.adesh
```

### Cross-compilation

Compile for different targets:

```bash
# Windows target from Linux
adesh build program.adesh -o program.exe --target=x86_64-pc-windows-msvc

# Linux target from macOS
adesh build program.adesh -o program --target=x86_64-unknown-linux-gnu

# WebAssembly
adesh compile-wasm program.adesh -o program.wasm --target=wasm32-unknown-unknown
```

### Optimization levels

```bash
# No optimization (fastest compilation)
adesh run --opt-level=0 program.adesh

# Default optimizations
adesh run --opt-level=2 program.adesh

# Maximum optimization (slowest compilation, fastest runtime)
adesh build program.adesh -o program --opt-level=3
```

## Target-specific considerations

### Interpreter

**Pros:**
- ✅ Instant startup
- ✅ Best error messages
- ✅ Easy debugging

**Cons:**
- ❌ Slowest execution
- ❌ Higher memory per operation

**Best for:** Development, learning, prototyping

### Native JIT

**Pros:**
- ✅ Runtime native code generation
- ✅ No separate build step
- ✅ Good fit for long-running processes

**Cons:**
- ❌ Requires the JIT runtime
- ❌ Larger memory footprint
- ❌ Still experimental

**Best for:** Compute-heavy services and long-running applications

### AOT Native Compilation

**Pros:**
- ✅ Standalone executables
- ✅ No runtime dependencies
- ✅ Instant startup

**Cons:**
- ❌ Longer compilation time
- ❌ Platform-specific binary
- ❌ Native pipeline still maturing

**Best for:** Distribution, CLIs, production binaries

### WASM

**Pros:**
- ✅ Browser and edge deployment
- ✅ Sandboxed security
- ✅ Portable output

**Cons:**
- ❌ WASM runtime required
- ❌ Some platform limitations

**Best for:** Web apps, edge computing

### GPU (planned)

**Pros:**
- ✅ Designed for parallel workloads
- ✅ Multiple GPU backend targets planned
- ✅ Aimed at ML and scientific computing

**Cons:**
- ❌ Not yet available for general use
- ❌ Requires GPU hardware
- ❌ Only beneficial for parallel workloads

**Best for:** Future GPU computing, ML, and scientific simulations

## Next steps

- **[Interpreter](interpreter)** — Direct interpretation details
- **[Native JIT](native-jit)** — Native Cranelift JIT
- **[AOT](aot)** — Ahead-of-time native compilation
- **[WebAssembly](webassembly)** — WASM compilation
- **[GPU](gpu-mlir)** — Planned GPU acceleration

Learn more about each target's implementation, use cases, and optimization strategies in the following sections.
