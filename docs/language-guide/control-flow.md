---
id: control-flow
title: "Control Flow Architecture & Branching Semantics"
description: "Formal specification of conditional branches, loop lowering, iterator trait desugaring, jump opcodes, and pattern matching decision trees in AdeshLang."
sidebar_label: "Control Flow Architecture"
---

# Control Flow Architecture & Branching Semantics

This document details the compiler lowering, bytecode opcode generation, branch prediction annotations, and control-flow graphs for conditional logic, loops, and pattern matching in AdeshLang.

---

## 1. Conditional Branching (`if`, `elif`, `else`)

Conditional execution is governed by `if`, `elif`, and `else` blocks. Conditions must evaluate strictly to `bool`.

```adesh
if temperature > 100.0 {
    print("Critical Overheat");
} elif temperature > 75.0 {
    print("Warning High");
} else {
    print("Normal");
}
```

### 1.1 IR Lowering & Opcode Emission
Conditional blocks compile into conditional jump instructions (`JUMP_IF_FALSE`):

```text
       [ Evaluate LHS Condition ]
                   |
         +---------+---------+
         |                   |
     (true)               (false)
         v                   v
  [ Execute Body ]    [ JUMP_IF_FALSE to Else/End ]
         |                   |
         +---------+---------+
                   v
          [ Merge Basic Block ]
```

### 1.2 Branch Prediction Annotations (`@likely` / `@unlikely`)
Performance-critical loops and error checks accept branch hint attributes to assist JIT and AOT codegen in ordering native assembly basic blocks:

```adesh
if @unlikely(err != null) {
    handle_system_error(err); // Out-of-line basic block lowering
}
```

When `@unlikely` is attached, Cranelift/LLVM emits the failure branch out-of-line to maintain contiguous instruction cache locality for the fast path.

---

## 2. Loop Architecture & Lowering

AdeshLang provides three fundamental loop constructs: `while`, `do...while`, and `for...in`.

### 2.1 `while` and `do...while` Loops
- `while`: Evaluates condition at loop head before entering loop body.
- `do...while`: Executes body at least once, evaluating condition at loop tail.

```adesh
let i = 0;
while i < 10 {
    i += 1;
}

do {
    i -= 1;
} while i > 0;
```

### 2.2 `for...in` Iterator Desugaring
The `for...in` loop operates on any value implementing the `Iterator` contract:

```adesh
for item in collection {
    process(item);
}
```

The compiler desugars `for...in` loops into an imperative `while let` state machine:

```adesh
let iter = collection.into_iter();
while let Some(item) = iter.next() {
    process(item);
}
```

### 2.3 Range Loop Optimization (`0..N`)
Range iteration (`for i in 0..1000`) bypasses heap dynamic iterator allocation. The compiler lowers ranges into a hardware SSA counter register loop:

```text
  MOV   RCX, 0        ; Initialize counter i = 0
.L_loop_head:
  CMP   RCX, 1000     ; Check condition i < 1000
  JGE   .L_loop_exit  ; Exit loop when counter reaches 1000
  ...                 ; Loop body instructions
  INC   RCX           ; i++
  JMP   .L_loop_head  ; Repeat
.L_loop_exit:
```

---

## 3. Jump Opcodes & Scope Exits

Control exits inside loops and functions are executed via dedicated jump opcodes:

| Control Statement | Bytecode Opcode | Execution Semantics |
| :--- | :--- | :--- |
| `break` | `JUMP_OUT` | Immediate exit from nearest enclosing loop block |
| `continue` | `JUMP_LOOP_HEAD` | Skip remaining block instructions and jump to loop head condition |
| `return expr` | `RETURN_VALUE` | Evaluate expression, clean stack frame, and pop return address |
| `jump label` | `JUMP_IMMEDIATE` | Local unconditional jump within function block boundary |

---

## 4. Pattern Matching Control Flow (`match`, `if let`, `while let`)

Pattern matching evaluates a selector expression against structured pattern arms:

```adesh
match status {
    Status::Ok(val) => print(val),
    Status::Error(code) => handle_error(code),
    _ => print("Unknown Status"),
}
```

### 4.1 Decision Tree & Jump Table Lowering
For dense enum variants, `match` statements are lowered into an $O(1)$ native **Jump Table** (`SWITCH_TAG` instruction):

```text
          [ Evaluate Enum Discriminant Tag ]
                         |
      +------------------+------------------+
      | (Tag = 0)        | (Tag = 1)        | (Default)
      v                  v                  v
  [ Target Block 0 ] [ Target Block 1 ] [ Target Block Default ]
```

For non-contiguous or guard-filtered patterns, the compiler synthesizes a binary decision tree of conditional comparisons.
