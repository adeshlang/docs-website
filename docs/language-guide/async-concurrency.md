---
id: async-concurrency
title: Concurrency, Threads & Channels
sidebar_label: Concurrency & Threads
description: Multi-threading, message passing with channels, shared state with Arc/Mutex, and compile-time data race safety in AdeshLang.
---

# Concurrency, Threads & Channels

AdeshLang provides **fearless concurrency**: compile-time guarantees that eliminate data races, null pointer dereferences, and use-after-free bugs across multi-threaded applications without requiring a garbage collector.

```
┌───────────────────────────────────────────────────────────┐
│                    Concurrency Models                     │
├─────────────────────────────┬─────────────────────────────┤
│   Message Passing Channels  │  Thread-Safe Shared State   │
│  (mpsc::channel send/recv)  │   (Arc<T> + Mutex/RwLock)   │
└─────────────────────────────┴─────────────────────────────┘
```

---

## 1. Spawning Native OS Threads

Use `adesh_std::thread::spawn` to launch concurrent operating system threads:

```adesh
import { adesh_std::thread } from "adesh_std";

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            print(f"Background thread step {i}");
            thread::sleep_ms(100);
        }
        return 42;
    });

    print("Main thread working...");
    
    // Wait for the background thread to finish and retrieve return value
    let result = handle.join().unwrap();
    print(f"Thread finished with result: {result}");
}
```

---

## 2. Message Passing with Channels

Channels provide safe communication between threads using the **producer-consumer model**:

```adesh
import { adesh_std::sync::mpsc } from "adesh_std";
import { adesh_std::thread } from "adesh_std";

fn main() {
    // Create a multi-producer, single-consumer channel
    let (sender, receiver) = mpsc::channel<string>();

    // Spawn producer thread 1
    let s1 = sender.clone();
    thread::spawn(move || {
        s1.send("Message from Worker 1").unwrap();
    });

    // Spawn producer thread 2
    let s2 = sender.clone();
    thread::spawn(move || {
        s2.send("Message from Worker 2").unwrap();
    });

    // Drop original sender so receiver knows when all channels close
    drop(sender);

    // Consume messages in main thread
    for msg in receiver {
        print(f"Main received: {msg}");
    }
}
```

---

## 3. Shared State with `Arc<T>` and `Mutex<T>`

When multiple threads must read and write to the same shared data, use **Atomic Reference Counting (`Arc`)** combined with a mutual exclusion lock (`Mutex`):

```adesh
import { adesh_alloc::Arc } from "adesh_alloc";
import { adesh_std::sync::Mutex } from "adesh_std";
import { adesh_std::thread } from "adesh_std";

fn main() {
    // Wrap counter in Mutex and Arc
    let counter = Arc::new(Mutex::new(0));
    let mut handles = [];

    for _ in 0..10 {
        let counter_ref = counter.clone(); // 2ns atomic clone
        
        let handle = thread::spawn(move || {
            for _ in 0..1000 {
                let mut guard = counter_ref.lock().unwrap();
                *guard += 1;
                // Mutex guard is automatically unlocked when dropped!
            }
        });
        
        handles.push(handle);
    }

    // Wait for all 10 worker threads to finish
    for handle in handles {
        handle.join().unwrap();
    }

    print(f"Final counter value: {*counter.lock().unwrap()}"); // Expected: 10,000
}
```

---

## 4. Atomic Types for Lock-Free Concurrency

For high-throughput primitive operations without lock contention, use atomic types:

```adesh
import { adesh_std::sync::atomic::{AtomicI64, Ordering} } from "adesh_std";
import { adesh_alloc::Arc } from "adesh_alloc";

fn main() {
    let requests = Arc::new(AtomicI64::new(0));
    
    let r = requests.clone();
    thread::spawn(move || {
        r.fetch_add(1, Ordering::SeqCst);
    });

    print(f"Total requests: {requests.load(Ordering::SeqCst)}");
}
```

---

## 5. Compile-Time Data Race Prevention (`Send` & `Sync`)

The AdeshLang compiler analyzes types to ensure thread safety at compile time:

- **`Send`**: Indicates ownership of a value can be transferred safely across thread boundaries.
- **`Sync`**: Indicates multiple threads can safely reference the value concurrently (`&T`).

```adesh
// Non-thread-safe reference counting (Rc) is NOT Send/Sync:
let rc = Rc::new(100);

// COMPILE ERROR: `Rc<i32>` cannot be sent between threads safely.
// Hint: Use `Arc<T>` for multi-threaded reference counting.
thread::spawn(move || {
    print(*rc);
});
```
