---
id: lexer-parser
title: Lexer & Parser - From Source Text to Syntax Tree
sidebar_label: Lexer & Parser
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Lexer & Parser — From Source Text to Syntax Tree

<FeatureStatus status="STABLE" details="Tokenization with rich operators, recursive-descent parser, lossless AST" />

This page explains what happens to your `.adesh` file **before it runs** — the
first two stages of the [compiler pipeline](/docs/compiler/overview): the
**lexer** and the **parser**.

## Stage 1 — The Lexer (tokenization)

The lexer ([`src/parsing/lexer.rs`](file:///d:/Projects/AdeshLang/src/parsing/lexer.rs))
reads the raw source text byte-by-byte and groups characters into meaningful
**tokens** — the smallest units of syntax.

```text
Source text:  let greeting = "Hello, World!";
                ↓ tokenize
Tokens:      let | greeting | = | "Hello, World!" | ;
```

Each `Token` carries more than its kind — it records the exact `line`,
1-based `column`, and the full source line text, so later compiler stages can
produce precise, clickable diagnostics:

```rust
pub struct Token {
    pub kind: TokenKind,
    pub lexeme: String,
    pub line: usize,          // 1-based line number
    pub col: usize,           // 1-based column number
    pub line_text: String,    // full line, for diagnostics
}
```

### What the lexer understands

- **Identifiers & keywords** (`let`, `fn`, `class`, `match`, …) mapped to
  `TokenKind` variants
- **Literals**: integers, floats, BigInt (with `n` suffix), strings, and
  template literals
- **Rich operators**: `??` (nullish), `?.` (optional chaining), `**` (power),
  `~/` (truncated division), `...` (spread/range), `=>` (arrow), and more
- **Doc-comments** and regular comments
- **UTF-8 BOM handling** (skips a leading byte-order mark if present)

### Why tokens carry position info

The error model
([`src/parsing/error.rs`](file:///d:/Projects/AdeshLang/src/parsing/error.rs))
uses token positions to render errors like:

```text
  --> src/main.adesh:3:8
   |
 3 | let x = "unterminated
   |        ^ unexpected end of file
```

## Stage 2 — The Parser (building the AST)

The parser ([`src/parsing/parser.rs`](file:///d:/Projects/AdeshLang/src/parsing/parser.rs))
is a **recursive-descent parser** that consumes the token stream and builds an
**Abstract Syntax Tree (AST)** — a tree of statements and expressions that
captures the program's structure, ignoring irrelevant whitespace and comments.

```text
Tokens:  print("hi")   →   AST
                              ┌──────────────┐
                              │ CallExpr     │
                              │  name: print │
                              └──────┬───────┘
                                     │ args
                              ┌──────▼───────┐
                              │ StrLiteral   │
                              │  "hi"        │
                              └──────────────┘
```

### AST design goals

From [`src/parsing/ast.rs`](file:///d:/Projects/AdeshLang/src/parsing/ast.rs):

- **Lossless representation** — the AST retains enough source information for
  high diagnostic clarity
- **Typed node kinds** — distinct node types for `FnStmt`, `ClassStmt`,
  `StructStmt`, `EnumStmt`, `MatchExpr`, decorators, generics, and template
  literals
- **Both `this` and `self`** supported as receiver keywords, normalized during
  later lowering
- **Parser subsystems**: expression parsing, statement parsing, type
  annotations, generic parameter lists, decorators, and module imports

### Error recovery

The parser implements grammar validation and **error recovery**: when it hits a
syntax error it can skip to a safe boundary (usually the next statement) and
continue, so a single editor run reports multiple errors instead of stopping
at the first one.

## What the Parser produces for you at runtime

You can inspect the parse yourself with the REPL's `:ast` command:

```text
adesh> :ast let x = 42;
[Stmt: LetStmt { name: "x", init: Number(42) }]
```

## Behind the scenes: AST optimizations

Before semantic analysis, an **AST optimizer**
([`src/parsing/ast_optimizer.rs`](file:///d:/Projects/AdeshLang/src/parsing/ast_optimizer.rs))
can simplify the tree — folding constant expressions and normalizing nodes —
so downstream stages see a cleaner input.

## The output: a well-formed AST

The lexer + parser turn source text into a typed, position-aware AST that the
rest of the compiler consumes:

```text
Source .adesh → Lexer → Token stream → Parser → Typed AST
                                                │
                          ┌─────────────────────┘
                          ▼
              [Next: HIR & Semantic Analysis]
```

## Next Steps

- See how the AST becomes **HIR and how types are checked**: [Semantic Analysis & HIR](/docs/compiler/semantic-analysis)
- Understand the **IR pipeline** (HIR → MIR → VIR): [Intermediate Representations](/docs/compiler/ir)
- Start the pipeline overview: [Compiler Architecture Overview](/docs/compiler/overview)
