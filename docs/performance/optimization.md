---
id: optimization
title: Compiler Optimization Passes & Techniques
sidebar_label: Optimization
description: Compiler optimization passes, zero-cost abstractions, data layout packing, and performance best practices in Adesh.
---

# Compiler Optimization Passes & Techniques

Adesh is designed around **zero-cost abstractions**: high-level syntax and ergonomic safety features compile down to the most efficient machine instructions possible without hidden runtime penalties.

```
┌──────────────────────────────────────────────────────────┐
│             Compiler Optimization Pipeline               │
├──────────────────────────────────────────────────────────┤
│  AST ──► Semantic IR ──► High-Level Optimizer Passes     │
│                                │                         │
│                                ▼                         │
│                     LLVM / Cranelift Backend Passes      │
│  [Inlining, Loop Vectorization, DCE, Struct Packing]     │
│                                │                         │
│                                ▼                         │
│                     Target Machine Assembly              │
└──────────────────────────────────────────────────────────┘
```

---

## 1. High-Level Compiler Optimization Passes

When compiling with optimization flags (`-O2` or `-O3`), the Adesh compiler executes several domain-specific optimization passes:

### Constant Folding & Propagation
Compile-time constant expressions are calculated during semantic analysis:
```adesh
// Source:
let timeout_ms = 60 * 1000;

// Emitted IR (0 runtime cost):
let timeout_ms = 60000;
```

### Dead Code Elimination (DCE)
Unreachable branches, unused local variables, and unreferenced functions are completely removed from the final binary.

### Function Inlining (`@inline`)
Small, frequently called functions (leaf functions, arithmetic helpers, getter/setters) are expanded directly into their call sites, eliminating function call prologue/epilogue overhead and opening opportunities for vectorization:
```adesh
@inline
fn square(x: f64): f64 {
    return x * x;
}
```

### Loop Invariant Code Motion (LICM) & Unrolling
Computations that do not change across loop iterations are hoisted outside the loop header. Loops with small, known bounds are unrolled to maximize instruction pipeline saturation.

### SIMD Auto-Vectorization
Sequential loops processing contiguous arrays are automatically translated into parallel SIMD instructions (AVX2 / AVX-512 / ARM NEON):
```adesh
// The compiler automatically vectorizes this loop with f32x8 instructions:
for i in 0..scalars.len() {
    scalars[i] = scalars[i] * 2.0 + 1.0;
}
```

---

## 2. Struct Memory Layout & Packing

By default, the compiler reorders struct fields to eliminate alignment padding holes. You can also explicitly control memory layout:

```adesh
// Standard optimized layout (compiler minimizes padding):
struct Measurement {
    timestamp: i64, // 8 bytes (offset 0)
    value: f64,     // 8 bytes (offset 8)
    sensor_id: u16, // 2 bytes (offset 16)
    valid: bool,    // 1 byte  (offset 18)
    // 5 bytes padding to align to 8-byte boundary (Total: 24 bytes)
}

// Packed layout for network protocols or hardware registers (0 padding):
#[repr(packed)]
struct NetworkHeader {
    version: u8,    // 1 byte
    packet_id: u16, // 2 bytes
    length: u32,    // 4 bytes
    // Total size: exactly 7 bytes
}
```

---

## 3. Writing Zero-Cost Idiomatic Code

### Prefer Slices and Stack Allocation Over Heap Copies
```adesh
// SUB-OPTIMAL (creates a new heap string copy):
fn process_prefix(text: string): string {
    return text.substring(0, 5);
}

// OPTIMAL (zero allocation, returns zero-copy string slice &str):
fn process_prefix(text: &string): &str {
    return &text[0..5];
}
```

### Use `@noalloc` for Latency-Critical Routines
Annotating real-time audio filters, cryptographic cores, or game physics routines with `@noalloc` ensures the compiler will fail the build if any heap allocation is inadvertently introduced:

```adesh
@noalloc
fn calculate_quaternion_rotation(q: [f32; 4], v: [f32; 3]): [f32; 3] {
    // Guaranteed 100% stack allocation
    // ...
}
```

---

## 4. Compiler Optimization Flags

```bash
# Debug build (no optimization, fast compilation, full debug symbols)
adesh build -O0 src/main.adesh

# Release build (aggressive speed optimizations)
adesh build -O3 --release src/main.adesh

# Size optimization (minimizes binary size for WASM and embedded targets)
adesh build -Oz --release src/main.adesh

# Enable Link-Time Optimization (LTO) across all modules
adesh build -O3 --lto=fat src/main.adesh
```
