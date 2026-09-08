---
id: type-system
title: "Type System Specification & Memory Mapping"
description: "Formal specification of AdeshLang type taxonomy, memory representations, Hindley-Milner type inference, casting semantics, and null safety opcodes."
sidebar_label: "Type System & Memory Mapping"
---

# Type System Specification & Memory Mapping

This document provides a formal specification of the AdeshLang type system, physical memory representations, type inference engine, explicit conversion semantics, and null-safety opcodes.

---

## 1. Type System Classification

AdeshLang employs a strongly typed, static type system with local type inference. The type system combines **nominal subtyping** for classes and interfaces with **structural subtyping** for tuples, records, and function types.

```
                                 +------------------+
                                 |  AdeshLang Type  |
                                 +------------------+
                                          |
                   +----------------------+----------------------+
                   |                                             |
         +------------------+                          +------------------+
         |   Scalar Types   |                          |  Compound Types  |
         +------------------+                          +------------------+
         | - Integers       |                          | - Strings        |
         | - Floats         |                          | - Slices/Arrays  |
         | - Booleans       |                          | - Tuples         |
         | - Characters     |                          | - Structs/Classes|
         +------------------+                          | - Functions      |
                                                       +------------------+
```

---

## 2. Primitive Types & Bit-Level Memory Layouts

| Type Name | Width (Bits) | Alignment | Memory Representation / Range |
| :--- | :--- | :--- | :--- |
| `i8` / `u8` | 8 bits | 1 byte | 8-bit signed ($[-128, 127]$) / unsigned ($[0, 255]$) |
| `i16` / `u16` | 16 bits | 2 bytes | 16-bit signed / unsigned integer |
| `i32` / `u32` | 32 bits | 4 bytes | 32-bit two's complement integer |
| `i64` / `u64` | 64 bits | 8 bytes | 64-bit two's complement integer |
| `f32` | 32 bits | 4 bytes | IEEE 754 single-precision floating-point |
| `f64` | 64 bits | 8 bytes | IEEE 754 double-precision floating-point |
| `bool` | 8 bits | 1 byte | `0x01` (true) or `0x00` (false); non-zero treated as true |
| `char` | 32 bits | 4 bytes | Unicode Scalar Value (`U+0000` to `U+10FFFF`) |
| `null` | 64 bits | 8 bytes | Null pointer sentinel (`0x0000000000000000`) |

---

## 3. Compound Types & Memory Mapping

### 3.1 String Descriptor (`string`)
Strings are UTF-8 encoded byte sequences managed via a 24-byte fat pointer descriptor:

```
+-------------------+-------------------+-------------------+
|  Buffer Ptr (8B)  |   Byte Len (8B)   |   Capacity (8B)   |
+-------------------+-------------------+-------------------+
          |
          v
  +-------------------------------------------------+
  | 'A' | 'd' | 'e' | 's' | 'h' | '\0'              |
  +-------------------------------------------------+
```

Small strings (up to 15 bytes) utilize **Small String Optimization (SSO)**, storing text directly inside the 24-byte descriptor slot without allocating dynamic heap memory.

### 3.2 Dynamic Array / Slice (`[T]`)
Dynamic arrays store an 8-byte pointer, an 8-byte element count, and an 8-byte buffer capacity:

```text
Total Descriptor Size = 24 Bytes
Heap Buffer Allocation = capacity * sizeof(T)
```

### 3.3 Tuples `(T1, T2, ...)`
Tuples are stored as contiguous packed fields matching C-struct memory layout alignment rules:

```adesh
let pair: (u8, u64) = (0xFF, 0x123456789ABCDEF0);
```

Memory layout on stack frame (with 7 padding bytes inserted for 8-byte alignment):
```
Byte 0:     [ 0xFF ] (u8)
Byte 1..7:  [ Padding Bytes (0x00) ]
Byte 8..15: [ 0x123456789ABCDEF0 ] (u64)
```

---

## 4. Hindley-Milner Type Inference Engine

AdeshLang implements local bidirectional type inference. When type annotations are omitted, the compiler synthesizes type variables and propagates constraints through the AST:

```adesh
let count = 42;             // Inferred as i64
let scale = 1.5;            // Inferred as f64
let items = [10, 20, 30];   // Inferred as [i64]
```

### 4.1 Type Ambiguity Resolution
If numeric literal constraints remain unconstrained at scope end:
- Unannotated integer literals default to `i64`.
- Unannotated floating-point literals default to `f64`.

---

## 5. Explicit Conversion Semantics (`as` Operator)

Implicit narrowing or lossy type conversions are rejected by the compiler. Type conversions require the explicit `as` casting operator:

```adesh
let small: u8 = 255;
let wide: u64 = small as u64; // Value promotion (Zero Extension)

let float_val: f64 = 99.9;
let int_val: i64 = float_val as i64; // Truncation toward zero (`cvttsd2si` in x86_64)
```

### 5.1 Casting Instruction Lowering

| Cast Expression | Lowered x86_64 Machine Instruction | Semantics |
| :--- | :--- | :--- |
| `u8 as u64` | `movzx r64, r8` | Zero-extend unsigned integer |
| `i8 as i64` | `movsx r64, r8` | Sign-extend signed integer |
| `f64 as i64` | `cvttsd2si r64, xmm` | Convert double to signed integer with truncation |
| `i64 as f64` | `cvtsi2sd xmm, r64` | Convert signed integer to double precision float |

---

## 6. Null Safety Opcodes & Short-Circuit Semantics

AdeshLang enforces explicit null safety. Nullable types operate through explicit short-circuiting opcodes.

### 6.1 Optional Chaining (`?.`)
The `?.` operator compiles into a conditional branch instruction (`JUMP_IF_NULL`). If the target pointer is `0x00`, execution jumps directly to the end of the chain, yielding `null`:

```adesh
let host = config?.server?.host;
```

Lowered Bytecode Opcodes:
```text
LOAD_VAR       config
JUMP_IF_NULL   .L_null_exit
GET_FIELD      server
JUMP_IF_NULL   .L_null_exit
GET_FIELD      host
JUMP           .L_done
.L_null_exit:
PUSH_NULL
.L_done:
```

### 6.2 Null Coalescing (`??`)
The `??` operator evaluates the LHS expression; if the result is not `null`, it returns that value. Otherwise, it evaluates and returns RHS:

```adesh
let active_host = host ?? "127.0.0.1";
```

---

## 7. Runtime Type Introspection

Runtime type inspection is provided by the built-in `type()` function, which queries the object header type tag:

```adesh
print(type(42));         // Output: "i64"
print(type("adesh"));    // Output: "string"
print(type([1, 2, 3]));  // Output: "array"
```

Object headers contain an 8-bit Type Tag enum at offset `0x00`:
- `0x01` = Integer
- `0x02` = Float
- `0x03` = String
- `0x04` = Array
- `0x05` = Object / Class Instance
