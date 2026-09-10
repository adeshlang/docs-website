---
id: overview
title: SIMD & Vector Compute Overview
sidebar_label: SIMD Overview
---

import FeatureStatus from '@site/src/components/FeatureStatus';
import BackendSupport from '@site/src/components/BackendSupport';

# SIMD & Vectorized Computing in AdeshLang

<FeatureStatus status="STABLE" details="Explicit vector intrinsics and auto-vectorization passes" />

SIMD (**Single Instruction, Multiple Data**) allows AdeshLang to execute arithmetic, logical, and bitwise operations across contiguous vector datasets simultaneously using dedicated CPU vector registers (x86_64 **AVX2 / AVX-512**, ARM **NEON**, and WebAssembly **SIMD128**).

:::info Two SIMD surfaces
The interpreter and JIT expose SIMD through two surfaces:

- **Today, in the interpreter**: plain arrays with element-wise operators
  (`v1 + v2`, `alpha * x + y`) plus the `Simd` namespace (`Simd.dot`,
  `Simd.mean`, `Simd.vector`). See [Array Vector Operations](#4-array-vector-operations).
- **Compiler IR level**: native vector *types* (`f32x4`, `f64x4`, `i32x8`,
  …) defined in the SIMD IR layer (lowered to AVX2/NEON via Cranelift/LLVM).
  These typed forms are the target of the JIT/AOT backends; they are still
  evolving and not yet interpreter-callable syntax.
:::

```
┌──────────────────────────────────────────────────────────┐
│                   Scalar vs SIMD Model                   │
├──────────────────────────────────────────────────────────┤
│  Scalar Loop (4 cycles):                                 │
│  [a0 + b0] ──► [a1 + b1] ──► [a2 + b2] ──► [a3 + b3]     │
│                                                          │
│  SIMD Vector Register (1 cycle):                         │
│  ┌───────────────────────┐   ┌───────────────────────┐   │
│  │ a0 │ a1 │ a2 │ a3 │...│ + │ b0 │ b1 │ b2 │ b3 │...│   │
│  └───────────────────────┘   └───────────────────────┘   │
│                             │                            │
│                             ▼                            │
│  ┌───────────────────────────────────────────────────┐   │
│  │ a0+b0 │ a1+b1 │ a2+b2 │ a3+b3 │ ... (in parallel) │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 1. Supported Vector Types

AdeshLang provides first-class native vector types mapped directly to 128-bit, 256-bit, and 512-bit hardware vector registers:

| Vector Type | Element Type | Lanes (Elements) | Total Register Width |
|-------------|--------------|------------------|----------------------|
| `f32x4` | `f32` (float) | 4 lanes | 128 bits (SSE / NEON) |
| `f32x8` | `f32` (float) | 8 lanes | 256 bits (AVX2) |
| `f32x16` | `f32` (float) | 16 lanes | 512 bits (AVX-512) |
| `f64x2` | `f64` (double) | 2 lanes | 128 bits |
| `f64x4` | `f64` (double) | 4 lanes | 256 bits |
| `i32x4` | `i32` (int) | 4 lanes | 128 bits |
| `i32x8` | `i32` (int) | 8 lanes | 256 bits |
| `u8x16` | `u8` (byte) | 16 lanes | 128 bits |
| `u8x32` | `u8` (byte) | 32 lanes | 256 bits |

---

## 2. Vector Construction & Arithmetic

```adesh
// Initialize vector with explicit lane values
let a = f32x4::new(1.0, 2.0, 3.0, 4.0);
let b = f32x4::new(10.0, 20.0, 30.0, 40.0);

// Broadcast a single scalar value across all lanes
let scalar_factor = f32x4::splat(2.5);

// Direct parallel vector arithmetic
let sum = a + b;                          // [11.0, 22.0, 33.0, 44.0]
let diff = b - a;                         // [9.0, 18.0, 27.0, 36.0]
let product = a * b;                      // [10.0, 40.0, 90.0, 160.0]
let scaled = product * scalar_factor;     // [25.0, 100.0, 225.0, 400.0]

// Fused Multiply-Add (FMA: a * b + c in a single hardware cycle)
let fma_res = a.fma(b, scalar_factor);
```

---

## 3. High-Performance Vector Computations

### SIMD Dot Product (8x Speedup)
```adesh
@pure
@noalloc
fn simd_dot_product_f32(a: &[f32], b: &[f32]): f32 {
    let len = a.len();
    let vec_acc = f32x8::splat(0.0);
    let i = 0;

    // Process 8 floating-point numbers per cycle
    while i + 8 <= len {
        let va = f32x8::load_unaligned(&a[i]);
        let vb = f32x8::load_unaligned(&b[i]);
        vec_acc = va.fma(vb, vec_acc);
        i += 8;
    }

    // Reduce vector lanes to single scalar sum
    let total = vec_acc.horizontal_sum();

    // Process remaining tail elements
    while i < len {
        total += a[i] * b[i];
        i += 1;
    }

    return total;
}
```

### Fast RGBA Image Blending (Alpha Compositing)
```adesh
@noalloc
fn blend_rgba_chunk(foreground: &[u8; 32], background: &[u8; 32], alpha: u8): [u8; 32] {
    let fg = u8x32::load_aligned(foreground);
    let bg = u8x32::load_aligned(background);
    let a_vec = u8x32::splat(alpha);

    // Vectorized linear interpolation: bg + (fg - bg) * alpha / 255
    let blended = bg + ((fg - bg) * a_vec) / 255;
    return blended.to_array();
}
```

---

## 4. Array Vector Operations

AdeshLang also provides high-level array vector helpers for rapid prototyping.
Plain arrays support **element-wise operators**, and the `Simd` namespace
offers reductions. All of the following run in the interpreter and are
SIMD-vectorized by the compiler:

```adesh
import Simd;

let v1 = [1.0, 2.0, 3.0, 4.0];
let v2 = [10.0, 20.0, 30.0, 40.0];

// Element-wise addition using vectorized instructions
let result = v1 + v2;
print(result); // [11, 22, 33, 44]

// SAXPY-style: y = alpha * x + y  (natural operator syntax)
let alpha = 2.5;
let x = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
let y = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0];
let saxpy = alpha * x + y;
print(saxpy); // [12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100]

// Reductions via the Simd namespace
let row = [1.0, 2.0, 3.0, 4.0];
let col = [4.0, 3.0, 2.0, 1.0];
print(Simd.dot(row, col));        // 20
print(Simd.mean([10.0, 20.0]));   // 15

// Instance API
let vx = Simd.vector(x);
print(vx.scale(2.0));             // [2, 4, 6, 8, 10, 12, 14, 16]
```

These come straight from
[`examples/numerics/matrix_operations.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/numerics/matrix_operations.adesh).

---

## 5. Execution Support Matrix

<BackendSupport
  interpreter="full"
  bytecodeVm="full"
  jit="full"
  nativeJit="full"
  aot="full"
  wasm="partial"
  gpu="partial"
/>

---

## 6. Auto-Vectorization Optimizations

When compiling via `adesh build -O3` or running with `--jit`, the compiler optimization pass automatically identifies loops with contiguous arrays and transforms scalar operations into native vector instructions without requiring manual SIMD intrinsics.
