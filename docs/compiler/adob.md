---
id: adob
title: ADOB Universal Object Format
sidebar_label: ADOB Object Format
---

# ADOB — Adesh Native Object Binary

**ADOB** (*Adesh Native Object Binary*) is the first-class, target-neutral relocatable object format designed specifically for the Adesh ecosystem. It completely decouples the Adesh compiler from platform-specific binary object formats like ELF, PE/COFF, and Mach-O.

```text
Adesh Source → AST → HIR → LIR → Machine IR → ADOB Object → adeshlink → Native Executable (.exe / ELF / Mach-O)
```

---

## Why ADOB?

Traditional compilers emit platform-specific object files directly (e.g. `.o` / `.obj`), tightly coupling code generation with specific operating systems and toolchain linkers. 

ADOB provides:
1. **Target Neutrality:** Represents code and data sections for CPUs (x86_64, AArch64, RISC-V), GPUs (CUDA, Vulkan, Metal), NPUs, and MCUs in a single unified format.
2. **First-Class Safety Metadata:** Embeds memory safety levels, stack canary markers, Control Flow Integrity (CFI/CET/BTI) status, and W^X enforcement flags.
3. **Deterministic & Hardened:** Guarantees bit-for-bit reproducible binary outputs across different host build systems.
4. **Multi-Architecture Fat Bundles:** Package code for heterogeneous compute platforms (CPU + GPU kernels) into a single `.adob` bundle.

---

## File Format Specification

Every ADOB object begins with a fixed header and descriptor table:

| Field | Size | Description |
|---|---|---|
| `ADOB_MAGIC` | 4 bytes | Fixed magic identifier: `"ADOB"` (`0x41 0x44 0x4F 0x42`) |
| `ADOB_VERSION` | 3 bytes | Major, minor, and patch version (`1.0.0`) |
| `FLAGS` | 4 bytes | Bitflags: Relocatable, Executable, Shared, Hardened, Deterministic |
| `TARGET_DESCRIPTOR` | Variable | Compute device, architecture, OS, ABI, pointer width, endianness |
| `SAFETY_METADATA` | Variable | Memory safety level, stack canary guard, CFI, W^X page flags |
| `THREAD_SAFETY` | Variable | Memory ordering model (`Relaxed`..`SeqCst`), TLS model |
| `SECTIONS_TABLE` | Variable | Section headers, alignments, flags, and byte offsets |
| `SYMBOLS_TABLE` | Variable | Defined & undefined symbols, bindings (Global/Local/Weak), sizes |
| `RELOCATIONS_TABLE` | Variable | Target relocations (Absolute, Relative, GOT, PLT, TLS) |
| `PAYLOAD_BYTES` | Variable | Raw binary machine code and constant data bytes |

---

## Multi-Architecture Fat Bundles (`AdobBundle`)

ADOB allows combining multiple target objects into a universal heterogeneous bundle:

```rust
use adesh_object::bundle::AdobBundle;

let mut bundle = AdobBundle::new();
bundle.add_member(x86_64_object);
bundle.add_member(aarch64_object);
bundle.add_member(gpu_cuda_object);

let fat_bytes = bundle.to_bytes()?;
```

---

## Working with ADOB in the CLI

### Emitting ADOB
```bash
# Compile Adesh source code to an ADOB object
adesh build src/main.adesh --emit-adob -o target/main.adob
```

### Inspecting and Validating ADOB Objects
```bash
# View target architecture, ABI, and section summaries
adesh adob inspect target/main.adob

# Run strict structural and memory boundary validation
adesh adob validate target/main.adob

# Dump symbol table
adesh adob dump-symbols target/main.adob

# Dump section table
adesh adob dump-sections target/main.adob

# Dump relocation records
adesh adob dump-relocations target/main.adob
```
