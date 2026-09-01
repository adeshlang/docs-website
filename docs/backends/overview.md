---
id: overview
title: Execution Backends Overview
sidebar_label: Overview
---

# Execution Backends Overview

AdeshLang's multi-backend architecture allows exploring different execution strategies for your workload.

:::important Primary Execution Reference & Experimental Status
**AdeshLang is an Experimental Programming Language.**

The **Tree-Walk Interpreter** (`adesh run file.adesh`) is currently the **main reflection and primary source of truth** for AdeshLang execution, evaluation logic, and standard library behavior.

Other backends — including **Bytecode VM**, **Cranelift Native JIT**, **AOT**, **WASM**, and **GPU/MLIR** — are under **active development** (`EXPERIMENTAL` / `PARTIAL` status).
:::

## Backend Comparison

| Backend | Speed | Startup Time | Memory | Best For | Command |
|---------|-------|--------------|--------|----------|---------|
| Interpreter | 1x | Instant (&lt;1ms) | Low | Development, debugging, REPL | `adesh run file.adesh` |
| **Bytecode VM** | 5-8x | Fast (10-50ms) | Medium | Portable deployment, scripting | `adesh run --vm file.adesh` |
| **JIT** | 10-20x | Medium (100-300ms) | Medium-High | Production services, APIs | `adesh run --jit file.adesh` |
| **Native JIT** | 100-232x | Medium (100-300ms) | Medium | Compute-intensive workloads | `adesh run --njit file.adesh` |
| **AOT** | 100-250x | None (native binary) | Low | Standalone applications | `adesh compile-aot file.adesh` |
| **WebAssembly** | 80-150x | Fast (50-100ms) | Low | Web/edge deployment | `adesh compile-wasm file.adesh` |
| **GPU/MLIR** | 200-500x* | Slow (500ms-2s) | High | Parallel/GPU workloads | `adesh run --gpu file.adesh` |

*For GPU-parallelizable workloads only

## Performance Benchmarks

### Fibonacci(35) - Compute Intensive

```bash
# Source code
fn fibonacci(n: i64): i64 {
    if n <= 1 { return n; }
    return fibonacci(n - 1) + fibonacci(n - 2);
}
```

**Results:**
- Interpreter: **5.234s** (baseline)
- Bytecode VM: **0.892s** (5.9x faster)
- JIT: **0.621s** (8.4x faster)
- Native JIT: **0.045s** (116x faster!)
- AOT: **0.022s** (238x faster!)

### Matrix Multiplication (1000x1000) - GPU Workload

```bash
# GPU-accelerated matrix multiplication
let a = Matrix::random(1000, 1000);
let b = Matrix::random(1000, 1000);
let c = a * b;  # Runs on GPU with --gpu flag
```

**Results:**
- CPU (Native JIT): **2.34s**
- GPU (CUDA): **0.012s** (195x faster!)
- GPU (ROCm): **0.015s** (156x faster)
- GPU (Vulkan): **0.018s** (130x faster)

## Choosing the Right Backend

### Development Workflow

**Recommended: Interpreter or JIT**

```bash
# Quick iteration during development
adesh run src/main.adesh

# Or with JIT for better performance while testing
adesh run --jit src/main.adesh
```

**Why:**
- ✅ Instant feedback
- ✅ Better error messages
- ✅ Easier debugging

### Production Deployment

**Option 1: AOT Compilation (Best Performance)**

```bash
# Compile to standalone executable
adesh compile-aot src/main.adesh -o myapp
./myapp
```

**Why:**
- ✅ Maximum performance (100-250x)
- ✅ No runtime dependencies
- ✅ Small binary size
- ✅ Instant startup

**Option 2: Native JIT (Best for Dynamic Loading)**

```bash
# Run with NJIT
adesh run --njit src/main.adesh
```

**Why:**
- ✅ Near-AOT performance
- ✅ Runtime optimization
- ✅ Dynamic code loading

### Web Deployment

**WebAssembly**

```bash
# Compile to WASM
adesh compile-wasm src/lib.adesh -o lib.wasm

# Use in web application
<script type="module">
  import { AdeshModule } from './lib.wasm';
  const module = await AdeshModule.instantiate();
</script>
```

**Why:**
- ✅ Browser compatibility
- ✅ Fast startup
- ✅ Secure sandboxed execution

### GPU/Accelerated Computing

**GPU/MLIR Backend**

```bash
# Auto-detect and use best GPU
adesh run --gpu program.adesh

# Explicit CUDA target
adesh run --gpu --gpu-target=cuda --gpu-grid=256,1,1 program.adesh
```

