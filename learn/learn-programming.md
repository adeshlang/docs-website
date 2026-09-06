---
id: learn-programming
title: Learn AdeshLang
description: The complete beginner-to-intermediate guide to programming fundamentals and the AdeshLang language, built from the official examples repository.
sidebar_label: Learning Roadmap
slug: /
---

# Learn AdeshLang

Welcome. This page is the **language overview and roadmap** for the entire
`/learn` course. Follow it top to bottom and you will go from
**never written code before** to **building real programs** in AdeshLang —
with every concept grounded in the language's own [examples repository](https://github.com/adeshlang/adeshlang/tree/main/examples).

> **Not a beginner?** Skip straight to [Quick Start](/learn/getting-started/quick-start),
> or jump into the [Learn by Examples](/learn-by-examples) catalog and read programs directly.

---

## What is AdeshLang?

AdeshLang (**आदेश** — Sanskrit/Hindi for *command*) is a modern programming
language designed around one idea: **turn a command into code**. It combines:

- a **readable, beginner-friendly syntax** that looks close to plain English
- **declarative typing** that teaches you data modeling while you code
- **multiple execution backends** — from a fast interpreter for learning to a
  native JIT (`--njit`) for 10–230× speedups
- **compile-time memory safety** with ownership and borrowing checks
- a **batteries-included standard library**: Math, JSON, FS, HTTP, regex, time,
  crypto, and more

You do not need any prior programming experience. Each lesson below introduces
one concept, then immediately shows you real AdeshLang code that uses it.

---

## Course map

| # | Lesson | You will learn | Real example it is built from |
|---|--------|----------------|-------------------------------|
| 0 | [Quick Start](/learn/getting-started/quick-start) | Install, run your first program | `examples/01_Basics/main.adesh` |
| 1 | [Hello World](/learn/hello-world) | Program structure, `print`, strings | `examples/01_Basics/main.adesh` |
| 2 | [Variables](/learn/variables) | `let`, mutation, `typeof`, arrays & objects | `examples/01_Basics/variable.adesh` |
| 3 | [Conditionals](/learn/conditionals) | `if`/`elif`/`else`, comparisons, ternary | `examples/conditionals/elif.adesh` |
| 4 | [Loops](/learn/loops) | `for` ranges, `while`, `break`/`continue` | `examples/01_Basics/loops.adesh`, `examples/loops/*` |
| 5 | [Functions](/learn/functions) | `fn`, params, returns, recursion, closures | `examples/functions/01_basic_functions.adesh` |
| 6 | [Collections](/learn/collections) | Arrays, objects, `map`/`filter`/`reduce` | `examples/arrays/comprehensive_array_demo.adesh`, `examples/basics/collections_demo.adesh` |
| 7 | [Calculator Project](/learn/calculator) | Build a complete app: ops, menus, history | `examples/functions/01_basic_functions.adesh` |
| 8 | [Strings & Text](/learn/strings) | Interpolation, templates, string methods | `examples/01_Basics/string.adesh`, `examples/syntax/test_template_literals.adesh` |
| 9 | [Types & Type System](/learn/types) | Annotations, numeric types, casting, tuples | `examples/arrays/comprehensive_array_demo.adesh`, `examples/arrays/tuple_examples.adesh`, `examples/operators/strict_equality.adesh` |
| 10 | [Structs, Enums & Matching](/learn/structs-enums) | `struct`, `enum`, `match`, `Option`/`Result` | `examples/structures/ecommerce_example.adesh`, `examples/enum/payload_enum.adesh`, `examples/advanced_types/*` |
| 11 | [Object-Oriented Programming](/learn/oop) | `class`, inheritance, `extend on`, interfaces | `examples/oop/class.adesh`, `examples/extend/01_basic_extend.adesh`, `examples/interfaces/01_basic_interfaces.adesh` |
| 12 | [Error Handling](/learn/error-handling) | `throw`/`try`/`catch`, `defer`, validation | `examples/errors/error.adesh`, `examples/defer/resource_cleanup.adesh`, `examples/real_world/01_task_manager.adesh` |
| 13 | [Memory Safety & Ownership](/learn/memory-safety) | Own, borrow, `&` refs, `Arc`, smart pointers | `examples/memory/borrow_ok.adesh`, `examples/memory/borrow_fail.adesh`, `examples/pointers/tree_structure.adesh` |
| 14 | [Async, Concurrency & Parallelism](/learn/async-concurrency) | Threads, channels, mutex, async/await | `examples/Libraries/concurrency/*`, `examples/async/full_async_demo.adesh` |
| 15 | [The Standard Library Tour](/learn/stdlib-tour) | Math, JSON, FS, regex, time, random, crypto | `examples/Libraries/*` (394 files) |
| 16 | [Capstone: Task Manager](/learn/capstone) | Build a real CLI app end-to-end | `examples/real_world/01_task_manager.adesh` |

> The **6-lesson core** (lessons 1–6) is the same progression used by most
> programming courses: output → data → decisions → repetition → functions →
> collections. Lesson 7 consolidates all of it in a complete calculator
> project. Lessons 8–16 then take you through AdeshLang's own way of doing
> things — types, data modeling, OOP, errors, memory, concurrency, and the
> standard library — before the capstone project ties it all together.

---

## How this course teaches

Every lesson follows the same loop, and it is the loop used to build
AdeshLang itself:

```text
1. Read a concept      → short, plain-English explanation
2. See a real example  → code drawn from the official examples repository
3. Run it              → adesh run <file>.adesh
4. Change one thing    → tweak a value, a condition, a loop bound
5. Observe the effect  → watch what changed
6. Repeat
```

No memorization required. AdeshLang's documentation philosophy is the same as
the language's: **explicit over hidden**, every concept with a runnable proof.

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

## Why AdeshLang is a good language to learn programming with

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
- an **e-commerce order model** (lesson 9)
- a **string/regex data cleaner** (lessons 7 + 14)
- a **TLS-layered, JSON API server** (lessons 13 + 14, from `examples/Libraries/http/server.adesh`)
- **concurrent worker programs** with threads, channels, and parallel map (lesson 13)

And you will know enough programming fundamentals to read any AdeshLang
program in the repository, and to learn any other language afterward.

---

## When you finish the course

- **[Learn by Examples](/learn-by-examples)** — 100+ fully documented programs with terminal output.
- **[Docs](/docs)** — the complete reference: [Language Guide](/docs/language-guide/basics), [Standard Library](/docs/builtin/overview), [Execution Backends](/docs/backends/overview).
- **[FAQ](/docs/faq)** — answers to common questions.

Start simple, stay curious, and keep building. **आदेश — Give the command. The
machine obeys.** 🚀
