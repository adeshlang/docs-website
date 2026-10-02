---
id: adob-cli
title: ADOB CLI Tools
sidebar_label: ADOB CLI Tools
---

# ADOB CLI Tools

The `adesh adob` command family provides inspection, validation, and diagnostic tools for working with Adesh Native Object Binary (`.adob`) files.

ADOB uses format version 1.0.0. The writer validates structural consistency
before serialization. These checks do not establish that the target backend,
relocations, or generated machine code are fully supported. The native
toolchain improvements are planned for AdeshLang v0.4.0; see the
[native toolchain status](/docs/compiler/native-toolchain).

---

## Commands

### `adesh adob inspect`
Displays high-level object headers, target descriptors, compute device type, ABI, and section summaries.

```bash
adesh adob inspect target/main.adob
```

The displayed fields depend on the object being inspected.

---

### `adesh adob validate`
Performs comprehensive integrity validation on an ADOB binary:
- Verifies magic signature and version compatibility.
- Checks section names and alignment.
- Checks defined-symbol section indices and bounds.
- Checks relocation offsets and symbol references.
- Checks import and export names.

```bash
adesh adob validate target/main.adob
```

Validation is structural. It does not verify instruction semantics, target
support, ABI correctness, or executable safety. `AdobWriter::write` invokes
this validation before encoding as well.

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
