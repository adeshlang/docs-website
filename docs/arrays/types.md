---
id: arrays-types
title: Array Types & Memory Layouts
sidebar_label: Types & Memory Layouts
slug: /arrays/types
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Array Types & Physical Memory Layouts

<FeatureStatus status="STABLE" />

AdeshLang provides an expressive, type-safe array system that balances convenience with total memory control. This document explains **type annotations**, **element type inference rules**, **immutability modifiers**, and the **physical memory layouts** used by the compiler.

---

## Array Type Annotations

AdeshLang supports four primary array type shapes:

### 1. Inferred Dynamic Array (`[T]`)

When you declare an array literal without an explicit type, AdeshLang automatically inspects all element values and selects the smallest fitting primitive type:

```adesh
let numbers = [10, 20, 30, 40, 50]; // Inferred element type u8
print("Type: ", typeof(numbers));    // [u8]
```

### 2. Explicit Primitive Type (`[T]`)

You can explicitly force an array element primitive representation (`u8`, `i16`, `i32`, `i64`, `f32`, `f64`, `string`):

```adesh
let temperatures: [i16] = [-100, 200, -300, 400];
print("Element type: ", typeof(temperatures[0])); // i16
print("Element size: ", sizeof(temperatures[0]), " bytes"); // 2 bytes
```

### 3. Fixed-Capacity Dynamic Array (`[T; N]`)

A fixed-capacity dynamic array specifies a pre-allocated capacity `N`. It can grow and shrink up to `N` elements without heap reallocations:

```adesh
let buffer: [i32; 6] = [10, 20, 30, 40];

print("Length:   ", buffer.length);   // 4
print("Capacity: ", buffer.capacity); // 6

// Append within capacity
buffer = buffer.append(50);
print("After append: ", buffer); // [10, 20, 30, 40, 50]
```

#### Capacity Violation Errors

Attempting to append or push elements beyond the fixed capacity `N` throws a catchable runtime exception:

```adesh
try {
    let b = buffer.append(60); // 6th element (at capacity)
    b = b.append(70);          // Exceeds capacity of 6!
} catch (e) {
    print("Caught capacity error: ", e);
}
```

### 4. Raw C-Style Array (`[T; raw]` or `[T; N; raw]`)

A raw array is a C-like fixed-size contiguous memory buffer with **zero metadata overhead**:

```adesh
let raw_bytes: [u8; raw] = [1, 2, 3, 4, 5];

print("Raw array: ", raw_bytes);
print("Metadata size: ", raw_bytes.metadata_size(), " bytes"); // 0 bytes
print("Total size: ", sizeof(raw_bytes), " bytes");           // 5 bytes (5 * 1B)
```

:::caution Size-Changing Operations Forbidden on Raw Arrays
Raw arrays cannot grow or shrink. Invoking `.push()`, `.pop()`, `.append()`, `.extend()`, or `.clear()` on a raw array throws a runtime exception:

```adesh
try {
    raw_bytes.push(6); // Throws exception!
} catch (e) {
    print("Cannot mutate raw array size: ", e);
}
```
:::

---

## Readonly & Immutability Syntax

AdeshLang provides two clean syntaxes for declaring immutable array variables:

```adesh
// Prefix readonly syntax
readonly let fixed_data = [100, 200, 300];

// Type-suffix readonly syntax
let config: [i32] readonly = [1000, 2000, 3000];

print("Readonly config: ", config);
```

Reassigning or modifying a `readonly` array variable produces a compile-time or runtime immutability error.

---

## Element Type Specialization & Inference Algorithm

AdeshLang automatically optimizes unannotated array literals using value-range inspection:

```adesh
let auto_u8: [u8] = [1, 2, 3, 255];          // 0 <= val <= 255 -> u8
let auto_i16: [i16] = [-1000, 1000, 2000];    // Negative / >255 -> i16
let auto_i32: [i32] = [100000, 200000];       // Large ints -> i32
let auto_f64: [f64] = [1.5, 2.7, 3.14159];    // Decimals -> f64

print("  [1, 2, 3, 255]     -> ", typeof(auto_u8));   // [u8]
print("  [-1000, 1000, 2000]-> ", typeof(auto_i16));  // [i16]
print("  [100000, 200000]   -> ", typeof(auto_i32));  // [i32]
print("  [1.5, 2.7, 3.14159]-> ", typeof(auto_f64));  // [f64]
```

---

## Physical Memory Layouts & Metadata Comparison

The table below breaks down exact metadata header costs across array representations:

| Memory Representation | Header Size | Element Payload Storage | Discriminant Byte | Pointer Overhead |
| :--- | :--- | :--- | :--- | :--- |
| **`Raw` Array (`[T; raw]`)** | **0 bytes** | Contiguous Inline/Heap | None | 0 B |
| **`SSO` Array ($\le 22$B payload)** | **2 bytes** | Stored Inline on Stack | 1 B (`SSO`) | 0 B (No Heap Ptr) |
| **`Compact` Array ($\le 65k$ elements)** | **16 bytes** | Heap Buffer | 1 B (`Compact`) | 8 B Heap Ptr |
| **`Dynamic` Array (Unbounded)** | **24 bytes** | Heap Buffer | 1 B (`Dynamic`) | 8 B Heap Ptr |

### Detailed 5-Element Memory Footprint Comparison

Below is a benchmark comparison demonstrating total memory usage for 5-element arrays across primitive element types:

```adesh
let comp_u8: [u8] = [1u8, 2u8, 3u8, 4u8, 5u8];
let comp_i32: [i32] = [1i32, 2i32, 3i32, 4i32, 5i32];
let comp_f64: [f64] = [1.0, 2.0, 3.0, 4.0, 5.0];

let total_u8 = comp_u8.length * 1 + comp_u8.metadata_size();
let total_i32 = comp_i32.length * 4 + comp_i32.metadata_size();
let total_f64 = comp_f64.length * 8 + comp_f64.metadata_size();

print("5 x u8  elements: ", total_u8, " bytes total (5B data + ", comp_u8.metadata_size(), "B metadata)");
print("5 x i32 elements: ", total_i32, " bytes total (20B data + ", comp_i32.metadata_size(), "B metadata)");
print("5 x f64 elements: ", total_f64, " bytes total (40B data + ", comp_f64.metadata_size(), "B metadata)");
```

---

## Runnable Example References

- [`examples/arrays/array_types_demo.adesh`](https://github.com/adeshlang/adeshlang/tree/main/examples/arrays/array_types_demo.adesh) — Full demonstration of type annotations, `typeof`, `sizeof`, and `readonly`.
- [`examples/arrays/test_array_metadata.adesh`](https://github.com/adeshlang/adeshlang/tree/main/examples/arrays/test_array_metadata.adesh) — SSO and Compact array metadata size benchmarks.
