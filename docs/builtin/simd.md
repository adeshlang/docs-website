---
id: simd
title: SIMD & Vector Compute Library
sidebar_label: SIMD
---

import FeatureStatus from '@site/src/components/FeatureStatus';
import BackendSupport from '@site/src/components/BackendSupport';

# SIMD & Vector Compute Library (`Simd`)

<FeatureStatus status="STABLE" details="Explicit vector intrinsics, auto-vectorization, and the Simd namespace for high-throughput numeric arrays" />

SIMD (**Single Instruction, Multiple Data**) lets AdeshLang execute arithmetic across contiguous datasets in dedicated CPU vector registers (x86_64 **AVX2 / AVX-512**, ARM **NEON**, WASM **SIMD128**). AdeshLang exposes SIMD through two surfaces:

| Surface | Where | API | Status |
|---|---|---|---|
| **Interpreter / Simd namespace** | Runtime (today) | `Simd.sum`, `Simd.dot`, `Simd.vector` + plain array element-wise ops | ✅ Stable |
| **Compiler IR vector types** | VIR → Cranelift/LLVM | `f32x4`, `f64x4`, `i32x8`, … native register types | 🟡 JIT/AOT target (evolving) |

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

## Namespace & Import

```adesh
import Simd;

let total = Simd.sum([1, 2, 3, 4]);        // namespace-level: Simd.fn(arr)
let v = Simd.vector([1, 2, 3, 4]);          // vector handle: Simd.vector(arr) → object
print(v.sum());                             // instance method
print(v.dot([4, 3, 2, 1]));                 // dot with another array
```

| Import Form | Example | Notes |
|---|---|---|
| `import Simd;` | `Simd.sum(arr)` | canonical — binds `Simd` module object |
| `import "std:Simd" as Simd;` | same | explicit std prefix |
| `Simd.vector(arr)` | `let v = Simd.vector([1,2,3])` | returns vector handle with instance methods |

Implementation: `src/runtime/stdlib_src/simd/mod.rs` (namespace object), `src/runtime/simd/ops.rs`, `broadcast.rs`, `fusion.rs`, `value.rs`, `cpu_features.rs`; IR layer `src/ir/simd/*`.

---

## Architecture Diagram — Simd Module Object

```
 import Simd;
     │
     ▼
 ┌─────────────────────────────────────────┐
 │           Simd Module Object            │
 ├─────────────────────────────────────────┤
 │  Namespace methods (take arrays):       │
 │   sum, mean, min, max, abs, sqrt,       │
 │   dot, add, sub, mul, div,              │
 │   fusedMulAdd, fusedSqrtMulAdd,         │
 │   concat, vector, workers               │
 ├─────────────────────────────────────────┤
 │  Simd.vector(arr) ──► Vector Handle     │
 │   per-instance methods (capture arr):   │
 │    sum, mean, min, max, abs, sqrt,      │
 │    dot(other), add(other), mul(other),  │
 │    scale(scalar), len, toArray          │
 └─────────────────────────────────────────┘
         │
         ▼
  Runtime SIMD ops (src/runtime/simd/ops.rs)
    ├── f64 fast path (AVX-width chunked, scalar remainder)
    ├── broadcast detection (scalar ↔ array)
    └── scalar fallback (generic Value path)
```

---

## 1. Supported Vector Types (IR / Native Layer)

These are the **native register types** the compiler IR and JIT/AOT backends target. They map directly to hardware registers and are the long-term typed surface (see [SIMD Overview](/docs/simd/overview)).

| Vector Type | Element Type | Lanes | Register Width | Hardware |
|---|---|---|---|---|
| `f32x4` | `f32` | 4 | 128-bit | SSE / NEON |
| `f32x8` | `f32` | 8 | 256-bit | AVX2 |
| `f32x16` | `f32` | 16 | 512-bit | AVX-512 |
| `f64x2` | `f64` | 2 | 128-bit | SSE2 |
| `f64x4` | `f64` | 4 | 256-bit | AVX2 |
| `i32x4` | `i32` | 4 | 128-bit | SSE / NEON |
| `i32x8` | `i32` | 8 | 256-bit | AVX2 |
| `u8x16` | `u8` | 16 | 128-bit | SSE / NEON |
| `u8x32` | `u8` | 32 | 256-bit | AVX2 |

