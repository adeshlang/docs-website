---
id: learn-programming
title: Learn Adesh
description: The complete beginner-to-intermediate guide to programming fundamentals and the Adesh language, built from the official examples repository.
sidebar_label: Learning Roadmap
slug: /
---

# Learn Adesh

Welcome. This page is the **language overview and roadmap** for the entire
`/learn` course. Follow it top to bottom and you will go from
**never written code before** to **building real programs** in Adesh —
with every concept grounded in the language's own [examples repository](https://github.com/adeshlang/adeshlang/tree/main/examples).

> **Not a beginner?** Skip straight to [Quick Start](/learn/getting-started/quick-start),
> or jump into the [Learn by Examples](/learn-by-examples) catalog and read programs directly.

---

## What is Adesh?

Adesh (meaning *command*) is a modern programming language designed around one
idea: **turn a command into code**. It combines:

- a **readable, beginner-friendly syntax** that looks close to plain English
- **declarative typing** that teaches you data modeling while you code
- **multiple execution targets** — from a fast interpreter for learning to a
  native JIT (`--njit`) for native machine-code execution
- **compile-time memory safety** with ownership and borrowing checks
- a **batteries-included standard library**: Math, JSON, FS, HTTP, regex, time,
  crypto, and more

You do not need any prior programming experience. Each lesson below introduces
one concept, then immediately shows you real Adesh code that uses it.

---

## Course map

| # | Lesson | You will learn | Real example it is built from |
|---|--------|----------------|-------------------------------|
| 0 | [Quick Start](/learn/getting-started/quick-start) | Install, run your first program | `examples/01_Basics/main.adesh` |
| 1 | [Hello World](/learn/hello-world) | Program structure, `print`, strings | `examples/01_Basics/main.adesh` |
| 2 | [Variables](/learn/variables) | `let`, mutation, `typeof`, arrays & objects | `examples/01_Basics/variable.adesh` |
| 3 | [Operators & Expressions](/learn/operators) | Arithmetic, `==`/`===`, `??`, `?.`, spread | `examples/syntax/operators.adesh`, `examples/operators/strict_equality.adesh` |
| 4 | [Conditionals](/learn/conditionals) | `if`/`elif`/`else`, comparisons, ternary | `examples/conditionals/elif.adesh` |
| 5 | [Loops](/learn/loops) | `for` ranges, `while`, `break`/`continue` | `examples/01_Basics/loops.adesh`, `examples/loops/*` |
| 6 | [Functions](/learn/functions) | `fn`, params, returns, recursion, closures | `examples/functions/01_basic_functions.adesh` |
| 7 | [Higher-Order Functions](/learn/higher-order-functions) | Callbacks, factories, composition, currying | `examples/functions/02_higher_order.adesh` |
| 8 | [Recursion & Multiple Returns](/learn/recursion) | Self-calls, tail calls, tuple returns, fib/floyd | `examples/recursion/*`, `examples/fib/*`, `examples/real_world/02_test_multiple_returns.adesh` |
| 9 | [Collections](/learn/collections) | Arrays, objects, `map`/`filter`/`reduce` | `examples/arrays/comprehensive_array_demo.adesh`, `examples/basics/collections_demo.adesh` |
| 10 | [Calculator Project](/learn/calculator) | Build a complete app: ops, menus, history | `examples/functions/01_basic_functions.adesh` |
| 11 | [Strings & Text](/learn/strings) | Interpolation, templates, string methods | `examples/01_Basics/string.adesh`, `examples/syntax/test_template_literals.adesh` |
| 12 | [Types & Type System](/learn/types) | Annotations, numeric types, casting, tuples | `examples/arrays/comprehensive_array_demo.adesh`, `examples/arrays/tuple_examples.adesh`, `examples/operators/strict_equality.adesh` |
| 13 | [Structs, Enums & Matching](/learn/structs-enums) | `struct`, `enum`, `match`, `Option`/`Result` | `examples/structures/ecommerce_example.adesh`, `examples/enum/payload_enum.adesh`, `examples/advanced_types/*` |
| 14 | [Object-Oriented Programming](/learn/oop) | `class`, inheritance, `extend on`, interfaces | `examples/oop/class.adesh`, `examples/extend/01_basic_extend.adesh`, `examples/interfaces/01_basic_interfaces.adesh` |
| 15 | [Error Handling](/learn/error-handling) | `throw`/`try`/`catch`, `defer`, validation | `examples/errors/error.adesh`, `examples/defer/resource_cleanup.adesh`, `examples/real_world/01_task_manager.adesh` |
| 16 | [Memory Safety & Ownership](/learn/memory-safety) | Own, borrow, `&` refs, `Arc`, smart pointers | `examples/memory/borrow_ok.adesh`, `examples/memory/borrow_fail.adesh`, `examples/pointers/tree_structure.adesh` |
| 17 | [Manual Memory & unsafe](/learn/manual-memory) | `alloc`/`free`, deref, allocators | `examples/unsafe/manual_allocation.adesh`, `examples/memory_allocator/*` |
| 18 | [Generics & Data Structures](/learn/generics-data-structures) | `fn<T>`, HashMap, VecDeque, stacks, heaps | `examples/generics/*`, `examples/Libraries/collections/*` |
| 19 | [Modules & Imports](/learn/modules-imports) | `import`, named imports, multi-file apps | `examples/modules/imports.adesh` |
| 20 | [Interactive Input & Timers](/learn/input-timers) | `input()`, options, setTimeout/interval | `examples/input/*`, `examples/timers/timers_combined.adesh` |
| 21 | [Async, Concurrency & Parallelism](/learn/async-concurrency) | Threads, channels, mutex, async/await | `examples/Libraries/concurrency/*`, `examples/async/full_async_demo.adesh` |
| 22 | [Testing](/learn/testing) | `test fn`, `assert`, `assert_eq`, `--test` | `examples/testing/*` |
| 23 | [The Standard Library Tour](/learn/stdlib-tour) | Math, JSON, FS, regex, time, random, crypto | `examples/Libraries/*` (394 files) |
| 24 | [Standard Library II](/learn/stdlib-2) | Encoding, compression, IO, env, process | `examples/Libraries/encoding/*`, `compression/*`, `io/*`, `env/*`, `process/*` |
| 25 | [Networking Deep Dive](/learn/networking) | TCP, UDP, DNS, URL, TLS, WebSockets | `examples/Libraries/net/*`, `dns/*`, `url/*`, `tls/*`, `websocket/*` |
| 26 | [Performance & Execution Backends](/learn/performance) | JIT/`--njit`, `clock()`, benchmarking | `examples/fib/*`, `examples/backends/*`, `examples/jit/*` |
| 27 | [Capstone: Task Manager](/learn/capstone) | Build a real CLI app end-to-end | `examples/real_world/01_task_manager.adesh` |

