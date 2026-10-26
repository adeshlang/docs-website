---
id: async-concurrency
title: Async, Concurrency & Parallelism
sidebar_label: 21. Async & Concurrency
---

# Async, Concurrency & Parallelism

Modern programs do many things at once: download files while painting a UI,
serve thousands of HTTP requests, process a million rows in parallel.
Adesh supports all three flavors — **threads**, **async/await**, and
**parallel iteration** — using the exact patterns from the examples
repository.

## Why concurrency matters

```text
Without concurrency:   read file  →  parse  →  respond  →  (idle)  →  next request
With concurrency:      read file 1 ──┐
                       read file 2 ──┼── parse 1 ── respond 1
                       read file 3 ──┘
```

Waiting on I/O (network, disk, timers) wastes time a program could spend doing
other work. Concurrency is how real servers handle thousands of users.

## Threads: `thread.spawn` and `join`

A **thread** is a separate path of execution. `spawn` runs a function on a new
thread; `join` waits for it and can get its return value:

```adesh
import thread;

let handle = thread.spawn(fn() {
    print("Hello from worker thread!");
    return 42;
});

print("Main thread continues...");
let result = handle.join();
print("Worker returned:", result);

// Hello from worker thread!
// Main thread continues...
// Worker returned: 42
```

**Output:**
```
Hello from worker thread!
Main thread continues...
Worker returned: 42
```
(order may vary)

From `examples/Libraries/concurrency/01_basic_thread.adesh` and `02_thread_join.adesh`.

## Passing messages with channels

A **channel** is a pipe between threads. The producer sends values; the
consumer receives them — no shared memory, no locks:

```adesh
import thread;

let pair = thread.Channel.bounded(8);
let tx = pair[0];   // sender
let rx = pair[1];   // receiver

thread.spawn(fn() {
    tx.send(42);
    tx.close();
}).join();

print(rx.recv().value);    // 42
```

**Output:**
```
42
```

That is `examples/Libraries/concurrency/12_channels.adesh` verbatim. The
producer-consumer version with 8 items and a sum is
`examples/Libraries/concurrency/20_producer_consumer.adesh`.

## Shared state with a mutex

When threads genuinely need to share and mutate data, protect it with a
**mutex** (mutual exclusion lock):

```adesh
import thread;

let mutex = thread.Mutex.new(0);
let t1 = thread.spawn(fn() { mutex.with(fn(v) { return v + 1; }); });
let t2 = thread.spawn(fn() { mutex.with(fn(v) { return v + 1; }); });
t1.join();
t2.join();

let g = mutex.lock();
print(g.value.get());      // 2  (both increments applied safely)
```

**Output:**
```
2
```

From `examples/Libraries/concurrency/06_mutex.adesh` and `05_shared_arc.adesh`.

## Atomics: lock-free counters

For simple counters, **atomics** are faster than locks:

```adesh
import thread;

let counter = thread.Atomic.AtomicI64.new(0);
let h1 = thread.spawn(fn() { counter.fetch_add(1); });
let h2 = thread.spawn(fn() { counter.fetch_add(1); });
h1.join();
h2.join();
print(counter.load());    // 2
```

**Output:**
```
2
```

From `examples/Libraries/concurrency/11_atomic_counter.adesh`.

## Thread pools & parallel iteration

Spawning a thread per tiny task is wasteful. A **thread pool** reuses worker
threads:

```adesh
import thread;

let pool = thread.ThreadPool.new(2);
let f = pool.submit(fn() { return 99; });
print(f.get());               // 99
pool.shutdown();
```

**Output:**
```
99
```

And for data-parallel work, Adesh includes the high-performance work-stealing `Parallel` module:

```adesh
import Parallel;

let out = Parallel.map([1, 2, 3, 4], fn(x) { return x * 2; });
print(out);                   // [2, 4, 6, 8]

let sum = Parallel.sum([10, 20, 30, 40]);
print(sum);                   // 100
```

**Output:**
```
[2, 4, 6, 8]
100
```

From `examples/Libraries/concurrency/parallel_ops.adesh`.

## Async/await: non-blocking single-threaded work

`async fn` starts a task and returns a **Promise** immediately; `await` waits
for it without blocking the whole thread (and `main` is auto-invoked):

```adesh
async fn fetchUser(id) {
    return "data_" + id;
}

async fn main() {
    let result = await fetchUser(123);
    print(result);              // data_123
}
```

**Output:**
```
data_123
```

`Promise.all` runs several tasks and waits for all:

```adesh
let pa = Promise(fn(resolve, reject) { resolve("A"); });
let pb = Promise(fn(resolve, reject) { resolve("B"); });
let pc = Promise(fn(resolve, reject) { resolve("C"); });

let all = await Promise.all([pa, pb, pc]);
print(all);                     // A B C
```

**Output:**
```
[A, B, C]
```

And `.then()` chains:

```adesh
let p = Promise(fn(resolve, reject) { resolve(10); });
let chained = p.then(fn(v) { return v * 2; }).then(fn(v) { return v + 5; });
print(await chained);           // 25
```

**Output:**
```
25
```

All of this is from `examples/async/full_async_demo.adesh`, which exercises
every async feature together.

## Choosing the right tool

| You want to… | Use |
|--------------|-----|
| Run a background task and collect its result | `thread.spawn` + `join` |
| Send data between threads safely | `Channel` |
| Protect shared mutable state | `Mutex` / `RwLock` |
| Count things very fast | `AtomicI64` |
| Reuse threads for many small tasks | `ThreadPool` |
| Transform a big array on all cores | `thread.parallel_map` |
| Wait on I/O without blocking the thread | `async fn` + `await` |
| Race several futures / add timeouts | `Promise.race`, `setTimeout` |

## The Fibonacci lesson

`examples/fib/` shows why you care about performance: naive recursion
(`fib_naive(35)`) is exponentially slow; iterative DP (`fib_dp`) is linear:

```adesh
fn fib_dp(n) {
    if (n <= 1) { return n; }
    let state = [0, 1];
    let i = 2;
    while (i <= n) {
        let next = state[0] + state[1];
        state = [state[1], next];
        i = i + 1;
    }
    return state[1];
}
```

Combine that with `--njit` to run the same code through the native JIT.

## Summary

✅ **You learned:**
- `thread.spawn` runs a function on a new thread; `join` waits for it
- `Channel` passes messages between threads
- `Mutex` and `Atomic` protect shared mutable state
- `ThreadPool` reuses workers; `parallel_map` transforms arrays across cores
- `async fn` + `await` do non-blocking I/O work
- `Promise.all`/`.then()` compose async tasks
- Choosing the right concurrency tool for the job

## Next Step

Now that programs do things, let's **prove** they do them correctly — the
built-in testing system. Continue to **[Testing](/learn/testing)** →
