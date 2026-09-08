---
id: enums-pattern-matching
title: "Enums, Tagged Unions & Pattern Lowering"
description: "Formal specification of scalar enums, tagged union memory offsets, discriminant optimization, decision tree generation, and pattern lowering in AdeshLang."
sidebar_label: "Enums & Pattern Matching"
---

# Enums, Tagged Unions & Pattern Lowering

This document specifies the physical memory layouts of scalar enumerations and tagged unions (sum types), discriminant byte-width optimizations, decision tree generation algorithms, and pattern matching lowering in AdeshLang.

---

## 1. Scalar Enums

Scalar enums define a set of distinct named integral constants:

```adesh
enum Severity {
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3,
}
```

Scalar enums require no object heap headers and are stored in memory directly as fixed-width integers (`i64` by default, or explicitly annotated as `u8`, `u16`, `u32`).

---

## 2. Tagged Unions (Sum Types / ADTs)

Enums in AdeshLang can attach heterogeneous payload data to individual variants, forming **Tagged Unions**:

```adesh
enum Message {
    Quit,
    Move { x: i64, y: i64 },
    Write(string),
    ChangeColor(u8, u8, u8),
}
```

### 2.1 Memory Layout & Discriminant Optimization
A tagged union memory buffer consists of a **Discriminant Tag** followed by a **Payload Union Buffer**:

```
Tagged Union Memory Layout
+--------------------------+----------------------------------------------------+
|  Discriminant Tag (1B)   |  Payload Union Buffer                              |
+--------------------------+----------------------------------------------------+
|  Variant Index (0..N)    |  Max payload size across all variants              |
|                          |  (e.g., sizeof(Write) = 24 bytes string header)    |
+--------------------------+----------------------------------------------------+
|<---- Tag Offset 0x00 --->|<---------------- Payload Offset 0x08 ------------->|
```

### 2.2 Discriminant Tag Byte-Width Optimization

The compiler automatically selects the minimum byte width required to represent all variant tags:

```text
Discriminant Tag Width:
  - 1 Byte  (u8)  if N_variants <= 256
  - 2 Bytes (u16) if 256 < N_variants <= 65,536
  - 4 Bytes (u32) if N_variants > 65,536
```

7 padding bytes are inserted after a 1-byte discriminant tag to align the payload union buffer to the 8-byte boundary.

---

## 3. Pattern Matching Compiler Lowering

Pattern matching expressions (`match`) evaluate a selector against structured patterns:

```adesh
let msg = Message::Move { x: 10, y: 20 };

match msg {
    Message::Quit => print("Exiting"),
    Message::Move { x, y } => print(f"Move to {x}, {y}"),
    Message::Write(text) => print(text),
    Message::ChangeColor(r, g, b) => print(f"Color: {r},{g},{b}"),
}
```

### 3.1 Decision Tree & Jump Table Generation
For dense variant tags without complex guards, the compiler lowers the `match` expression into an $O(1)$ native **Jump Table** (`SWITCH_TAG` bytecode instruction):

```text
               [ Read Discriminant Tag at Offset 0x00 ]
                                 |
         +-----------------------+-----------------------+
         | (Tag = 0)             | (Tag = 1)             | (Tag = 2)
         v                       v                       v
  [ Jump to Quit Block ]   [ Extract x, y Payload ]  [ Extract String Ptr ]
                           [ Jump to Move Block ]    [ Jump to Write Block ]
```

### 3.2 Desugaring `if let` and `while let`
`if let` and `while let` constructs are syntactic sugar desugared during parsing into single-arm `match` expressions with a fallback wildcard `_ => ()` arm:

```adesh
// Source Code
if let Message::Write(text) = msg {
    print(text);
}
```

Desugared AST representation:
```adesh
match msg {
    Message::Write(text) => {
        print(text);
    },
    _ => ()
}
```
