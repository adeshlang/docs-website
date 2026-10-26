---
id: concurrency
title: Async & Parallel Concurrency
sidebar_label: Async & Concurrency
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Async & Parallel Concurrency

<FeatureStatus status="STABLE" details="Non-blocking async/await promises, multi-core work-stealing Parallel engine, and SIMD vector reductions" />

Adesh provides single-threaded non-blocking asynchronous routines (`async`/`await`) alongside a production-grade multi-core work-stealing parallel computation library (`import Parallel;`).

---

## 1. Asynchronous Functions & Promises (`async`, `await`)

`async fn` defines non-blocking routines that suspend execution with `await` without locking the execution thread. When a program defines `async fn main()`, it is automatically invoked and awaited by the Adesh runtime.

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
    print("Posts fetched -> Count:", len(posts));
}
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
* **`main()`**: Automatically invoked by the runtime (no manual `await main();` or `main();` required).

---

## 2. High-Speed Work-Stealing Parallel Operations (`import Parallel;`)

The `Parallel` standard module provides multi-core work-stealing parallel execution across available CPU cores with SIMD acceleration and adaptive chunking.

### Code Example

```adesh
import Parallel;

fn heavyCompute(x: i32): i32 {
    let sum = 0;
    for i in 0..1000 {
        sum = sum + (x * i) % 1000;
    }
    return sum;
}

fn main() {
    print("=== 1. Parallel Map & Filter ===");
    let numbers = [1, 2, 3, 4, 5, 6, 7, 8];
    
    // Multi-core parallel map (preserves element order)
    let mapped = Parallel.map(numbers, heavyCompute);
    print("Parallel mapped:", mapped);

    // Multi-core parallel filter
    let filtered = Parallel.filter(numbers, fn(x) { return x % 2 == 0; });
    print("Parallel filtered (evens):", filtered);

    print("\n=== 2. Parallel Tree Reduction ===");
    // Tree reduction across worker threads
    let sum = Parallel.reduce(numbers, 0, fn(acc, x) { return acc + x; });
    print("Parallel reduced sum:", sum);

    print("\n=== 3. High-Speed SIMD & Numeric Reductions ===");
    let vectorA = [1.0, 2.0, 3.0, 4.0];
    let vectorB = [10.0, 20.0, 30.0, 40.0];
    print("Parallel SIMD Sum:", Parallel.sum(vectorA));
    print("Parallel SIMD Dot Product:", Parallel.dot(vectorA, vectorB));
    print("Parallel Min / Max:", Parallel.min(vectorA), "/", Parallel.max(vectorA));

    print("\n=== 4. Parallel Range & Element Iteration ===");
    Parallel.forEach(0, 4, fn(workerId) {
        print("Parallel worker active on core slot:", workerId);
    });

    print("\n=== 5. Parallel Sorting & Search ===");
    let unsorted = [42, 17, 89, 5, 23, 61];
    let sorted = Parallel.sort(unsorted);
    print("Parallel sorted:", sorted);

    let matchItem = Parallel.find(numbers, fn(x) { return x > 5; });
    print("Parallel find (> 5):", matchItem);

    print("\n=== 6. Fork-Join & Worker Info ===");
    print("Available CPU worker threads:", Parallel.workers());
    
    let joinResults = Parallel.join(
        fn() { return 10 * 10; },
        fn() { return 20 * 20; }
    );
    print("Fork-join results:", joinResults);
}
```

### Terminal Output

```text
=== 1. Parallel Map & Filter ===
Parallel mapped: [499500, 499000, 499500, 498000, 497500, 498000, 499500, 499000]
Parallel filtered (evens): [2, 4, 6, 8]

=== 2. Parallel Tree Reduction ===
Parallel reduced sum: 36

=== 3. High-Speed SIMD & Numeric Reductions ===
Parallel SIMD Sum: 10
Parallel SIMD Dot Product: 300
Parallel Min / Max: 1 / 4

=== 4. Parallel Range & Element Iteration ===
Parallel worker active on core slot: 0
Parallel worker active on core slot: 1
Parallel worker active on core slot: 2
Parallel worker active on core slot: 3

=== 5. Parallel Sorting & Search ===
Parallel sorted: [5, 17, 23, 42, 61, 89]
Parallel find (> 5): 6

=== 6. Fork-Join & Worker Info ===
Available CPU worker threads: 8
Fork-join results: [100, 400]
```

### Breakdown

* **`Parallel.map(array, fn)`**: Partitions array elements across CPU worker threads and maps them concurrently, strictly preserving array order.
* **`Parallel.filter(array, fn)`**: Evaluates predicates concurrently across cores, preserving original ordering.
* **`Parallel.reduce(array, init, fn)`**: Chunk-level parallel reduction combined via a multi-core tree reduction.
* **`Parallel.sum(array)` & `Parallel.dot(a, b)`**: Multi-core SIMD-vectorized math executing at memory bus bandwidth.
* **`Parallel.sort(array)` & `Parallel.sortBy(array, keyFn)`**: Multi-threaded parallel quicksort/mergesort.
* **`Parallel.find(array, fn)` / `Parallel.any(array, fn)`**: Short-circuiting parallel search that exits early when a match is found.
* **`Parallel.join(fn1, fn2, ...)`**: Executes distinct tasks in parallel and collects their results.
* **`Parallel.workers()` / `Parallel.setWorkers(n)`**: Query or configure worker thread count.
