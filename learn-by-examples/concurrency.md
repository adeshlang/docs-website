---
id: concurrency
title: Async & Concurrency
sidebar_label: Async & Concurrency
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Async & Concurrency

<FeatureStatus status="STABLE" details="Non-blocking async/await promises, multi-threaded worker pools, and Parallel data iteration" />

AdeshLang provides single-threaded non-blocking asynchronous routines (`async`/`await`) alongside multi-threaded data parallel operations (`Parallel` module).

---

## 1. Asynchronous Functions & Promises (`async`, `await`)

`async fn` defines non-blocking routines that suspend execution with `await` without locking the main execution thread.

### Code Example

```adesh
async fn fetchUser(userId: i32) {
    print("  [Async] Fetching user payload for ID:", userId);
    return { id: userId, username: "user_" + string(userId) };
}

async fn fetchUserPosts(userId: i32) {
    print("  [Async] Fetching posts for user ID:", userId);
    return ["Post 1", "Post 2", "Post 3"];
}

async fn main() {
    print("Starting async pipeline...");
    
    let user = await fetchUser(42);
    print("User fetched -> Username:", user.username);

    let posts = await fetchUserPosts(user.id);
    print("Posts fetched -> Count:", posts.len());
}

await main();
```

### Terminal Output

```text
Starting async pipeline...
  [Async] Fetching user payload for ID: 42
User fetched -> Username: user_42
  [Async] Fetching posts for user ID: 42
Posts fetched -> Count: 3
```

### Breakdown

* **`async fn`**: Wraps function return values in asynchronous promises.
* **`await promise`**: Suspends routine execution until the promise resolves.

---

## 2. Multi-Threaded Parallel Data Operations (`Parallel.map`, `Parallel.forEach`)

The `Parallel` standard module partitions array operations across OS worker thread pools for CPU-bound computations.

### Code Example

```adesh
import Parallel;

fn heavySquare(x: i32): i32 {
    return x * x;
}

let numbers = [1, 2, 3, 4, 5, 6, 7, 8];

// 1. Parallel.map over array
let squared = Parallel.map(numbers, heavySquare);
print("Parallel map squared:", squared);

// 2. Parallel.forEach over index range
Parallel.forEach(0, 4, fn(workerId) {
    print("Parallel worker active on core slot:", workerId);
});
```

### Terminal Output

```text
Parallel map squared: [1, 4, 9, 16, 25, 36, 49, 64]
Parallel worker active on core slot: 0
Parallel worker active on core slot: 1
Parallel worker active on core slot: 2
Parallel worker active on core slot: 3
```

### Breakdown

* **`Parallel.map(array, worker_fn)`**: Spreads array items across hardware threads, running `worker_fn` concurrently.
* **`Parallel.forEach(start, end, fn)`**: Multithreaded range iterator executing closures in parallel.
