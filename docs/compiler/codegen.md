---
id: codegen
title: Code Generation and Backends
sidebar_label: Codegen & Backends
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Code Generation and Backends

<FeatureStatus status="PARTIAL" details="Backend feature coverage varies; the ADOB native path is partial and planned for v0.4.0" />

Most existing backends consume [**VIR**](/docs/compiler/ir). The newer ADOB
native toolchain is a separate path from HIR through Machine IR, ADOB, and
`adeshlink`; it does not consume VIR.

```
                  ┌──► Interpreter (tree-walk; full)
                  │
        ┌───────┐ ├──► Native Cranelift JIT (--jit-native / --njit; partial)
 VIR ──►│ codegen│ ├──► AOT Native (--aot; partial)
        └───────┘ ├──► WebAssembly (--wasm; partial)
                  └──► GPU / MLIR (--gpu; planned)
```

The native toolchain follows a separate path:

```text
HIR ──► partial native lowering ──► Machine IR ──► x86-64 codegen
                                                    │
                                                    ▼
                                              ADOB object
                                                    │
                                                    ▼
                                                adeshlink
                                                    │
                                                    ▼
                                           native executable
```

The native compiler and linker improvements are **planned for v0.4.0**. The
latest verified behavior remains the current public release. See the
[native toolchain guide](/docs/compiler/native-toolchain) for target status and
limitations.

---

## Pipeline Position

```
Source → Lexer → Parser → AST → HIR → MIR/Borrow → VIR ──► VIR CodeGen ──► Executable
                                                      │
                                          ┌───────────┼───────────────┐
                                          ▼           ▼               ▼
                                      Interpreter  JIT Compiler    WASM
                                      (reference)  (native)        (portable)
```

The native AOT path is self-contained: HIR → Machine IR → Native Codegen → ADOB v3 → `adeshlink` → Executable (without any LLVM or external toolchain dependencies).
Backend interfaces and supported language features vary.

---

## Backend Status (Honest)

| Backend | Status | CLI Flag | Source Path | Best For |
|---|---|---|---|---|
| **Interpreter** | ✅ Full | `adesh run` (default) | `src/execution/`, `src/backends/interpreter_backend/` | dev, debugging, REPL |
| **JIT Compiler** | 🟡 Partial | `--njit` / `--jit-native` / `--native-jit` | `src/backends/jit/cranelift/`, `src/backends/jit/native/` | compute-intensive |
| **AOT Native** | 🟠 Active (Default Build) | `adesh build` (default) / `--emit-adob` | `crates/adesh-codegen/`, `crates/adesh-object/`, `linker/` | standalone native compilation without LLVM or external dependencies |

| **WebAssembly** | 🟡 Partial | `--wasm` | `src/backends/wasm_backend/`, `src/backends/wasm/` | browser, edge |