Typed vector construction (IR/JIT surface):

```adesh
// Native vector types (JIT/AOT — evolving)
let a = f32x4::new(1.0, 2.0, 3.0, 4.0);
let b = f32x4::splat(2.5);          // broadcast scalar to all lanes
let sum = a + b;                     // [3.5, 4.5, 5.5, 6.5]
let fma = a.fma(b, Simd.splat(1.0)); // a*b + 1 per lane
```

Today's interpreter uses plain arrays; the native types are the JIT/AOT target and share the same cost model (`src/ir/simd/cost_model.rs`).

---

## 2. Array Vector Operations (Interpreter — Stable)

Plain arrays support **element-wise** operators that dispatch to SIMD when profitable. This is NumPy-style, not concatenation:

```adesh
import Simd;

// Element-wise via Simd namespace (explicit)
let a = [1.0, 2.0, 3.0, 4.0];
let b = [10.0, 20.0, 30.0, 40.0];

print(Simd.add(a, b)); // [11.0, 22.0, 33.0, 44.0]
print(Simd.mul(a, b)); // [10.0, 40.0, 90.0, 160.0]
print(Simd.sub(b, a)); // [9.0, 18.0, 27.0, 36.0]
print(Simd.div(b, a)); // [10.0, 10.0, 10.0, 10.0]

// Scalar broadcast — array ↔ scalar automatically
print(Simd.add(a, 5.0));   // [6.0, 7.0, 8.0, 9.0]   — broadcast right
print(Simd.mul(2.0, a));   // [2.0, 4.0, 6.0, 8.0]   — broadcast left
print(Simd.div(a, 2.0));   // [0.5, 1.0, 1.5, 2.0]

// Operator form (plain arrays, same dispatch)
let c = [1.0, 2.0, 3.0] + [4.0, 5.0, 6.0]; // element-wise add
```

### Broadcast Detection

`src/runtime/simd/broadcast.rs` classifies every binary op:

| Left | Right | Mode | Behavior |
|---|---|---|---|
| `array` | `array` | `ElementWise` | pairwise `a[i] op b[i]`; lengths must match |
| `array` | `scalar` | `ScalarRight` | `a[i] op scalar` |
| `scalar` | `array` | `ScalarLeft` | `scalar op a[i]` |
| other | other | `Incompatible` | error |

Scalars are any numeric `Value` (`Number`, `F64`, `F32`, `I64`, `I32`, `U64`, `U32`, `I8`, `U8`, `I16`, `U16`).

---

## 3. Simd Namespace — Full API

### Reduction & Statistics

| Method | Signature | Description |
|---|---|---|
| `Simd.sum(arr)` | `fn sum(Array<number>): number` | Sum all elements (SIMD-width chunked accumulation). |
| `Simd.mean(arr)` | `fn mean(Array<number>): number` | Arithmetic mean; `NaN` if empty. |
| `Simd.min(arr)` | `fn min(Array<number>): number` | Minimum; error if empty. |
| `Simd.max(arr)` | `fn max(Array<number>): number` | Maximum; error if empty. |
| `Simd.dot(a, b)` | `fn dot(Array<number>, Array<number>): number` | Dot product `Σ a[i]*b[i]`; SIMD chunked. |

### Element-wise Transforms

| Method | Signature | Description |
|---|---|---|
| `Simd.abs(arr)` | `fn abs(Array<number>): Array<number>` | Per-element absolute value. |
| `Simd.sqrt(arr)` | `fn sqrt(Array<number>): Array<number>` | Per-element square root (`NaN` for negative). |
| `Simd.add(a, b)` | `fn add(Array\|scalar, Array\|scalar): Array<number>` | Element-wise add with broadcast. |
| `Simd.sub(a, b)` | same | Element-wise subtract. |
| `Simd.mul(a, b)` | same | Element-wise multiply (SIMD `f64` fast path). |
| `Simd.div(a, b)` | same | Element-wise divide; `NaN` where divisor is `0`. |

### Fused Operations