> The **10-lesson core** (lessons 1–10) is the same progression used by most
> programming courses: output → data → operations → decisions → repetition →
> functions → higher-order → recursion → collections → a complete project.
> Lessons 11–26 then take you through Adesh's own way of doing things —
> types, data modeling, OOP, errors, memory, concurrency, testing, the
> standard library, networking, and performance — before the capstone ties it
> all together.

---

## How this course teaches

Every lesson follows the same loop, and it is the loop used to build
Adesh itself:

```text
1. Read a concept      → short, plain-English explanation
2. See a real example  → code drawn from the official examples repository
3. See the output      → every code sample shows its expected output below it
4. Run it              → adesh run <file>.adesh
5. Change one thing    → tweak a value, a condition, a loop bound
6. Observe the effect  → watch what changed
7. Repeat
```

No memorization required. Adesh's documentation philosophy is the same as
the language's: **explicit over hidden**, every concept with a runnable proof
and its exact output spelled out.

---

## Paths through the course

Depending on who you are, start at a different place:

| You are... | Start with |
|------------|------------|
| Complete beginner | Lesson 0 → 1 → 2 → … in order |
| You know another language | [Quick Start](/learn/getting-started/quick-start) then [Types](/learn/types) |
| You want to read code, not prose | [Learn by Examples](/learn-by-examples) |
| You want the deep reference | [Docs](/docs) — the full Language Guide |
| You want to contribute | [Contributing](/docs/contributing) |

---

## Why Adesh is a good language to learn programming with

| Feature | Why it helps you learn |
|---|---|
| readable syntax | code reads like instructions in English |
| clear semantics | few hidden rules or surprises |
| strong compiler feedback | the error messages tell you exactly what to fix |
| modern features | patterns that transfer to Rust, TypeScript, Go, C# |
| fast execution | you see results immediately, even with `--njit` |
| memory safety for free | you build safe habits from day one |
| batteries-included stdlib | you can build real tools (HTTP servers, JSON APIs, file apps) without leaving the language |

---

## What you will be able to do at the end

By finishing the course, you will have written, run, and reasoned about:

- a **task manager CLI** ([Capstone](/learn/capstone))
- an **e-commerce order model** (lesson 13)
- a **string/regex data cleaner** (lessons 11 + 23)
- a **TLS-layered, JSON API server** (lessons 21 + 23, from `examples/Libraries/http/server.adesh`)
- **concurrent worker programs** with threads, channels, and parallel map (lesson 21)

And you will know enough programming fundamentals to read any Adesh
program in the repository, and to learn any other language afterward.

---

## When you finish the course

- **[Learn by Examples](/learn-by-examples)** — 100+ fully documented programs with terminal output.
- **[Docs](/docs)** — the complete reference: [Language Guide](/docs/language-guide/basics), [Standard Library](/docs/builtin/overview), [Execution Backends](/docs/backends/overview).
- **[FAQ](/docs/faq)** — answers to common questions.

Start simple, stay curious, and keep building. **Adesh — Give the command. The
machine obeys.** 🚀
