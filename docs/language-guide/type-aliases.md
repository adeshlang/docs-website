---
id: type-aliases
title: "Type Aliases & Higher-Kinded Function Signatures"
description: "Formal specification of type alias expansion, generic type aliases, and closure function pointer memory representations in AdeshLang."
sidebar_label: "Type Aliases & Signatures"
---

# Type Aliases & Higher-Kinded Function Signatures

This document defines the formal rules for compile-time type alias expansion, generic type aliasing, and the memory representation of higher-kinded function pointers in AdeshLang.

---

## 1. Type Alias Expansion Mechanics

A type alias introduces a new identifier name for an existing concrete or generic type expression using the `type` keyword:

```adesh
type Kilobytes = u64;
type Matrix = [[f64]];
```

### 1.1 Zero-Cost Compile-Time Expansion
Type aliases are purely compile-time concepts. They do not introduce new runtime types, vtables, or memory overhead. During semantic analysis, the compiler replaces every alias identifier with its fully expanded target type:

```
[ Code Source ]               [ Semantic Analysis ]             [ Lowered Type ]
  let size: Kilobytes = 512;  -->  Expand Kilobytes -> u64  -->  let size: u64 = 512;
```

Type equivalence between an alias and its underlying target type is **symmetric and reflexive**: `Kilobytes` and `u64` are completely interchangeable in function parameter signatures, casts, and return types.

---

## 2. Generic Type Aliases

Type aliases can accept generic type parameters:

```adesh
type ResultMap<K, V> = HashMap<K, Result<V, string>>;
type Point2D<T> = (T, T);
```

### 2.1 Monomorphization of Generic Aliases
When a generic type alias is instantiated, the type checker substitutes the concrete type parameters into the underlying type template during type resolution:

```adesh
let coordinates: Point2D<f64> = (10.5, 20.25);
// Expanded internally to: (f64, f64)
```

---

## 3. Function Type Signatures & Memory Representation

Type aliases are frequently utilized to define clean function pointer and callback signatures:

```adesh
type EventHandler = fn(event_type: string, payload: [u8]) -> bool;
type Predicate<T> = fn(item: &T) -> bool;
```

### 3.1 Function Pointer Memory Layout (16-Byte Fat Pointer)
Function types in AdeshLang (`fn(A) -> B`) are stored in memory as **16-byte Fat Pointers** consisting of a code address pointer and an environment context pointer:

```
Function Pointer / Closure Layout (16 bytes)
+------------------------------------+------------------------------------+
|  Code Address Pointer (8 Bytes)    |  Environment Context Pointer (8B)  |
+------------------------------------+------------------------------------+
  Points to native instructions        Points to captured heap values
  or VM function block stub.           (or 0x00 for top-level functions).
```

- **Top-level functions**: The environment pointer is set to null (`0x0000000000000000`).
- **Closures**: The environment pointer references an allocated stack or heap capture context struct holding captured variable references.