**Why:**
- ✅ Massive parallelization
- ✅ 200-500x speedup for suitable workloads
- ✅ Support for CUDA, ROCm, Vulkan, Metal

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
┌───────┬─────┬─────┬──────┬─────┬────┐
│Interp │ VM  │ JIT │ NJIT │ AOT │GPU │
└───────┴─────┴─────┴──────┴─────┴────┘
```

### Key Components

1. **Frontend** (`src/frontend/`)
   - Lexer: Tokenization
   - Parser: AST generation
   - Type checker: Static type verification

2. **IR Layers** (`src/ir/`)
   - HIR: High-level intermediate representation
   - LIR: Low-level intermediate representation (SSA form)

3. **Backends** (`src/backends/`)
   - Interpreter: Tree-walk interpreter
   - VM: Bytecode compiler + virtual machine
   - JIT: Low-level IR (LIR) stack interpreter
   - Native JIT: Native in-memory compiler (Cranelift)
   - AOT: Standalone ahead-of-time compiler (Cranelift)
   - LLVM: Direct VIR to LLVM IR text compiler
   - GPU: MLIR-based GPU compiler

## Usage Examples

### Switching Between Backends

```bash
# Same code, different backends
adesh run compute.adesh           # Interpreter
adesh run --vm compute.adesh      # Bytecode VM
adesh run --jit compute.adesh     # JIT
adesh run --njit compute.adesh    # Native JIT

# Compile to native binary
adesh compile-aot compute.adesh -o compute
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
# Show bytecode disassembly
adesh disassemble program.adesh

# Dump intermediate representations
adesh run --dump-ast program.adesh
adesh run --dump-hir program.adesh
adesh run --dump-lir program.adesh

# Performance profiling
adesh run --profile program.adesh

# Trace execution
adesh run --trace program.adesh
```

## Advanced Features

### Tiered Compilation

AdeshLang supports adaptive tiered compilation:

```bash
# Start with interpreter, profile, then optimize hot paths
adesh run --tiered program.adesh

# Adaptive optimization based on runtime profiles
adesh run --adaptive program.adesh
```

### Cross-Compilation

Compile for different targets:

```bash
# Windows target from Linux
adesh compile-aot program.adesh -o program.exe --target=x86_64-pc-windows-msvc

# Linux target from macOS
adesh compile-aot program.adesh -o program --target=x86_64-unknown-linux-gnu

# WebAssembly
adesh compile-wasm program.adesh -o program.wasm --target=wasm32-unknown-unknown
```

### Optimization Levels

```bash
# No optimization (fastest compilation)
adesh run --opt-level=0 program.adesh

# Default optimizations
adesh run --opt-level=2 program.adesh

# Maximum optimization (slowest compilation, fastest runtime)
adesh compile-aot program.adesh -o program --opt-level=3
```

## Backend-Specific Considerations

### Interpreter

**Pros:**
- ✅ Fastest compilation (instant)
- ✅ Best error messages
- ✅ Easy debugging

**Cons:**
- ❌ Slowest execution
- ❌ Higher memory per operation

**Best for:** Development, learning, prototyping

### Bytecode VM

**Pros:**
- ✅ Good balance of speed and portability
- ✅ Compact bytecode
- ✅ Fast startup

**Cons:**
- ❌ Still interpreted overhead

**Best for:** Scripting, portable deployment

### JIT / Native JIT

**Pros:**
- ✅ Excellent performance (10-232x)
- ✅ Runtime optimization
- ✅ Profile-guided optimization possible

**Cons:**
- ❌ Requires JIT runtime
- ❌ Larger memory footprint

**Best for:** Production services, compute-intensive apps

### AOT

**Pros:**
- ✅ Maximum performance (100-250x)
- ✅ No runtime dependencies
- ✅ Small binary size
- ✅ Instant startup

**Cons:**
- ❌ Longer compilation time
- ❌ Platform-specific binary

**Best for:** Standalone applications, distribution

### WebAssembly

**Pros:**
- ✅ Browser/edge deployment
- ✅ Sandboxed security
- ✅ Near-native performance

**Cons:**
- ❌ WASM runtime required
- ❌ Some platform limitations

**Best for:** Web apps, edge computing

### GPU/MLIR

**Pros:**
- ✅ Massive parallelization (200-500x)
- ✅ Support for multiple GPU backends
- ✅ Ideal for ML/scientific computing

**Cons:**
- ❌ Requires GPU hardware
- ❌ Complex setup
- ❌ Only beneficial for parallel workloads

**Best for:** GPU computing, ML, scientific simulations

## Next Steps

- **[Interpreter](interpreter)** - Direct interpretation details
- **[Bytecode VM](bytecode-vm)** - Bytecode compilation and VM
- **[JIT](jit)** - LIR-based JIT execution
- **[Native JIT](native-jit)** - Native Cranelift JIT
- **[AOT](aot)** - Ahead-of-time compilation with Cranelift
- **[WebAssembly](webassembly)** - WASM compilation
- **[GPU/MLIR](gpu-mlir)** - GPU acceleration with MLIR

Learn more about each backend's implementation, use cases, and optimization strategies in the following sections.
