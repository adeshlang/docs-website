---
id: functions
title: "Function Specifications, ABI & Stack Frame Layout"
description: "Formal specification of function definitions, System V / Win64 calling conventions, stack frame layout, closures, and optimization attributes."
sidebar_label: "Functions, ABI & Call Stack"
---

# Function Specifications, ABI & Stack Frame Layout

This document specifies function parameter mechanics, System V AMD64 / Windows x64 calling conventions, stack frame layouts, closure capture structures, and compiler optimization attributes in AdeshLang.

---

## 1. Function Definition & Signature Syntax

Functions are declared using the `fn` keyword. Type annotations on parameters and return values define contract boundaries checked during compilation:

```adesh
fn calculate_thrust(mass: f64, acceleration: f64) -> f64 {
    return mass * acceleration;
}
```

---

## 2. ABI & Calling Conventions

AdeshLang complies with native target ABI specifications:
- **Linux / macOS**: System V AMD64 ABI
- **Windows**: Microsoft x64 Software Convention

### 2.1 Register Parameter Assignment (x86_64)

| Parameter Index | System V AMD64 Register | Windows x64 Register | Floating Point Register |
| :--- | :--- | :--- | :--- |
| Parameter 1 | `RDI` | `RCX` | `XMM0` |
| Parameter 2 | `RSI` | `RDX` | `XMM1` |
| Parameter 3 | `RDX` | `R8` | `XMM2` |
| Parameter 4 | `RCX` | `R9` | `XMM3` |
| Parameter 5+ | Stack Frame Offset | Stack Frame Offset | Stack Frame Offset |

Return values are passed in `RAX` (integers/pointers) or `XMM0` (floats). Compound structures exceeding 16 bytes are returned via a caller-allocated hidden pointer passed in `RDI` / `RCX`.

---

## 3. Physical Call Stack Frame Anatomy

When a function call is executed, a new stack frame is pushed onto the thread call stack adhering to 16-byte alignment constraints:

```
Higher Memory Addresses
+------------------------------------------+
|  Incoming Arguments (Params 5, 6, ...)   |
+------------------------------------------+
|  Return Address (8 bytes)                |  <-- Pushed by CALL instruction
+------------------------------------------+
|  Saved Frame Pointer (RBP, 8 bytes)      |  <-- Pushed by prologue
+------------------------------------------+  <-- Current RBP points here
|  Local Variables & Spill Slots           |
|  (8-byte aligned stack slots)            |
+------------------------------------------+
|  Saved Callee-Saved Registers (RBX, R12) |
+------------------------------------------+
|  Outgoing Argument Area                  |  <-- 16-Byte Aligned RSP
+------------------------------------------+
Lower Memory Addresses
```

### 3.1 Function Prologue and Epilogue

```asm
; Standard Prologue
push rbp
mov  rbp, rsp
sub  rsp, 32         ; Reserve local stack slots (16-byte aligned)

; Function Epilogue
mov  rsp, rbp
pop  rbp
ret                  ; Pop return address and jump
```

---

## 4. Closure Memory Architecture & Capture Structs

Anonymous functions and lambdas (`fn(x) => x + 1` or `|x| x + capture`) that capture variables from their outer environment are represented as **16-byte Closure Fat Pointers**:

```
Closure Fat Pointer (16 bytes)
+----------------------------------+----------------------------------+
|  Code Address Pointer (8 Bytes)  |  Environment Pointer (8 Bytes)   |
+----------------------------------+----------------------------------+
                 |                                 |
                 v                                 v
        [ Native Instructions ]         [ Environment Capture Struct ]
                                        +-----------------------------+
                                        | Captured Var A (i64)        |
                                        | Captured Var B (Ref Pointer)|
                                        +-----------------------------+
```

### 4.1 Capture Semantics
- **By-Value Capture**: Primitive types or values explicitly copied are stored directly inside the heap-allocated Environment Capture Struct.
- **By-Reference Capture**: Non-copied dynamic structures store a reference pointer inside the Environment Capture Struct, verified by the borrow checker to prevent dangling stack references.

---

## 5. Compiler Optimization Attributes

Functions accept specialized optimization annotations to direct compiler lowering:

```adesh
@inline
@noalloc
fn vector_dot(a: [f32; 4], b: [f32; 4]) -> f32 {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
}
```

| Attribute | Compiler Action & Constraints |
| :--- | :--- |
| `@inline` | Forces full inlining of function body at all call sites, eliminating CALL instruction overhead. |
| `@noalloc` | Verifies at compile time that the function contains zero heap allocations (`alloc`, dynamic array expansion, string concat). |
| `@pure` | Enforces pure functional semantics: no side-effects, no global/captured mutable state, output depends strictly on parameters. |
