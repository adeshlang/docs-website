---
id: spawn
title: spawn
sidebar_label: spawn
description: The `spawn` keyword launches a concurrent task that runs independently of the caller and returns an awaitable handle.
---

# `spawn`

`spawn` launches a **concurrent task** that runs independently of the caller. Unlike a direct `async` call that suspends the current task at the first `await`, `spawn` enqueues a new task on the runtime scheduler and returns immediately with a **join handle** whose result can later be collected with `await`. It is the primary primitive for structured concurrency alongside `async`/`await`.

> **Ground truth:** Lexer `TokenKind::Spawn` (`src/parsing/lexer.rs:987`, keyword `"spawn"`), runtime scheduler `src/runtime_core/*` work-stealing executor, hover doc `spawn` → *Starts a concurrent task without blocking the caller* (`als/src/hover.rs:367`).

---

## Syntax

```text
spawn_expr   ::= "spawn" ( block | async_expr | call_expr )
block        ::= "{" statements "}"
async_expr   ::= "async" block | "async" call_expr
call_expr    ::= ident "(" args? ")" | ident "." ident "(" args? ")"
handle       ::= awaitable<Task<T>>   // value returned by spawn
```

`spawn` is a prefix keyword that takes a single operand — typically a block or an `async` invocation. It is an **expression**, so it can appear on the right-hand side of `let`, as an argument, or inside collections.

### Canonical forms

```adesh
let h1 = spawn fetch("https://a.example");          // spawn an async call
let h2 = spawn { heavy_compute(42) };               // spawn a block
let h3 = spawn async { let v = await fetch(url); v.len() }; // spawn async block

// With explicit handle typing (where supported by annotations)
let t: Task<string> = spawn fetch("https://example.com");
let result: string = await t;
```

### Relation to `async`/`await`

```
async fn f(): T   — declares suspension points; returns Promise<T>/Task<T>
await expr          — suspends current task until expr resolves
spawn expr          — creates a sibling task; does NOT suspend caller
spawn + await       — concurrent fork then join
```

Inside an `async` function, `spawn` desugars roughly to `runtime_core::spawn(future)`; outside `async`, some runtimes require `spawn` to be called from an async context or from `main` that is itself `async`.

---

## Semantics

### Task model

Each `spawn` creates an **independent task** tracked by the executor. Tasks are:

- **Concurrent, not parallel-by-default:** the work-stealing scheduler may run tasks on the same thread interleaved at `await` points, or on different worker threads when `Send`-like constraints allow. CPU-bound blocks without `await` still benefit from `spawn` on multi-threaded executors.
- **Structured:** the handle keeps the task alive. Dropping the handle does not cancel the task in the current implementation — the task runs to completion unless the runtime provides explicit cancellation.
- **Awaitable:** `await handle` suspends the awaiting task until the spawned task completes and yields its return value (or propagates its `throw`).

### State-machine interaction with `async`

`async fn` bodies are lowered to stackless state machines with `Poll::Ready`/`Poll::Pending` transitions (`async-concurrency.md:1`). `spawn` submits such a state machine to the executor instead of polling it inline:

```
caller task:  spawn ──► executor queue ──► worker polls spawned task
     │                  (Waker registered on I/O)
     └──► continues without blocking ──► await h ──► suspends until Ready
```

### Scheduling

The runtime (`src/runtime_core/`) uses a **work-stealing deque** per worker thread. `spawn` pushes onto the local queue; idle workers steal tasks, preserving locality while balancing load. `spawn` is `O(1)` plus the cost of allocating the future's state.

### Error propagation

If the spawned task `throw`s, the exception is captured in the handle. `await` on that handle re-throws:

```adesh
async fn failing(): i32 { throw "boom"; }
let h = spawn failing();
try {
    let v = await h;
} catch (e) { print(e); } // "boom"
```

### When to use `spawn` vs direct `await`

| Pattern | Behavior |
|---|---|
| `let v = await fetch(a); let w = await fetch(b);` | Sequential — `b` starts after `a` finishes |
| `let ha = spawn fetch(a); let hb = spawn fetch(b); let v = await ha; let w = await hb;` | Concurrent — both start immediately |
| `spawn { loop { poll() } }` | Background daemon (no join) |

---

## Examples

### Example 1 — Concurrent fetch with join

