---
id: datatype-methods
title: "Built-in Data Structure Operations & Dispatch Semantics"
description: "Formal specification of memory layouts, growth algorithms, Swiss-table hashing, and method dispatch mechanics for Adesh built-in collections."
sidebar_label: "Data Structure Operations"
---

# Built-in Data Structure Operations & Dispatch Semantics

This document specifies the internal memory layouts, allocation algorithms, hash table architectures, and compiler method dispatch mechanisms for Adesh's core collection types.

---

## 1. Array / Vector (`[T]`) Memory Architecture

Arrays in Adesh are stored as contiguous dynamic heap buffers governed by a 24-byte stack descriptor:

```
Stack Descriptor (24 bytes)                  Heap Allocation Buffer
+-------------------------------+      +-----------------------------------------+
| Data Pointer (8 bytes) ------|----> | T_0 | T_1 | T_2 | T_3 | ... | Uninit   |
| Element Count (8 bytes = 4)   |      +-----------------------------------------+
| Capacity (8 bytes = 8)        |      |<----------- Length ------------>|
+-------------------------------+      |<---------------- Capacity ------------->|
```

### 1.1 Buffer Growth Algorithm
When `push()` is called and `length == capacity`, the runtime allocates a new heap buffer using a growth multiplier factor of **1.5x**:

```text
Capacity_new = floor(Capacity_old * 1.5) + 2
```

Existing buffer elements are migrated via `memcpy` (for POD types) or move-constructors, after which the old buffer is deallocated.

### 1.2 Out-of-Bounds Protection
Array indexing (`arr[i]`) compiles to a bounds-checking instruction:

```text
COMPARE   index, descriptor.length
JUMP_GE   .L_bounds_trap  // Traps if index >= length
```

If `index >= length`, the execution environment emits fatal error `E0012: Out of bounds array index access`.

---

## 2. HashMap Hashing Architecture (Swiss Table Layout)

Adesh `HashMap<K, V>` collections implement the **Swiss Table** hash table architecture utilizing SIMD-accelerated control byte metadata probing.

```
Control Byte Metadata Array (ctrl_ptr)
+------+------+------+------+------+------+------+------+
| H2_0 | H2_1 | EMPTY| H2_3 | DEL  | H2_5 | EMPTY| H2_7 |  <-- 1 byte per slot
+------+------+------+------+------+------+------+------+
                                 |
                                 v
Slot Array (slots_ptr)           | (Calculated index offset)
+-------------------------------------------------------+
|  Slot 0: { Key_0, Val_0 }                             |
|  Slot 1: { Key_1, Val_1 }                             |
|  Slot 3: { Key_3, Val_3 }                             |
+-------------------------------------------------------+
```

### 2.1 Hash Breakdown & Probe Groups
For every inserted key, a 64-bit SipHash or WyHash digest is generated:
- **H1 (Top 57 Bits)**: Determines the probe group index.
- **H2 (Bottom 7 Bits)**: Stored in the control byte array (`ctrl_ptr`) as a 7-bit metadata fingerprint (`0x00`–`0x7F`). Special control bytes denote `EMPTY` (`0xFF`) and `DELETED` (`0xFE`).

### 2.2 SIMD Probing & Load Factor
Lookups execute a single 16-byte SIMD vector comparison (`_mm_cmpeq_epi8` on x86_64 or `vceqq_s8` on ARM NEON) matching 16 slots concurrently in a single CPU instruction cycle. 

The maximum allowable load factor is **87.5% (7/8)**. Exceeding this threshold triggers an immediate table resize and hash bucket re-indexing.

---

## 3. HashSet Architecture

`HashSet<T>` is implemented as a thin wrapper over `HashMap<T, ()>`, utilizing the identical Swiss Table control-byte probing architecture while omitting value storage bytes.

---

## 4. Method Dispatch & Iteration Lowering

### 4.1 Monomorphic Direct Method Dispatch
Built-in collection methods (`push`, `pop`, `len`, `get`, `contains`) are bound directly at compile time. The compiler inline-lowers these calls directly into native assembly or VM opcodes, eliminating dynamic vtable dispatch overhead:

```adesh
let numbers = [10, 20, 30];
numbers.push(40); // Compiles directly to IR opcode OP_ARRAY_PUSH
```

### 4.2 Functional Pipeline Lowering
Functional collection methods (`map`, `filter`, `fold`) are zero-cost abstractions. High-level iterator chains are monomorphized and desugared into single-pass imperatively optimized loops:

```adesh
// High-level declarative chain
let evens = nums.filter(fn(x) => x % 2 == 0).map(fn(x) => x * 2);
```

Desugared Compiler IR output:
```text
let evens = [];
let i = 0;
while i < nums.len {
    let x = nums[i];
    if x % 2 == 0 {
        evens.push(x * 2);
    }
    i += 1;
}
```
