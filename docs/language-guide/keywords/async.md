---
id: async
title: async
sidebar_label: async
description: The `async` keyword marks a function or block as asynchronous, lowering it to a stackless state machine that returns an awaitable Promise.
---

# `async`

`async` marks a **function or block** as asynchronous. An `async` function does not run to completion synchronously; instead the compiler lowers its body to a **stackless state machine** whose execution can suspend at each `await` without blocking the thread, resuming later when the awaited future becomes `Ready`. The return value is an **awaitable** (`Promise<T>`/`Task<T>`) that must be driven with `await` or handed to `spawn`.

> **Ground truth:** Lexer `TokenKind::Async` (`src/parsing/lexer.rs:985`), hover doc *Declares an async function that returns a promise. Use `await` to wait for promises.* (`als/src/hover.rs:365`), state-machine layout in `async-concurrency.md:1`.

---

## Syntax

```text
async_fn     ::= "async" "fn" ident "(" params? ")" ( ":" type )? block   // `:` canonical; `->` also accepted for compat, but prefer `:` (only `extern "C"` uses `->`)
async_block  ::= "async" block
async_move   ::= "async" "move" block       // capture-by-move form (when available)
params       ::= param ("," param)*
block        ::= "{" statements "}"

type         ::= ident ("<" type ("," type)* ">")? ("?")?
```

`async` is a prefix modifier — it precedes `fn`, a block, or a closure-like value. The keyword is reserved and cannot be used as an identifier.

### Canonical forms

```adesh
async fn fetch(url: string): string {
    let data = await http_get(url);
    return data;
}

async fn compute(n: i32): i32 {
    await sleep(10);
    return n * 2;
}

// async block — creates an anonymous future without naming a function
let fut = async {
    let a = await fetch("https://a.example");
    let b = await fetch("https://b.example");
    return a + b;
};
let body = await fut;

// spawn integration — async block handed to scheduler
let handle = spawn async { await fetch("https://example.com") };
let result = await handle;
```

### Placement

| Position | Example | Meaning |
|---|---|---|
| Before `fn` | `async fn f() {}` | Function body is a state machine |
| Before block | `async { ... }` | Block evaluates to a future |
| Before `move` block | `async move { ... }` | Captures moved values into future |
| Not allowed | `let async = 1` | Reserved `TokenKind::Async` |

---

## Semantics

### Stackless state-machine lowering

For each `async fn`, the compiler generates an anonymous struct holding:

1. **State tag** (`u32`: `0`, `1`, ..., `Complete`) at offset `0x00`.
2. **Parameters and locals** that live across `await` points.
3. **Per-await future storage** for in-flight sub-futures.

```
[ Async State Machine Layout ]
+-------------------------------------------------------+
| Offset 0x00: State Tag (u32)                          |
+-------------------------------------------------------+
| Offset 0x08: param `url` (string header)              |
+-------------------------------------------------------+
| Offset 0x20: future slot for await #1                 |
+-------------------------------------------------------+
| Offset 0x38: future slot for await #2                 |
+-------------------------------------------------------+
```

Each `await` is a state boundary: `poll` returns `Pending` and registers a `Waker` with the OS event source (epoll/kqueue/IOCP) until readiness fires.

### Poll loop

```adesh
enum Poll<T> { Ready(T), Pending, }
```

The executor repeatedly `poll`s the future's state machine. On `Pending`, the thread is freed to poll other tasks; on `Ready(value)`, the state advances and the awaiter resumes. No OS thread is blocked while a future is pending on I/O.

### Return type

`async fn f(): T` logically returns `Promise<T>` (or `Task<T>` in spawned contexts). Callers must `await` it or `spawn` it to drive it. Forgetting to `await` leaves the future inert (lint: `unused async result`).

### Capture and ownership

Values used inside `async` blocks that come from the enclosing scope are captured. If the block is `spawn`ed, captures must outlive the task — borrowed references that die before `await` completes are rejected by region/escape analysis. Prefer owned types (`string`, cloned arrays) or `share`/`strong` for cross-task ownership.

### Compilation pipeline

1. **Lex** `async` → `TokenKind::Async`.
2. **Parse** as `AsyncFn` / `AsyncBlock` node wrapping body.
3. **HIR lower** — mark `HirFn::is_async = true`, create `Future` output type.
4. **State-machine pass** — split body at each `await` into states.
5. ** MIR/CFG** — emit `Poll` dispatch and `Waker` registration.
6. **Codegen** — state struct + `poll` function + drop glue for in-flight futures.
7. **Runtime** — executor (`src/runtime_core`) drives `poll` via work-stealing scheduler.

---

## Examples

### Example 1 — Basic async fetch chain and error propagation

