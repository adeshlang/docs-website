---
id: concurrency
title: Standard Concurrency Module (stdlib/concurrency)
sidebar_label: Concurrency
description: High-performance concurrency primitives including threads, channels, mutexes, condition variables, and worker pools.
---

# Concurrency Module (`stdlib/concurrency`)

The `concurrency` standard module provides low-level operating system thread primitives, lock-free synchronization, and message-passing channels. It is the foundation for parallel computation in Adesh — from simple `spawn`/`join` to bounded channels with backpressure and reader-writer locks.

```
┌───────────────────────────────────────────────────────────┐
│                    concurrency Module                     │
├───────────────────────┬───────────────────────────────────┤
│    Thread Management  │ • spawn, join, sleep, yield_now   │
│    Message Passing    │ • channel (unbounded mpsc)        │
│                       │ • sync_channel (bounded, blocking)│
│    Locks & Sync       │ • Mutex, RwLock, Condvar, Barrier │
│    Lock-free Atomics  │ • AtomicBool, AtomicI64, Ordering │
│    Scheduling         │ • scheduler, worker pool, steal   │
└───────────────────────┴───────────────────────────────────┘
```

---

## Architecture Diagram — Threads, Channels, and Locks

```
  Adesh Code
     │
     ▼
 ┌─────────────┐       ┌─────────────────┐       ┌──────────────┐
 │  spawn(|| {})│──────►│  OS Thread      │──────►│ JoinHandle<T>│
 └─────────────┘       │  (native)       │       │  .join()     │
                       └────────┬────────┘       └──────────────┘
                                │
               ┌────────────────┼────────────────┐
               ▼                ▼                ▼
         ┌──────────┐    ┌──────────┐     ┌──────────┐
         │ Mutex<T> │    │ RwLock<T>│     │ Barrier  │
         │ lock()   │    │ read()   │     │ wait()   │
         │ unlock*  │    │ write()  │     └──────────┘
         └────┬─────┘    └────┬─────┘
              │               │
              ▼               ▼
         guarded data    guarded data

  Channel path:

  Sender ──send()──►┌──────────────┐──recv()──► Receiver
                    │ Channel Queue │
  Clone(Sender) ──► │ (mpsc, FIFO) │           (single consumer)
                    └──────────────┘
                    bounded: sync_channel(n) blocks when full
                    unbounded: channel() never blocks sender
```

`*` Unlock is automatic via RAII guard drop — no manual `unlock()` needed.

---

## 1. Native Thread Spawning & Scheduler

### `spawn`

```adesh
import { spawn, sleep_ms, Thread } from "stdlib/concurrency";

fn main() {
    let handle = spawn(|| {
        print("Worker thread started.");
        sleep_ms(250);
        return 100 * 2;
    });

    let result = handle.join().unwrap();
    print(f"Worker finished with: {result}"); // 200
}
```

| Function | Signature | Description |
|---|---|---|
| `spawn(closure)` | `fn spawn<F, T>(f: F): JoinHandle<T>` | Spawns a new native OS thread. Closure may capture via `move`. |
| `sleep_ms(ms)` | `fn sleep_ms(ms: u64)` | Parks current thread for `ms` milliseconds. |
| `yield_now()` | `fn yield_now()` | Yields execution to the scheduler. |
| `current_thread_id()` | `fn current_thread_id(): u64` | Returns OS thread identifier. |

### `JoinHandle`

| Method | Description |
|---|---|
| `handle.join()` | Blocks until thread finishes; returns `Result<T, String>` (`Ok(value)` or `Err(panic_message)`). |
| `handle.isFinished()` | Non-blocking poll; `true` if thread has terminated. |
| `handle.threadId()` | ID of the spawned thread. |

### Scheduler Internals

Adesh's concurrency runtime sits on top of the OS scheduler — no green threads. Each `spawn` is a `std::thread::spawn` under the hood, with a worker-pool extension for `parallel_*` helpers.

