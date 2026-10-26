---
id: async-concurrency
title: "Async State Machines, Task Schedulers & Concurrency Primitives"
description: "Formal specification of stackless async state machine transformations, executor poll loops, work-stealing schedulers, and atomic synchronization primitives."
sidebar_label: "Async & Concurrency Model"
---

# Async State Machines, Task Schedulers & Concurrency Primitives

This document specifies the compiler transformation of `async` functions into stackless state machines, task executor polling loops, work-stealing thread schedulers, and physical memory layouts of synchronization primitives (`Arc`, `Mutex`, `RwLock`).

---

## 1. Stackless Async State Machine Transformation

Functions annotated with `async` do not execute synchronously to completion. Instead, the compiler (via `src/parsing/ast.rs:Function.is_async`, `src/parsing/hir_lower.rs`, `src/execution`) transforms an `async fn` into an anonymous **Stackless State Machine Struct** that can suspend at `await` and resume later.

```adesh
async fn fetch_payload(url: string): Result<string, Error> {
    let connection = await connect(url)?;
    let response = await connection.get()?;
    return Ok(response.body);
}

async fn compose(): string {
    let a = await fetch_payload("https://a.example");
    let b = await fetch_payload("https://b.example");
    return f"{a}+{b}";
}
```

### 1.1 Compiler State Machine Lowering

The desugaring pass transforms the function body into an enum-like state machine struct storing locals across suspension points:

```
[ Async State Machine Memory Layout for fetch_payload ]
+-------------------------------------------------------+
|  Offset 0x00: Current State Tag (u32: 0, 1, 2, Complete)|
+-------------------------------------------------------+
|  Offset 0x08: Parameter 'url' (24-byte string header) |
+-------------------------------------------------------+
|  Offset 0x20: Future 1 'connection' (State 1 storage) |
|             (Result<Connection, Error> future)        |
+-------------------------------------------------------+
|  Offset 0x38: Future 2 'response'   (State 2 storage) |
|             (Result<Response, Error> future)          |
+-------------------------------------------------------+
|  Offset 0x50: Waker slot + Drop flags                 |
+-------------------------------------------------------+
```

Each `await` boundary marks a state transition breakpoint. The state tag drives the `poll` dispatch (see §2). Locals live in the state machine allocation (heap or parent frame), not the native call stack — hence "stackless."

HIR lowering (`src/parsing/hir.rs`, `src/execution`) represents this as:

```rust
enum AsyncState { Start, WaitingConnection, WaitingResponse, Done }
struct FetchPayloadStateMachine { state: AsyncState, url: String, conn_future: Option<Future>, ... }
fn poll(&mut self, cx: &mut Context): Poll<Result<String, Error>>
```

### 1.2 State Transitions

```text
State 0 (Start):
  initiate connect(url) -> store future in offset 0x20
  set state = 1
  return Poll::Pending (register waker)

State 1 (WaitingConnection):
  poll connection future
  if Pending -> return Pending
  if Ready(Ok(conn)) -> store conn, state = 2, fall through
  if Ready(Err(e)) -> state = Done, return Ready(Err(e))

State 2 (WaitingResponse):
  poll conn.get() future
  if Pending -> return Pending
  if Ready(Ok(resp)) -> state = Done, return Ready(Ok(resp.body))
  if Ready(Err(e)) -> state = Done, return Ready(Err(e))
```

`await` is the suspension point; the state machine captures all live locals needed after suspension.

### 1.3 EBNF

```ebnf
AsyncFn     ::= "async" "fn" IDENT "(" Params ")" [ ":" Type ] Block   // `:` canonical; `->` also parsed (only `extern "C"` uses `->`)
AwaitExpr   ::= "await" Expr
SpawnExpr   ::= "spawn" Expr               (* spawn(async { ... }) *)
AsyncBlock  ::= "async" ( "move" )? Block  (* async move { ... } captures by move *)
```

In AST: `ExprKind::Await(Box<Expr>)`, `ExprKind::Spawn(Box<Expr>)`, `Function.is_async: bool`.

---

## 2. Executor Poll Loop Semantics (`Poll::Ready` / `Poll::Pending`)

An `async` task implements a `poll(cx: &mut Context)` interface:

```adesh
enum Poll<T> {
    Ready(T),
    Pending,
}
struct Context { waker: Waker }
struct Waker { fn wake(); }
```

### 2.1 Execution Poll Step

When a task executor polls an async state machine:

