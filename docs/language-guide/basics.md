---
id: basics
title: "Language Syntax & Execution Model"
description: "Formal specification of Adesh lexical structure, tokenization, statement grammar, evaluation order, and compilation pipeline."
sidebar_label: "Syntax & Execution Model"
---

# Language Syntax & Execution Model

This specification details the formal lexical grammar, statement termination rules, expression evaluation order, and compiler processing stages for Adesh programs.

---

## 1. Lexical Architecture

### 1.1 Source Character Encoding
Adesh source code is represented as a stream of UTF-8 encoded bytes. Non-UTF-8 byte sequences encountered during lexing trigger a fatal compile-time error (`E0001: Invalid UTF-8 sequence`).

### 1.2 Whitespace and Line Terminators
Whitespace characters (Space `U+0020`, Horizontal Tab `U+0009`, Carriage Return `U+000D`, and Line Feed `U+000A`) serve to separate tokens and are otherwise ignored by the lexer, except when enclosed in string literals.

### 1.3 Comments
The lexer recognizes two forms of comments:
- **Line Comments**: Introduced by `//` and extending to the end of the current line (`U+000A` or `U+000D`).
- **Block Comments**: Enclosed within `/*` and `*/`. Block comments support arbitrary nesting (`/* outer /* inner */ outer */`) and are resolved by a lexer stack counter.

### 1.4 Identifiers and Keywords
Identifiers must begin with an ASCII letter (`a-z`, `A-Z`) or an underscore (`_`), followed by zero or more alphanumeric ASCII characters or underscores. 

Adesh reserves **83 identifier spellings** as language keywords. When the lexer encounters an identifier matching a reserved spelling, it emits a dedicated keyword token rather than a general `Token::Identifier`. See [Keywords Reference](./keywords) for the complete table.

---

## 2. Compiler Execution Pipeline

Adesh source code undergoes four discrete compilation phases prior to target execution:

```
+------------------+     +------------------+     +------------------+     +------------------+
|  Source Code     | --> |   Lexical Analysis| --> | Abstract Syntax  | --> | Type Checking &  |
|  (.adesh file)   |     |   (Token Stream) |     | Tree (AST Graph) |     | Semantic Analysis|
+------------------+     +------------------+     +------------------+     +------------------+
                                                                                    |
                                                                                    v
                                                                           +------------------+
                                                                           | Backend Codegen  |
                                                                           | (VM / JIT IR)    |
                                                                           +------------------+
```

1. **Lexical Analysis**: Converted into a high-density, contiguous token array with source location metadata (line, column, byte offset).
2. **Abstract Syntax Tree (AST) Parsing**: Top-down operator precedence (Pratt) parsing constructs an immutable AST graph validating block structure, operator associativity, and grammar correctness.
3. **Semantic Analysis & Symbol Resolution**: Scopes are checked, symbols resolved in lexical environments, and Hindley-Milner bidirectional type inference determines type bounds and verifies borrow invariants.
4. **Target Code Generation**: Lowered into native machine code through the Cranelift JIT, AOT compilation, or the WASM target depending on execution flags (`--jit-native`, `--aot`, `--wasm`).

---

## 3. Statement Grammar & Semicolon Rules

### 3.1 Statement Termination
Adesh utilizes explicit semicolon termination for expression statements, variable bindings, imports, and control flow exits:

```adesh
let total: f64 = 100.0; // Binding statement
total += 25.5;           // Expression statement
return total;            // Control flow exit statement
```

### 3.2 Block Expressions
A block consists of a sequence of statements enclosed in curly braces `{ ... }`. Blocks introduce a new lexical scope. The final expression inside a block without a trailing semicolon evaluates as the value of the block expression:

```adesh
let adjusted_score = {
    let base = 50;
    let bonus = 15;
    base + bonus // Block expression yields 65
};
```

---

## 4. Expression Evaluation & Multi-Variable Registers

### 4.1 Evaluation Order
Expressions are evaluated strict left-to-right. In binary operations (`A op B`), operand `A` is fully evaluated before operand `B`.

### 4.2 Short-Circuit Logic
Logical AND (`&&` / `and`) and Logical OR (`||` / `or`) operations employ short-circuit evaluation:
- If LHS of `&&` evaluates to `false`, RHS is not evaluated.
- If LHS of `||` evaluates to `true`, RHS is not evaluated.

### 4.3 RHS Evaluation & Multi-Variable Swapping
For multi-variable declarations and unpacking statements (`let a, b = x, y` or `a, b = b, a`), all Right-Hand Side (RHS) expressions are evaluated first into temporary SSA compiler virtual registers before any Left-Hand Side (LHS) bindings are updated:

```adesh
let a = 10;
let b = 20;

// Evaluation sequence:
// 1. Temp_0 = b (20)
// 2. Temp_1 = a (10)
// 3. a = Temp_0 (20)
// 4. b = Temp_1 (10)
a, b = b, a;
```

This guarantees complete isolation during variable mutation and prevents aliasing side-effects or race conditions during multi-assignment operations.

---

## 5. Primitive Literals & Memory Bit Patterns

| Literal Type | Syntax Example | Memory Bit Pattern / Type Mapping |
| :--- | :--- | :--- |
| Decimal Integer | `42` | Native 64-bit signed int (`i64`) by default |
| Hexadecimal Integer | `0xFF_00_12` | Two's complement integer, `_` ignored |
| Binary Integer | `0b1010_1100` | Exact bit pattern |
| Typed Suffix | `255u8`, `-10i32` | Explicit bit-width encoding (`u8`, `i32`) |
| IEEE Floating-Point | `3.14159`, `1.2e-5` | 64-bit IEEE 754 double precision (`f64`) |
| UTF-8 String | `"Adesh\n"` | Heap string buffer pointer descriptor |
| Raw String | `raw"C:\System\Path"` | Verbatim character sequence, escape chars ignored |
| Boolean | `true`, `false` | 8-bit byte (`0x01` = true, `0x00` = false) |
| Null Sentinel | `null` | Zero pointer (`0x0000000000000000`) |