```
spawn(|| work)
  → OS thread created (pthread / Win32 thread)
  → closure runs to completion
  → return value stored in JoinHandle channel
  → join() retrieves it (blocks) or isFinished() polls
```

For CPU-bound fan-out, prefer the scheduler's worker pool (see section 6).

---

## 2. Multi-Producer Single-Consumer (MPSC) Channels

Channels allow multiple threads to communicate by transmitting typed messages. They are the idiomatic way to share data between threads without explicit locking.

### Unbounded Channel

```adesh
import { channel, spawn } from "stdlib/concurrency";

fn main() {
    // Create unbounded channel
    let (tx, rx) = channel<string>();

    for i in 1..=3 {
        let tx_clone = tx.clone();
        spawn(move || {
            tx_clone.send(f"Task {i} complete").unwrap();
        });
    }
    drop(tx); // Close root sender — receiver will terminate after queue drains

    // Receive all messages (blocks until sender closed + queue empty)
    while let Ok(msg) = rx.recv() {
        print(f"Received: {msg}");
    }
}
```

### Bounded Channel (Backpressure)

```adesh
import { sync_channel, spawn } from "stdlib/concurrency";

let (tx, rx) = sync_channel<i32>(2); // capacity 2 — third send blocks

spawn(move || {
    for i in 0..5 {
        tx.send(i).unwrap(); // blocks when buffer full until receiver consumes
        print(f"Sent {i}");
    }
});

for _ in 0..5 {
    let v = rx.recv().unwrap();
    print(f"Got {v}");
}
```

### Channel API

| Function / Method | Signature | Description |
|---|---|---|
| `channel<T>()` | `fn channel<T>(): (Sender<T>, Receiver<T>)` | Unbounded FIFO channel; sender never blocks. |
| `sync_channel<T>(n)` | `fn sync_channel<T>(bound: usize): (SyncSender<T>, Receiver<T>)` | Bounded channel with capacity `n`; `send` blocks when full. |
| `Sender.send(val)` | `fn send(val: T): Result<(), SendError>` | Enqueue value; fails if receiver dropped. |
| `Sender.clone()` | `fn clone(): Sender<T>` | Clone sender for multi-producer. |
| `Receiver.recv()` | `fn recv(): Result<T, RecvError>` | Blocking receive; `Err` when all senders dropped and queue empty. |
| `Receiver.tryRecv()` | `fn try_recv(): Result<T, TryRecvError>` | Non-blocking poll: `Ok(val)`, `Err(Empty)`, or `Err(Disconnected)`. |
| `Receiver.recvTimeout(ms)` | `fn recv_timeout(ms: u64): Result<T, RecvError>` | Blocking receive with timeout. |
| `drop(sender)` / `drop(receiver)` | — | Closing a sender/receiver signals disconnect. |

### Channel Semantics

```
Sender ──► [queue: FIFO] ──► Receiver
  │              │               │
 clone()    bounded: blocks   recv() blocks until data or disconnect
            unbounded: never   tryRecv() never blocks
```

- **MPSC**: many `Sender` clones, one `Receiver`. Cloning the receiver is an error.
- **Disconnect**: when all `Sender`s are dropped, `recv()` returns `Err` after draining. When `Receiver` is dropped, `send()` returns `Err`.
- **Ordering**: FIFO within a single sender; interleaving across senders is non-deterministic.

---

## 3. Mutual Exclusion — `Mutex<T>` & `RwLock<T>`

Mutex and RwLock guard shared data. The lock is held via a **guard object** that releases automatically when it goes out of scope (RAII).

```adesh
import { Mutex, RwLock, Arc } from "stdlib/concurrency";

// Mutex: single writer, single reader (exclusive)
let shared_data = Arc::new(Mutex::new(0));

{
    let lock = shared_data.lock().unwrap(); // blocks until acquired
    *lock += 10;
} // guard dropped here → automatically unlocked

// RwLock: many concurrent readers OR one exclusive writer
let config = Arc::new(RwLock::new("read-only-config"));

{
    let read_guard1 = config.read().unwrap();
    let read_guard2 = config.read().unwrap(); // multiple concurrent reads allowed
    print(*read_guard1);
} // both read guards dropped

{
    let write_guard = config.write().unwrap(); // exclusive — blocks if readers exist
    *write_guard = "new-config";
}
```