1. If the target operation is ready, `poll()` returns `Poll::Ready(value)` and advances the internal State Tag (`State_n -> State_(n+1)`).
2. If the operation would block (e.g., waiting for I/O socket readiness), `poll()` registers a `Waker` callback in the OS event loop (epoll / kqueue / IOCP) and returns `Poll::Pending`.
3. Execution returns immediately to the executor thread without blocking the native thread stack.
4. When the OS event fires (socket readable, timer expired), the event loop calls `waker.wake()`, which re-enqueues the task for polling.

```
[ Executor Thread ]
     |
     +---> poll(task_A) -> Pending (waker registered on epoll fd 42)
     |                      |
     +---> poll(task_B) -> Ready(value) -> complete, wake dependents
     |
[ OS Event Loop (epoll_wait) ]
     |
     +---> fd 42 ready -> wake task_A -> re-enqueue -> poll(task_A) -> Ready
```

Poll is **non-blocking** by contract: a future must never block the thread; it must return `Pending` and arrange for a future wake.

### 2.2 Waker & Context

`Waker` is cloneable and `Send + Sync`. Cloning a waker does not duplicate the task. The runtime guarantees that `wake()` is safe to call from any thread (used by `src/parsing/ast.rs:NativeEffect::EnqueueMicrotask` and timer futures).

In the interpreter, promises and timers use `Value::Promise(u64)` plus `BuiltinEnv` effects (`RegisterPromise`, `AttachThen`, `ResolvePromise`, `EnqueueMicrotask`, `RegisterTimer` in `src/parsing/ast.rs:NativeEffect`).

---

## 3. Promises, `async`/`await`, and Chaining

### 3.1 Promise (`Value::Promise`)

Promises are the interpreter's representation of async values, manipulated via `BuiltinEnv`:

```adesh
let p: Promise<string> = new Promise((resolve, reject) => {
    resolve("hello");
});
let chained = p.then((v) => f"{v} world");
let val = await chained; // suspends state machine until chained resolves
```

Each `Promise` carries an internal `u64` id managed by `Interpreter` (`src/execution`). `create_promise_executor`, `schedule_resolve`, `schedule_reject` are on `BuiltinEnv`.

### 3.2 `await` Semantics

`await` may only appear inside `async fn` or `async move { ... }` blocks. It desugars to:

```adesh
// Source:
let x = await foo();
// Desugared (conceptual):
let x = match poll(foo_future, cx) {
    Poll::Ready(v) => v,
    Poll::Pending => { state = next; return Poll::Pending; }
};
```

`await` on a non-future (plain value) is identity (`Ready` immediately). `await` on `Result` futures propagates via `?` before unwrapping.

### 3.3 `async move` Capture Modes

```adesh
let data: string = "hello";
spawn(async move {
    // 'data' moved into the async block's state machine
    print(data);
});
spawn(async {
    // 'data' borrowed (if still alive); compiler infers per closure_capture.rs
    print(data);
});
```

Capture mode is inferred in `src/parsing/closure_capture.rs` and `src/parsing/escape_analysis.rs`: `move` forces ownership transfer; non-move attempts shared borrow and fails if the borrowed value does not live long enough.

---

## 4. Multi-Threaded Work-Stealing Task Scheduler

Concurrent tasks spawned via `spawn(async move { ... })` are managed by a multi-threaded **Work-Stealing Task Scheduler**:

```
Global Shared Task Queue (injection queue)
[ Task_A ] [ Task_B ] [ Task_C ]
      |          |          |
      v          v          v
+------------------------+------------------------+------------------------+
|  Worker Thread 0       |  Worker Thread 1       |  Worker Thread 2       |
|  Local Queue: [Task_D] |  Local Queue: [Empty]  |  Local Queue: [Task_E] |
|  Deque (LIFO local)    |                        |                        |
+------------------------+------------------------+------------------------+
                              ^                       |
                              | (Steals Task_D via    |
                              |  Lock-Free Deque)     |
                              +-----------------------+
```

- Each worker thread maintains a local lock-free double-ended queue (Chase-Lev deque). The owner pushes/pops from the LIFO end; thieves steal from the FIFO end.
- When a worker exhausts its local queue, it steals tasks from sibling worker queues, maintaining high cache locality and balanced core utilization.
- The global injection queue is for tasks spawned from non-worker threads (e.g., main thread `spawn`).
- Yield points and `await` Pending return the task to the scheduler rather than busy-spinning.

Spawn signature:

```adesh
fn spawn<T>(future: async fn(): T): JoinHandle<T>;
struct JoinHandle<T> { fn await(self): T; fn cancel(); }
```

Example:

```adesh
let handles: [JoinHandle<string>] = [];
for url in urls {
    handles.push(spawn(async move { return await fetch_payload(url); }));
}
let results: [string] = [];
for h in handles { results.push(await h); } // join all
```

### 4.1 Task States

