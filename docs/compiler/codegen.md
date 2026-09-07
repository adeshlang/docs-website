---
id: codegen
title: Code Generation & Backends - From VIR to Native Code
sidebar_label: Codegen & Backends
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Code Generation & Backends — From VIR to Native Code

<FeatureStatus status="PARTIAL" details="Interpreter full; Cranelift JIT/AOT, Bytecode VM, WASM, GPU/MLIR under active development" />

The final compiler stage consumes the unified
[**VIR**](/docs/compiler/ir) and produces something executable. AdeshLang has
several backends, each a different "final consumer":

```text
                  ┌──► Interpreter (tree-walk; full)
                  │
        ┌───────┐ ├──► Bytecode VM (--bytecode / --vm; partial)
 VIR ──►│ codegen│ ├──► Baseline / Adaptive JIT (--jit; partial)
        └───────┘ ├──► Native Cranelift JIT (--jit-native / --njit; partial)
                  ├──► AOT Native (--aot; partial)
                  ├──► WebAssembly (--wasm; partial)
                  └──► GPU / MLIR (--gpu; planned)
```

## Backend status (honest)

| Backend | Status | Notes |
|---|---|---|
| **Interpreter** | ✅ Full | primary source of truth, powers `adesh run` |
| **Bytecode VM** | 🟡 Partial | `--bytecode` / `--vm` |
| **JIT (baseline/adaptive)** | 🟡 Partial | `--jit` |
| **Native Cranelift JIT** | 🟡 Partial | `--jit-native` / `--native-jit` / `--njit` |
| **AOT Native** | 🟡 Partial | `--aot` |
| **WebAssembly** | 🟡 Partial | `--wasm` |
| **GPU / MLIR** | 🔵 Planned | `--gpu` (CUDA/Vulkan) |

All flags are defined in
[`src/cli/args.rs`](file:///d:/Projects/AdeshLang/src/cli/args.rs).

## The interpreter backend

**Source:** `src/execution/`, `src/backends/interpreter_backend/`

The tree-walk interpreter evaluates the AST/HIR directly with nested
environments, a promise microtask queue, timers, and builtins (see
[Runtime & Value Model](/docs/compiler/runtime)). It's the *reference
implementation* — every other backend must match its observable behavior.

```text
adesh run myapp.adesh          → interpreter
adesh run --backend=interpreter myapp.adesh
adesh -i myapp.adesh
```

## JIT & native codegen

**Source:** `src/backends/jit/`, `src/backends/aot/`, `src/backends/llvm/`

The JIT path lowers VIR toward **Cranelift** (and supports an LLVM route)
to emit native x86_64/ARM machine code:

- `backends/jit/` — baseline & adaptive JIT tiers
- `backends/aot/` — AOT pipeline: `abi.rs`, `cache.rs`, `module_linking.rs`,
  `object_gen.rs`, `static_linker.rs`, `cranelift/` and `cranelift_impl/`
- `backends/common/ffi` — C FFI import/export (`extern "C" ...`, `import`)

Because these are evolving, the docs describe the *pipeline*, not
stability guarantees:

```bash
adesh run --jit file.adesh          # baseline/adaptive JIT
adesh run --jit-native file.adesh   # native Cranelift JIT
adesh run --njit file.adesh         # alias
adesh build file.adesh -o app       # AOT
```

## WebAssembly & GPU/MLIR

- `--wasm` targets WebAssembly via `src/backends/wasm_backend/`
- `--gpu` targets MLIR → CUDA/Vulkan via `src/backends/mlir/`

Both are the most experimental; see
[Backends Overview](/docs/backends/overview) for the current matrix.

## Performance profile (from the benchmarks page)

| Backend | Relative speed | Best for |
|---|---|---|
| Interpreter | 1× | dev, debugging, REPL |
| Bytecode VM | 5–8× | scripting, portability |
| JIT | 10–20× | long-running compute |
| Native JIT | 100–232× | compute-intensive |
| AOT | 100–250× | final binaries |

Full numbers: [Backend Benchmarks](/docs/backends/overview#performance-benchmarks)

## Where this fits

- Previous: [The IR Pipeline](/docs/compiler/ir)
- Per-backend docs: [Execution Backends](/docs/backends/overview)
- Tooling: [CLI Reference](/docs/tools/cli)
