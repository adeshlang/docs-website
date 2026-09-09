---
id: await
title: await
sidebar_label: await
description: The `await` keyword suspends the current async task until a promise completes, then yields its result or propagates its error.
---

# `await`

`await` **suspends** the current `async` task until the awaited future completes. While suspended, the underlying worker thread is released to poll other tasks — no thread is blocked. When the future resolves to `Poll::Ready(value)`, `await` resumes the state machine, yields `value`, and continues. If the future throws, `await` re-throws into the awaiting context. It is only valid inside `async` functions or `async` blocks.

> **Ground truth:** Lexer `TokenKind::Await` (`src/parsing/lexer.rs:986`, keyword `"await"`), hover doc *Waits for a promise to resolve. Only valid inside async functions.* (`als/src/hover.rs:366`), lowered as state-machine suspension point (`async-concurrency.md:2`).

---

## Syntax

```text
await_expr   ::= "await" unary_expr
unary_expr   ::= primary | call_expr | block
call_expr    ::= await_expr | primary "(" args? ")"
              |  primary "." ident "(" args? ")"

primary      ::= ident | literal | "(" await_expr ")"
```

`await` is a **unary prefix** keyword with higher precedence than assignment but lower than call/member access. Parentheses disambiguate complex expressions.

### Canonical forms

```adesh
let body: string = await fetch("https://example.com");
let n: i32      = await compute(42);
let v           = await (if useCache { fetchCached(url) } else { fetch(url) });

// Awaiting a spawned handle
let h = spawn fetch(url);
let body = await h;

// Awaiting inside expressions
let total = (await fetchA()) + (await fetchB());
let ok = await check() ? "yes" : "no";
```

### Precedence and grouping

```adesh
// `await` binds to the immediately following expression:
let x = await fetch(url).body; // parses as await (fetch(url).body) if body is a future; else (await fetch(url)).body
let y = await (fetch(url));    // explicit grouping

// Chaining awaits (sequential suspension):
let a = await fetch("https://a.example");
let b = await fetch("https://b.example"); // b starts only after a completes
```

To run futures concurrently, `spawn` before `await`:

```adesh
let ha = spawn fetch("https://a.example");
let hb = spawn fetch("https://b.example");
let a = await ha;
let b = await hb; // concurrent — both started before either await
```

---

## Semantics

### Suspension and resumption

`await` marks a **state boundary** in the enclosing `async` state machine. The compiler splits the function at that point:

```
State 0: entry → evaluate await operand → if Pending, register Waker and return Pending
State 1: resumed with Ready(value) → bind value → continue to next await or return
```

While `Pending`, the executor's worker thread polls other ready tasks. The `Waker` (registered in epoll/kqueue/IOCP) wakes the task when I/O or timer completes, re-enqueueing it.

### No thread blocking

`await` never blocks an OS thread. A synchronous `sleep` or blocking I/O inside `async` without `await` *does* block the worker — use async-aware variants (`await sleep(...)`, `await file.read_async()`).

### Error propagation

If the awaited future `throw`s / rejects, `await` propagates the exception as if `throw` had executed at the `await` site:

```adesh
async fn mayFail() -> i32 { throw "oops"; }
async fn caller() {
    try { let v = await mayFail(); } catch (e) { print(e); } // "oops"
}
```

This works uniformly for `await fetch(...)`, `await h` where `h` is a `spawn` handle, and `await async { ... }`.

### Interaction with `defer`/`region`/`try`

- `defer` handlers are **not** run on suspension — only on scope exit. A deferred `file.close()` stays pending while `await` is suspended.
- `region` arenas remain live across `await` *only if* the region scope encloses the `await`. Pointers into a region that exits before the task resumes are rejected by `escape_analysis`.
- `try`/`catch` around `await` catches both synchronous throws before suspension and asynchronous rejections after.

### Compilation pipeline

1. **Lex** `await` → `TokenKind::Await`.
2. **Parse** as `Await(Box<Expr>)` inside `async` context; rejected outside `async`.
3. **HIR** — mark suspension point, allocate future slot.
4. **MIR/CFG** — emit `Pending`/`Ready` dispatch with `Waker` glue.
5. **Backend** — generate state-tag switch and resume trampoline.
6. **Runtime** — event loop wakes via `Waker::wake()` → re-polls.

---

## Examples

### Example 1 — Sequential awaits, conditional await, and loop awaits

```adesh
async fn fetch(url: string) -> string {
    let resp = await http_get(url);
    return resp.body;
}

async fn fetchAll(urls: [string]) -> [string] {
    let results: [string] = [];
    // Sequential: each iteration suspends until that fetch completes
    for url in urls {
        let body = await fetch(url);
        results.push(body);
    }
    return results;
}

async fn fetchConditionally(url: string, useCache: bool) -> string {
    // Await inside conditional expression — only one branch suspends
    let body = await (useCache ? fetchCached(url) : fetch(url));
    return body;
}

async fn retry(url: string, attempts: i32) -> string {
    let lastErr: string = "";
    for i in 0..attempts {
        try {
            return await fetch(url); // early return on success
        } catch (e) {
            lastErr = str(e);
            await sleep(100 * (i + 1)); // backoff — suspension point
        }
    }
    throw "all retries failed: " + lastErr;
}
```