```
Task Lifecycle:
  Spawned -> Queued -> Polling -> Pending (waiting) -> Queued (woken) -> Polling -> Ready -> Joined/Dropped
                     |                           |
                     +--- spawn adds to queue ----+
                     +--- waker.wake() re-queues -+
```

A task that is `Pending` holds no thread; the thread is free to poll other tasks — M:N scheduling.

---

## 5. Synchronization Primitives & Atomic Layouts

### 5.1 `Arc<T>` Memory Layout (Atomically Reference Counted)

`Arc<T>` enables shared ownership across threads without GC, via `Value::Share(StrongRef)` / `Value::Weak(WeakRef)` and heap layout:

```
Arc<T> Heap Allocation Layout
+-------------------------------------------------------+
| Offset 0x00: Strong Reference Count (Atomic u64)      |
+-------------------------------------------------------+
| Offset 0x08: Weak Reference Count   (Atomic u64)      |
+-------------------------------------------------------+
| Offset 0x10: Wrapped Value T                          |
|            (aligned to align_of::<T>())               |
+-------------------------------------------------------+
```

Operations:

- `Arc::clone` -> `lock xadd` / `atomic_fetch_add(SeqCst)` on strong count.
- Drop `Arc` -> `atomic_fetch_sub(SeqCst)`; if count reaches 0, drop `T` then check weak count; free allocation when both counts are 0.
- `Weak::upgrade` -> CAS loop on strong count; succeeds only if > 0.

In Adesh source:

```adesh
share let data: Share<Vec<i64>> = share Vec { items: [1,2,3] };
let a = data.clone(); // strong count 2
let w: Weak<Vec<i64>> = data.downgrade();
if (w.upgrade() != null) { print("still alive"); }
```

Maps to `StmtKind::ShareDeclaration(ShareDecl, export)` and `Value::Share` / `Value::Weak`.

### 5.2 `Mutex<T>` Layout

`Mutex<T>` enforces exclusive mutual exclusion across threads:

```
Mutex<T> Memory Layout
+-------------------------------------------------------+
| Offset 0x00: OS Mutex Lock State (Atomic u32 / futex) |
|            0 = unlocked, 1 = locked (no waiters), 2 = locked (waiters) |
+-------------------------------------------------------+
| Offset 0x04: Padding Bytes (4 Bytes)                  |
+-------------------------------------------------------+
| Offset 0x08: Inner Data Payload T                     |
+-------------------------------------------------------+
```

Acquire compiles to `lock cmpxchg` (CAS from 0→1). On contention, the thread suspends via `futex` syscalls (`sys_futex` on Linux, `WaitOnAddress` on Windows, `ulock` on macOS). Release is `atomic_store(0)` + `futex_wake` if waiters exist.

`RwLock<T>` extends this with read-count and writer flag; multiple `read()` holders coexist, `write()` is exclusive.

Example:

```adesh
let counter: Mutex<i64> = Mutex::new(0);
let handles: [JoinHandle<()>] = [];
for _ in range(0, 4) {
    let c = counter.clone();
    handles.push(spawn(async move {
        for _ in range(0, 1000) {
            let mut guard = c.lock(); // blocks or suspends future
            *guard += 1;
            // guard dropped here => unlock
        }
    }));
}
for h in handles { await h; }
print(*counter.lock()); // 4000
```

### 5.3 Channels & Timers

Timers and microtasks integrate with the executor via `NativeEffect`:

```adesh
await sleep(100); // RegisterTimer effect -> waker on expiry
let ch = channel<string>();
spawn(async move { ch.send("hello"); });
let msg = await ch.recv();
```

`RegisterTimer(u64 id, callback, cancel_flag, is_interval, ms)` and `CancelTimer` drive `setTimeout`/`setInterval` semantics.

---

## 6. `defer` in Async Contexts

Defers in `async fn` are preserved across suspensions in the state machine. They run when the async fn's future becomes `Ready` (success, error, or cancellation), not when individual `await` points are reached:

```adesh
async fn guarded_fetch(url: string): string {
    let lock = global_mutex.lock();
    defer lock.unlock(); // held across await points until async fn completes
    let data = await fetch(url);
    return data;
} // unlock runs after return value is ready, before future resolves
```

If an async fn is cancelled (JoinHandle dropped), defers still run before the future is freed — the runtime polls the future to its cleanup state.

---

## 7. Common Pitfalls & Diagnostics

