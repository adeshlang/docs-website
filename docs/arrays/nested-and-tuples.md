---
id: arrays-nested-and-tuples
title: Nested Arrays & Tuples
sidebar_label: Nested & Tuples
slug: /arrays/nested-and-tuples
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Nested Arrays & Heterogeneous Tuples

<FeatureStatus status="STABLE" />

AdeshLang provides powerful constructs for modeling complex data: **Nested Arrays** for homogeneous multidimensional data (matrices, grids, tables) and **Tuples** for fixed-length heterogeneous collections with destructuring assignment.

---

## 1. Nested Arrays (Matrices & Grids)

A nested array is an array whose elements are themselves arrays. In AdeshLang, nested arrays maintain contiguous rows for 2D/3D numerical algorithms:

```adesh
// 3x3 Matrix representation
let matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

// Row-column element access (0-indexed)
print("Matrix center element [1][1]: ", matrix[1][1]); // 5
print("Matrix row 2 element [2][0]:   ", matrix[2][0]); // 7
```

### Iterating Over 2D Arrays

```adesh
let grid = [
    [10, 20],
    [30, 40]
];

let r = 0;
while (r < grid.length) {
    let c = 0;
    while (c < grid[r].length) {
        print("grid[", r, "][", c, "] = ", grid[r][c]);
        c = c + 1;
    }
    r = r + 1;
}
```

---

## 2. Heterogeneous Tuples

While arrays require homogeneous elements, **Tuples** allow fixed-length collections of **mixed types** (e.g. `(u8, i32, f64, string)`).

### Tuple Literal Declaration

```adesh
// Inferred heterogeneous tuple
let tup = (42, "hello", true, 3.14);

print("Tuple element 0 (int):    ", tup[0]); // 42
print("Tuple element 1 (string): ", tup[1]); // "hello"
print("Tuple element 2 (bool):   ", tup[2]); // true
print("Tuple element 3 (float):  ", tup[3]); // 3.14
```

### Explicit Tuple Type Annotations

You can explicitly enforce primitive element types for every field in a tuple:

```adesh
let record: (u8, i32, f64, string) = (42u8, 1000i32, 3.14159, "AdeshLang");

print("Type of element 0: ", typeof(record[0])); // u8
print("Type of element 1: ", typeof(record[1])); // i32
print("Type of element 2: ", typeof(record[2])); // f64
print("Type of element 3: ", typeof(record[3])); // string
```

---

## 3. Tuple Destructuring Assignment

AdeshLang supports clean tuple destructuring to unpack multiple values into individual variables in a single statement:

```adesh
// Destructuring with implicit types
let (x, y, z) = (1, 2.5, "test");

print("x = ", x); // 1
print("y = ", y); // 2.5
print("z = ", z); // "test"

// Destructuring with explicit type annotations
let tuple1: (u8, i32, f64, string) = (42u8, 1000i32, 3.14, "hello");
let (a, b, c, d): (u8, i32, f64, string) = tuple1;

print("a (u8): ", a, " - typeof: ", typeof(a));
print("b (i32):", b, " - typeof: ", typeof(b));
```

---

## 4. Arrays of Tuples (Lightweight Records)

Combining arrays and tuples provides a lightweight, zero-boilerplate alternative to full struct or class models:

```adesh
let locations = [
    ("north", 10, 20.5),
    ("south", 30, 40.2),
    ("east",  15, 88.0)
];

// Read south latitude
let (dir, count, lat) = locations[1];
print("Location 1: ", dir, ", count: ", count, ", lat: ", lat);
```

---

## Comparison Summary: Array vs Tuple vs Object

| Feature | Dynamic Array (`[T]`) | Raw Array (`[T; raw]`) | Tuple (`(T1, T2)`) | Object/Record (`{}`) |
| :--- | :--- | :--- | :--- | :--- |
| **Element Types** | Homogeneous | Homogeneous | **Heterogeneous** | Key-Value Mapped |
| **Length** | Growable | Fixed | Fixed | Dynamic |
| **Metadata Overhead**| 2B (SSO) / 16B / 24B | **0 bytes** | Fixed Field Offsets | Hash Table Overhead |
| **Indexing** | `arr[i]` | `arr[i]` | `tup[i]` or Destructure | `obj.key` or `obj["key"]` |
| **Primary Use** | Lists, Streams | C Buffers, Bytes | Multivalue Returns | Structured Entities |

---

## Runnable Example References

- [`examples/arrays/comprehensive_array_demo.adesh`](https://github.com/adeshlang/adeshlang/tree/main/examples/arrays/comprehensive_array_demo.adesh) — Tuple destructuring with type annotations (Section 7).
- [`examples/arrays/array_types_demo.adesh`](https://github.com/adeshlang/adeshlang/tree/main/examples/arrays/array_types_demo.adesh) — Heterogeneous tuples & object literal syntax.