### Example 2 — Concurrent awaits with `spawn`, join patterns, and cancellation

```adesh
async fn concurrentFetch() -> [string] {
    // Concurrent — all three start before any await
    let ha = spawn fetch("https://a.example");
    let hb = spawn fetch("https://b.example");
    let hc = spawn fetch("https://c.example");

    // Join sequentially (order does not affect concurrency)
    let a = await ha;
    let b = await hb;
    let c = await hc;
    return [a, b, c];
}

async fn firstReady(urls: [string]) -> string {
    // Race — return first completed (poll order is executor-dependent)
    let handles = [];
    for url in urls { handles.push(spawn fetch(url)); }
    // Simple race loop: await in order, return early (illustrative)
    // For true `select` semantics, runtime may expose a `select` combinator
    for h in handles {
        try { return await h; } catch (_) { /* try next */ }
    }
    throw "all failed";
}

async fn withTimeout() -> string {
    // Timeout pattern — spawn timeout alongside fetch
    let dataTask = spawn fetch("https://slow.example");
    let timeoutTask = spawn async { await sleep(2000); throw "timeout"; };

    try {
        // In runtimes with select, await whichever completes first
        return await dataTask;
    } catch (e) {
        print("timed out or failed:", e);
        throw e;
    }
}
```

### Example 3 — `await` with `defer`, `region`, and borrow safety

```adesh
async fn readWithCleanup(path: string) -> string {
    let file = FS.open(path, "r");
    defer file.close(); // guaranteed on return/throw — NOT on suspension

    // `file` outlives the await, so borrowing it across await is safe
    let chunk = await file.read_async(8192);
    return chunk;
}

async fn badRegionCapture() {
    // ❌ Rejected by escape_analysis: raw pointer escapes region across await
    // let escaped: *mut u8;
    // region scratch {
    //     unsafe {
    //         let buf: *mut u8 = alloc<u8>(64);
    //         escaped = buf; // capture
    //         await sleep(10); // suspension while region still live — but region may exit on unwind
    //     }
    // } // region exits here — buf is bulk-freed (Freed)
    // // await would resume with dangling pointer — rejected
}

async fn goodScratch() -> i32 {
    // ✅ Copy data out of region before awaiting
    let first: u8;
    region scratch {
        unsafe {
            let buf: *mut u8 = alloc<u8>(64);
            for i in 0..64 { buf[i] = (i * 3) as u8; }
            first = buf[0]; // copy
            // buf is bulk-freed at region exit before await — no dangling capture
        }
    }
    let doubled = await compute(first as i32); // safe — no region pointer survives
    return doubled;
}
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let await = 1` | `unexpected token 'await', expected identifier` | `TokenKind::Await` reserved |
| **Parse/Context** | `await` outside `async fn`/`async` block | `await is only valid inside an async function or async block` | Add `async` to enclosing `fn`/block |
| **Parse** | `await;` with no operand | `expected expression after 'await'` | Write `await expr` |
| **Type** | `await` of non-future (e.g., `await 42`) | `cannot await non-promise value of type 'i32'` | Only await `async` calls, `spawn` handles, or `async` blocks |
| **Borrow** | Borrowing a stack temp across `await` where borrow does not live long enough | `borrowed value does not live long enough` | Clone value before `await` or restructure scope |
| **Region** | Region pointer live across `await` that may outlive region | `allocation from region does not outlive region` | Copy data out before `await` |
| **Linter** | `async` call without `await`/`spawn` (dropped future) | Warning: `unused async result` | `let v = await f();` or `let h = spawn f();` |
| **Runtime** | Awaited task throws and no `catch` | Exception propagates to awaiter | Wrap `await` in `try`/`catch` |

**Common pitfall — sequential when concurrent was intended:**

```adesh
// Sequential latency sum:
let a = await fetch(urlA);
let b = await fetch(urlB);

// Concurrent (both in flight):
let ha = spawn fetch(urlA);
let hb = spawn fetch(urlB);
let a = await ha;
let b = await hb;
```

---

## See Also

- [async](./async) — `async fn` / `async { }` state-machine lowering
- [spawn](./spawn) — `spawn expr` concurrent tasks and join handles
- [Async & Concurrency](../async-concurrency) — `Poll::Ready`/`Pending`, `Waker`, work-stealing scheduler
- [try](./try) / [catch](./catch) / [throw](./throw) — error propagation through `await`
- [defer](./defer) — scope-exit cleanup (runs on exit, not on suspension)
- [region](./region) — arena lifetimes across `await` points
- `src/parsing/lexer.rs:986`, `src/runtime_core/*`, `als/src/hover.rs:366`
