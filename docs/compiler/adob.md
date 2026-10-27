---
id: adob
title: ADOB Universal Object Format
sidebar_label: ADOB Object Format
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# ADOB — Adesh Native Object Binary

<FeatureStatus status="IMPLEMENTED" details="ADOB v3 format, symmetric writer/reader, strict validation, and linker integration are implemented" />

**ADOB** (*Adesh Native Object Binary*) is Adesh's relocatable object format.
It stores a target descriptor, sections, symbols, imports and exports,
relocations, and metadata in a self-contained binary container.

> **Native Toolchain in v0.4.0:** The native compiler and linker pipeline
> uses ADOB v3 as the standard object file format. Validated ADOB v3 files
> are emitted directly by native codegen and linked by `adeshlink` into native
> executables without LLVM or external tools.

```text
Adesh source → Frontend & HIR → Machine IR → ADOB v3 object → adeshlink → Native Executable
```

---

## What the format contains

ADOB objects use format version **3.0** (with backward-compatible support for v2). The serialized container includes:

| Part | Contents |
|---|---|
| Header | Magic `ADOB`, format version, flags, and section/symbol entry counts |
| Target descriptor | Architecture (x86-64, AArch64, RISC-V), OS (Windows, Linux, macOS), ABI, pointer width, endianness, and target features |
| Sections | Explicit per-section sizes (ensuring zero-fill `.bss` and `.tbss` preservation), distinct TLS section kinds, permissions/flags, alignment, and relocations |
| Symbols | Defined and undefined symbols with binding, visibility, kind, and section references |
| Imports and exports | External dependency names (e.g. `kernel32.dll`, `msvcrt.dll`, `libc.so.6`) and exported symbols |
| Metadata | Optional safety, security, threading, unwind info (`UNWIND_INFO`, `.eh_frame`), and debug metadata |

The library also has an `AdobBundle` container for grouping objects. Bundling
objects does not provide missing device code generation or runtime support.
Relocation kinds are described in the format, but whether a relocation can be
produced and applied depends on the code generator and linker for the selected
target.

---

## Emit, inspect, and validate

```bash
# Emit an object using the native compiler path.
adesh build src/main.adesh --emit-adob -o target/main.adob

# Validate the object and inspect its contents.
adesh adob validate target/main.adob
adesh adob inspect target/main.adob
adesh adob dump-symbols target/main.adob
adesh adob dump-sections target/main.adob
adesh adob dump-relocations target/main.adob
```

`AdobWriter::write` validates an object before serializing it. Validation
checks structural properties such as header/version, section names and
alignment, symbol bounds and section indices, relocation bounds and references,
and import/export names. This is format-integrity validation; it does not
verify that the machine code is correct, that the target is supported, or that
the resulting program is safe to execute.

See [ADOB CLI tools](/docs/tools/adob-cli) for the inspection commands and
[Native Compiler Toolchain](/docs/compiler/native-toolchain) for current target
support.