```adesh
async fn fetch(url: string): string {
    // ... asynchronous work (runtime_core I/O) ...
    return "body:" + url;
}

async fn main() {
    // Fork two independent I/O tasks concurrently
    let t1 = spawn fetch("https://a.example");
    let t2 = spawn fetch("https://b.example");

    // Do other work while they run
    print("both fetches in flight");

    // Join — suspends until each completes (order independent)
    let a = await t1;
    let b = await t2;
    print(a, b); // "body:https://a.example" "body:https://b.example"

    // Collecting results as an array
    let handles = [spawn fetch("https://c.example"), spawn fetch("https://d.example")];
    let bodies: [string] = [];
    for h in handles { bodies.push(await h); }
    print(bodies.len()); // 2
}
```

### Example 2 — Parallel pipelines, error handling, and background work

```adesh
async fn process_item(id: i32): i32 {
    if id < 0 { throw "negative id"; }
    let v = await compute(id); // suspension point
    return v * 2;
}

async fn parallel_pipeline(ids: [i32]): [i32] {
    // Spawn a task per item — throughput scales with worker threads
    let handles = [];
    for id in ids {
        handles.push(spawn process_item(id));
    }

    let results: [i32] = [];
    let errors: [string] = [];
    for h in handles {
        try {
            results.push(await h);
        } catch (e) {
            errors.push(str(e));
        }
    }
    if errors.len() > 0 { print("errors:", errors); }
    return results;
}

// Fire-and-forget background logger (no await — runs independently)
async fn start_background_logger() {
    spawn async {
        while true {
            await sleep(1000);
            print("tick", clock());
        }
    };
    print("logger spawned — main continues");
}

async fn demo() {
    print(await parallel_pipeline([1, 2, 3, -1])); // [2,4,6] plus error for -1
    await start_background_logger();
}
```

### Example 3 — `spawn` with regions, `defer`, and structured cleanup

```adesh
async fn with_scratch(id: i32): i32 {
    region scratch {
        unsafe {
            let buf: *mut u8 = alloc<u8>(256);
            defer free(buf); // LIFO — runs even if await throws
            // Simulate work that needs scratch memory
            for i in 0..256 { buf[i] = (id + i) as u8; }
            let s = await compute(buf[0] as i32);
            return s;
        }
    }
}

async fn fan_out(n: i32): i32 {
    let handles = [];
    for i in 0..n { handles.push(spawn with_scratch(i)); }
    let sum = 0;
    for h in handles { sum += await h; }
    return sum;
}
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let spawn = 1` | `unexpected token 'spawn', expected identifier` | `TokenKind::Spawn` is reserved (`lexer.rs:987`) |
| **Type** | `spawn` of non-async / non-awaitable value where executor expects `Future` | `spawn expects an async block or async call, found <type>` | Wrap in `async { ... }` or call an `async fn` |
| **Context** | `spawn` outside a runtime context (no executor) | `cannot spawn outside async runtime` | Call from `async fn main` or `runtime_core::block_on` |
| **Borrow** | Capturing a non-`Send` / borrowed reference across `spawn` boundary that outlives scope | `borrowed value does not live long enough` / `cannot send across threads` | Clone data or use `share`/`strong` for shared ownership |
| **Region** | Spawning a task that captures a `region`-allocated pointer escaping the region | `allocation from region does not outlive region` (`escape_analysis.rs`) | Copy data out or keep region live until `await` |
| **Linter** | `spawn` without ever `await`-ing or storing handle (fire-and-forget unintended) | Warning: `spawned task handle is unused` | Bind to `let h = spawn ...` or explicitly `let _ = spawn ...` if intentional |
| **Runtime** | Spawned task panics/throws and handle is never awaited | Unobserved error logged | Always `await` handles or attach error handler |

**Common pitfall — sequential when concurrent was intended:**

```adesh
// Sequential (2 * latency):
let a = await fetch(urlA);
let b = await fetch(urlB);

// Concurrent (max latency):
let ha = spawn fetch(urlA);
let hb = spawn fetch(urlB);
let a = await ha;
let b = await hb;
```

---

## See Also

- [async](./async) — `async fn` returning an awaitable (`TokenKind::Async`)
- [await](./await) — suspension point `await expr`
- [Async & Concurrency](../async-concurrency) — state machines, executors, `Poll`, work-stealing
- [region](./region) — arena bulk-free and escape constraints for captured allocations
- [defer](./defer) — LIFO scope-exit cleanup that runs before `RegionExit`
- [throw](./throw) / [try](./try) / [catch](./catch) — error propagation through task handles
- `src/runtime_core/*`, `src/parsing/lexer.rs:987`, `als/src/hover.rs:367`
