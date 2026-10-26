---
id: adob
title: ADOB Universal Object Format
sidebar_label: ADOB Object Format
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# ADOB — Adesh Native Object Binary

<FeatureStatus status="PARTIAL" details="Version 1.0 format and validation are implemented; target codegen and linker support vary" />

**ADOB** (*Adesh Native Object Binary*) is Adesh's relocatable object format.
It stores a target descriptor, sections, symbols, imports and exports,
relocations, and metadata in a common container. An ADOB object still describes
a particular target; using the format does not imply that code generation or
linking is implemented for every architecture or device.

> **Planned for v0.4.0:** The native compiler and linker improvements using
> ADOB are planned for Adesh v0.4.0. ADOB v1.0 and its tools exist in the
> current codebase, but the full native toolchain is not yet a generally
> supported release feature.

```text
Adesh source → partial native lowering → Machine IR → ADOB object → adeshlink → target output
```

---

## What the format contains

ADOB objects use format version **1.0.0**. The serialized data includes:

| Part | Contents |
|---|---|
| Header | Magic `ADOB`, format version, flags, and entry counts |
| Target descriptor | Device, architecture, operating system, environment, ABI, pointer width, endianness, and target features |
| Sections | Section names, kinds, permissions/flags, alignment, payload bytes, and relocations |
| Symbols | Defined and undefined symbols with binding, visibility, kind, and section information |
| Imports and exports | External dependency names and exported symbol names |
| Metadata | Optional safety, security, threading, optimization, debug, unwind, accelerator, memory-region, extension, and build metadata |

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
