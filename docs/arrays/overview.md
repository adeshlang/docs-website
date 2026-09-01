---
id: arrays-overview
title: Arrays Overview
sidebar_label: Overview
slug: /arrays/overview
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Arrays in AdeshLang

<FeatureStatus status="STABLE" />

Arrays in **AdeshLang** are continuous, memory-efficient data structures designed for everything from high-level data processing pipelines to low-level zero-overhead C-like systems programming. 

Unlike traditional dynamically-typed languages that wrap every element in object pointers or heap allocations, AdeshLang features an advanced **Multi-Tier Array Memory Engine** written in Rust. It automatically selects optimal physical storage layouts and primitive element sizes at compile time.

---

## Key Highlights & Architecture

1. **Type-Specialized Primitives**: Element arrays are stored contiguously as native C-style primitive buffers (`u8`, `i16`, `i32`, `i64`, `f32`, `f64`, `string`) without pointer indirections.
2. **Small-Size Optimization (SSO)**: Arrays with payload sizes $\le 22$ bytes are stored **inline on the stack** with zero heap allocations and only 2 bytes of metadata overhead.
3. **Compact Headers**: Medium-sized arrays ($\le 65,535$ elements) use 16-bit `u16` header fields to reduce header size to 16 bytes.
4. **Raw C-Style Buffers (`[T; raw]`)**: Fixed-size contiguous byte buffers with **0 bytes** of metadata overhead.
5. **Rich Builtin Method Library**: Out-of-the-box methods for push, pop, slice, map, filter, reduce, sort, reverse, search, and SIMD hardware acceleration.

---

## Progressive Learning: Absolute Beginner to Advanced

### 1. Beginner: Simple Dynamic Arrays

If you omit type annotations, AdeshLang automatically inspects array literal values and creates an inferred dynamic array:

```adesh
// Auto-inferred integer array
let numbers = [10, 20, 30, 40, 50];

print("Array contents: ", numbers);       // [10, 20, 30, 40, 50]
print("First element:   ", numbers[0]);    // 10
print("Array length:    ", numbers.length); // 5
```

### 2. Intermediate: Explicit Primitive Annotations & Fixed Capacities

For predictable memory footprints and bounded buffers, specify element primitive types and optional fixed capacities:

```adesh
// Signed 16-bit integer array
let temperatures: [i16] = [-15, 0, 25, 32, 100];

// Dynamic array with fixed capacity of 6 elements
let buffer: [i32; 6] = [1, 2, 3, 4];
print("Length:   ", buffer.length);   // 4
print("Capacity: ", buffer.capacity); // 6

// Mutating within capacity
buffer = buffer.append(5); // Works! Length becomes 5
```

### 3. Advanced: The 4 Physical Memory Tiers

AdeshLang provides four distinct physical memory layouts depending on element annotations and size thresholds:

| Memory Tier | Type Annotation | Storage Location | Metadata Size | Max Elements | Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Raw Array** | `[T; raw]` | Contiguous Heap/Stack | **0 bytes** | Fixed | C interop, hardware buffers |
| **SSO Array** | `[T]` ($\le 22$B) | Inline Stack | **2 bytes** | Inline payload $\le 22$B | Short lists, coordinates |
| **Compact Array** | `[T]` ($\le 65k$) | Heap + 16B Header | **16 bytes** | 65,535 (`u16`) | Medium collections, UI lists |
| **Dynamic Array**| `[T]` | Heap + 24B Header | **24 bytes** | Unbounded (`u64`) | Streaming buffers, datasets |

#### Inspecting Metadata Overhead at Runtime

You can inspect the exact metadata byte footprint of any array using `.metadata_size()`:

```adesh
let raw_arr: [u8; raw] = [1, 2, 3, 4, 5];
let sso_arr: [u8] = [1, 2, 3, 4, 5]; // 5 bytes <= 22B SSO threshold

print("Raw array metadata: ", raw_arr.metadata_size(), " bytes"); // 0 bytes
print("SSO array metadata: ", sso_arr.metadata_size(), " bytes"); // 2 bytes
```

---

## Basic Array Operations Syntax

### Accessing & Mutating Elements

Arrays support zero-indexed square bracket `[]` notation:

```adesh
let scores = [85, 90, 95];

// Read element
let top_score = scores[0]; // 85

// Mutate element
scores[1] = 92;
print("Updated scores: ", scores); // [85, 92, 95]
```

### Out-of-Bounds Exceptions

Direct index accesses outside valid bounds throw catchable runtime exceptions:

```adesh
let items = [10, 20];

try {
    let invalid = items[10]; // Out of bounds
} catch (e) {
    print("Caught bounds exception: ", e);
}
```

---

## Runnable Example References

Explore complete runnable array scripts in the codebase:

- [`examples/arrays/comprehensive_array_demo.adesh`](https://github.com/adeshlang/adeshlang/tree/main/examples/arrays/comprehensive_array_demo.adesh) — Full multi-tier array system demonstration.
- [`examples/arrays/array_types_demo.adesh`](https://github.com/adeshlang/adeshlang/tree/main/examples/arrays/array_types_demo.adesh) — Type inference & specialization.
- [`examples/arrays/advanced_array_ops.adesh`](https://github.com/adeshlang/adeshlang/tree/main/examples/arrays/advanced_array_ops.adesh) — Bounded mutation & raw array error handling.

---

## Next Steps

- **[Arrays by Type](/arrays/types)** — Detailed type inference algorithms, primitive specialization, and memory overhead tables.
- **[Array Builtin Operations](/arrays/operations)** — Comprehensive API reference for `push`, `pop`, `map`, `filter`, `reduce`, `slice`, and SIMD vector operations.
- **[Nested Arrays & Tuples](/arrays/nested-and-tuples)** — Multidimensional matrices, heterogeneous tuples, and destructuring syntax.
