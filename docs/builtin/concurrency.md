---
id: concurrency
title: Standard Concurrency Module (stdlib/concurrency)
sidebar_label: Concurrency
description: High-performance concurrency primitives including threads, channels, mutexes, condition variables, and worker pools.
---

# Concurrency Module (`stdlib/concurrency`)

The `concurrency` standard module provides low-level operating system thread primitives, lock-free synchronization, and message-passing channels.

```
┌───────────────────────────────────────────────────────────┐
│                    concurrency Module                     │
├───────────────────────┬───────────────────────────────────┤
│    Thread Management  │ • spawn, join, sleep, yield_now   │
│    Message Passing    │ • channel (bounded/unbounded mpsc)│
│    Locks & Sync       │ • Mutex, RwLock, Condvar, Barrier │
│    Lock-free Atomics  │ • AtomicBool, AtomicI64, Ordering │
└───────────────────────┴───────────────────────────────────┘
```

---

## 1. Native Thread Spawning

```adesh
import { spawn, sleep_ms, Thread } from "stdlib/concurrency";

fn main() {
    let handle = spawn(|| {
        print("Worker thread started.");
        sleep_ms(250);
        return 100 * 2;
    });

    let result = handle.join().unwrap();
    print(f"Worker finished with: {result}");
}
```

---

## 2. Multi-Producer Single-Consumer (MPSC) Channels

Channels allow multiple threads to communicate by transmitting typed messages:

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
    drop(tx); // Close root sender

    // Receive all messages
    while let Ok(msg) = rx.recv() {
        print(f"Received: {msg}");
    }
}
```

---

## 3. Mutual Exclusion (`Mutex<T>`) & Read-Write Locks (`RwLock<T>`)

```adesh
import { Mutex, RwLock, Arc } from "stdlib/concurrency";

// Mutex: Single writer, single reader
let shared_data = Arc::new(Mutex::new(0));

{
    let lock = shared_data.lock().unwrap();
    *lock += 10;
} // Automatically unlocked here!

// RwLock: Multiple concurrent readers OR single exclusive writer
let config = Arc::new(RwLock::new("read-only-config"));

{
    let read_guard1 = config.read().unwrap();
    let read_guard2 = config.read().unwrap(); // Multiple concurrent reads allowed
    print(*read_guard1);
}
```

---

## 4. API Reference

| Function / Struct | Signature | Description |
|-------------------|-----------|-------------|
| `spawn(closure)` | `fn spawn<F, T>(f: F) -> JoinHandle<T>` | Spawns a new native OS thread. |
| `sleep_ms(ms)` | `fn sleep_ms(ms: u64)` | Pauses the current thread for `ms` milliseconds. |
| `channel<T>()` | `fn channel<T>() -> (Sender<T>, Receiver<T>)` | Creates an asynchronous unbounded channel. |
| `sync_channel<T>(n)`| `fn sync_channel<T>(bound: usize) -> (SyncSender<T>, Receiver<T>)` | Creates a bounded channel with backpressure. |
| `Mutex::new(val)` | `fn new(val: T) -> Mutex<T>` | Creates a mutual exclusion lock wrapping `val`. |
| `RwLock::new(val)`| `fn new(val: T) -> RwLock<T>` | Creates a reader-writer lock wrapping `val`. |
| `Barrier::new(n)` | `fn new(n: usize) -> Barrier` | Synchronizes multiple threads at a barrier. |
