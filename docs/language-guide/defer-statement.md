---
id: defer-statement
title: "Defer Statement Architecture & Scope-Exit Unwinding"
description: "Formal specification of AdeshLang defer statement execution order, LIFO unwinding stacks, AST cleanup block injection, and RAII resource guarantees."
sidebar_label: "Defer & Scope Exit"
---

# Defer Statement Architecture & Scope-Exit Unwinding

This document specifies the execution order, compiler AST lowering, LIFO unwinding stack, and RAII resource safety guarantees for the `defer` statement in AdeshLang.

---

## 1. `defer` Statement Overview

The `defer` statement postpones the execution of an expression or block until the enclosing lexical scope terminates:

```adesh
fn process_file(path: string) -> Result<(), Error> {
    let file = open_file(path)?;
    defer file.close(); // Execution deferred until process_file exits

    let buffer = file.read_all()?;
    return Ok(());
}
```

Regardless of how execution leaves the block (`return`, early break, thrown exception), the deferred code is guaranteed to execute deterministically before the scope's stack frame is popped.

---

## 2. LIFO Execution Stack Order

If multiple `defer` statements are declared within a single scope, they execute in strict **Last In, First Out (LIFO)** reverse declaration order:

```adesh
fn execute_sequence() {
    defer print("Third (LIFO 1)");
    defer print("Second (LIFO 2)");
    defer print("First (LIFO 3)");

    print("Executing Body");
}
```

Console Output:
```text
Executing Body
First (LIFO 3)
Second (LIFO 2)
Third (LIFO 1)
```

### 2.1 Formal Scope Unwinding Invariant
For a scope containing deferred expressions `D_1, D_2, ... D_n` declared sequentially at evaluation timestamps `t_1 < t_2 < ... < t_n`:

```text
Execution Sequence = [ D_n, D_(n-1), ..., D_1 ]
```

---

## 3. Compiler AST Cleanup Block Injection

The compiler processes `defer` statements during AST analysis by maintaining an active **Defer Stack** for each basic block.

### 3.1 Basic Block Injection Diagram
When a scope terminator (`return`, `break`, `continue`, `throw`) is encountered, the compiler injects the current LIFO defer stack instructions directly into the AST before emitting the exit opcode:

```text
[ Source Code ]                        [ AST Lowered Block ]
fn example() {                         fn example() {
    let res = acquire();                   let res = acquire();
    defer release(res);                    // Main logic
    use(res);                              use(res);
    return;                                // Injected Defer Cleanup Block:
}                                          release(res);
                                           return;
                                       }
```

---

## 4. Exception Safety & Interaction with Exceptions

If an out-of-band exception is thrown inside a block containing `defer` statements, the two-phase stack unwinding engine pops the defer stack for each active stack frame during **Phase 2 (Cleanup Phase)**:

```
[ Exception Thrown ]
        |
        v
[ Unwind Stack Frame 0 ] --> Execute Frame 0 Defer Stack (LIFO) --> Run Drop Glue
        |
        v
[ Unwind Stack Frame 1 ] --> Execute Frame 1 Defer Stack (LIFO) --> Run Drop Glue
        |
        v
[ Landing Pad Found ] ----> Enter 'catch' Block
```

This guarantees zero resource leaks (file descriptors, sockets, database locks, heap memory) even when unhandled exceptions propagate across multiple stack frames.
