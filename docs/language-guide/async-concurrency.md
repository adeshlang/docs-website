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

Functions annotated with `async` do not execute synchronously to completion. Instead, the compiler transforms an `async fn` into an anonymous **Stackless State Machine Struct**:

```adesh
async fn fetch_payload(url: string) -> Result<string, Error> {
    let connection = await connect(url)?;
    let response = await connection.get()?;
    return Ok(response.body);
}
```

### 1.1 Compiler State Machine Lowering
The compiler desugaring pass transforms the function body into an enum-like state machine struct storing local variables across suspension points:

```
[ Async State Machine Memory Layout ]
+-------------------------------------------------------+
|  Offset 0x00: Current State Tag (u32: 0, 1, 2, Complete)|
+-------------------------------------------------------+
|  Offset 0x08: Parameter 'url' (24-byte string header) |
+-------------------------------------------------------+
|  Offset 0x20: Future 1 'connection' (State 1 storage) |
+-------------------------------------------------------+
|  Offset 0x38: Future 2 'response'   (State 2 storage) |
+-------------------------------------------------------+
```

Each `await` boundary marks a state transition breakpoint.

---

## 2. Executor Poll Loop Semantics (`Poll::Ready` / `Poll::Pending`)

An `async` task implements a `poll(cx: &mut Context)` interface:

```adesh
enum Poll<T> {
    Ready(T),
    Pending,
}
```

### 2.1 Execution Poll Step
When a task executor polls an async state machine:
1. If the target operation is ready, `poll()` returns `Poll::Ready(value)` and advances the internal State Tag (`State_n -> State_(n+1)`).
2. If the operation would block (e.g., waiting for I/O socket readiness), `poll()` registers a `Waker` callback in the OS event loop (epoll / kqueue / IOCP) and returns `Poll::Pending`.
3. Execution returns immediately to the executor thread without blocking the CPU thread stack.

---

## 3. Multi-Threaded Work-Stealing Task Scheduler

Concurrent tasks spawned via `spawn(async move { ... })` are managed by a multi-threaded **Work-Stealing Task Scheduler**:

```
Global Shared Task Queue
[ Task_A ] [ Task_B ] [ Task_C ]
     |
     v
+------------------------+------------------------+
|  Worker Thread 0       |  Worker Thread 1       |
|  Local Queue: [Task_D] |  Local Queue: [Empty]  |
+------------------------+------------------------+
                             ^
                             | (Steals Task_D via Lock-Free Deque)
```

- Each worker thread maintains a local lock-free double-ended queue (deque).
- When a worker thread exhausts its local queue, it steals tasks from sibling worker queues, maintaining high CPU cache locality and balanced core utilization.

---

## 4. Synchronization Primitives & Atomic Layouts

### 4.1 `Arc<T>` Memory Layout (Atomically Reference Counted)
`Arc<T>` enables shared ownership of heap memory across threads:

```
Arc<T> Heap Allocation Layout
+-------------------------------------------------------+
| Offset 0x00: Strong Reference Count (Atomic u64)      |
+-------------------------------------------------------+
| Offset 0x08: Weak Reference Count   (Atomic u64)      |
+-------------------------------------------------------+
| Offset 0x10: Wrapped Value T                          |
+-------------------------------------------------------+
```

Reference increments (`Arc::clone`) and decrements execute via lock-free atomic hardware instructions (`lock xadd` on x86_64) using Sequential Consistency (`SeqCst`) memory barriers.

### 4.2 `Mutex<T>` Layout
`Mutex<T>` enforces exclusive mutual exclusion across threads:

```
Mutex<T> Memory Layout
+-------------------------------------------------------+
| Offset 0x00: OS Mutex Lock State (Atomic u32 / futex) |
+-------------------------------------------------------+
| Offset 0x04: Padding Bytes (4 Bytes)                  |
+-------------------------------------------------------+
| Offset 0x08: Inner Data Payload T                     |
+-------------------------------------------------------+
```

Acquiring a mutex lock compiles to an atomic Compare-And-Swap (`lock cmpxchg`) operation. If lock contention occurs, the calling thread is suspended via OS `futex` syscalls (`sys_futex` on Linux) to prevent CPU spinning.
