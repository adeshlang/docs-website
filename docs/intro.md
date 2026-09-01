---
id: intro
title: Welcome to AdeshLang
description: A complete guide to AdeshLang, a Rust-inspired, multi-backend programming language built for clarity, safety, and performance.
sidebar_label: Introduction
slug: /intro
---

# Welcome to AdeshLang

<div align="center">
  <img src="/img/logo.svg" alt="AdeshLang logo" width="180" />
</div>

**Command. Code. Create.**

**आदेश (Adesh)** — Sanskrit/Hindi for command, instruction, direction, and guidance.

AdeshLang is a modern systems-and-applications language designed around one simple idea: turn command into code and create meaningful software with clarity, power, and purpose. It blends readability, static safety, and high-performance backends into a single language model.

> AdeshLang is not just another scripting language. It is a language for developers who want expressive syntax, predictable performance, and backend flexibility without sacrificing correctness.

:::warning Experimental Language Notice
**AdeshLang is currently an Experimental Programming Language.** Features, APIs, and syntax are evolving as we refine language ergonomics and compiler architectures.
:::

:::note Primary Execution Backend & Source of Truth
The **Tree-Walk Interpreter** is currently the **main reference implementation** and reflection of AdeshLang. It represents the authoritative source of truth for language behavior, semantics, and standard library execution.

Other execution backends — including **Cranelift Native JIT**, **AOT Native Compilation**, **Bytecode VM**, **WASM**, and **GPU MLIR** — are under **active development** (`EXPERIMENTAL` / `PARTIAL` status).
:::

:::tip Built with Rust & Community Shoutout
🦀 **Built with Rust**: The AdeshLang compiler toolchain, lexer, parser, AST representation, and runtime systems are crafted in **Rust**.

A huge **shoutout and heartfelt thank-you** to the **Rust Core Team**, the **Rust Foundation**, and the entire **Rust Community**! Rust's zero-cost abstractions, fearless concurrency, memory safety, and incredible ecosystem (including crates like `cranelift`, `rustyline`, and `clap`) made building a modern language compiler possible.
:::

## Purpose of the language

AdeshLang was created to make programming more intentional and approachable. Its purpose is to help developers command machines with clean logic, write robust code with safety in mind, and create tools, apps, and systems that scale from simple scripts to serious software projects.

It brings together the discipline of systems programming with the creativity of modern application development.

## About the creator

AdeshLang was created by **Ajay Tainwala**, a developer driven by the idea that programming should be both powerful and human-friendly. The language reflects a vision of building software that is expressive, reliable, and deeply useful in real-world development.

## Made in Bharat, India

AdeshLang is proudly rooted in **Bharat (India)** — inspired by the spirit of innovation, resilience, and craftsmanship that comes from one of the world’s oldest and most vibrant knowledge traditions. It represents a modern technology vision built with Indian creativity and global ambition.

---

## Why AdeshLang exists

Most languages optimize for one dimension: either ease of learning, runtime speed, or safety. AdeshLang tries to balance all three.

- It is designed to feel clean and approachable for beginners.
- It gives you strong typing and compile-time checks for large programs.
- It supports several execution models so a single program can run with different performance tradeoffs.
- It aims to be practical across scripting, CLI tools, server code, math-heavy workloads, and compiled binaries.

This makes it useful both as a teaching language and as a serious implementation target for real-world software.

---

## The philosophy behind the language

### 1. Clear instructions
The language name itself reflects the core idea: a program is a set of precise instructions. AdeshLang prefers explicit code over hidden behavior.

### 2. Safety by default
Memory safety, ownership awareness, and clear type rules are central. The compiler and runtime work together to catch mistakes early.

### 3. Performance with flexibility
A program should not be locked into one execution strategy. AdeshLang can run through an interpreter, bytecode VM, JIT, native compilation, WASM, or a GPU-oriented pipeline depending on need.

### 4. Progressive learning curve
A beginner should be able to write a simple script quickly, while an advanced developer should still be able to work on performance-critical systems and compiler-related features.

---

## Core language goals

### Learnability
The syntax is intentionally readable and close to natural expression. Basic code should be understandable even to someone new to programming.

### Reliability
Static types, explicit rules, and compile-time checks reduce common runtime errors.

### Expressiveness
AdeshLang supports functions, control flow, collections, objects, generics, async patterns, and more advanced features like pattern matching and decorators.

### Portability
One source language can be deployed with different backends for local execution, web deployment, or optimized native delivery.