### Mutex API

| Method | Signature | Description |
|---|---|---|
| `Mutex: new(val)` | `fn new(val: T): Mutex<T>` | Create a mutex wrapping `val`. |
| `mutex.lock()` | `fn lock(): Result<MutexGuard<T>, PoisonError>` | Acquire exclusive lock; blocks. Returns guard deref to `T`. |
| `mutex.tryLock()` | `fn try_lock(): Result<MutexGuard<T>, TryLockError>` | Non-blocking attempt; `Err(WouldBlock)` if busy. |
| `guard` deref | `*guard`, `*guard = val` | Read/write the guarded value through the guard. |

### RwLock API

| Method | Signature | Description |
|---|---|---|
| `RwLock: new(val)` | `fn new(val: T): RwLock<T>` | Create a reader-writer lock. |
| `rwlock.read()` | `fn read(): Result<RwLockReadGuard<T>, PoisonError>` | Shared read lock; many readers can hold it concurrently. |
| `rwlock.write()` | `fn write(): Result<RwLockWriteGuard<T>, PoisonError>` | Exclusive write lock; blocks until all readers/writers released. |
| `rwlock.tryRead()` / `tryWrite()` | — | Non-blocking variants. |

### Poisoning

If a thread panics while holding a `Mutex`/`RwLock`, the lock becomes **poisoned**. Subsequent `lock()` calls return `Err(PoisonError)` containing the guard if you still want to access the data. Use `unwrap()` to propagate the panic or handle explicitly.

### Arc + Mutex Pattern

`Arc` (atomic reference count) is required to share a `Mutex`/`RwLock` across threads — each thread gets a cloned `Arc` pointing to the same lock:

```adesh
let counter = Arc::new(Mutex::new(0));
let c1 = counter.clone();
let h1 = spawn(move || { *c1.lock().unwrap() += 1; });
let c2 = counter.clone();
let h2 = spawn(move || { *c2.lock().unwrap() += 1; });
h1.join(); h2.join();
print(*counter.lock().unwrap()); // 2
```

---

## 4. Additional Synchronization Primitives

| Primitive | Constructor | Key Methods | Description |
|---|---|---|---|
| `Barrier` | `Barrier::new(n)` | `wait()` | Synchronizes `n` threads at a rendezvous point; all block until the `n`th arrives, then all proceed. |
| `Condvar` | `Condvar::new()` | `wait(mutexGuard)`, `notifyOne()`, `notifyAll()` | Condition variable — atomically releases a `Mutex` and waits for notification. |
| `Once` | `Once::new()` | `callOnce(fn)` | Ensures `fn` runs exactly once across all threads. |
| `AtomicBool` / `AtomicI64` | `AtomicBool::new(val)` | `load(order)`, `store(val, order)`, `compareExchange(exp, val, order)` | Lock-free atomics with `Ordering` (`Relaxed`, `Acquire`, `Release`, `AcqRel`, `SeqCst`). |

### Barrier Example

```adesh
import { Barrier, spawn, Arc } from "stdlib/concurrency";

let barrier = Arc::new(Barrier::new(3));
for i in 0..3 {
    let b = barrier.clone();
    spawn(move || {
        print(f"Thread {i} before barrier");
        b.wait();
        print(f"Thread {i} after barrier");
    });
}
```

### Condvar Example

```adesh
import { Mutex, Condvar, spawn, Arc } from "stdlib/concurrency";

let pair = Arc::new((Mutex::new(false), Condvar::new()));
let p2 = pair.clone();
spawn(move || {
    let (lock, cvar) = p2;
    let mut started = lock.lock().unwrap();
    *started = true;
    cvar.notifyOne();
});

let (lock, cvar) = pair;
let mut started = lock.lock().unwrap();
while !*started { started = cvar.wait(started).unwrap(); }
print("Worker started");
```

