---
id: linker
title: Adesh Native Linker (adeshlink)
sidebar_label: Native Linker
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Adesh Native Linker (`adeshlink`)

<FeatureStatus status="PARTIAL" details="Windows x86-64 PE is execution-tested; other output formats have significant limitations" />

`adeshlink` is Adesh's native object linker and binary inspection tool. It reads
ADOB objects and supported object/archive inputs, resolves symbols, lays out
sections, applies supported relocations, and writes a target binary.

> **Planned for v0.4.0:** The native-toolchain work described on this page is
> planned for AdeshLang v0.4.0. The current stable release is v0.3.0. Target
> support is uneven, so do not interpret a listed output format as a completed
> or production-ready target.

---

## Output format status

| Format/path | Verified scope | Important limits |
|---|---|---|
| **Windows PE32+** | Static x86-64 executables; produced binaries have been executed in end-to-end tests | Shared-library output is unsupported; some PE features are incomplete |
| **ELF** | Static executable emission | No dynamic linker support; output has not been execution-tested |
| **Mach-O** | Basic headers and load-command scaffolding | Skeletal; lacks the dynamic-loader support needed for normal macOS system-library linking |
| **WASM** | Linker writer exists | Stub-level output; use the separate compiler WASM backend for the compiler's WASM path |
| **Static archives** | GNU `ar` archive reading and writing | Archives written by `adeshlink ar` do not include a symbol-index member |

The native code generator is also target-limited. x86-64 has a substantial
integer GPR subset; AArch64 and RISC-V emit only a small proof-of-concept
instruction set. See [Native Compiler Toolchain](/docs/compiler/native-toolchain)
for the end-to-end pipeline and compiler limitations.

## Link an object

For the tested Windows x86-64 path:

```bash
adesh build main.adesh --emit-adob -o build/main.adob
adeshlink build/main.adob -o build/main.exe
```

To request ELF output:

```bash
adeshlink --target x86_64-linux -o build/main.elf build/main.adob
```

ELF output is currently static-only and has not been run-tested. Choosing a
target does not imply that its code generator, runtime, or binary format is
complete.

## Link-time options and unsupported features

The linker implements section garbage collection (`--gc-sections`) and
identical code folding (`--icf=safe` or `--icf=all`) along with link-map and
symbol-stripping options. These features do not constitute link-time
optimization.

Shared-library output and LTO are not implemented. Requests fail explicitly:

```bash
adeshlink --shared main.adob -o libmain.dll
adeshlink --lto main.adob -o app.exe
```

`--shared` does not produce a DLL, `.so`, or dylib. `--lto` does not perform
LTO. Use a supported static executable path instead.

## Archive and inspection commands

The CLI includes archive and binary-inspection commands. They are useful
tooling, not guaranteed drop-in replacements for every LLVM or binutils
behavior.

```bash
adeshlink ar rcs libmath.a math.obj
adeshlink nm app.exe
adeshlink objdump app.exe -h
adeshlink inspect main.adob
adeshlink sections main.adob
adeshlink relocations main.adob
adeshlink size app.exe
adeshlink strip app.exe -o app-stripped.exe
```

For ADOB-specific inspection and validation, see [ADOB CLI tools](/docs/tools/adob-cli).