---

## High-level architecture

AdeshLang separates the source language from the execution model.

```mermaid
flowchart LR
    A[Adesh Source Code] --> B[Frontend / Parser]
    B --> C[Semantic Analysis]
    C --> D[IR / Runtime Model]
    D --> E[Interpreter]
    D --> F[Bytecode VM]
    D --> G[JIT Backend]
    D --> H[Native AOT Backend]
    D --> I[WASM Target]
    D --> J[GPU / MLIR Backend]
```

This makes the language more modular: the same program can be interpreted quickly for development, compiled for production, or adapted to specialized hardware.

---

## Execution backends at a glance

| Backend | Best for | Characteristics |
|---|---|---|
| Interpreter | Learning, prototyping, debugging | Fast startup, flexible behavior |
| Bytecode VM | Development and tooling | Better performance than pure interpretation |
| JIT | Long-running compute | Runtime optimization and speedups |
| Native JIT | High-performance numeric work | Strong compile/runtime optimization |
| AOT | Production binaries | Optimized standalone executables |
| WASM | Browser and edge deployment | Portable sandboxed execution |
| GPU / MLIR | Parallel tasks and acceleration | Specialized hardware targeting |

This backend model is one of AdeshLang’s defining strengths.

---

## A first example

```adesh
fn greet(name: string) {
    print("Hello, ", name, "!");
}

fn main() {
    let user = "World";
    greet(user);

    for i in 1..5 {
        print("Count: ", i);
    }
}
```

This example shows the language’s core character:

- a simple function declaration
- a typed parameter
- local variables with `let`
- direct iteration with a range
- clear console output

---

## The mental model

A new AdeshLang program usually follows this pattern:

1. Declare data with variables or constants.
2. Define functions to structure logic.
3. Control execution with conditionals and loops.
4. Use collections and objects to model real data.
5. Compile or run the program through the desired backend.

This approach is familiar to developers from many languages, but AdeshLang adds a strong emphasis on explicitness and performance-aware design.

---

## Documentation map

Use this site as a structured guide:

- [Quick Start](/getting-started/quick-start) — install and run your first program
- [Learn Programming](/learn/learn-programming) — beginner-first lessons
- [Language Guide](/language-guide/basics) — deeper language reference
- [Advanced Features](/advanced/memory-safety) — safety, ownership, async, OOP, and more
- [Backends](/backends/overview) — interpreter, VM, JIT, AOT, GPU, WASM
- [Standard Library](/stdlib/overview) — builtins and runtime modules
- [Examples](/examples) — runnable demonstrations and use cases

---

## Why developers choose it

AdeshLang is for people who want a language that is:

- approachable enough for teaching and prototyping
- precise enough for serious software engineering
- fast enough for compute-heavy workloads
- flexible enough to run on multiple targets

It is not built around one narrow niche. Instead, it aims to be a general-purpose language that can evolve from first program to production system.

---

## Getting started

The next step is straightforward: install the toolchain, write a basic script, and run it. Once you have that working, the rest of the language opens naturally.

Go to [Quick Start](/getting-started/quick-start) to begin.

---

## Status and direction

The project is designed as a language ecosystem rather than a single runtime. That means its documentation and implementation are intended to grow together: syntax, tooling, execution backends, standard library, and language semantics all support one another.

AdeshLang is best understood as a long-term platform for learning, experimentation, and performance-oriented development.

---

## Community and resources

- GitHub repository: [github.com/adeshlang/adeshlang](https://github.com/adeshlang/adeshlang)
- Issue tracker: [GitHub Issues](https://github.com/adeshlang/adeshlang/issues)
- Standard library docs: [Builtins and modules](/stdlib/overview)
- Performance and optimizer guides: [Performance](/performance/optimization)

Welcome to the language. The best way to understand it is to build with it.


| If you want to... | Go to... |
|-------------------|----------|
| **Learn programming from zero** | [Learn Programming](/learn/learn-programming) |
| **Get running in 5 minutes** | [Quick Start](/getting-started/quick-start) |
| **Understand the language deeply** | [Language Basics](/language-guide/basics) |
| **Explore execution backends** | [Backends Overview](/backends/overview) |
| **See real code examples** | [Examples Catalog](/examples) |
| **Contribute to AdeshLang** | [Contributing Guide](/contributing) |

---

*"Adesh" — Give the command. The machine obeys. The possibilities are infinite.* 🚀