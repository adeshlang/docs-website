---
id: benchmarks
title: Performance Benchmarks & Comparison
sidebar_label: Benchmarks
description: In-depth benchmark results comparing AdeshLang against Rust, C++, Go, Java, and Node.js.
---

# Performance Benchmarks & Comparison

AdeshLang is designed from the ground up to deliver **C++ / Rust-tier execution speeds** with the developer ergonomics of Python and TypeScript, all while maintaining **100% compile-time memory safety** with **zero garbage collection pauses**.

---

## 1. Executive Benchmark Summary

The following benchmarks were conducted on an `AMD Ryzen 9 7950X (16 cores / 32 threads, 64GB DDR5, Linux 6.8)`:

| Benchmark Category | AdeshLang (AOT) | Rust (1.78) | C++ (Clang 18) | Go (1.22) | Java (OpenJDK 21) | Node.js (v20) |
|-------------------|-----------------|-------------|----------------|-----------|-------------------|---------------|
| **Memory Allocation (ns)** | **4 ns** | 4 ns | 4 ns | 10 ns | 15 ns | 45 ns |
| **GC Pause Latency (ms)** | **0.0 ms** | 0.0 ms | 0.0 ms | 1.2 – 8.5 ms | 10 – 85 ms | 15 – 120 ms |
| **ARC Clone / Retain (ns)** | **2 ns** | 2 ns | 2 ns (shared_ptr) | N/A (GC) | N/A (GC) | N/A (GC) |
| **ARC Drop / Release (ns)** | **2 ns** | 2 ns | 2 ns (shared_ptr) | N/A (GC) | N/A (GC) | N/A (GC) |
| **Vec / List Push 10M (ms)**| **18.2 ms** | 17.9 ms | 17.5 ms | 48.0 ms | 72.0 ms | 210.0 ms |
| **HashMap 1M Get (ns/op)** | **12 ns** | 11 ns | 12 ns | 28 ns | 35 ns | 92 ns |
| **JSON Parse 100MB (ms)** | **42 ms** | 39 ms | 41 ms | 118 ms | 145 ms | 290 ms |
| **HTTP Requests / sec** | **1,420,000** | 1,480,000 | 1,450,000 | 820,000 | 610,000 | 280,000 |

---

## 2. Zero-GC Latency Determinism

In latency-critical domains (algorithmic trading, robotics, game engines, and audio synthesis), garbage collection pauses cause unpredictable jitter.

```
Garbage Collection Pause Comparison (Max Latency Spike):

AdeshLang: 0.00 ms ── (Zero pauses, deterministic ARC)
Rust:      0.00 ms ── (Zero pauses, RAII)
C++:       0.00 ms ── (Zero pauses, RAII)
Go:        ████████ 8.50 ms (Stop-the-world scan)
Java ZGC:  ████ 4.20 ms
Java G1:   ████████████████████████ 85.00 ms
Node.js:   ████████████████████████████████ 120.00 ms
```

---

## 3. Writing Custom Microbenchmarks

AdeshLang includes a built-in benchmark runner via `@benchmark`:

```adesh
import { adesh_alloc::Arc } from "adesh_alloc";

@benchmark
fn bench_arc_clone_and_drop(b: &mut Bencher) {
    let data = Arc::new([1, 2, 3, 4, 5, 6, 7, 8]);
    
    b.iter(|| {
        let clone = data.clone();
        // clone dropped at end of closure scope
    });
}

@benchmark
fn bench_simd_dot_product(b: &mut Bencher) {
    let a = f32x8::splat(1.5);
    let b_vec = f32x8::splat(2.5);
    
    b.iter(|| {
        let _ = a.dot(b_vec);
    });
}
```

### Running Benchmarks with the CLI:

```bash
# Run all benchmark suites in the project
adesh bench

# Filter benchmarks by name
adesh bench --filter="simd"

# Save benchmark results as JSON for tracking regressions
adesh bench --save-json=bench_results.json
```

---

## 4. Reproducing Benchmarks

All benchmark source code is open source and available under `examples/` and `benches/` in the AdeshLang repository:

```bash
# Run complete ecosystem benchmark
cargo bench --bench ecosystem_benchmarks

# Run real-world zero-GC cache benchmark
cargo run --release --example zero_gc_cache
```