---

## 5. Error Handling

| Error | When | How to Handle |
|---|---|---|
| `SendError` | `send()` after receiver dropped | Check `isDisconnected()`, recreate channel |
| `RecvError::Disconnected` | `recv()` after all senders dropped + queue empty | Break receive loop |
| `TryRecvError::Empty` | `tryRecv()` with no pending messages | Retry or `sleep_ms` |
| `PoisonError` | `lock()` after holder panicked | `unwrap()` to propagate or `intoInner()` to recover |
| `WouldBlock` | `tryLock()` / `tryRead()` when busy | Backoff loop or `lock()` blocking |

```adesh
let res = rx.recv();
if (res.isErr()) {
    print("Channel closed");
}

let guard = mutex.lock();
if (guard.isErr()) {
    print("Mutex poisoned — recovering");
    let inner = guard.unwrapErr().intoInner();
}
```

---

## 6. High-Speed Work-Stealing Parallel Engine (`import Parallel;`)

For CPU-bound operations across multiple cores, Adesh provides the `Parallel` module backed by a Rayon work-stealing thread pool and SIMD vectorization:

```adesh
import Parallel;

// Number of scheduler workers (typically num_cpus)
print(Parallel.workers()); // e.g., 8

let xs = [1, 2, 3, 4, 5, 6, 7, 8];

// 1. Parallel Map (preserves order)
let doubled = Parallel.map(xs, fn(x) { return x * 2; });
print(doubled); // [2, 4, 6, 8, 10, 12, 14, 16]

// 2. Parallel Filter
let evens = Parallel.filter(xs, fn(x) { return x % 2 == 0; });
print(evens); // [2, 4, 6, 8]

// 3. Parallel Tree Reduction
let total = Parallel.reduce(xs, 0, fn(acc, x) { return acc + x; });
print(total); // 36

// 4. Multi-Core SIMD Reductions
print("SIMD Sum:", Parallel.sum(xs)); // 36
print("SIMD Dot:", Parallel.dot(xs, xs)); // 204

// 5. Parallel For Range & ForEach
Parallel.forEach(0, 4, fn(i) {
    print("Parallel worker active:", i);
});
```

| Method | Description |
|---|---|
| `Parallel.map(arr, fn)` | Concurrent mapping across CPU cores with order preservation. |
| `Parallel.flatMap(arr, fn)` | Parallel map followed by array flattening. |
| `Parallel.filter(arr, fn)` | Concurrent predicate evaluation with preserved element ordering. |
| `Parallel.reduce(arr, init, fn)` | Parallel chunked tree reduction. |
| `Parallel.forEach(start, end, fn)` | Multithreaded range iteration. |
| `Parallel.forEach(arr, fn)` | Multithreaded array iteration. |
| `Parallel.for(start, end, [step,] fn)` | Range-based parallel loop with custom step. |
| `Parallel.find(arr, fn)` | Short-circuiting parallel element search. |
| `Parallel.findIndex(arr, fn)` | Short-circuiting parallel index search. |
| `Parallel.any(arr, fn)` / `Parallel.all(arr, fn)` | Short-circuiting boolean predicates. |
| `Parallel.sort(arr)` / `Parallel.sortBy(arr, keyFn)` | Multi-core parallel sorting. |
| `Parallel.sum(arr)` / `Parallel.product(arr)` | Multi-core SIMD-accelerated sum and product. |
| `Parallel.min(arr)` / `Parallel.max(arr)` / `Parallel.mean(arr)` | Multi-core min, max, and mean reductions. |
| `Parallel.dot(arrA, arrB)` | Multi-core SIMD vector dot product. |
| `Parallel.join(fn1, fn2, ...)` | Fork-join concurrent execution of multiple tasks. |
| `Parallel.scope(fn(scope))` | Scoped task spawning with automatic completion barrier. |
| `Parallel.workers()` / `Parallel.setWorkers(n)` | Query or configure active worker threads. |

