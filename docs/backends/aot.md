---
id: aot
title: AOT Native Compilation Backend
sidebar_label: AOT (Native)
description: Self-contained Ahead-Of-Time (AOT) native compilation in Adesh without LLVM or external dependencies.
---

# AOT Native Compilation Backend

Adesh includes a **self-contained Ahead-Of-Time (AOT) native compilation toolchain** (`adesh build`) that compiles Adesh source code directly into standalone native executables, static archives, and dynamic libraries **without any external dependencies on LLVM, Clang, GCC, MSVC, or external linkers**.

---

## 1. Zero-Dependency Native Architecture

Unlike languages that rely on large external toolchain dependencies like LLVM or platform C compilers, Adesh implements its own end-to-end compilation pipeline:

```
Source Code (.adesh)
        ↓
Frontend (Lexer → Parser → AST)
        ↓
High-Level IR (HIR) & Semantic Analysis
        ↓
Borrow Checker & MIR (Compile-time memory safety, zero GC)
        ↓
Machine IR & Target Native Codegen (x86_64, AArch64, RISC-V)
        ↓
ADOB v3 (Adesh Native Object Binary)
        ↓
adeshlink (In-house Native Multi-Domain Linker)
        ↓
Native Binary (PE32+ / ELF64 / Mach-O 64)
```

### Pipeline Stages

1. **Frontend & HIR**: Parses and desugars source code into High-Level IR with full type inference and static verification.
2. **Compile-Time Memory Safety (MIR)**: Ownership and borrow analysis verify lifetimes, moves, and reference counts prior to codegen, eliminating double-frees and data races without garbage collection.
3. **Machine IR Lowering**: Platform-aware lowering transforms operations into machine-level instructions with target register allocation, calling conventions (Win64 / SysV / AAPCS64), stack alignment, and atomic operations.
4. **ADOB v3 Object Emission**: Emits validated native object files in the **ADOB v3** binary container, featuring explicit section bounds, symbol tables, relocation entries, and distinct TLS section types.
5. **adeshlink Native Linker**: Resolves symbols, applies section garbage collection (`--gc-sections`), performs Identical Code Folding (`--icf`), handles relocations, and synthesizes target executable containers.

---

## 2. Command Line Reference

### Basic Compilation

Compile an Adesh program into a native executable:

```bash
# Compile to a native binary (default name derived from source)
adesh build main.adesh

# Specify an output path
adesh build main.adesh -o myapp
./myapp
```

### Optimization & Release Flags

```bash
# Optimized release build (enables full dead-code elimination and linker ICF)
adesh build --release main.adesh -o myapp

# Select optimization level (-O0 to -O3, or -Os for size)
adesh build -O3 main.adesh -o myapp
adesh build -Os main.adesh -o myapp

# Emit intermediate ADOB object only
adesh build main.adesh --emit-adob -o build/main.adob
```

### Inspecting and Linking ADOB Objects Directly

You can inspect, validate, and link ADOB objects directly using the built-in toolchain:

```bash
# 1. Emit ADOB v3 object
adesh build main.adesh --emit-adob -o build/main.adob

# 2. Inspect and validate binary structure
adesh adob validate build/main.adob
adesh adob inspect build/main.adob
adesh adob dump-symbols build/main.adob

# 3. Link with adeshlink
adeshlink build/main.adob -o bin/main.exe
```

---

## 3. Supported Binary Formats

The built-in `adeshlink` linker generates valid native executable containers directly:

| Platform / Format | Status | Capabilities |
|---|---|---|
| **Windows PE32+ (`.exe`, `.dll`)** | **Execution-Tested** | Valid DOS/PE headers, Import Address Tables (`kernel32.dll`, `msvcrt.dll`, `ucrtbase.dll`), base relocations (`.reloc`), ASLR, NX, TLS, SEH exception directories. |
| **Linux ELF64 (`ET_EXEC`, `ET_DYN`)** | **Execution-Tested** | Static executables with Linux `_start` syscall synthesis (exit 60), dynamic ELF with libc imports (`libc.so.6`), shared libraries (`.so`), `.eh_frame`/`.eh_frame_hdr`, and TLS support. |
| **macOS Mach-O 64-bit** | **Artifact Emission** | 64-bit Mach-O headers, `LC_SEGMENT_64`, `LC_MAIN`, and dyld binding opcode streams. |

---

## 4. Key Advantages

- **Zero External Dependencies**: Does not require LLVM, Clang, GCC, MSVC Build Tools, or Windows SDKs to be installed.
- **Ultra-Compact Binaries**: Windows PE executables start at just 4 KB for minimal programs, avoiding bloated runtime runaways.
- **Zero Runtime GC**: Deterministic memory management without garbage collection pauses or background threads.
- **Fast Startup**: Executable machine code launches instantly without an interpreter loop or dynamic compilation warm-up.
