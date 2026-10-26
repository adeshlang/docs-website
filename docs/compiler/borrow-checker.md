---
id: borrow-checker
title: Memory Safety Analysis - Ownership & the Borrow Checker
sidebar_label: Memory Safety Analysis
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Memory Safety Analysis — Ownership & the Borrow Checker

<FeatureStatus status="STABLE" details="Ownership tracking, borrow inference, CFG lifetime validation, drop insertion" />

Adesh's most distinctive safety feature is enforced **at compile time**:
every value has an owner, every borrow is tracked, and illegal moves or
aliases are rejected **before** any code runs. This page is the
behind-the-scenes companion to the [Memory Safety guide](/docs/advanced/memory-safety):
it explains how the compiler proves your program safe.

## The safety pipeline

The safety machinery lives across several passes under
[`src/parsing/`](file:///d:/Projects/AdeshLang/src/parsing) and
[`src/parsing/cfg_borrow/`](file:///d:/Projects/AdeshLang/src/parsing/cfg_borrow):

```text
HIR ──► Ownership Tracking ──► Borrow Inference ──► CFG/MIR Build
        │                                                │
        │         drop insertion ◄── lifetime/panic analysis
        ▼                                                ▼
   [errors rejected]                           [safe annotated MIR to LIR]
```

## 1. Ownership tracking
([`ownership.rs`](file:///d:/Projects/AdeshLang/src/parsing/ownership.rs),
[`ownership_enhanced.rs`](file:///d:/Projects/AdeshLang/src/parsing/ownership_enhanced.rs))

The analyzer tracks **which variable owns which value** at every program
point. When a value is moved (passed by value into a function, assigned to a
new binding, returned), the old owner becomes invalid:

```adesh
let a = Container { id: 1 };
let b = a;          // move! 'a' is now invalid
// print(a.id);     // ❌ rejected at compile time
```

## 2. Borrow inference
([`borrow_inference.rs`](file:///d:/Projects/AdeshLang/src/parsing/borrow_inference.rs))

Unlike languages that require explicit `&mut` annotations everywhere,
Adesh **auto-infers borrows**: the compiler observes how a reference is
used and classifies it:

- **Read-only borrow** — the reference is only read → many concurrent
  read-borrows allowed
- **Exclusive (mutable) borrow** — the reference is written through, or the
  borrow must be exclusive → at most one active

```adesh
let p2 = alloc<i32>();
let mr = &p2;       // compiler sees a mutation below → exclusive borrow
*mr = 100;          // allowed: exclusive access
```

## 3. CFG & lifetime validation
([`src/parsing/cfg_borrow/`](file:///d:/Projects/AdeshLang/src/parsing/cfg_borrow))

The heart of the checker builds a **Control-Flow Graph (CFG)** and annotates
it with ownership state:

- `cfg.rs` — builds the CFG from the program
- `dataflow.rs` — dataflow analysis over the CFG, tracking liveness and
  ownership state at each edge and block
- `places.rs` — models *places* (memory locations), including nested
  projection paths like `this.tasks[i].id`
- `panic_paths.rs` — accounts for control flow that can exit early via
  panics/exceptions, so ownership state stays sound on all paths
- `merge.rs` — merges ownership states across branch joins (if/else,
  match arms, loops)

The outcome: at every point where a variable is used, the checker knows its
ownership state along **every** reaching path — and rejects uses of moved
values or conflicting borrows.

## 4. Borrow checking proper
([`borrow_check.rs`](file:///d:/Projects/AdeshLang/src/parsing/borrow_check.rs))

The two rust-like rules enforced:

1. **Many read-only borrows** may coexist with the owner.
2. **At most one exclusive borrow**, and no reads while an exclusive borrow is
   active.

```adesh
let r = &p;
let mr = &p;   // ❌ error: 'r' is still alive while 'mr' mutates
*mr = 42;
```

## 5. Drop insertion
([`drop_insertion.rs`](file:///d:/Projects/AdeshLang/src/parsing/drop_insertion.rs))

Where does memory get freed at scope exit? The compiler **inserts drops
automatically** at the correct program points — at end of scope, on early
return, and on panic paths — giving RAII-style cleanup like `defer` for every
owned value, without you writing `free` calls.

## 6. Supporting analyses

The safety story is rounded out by companion passes:

- **Escape analysis** ([`escape_analysis.rs`](file:///d:/Projects/AdeshLang/src/parsing/escape_analysis.rs)) —
  determines whether a value can outlive its scope (determines heap vs stack)
- **Closure capture tracking** ([`closure_capture.rs`](file:///d:/Projects/AdeshLang/src/parsing/closure_capture.rs)) —
  what a closure captures, and whether captures conflict with moves
- **Unsafe pointer tracking** ([`unsafe_pointer_tracking.rs`](file:///d:/Projects/AdeshLang/src/parsing/unsafe_pointer_tracking.rs)) —
  `unsafe { }` blocks are tracked so raw `alloc`/`free` can be audited
- **Unified safety pass** ([`unified_safety_pass.rs`](file:///d:/Projects/AdeshLang/src/parsing/unified_safety_pass.rs)) —
  orchestrates the above into a single coherent pass
- **Lifetime & interprocedural analysis** ([`lifetime_tracking.rs`](file:///d:/Projects/AdeshLang/src/parsing/lifetime_tracking.rs), [`interprocedural.rs`](file:///d:/Projects/AdeshLang/src/parsing/interprocedural.rs)) —
  function-level and cross-function lifetime reasoning

## What the checker rejects (the docs that fail to compile)

The canonical examples live in
[`examples/memory/borrow_fail.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/memory/borrow_fail.adesh) —
every commented `// ❌` there is a case the analyzer refuses to compile. Try
running it: the compiler stops at compile time, before any code executes.

## The trade-off, made visible

| Approach | Safety cost |
|---|---|
| No checking | runtime crashes, use-after-free, data races |
| GC at runtime | pause spikes, memory overhead |
| **Compile-time analysis (Adesh)** | **zero runtime cost**, analysis happens before codegen |

## Where this fits

- Previous stage: [Semantic Analysis & HIR](/docs/compiler/semantic-analysis)
- The annotated MIR produced here feeds [the IR pipeline](/docs/compiler/ir)
- Language-facing view: [Memory Safety](/docs/advanced/memory-safety),
  [Ownership & Borrowing](/docs/advanced/ownership-borrowing)
