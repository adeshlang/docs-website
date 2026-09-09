---
id: vec
title: vec
sidebar_label: vec
description: The vec keyword introduces the SIMD vector family vecN<T> — compact, hardware-mapped lanes for parallel numeric compute with an overview in simd/overview.
---

# `vec`

`vec` is AdeshLang's **SIMD vector** type family. `vec4<f32>`, `vec8<f32>`, `vec4<f64>`, `vec16<u8>`, and their siblings are first-class numeric types lowered to hardware registers (128-bit SSE/NEON, 256-bit AVX2, 512-bit AVX-512) and to WebAssembly `v128`. Plain arrays already expose element-wise vectorized operators, but `vec` types give you explicit lane control, alignment, and access to low-level intrinsics.

> **Ground truth:** Lexer `TokenKind::VecType` (`src/parsing/lexer.rs:1007`, keyword `"vec"`), sibling raw token `Raw`, SIMD IR types `f32x4`/`f32x8`/`f32x16`/`f64x2`/`f64x4`/`i32x4`/`i32x8`/`u8x16`/`u8x32` (`docs-website/docs/simd/overview.md`), interpreter element-wise ops plus `Simd` namespace (`Simd.dot`, `Simd.vector`).

---

## Syntax

```text
vec_type   ::= "vec" integer? "<" element_type ">"
            |  simd_intrinsic_type  // alias: f32x4, f32x8, f64x4, i32x8, u8x32, ...
element_type ::= "f32" | "f64" | "i32" | "u32" | "u8" | "i16" | ...
integer    ::= "2" | "4" | "8" | "16" | "32"
```

`vec` itself tokenizes as `TokenKind::VecType`. The concrete lane count is carried as a generic parameter or number suffix depending on surface.

### Alias map (SIMD overview)

Normalized backend mapping from `simd/overview.md:53`:

| Written `vec` form | Alias `xN` form       | Element | Lanes | Register width | Backend |
|---|---|---|---|---|---|
| `vec4<f32>` | `f32x4` | `f32` | 4 | 128-bit (SSE/NEON) | interpreter & JIT/AOT |
| `vec8<f32>` | `f32x8` | `f32` | 8 | 256-bit (AVX2) | JIT/AOT |
| `vec16<f32>` | `f32x16` | `f32` | 16 | 512-bit (AVX-512) | AOT/natives |
| `vec2<f64>` | `f64x2` | `f64` | 2 | 128-bit | all |
| `vec4<f64>` | `f64x4` | `f64` | 4 | 256-bit | JIT/AOT |
| `vec4<i32>` | `i32x4` | `i32` | 4 | 128-bit | all |
| `vec8<i32>` | `i32x8` | `i32` | 8 | 256-bit | JIT/AOT |
| `vec16<u8>` | `u8x16` | `u8` | 16 | 128-bit | all |
| `vec32<u8>` | `u8x32` | `u8` | 32 | 256-bit | JIT/AOT |

`vecN<T>` without `<>` (e.g., `vec4`) is *not* valid — always include element type: `vec4<f32>`.

### Canonical forms

```adesh
let a: vec4<f32> = f32x4::new(1.0, 2.0, 3.0, 4.0);
let b: vec8<f32> = vec8<f32>::splat(2.5);  // splat sugar for broadcast
let c = a + b.slice(0,4);                 // lane-wise addition (width mismatch resolved via slice)

import Simd;
let s: Simd.vector = Simd.vector([1.0, 2.0, 3.0, 4.0]);
```

---

## Semantics

### Scalar vs. SIMD execution

```
Scalar (4 cycles):  [a0+b0] -> [a1+b1] -> [a2+b2] -> [a3+b3]
SIMD (1 cycle):     ┌a0 a1 a2 a3┐ + ┌b0 b1 b2 b3┐ → ┌a0+b0 ... a3+b3┐  (register)
                    └─────────────┘   └─────────────┘   └─────────────────┘
```

Lane-wise: `vec4<f32>.x = [x0,x1,x2,x3]`, a single hardware instruction produces `[x0+y0, x1+y1, x2+y2, x3+y2]` in parallel. Horizontal ops (`horizontal_sum`, `dot`) reduce across lanes.

### Interpreter vs. IR surfaces

From `simd/overview.md:16` — *Two SIMD surfaces*:

