---
id: benchmarks
title: Benchmarking Adesh
sidebar_label: Benchmarks
description: How to measure Adesh performance on your own hardware with the built-in benchmark runner.
---

# Benchmarking Adesh

Adesh is an experimental language. Published speedup multipliers and cross-language comparisons are intentionally withheld until the native targets reach a stable release, because results vary by workload, compiler version, and hardware.

## Benchmark policy

- The interpreter is the correctness baseline; every optimized target must match its observable semantics before it is considered complete.
- No "X× faster than language Y" claims are published while the backends are experimental.
- Measure on the hardware and toolchain version you plan to deploy, and always report the command you used.

Use the bundled suites under [`examples/benchmarks/`](https://github.com/adeshlang/adeshlang/tree/main/examples/benchmarks), [`examples/fib/`](https://github.com/adeshlang/adeshlang/tree/main/examples/fib), and [`examples/backends/`](https://github.com/adeshlang/adeshlang/tree/main/examples/backends).

---

## 1. Writing Custom Microbenchmarks

Adesh includes a built-in benchmark runner via `@benchmark`:

```adesh
import { adesh_alloc::Arc } from "adesh_alloc";

@benchmark
fn bench_arc_clone_and_drop(b: Bencher) {
    let data = Arc::new([1, 2, 3, 4, 5, 6, 7, 8]);
    
    b.iter(|| {
        let clone = data.clone();
        // clone dropped at end of closure scope
    });
}

@benchmark
fn bench_simd_dot_product(b: Bencher) {
    let a = f32x8::splat(1.5);
    let b_vec = f32x8::splat(2.5);
    
    b.iter(|| {
        let _ = a.dot(b_vec);
    });
}
```

## 2. Running Benchmarks with the CLI

```bash
# Run all benchmark suites in the project
adesh bench

# Filter benchmarks by name
adesh bench --filter="simd"

# Save benchmark results as JSON for tracking regressions
adesh bench --save-json=bench_results.json
```

---

## 3. Reproducing Benchmarks

All benchmark source code is open source and available under `examples/` and `benches/` in the Adesh repository:

```bash
# Run complete ecosystem benchmark
cargo bench --bench ecosystem_benchmarks

# Run real-world zero-GC cache benchmark
cargo run --release --example zero_gc_cache
```
