---
id: type-system
title: Type System Specification
description: Detailed reference for AdeshLang types, inference, explicit annotation, nullability, casting, and runtime introspection.
sidebar_label: Type System
---

# Type System Specification

AdeshLang is designed to be both expressive and predictable. The type system helps you write correct code early, before the program gets large enough for bugs to be expensive to find.

This page explains the system from a practical point of view: what types exist, how inference works, how to annotate types, and how runtime checks interact with static rules.

---

## 1. Goals of the type system

The language tries to balance three concerns:

- strong safety for refactoring and large codebases
- comfortable ergonomics for everyday coding
- performance-compatible types for native and compiled execution

The result is a system with explicit annotations when desired, but also with enough inference that common code remains concise and readable.

---

## 2. Type categories

| Type Category | Examples | Meaning |
|---|---|---|
| Integer | `i8`, `i16`, `i32`, `i64`, `u8`, `u16`, `u32`, `u64` | Fixed-width numeric values |
| Floating-point | `f32`, `f64` | Decimal / scientific numeric values |
| Boolean | `bool` | True/false logic |
| String | `string` | UTF-8 text |
| Array | `[T]`, `Array<T>` | Ordered, indexable collections |
| Object | `{ key: Type }` | Key-value maps / records |
| Tuple | `(T1, T2, ...)` | Fixed-size heterogeneous value |
| Set | `set` | Unique-value collection |
| Complex | `complex` | Real and imaginary numeric components |
| Null | `null` | Missing or empty value sentinel |
| Function | `fn(...) -> T` | Callable values |

This set is intentionally broad enough for scripting, systems programming, and structured application logic.

---

## 3. Numeric types

AdeshLang supports both signed and unsigned integer types, each with a fixed width.

```adesh
let x: i32 = -42;
let y: u32 = 100;
let z: i64 = 9_000_000_000;
```

### Signed integers

- `i8`
- `i16`
- `i32`
- `i64`

### Unsigned integers

- `u8`
- `u16`
- `u32`
- `u64`

### Floating point

```adesh
let pi: f64 = 3.1415926535;
let ratio: f32 = 0.5;
```

These floating-point types are useful for math, simulation, scientific computing, and values that are not naturally integral.

---

## 4. Type inference

If you do not explicitly annotate a value, AdeshLang may infer the type from the initializer.

```adesh
let count = 42;          // inferred as an integer-like type
let greeting = "Hello"; // inferred as string
let okay = true;         // inferred as bool
let tags: set = {"typed", "native"};
let z: complex = 5j;
```

Inference makes the language convenient for writing everyday code, while explicit annotations remain available for readability and contract clarity.

### Example with function parameters and return values

```adesh
fn multiply(a: f64, b: f64): f64 {
    return a * b;
}
```

This function clearly declares the types of its inputs and output. It is precise and easy to understand when reading upstream or downstream code.

---

## 5. Explicit type annotations

Type annotations appear after a variable name or parameter using `:`.

```adesh
let userId: u64 = 9876543210u64;
let ratio: f64 = 3.1415926535;
let enabled: bool = true;
```

This is useful when:

- the value’s meaning must be obvious
- you want stronger documentation in the source
- the compiler needs help with complex generic or overloaded code
- you want to enforce a fixed contract across APIs

---

## 6. Explicit casting

AdeshLang avoids silent, lossy conversions. If you want to convert a value between numeric types, do it explicitly with `as`.

```adesh
let smallVal: u8 = 255u8;
let widenedVal: u64 = smallVal as u64;

let floatVal: f64 = 99.9;
let truncatedInt: i64 = floatVal as i64; // truncates toward zero
```

This pattern reduces hidden bugs. Conversions are visible in the code and therefore easier to audit.

---

## 7. Nullability and safety

AdeshLang includes null-aware semantics to reduce runtime crashes caused by invalid property access.

```adesh
let config = null;
let host = config?.server?.host;
let activeHost = host ?? "127.0.0.1";
```

### Optional chaining

`?.` short-circuits access and returns `null` if the parent value is not available.

```adesh
let value = user?.profile?.name;
```

If `user` is `null`, the whole expression safely resolves to `null` instead of crashing.

### Null coalescing

`??` provides a fallback if the left-hand value is `null`.

```adesh
let name = user?.name ?? "Guest";
```

This is especially useful for configuration and network-layer code where some values may be absent.

---

## 8. Runtime type introspection

You can ask the runtime what a value is using `type()`.

```adesh
print(type(42));         // "number"
print(type("adesh"));    // "string"
print(type([1, 2, 3]));  // "array"
print(type({ a: 1 }));   // "object"
print(type(null));       // "null"
```

This is helpful for debugging, validation, and dynamic code paths where a value may arrive from user input or external data sources.

---

## 9. Arrays and collections

AdeshLang treats collections as first-class values.

```adesh
let numbers = [10, 20, 30];
let first = numbers[0];
```

Collection behavior is typically consistent with the rest of the language: typed values, well-defined operations, and predictable runtime semantics.

---

## 10. Objects and records

Objects are often used to represent structured data.

```adesh
let user = {
    id: 42,
    name: "Aisha",
    active: true
};

print(user.name);
```

This is the usual pattern for application configuration, DTOs, and simple record-like structures.

---

## 11. Type safety principles

AdeshLang is designed to make unsafe assumptions visible.

### Examples of intended behavior

- you do not silently convert large integers to smaller types without a cast
- `null` is handled explicitly through optional chaining and fallback logic
- type mismatches are easier to detect during compilation or validation

This helps avoid many of the bugs common in loosely typed languages while still staying approachable for developers who want to move quickly.

---

## 12. Generic flexibility

The type system supports generic programming for reusable logic.

```adesh
fn identity<T>(value: T): T {
    return value;
}
```

This allows functions and data structures to operate on many types while keeping operations type-safe.

---

## 13. Practical guidance

Use the type system as a design tool, not just a compiler feature.

- use annotations in public APIs
- use inference in local, obvious values
- prefer precise numeric types when correctness matters
- use `null` aware patterns for optional data
- use `as` when you truly intend a conversion

A good type design makes code easier to maintain and easier to debug.

---

## 14. What comes next

The type system is not an isolated topic. It intersects with:

- function signatures
- control flow
- modules and imports
- generic constraints
- memory-safety rules
- async and object-oriented patterns

To continue, read the deeper language chapters, especially:

- [Functions](/language-guide/functions)
- [Generics](/language-guide/generics)
- [Structs and Classes](/language-guide/structs-classes)
- [Error Handling](/language-guide/error-handling)
- [Semantics and Rules](/language-guide/semantics-rules)

