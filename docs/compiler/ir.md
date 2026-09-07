---
id: ir
title: Intermediate Representations - HIR, MIR, and VIR
sidebar_label: The IR Pipeline
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Intermediate Representations — HIR, MIR, and VIR

<FeatureStatus status="STABLE" details="HIR -> MIR -> VIR lowering, SSA, constant folding, DCE, inlining, SIMD pass" />

Between the frontend and the execution backends, AdeshLang uses a layered
**intermediate representation (IR)** pipeline. Each layer strips away more
high-level detail while adding information the next stage needs:

```text
AST ──► HIR ──► MIR ──► VIR ──► [Interpreter | Bytecode | JIT | AOT | WASM]
        │        │        │
     resolved  ownership  SSA + optimized
     & clean   annotated  low-level ops
```

## HIR — High-Level IR

**Source:** [`src/ir/hir`](file:///d:/Projects/AdeshLang/src/ir/hir),
`src/parsing/hir_lower.rs`, `src/parsing/hir_passes.rs`

The HIR is the *desugared, resolved* form of the AST (covered in
[Semantic Analysis & HIR](/docs/compiler/semantic-analysis)):

- `elif` / ternary sugar normalized to canonical control flow
- symbols resolved to declarations
- scopes explicit

## MIR — Memory IR

**Source:** [`src/ir/mir`](file:///d:/Projects/AdeshLang/src/ir/mir),
`src/parsing/cfg_borrow/mir.rs`

The MIR is the output of the **ownership/borrow analysis**: the same control
flow, but now annotated with *ownership and move information*, and verified by
the [borrow checker](/docs/compiler/borrow-checker). It is where the compiler
proves memory safety before any code generation.

## VIR — Vector/Low-Level IR

**Source:** [`src/ir/vir`](file:///d:/Projects/AdeshLang/src/ir/vir)

The VIR is the unified low-level IR that all backends consume. Its modules:

| File | Responsibility |
|---|---|
| `instructions.rs` | instruction set definition |
| `lower.rs` | lowering from MIR to VIR instructions |
| `types.rs` | low-level type representation |
| `validate.rs` | validation of the lowered IR |
| `pretty_print.rs` | human-readable IR dumps (`--emit` tooling) |

> The **Core Invariant**: LIR/VIR is the unified input for the Interpreter,
> Bytecode VM, JIT, and AOT targets — one lowering, many backends.

## Optimization passes

**Source:** [`src/ir/optimizations`](file:///d:/Projects/AdeshLang/src/ir/optimizations)

| Pass | What it does |
|---|---|
| **Constant folding** | compute `2 + 3` → `5` at compile time |
| **Constant propagation** | replace variables known to be constant with their value |
| **CSE** (common subexpression elimination) | compute `a * b` once if used twice with no intervening changes |
| **Dead code elimination** | remove unreachable or unused code |
| **Inlining** | expand small hot functions inline for faster codegen |

Plus a **SIMD pass** ([`src/ir/simd`](file:///d:/Projects/AdeshLang/src/ir/simd))
that can vectorize loops, with:

- `analysis.rs` — identifies vectorizable loops/values
- `vectorize.rs` — rewrites scalar ops as vector ops
- `cost_model.rs` — decides whether vectorization is worth it
- `instructions.rs` / `types.rs` — vector instruction & type definitions
- `lowering.rs` — lowering vector ops for a backend

## What this means for you

1. **One program, many backends** — the VIR doesn't care whether it feeds the
   interpreter or Cranelift; the same program can run everywhere.
2. **Safety before speed** — by the time the VIR exists, the borrow checker
   has already run on the MIR.
3. **More tooling is possible** — because the IR is validated and printable,
   future tools (decompilers, profilers, fuzzers) can work at a stable level.

You can inspect IR today with the CLI's `--emit` tooling (see
[Compiler Tooling](/docs/tools/cli)):

```bash
adesh run --emit=vir --njit myapp.adesh   # dump the vector IR
```

## Where this fits

- Previous: [Borrow Checker](/docs/compiler/borrow-checker)
- Next: what consumes the VIR — [Execution Backends](/docs/backends/overview)
- Also see: [Compiler Architecture Overview](/docs/compiler/overview)