- **Today in the interpreter + JIT HIR interpreter** — plain arrays (`[1.0,2.0,3.0,4.0]`) support element-wise `+ - * /` with auto-vectorization (`adesh build -O3` / `--jit` pass), plus `Simd.dot(row,col)`, `Simd.mean(arr)`, `Simd.vector(arr).scale(…)`. These run everywhere.
- **IR Backend (Cranelift/LLVM)** — native `vecN<T>` types (`f32x4` etc.) lowered to AVX2/NEON/WASM `v128`. These are the target of the AOT compiler; not all `vec` forms are callable as syntax sugar in the current REPL but are fully documented here for forward-compat.

Prefer the array + `Simd` surface today for production code that must run on all backends; use explicit `vecN<T>` for hand-tuned kernels when targeting native via `adesh build`.

### Compilation

1. **Lex** `vec` → `TokenKind::VecType` (and `raw`/`region` neighbors reserved simultaneously at `lexer.rs:1006-1007`).
2. **Parse** via type parser: `vec` + integer `N` + `<Element>` produces a `TypeAnnotation` string like `"vec4<f32>"`.
3. **Type check** — lane width must divide element register width (e.g., `vec3<f32>` rejected); N must be power-of-two in current checks.
4. **HIR/MIR** — intrinsic types marked for SIMD lowering; loop auto-vectorizer identifies contiguous `DynArray` iteration and transforms body to `vec` ops when `adesh build -O3`.
5. **Codegen** — JIT emits `AVX2 fma` / `NEON vmla` / `WASM i32x4.add` per element-type alias map.

### Auto-vectorization

`adesh build -O3` / `jit` optimization scans hot loops over `[T]` with uniform `element_type` (per `ArrayElementType::from_type_name` `ast.rs:131`) and rewrites scalar iterators to `vec` batches: e.g., `alpha * x + y` over `[f64;256]` becomes `f64x4` chunks with tail scalar fallback.

### Interaction with `raw`, `alloc`, `region`

- `raw u8[32]` buffers may be `load_aligned`/`load_unaligned` into `vec32<u8>` — benefit of raw size-knowable length.
- `alloc<T>` buffers allocated inside a `region` can be reinterpret-cast to `vec` via `load_unaligned` for fused processing.
- `unsafe` required for raw reinterpret casts (`*mut T as *mut vec4<f32>`) that bypass typed lane safety.

---

## Examples

### Example 1 — Explicit lane construction, arithmetic, and horizontal reduction

```adesh
// f32x4 / vec4<f32> — 4-wide single precision in 128-bit register
let a = f32x4::new(1.0, 2.0, 3.0, 4.0);
let b = f32x4::new(10.0, 20.0, 30.0, 40.0);
let s = f32x4::splat(2.5); // broadcast scalar across lanes

let sum  = a + b;        // [11.0, 22.0, 33.0, 44.0] — element-wise
let diff = b - a;        // [9.0, 18.0, 27.0, 36.0]
let prod = a * b;        // [10.0, 40.0, 90.0, 160.0]
let scaled = prod * s;   // [25.0, 100.0, 225.0, 400.0] — lane-wise

// Fused multiply-add: a * b + c in one hardware cycle
let fma = a.fma(b, s);   // [12.5, 42.5, 92.5, 162.5]

// Horizontal reduction → scalar
let total = fma.horizontal_sum();
print(total); // single f32 scalar

// vec4<f32> alternate spelling
let a2: vec4<f32> = f32x4::new(1.0, 2.0, 3.0, 4.0);
let b2: vec4<f32> = f32x4::splat(3.0);
print(a2 * b2); // [3.0, 6.0, 9.0, 12.0]
```

### Example 2 — High-throughput batch — SIMD dot product, SAXPY, and RGBA blending

```adesh
// Dot product — 8x speedup over scalar loop (from simd/overview.md:93)
@pure
@noalloc
fn simd_dot_f32(a: vec8<f32>[], b: vec8<f32>[]) -> f32 {
    let len = a.len(); // contiguous DynArray slices
    let acc = f32x8::splat(0.0);
    let i = 0;
    while i + 8 <= len {
        let va = f32x8::load_unaligned(&a[i]); // buffer load from alloc/region/raw
        let vb = f32x8::load_unaligned(&b[i]);
        acc = va.fma(vb, acc);
        i += 8;
    }
    let total = acc.horizontal_sum();
    while i < len { total += a[i] * b[i]; i += 1; }
    return total;
}

// SAXPY with natural operator syntax over plain arrays — auto-vectorized by compiler
let alpha = 2.5;
let x = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
let y = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0];
let saxpy = alpha * x + y; // [12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100] — vectorized at O3
print(saxpy);

// RGBA image blending — 32-byte vectorized alpha compositing (see simd/overview.md:124)
@noalloc
fn blend_rgba(foreground: raw u8[32], background: raw u8[32], alpha: u8) -> raw u8[32] {
    let fg = u8x32::load_aligned(foreground);
    let bg = u8x32::load_aligned(background);
    let av = u8x32::splat(alpha);
    let blended = bg + ((fg - bg) * av) / 255;
    return blended.to_array();
}
```

