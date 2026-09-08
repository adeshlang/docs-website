---
id: variables
title: "Variables, Storage Classes & Memory Layout"
description: "Formal specification of variable declarations, mutability semantics, stack/heap storage classes, shadowing, and scope lifetimes in AdeshLang."
sidebar_label: "Variables & Storage"
---

# Variables, Storage Classes & Memory Layout

This specification defines the variable binding model, storage allocation classes, stack slot alignment, lexical scoping rules, and memory representations in AdeshLang.

---

## 1. Variable Binding Semantics

In AdeshLang, variable bindings are introduced using the `let`, `const`, or `readonly` keywords.

### 1.1 `let` Bindings (Mutable by Default)
Variables declared with `let` create reassignable bindings within their enclosing lexical scope. No explicit `mut` keyword is required or permitted:

```adesh
let counter: i64 = 0;
counter += 1;
counter = 100; // Valid: binding is reassigned in-place
```

### 1.2 `const` Bindings (Compile-Time Constants)
`const` bindings declare immutable values evaluated strictly at compile time. They require explicit type annotations and must be initialized with constant expressions:

```adesh
const BUFFER_CAPACITY: usize = 1024 * 64; // Evaluated at compile time
const PROT_FLAGS: u32 = 0x07;
```

`const` values do not occupy stack frame slots at runtime; the compiler substitutes their immediate scalar values directly into instruction payloads or read-only data segments (`.rodata`).

### 1.3 `readonly` Bindings (Runtime Immutability)
`readonly` bindings enforce runtime write protection on dynamic values initialized at runtime:

```adesh
let input_val = fetch_user_input();
readonly let frozen_config = parse_config(input_val);
// frozen_config.port = 8080; // COMPILE ERROR: Cannot mutate readonly binding
```

---

## 2. Storage Classes & Memory Layout

Every variable binding belongs to one of two physical memory allocation storage classes: **Stack Frame Storage** or **Heap Allocation Descriptors**.

```
  Stack Frame (8-byte aligned slots)              Heap Segment
+------------------------------------+      +-----------------------+
|  Slot 0: [ counter (i64 = 100) ]   |      |  Array Allocation     |
+------------------------------------+      |  [ 10, 20, 30, 40 ]   |
|  Slot 1: [ buffer descriptor ] ----|----> +-----------------------+
|           - ptr:  0x7FFF00A0       |      |  Length: 4            |
|           - len:  4                |      |  Capacity: 8          |
|           - cap:  8                |      +-----------------------+
+------------------------------------+
```

### 2.1 Stack Slot Allocation
Primitive types (`i8`–`i64`, `u8`–`u64`, `f32`, `f64`, `bool`) are stored directly on the active CPU execution stack frame within 8-byte aligned slots. Pass-by-value copies the stack slot data directly.

### 2.2 Heap Allocation Descriptors
Dynamic types (`string`, `[T]`, `{ k: V }`, `class` instances) store a 24-byte fat pointer descriptor on the stack frame, pointing to contiguous backing memory allocated on the heap:

```cpp
// Internal C++ Representation of Array Descriptor on Stack
struct ArrayDescriptor {
    uint8_t*  data_ptr;  // 8 bytes: Pointer to heap buffer
    uint64_t  length;    // 8 bytes: Active element count
    uint64_t  capacity;  // 8 bytes: Allocated buffer capacity
};
```

---

## 3. Variable Shadowing Mechanics

AdeshLang permits variable shadowing, where a new binding redeclares an existing identifier in the same or an inner lexical scope:

```adesh
let data: string = "  4096  ";

// 1. Shadow 'data' with trimmed string view
let data: string = data.trim();

// 2. Shadow 'data' with parsed integer type
let data: u64 = data.parse_uint().unwrap();
```

### 3.1 Implementation Semantics
Shadowing does not mutate the existing memory slot in-place. Instead:
1. The compiler creates a new entry in the current scope's symbol table.
2. Subsequent identifier references bind to the newest symbol table entry.
3. The previous binding remains stored in its stack slot until its enclosing lexical scope terminates, ensuring memory safety for existing references.

---

## 4. Lexical Scoping & Scope-Exit Lifetimes

Variables exist strictly within the lexical block `{ ... }` where they are declared.

```adesh
fn process_payload() {
    let outer_var = 100;

    {
        let inner_buffer = [1, 2, 3, 4];
        print(inner_buffer[0]);
    } // <-- inner_buffer scope terminates here.
      // Heap buffer memory is deterministically deallocated (Drop glue).

    // print(inner_buffer); // COMPILE ERROR: Undefined symbol 'inner_buffer'
}
```

When execution leaves a lexical scope, the compiler automatically injects **Drop Glue** instructions to release any heap buffers associated with descriptors declared within that scope.

---

## 5. Multi-Variable Unpacking & Register Swapping

AdeshLang supports multi-variable declaration, destructuring, and zero-cost variable swapping:

```adesh
// Declaration & Destructuring
let x: i32, y: string = 500, "Active";

// Zero-Cost Variable Swapping
let a = 0xA;
let b = 0xB;

a, b = b, a;
```

### 5.1 SSA Intermediate Representation
During compilation, variable swaps are transformed into Static Single Assignment (SSA) virtual registers:

```llvm
; Lowered SSA LLVM IR Representation for `a, b = b, a`
%reg_b = load i64, i64* %b_slot
%reg_a = load i64, i64* %a_slot
store i64 %reg_b, i64* %a_slot
store i64 %reg_a, i64* %b_slot
```

This guarantees zero data corruption and eliminates the overhead of manual temporary variable creation.