The scheduler uses Rayon work-stealing — idle workers steal tasks dynamically from busy workers' queues, eliminating tail latency and scaling linearly with CPU core count.

---

## 7. Complete Example — Pipeline with Channels, Mutex, and Barrier

```adesh
import { channel, Mutex, Barrier, spawn, Arc } from "stdlib/concurrency";

// Shared counter + barrier to synchronize startup
let counter = Arc::new(Mutex::new(0));
let barrier = Arc::new(Barrier::new(4)); // 3 workers + main
let (tx, rx) = channel<string>();

for i in 1..=3 {
    let tx2 = tx.clone();
    let c2 = counter.clone();
    let b2 = barrier.clone();
    spawn(move || {
        b2.wait(); // all threads start together
        {
            let mut g = c2.lock().unwrap();
            *g += 1;
        }
        tx2.send(f"Worker {i} done").unwrap();
    });
}
drop(tx);
barrier.wait(); // release workers

let totalMsgs = 0;
while let Ok(msg) = rx.recv() {
    print(msg);
    totalMsgs += 1;
}
print(f"Total messages: {totalMsgs}");
print(f"Counter: {*counter.lock().unwrap()}");
```

---

## 8. API Reference — Full Table

| Function / Struct | Signature | Description |
|---|---|---|
| `spawn(closure)` | `fn spawn<F, T>(f: F): JoinHandle<T>` | Spawns a new native OS thread. |
| `sleep_ms(ms)` | `fn sleep_ms(ms: u64)` | Parks current thread for `ms` ms. |
| `yield_now()` | `fn yield_now()` | Yields to scheduler. |
| `channel<T>()` | `fn channel<T>(): (Sender<T>, Receiver<T>)` | Unbounded MPSC channel. |
| `sync_channel<T>(n)` | `fn sync_channel<T>(bound: usize): (SyncSender<T>, Receiver<T>)` | Bounded channel with backpressure. |
| `Mutex: new(val)` | `fn new(val: T): Mutex<T>` | Mutual exclusion lock wrapping `val`. |
| `RwLock: new(val)` | `fn new(val: T): RwLock<T>` | Reader-writer lock wrapping `val`. |
| `Barrier: new(n)` | `fn new(n: usize): Barrier` | Rendezvous barrier for `n` threads. |
| `Condvar: new()` | `fn new(): Condvar` | Condition variable (pairs with `Mutex`). |
| `AtomicBool: new(v)` | `fn new(v: bool): AtomicBool` | Lock-free boolean. |
| `AtomicI64: new(v)` | `fn new(v: i64): AtomicI64` | Lock-free 64-bit integer. |
| `Arc: new(val)` | `fn new(val: T): Arc<T>` | Atomic ref-counted shared ownership. |
| `workers()` | `fn workers(): usize` | Worker pool size. |

---

## 9. When to Use What

| Need | Use |
|---|---|
| One-off background work | `spawn` + `join` |
| Producer/consumer pipeline | `channel` / `sync_channel` |
| Shared mutable state | `Arc<Mutex<T>>` |
| Many readers, few writers | `Arc<RwLock<T>>` |
| Rendezvous / phase sync | `Barrier` |
| Wait for condition | `Condvar` + `Mutex` |
| Lock-free flag/counter | `AtomicBool` / `AtomicI64` |
| Data-parallel map/filter | `parallel_map` / `parallel_filter` |

## Related

- [Collections (Vec, Queue, etc.)](/docs/builtin/collections) — data structures used inside concurrent code
- [Async & Concurrency (language guide)](/docs/language-guide/async-concurrency) — `async`/`await` vs threads
- Source: `src/runtime/stdlib_src/concurrency/` and `src/runtime/scheduler/`