```adesh
async fn fetch(url: string): string {
    // Each await is a suspension point — thread is released while I/O is pending
    let conn = await connect(url);
    let resp = await conn.get("/");
    if resp.status != 200 { throw "http " + str(resp.status); }
    return resp.body;
}

async fn fetch_all(urls: [string]): [string] {
    let results: [string] = [];
    // Sequential version: each fetch waits before starting next
    for url in urls {
        let body = await fetch(url);
        results.push(body);
    }
    return results;
}

async fn main() {
    try {
        let bodies = await fetch_all(["https://a.example", "https://b.example"]);
        print(bodies.len()); // 2
    } catch (e) {
        print("fetch failed:", e);
    }
}
```

### Example 2 — Concurrency via `spawn` inside `async` context

```adesh
async fn fetch_concurrent(urls: [string]): [string] {
    // Spawn all fetches at once — they run concurrently on the executor
    let handles = [];
    for url in urls {
        handles.push(spawn fetch(url));
    }
    let out: [string] = [];
    for h in handles {
        out.push(await h); // join — suspends until each handle resolves
    }
    return out;
}

async fn demo_concurrent() {
    let start = clock();
    // Latency is max(fetch latencies), not sum, because fetches overlap
    let bodies = await fetch_concurrent([
        "https://a.example", "https://b.example", "https://c.example"
    ]);
    print("fetched", bodies.len(), "in", clock() - start, "ns");

    // Fire-and-forget background task — no await needed immediately
    let logger = spawn async {
        while true { await sleep(1000); print("tick"); }
    };
    // logger keeps running while demo_concurrent continues
    print("logger spawned, handle:", logger);
}
```

### Example 3 — Async blocks, `defer`/`region`, and borrow correctness

```adesh
async fn with_temp_file(path: string): string {
    let file = FS.open(path, "r");
    defer file.close(); // LIFO — runs on every exit path, including throw/return

    // async block capturing `file` by reference — valid because file outlives awaits below
    let reader = async {
        let chunk = await file.read_async(4096);
        return chunk;
    };
    let data = await reader;
    return data;
}

// Region interaction: arena allocation must not escape the async suspension
async fn with_scratch(n: i32): i32 {
    region scratch {
        unsafe {
            let buf: *mut u8 = alloc<u8>(n);
            defer free(buf);
            for i in 0..n { buf[i] = (i & 0xFF) as u8; }
            // Copy out before suspension — raw pointer must not survive across await
            // if the region could exit while task is Pending (rejected by escape_analysis)
            let first = buf[0] as i32;
            let doubled = await compute(first); // suspension point — region still live
            return doubled;
        }
    }
}
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let async = 1` | `unexpected token 'async', expected identifier` | `TokenKind::Async` reserved |
| **Parse** | `async 42` (no fn/block) | `expected 'fn' or '{' after 'async'` | Write `async fn f() {}` or `async { ... }` |
| **Type** | `await` outside `async` | `await is only valid inside an async function or async block` | Add `async` to enclosing `fn`/block or remove `await` |
| **Type** | `async fn` returning non-awaitable used without `await`/`spawn` | Warning: `unused async result — future is never polled` | `await` the call or `spawn` it |
| **Borrow** | Borrowed local escapes `async` block that is `spawn`ed beyond its scope | `borrowed value does not live long enough` / `cannot send across await` | Clone value or use `share`/`strong` |
| **Region** | Raw pointer from `region` captured across `await` that may outlive region | `allocation from region does not outlive region` | Copy data to owned heap before `await` |
| **Runtime** | `async` task throws and error is never observed | Unobserved exception / `throw` propagates to `await`er | Wrap `await` in `try`/`catch` |

**Common pitfall — blocking inside `async`:**

```adesh
async fn bad() {
    sleep(1000); // if this is blocking sleep, it blocks the worker thread
    // prefer: await sleep_async(1000) or runtime-aware sleep
}
```

Prefer async-aware I/O (`await http_get`, `await FS.read_async`) inside `async` bodies; blocking calls stall the executor's worker thread.

---

## See Also

- [await](./await) — suspension point `await expr` (`TokenKind::Await`)
- [spawn](./spawn) — concurrent task creation `spawn expr`
- [Async & Concurrency](../async-concurrency) — state machines, `Poll::Ready`/`Pending`, `Waker`, work-stealing scheduler
- [try](./try) / [catch](./catch) / [throw](./throw) — error propagation through async boundaries
- [defer](./defer) — scope-exit cleanup guaranteed across `await`/`return`/`throw`
- [region](./region) — arena memory and cross-`await` pointer validity
- `src/parsing/lexer.rs:985`, `src/runtime_core/*`, `als/src/hover.rs:365`
