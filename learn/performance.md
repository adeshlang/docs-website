---
id: performance
title: Performance - Backends, JIT, and Benchmarking
sidebar_label: 26. Performance & Execution Backends
---

# Performance — Backends, JIT, and Benchmarking

Adesh's most distinctive feature is that the *same source code* runs on
multiple **execution targets** — the interpreter while you learn, and native
JIT, AOT, or WASM builds when you need more. This lesson shows what that means,
how to measure it, and where each target shines. While the native targets are
experimental, no speedup guarantees are published — measure on your own
hardware. Example programs live in
[`examples/fib/`](https://github.com/adeshlang/adeshlang/tree/main/examples/fib),
[`examples/backends/`](https://github.com/adeshlang/adeshlang/tree/main/examples/backends),
and [`examples/benchmarks/`](https://github.com/adeshlang/adeshlang/tree/main/examples/benchmarks).

## The execution targets

| Flag | Target | Use it when |
|------|--------|-------------|
| *(default)* | Interpreter | learning, quick runs |
| `--jit-native` | Native JIT | compute-heavy workloads |
| `adesh build` | AOT native compilation | production binaries |
| `--wasm` | WebAssembly | running in the browser |
| `--gpu` | GPU (planned) | parallel workloads, future release |

```
adesh run fib_dp.adesh              # interpreter
adesh run --jit-native fib_dp.adesh # native JIT
```

## Measuring time with `clock()`

```adesh
let start = clock();
// ... work ...
let elapsed = clock() - start;
print("Elapsed:", elapsed, "seconds");
```

## The Fibonacci benchmark

[`examples/fib/fib_benchmark.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/fib/fib_benchmark.adesh)
compares naive recursion against dynamic programming:

```adesh
// Naive recursive - O(2^n)
fn fib_naive(n) {
    if (n <= 1) { return n; }
    return fib_naive(n - 1) + fib_naive(n - 2);
}

// Iterative DP - O(n)
fn fib_dp(n) {
    if (n <= 1) { return n; }
    let prev = 0;
    let curr = 1;
    let i = 2;
    while (i <= n) {
        let next = prev + curr;
        prev = curr;
        curr = next;
        i = i + 1;
    }
    return curr;
}

print("Testing Naive Recursive (n=30):");
let start1 = clock();
let result1 = fib_naive(30);
let end1 = clock();
print("Result:", result1);
print("Time:", end1 - start1, "seconds");

print("Testing DP Iterative (n=30):");
let start2 = clock();
let result2 = fib_dp(30);
let end2 = clock();
print("Result:", result2);
print("Time:", end2 - start2, "seconds");
```

**Output (timings vary):**
```
Testing Naive Recursive (n=30):
Result: 832040
Time: 2.847119 seconds
Testing DP Iterative (n=30):
Result: 832040
Time: 0.000014 seconds
```

Same answer. The DP version is ~200,000× faster because it computes each
value once instead of re-deriving subtrees.

## A CPU-bound benchmark: counting primes

[`examples/backends/inter_backend_demo.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/backends/inter_backend_demo.adesh)
benchmarks the same program across backends:

```adesh
fn is_prime(n) {
    if n <= 1 { return false; }
    let i = 2;
    while i * i <= n {
        if n % i == 0 { return false; }
        i = i + 1;
    }
    return true;
}

fn count_primes_to(limit) {
    let count = 0;
    let num = 2;
    while num <= limit {
        if is_prime(num) { count = count + 1; }
        num = num + 1;
    }
    return count;
}

let start = clock();
let count = count_primes_to(20000);
let end = clock();

print("Found", count, "prime numbers up to 20000");
print("Time:", end - start, "seconds");
```

**Output (timings vary by backend):**
```
Found 2262 prime numbers up to 20000
Time: 0.031 seconds
```

Run the same file with `--jit-native` and compare the wall time on your machine.

## Native JIT warm-up

[`examples/jit/`](https://github.com/adeshlang/adeshlang/tree/main/examples/jit)
shows the native JIT compiling a function the first time it runs, then executing
the compiled machine code on later calls:

```adesh
// native_jit_demo.adesh - first call includes compilation cost
fn hot_function(x) {
    let total = 0;
    for i in 0..1000 {
        total = total + x * i;
    }
    return total;
}

let start = clock();
let checksum = 0;
for run in 0..100000 {
    checksum = checksum + hot_function(run % 10);
}
let end = clock();

print("Checksum:", checksum);
print("Total time:", end - start, "seconds");
print("TIP: run with --jit-native for native code generation");
```

**Output (timings vary):**
```
Checksum: 44995500000
Total time: 0.42 seconds
```

## SIMD and special backends

The repository also has real demos for
[`examples/simd/`](https://github.com/adeshlang/adeshlang/tree/main/examples/simd)
(SIMD-accelerated math), `gpu/`, `wasm/`, and `ml/` — but the lesson here is
portable: **write clear code first, then flip a flag**:

```text
same .adesh file
     │
     ├─ adesh run file.adesh            → interpreter (learn)
     ├─ adesh run --jit-native file.adesh → native JIT
     ├─ adesh build file.adesh          → ahead-of-time binary
     └─ adesh compile-wasm file.adesh   → WebAssembly module
```

## Benchmarking rules of thumb

1. **Measure before optimizing** — use `clock()` around real work.
2. **Compare the same code across targets** — the interpreter numbers are
   not the native JIT numbers.
3. **Watch algorithmic complexity first** — naive vs DP beats any backend
   flag.
4. **Run with a warm JIT** — the first call includes compilation costs.
5. **Report the flag you used** — "0.4s with `--njit`" is meaningful; "0.4s"
   alone is not.

## Practice

Write a benchmark that compares the interpreter with `--jit-native` on your own machine:

```adesh
fn sum_to(n) {
    let total = 0n;
    for i in 0n..n {
        total = total + i;
    }
    return total;
}

let start = clock();
print("Sum:", sum_to(100000));
print("Time:", clock() - start, "seconds");
```

**Output:**
```
Sum: 4999950000
Time: 0.018 seconds
```

Run it two ways: `adesh run` and `adesh run --jit-native`.

## Summary

✅ **You learned:**
- Interpreter → JIT → native JIT → AOT → WASM backend ladder
- `clock()` measures elapsed time
- Naive vs DP Fibonacci: the algorithm matters more than the flag
- Prime-counting cross-backend benchmark
- JIT tier escalation for hot functions
- Benchmarking rules: measure, compare, warm up, report the flag

## Next Step

You've made it to the final project — the **Capstone: Task Manager CLI** —
which ties together everything you've learned. Continue to
**[Capstone Project](/learn/capstone)** →
