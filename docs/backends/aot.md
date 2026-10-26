---
id: aot
title: AOT Compilation Backend
sidebar_label: AOT
---

# AOT Compilation Backend

The Ahead-Of-Time (AOT) compiler compiles Adesh source code into standalone native executables, static libraries, or shared libraries before execution.

---

## 1. Engine and Architecture

The AOT compiler (`adesh compile-aot`) uses **Cranelift** as its code-generation backend. The compiler:
1. Lexes, parses, and type-checks the code (with mandatory memory-safety checks).
2. Performs optimizations and lowers AST to LIR.
3. Generates machine code in an object file format (ELF, COFF, Mach-O).
4. Invokes a system linker to link runtime hooks, standard libraries, and external FFI dependencies into a final binary.

---

## 2. Command Line Reference

The basic syntax to compile a script:

```bash
adesh compile-aot program.adesh -o program
./program
```

### Optimization and Debug Options

* **Optimization Levels**: `-O0`, `-O1`, `-O2`, `-O3` (or `--opt=0` to `--opt=3`). These map to Cranelift optimization flags.
* **Debug Symbols**: `--debug` Embeds debug information in the binary.

```bash
# Compile with maximum optimization level and debug symbols
adesh compile-aot program.adesh -o program -O3 --debug
```

### Output Formats

You can control the compilation target output using the following flags:

| Flag | Target Format | Description |
| :--- | :--- | :--- |
| `--shared`, `--dll`, `--so` | Shared Library | Compiles a dynamic library (`.dll`, `.so`, `.dylib`) |
| `--static`, `--lib`, `--a` | Static Library | Compiles a static archive library (`.lib`, `.a`) |
| `--object`, `--obj`, `--o`, `-c`, `--compile-only` | Object File | Emits raw machine-code object file (`.o`, `.obj`) |
| `-S`, `--emit-asm`, `--emit-ir` | Assembly/IR | Dumps generated assembly or Cranelift IR |

### FFI and Header Emission

* `--ffi`: Links external libraries declared in the code or CLI.
* `--emit-header [path]`: Automatically generates a C/C++ compatible header file (`.h`) containing class layouts and function signatures for FFI mapping.

```bash
# Compile library and generate header file
adesh compile-aot math.adesh -o bin/math.dll --shared --emit-header bin/math.h
```

---

## 3. Toolchain Discovery & Linking Process

AOT compilation requires a native linker to package object files. The compiler automatically searches for a local compiler/linker toolchain.

### Linker Discovery Order
1. **Clang + LLD**: Checks for `clang` and the `lld` component. This is the preferred cross-compilation toolchain.
2. **Windows Platform (MSVC)**: Looks for Visual Studio Build Tools, detecting `link.exe`, `VCToolsInstallDir`, and Windows SDK installation directories (`WindowsSdkDir`).
3. **Linux/macOS Platform (GCC/Clang)**: Queries local `gcc`, `clang`, or system linker `ld`.
4. **Zig**: Fallback toolchain (if installed, Zig provides built-in cross-compilation linking support).

### Troubleshooting Missing Toolchains
If a compiler/linker cannot be found, the AOT compilation will fail with detailed instructions.
* **On Windows**: Ensure **Visual Studio Build Tools** or **Windows SDK** is installed, or add `clang` and `lld` to your path.
* **On Ubuntu/Debian**: Run `sudo apt install build-essential clang lld` to install linker packages.
* **Cross-Compilation**: Install a cross-compiler (e.g. `gcc-aarch64-linux-gnu` or `zig`) to compile for different architectures.
