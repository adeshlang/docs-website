---
id: native-toolchain
title: Native Compiler Toolchain
sidebar_label: Native Toolchain
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Native Compiler Toolchain

<FeatureStatus status="PARTIAL" details="The native AOT path is under development; Windows x86-64 is the end-to-end tested target" />

The native toolchain is a separate path from the existing VIR-based interpreter,
JIT, and Cranelift AOT paths. It lowers a supported subset of Adesh HIR into
Machine IR, emits an ADOB object, and uses `adeshlink` to produce a native
executable.

> **Planned for v0.4.0:** The native compiler and linker improvements described
> here are planned for the AdeshLang v0.4.0 release. They are not part of the
> current v0.3.0 release. This does not mean every target or feature listed on
> this page will be production-ready in v0.4.0.

## Pipeline

```text
Adesh source
    │
    ▼
Frontend and HIR
    ├──► VIR ──► interpreter, bytecode, Cranelift JIT/AOT, and other backends
    │
    └──► partial native HIR lowering
             │
             ▼
         Machine IR ──► x86-64 codegen ──► ADOB object ──► adeshlink ──► executable
```

The native HIR lowerer currently handles integer literals and operations,
comparisons, `let`/assignment, `if`/`while`/blocks, returns, calls to user
functions, and `print`/`println`. Unsupported lowering cases are not a promise
of full language support. The x86-64 backend covers an integer general-purpose
register subset; it does not yet implement floating-point/SIMD instructions or
atomics.

## Current status

| Component | Status |
|---|---|
| HIR-to-Machine-IR lowering | Partial; only a subset of statements and expressions is handled |
| x86-64 codegen | Substantial for integer GPR operations, control flow, calls, and stack arguments |
| AArch64 and RISC-V codegen | Proof-of-concept; four basic instruction forms per backend |
| ADOB v1.0 | Implemented; writer validates objects before encoding |
| Windows x86-64 PE linking | End-to-end tested by executing produced binaries |
| ELF linking | Static executable emission only; not execution-tested |
| Mach-O linking | Skeletal; not yet suitable for normal macOS executables |
| Linker WASM output | Stub implementation; separate from the compiler's WASM backend |
| Shared libraries and LTO | Unsupported; `--shared` and `--lto` fail with errors |

The x86-64 calling convention supports register arguments, stack arguments, and
the Win64 shadow space. Aggregate-by-value arguments, structure returns,
floating-point/vector argument registers, and variadic calls are not supported.
Wide signatures also have a known parallel-move limitation.

## Build and link an ADOB object

```bash
# Emit an ADOB object from the supported native source subset.
adesh build main.adesh --emit-adob -o build/main.adob

# Validate and inspect it.
adesh adob validate build/main.adob
adesh adob inspect build/main.adob

# Link for the host target.
adeshlink build/main.adob -o build/main.exe
```

The final output format depends on the selected target and linker implementation.
The Windows x86-64 PE path is the one verified by an end-to-end execution test.
ELF output is currently static-only and has not been run-tested; Mach-O output
is skeletal.

`adesh build` uses the native pipeline (native codegen → ADOB → built-in
`adeshlink`) as the default executable path. `--emit-adob` emits an ADOB
object only; the Cranelift backend is opt-in via `--codegen=cranelift`.

## Related documentation

- [Code generation and backend paths](/docs/compiler/codegen)
- [ADOB object format](/docs/compiler/adob)
- [Native linker](/docs/compiler/linker)
- [ADOB CLI tools](/docs/tools/adob-cli)
- [Compiler architecture](/docs/compiler/overview)
