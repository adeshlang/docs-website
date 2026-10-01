---
id: linker
title: Adesh Native Linker (adeshlink)
sidebar_label: Native Linker
---

# Adesh Native Linker (`adeshlink`)

`adeshlink` is a self-contained, high-performance native binary linker and toolchain engine built into Adesh. It eliminates any reliance on external system linkers (LLD, GNU `ld`, MSVC `link.exe`, Apple `ld64`) and produces production-ready native binaries across all major operating systems and embedded targets.

---

## 🚀 Core Capabilities

### 1. Multi-Format Output Generation
`adeshlink` ingests native **ADOB** objects and standard object files, emitting:
- **Windows:** PE32+ `.exe` executables and `.dll` shared libraries with complete export/import tables and base relocations.
- **Linux & BSD:** ELF64 executables and `.so` shared objects with dynamic symbols, program headers, and GNU hash tables.
- **macOS:** Mach-O 64-bit binaries with load commands (`__TEXT`, `__DATA`, `__LINKEDIT`) and code signatures.
- **WebAssembly:** Standalone `.wasm` modules.
- **Bare-Metal:** Memory-mapped flash layouts and Interrupt Vector Tables (IVT).

### 2. Built-in Runtime Intrinsics Engine
`adeshlink` includes an internal intrinsics synthesizer that generates machine code for:
- 128-bit integer arithmetic: `__multi3`, `__divti3`, `__udivti3`.
- Memory operations: `memcpy`, `memmove`, `memset`, `memcmp`.
- Stack security probes: `__chkstk`, `___chkstk_ms`, `__stack_chk_guard`, `__stack_chk_fail`.
- Adesh runtime primitives: `adesh_rt_*`, `adesh_*`.

This allows generating standalone executables with **zero external C runtime library dependencies**.

### 3. Binary Size Optimization
- **Dead-Code Elimination (GC Sections):** Discards unreachable functions and data (`--gc-sections`).
- **Identical Code Folding (ICF):** Deduplicates identical function bytecodes across the binary (`--icf=safe` / `--icf=all`).
- **Symbol Stripping:** Strips debug sections and local symbol tables (`-s` / `--strip`).

### 4. Reproducibility & Security
- **Deterministic Builds:** Guarantees bit-for-bit reproducible binary outputs (`--deterministic`).
- **Hardened Layouts:** Enforces W^X page protections, ASLR/PIE, and DEP/NX.

---

## CLI Reference & Subcommands

### Linking Binaries
```bash
# Link ADOB objects into a native Windows executable
adeshlink main.adob math.adob -o app.exe

# Cross-link for Linux x86_64
adeshlink -o app.elf --target=x86_64-unknown-linux-gnu main.adob

# Enable size optimizations and link maps
adeshlink -o app.exe --gc-sections --icf=all --map=app.map main.adob
```

### Built-in Binutils & LLVM Replacements
`adeshlink` includes built-in commands replacing legacy toolchain utilities:

```bash
# Manage static library archives (.a / .lib)
adeshlink ar rcs libmy_lib.a obj1.o obj2.o

# Inspect symbol tables
adeshlink nm app.exe

# Dump section headers and disassembly
adeshlink objdump -h app.exe

# Display detailed section memory sizes
adeshlink size app.exe

# Strip debug sections
adeshlink strip app.exe -o app_stripped.exe
```
