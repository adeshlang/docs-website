---
id: generics
title: "Generics Architecture & Monomorphization Engine"
description: "Formal specification of AdeshLang generic instantiation, compile-time monomorphization, trait bounds, symbol mangling, and dynamic trait objects."
sidebar_label: "Generics & Monomorphization"
---

# Generics Architecture & Monomorphization Engine

This document defines the compile-time monomorphization engine, generic type resolution, trait bound validation, symbol name mangling algorithms, and dynamic trait object dispatch in AdeshLang.

---

## 1. Generics Architecture Overview

AdeshLang supports generic functions, structs, enums, and traits:

```adesh
struct Stack<T> {
    items: [T],
}

fn swap<T>(a: &T, b: &T) {
    let temp = *a;
    *a = *b;
    *b = temp;
}
```

AdeshLang implements **Compile-Time Monomorphization** for generics. Generic code incurs zero runtime performance penalty; every concrete type instantiation generates dedicated, fully optimized native assembly machine code.

---

## 2. Compile-Time Monomorphization Engine

Monomorphization executes during the semantic and IR generation phases:

```
[ Generic Template ]           [ Concrete Instantiations ]           [ Native Assembly Code ]
  fn swap<T>(a, b)    ---->     Instantiate swap<i64>       ---->     fn swap_i64(a, b)
                                Instantiate swap<f64>       ---->     fn swap_f64(a, b)
```

### 2.1 Monomorphization Processing Pipeline
1. **Instantiation Discovery**: The compiler scans the AST for all calls to generic functions or uses of generic data structures, recording concrete type arguments (`T = i64`, `T = string`).
2. **AST Template Cloned**: For each unique concrete type combination, a specialized duplicate of the function or struct AST is generated.
3. **Type Substitution**: Type parameters (`T`) are substituted with target concrete types.
4. **Symbol Name Mangling**: The compiler assigns a unique mangled symbol name for the linker:

```text
Mangled Symbol Name = _Adesh_M_ + ModuleName + _ + FunctionName + _ + TypeHashes
```

```text
swap<i64>   --> _Adesh_M_main_swap_i64
swap<f64>   --> _Adesh_M_main_swap_f64
```

---

## 3. Trait Bounds & Static Constraints

Generic parameters can enforce interface contracts via Trait Bounds (`: Trait`):

```adesh
trait Printable {
    fn format(&self) -> string;
}

trait Comparable<T> {
    fn compare(&self, other: &T) -> i32;
}

// Enforce T implements both Printable and Comparable
fn process_item<T: Printable + Comparable<T>>(item: &T) {
    print(item.format());
}
```

### 3.1 Static Dispatch Verification
Trait bounds are verified during semantic analysis. The type checker verifies that the concrete type implements every required trait method. Because bounds are checked at compile time, call sites dispatch method invocations directly without runtime VTable lookups (**Static Dispatch**).

---

## 4. Dynamic Trait Objects (`dyn Trait`)

When heterogeneous collections or runtime dynamic dispatch are explicitly required, AdeshLang supports dynamic trait objects (`dyn Trait`):

```adesh
fn print_dynamic_items(items: [&dyn Printable]) {
    for item in items {
        print(item.format()); // Dynamic VTable Dispatch
    }
}
```

### 4.1 Trait Object Fat Pointer Layout (16 Bytes)
A `dyn Trait` dynamic reference is stored as a 16-byte Fat Pointer:

```
dyn Trait Fat Pointer (16 bytes)
+------------------------------------+------------------------------------+
|  Data Pointer (8 Bytes)            |  VTable Pointer (8 Bytes)          |
+------------------------------------+------------------------------------+
  Points to heap/stack concrete value  Points to Trait VTable for target type
```

---

## 5. Code Bloat Mitigation

To mitigate executable binary size expansion from extensive monomorphization, the compiler performs **Pointer Instantiation Merging**:
- Generic instantiations over pointer-like types (`&String`, `&ClassInstance`, `*u8`) share a single underlying machine code template operating over `*void` raw pointers, casting data types at instruction boundaries.
