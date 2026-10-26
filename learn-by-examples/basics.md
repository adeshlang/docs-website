---
id: basics
title: Basics, Variables & Type System
sidebar_label: Basics & Type System
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Basics, Variables & Type System

<FeatureStatus status="STABLE" details="Primitive types, multi-variable declarations, explicit casting, null-coalescing, and runtime type introspection" />

This section covers the fundamental building blocks of Adesh programs: variable declarations, primitive types, type safety, multi-variable assignment and swapping, casting with `as`, null safety with `??`, and type introspection.

---

## 1. Primitive Variable Declarations & Type Annotations

Adesh is statically typed with powerful type inference. You can let the compiler infer variable types or supply explicit type annotations (`i8`-`i128`, `u8`-`u128`, `f32`, `f64`, `bool`, `string`).

### Code Example

```adesh
// Explicit type annotations
let age: i32 = 25;
let price: f64 = 99.99;
let active: bool = true;
let greeting: string = "Hello, Adesh!";

// Type inference (compiler automatically deduces types)
let count = 42;          // inferred as i32
let ratio = 3.14159;     // inferred as f64
let isReady = false;     // inferred as bool

print("Age:", age);
print("Price:", price);
print("Active:", active);
print("Greeting:", greeting);
print("Count:", count, "| Ratio:", ratio, "| Ready:", isReady);
```

### Terminal Output

```text
Age: 25
Price: 99.99
Active: true
Greeting: Hello, Adesh!
Count: 42 | Ratio: 3.14159 | Ready: false
```

### Breakdown

* **`let name: Type = value;`**: Declares a variable with an explicit type annotation.
* **Type Inference**: When type annotations are omitted, the compiler infers the tightest primitive type based on literal structure.
* **`print(...)`**: Built-in function accepting comma-separated arguments for formatting and output.

---

## 2. Multi-Variable Declaration & In-Place Swapping

Adesh supports unparenthesized multi-variable declarations and tuple-free variable swapping without temporary variables or allocations.

### Code Example

```adesh
// 1. Unparenthesized multi-variable declaration
let a, b, c = 10, 20, 30;
print("Initial values -> a:", a, "b:", b, "c:", c);

// 2. In-place variable swapping (zero allocation overhead)
a, b = b, a;
print("After swapping (a, b = b, a) -> a:", a, "b:", b);

// 3. Multi-variable declaration with per-variable type annotations
let x: i32, y: f64 = 100, 3.14;
print("Typed multi-var -> x:", x, "y:", y);
```

### Terminal Output

```text
Initial values -> a: 10 b: 20 c: 30
After swapping (a, b = b, a) -> a: 20 b: 10
Typed multi-var -> x: 100 y: 3.14
```

### Breakdown

* **`let a, b, c = v1, v2, v3;`**: Declares and initializes multiple variables concurrently in a single statement.
* **`a, b = b, a;`**: Atomic variable swapping executed at zero runtime cost without borrowing conflicts or heap allocations.

---

## 3. Explicit Type Casting (`as`)

Implicit type conversions are disallowed to prevent hidden precision loss. Type conversions must be performed explicitly using the `as` operator.

### Code Example

```adesh
let floatVal: f64 = 42.85;

// Cast float to integer (truncates decimal portion)
let intVal: i64 = floatVal as i64;
print("Float value:", floatVal);
print("Casted i64 value:", intVal);

// Cast integer to byte (u8)
let rawByte: u8 = intVal as u8;
print("Casted u8 byte:", rawByte);

// String conversion
let strVal: string = string(intVal);
print("String representation:", strVal);
```

### Terminal Output

```text
Float value: 42.85
Casted i64 value: 42
Casted u8 byte: 42
String representation: 42
```

### Breakdown

* **`expr as TargetType`**: Safely casts numeric primitives. Truncates fractional parts when converting `f64`/`f32` to integral types.
* **`string(val)`**: Converts any primitive or standard object into its UTF-8 string representation.

---

## 4. Null Safety & Null-Coalescing Operator (`??`)

Adesh handles optional or missing data safely without null pointer exceptions. The null-coalescing operator `??` provides a concise fallback mechanism.

### Code Example

```adesh
let userDefinedHost = null;
let defaultHost = "127.0.0.1";

// Evaluate null-coalescing
let activeHost = userDefinedHost ?? defaultHost;
print("Active Host:", activeHost);

// When left operand is non-null, fallback is skipped
let customPort = 8080;
let activePort = customPort ?? 3000;
print("Active Port:", activePort);
```

### Terminal Output

```text
Active Host: 127.0.0.1
Active Port: 8080
```

### Breakdown

* **`left ?? right`**: Evaluates `left`. If `left` is `null`, it returns `right`. If `left` is non-null, `right` is short-circuited and not evaluated.

---

## 5. Runtime Introspection (`type()`)

Adesh provides reflection and type introspection utilities to verify types dynamically at runtime.

### Code Example

```adesh
let valInt = 500;
let valFloat = 12.34;
let valStr = "Adesh";
let valArr = [1, 2, 3];

print("type(valInt):", type(valInt));
print("type(valFloat):", type(valFloat));
print("type(valStr):", type(valStr));
print("type(valArr):", type(valArr));
```

### Terminal Output

```text
type(valInt): int
type(valFloat): float
type(valStr): string
type(valArr): array
```

### Breakdown

* **`type(val)` / `typeof val`**: Introspects runtime value metadata and returns a canonical type string.
