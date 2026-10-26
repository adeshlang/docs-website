---
id: functions
title: Functions, Closures & Recursion
sidebar_label: Functions & Closures
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Functions, Closures & Recursion

<FeatureStatus status="STABLE" details="First-class functions, parameter and return type annotations, recursive calls, closures, and environment capture" />

Functions in Adesh are first-class values. They can be passed as arguments, returned from other functions, stored in variables, and capture variables from their lexical outer environment.

---

## 1. Function Declarations & Type Annotations

Functions are declared using `fn`. Parameter types and return types can be explicitly annotated.

### Code Example

```adesh
// Typed function declaration
fn add(a: i32, b: i32): i32 {
    return a + b;
}

// Untyped / generic parameter function
fn calculateTotal(subtotal, taxRate) {
    let tax = subtotal * taxRate;
    return subtotal + tax;
}

print("Add result (i32):", add(15, 30));
print("Calculate total:", calculateTotal(100.0, 0.08));
```

### Terminal Output

```text
Add result (i32): 45
Calculate total: 108
```

### Breakdown

* **`fn name(param: Type): ReturnType`**: Defines a function with explicit parameter types and return type annotations.
* **`return expr;`**: Exits the function immediately and returns `expr` to the caller.

---

## 2. Recursive Functions

Functions can invoke themselves recursively. Recursion depth and stack frames are optimized at compile time.

### Code Example

```adesh
// Recursive Factorial
fn factorial(n: i64): i64 {
    if n <= 1 {
        return 1;
    }
    return n * factorial(n - 1);
}

// Recursive Fibonacci
fn fibonacci(n: i32): i32 {
    if n <= 0 { return 0; }
    if n == 1 { return 1; }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

print("Factorial of 6:", factorial(6));
print("Fibonacci of 7:", fibonacci(7));
```

### Terminal Output

```text
Factorial of 6: 720
Fibonacci of 7: 13
```

### Breakdown

* **Recursive Base Case**: `if n <= 1 { return 1; }` prevents infinite stack recursion.
* **Recursive Call**: The function calls itself with decremented state until the base case is reached.

---

## 3. Lexical Closures & Factory Functions

Anonymous functions (`fn(args) { ... }`) preserve their lexical scope environment, creating closures that remember variable states even after the outer function has returned.

### Code Example

```adesh
// Factory function returning a closure
fn makeMultiplier(factor: f64) {
    return fn(value: f64) {
        return value * factor;
    };
}

let double = makeMultiplier(2.0);
let triple = makeMultiplier(3.0);

print("Double of 15.0:", double(15.0));
print("Triple of 15.0:", triple(15.0));
```

### Terminal Output

```text
Double of 15.0: 30
Triple of 15.0: 45
```

### Breakdown

* **Lexical Capture**: The inner anonymous function retains a read-only capture of `factor` from `makeMultiplier`.
* **First-Class Return**: `makeMultiplier` returns the closure function object itself.

---

## 4. Higher-Order Functions & Callbacks

Functions can accept other functions as arguments, enabling custom algorithms and processing pipelines.

### Code Example

```adesh
fn applyOperation(a: i32, b: i32, op) {
    return op(a, b);
}

let sum = applyOperation(20, 5, fn(x, y) { return x + y; });
let product = applyOperation(20, 5, fn(x, y) { return x * y; });

print("Applied Sum:", sum);
print("Applied Product:", product);
```

### Terminal Output

```text
Applied Sum: 25
Applied Product: 100
```

### Breakdown

* **Function Callbacks**: Passing an inline closure `fn(x, y) { ... }` directly as a runtime argument.
