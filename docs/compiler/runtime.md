---
id: runtime
title: Runtime & Value Model - How Values Live at Runtime
sidebar_label: Runtime & Value Model
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Runtime & Value Model — How Values Live at Runtime

<FeatureStatus status="STABLE" details="Compact 16-byte Value enum, string interning, shared Arc ownership, scoped environments" />

Every value in Adesh has a runtime representation. Understanding it
explains a lot about performance and behavior:

- **numbers and booleans are inline** — no heap allocation
- **strings are interned** — shared, deduplicated, cheap equality
- **complex values are shared** — via reference counting, not deep copies

## The runtime `Value`

**Source:** [`src/typesystem/value_optimized.rs`](file:///d:/Projects/AdeshLang/src/typesystem/value_optimized.rs)

The runtime value is a compact Rust enum designed to be **16 bytes** — small
enough to fit a CPU cache line and cheap to pass around:

```text
Value (16 bytes)
├── Inline variants (no heap):
│   ├── Number(f64)       8 bytes
│   ├── Bool(bool)        1  byte
│   ├── Char(char)        4  bytes
│   └── Null              0  bytes
├── Boxed / shared variants (8-byte pointer):
│   ├── BigInt(Arc<BigInt>)
│   ├── Str(Arc<str>)              ← interned
│   ├── Array(Box<Vec<Value>>)
│   ├── Tuple(Box<Vec<Value>>)
│   ├── Object(Arc<StringMap<Value>>)
│   ├── Set(Box<Vec<Value>>)
│   └── Complex(f64, f64)
└── Function variants:
    ├── Function(NativeFn)              native Rust fn
    ├── UserFunction(Arc<UserFnInner>)  user fn + closure
    └── BoundMethod(...)                bound method
```

### Why 16 bytes matters

A smaller enum means:

- better **cache locality** when iterating arrays of values
- cheaper `clone()` for inline variants (a copy of 16 bytes, no heap traffic)
- **shared ownership** (`Arc`) for large variants instead of deep copies

## String interning

**Source:** [`src/utils/interner.rs`](file:///d:/Projects/AdeshLang/src/utils/interner.rs)

A global interner deduplicates strings and returns shared `Arc<str>` handles:

```rust
static STRING_INTERNER: Lazy<Mutex<StringInterner>> = ...;
```

- `intern("hello")` looks up a global `StringMap<Arc<str>>`
- hit → returns the same `Arc` (memory saved, **pointer-equality fast path**)
- miss → allocates once, inserts, returns
- tracks hit-rate / stats for tuning

> "Reduces memory usage by 50–90% for programs with many duplicate strings."

## Environments & scoping

**Source:** [`src/execution/runtime_core/interpreter_core.rs`](file:///d:/Projects/AdeshLang/src/execution/runtime_core/interpreter_core.rs)

The tree-walk interpreter evaluates the AST using **nested environments**:
each scope is an environment that chains to its parent, giving closures their
captured variables and `let` its block scoping:

```text
Global env
 └── fn main() env  ──► closure env (captures `count`)
      └── block env (loop body, `let i`)
```

Fast variable lookup uses cached binding locations so hot paths don't
re-traverse the chain blindly.

## The runtime services

The interpreter core bundles the runtime services your programs use:

| Service | What it powers |
|---|---|
| **Builtin dispatch** | `len`, `print`, `str`, `parseInt`, collection methods |
| **Promise microtask queue** | `await`, `Promise.all`, `.then` chains |
| **Timer manager** | `setTimeout`, `setInterval`, `clearTimeout` |
| **Formatting utilities** | `print`'s separator/`end`/`sep` options, color specs |
| **Module loader** | `import "./file.adesh"` with search paths |
| **REPL support** | `:type`, `:ast`, `:env`, `:load` commands |
| **Memory stats** | `--mem` style CLI reporting |

## Async under the hood

Promises resolve through a **microtask queue**; timers run on a concurrent
timer manager; the top-level `await` keeps the interpreter alive until the
promise settles (exactly like the
[`examples/timers/timers_combined.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/timers/timers_combined.adesh)
pattern). This is a single-threaded event-loop model: your async code is
cooperative, not preemptive.

## Where this fits

- Language-facing view of values: [Type System](/docs/language-guide/type-system)
- Behind-the-scenes memory: [Memory Management](/docs/compiler/memory-management)
- Concurrency services: [Async & Concurrency](/docs/language-guide/async-concurrency)
