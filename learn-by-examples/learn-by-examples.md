---
id: learn-by-examples
title: Learn by Examples Catalog
sidebar_label: Overview
slug: /
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Learn by Examples Catalog

<FeatureStatus status="STABLE" details="Comprehensive, runnable code catalog divided into dedicated topic pages" />

Welcome to the **Learn by Examples Catalog** — the fastest way to see how AdeshLang actually looks and behaves. Instead of explaining rules in the abstract, every topic is organized into its own dedicated page featuring **complete, runnable programs**, **verified terminal outputs**, and detailed **engineering breakdowns**.

---

## Concept Pages Directory

Explore complete code snippets, runtime outputs, and syntax breakdowns grouped by core language concept:

| Category | Dedicated Page | Key Concepts Covered |
|---|---|---|
| **Basics & Type System** | [**Basics, Variables & Types**](/learn-by-examples/basics) | Primitive types, annotations, `as` casting, `??` null-coalescing, `type()` |
| **Control Flow** | [**Conditionals & Control Flow**](/learn-by-examples/control-flow) | `if`/`elif`/`else`, ternary operator, 3-part for loops, `do-while`, `forEach` |
| **Functions** | [**Functions, Closures & Recursion**](/learn-by-examples/functions) | Function annotations, recursion, lexical closures, higher-order functions |
| **Collections** | [**Arrays, Tuples & Collections**](/learn-by-examples/collections) | Array indexing, `map`, `filter`, `reduce`, `HashMap`, `HashSet`, `VecDeque` |
| **Object-Oriented** | [**OOP, Structs & Extensions**](/learn-by-examples/oop) | `class`, `extends`, `super`, `struct`, and `extend on` method extension blocks |
| **Enums** | [**Enums & Pattern Matching**](/learn-by-examples/enums) | Algebraic enums with payload variants, structural `match` patterns |
| **Error Handling** | [**Error Handling & Guarding**](/learn-by-examples/error-handling) | Exception guarding with `throw`, `try`, and `catch` blocks |
| **Memory & Teardown** | [**Defer & Memory Management**](/learn-by-examples/defer-and-memory) | LIFO scope cleanup via `defer`, borrowing references (`&`), ownership |
| **Concurrency** | [**Async & Concurrency**](/learn-by-examples/concurrency) | `async fn`, `await`, multithreaded `Parallel.map` and `Parallel.forEach` |
| **Standard Library** | [**Standard Library Ecosystem**](/learn-by-examples/standard-library) | Native modules: `Math`, `Crypto` (SHA-256), `JSON` serialization, `FS` |
| **Algorithms** | [**Data Structures & Algorithms**](/learn-by-examples/dsa) | Two Sum ($O(N)$ hash lookup), LRU Cache, Graph traversal |

---

## How to Execute Examples

Run any code snippet locally using the `adesh` CLI tool:

```bash
# Execute using default interpreter
adesh run my_program.adesh

# Execute using Native Cranelift JIT (10-230x speedup)
adesh run --jit-native my_program.adesh

# Execute using Bytecode VM
adesh run --bytecode my_program.adesh

# Execute embedded unit tests
adesh run --test my_program.adesh
```

> For additional programs, check out the [Runnable Examples Catalog](/learn-by-examples/runnable-examples) which indexes 100+ verified examples from the official repository.