| Method | Signature | Description |
|---|---|---|
| `Simd.fusedMulAdd(a, b, c)` | `fn fusedMulAdd(Array, Array, Array): Array` | `a[i]*b[i] + c[i]` fused (single rounding). |
| `Simd.fusedSqrtMulAdd(a, b, c)` | `fn fusedSqrtMulAdd(Array, Array, Array): Array` | `sqrt(a[i]*b[i] + c[i])` fused. |

Fused ops go through `src/runtime/simd/fusion.rs` and avoid intermediate `f64` rounding and extra passes.

### Utilities

| Method | Signature | Description |
|---|---|---|
| `Simd.concat(a, b)` | `fn concat(Array, Array): Array` | Concatenate two arrays (not element-wise). |
| `Simd.vector(arr)` | `fn vector(Array<number>): VectorHandle` | Create vector handle with instance methods (see below). |
| `Simd.workers()` | `fn workers(): number` | Number of scheduler workers (for sizing parallel SIMD work). |

---

## 4. Vector Handle (`Simd.vector`)

`Simd.vector(arr)` wraps an array in a stateful handle whose methods capture the array — convenient for chaining without repeating the array argument.

```adesh
import Simd;

let v = Simd.vector([1.0, 2.0, 3.0, 4.0]);

print(v.sum());              // 10.0
print(v.mean());             // 2.5
print(v.min());              // 1.0
print(v.max());              // 4.0
print(v.len());              // 4
print(v.abs());              // [1.0, 2.0, 3.0, 4.0]  (all positive already)
print(v.sqrt());             // [1.0, 1.414..., 1.732..., 2.0]
print(v.dot([4, 3, 2, 1])); // 20.0  (1*4+2*3+3*2+4*1)
print(v.add([10, 10, 10, 10])); // [11, 12, 13, 14]
print(v.mul([2, 2, 2, 2]));    // [2, 4, 6, 8]
print(v.scale(2.0));            // [2, 4, 6, 8]  (scalar multiply)
print(v.toArray());             // [1.0, 2.0, 3.0, 4.0] — copy out
```

### Vector Handle Methods

| Method | Signature | Description |
|---|---|---|
| `v.sum()` | `-> number` | Sum of captured array. |
| `v.mean()` | `-> number` | Mean. |
| `v.min()` | `-> number` | Min. |
| `v.max()` | `-> number` | Max. |
| `v.abs()` | `-> Array<number>` | Element-wise abs. |
| `v.sqrt()` | `-> Array<number>` | Element-wise sqrt. |
| `v.len()` | `-> number` | Length of captured array. |
| `v.dot(other)` | `fn dot(Array): number` | Dot with `other`. |
| `v.add(other)` | `fn add(Array): Array` | Element-wise add with `other`. |
| `v.mul(other)` | `fn mul(Array): Array` | Element-wise multiply. |
| `v.scale(scalar)` | `fn scale(number): Array` | Multiply all lanes by scalar. |
| `v.toArray()` | `-> Array<number>` | Copy of underlying array. |

The handle is backed by `Arc<Mutex<Vec<Value>>>` so clones share state safely across threads.

---

## 5. Auto-Vectorization (Compiler Pass)

The **SIMD IR pass** (`src/ir/simd/*`) automatically rewrites scalar loops into vector ops when the cost model says it's profitable — no source change needed.

```
Source loop:                         After vectorization (f32x4, 4-wide):

for i in 0..n {              for i in 0..n step 4 {
  c[i] = a[i] + b[i];          va = load_vec4 a[i..i+4]
}                              vb = load_vec4 b[i..i+4]
                               vc = simd_add va, vb
                               store_vec4 c[i..i+4], vc
                             }
                             // scalar remainder for n % 4
```

| SIMD Pass File | Role |
|---|---|
| `simd/analysis.rs` | Identify vectorizable loops/values (contiguous, no carried deps) |
| `simd/vectorize.rs` | Rewrite scalar ops as vector ops |
| `simd/cost_model.rs` | Profitability heuristic (trip count, alignment, savings vs overhead) |
| `simd/instructions.rs` | Vector instruction definitions |
| `simd/types.rs` | `f32x4`, `f64x2`, … type defs |
| `simd/lowering.rs` | Lower vector ops to backend (Cranelift/LLVM) |

Cost model checks: loop trip count, element contiguity, dependency distance, and estimated speedup vs scalar remainder overhead before committing.

