---
id: native-toolchain
title: Native Compiler Toolchain
sidebar_label: Native Toolchain
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Native Compiler Toolchain

<FeatureStatus status="PARTIAL" details="Self-contained native compilation toolchain; Windows and Linux x86-64 execution-tested without external toolchains" />

Adesh features a **self-contained native binary toolchain** that lowers Adesh source code into Machine IR, emits validated **ADOB v3** objects, and links them with `adeshlink` into standalone executables **without external dependencies on LLVM, Clang, GCC, MSVC, or GNU Binutils**.

---

## Architecture Pipeline

```text
Adesh Source (.adesh)
    │
    ▼
Frontend & HIR
    │
    ├──► VIR ──► Interpreter, JIT Compiler, WASM
    │
    └──► Native Compilation Pipeline (Zero LLVM / External Dependencies)
             │
             ▼
         Machine IR ──► Native Codegen ──► ADOB v3 Object ──► adeshlink ──► Executable
                        (x86-64, AArch64)                     (PE / ELF / Mach-O)
```

The native compilation pipeline operates completely independently from the VIR execution paths. It lowers High-Level IR (HIR) into Machine IR with register allocation, calling conventions, and platform relocations, packaging symbols and sections into the validated ADOB v3 container.

---

## Current Status Matrix

| Component | Status | Implementation Details |
|---|---|---|
| **ADOB Object Format (v3)** | **Implemented** | Validated binary container with explicit section sizes, distinguished TLS section kinds, strict validation on write, and backward-compatible reading. |
| **Native Linker (`adeshlink`)** | **Implemented, Maturing** | Self-contained multi-domain linker: parse → GC (`--gc-sections`) → ICF (`--icf=safe`/`--icf=all`) → resolve → layout → relocate. |
| **x86-64 Native Codegen** | **Substantial** | Integer GPR operations, scalar SSE2 encodings, XMM allocation, control flow, calls, stack arguments, Win64 shadow space, full-width locked atomics, and TLS access sequences. |
| **AArch64 Codegen** | **Implemented** | Full AAPCS64 register allocation, callee-saved registers (X19..X28, D8..D15), 64-bit immediate materialization, arithmetic, comparisons, scalar FP, and NEON vector operations. |
| **RISC-V Codegen** | **Implemented** | RV64GC (LP64D) target, scalar FP, atomics, vector encodings, and RVC alignment. |
| **Windows PE32+ Linking** | **Execution-Tested** | Real PE32+ executables and DLLs with DOS/PE headers, Import Address Tables (`kernel32.dll`, `msvcrt.dll`, `ucrtbase.dll`), base relocations (`.reloc`), ASLR, NX, and TLS. Produced binaries are execution-verified in CI. |
| **Linux ELF64 Linking** | **Execution-Tested** | Static executables with Linux `_start` syscall synthesis (exit 60), dynamic ELF with libc imports (`libc.so.6`), shared-library loading execution-verified (`dlopen`/`dlsym`), and TLS verified against musl/glibc. |
| **macOS Mach-O Linking** | **Implemented** | 64-bit Mach-O executables and dylibs with `LC_SEGMENT_64`, `LC_MAIN`, and dyld binding opcode streams verified by independent decoders. |
| **Link-Time Optimization (`--lto`)** | **Implemented** | Module-level dead-function elimination via `LtoEngine` combined with linker section GC and Identical Code Folding. |

---

## Build and Link an Executable

### 1. Compile Directly to Native Executable

`adesh build` uses the native toolchain as its default executable generation path:

```bash
# Compile directly to a standalone native binary
adesh build main.adesh -o main.exe
./main.exe
```

### 2. Emit and Inspect ADOB v3 Objects

You can emit intermediate relocatable objects and link them manually with `adeshlink`:

```bash
# Emit an ADOB v3 object from native lowering
adesh build main.adesh --emit-adob -o build/main.adob

# Validate and inspect the binary container
adesh adob validate build/main.adob
adesh adob inspect build/main.adob

# Link using the self-contained adeshlink linker
adeshlink build/main.adob -o build/main.exe
```

---

## Zero External Toolchain Dependencies

Adesh's native compilation path does **not** invoke or require:
- ❌ **No LLVM or LLVM tools** (`llc`, `lld`, `llvm-ar`)
- ❌ **No Clang or GCC**
- ❌ **No MSVC Build Tools or Windows SDK** (`link.exe`, `cl.exe`)
- ❌ **No GNU Binutils** (`ld`, `as`)

Everything from Machine IR instruction emission to COFF/PE/ELF binary generation is implemented directly within Adesh in pure Rust.

---

## Related Documentation

- [AOT Native Compilation Backend](/docs/backends/aot)
- [ADOB Universal Object Format](/docs/compiler/adob)
- [Native Linker (adeshlink)](/docs/compiler/linker)
- [ADOB CLI Tools](/docs/tools/adob-cli)
- [Compiler Architecture](/docs/compiler/overview)