### Example 3 — Interpreter-friendly `Simd` namespace plus backend lowering path

```adesh
// Portable path (runs in interpreter today) — no vecN type syntax required
import Simd;

let v1 = [1.0, 2.0, 3.0, 4.0];
let v2 = [10.0, 20.0, 30.0, 40.0];
print(v1 + v2);           // [11, 22, 33, 44] — element-wise, vectorized IR
print(Simd.dot(v1, v2));  // 100 == 1*10+2*20+3*30+4*40
print(Simd.mean([10.0, 20.0])); // 15

let vx = Simd.vector([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0]);
print(vx.scale(2.0));     // [2,4,6,8,10,12,14,16]

// Native path (AOT/JIT) — explicit vec types lowered to registers
let a: vec8<f32> = f32x8::splat(1.5);
let b: vec8<f32> = f32x8::new(1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0);
let c: vec8<f32> = a * b; // backend: AVX2 vmulps
print(c.horizontal_sum()); // 54.0

// Mixed raw + vec: load/store round-trip for FFI buffers
region batch {
    unsafe {
        let buf: *mut f32 = alloc<f32>(32);
        let v = f32x8::load_unaligned(buf); // reinterpret raw heap as lanes
        let scaled = v * f32x8::splat(2.0);
        scaled.store_unaligned(buf);
        // first lane doubled
        print(buf[0]); // 2 * original
        free(buf); // or rely on region bulk-free if this alloc was arena
    }
}
```

---

## Restrictions / Errors

| Kind | Trigger | Help |
|---|---|---|
| **Lexical** | `vec` as identifier: `let vec = 1` | Reserved `TokenKind::VecType`; `unexpected token 'vec', expected identifier` |
| **Type** | `vec4<f32> = vec8<f32>` assignment (lane-count mismatch) | `TypeError: expected vec4<f32>, found vec8<f32>` — slice or explicit `to_vecN` convert |
| **Type** | `vec3<f32>` or `vec5<i32>` (non-power-of-two, unsupported register width) | `invalid vec lane count N: must be 2/4/8/16/32 and divide register width` |
| **Type** | `vec16<f64>` (element × lanes exceeds allowed register class) | `TypeError: vec type exceeds backend register width (16 * 8B = 128B > 64B)` — use `vec4<f64>` / `f64x4` |
| **Compile** | `vec` without element type `vec4` | `expected '<' after vecN, found end of type` |
| **Runtime** | `f32x8::load_aligned(&unaligned)` | On native: alignment trap; on interpreter: fallback to `load_unaligned`. Use `load_unaligned` for heap `alloc` pointers not guaranteed 32-byte aligned |
| **Runtime** | Mixing `vecN<T>` with DynArray of different `concrete_type` | `TypeError: element type mismatch in vector op: expected f32 slice, found i32` (follows `ArrayElementType::from_type_name` `ast.rs:131`) |
| **Backend** | `vec` ops on WASM interpreter without SIMD128 enabled | `BackendSupport wasm=partial` (`simd/overview.md:185`) — falls back to scalar loop |
| **Lint** | Vectorizing inside inner loop with branching | Auto-vectorizer bails; manual `vec` rewrite needed — call `Simd` reduces instead |

**Tail handling:** Operations over inputs whose length is not a multiple of lane-N must run a scalar tail loop after the last full vector batch (see dot-product pattern `while i + N <= len` then scalar tail).

---

## See Also

- [SIMD Overview](../../simd/overview) — full lane map, intrinsics, auto-vectorization matrix (`BackendSupport` table)
- [raw](./raw) — `raw T[N]` C-compat arrays and `Value::RawArray` vs. `DynArray`, often `load`-source for `vec` ops
- [region](./region) — arena allocations suitable for vector batch buffers with bulk-free
- [alloc](./alloc) / [unsafe](./unsafe) — unsafe heap allocation and pointer reinterpret-cast for `vec` loading
- [Lexer & Parser](/docs/compiler/lexer-parser) — `TokenKind::VecType` vs `Raw` vs `Region` reservation
- `src/parsing/ast.rs:102-152` `ArrayElementType`, `src/memory/dynamic_allocator.rs` — element size for lane vectors
- `examples/numerics/matrix_operations.adesh` — worked array `alpha * x + y`, `Simd.dot`, `Simd.vector`

