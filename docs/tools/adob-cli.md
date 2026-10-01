---
id: adob-cli
title: ADOB CLI Tools
sidebar_label: ADOB CLI Tools
---

# ADOB CLI Tools

The `adesh adob` command family provides inspection, validation, and diagnostic tools for working with Adesh Native Object Binary (`.adob`) files.

---

## Commands

### `adesh adob inspect`
Displays high-level object headers, target descriptors, compute device type, ABI, and section summaries.

```bash
adesh adob inspect target/main.adob
```

**Example Output:**
```text
=== ADOB Object Inspection: target/main.adob ===
Magic:             "ADOB"
Version:           1.0.0
Target Triple:     x86_64-windows-msvc
Compute Device:    Cpu
Architecture:      X86_64
Operating System:  Windows
ABI:               WindowsX64
Pointer Width:     8 bytes
Endianness:        Little
Sections Count:    1
Symbols Count:     1
Exports Count:     1

Exports:
  - main
```

---

### `adesh adob validate`
Performs comprehensive integrity validation on an ADOB binary:
- Verifies magic signature and version compatibility.
- Ensures all section byte ranges reside within file bounds.
- Checks that no section memory regions overlap.
- Confirms proper byte alignment for all code and data sections.

```bash
adesh adob validate target/main.adob
```

**Example Output:**
```text
✓ ADOB object `target/main.adob` passed all validation checks.
```

---

### `adesh adob dump-symbols`
Outputs the symbol table, including symbol ID, name, binding (Global, Local, Weak), visibility, kind (Function, Object, TLS), defined state, section index, and size.

```bash
adesh adob dump-symbols target/main.adob
```

---

### `adesh adob dump-sections`
Lists all sections defined in the object binary, their kind (Text, Data, RoData, Bss, TData, TBss), memory permissions (Read, Write, Execute), byte sizes, alignments, and relocation counts.

```bash
adesh adob dump-sections target/main.adob
```

---

### `adesh adob dump-relocations`
Dumps all relocation entries, specifying the target section, offset, symbol reference, relocation kind, and addend.

```bash
adesh adob dump-relocations target/main.adob
```