| Issue | Symptom | Fix |
|---|---|---|
| Blocking inside `async fn` (e.g., spin loop) | Executor starvation, latency spikes | Use `await sleep` / yield; offload blocking to thread pool |
| Holding `Mutex` across `await` | Deadlock or contention with other tasks awaiting same lock | Scope the guard: `{ let g=mutex.lock(); ... }` before `await` |
| `await` outside `async` | `E0700: await outside async context` | Mark function `async` or use `spawn(async move { await ... })` |
| Capturing non-`Send` across `spawn` | `E0701: future is not Send` | Clone or wrap in `Arc`/`Mutex`; make captured types `Send` |
| Forgetting to `await` JoinHandle | Task runs but result is ignored; errors swallowed | `let r = await handle;` or `handle.await()` |
| Future already completed | `Poll::Ready` on second poll is panic | Runtime checks; do not poll `Ready` futures |

---

## 8. Extended Examples

### 8.1 Concurrent Fetch with Join

```adesh
async fn fetch_many(urls: [string]): [string] {
    let handles: [JoinHandle<string>] = [];
    for url in urls {
        let u = url; // move capture per iteration
        handles.push(spawn(async move {
            return await fetch_payload(u);
        }));
    }
    let results: [string] = [];
    for h in handles {
        results.push(await h);
    }
    return results;
}
let urls: [string] = ["https://a.example", "https://b.example", "https://c.example"];
let pages = await fetch_many(urls);
print(pages);
```

### 8.2 Producer-Consumer with Channel & Arc

```adesh
share let queue: Share<Mutex<[i64]>> = share Mutex::new([]);
let producer = spawn(async move {
    for i in range(0, 10) {
        { let mut g = queue.lock(); g.push(i); }
        await sleep(10);
    }
});
let consumer = spawn(async move {
    let out: [i64] = [];
    while (out.len() < 10) {
        let item: i64?;
        { let mut g = queue.lock(); item = g.pop(); }
        if (item != null) { out.push(item); } else { await sleep(5); }
    }
    return out;
});
await producer;
let result = await consumer;
print(result);
```

### 8.3 Timeout via `select`-like Pattern

```adesh
async fn with_timeout<T>(future: Promise<T>, ms: u64): Result<T, string> {
    let timeout = spawn(async move { await sleep(ms); return "timeout"; });
    // Conceptual select: whichever future completes first wins
    // (actual select combinator depends on stdlib)
    // Simplified: poll both and check
    return Ok(await future); // placeholder: assumes future wins
}
let res = await with_timeout(fetch_payload("https://slow.example"), 1000);
match res {
    Result::Ok(data) => print(data),
    Result::Err(e) => print(f"failed: {e}"),
}
```

### 8.4 Pipeline with `Arc` Read Sharing

```adesh
share let config: Share<Config> = share Config { host: "localhost", port: 8080 };
let workers: [JoinHandle<()>] = [];
for _ in range(0, 4) {
    let cfg = config.clone();
    workers.push(spawn(async move {
        let data = await fetch_payload(f"https://{cfg.host}:{cfg.port}");
        print(data);
    }));
}
for w in workers { await w; }
```

---

## 9. Compilation Model & Source References

```
Source: async fn foo() { await bar(); }
       |
       v
Lexer (src/parsing/lexer.rs: "async", "await", "spawn")
       |
       v
Parser --> Function { is_async: true, body } (src/parsing/ast.rs:738-761)
        --> ExprKind::Await, ExprKind::Spawn
       |
       v
HIR Lower (src/parsing/hir_lower.rs) --> async state machine struct + poll dispatch
       |
       v
Closure Capture (src/parsing/closure_capture.rs) --> captures for async move blocks
       |
       v
Escape Analysis (src/parsing/escape_analysis.rs) --> ensures borrows don't escape suspended state
       |
       v
Codegen (src/backends/*) --> state machine as heap struct; waker = callback
       |
       v
Runtime (src/execution, Value::Promise(u64), BuiltinEnv::NativeEffect)
         --> executor poll loop, epoll/kqueue/IOCP waker, work-stealing deque
         --> Arc/Mutex/RwLock via Share/Weak + atomic futex
```

Interpreter microtasks: `NativeEffect::EnqueueMicrotask(Box<dyn FnOnce(&mut dyn InterpreterEnv)>)` queues waker callbacks to run between poll rounds.

---

## 10. Best Practices

1. Never block inside `async fn` — use `await` on I/O futures or `spawn_blocking` for CPU/heavy sync work.
2. Keep `Mutex` critical sections short and never hold across `await`; scope guards with `{ let g = m.lock(); ... }`.
3. Clone `Arc` before `spawn(async move { ... })`; do not borrow locals across spawn unless they live long enough (`'static` or `Share`).
4. Prefer `join` over sequential `await` in loops when tasks are independent — enables true concurrency.
5. Use `defer` inside `async fn` for guard cleanup; defers survive suspensions.
6. Monitor executor metrics: poll counts, steal rates, and Pending/Ready ratios via `adesh --trace-async`.