---

## 6. Error Handling

| Condition | Error Message | Recovery |
|---|---|---|
| Empty array for `min`/`max` | `"min of empty array"` | Guard `if arr.len() > 0` |
| Length mismatch for `add`/`mul`/`dot` | `"array length mismatch: 3 vs 4"` | Ensure equal lengths or use scalar broadcast |
| Non-array argument | `"expected array"` | Pass `Array<number>` |
| Division by zero | `NaN` per lane (not an error) | Check divisor or handle `NaN` |
| `fusedMulAdd` length mismatch | propagated from `fusion.rs` | Ensure all three arrays same length |

```adesh
import Simd;

// Guard empty
let arr: Array<number> = [];
if (arr.len() > 0) { print(Simd.min(arr)); }

// Handle dot mismatch
let r = Simd.dot([1,2], [1,2,3]);
if (r is string) { print("Error:", r); } // actually throws — catch via try
```

---

## 7. Complete Examples

### Example 1 — Statistics Pipeline

```adesh
import Simd;

let data = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0];

print("sum:", Simd.sum(data));     // 40.0
print("mean:", Simd.mean(data));   // 5.0
print("min:", Simd.min(data));     // 2.0
print("max:", Simd.max(data));     // 9.0
print("dot with self:", Simd.dot(data, data)); // sum of squares

let v = Simd.vector(data);
print("abs:", v.abs());
print("sqrt:", v.sqrt());
```

### Example 2 — Element-wise Physics Step

```adesh
import Simd;

// position += velocity * dt  (broadcast scalar dt)
let pos = [0.0, 10.0, 20.0];
let vel = [1.0, 2.0, 3.0];
let dt = 0.016; // 60 FPS

let newPos = Simd.add(pos, Simd.mul(vel, dt));
print(newPos); // [0.016, 10.032, 20.048]

// Fused: newPos = pos + vel*dt  (single pass, single rounding)
let a = [1.0, 2.0, 3.0, 4.0];
let b = [2.0, 2.0, 2.0, 2.0];
let c = [10.0, 10.0, 10.0, 10.0];
print(Simd.fusedMulAdd(a, b, c)); // [12.0, 14.0, 16.0, 18.0]
print(Simd.fusedSqrtMulAdd(a, b, c)); // [sqrt(12), sqrt(14), ...]
```

### Example 3 — Cosine Similarity via Dot

```adesh
import Simd;

fn cosineSimilarity(a: Array<number>, b: Array<number>): number {
    let dot = Simd.dot(a, b);
    let normA = Math.sqrt(Simd.dot(a, a));
    let normB = Math.sqrt(Simd.dot(b, b));
    return dot / (normA * normB);
}

let u = [1.0, 2.0, 3.0];
let w = [4.0, 5.0, 6.0];
print(cosineSimilarity(u, w)); // ~0.974
```

### Example 4 — Vector Handle Chaining

```adesh
import Simd;

let v = Simd.vector([1.0, 4.0, 9.0, 16.0]);
let roots = v.sqrt();             // [1, 2, 3, 4]
let scaled = Simd.vector(roots).scale(10.0);
print(scaled); // [10, 20, 30, 40]
print(Simd.sum(scaled)); // 100
```

---

## 8. Performance Notes

- **Fast path**: `extract_f64_slice` detects all-numeric arrays and dispatches to chunked `f64` SIMD ops (`src/runtime/simd/ops.rs`) with `simd_lanes_f64()`-width chunks and scalar remainder.
- **Fallback**: generic `Value` path handles mixed types without panic.
- **Fused ops**: `fusedMulAdd` / `fusedSqrtMulAdd` avoid allocating an intermediate array — one pass, one allocation.
- **Auto-vectorization**: loops already vectorized by `src/ir/simd` don't need manual `Simd.*` calls — the compiler does it.

## Related

- [SIMD Overview](/docs/simd/overview) — full vector type reference and JIT lowering
- [Compiler IR Pipeline](/docs/compiler/ir) — where auto-vectorization lives
- [Math Library](/docs/builtin/math) — scalar math that SIMD complements
- Sources: `src/runtime/stdlib_src/simd/mod.rs`, `src/runtime/simd/`, `src/ir/simd/`
