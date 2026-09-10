---
id: jit
title: JIT Compilation Backend
sidebar_label: JIT Compiler
description: In-depth technical architecture of the AdeshLang Just-In-Time (JIT) compiler with tiered compilation and OSR.
---

# JIT Compilation Backend

AdeshLang features an adaptive, high-throughput **Just-In-Time (JIT) Compiler** designed for server runtimes, data processing pipelines, and development workflows requiring instant startup combined with near-native execution performance.

```
┌───────────────────────────────────────────────────────────┐
│                    JIT Execution Engine                   │
├───────────────────────────────────────────────────────────┤
│  Source Code ──► Semantic IR ──► Tier-1 Baseline JIT       │
│                                           │ (Hot Loop)    │
│                                           ▼               │
│                               Tier-2 Optimizing JIT (LLVM)│
│                                           │               │
│                                           ▼               │
│                               Native Machine Code (x86/ARM)│
└───────────────────────────────────────────────────────────┘
```

---

## 1. Tiered JIT Architecture

The AdeshLang JIT uses a **two-tier adaptive compilation strategy**:

### Tier-1: Baseline Fast JIT (Cranelift)
- **Goal**: Ultra-fast compilation speed (&lt; 5ms).
- Emits unoptimized native machine code immediately without running heavy optimization passes.
- Inserts lightweight execution counters at function entries and loop headers to track hot code paths.

### Tier-2: Optimizing JIT (LLVM / Custom Machine Emitter)
- **Goal**: Peak execution throughput (approaching 100% of AOT native speed).
- When a function or loop invocation counter crosses the hot threshold (default: 1,000 iterations), Tier-2 triggers in a background compilation thread.
- Applies aggressive optimizations:
  - Function inlining and devirtualization
  - Loop unrolling and auto-vectorization (SIMD)
  - Common Subexpression Elimination (CSE)
  - Escape analysis and stack promotion

---

## 2. On-Stack Replacement (OSR)

Long-running loops inside cold functions are upgraded mid-execution without waiting for the enclosing function to return:

```adesh
fn process_large_dataset(data: [f64]): f64 {
    let sum: f64 = 0.0;
    
    // Loop begins in Tier-1. After 1,000 iterations, OSR seamlessly
    // hot-swaps the active stack frame to the Tier-2 SIMD-vectorized version!
    for i in 0..data.len() {
        sum += data[i] * 1.05;
    }
    return sum;
}
```

---

## 3. Running with the JIT Backend

To run AdeshLang programs using the JIT compiler:

```bash
# Run program using default adaptive JIT
adesh run --backend=jit program.adesh

# Force Tier-2 optimization level (0, 1, 2, 3)
adesh run --backend=jit --jit-opt-level=3 program.adesh

# Customize hot invocation threshold for triggering Tier-2
adesh run --backend=jit --jit-threshold=500 program.adesh

# Dump generated JIT assembly to terminal for inspection
adesh run --backend=jit --dump-asm program.adesh
```

---

## 4. Memory Safety & W^X Security

The JIT compiler enforces strict **$W \oplus X$ (Write XOR Execute)** memory permissions:

1. Memory pages allocated for JIT code are initially mapped as Read-Write (`RW-`).
2. Machine instructions are emitted into the buffer.
3. The page protections are atomically flipped to Read-Execute (`R-X`) before jumping to execution.
4. Pages are never simultaneously writable and executable, preventing code-injection vulnerabilities.

---

## 5. Performance Comparison

| Execution Metric | AST Interpreter | Bytecode VM | Tier-1 JIT | Tier-2 JIT | Native AOT |
|------------------|-----------------|-------------|------------|------------|------------|
| **Startup Latency** | **< 1ms** | 2ms | 5ms | 25ms | 10ms |
| **Numeric Speed** | $1\times$ (baseline) | $8\times$ | $35\times$ | $120\times$ | $130\times$ |
| **Hot Loop Throughput** | $1\times$ | $10\times$ | $45\times$ | $150\times$ | $160\times$ |
| **Memory Footprint** | Low | Low | Medium | Medium | Minimal |

---

## 6. When to Use JIT vs AOT

- **Use JIT Backend For**:
  - Development and rapid testing cycles.
  - Interactive REPL sessions and Jupyter notebooks.
  - Long-running server processes (APIs, web services, worker nodes).
  - Dynamic plugin systems and scripting engines.

- **Use AOT Backend For**:
  - Embedded systems and microcontrollers.
  - Command-line utilities (instant cold start).
  - Distributable single-binary production releases.
