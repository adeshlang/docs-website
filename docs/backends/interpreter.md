---
id: interpreter
title: AST Tree-Walking Interpreter
sidebar_label: Interpreter & REPL
description: Direct AST tree-walking interpreter, interactive REPL environment, and rapid prototyping in AdeshLang.
---

# AST Tree-Walking Interpreter & REPL

The **AdeshLang AST Tree-Walking Interpreter** evaluates the abstract syntax tree directly in memory without emitting intermediate bytecode or native machine code. It offers instantaneous execution startup, transparent stack introspection, and powers the interactive AdeshLang REPL.

```
┌──────────────────────────────────────────────────────────┐
│                   Interpreter Pipeline                   │
├──────────────────────────────────────────────────────────┤
│  Source Code ──► Lexer & Parser ──► AST Representation   │
│                                              │           │
│                                              ▼           │
│                                      Tree-Walk Evaluator │
│                                      [Scope Environment] │
└──────────────────────────────────────────────────────────┘
```

---

## 1. How the Tree-Walking Interpreter Works

1. **Lexical Analysis**: Source text is converted into a stream of typed tokens.
2. **Parsing**: Tokens are organized into an Abstract Syntax Tree (AST) node hierarchy representing statements, expressions, and declarations.
3. **Environment Frames**: Variable bindings and closures are stored in scoped symbol tables (`Environment`), chaining child scopes to parent scopes.
4. **Recursive Evaluation**: The evaluator traverses AST nodes, evaluating sub-expressions and returning boxed `Value` objects.

---

## 2. Interactive REPL (Read-Eval-Print Loop)

Launch the interactive REPL shell by running `adesh repl` or simply `adesh`:

```bash
$ adesh repl
Welcome to AdeshLang REPL v0.2.0
Type :help for special commands, or press Ctrl+D / exit to quit.

adesh> let x = 42;
42
adesh> let double = fn(n: i64): i64 { return n * 2; };
<function: double>
adesh> double(x);
84
adesh> let numbers = [1, 2, 3, 4, 5];
[1, 2, 3, 4, 5]
adesh> numbers.map(fn(x) => x * 10);
[10, 20, 30, 40, 50]
```

### REPL Commands

| Command | Description |
|---------|-------------|
| `:help` | Displays help message and available REPL commands. |
| `:type <expr>` | Inspects the inferred compile-time type of an expression. |
| `:ast <expr>` | Dumps the parsed Abstract Syntax Tree for an expression. |
| `:env` | Lists all active variables and functions in the current REPL session. |
| `:clear` | Clears current session environment bindings. |
| `:load <file>` | Loads and executes an external `.adesh` script into the session. |
| `:quit` / `:exit` | Exits the REPL session. |

---

## 3. Running Scripts with the Interpreter

To execute a script directly via the interpreter:

```bash
# Execute using AST interpreter backend
adesh run --backend=interpreter script.adesh

# Or pass the -i flag
adesh -i script.adesh
```

---

## 4. Key Strengths & Trade-offs

| Feature | Interpreter | JIT / AOT |
|---------|-------------|-----------|
| **Cold Start Time** | **< 1ms (Instant)** | 5ms - 50ms |
| **Memory Overhead** | Minimal | Medium (CodeGen) |
| **Debug Introspection**| Complete AST inspection | Stripped symbols |
| **Execution Throughput**| Baseline | $30\times - 150\times$ faster |
| **Use Case** | Scripts, CLI tools, REPL | Heavy compute, servers |
