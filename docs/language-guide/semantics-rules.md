---
id: semantics-rules
title: "Formal Memory Safety & Borrow Checker Specification"
description: "Formal specification of AdeshLang ownership semantics, destructive move invariants, Drop glue, Aliasing XOR Mutability theorem, and Non-Lexical Lifetimes (NLL)."
sidebar_label: "Memory Safety & Borrow Checker"
---

# Formal Memory Safety & Borrow Checker Specification

This document provides the formal mathematical and architectural specification of AdeshLang's compile-time memory safety invariants, destructive move semantics, Drop glue generation, and Borrow Checker specification.

---

## 1. Ownership System Invariants

Memory safety in AdeshLang is guaranteed at compile time without a Garbage Collector (GC) through strict enforcement of three core ownership invariants:

1. **Single Owner Invariant**: Every value in an AdeshLang program has exactly one owner variable binding at any given point in execution.
2. **Deterministic Lifetime Invariant**: When the owner binding goes out of scope, the value's heap memory is deterministically deallocated.
3. **Move Transfer Invariant**: Assigning a value to another binding or passing it by value transfers ownership, invalidating the source binding (**Destructive Move**).

---

## 2. Destructive Move Semantics & Drop Glue

When ownership of a heap-backed variable is assigned or passed to a function, the source variable is marked as uninitialized in the compiler's bitmask status map:

```adesh
let a = Container { id: 100 };
let b = a; // Ownership MOVED to 'b'. Variable 'a' is now uninitialized.

// print(a.id); // COMPILE ERROR E0030: Use of moved value 'a'
```

### 2.1 Compiler SSA Lowering & Drop Flags
During compilation, the AST transformer inserts conditional **Drop Flags** for variables whose initialization status depends on runtime branching:

```text
[ Scope Exit ]
      |
      v
[ Check Drop Flag for 'a' ]
      |
   +--+--+
   |     |
 (1)     (0)
   v     v
[Run]   [Skip]  --> Deallocate heap buffer iff Drop Flag == 1
```

If a value has been moved, its Drop Flag is set to `0`, preventing double-free runtime vulnerabilities.

---

## 3. Borrow Checker Formal Specification

AdeshLang supports referencing values without transferring ownership through **Borrowing**. Borrowing semantics are enforced by the compiler's Borrow Checker pass.

### 3.1 Aliasing XOR Mutability Theorem
The Borrow Checker guarantees memory safety across all execution paths by enforcing the **Aliasing XOR Mutability Theorem**:

```text
For all active references r_1, r_2 to value V:
  (is_shared(r_1) AND is_shared(r_2)) XOR (is_exclusive(r_1) AND r_2 == NULL)
```

- **Shared Borrows (Read-Only)**: Unlimited concurrent read-only references are permitted simultaneously. No mutations are allowed while shared references exist.
- **Exclusive Borrows (Mutable)**: Exactly one exclusive reference is permitted at any time. No other references (read-only or exclusive) may coexist.

```adesh
let data = DataBuffer::new();

read(data);  // Shared borrow
read(data);  // Shared borrow (Valid: Multiple readers allowed)

update(data); // Exclusive borrow (Valid: Borrow Checker infers exclusive access)
```

---

## 4. Non-Lexical Lifetimes (NLL) Analysis Graph

AdeshLang utilizes **Non-Lexical Lifetimes (NLL)**. A reference's lifetime is not restricted to its enclosing lexical block `{ ... }`. Instead, a reference's lifetime is computed as the Control Flow Graph (CFG) region extending from its point of creation to its **last actual usage**:

```adesh
fn process() {
    let data = DataBuffer::new();
    
    let ref1 = &data;
    print(ref1.size); // <-- LAST USE of 'ref1'. Lifetime of 'ref1' ENDS HERE.
    
    update(data);     // VALID: 'ref1' is no longer active in the CFG, 
                      // so exclusive mutation is permitted!
}
```

### 4.1 CFG Lifetime Calculation Algorithm
1. Construct the Control Flow Graph (CFG) for the function body.
2. For each reference `r`, identify the set of basic block instruction points `P_use(r)` where `r` is read or dereferenced.
3. Compute the lifetime region `L(r)` as the smallest connected sub-graph of CFG nodes containing `P_use(r)` and reachable from the creation point of `r`.
4. Verify that for any exclusive borrow `r_ex`, `L(r_ex) ∩ L(r') == ∅` for all other active references `r'`.

This analysis eliminates artificial borrow conflicts while guaranteeing zero dangling references, zero data races, and zero use-after-free bugs at compile time.
