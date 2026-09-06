---
id: ownership-borrowing
title: Ownership and Borrowing — Memory Safety Explained
sidebar_label: Ownership & Borrowing
slug: /advanced/ownership-borrowing
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Ownership and Borrowing in AdeshLang

<FeatureStatus status="STABLE" details="Compile-time lifetime and reference alias safety pass" />

One of AdeshLang's defining characteristics is its **compile-time memory safety model**. It delivers predictable performance and zero runtime overhead without relying on a garbage collector (GC).

---

## 1. What Problem Does This Solve?

In traditional programming languages, memory management generally falls into one of two categories:

1. **Manual Memory Management (C / C++)**:
   - You allocate memory with `malloc` / `new` and free it with `free` / `delete`.
   - *Failure Modes*: Double-free errors, use-after-free bugs, dangling pointers, and memory leaks.

2. **Garbage Collection (Java / Go / JavaScript / Python)**:
   - The runtime periodically pauses execution to discover unreferenced objects and reclaim memory.
   - *Failure Modes*: Unexpected pause spikes, high memory footprint, and non-deterministic resource destruction.

### The AdeshLang Approach: Ownership at Compile Time

AdeshLang uses **Ownership and Borrowing rules** enforced by the compiler's semantic analysis and MIR pass ([`src/parsing/cfg_borrow`](file:///d:/Projects/AdeshLang/src/parsing/cfg_borrow)). Memory is cleaned up deterministically the moment its single owner goes out of scope (RAII - Resource Acquisition Is Initialization).

---

## 2. The Basic Concept

Memory safety in AdeshLang rests on three fundamental rules:

> [!IMPORTANT]
> 1. **Single Owner Rule**: Each value in AdeshLang has a single variable that is its *owner*.
> 2. **Scope Drop Rule**: When the owner variable goes out of scope, the memory for that value is automatically dropped/freed.
> 3. **Move Semantics**: Assigning a value or passing it into a function transfers (moves) ownership to the new destination.

---

## 3. Step-by-Step Example: Ownership & Moves

### Valid Code Example

```adesh
fn main() {
    let s1 = "Hello, AdeshLang!";
    let len = s1.length;
    print(s1);
    print(len);
} // s1 goes out of scope here; memory is dropped cleanly
```

### Invalid Code Example (Move Violation)

```adesh
fn process(data) {
    print("Processing: " + data);
}

fn main() {
    let s1 = "Sensitive Data";
    process(s1); // Ownership of s1 moves into process()
    
    // ERROR: Attempting to access s1 after move
    print(s1);
}
```

### Expected Compiler Error

```text
Error[E0382]: use of moved value: `s1`
  --> src/main.adesh:8:11
   |
 6 |     process(s1);
   |             -- value moved here
 7 |
 8 |     print(s1);
   |           ^^ value used here after move
```

---

## 4. Borrowing & References

Passing ownership into every function would be tedious if you only want to read a value. AdeshLang solves this through **Borrowing**.

Instead of transferring ownership, a function can create a temporary reference (borrow) to a value:

```adesh
fn calculate_length(text) {
    return text.length;
}

fn main() {
    let message = "AdeshLang Documentation";
    
    // Borrow message without moving ownership
    let len = calculate_length(message);
    
    // message is still owned by main() and remains valid!
    print("Message: " + message);
    print("Length: " + len);
}
```

### Borrowing Rules

To eliminate data races and dangling references, AdeshLang enforces:

- You can have **any number of immutable borrows** (`read-only` references) to a resource at the same time.
- You can have **only ONE mutable borrow** at any given time.
- You **cannot mix** immutable borrows and mutable borrows simultaneously.

---

## 5. Reference Counting (`Arc` & `Rc`)

When multiple parts of a program need to share ownership of the same dataset (such as graph nodes or shared worker state), AdeshLang provides reference-counted wrappers:

```adesh
import "std" as std;

let shared_data = Arc::new([10, 20, 30, 40]);
let worker_ref = shared_data.clone();

print("Strong reference count:", shared_data.strong_count());
```

See the [`advanced/arc`](/docs/advanced/arc) documentation page for deep reference counting patterns.
