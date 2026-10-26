---
id: ir
title: Intermediate Representations - HIR, MIR, and VIR
sidebar_label: The IR Pipeline
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Intermediate Representations — HIR, MIR, and VIR

<FeatureStatus status="STABLE" details="HIR -> MIR -> VIR lowering, SSA, constant folding, DCE, inlining, SIMD pass" />

Between the frontend and the execution backends, Adesh uses a layered
**intermediate representation (IR)** pipeline. Each layer strips away more
high-level detail while adding information the next stage needs:

```
AST ──► HIR ──► MIR ──► VIR ──► [Interpreter | Bytecode | JIT | AOT | WASM]
        │        │        │
     resolved  ownership  SSA + optimized
     & clean   annotated  low-level ops
```

> The **Core Invariant**: VIR is the unified input for the Interpreter,
> Native JIT, AOT, and WASM targets — one lowering, many targets.

---

## Pipeline Position & ASCII Architecture

```
                    ┌─────────────────────────────────┐
  AST (parser) ────►│           HIR Lower             │  src/ir/hir, src/parsing/hir_lower.rs
                    │  desugar, resolve, scope        │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      Semantic Analysis          │  src/semantics/engine.rs
                    │  type inference & checking      │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │         MIR Lower               │  src/ir/mir/lower.rs
                    │  ownership graph, ARC, drops    │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      Borrow Checker             │  src/parsing/cfg_borrow/*, src/ir/mir/borrow_analysis.rs
                    │  CFG, lifetime inference,       │
                    │  move/borrow validation         │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │         VIR Lower               │  src/ir/vir/lower.rs
                    │  SSA, flat instructions         │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      Optimization Passes        │  src/ir/optimizations/*
                    │  fold, propagate, CSE, DCE,     │  src/ir/simd/*, src/ir/parallel/*
                    │  inline, SIMD, parallel         │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │       VIR Validate              │  src/ir/vir/validate.rs
                    │  well-formedness, type checks   │
                    └──────────────┬──────────────────┘
                                   │
                          ┌────────▼────────┐
                          │  VIR (final)    │──► backends
                          └─────────────────┘
```

---

## HIR — High-Level IR

