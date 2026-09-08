---
id: error-handling
title: "Monadic Error Model vs Stack Unwinding Architecture"
description: "Formal specification of AdeshLang error handling architectures: Result/Option monadic zero-cost error propagation vs native DWARF/SEH stack unwinding exceptions."
sidebar_label: "Error Handling Architecture"
---

# Monadic Error Model vs Stack Unwinding Architecture

This document specifies AdeshLang's dual error handling models: zero-cost monadic error propagation using `Result<T, E>` / `Option<T>` and target-native stack unwinding exception tables (`try`/`catch`/`throw`).

---

## 1. Dual Error Handling Model Overview

AdeshLang provides two complementary error handling mechanisms suited for different operational requirements:

```
                                  +-----------------------+
                                  |  Error Propagation    |
                                  +-----------------------+
                                              |
                   +--------------------------+--------------------------+
                   |                                                     |
         +-------------------+                                 +-------------------+
         | Monadic Propagation|                                 | Stack Unwinding   |
         | (Result / Option) |                                 | (try/catch/throw) |
         +-------------------+                                 +-------------------+
         | - Zero runtime cost|                                 | - Out-of-band     |
         | - Explicit checks |                                 | - Deep call-stack |
         | - No unwinding    |                                 |   unwinding       |
         +-------------------+                                 +-------------------+
```

---

## 2. Monadic Error Propagation (`Result<T, E>` & `Option<T>`)

Monadic error propagation represents operations that can fail as explicit, stack-allocated **Tagged Union** values without runtime exception overhead:

```adesh
enum Result<T, E> {
    Ok(T),
    Err(E),
}

enum Option<T> {
    Some(T),
    None,
}
```

### 2.1 `Result<T, E>` Memory Layout
`Result<T, E>` is represented in memory as a 1-byte discriminant tag followed by a max-payload union buffer (`max(sizeof(T), sizeof(E))`):

```
Result<T, E> Memory Layout
+-------------------------+-----------------------------------------------------+
|  Discriminant Tag (1B)  |  Payload Union Buffer (max(sizeof(T), sizeof(E)))   |
+-------------------------+-----------------------------------------------------+
|  0 = Ok(T), 1 = Err(E)  |  Stores either T payload or E error payload         |
+-------------------------+-----------------------------------------------------+
```

---

## 3. Early Return Operator (`?`) Compiler Lowering

The `?` operator provides syntactic sugar for unwrapping `Ok(T)` or early-returning `Err(E)` from the enclosing function:

```adesh
fn read_and_parse(filename: string) -> Result<i64, Error> {
    let text = read_file(filename)?; // Early returns Err if read_file fails
    let num = parse_int(text)?;     // Early returns Err if parse_int fails
    return Ok(num);
}
```

### 3.1 Desugared AST Lowering
The compiler desugars `expr?` into a `match` basic block:

```adesh
let num = match parse_int(text) {
    Result::Ok(val) => val,
    Result::Err(err) => return Result::Err(err),
};
```

---

## 4. Native Stack Unwinding Exception Architecture (`try` / `catch` / `throw`)

For unexpected runtime faults or deep call-stack errors, AdeshLang implements native unwinding exceptions:

```adesh
try {
    execute_risky_operation();
} catch (e) {
    print(f"Caught exception: {e.message}");
}
```

### 4.1 Exception Frame Tables (DWARF / SEH)
`try`/`catch` blocks do not execute instruction-level overhead during normal execution ("Zero-Cost Exceptions"). Instead, the compiler generates binary exception tables:
- **Linux/macOS**: DWARF `.eh_frame` and `.gcc_except_table` landing pads.
- **Windows**: Structured Exception Handling (SEH) `.pdata` and `.xdata` exception directories.

### 4.2 Two-Phase Stack Unwinding Algorithm

When a `throw` statement or hardware signal occurs, the runtime execution system executes a two-phase stack unwind:

```
[ Throw Exception ]
        |
        v
[ Phase 1: Search Phase ] ----> Traverse stack frames to locate matching 'catch' landing pad.
        |
        v
[ Phase 2: Cleanup Phase ] ---> Re-traverse stack frames from throw site to landing pad,
                                executing scope-exit 'defer' blocks and Drop Glue for each frame.
        |
        v
[ Jump to Landing Pad ] ------> Transfer CPU execution to 'catch' block.
```