`adesh build` uses the **native pipeline** (HIR → Machine IR → ADOB →
`adeshlink`) as its default executable path; Cranelift is opt-in via
`--codegen=cranelift`, and `--emit-adob` / `--emit-asm` emit intermediate
artifacts only. The native path covers a substantial language subset;
unsupported constructs are tracked in [CURRENT_STATE.md](https://github.com/adeshlang/adeshlang/blob/main/CURRENT_STATE.md).

---

## Architecture Diagram — VIR to Targets

```
                        VIR Module (SSA, validated)
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
    │ VIR     │          │ VIR     │          │ VIR     │
    │ Lower   │          │ Lower   │          │ Lower   │
    └────┬────┘          └────┬────┘          └────┬────┘
         │                    │                    │
    ┌────▼────────┐     ┌────▼────────┐     ┌─────▼───────┐
    │Interpreter  │     │ Cranelift   │     │    WASM     │
    │ (tree-walk) │     │  IR (CLIF)  │     │   Emitter   │
    └────┬────────┘     └────┬────────┘     └─────┬───────┘
         │                   │                    │
    ┌────▼────────┐     ┌────▼────────┐     ┌─────▼───────┐
    │  Env + Value│     │ Machine Code│     │    WASM     │
    │  dispatch   │     │  (x64/ARM)  │     │  (portable) │
    └────┬────────┘     └────┬────────┘     └─────┬───────┘
         │                   │                    │
         │              ┌────┴────┐               │
         │              ▼         ▼               ▼
         │          JIT (in-mem)  AOT (object file → linker → binary)
         │              │         │
         └──────────────┴─────────┴──────────────► Runtime (Value, interner, GC-less)
```

---

## The Interpreter Backend

**Sources:** `src/execution/`, `src/backends/interpreter_backend/`, `src/execution/runtime_core/interpreter_core.rs`

The tree-walk interpreter evaluates the AST/HIR directly with nested environments, a promise microtask queue, timers, and builtin dispatch (see [Runtime & Value Model](/docs/compiler/runtime)). It is the **reference implementation** — every other backend must match its observable behavior, including error messages and evaluation order.

```
adesh run myapp.adesh                        → interpreter (default)
adesh run --backend=interpreter myapp.adesh  → explicit
adesh -i myapp.adesh                         → alias
```

### How It Works

```
VIR instruction ──► interpreter dispatch (match on opcode)
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    Value ops    Environment     Builtin call
    (add, mul)   (load/store)    (print, fs, net)
         └──────────────┼──────────────┘
                        ▼
                    Value result (16-byte enum)
```

- **Value model**: compact 16-byte `Value` enum (`src/typesystem/value_optimized.rs`) — inline numbers/bools, `Arc<str>` interned strings, `Arc<Map>` objects.
- **Environments**: chained scopes with cached bindings for hot-path variable lookup.
- **Async**: single-threaded event loop — promise microtasks and timers are cooperative.

### When to Use It

- Development, REPL, error-message fidelity, `try`/`catch` semantics, and any program that hasn't opted into native compilation.

---

## JIT Compiler

**Sources:** `src/backends/jit/cranelift/`, `src/backends/jit/native/`, `src/backends/jit/array_ops/`, `src/backends/jit/optimizations/`, `src/backends/jit/mod.rs`

The JIT compiler lowers VIR to Cranelift IR at runtime and executes the result from executable memory.

### Native code path

```
VIR ──► Cranelift CLIF ──► Cranelift codegen ──► executable buffer (mmap RX)
          │                       │
      vir_to_clif           isa.emit (x64 / aarch64)
      (src/backends/jit/cranelift/)
```

Because VIR is already SSA, mapping to Cranelift CLIF is direct — each VIR virtual register becomes a CLIF value, each `Phi` becomes a CLIF block param.

```bash
adesh run --jit-native file.adesh   # native Cranelift JIT
adesh run --njit file.adesh         # alias for --jit-native
adesh run --native-jit file.adesh   # alias
```

### FFI from JIT Code

`src/backends/common/ffi` — C FFI import/export (`extern "C" ...`, `import`) is lowered to native call ABI so JIT'd code can call and be called from C.

---

## Cranelift AOT — Ahead-of-Time Native Binaries

**Sources:** `src/backends/aot/` — `abi.rs`, `cache.rs`, `module_linking.rs`, `object_gen.rs`, `runtime_bridge.rs`, `static_linker.rs`, `symbols.rs`, `cranelift/`, `cranelift_impl/`, `linker/`, `memory/`, `mod.rs`

AOT compiles VIR to a standalone native binary via object file + linker.

```
VIR ──► Cranelift CLIF ──► object file (.o) ──► linker ──► native executable
          │                     │                  │
      aot/cranelift/      object_gen.rs      static_linker.rs
      aot/cranelift_impl/  (ELF/Mach-O/COFF)  module_linking.rs
                               │                  │
                          cache.rs (incremental)  symbols.rs (symbol table)
                               │                  │
                          abi.rs (calling convention)
                          runtime_bridge.rs (link runtime lib)
```

| AOT File | Role |
|---|---|
| `abi.rs` | Calling convention, argument passing, return handling |
| `cache.rs` | Incremental compilation cache — skip unchanged modules |
| `module_linking.rs` | Link multiple Adesh modules into one artifact |
| `object_gen.rs` | Emit ELF (Linux), Mach-O (macOS), COFF (Windows) |
| `static_linker.rs` | Invoke system linker (`cc` / `ld`) with correct flags |
| `runtime_bridge.rs` | Link the Rust runtime (Value, interner, builtins) into the binary |
| `symbols.rs` | Symbol table generation & demangling |
| `cranelift/` / `cranelift_impl/` | Cranelift backend specialization for AOT (vs JIT) |

```bash
adesh build file.adesh -o app       # Cranelift AOT compile
./app                               # run native binary (no runtime install needed)
adesh build --release file.adesh    # optimized AOT (more opts, no debug info)
```

**AOT vs JIT:**

| Property | JIT | AOT |
|---|---|---|
| When | at runtime, on demand | before execution, offline |
| Startup | slower (compile on first run) | instant (already native) |
| Peak speed | similar (same Cranelift) | similar |
| Distribution | needs Adesh runtime installed | single self-contained binary |
| Use case | dev, long-running services | CLI tools, shipped apps |

---

## WebAssembly Target

**Sources:** `src/backends/wasm_backend/`, `src/backends/wasm/`

`--wasm` targets WebAssembly via VIR → WASM lowering. The same Adesh source can run in browsers and edge runtimes without rewriting.

```
VIR ──► WASM emitter ──► .wasm binary
          │
     wasm_backend/ (instruction selection, WASM types, linear memory)
```

```bash
adesh run --wasm file.adesh        # run via WASM runtime
adesh build --wasm file.adesh -o app.wasm
```

Status is experimental — see [Backends Overview](/docs/backends/overview) for the current matrix.

---

## GPU / MLIR Target

**Sources:** `src/backends/mlir/`

`--gpu` targets MLIR → CUDA/Vulkan. VIR operations (especially SIMD and parallel loops) are lowered to MLIR dialects and then to GPU kernels.

```
VIR (SIMD + parallel loops) ──► MLIR ──► PTX/SPIR-V ──► GPU execution
                                  │
                              mlir/ (dialect lowering, kernel dispatch)
```

This is the most experimental path; the docs describe the pipeline, not stability guarantees.

---

## CLI Reference — Backend Flags

| Flag | Backend | Meaning |
|---|---|---|
| (none) | Interpreter | default; `adesh run file.adesh` |
| `--njit`, `--jit-native`, `--native-jit` | JIT Compiler | native machine-code compilation at runtime |
| `adesh build` | AOT Native | standalone native binary (zero LLVM / external dependency) |
| `--wasm` | WASM | WebAssembly emission |

| `--emit=hir\|mir\|vir\|cfg` | (debug) | dump IR at that stage and exit |
| `--backend=interpreter` | Interpreter | explicit selection |

All flags are parsed in `src/cli/args.rs`.

The separate `--emit-adob` option selects the partial Machine-IR native object
path. It emits an ADOB object; use `adeshlink` to link it. See
[Native Compiler Toolchain](/docs/compiler/native-toolchain).

---

## Performance Profile

No relative-speed figures are published while the native targets are experimental. The interpreter is the correctness baseline, and each optimized target must match its observable semantics before it is considered complete. Measure on your own hardware with the exact toolchain version you plan to deploy.

| Target | Startup | Best For |
|---|---|---|
| Interpreter | instant | dev, debugging, REPL, correctness |
| Native JIT (Cranelift) | compile on first run | compute-intensive, SIMD, numeric |
| AOT (Cranelift) | instant (precompiled) | shipped binaries, CLIs, production |
| WASM | fast | web, edge, sandbox |
| GPU (planned) | slow (kernel compile) | vector/parallel workloads |

> Speed is workload-dependent. Optimized targets must match the interpreter's observable semantics before they are considered complete.

---

## Lowering Example — End to End

Source:

```adesh
fn square(x: i32): i32 { return x * x; }
let y = square(7);
```

```
1. VIR (SSA):
     func @square(%0: i32) -> i32 { %1 = mul %0, %0; ret %1 }
     func @main { %2 = call @square(7); store %2 -> y; ret }

2. Interpreter:  tree-walk  call frame → Value::Number(49)

3. Cranelift CLIF:
     function %square(i32) -> i32 {
     block0(v0: i32):
       v1 = imul v0, v0
       return v1
     }

4. Machine code (x64):
     imul edi, edi
     mov  eax, edi
     ret

5. Bytecode:
     LOAD_CONST 7
     CALL @square, 1
     STORE y

6. WASM:
     (func $square (param i32) (result i32)
       local.get 0
       local.get 0
       i32.mul)
```

---

## Where This Fits

- Previous: [The IR Pipeline](/docs/compiler/ir)
- Per-backend docs: [Execution Backends](/docs/backends/overview)
- Tooling: [CLI Reference](/docs/tools/cli)
- Source entry: [`src/backends/mod.rs`](file:///d:/Projects/AdeshLang/src/backends/mod.rs)
