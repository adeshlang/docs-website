---
id: memory-management
title: Memory Management - Allocators, Arenas, and Reference Counting
sidebar_label: Memory Management
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Memory Management — Allocators, Arenas, and Reference Counting

<FeatureStatus status="STABLE" details="Static/dynamic/hybrid heap modes, slab & arena allocation, ARC shared ownership, cycle detection" />

While the [borrow checker](/docs/compiler/borrow-checker) guarantees
*ownership correctness* at compile time, the runtime also has a real memory
manager that decides *where* values live and *when* they are freed. This page
covers the allocator and the reference-counting machinery.

## The memory module

**Source:** [`src/memory`](file:///d:/Projects/AdeshLang/src/memory)

```
src/memory/
├── mod.rs                module overview
├── dynamic_allocator.rs  static / dynamic / hybrid heap modes
├── allocators/           slab & arena allocators
├── adaptive/             adaptive memory management
├── arc/                  reference-counted shared ownership
├── concurrency/          shared<T>, atomic<T>, mutex<T>, rwlock<T>
├── raii/                 scope-based cleanup
├── policies/             growth & memory policies
└── cycle/                cycle detection
```

## Allocation modes

The dynamic allocator
([`dynamic_allocator.rs`](file:///d:/Projects/AdeshLang/src/memory/dynamic_allocator.rs))
supports three configurable heap strategies:

| Mode | Behavior | Use when |
|---|---|---|
| `Static` | fixed-size heap, OOM on overflow | embedded / deterministic footprints |
| `Dynamic` (default) | auto-expanding heap with configurable growth | general runtime |
| `Hybrid` | arena pools for short-lived, heap fallback for long-lived | mixed workloads |

```rust
pub enum AllocMode {
    Static,    // fixed-size heap; OOM if exceeded
    Dynamic,   // dynamically expanding heap
    Hybrid,    // arenas for short-lived, heap for long-lived
}
```

### Growth strategy

The dynamic mode uses **doubling** (or a slab-based strategy) so allocation
stays **O(1) amortized** — reallocation is rare and cheap. Arenas reduce
fragmentation for short-lived objects.

### Safety requirements (from the module docs)

- never overwrites unrelated memory
- all allocations check for **size overflow** before allocating
- OOM returns a safe error through the unified error model
- debug mode **poisons freed regions** so use-after-free is caught fast

## Slab & arena allocators

Small objects of the same size can be served from **slabs**; short-lived
batches of objects (e.g., the objects created during one function call) can
live in an **arena** and be freed all at once when the arena goes out of
scope. This is why `AllocMode::Hybrid` exists: arena for short-lived, heap
for long-lived.

## Arc: reference-counted sharing

Large runtime values (`Str`, `Object`, `Array`, `UserFunction`, `Arc<BigInt>`)
are shared through **ARC — Atomic Reference Counting**
([`src/memory/arc`](file:///d:/Projects/AdeshLang/src/memory/arc)):

```text
           ┌────────────┐
 a ───────►│  value     │
           │  refs: 2   │◄── b  (shared, no copy)
           └────────────┘
            when last ref drops → memory freed
```

The language exposes this directly with the `Arc` type (
[learn it here](/learn/memory-safety)):

```adesh
import { adesh_alloc::Arc } from "adesh_alloc";

let shared = Arc::new(42);
let a = shared.clone();
let b = shared.clone();
print(*a);          // 42 — all three share one value
```

## Weak references & cycle detection

`Weak` pointers don't keep a value alive (`examples/pointers/tree_structure.adesh`
uses them for parent back-references), and the **cycle module**
([`src/memory/cycle`](file:///d:/Projects/AdeshLang/src/memory/cycle)) guards
against reference cycles that would otherwise leak forever.

## Concurrency-safe primitives

The runtime ships concurrency containers alongside Arc:
`shared<T>`, `atomic<T>`, `mutex<T>`, `rwlock<T>` — the building blocks of
channels, worker pools, and shared state in the
[`Libraries/concurrency` examples](https://github.com/adeshlang/adeshlang/blob/main/examples/Libraries/concurrency).

## What this means for you

- **Most of the time**: write normal code; ownership + RAII + Arc handle it.
- **`alloc`/`free` (unsafe)**: manual control when you need byte-level memory
  (see [Manual Memory](/learn/manual-memory)).
- **GC pauses don't exist** — cleanup is deterministic (scope exit, last
  reference drop), not a stop-the-world collector.

## Where this fits

- Language-facing: [Memory Safety](/docs/advanced/memory-safety),
  [Manual Memory](/learn/manual-memory)
- Values at runtime: [Runtime & Value Model](/docs/compiler/runtime)
- Compiler safety: [Borrow Checker](/docs/compiler/borrow-checker)