**Sources:** [`src/ir/hir`](file:///d:/Projects/AdeshLang/src/ir/hir) (`mod.rs`, `lower.rs`), `src/parsing/hir_lower.rs`, `src/parsing/hir_passes.rs`, `src/parsing/hir.rs`

HIR is the *desugared, resolved* form of the AST (covered in [Semantic Analysis & HIR](/docs/compiler/semantic-analysis)):

- `elif` / ternary sugar normalized to canonical control flow
- symbols resolved to declarations
- scopes explicit, shadowing tracked
- `this`/`self` unified

### HIR Example

Source:

```adesh
fn max(a: i32, b: i32): i32 {
    return if a > b { a } else { b };
}
```

HIR pseudo:

```
HirFunction max(a: i32, b: i32) -> i32
  Block#1
    HirIf
      cond: BinOp(Gt, Var(a), Var(b))
      then: Block#2 { Return Var(a) }
      else: Block#3 { Return Var(b) }
  Symbols: a→Param0, b→Param1
```

No `elif`, no ternary — just `HirIf`.

---

## MIR — Memory IR

**Sources:** [`src/ir/mir`](file:///d:/Projects/AdeshLang/src/ir/mir) — `mod.rs`, `lower.rs`, `types.rs`, `validate.rs`, `borrow_analysis.rs`, `ownership_graph.rs`, `arc_insertion.rs`, `drop_insertion.rs`, `lifetime_inference.rs`; plus `src/parsing/cfg_borrow/mir.rs` and the `src/parsing/ownership*.rs`, `borrow_check.rs`, `lifetime_tracking.rs`, `escape_analysis.rs` family.

MIR is the output of the **ownership/borrow analysis**: the same control flow, but now annotated with *ownership and move information*, and verified by the [borrow checker](/docs/compiler/borrow-checker). It is where the compiler proves memory safety before any code generation.

### What MIR Adds Over HIR

| HIR | MIR adds |
|---|---|
| `let x = foo()` | `let x: Owned<String> = foo()` + ownership state |
| `use(x)` | `Move(x)` or `Borrow(&x)` or `BorrowMut(&mut x)` |
| implicit drops | explicit `Drop(x)` at scope exit |
| shared values | `ArcClone` / `ArcDrop` where aliasing is proven safe |
| lifetimes | inferred regions, validated against CFG |
| control flow | lowered to basic blocks + terminators (CFG) |

### MIR Basic Block Example

Source:

```adesh
fn consume(s: String) { print(s); }
let msg = "hello";
consume(msg);
print(msg); // error: use of moved value
```

MIR pseudo:

```
fn main {
  bb0:
    msg: Owned<String> = "hello"
    Move(msg) → consume
    Drop(msg)            // moved, no drop here
    Use(msg)             // ERROR: use after move — borrow checker rejects
    Drop(msg)            // would be drop if not moved
}
```

The borrow checker (CFG + ownership graph) rejects this before VIR is ever produced.

### MIR Modules

| File | Responsibility |
|---|---|
| `mir/mod.rs` | MIR definition, block/terminator types |
| `mir/lower.rs` | HIR → MIR lowering |
| `mir/types.rs` | MIR type representation, ownership qualifiers |
| `mir/validate.rs` | well-formedness checks |
| `mir/borrow_analysis.rs` | borrow graph, alias analysis |
| `mir/ownership_graph.rs` | ownership state machine |
| `mir/arc_insertion.rs` | insert `Arc` clone/drop for shared ownership |
| `mir/drop_insertion.rs` | insert deterministic drops |
| `mir/lifetime_inference.rs` | region inference for references |
| `cfg_borrow/mir.rs` | CFG construction for borrow checking |

### Drop Insertion

MIR inserts `Drop` at the end of each scope for owned values that weren't moved:

```adesh
{
    let v = Vec::new(); // Owned
    v.push(1);
} // HIR: scope exit
  // MIR: Drop(v) inserted at bb terminator
```

This gives deterministic, GC-less cleanup.

---

## VIR — Vector/Low-Level IR

**Sources:** [`src/ir/vir`](file:///d:/Projects/AdeshLang/src/ir/vir) — `instructions.rs`, `lower.rs`, `types.rs`, `validate.rs`, `pretty_print.rs`; `src/ir/mod.rs`

VIR is the unified low-level IR that all backends consume. It is in **SSA form** (each value assigned once), with flat instructions and explicit control flow.

### VIR Modules

| File | Responsibility |
|---|---|
| `vir/instructions.rs` | instruction set definition (arithmetic, calls, branches, memory, SIMD) |
| `vir/lower.rs` | lowering from MIR to VIR instructions |
| `vir/types.rs` | low-level type representation (i32, i64, f32, f64, ptr, vec types) |
| `vir/validate.rs` | validation of the lowered IR (type-correct, SSA, terminators) |
| `vir/pretty_print.rs` | human-readable IR dumps (`--emit=vir` tooling) |
| `ir/mod.rs` | top-level IR orchestration |

### VIR Instruction Categories

| Category | Examples |
|---|---|
| Arithmetic | `Add`, `Sub`, `Mul`, `Div`, `Rem`, `Neg`, `Pow` |
| Logic | `And`, `Or`, `Not`, `Eq`, `Ne`, `Lt`, `Le`, `Gt`, `Ge` |
| Control | `Br`, `CondBr`, `Return`, `Call`, `TailCall`, `Phi` |
| Memory | `Alloca`, `Load`, `Store`, `AllocBox`, `Drop`, `ArcInc`, `ArcDec` |
| Aggregate | `ArrayNew`, `ArrayGet`, `ArraySet`, `TupleNew`, `ObjectNew` |
| SIMD | `SimdAdd`, `SimdMul`, `SimdDot`, `SimdBroadcast` (via `src/ir/simd`) |
| Parallel | `ParallelFor`, `Spawn`, `Join` (via `src/ir/parallel`) |

### HIR → MIR → VIR Lowering Example

Source:

```adesh
fn add(a: i32, b: i32): i32 { return a + b; }
let x = add(2, 3);
```

| Stage | Representation |
|---|---|
| **AST** | `FnStmt add(a,b) { Return(BinOp(Add, Var(a), Var(b))) }` + `LetStmt x = Call(add,[2,3])` |
| **HIR** | `HirFn add(a: i32, b: i32) -> i32 { HirReturn(HirBinOp(Add, HirVar(a), HirVar(b))) }` — resolved, no sugar |
| **MIR** | `bb0: _0 = Copy(a); _1 = Copy(b); _2 = Add(_0, _1); Return(_2)` — ownership: `Copy` for `i32` (trivially copyable), no drops |
| **VIR (SSA)** | `%0 = arg a: i32` <br/> `%1 = arg b: i32` <br/> `%2 = add i32 %0, %1` <br/> `ret %2` <br/> and at call site: `%3 = call @add(2, 3)` <br/> `%4 = store %3 → x` |

A string example shows moves:

```adesh
let s = "hello";
let t = s; // move
```

```
MIR: s: Owned<String> = "hello"
     t: Owned<String> = Move(s)   // s is now invalid
     Drop(t) at scope exit
     // no Drop(s)

VIR SSA:
  %0 = alloc_str "hello" : ptr
  %1 = move %0           : ptr    // ownership transfer, not memcpy
  drop %1 at exit
```

### SSA & Phi Nodes

VIR uses SSA: each virtual register is assigned once. Merges use `Phi`:

```adesh
let y = if cond { 10 } else { 20 };
```

```
bb0:  %cond = load cond
      cond_br %cond, bb1, bb2
bb1:  %v1 = const 10
      br bb3
bb2:  %v2 = const 20
      br bb3
bb3:  %y = phi [%v1, bb1], [%v2, bb2]
```

---

## Optimization Passes

**Sources:** [`src/ir/optimizations`](file:///d:/Projects/AdeshLang/src/ir/optimizations) — `mod.rs`, `constant_folding.rs`, `constant_propagation.rs`, `cse.rs`, `dead_code.rs`, `inlining.rs`; [`src/ir/simd`](file:///d:/Projects/AdeshLang/src/ir/simd); [`src/ir/parallel`](file:///d:/Projects/AdeshLang/src/ir/parallel)

Optimizations run on VIR after lowering and before validation.

| Pass | What It Does | Example |
|---|---|---|
| **Constant folding** | compute `2 + 3` → `5` at compile time | `add 2, 3` → `const 5` |
| **Constant propagation** | replace variables known to be constant | `let x = 5; y = x + 1` → `y = 6` |
| **CSE** (common subexpression elimination) | compute `a * b` once if used twice with no intervening changes | `t1 = a*b; t2 = a*b` → reuse `t1` |
| **Dead code elimination** | remove unreachable or unused code | `if false { ... }` → removed |
| **Inlining** | expand small hot functions inline | `fn inc(x){x+1} inc(5)` → `5+1` |
| **SIMD pass** | vectorize loops/values | scalar loop → `f32x4` ops |
| **Parallel pass** | auto-parallelize loops | `for` → `ParallelFor` |

### Optimization Pipeline Order

```
VIR lower
  → constant_folding
  → constant_propagation
  → cse
  → dead_code
  → inlining
  → simd::analysis → vectorize (if profitable per cost_model)
  → parallel::analysis → transform (if profitable)
  → validate
  → pretty_print (for --emit)
```

### SIMD Pass Detail

**Source:** [`src/ir/simd`](file:///d:/Projects/AdeshLang/src/ir/simd) — `analysis.rs` (identifies vectorizable loops/values), `vectorize.rs` (rewrites scalar ops as vector ops), `cost_model.rs` (profitability heuristic), `instructions.rs` / `types.rs` (vector instruction & type defs: `f32x4`, `f64x4`, `i32x8`, …), `lowering.rs` (backend lowering)

The SIMD pass rewrites scalar loops over contiguous arrays into vector instructions:

```
Before (scalar):
  for i in 0..n { c[i] = a[i] + b[i]; }

After (vectorized, f32x4):
  for i in 0..n step 4 {
    va = load_vec4 a[i..i+4]
    vb = load_vec4 b[i..i+4]
    vc = simd_add va, vb
    store_vec4 c[i..i+4], vc
  }
  // scalar remainder for n % 4
```

Cost model checks loop trip count, alignment, and dependency before vectorizing.

### Parallel Pass Detail

**Source:** [`src/ir/parallel`](file:///d:/Projects/AdeshLang/src/ir/parallel) — `analysis.rs`, `transform.rs`, `cost_model.rs`, `mod.rs`

Similar structure to SIMD but for thread-level parallelism; eligible loops become `ParallelFor` VIR nodes consumed by the scheduler.

---

## Validation & Pretty-Printing

- `vir/validate.rs` checks SSA well-formedness, type consistency, terminator completeness, and CFG dominance.
- `vir/pretty_print.rs` renders VIR for `--emit=vir`:

```bash
adesh run --emit=vir --njit myapp.adesh   # dump VIR
adesh run --emit=mir --njit myapp.adesh   # dump MIR
adesh run --emit=hir --njit myapp.adesh   # dump HIR
adesh run --emit=cfg  --njit myapp.adesh  # dump CFG
```

Example VIR dump:

```
func @main() -> void {
  bb0:
    %0 = const 2 : i32
    %1 = const 3 : i32
    %2 = call @add(%0, %1) : i32
    %3 = store %2 -> x
    ret
}
```

---

## What This Means for You

1. **One program, many backends** — VIR doesn't care whether it feeds the interpreter or Cranelift; the same program runs everywhere with identical semantics.
2. **Safety before speed** — by the time VIR exists, the borrow checker has already run on MIR. Optimizations never introduce unsafety.
3. **More tooling is possible** — because IR is validated and printable, future tools (decompilers, profilers, fuzzers) can work at a stable level.
4. **Performance is layered** — scalar correctness first, then auto-vectorization and auto-parallelization where the cost model says it's profitable.

---

## Where This Fits

- Previous: [Semantic Analysis & HIR](/docs/compiler/semantic-analysis) and [Borrow Checker](/docs/compiler/borrow-checker)
- Next: what consumes VIR — [Codegen & Backends](/docs/compiler/codegen) and [Execution Backends](/docs/backends/overview)
- Also see: [Compiler Architecture Overview](/docs/compiler/overview) and [SIMD Overview](/docs/simd/overview)

## Source Tree Quick Reference

```
src/ir/
├── mod.rs
├── hir/          # HIR def + lower
├── mir/          # MIR + ownership/borrow analyses
│   ├── mod.rs, lower.rs, types.rs, validate.rs
│   ├── borrow_analysis.rs, ownership_graph.rs
│   ├── arc_insertion.rs, drop_insertion.rs, lifetime_inference.rs
├── vir/          # VIR instructions, lowering, validation, pretty-print
│   ├── instructions.rs, lower.rs, types.rs, validate.rs, pretty_print.rs
├── optimizations/# fold, propagate, CSE, DCE, inline
│   ├── constant_folding.rs, constant_propagation.rs, cse.rs, dead_code.rs, inlining.rs
├── simd/         # auto-vectorization: analysis, vectorize, cost_model, lowering
└── parallel/     # auto-parallelization: analysis, transform, cost_model
```
