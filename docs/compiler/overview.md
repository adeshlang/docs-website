---
id: overview
title: Compiler Architecture Overview
sidebar_label: Architecture Overview
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# AdeshLang Compiler Architecture

<FeatureStatus status="STABLE" details="Modular AST -> HIR -> MIR -> VIR -> CodeGen pipeline with multi-backend emission" />

The AdeshLang compiler is structured as a multi-stage compilation pipeline designed for high diagnostic clarity, memory safety verification, and execution backend flexibility. Every source file passes through the same front-end regardless of whether it will be interpreted, JIT-compiled, or AOT-linked — ensuring identical semantics across all targets.

---

## Full Pipeline ASCII Diagram

```
  .adesh source text
        │
        ▼
  ┌─────────────┐     src/parsing/lexer.rs
  │   Lexer     │──── token stream (Token { kind, lexeme, line, col, line_text })
  └──────┬──────┘     src/parsing/error.rs  (rich diagnostics)
         │
         ▼
  ┌─────────────┐     src/parsing/parser/*.rs
  │   Parser    │──── AST (src/parsing/ast.rs) — lossless, typed nodes
  └──────┬──────┘     parser/core.rs, statements.rs, expressions*.rs,
         │            type_annotations.rs, type_decls.rs, literals.rs,
         │            functions.rs, classes.rs, extern_ffi.rs, declarations.rs
         │
         ▼
  ┌──────────────────┐  src/parsing/ast_optimizer.rs
  │  AST Optimizer   │── constant folding on AST, node normalization
  └──────┬───────────┘
         │
         ▼
  ┌─────────────┐     src/ir/hir/*, src/parsing/hir_lower.rs, src/parsing/hir_passes.rs
  │    HIR      │──── desugared, resolved, explicit scopes
  └──────┬──────┘     elif/ternary normalized, this/self unified
         │
         ▼
  ┌──────────────────┐ src/semantics/engine.rs, src/semantics/mod.rs
  │ Semantic Analysis│── name resolution, type inference & checking,
  └──────┬───────────┘  generic bounds, trait resolution, control-flow legality
         │
         ▼
  ┌──────────────────┐ src/parsing/cfg_borrow/*, src/parsing/borrow_check.rs,
  │  Borrow Checker  │  src/ir/mir/*, src/parsing/ownership*.rs
  │  + MIR           │── ownership graph, move analysis, ARC insertion,
  └──────┬───────────┘  lifetime inference, drop insertion, CFG validation
         │
         ▼
  ┌─────────────┐     src/ir/vir/*  (instructions.rs, lower.rs, types.rs, validate.rs)
  │    VIR      │──── SSA-form low-level IR, unified input for all backends
  └──────┬──────┘     src/ir/optimizations/* (constant_folding, CSE, DCE, inlining)
         │            src/ir/simd/* (analysis, vectorize, cost_model, lowering)
         │            src/ir/parallel/* (analysis, transform, cost_model)
         │
    ┌────┼──────────────────────────────┬─────────────────────┐
    ▼    ▼                              ▼                     ▼
┌────────┐ ┌──────────┐  ┌──────────────────┐  ┌──────────┐ ┌──────────┐
│Interpr.│ │ Bytecode │  │  Cranelift JIT   │  │   AOT    │ │WASM/GPU  │
│ Tree-  │ │   VM     │  │ Baseline/Adaptive│  │ Native   │ │ MLIR     │
│ walk   │ │  --vm    │  │ --jit / --njit  │  │ --aot    │ │ --wasm   │
└───┬────┘ └────┬─────┘  └────────┬─────────┘  └────┬─────┘ └────┬─────┘
    │           │                 │                 │            │
    └───────────┴─────────────────┴─────────────────┴────────────┘
                              Runtime
              src/execution/, src/typesystem/value_optimized.rs,
              src/utils/interner.rs, stdlib registry
```

### Data-flow summary

```
Source ─► Lexer ─► Parser ─► AST ─► HIR ─► Semantic ─► MIR/Borrow ─► VIR ─► CodeGen ─► Runtime
  .adesh  tokens   tree   desugar  types   ownership   SSA/opt    backends   Value(16B), Env, GC-less
```

---

## Compiler Stages & Implementation Mapping

| # | Pipeline Stage | Responsibilities | Source Path |
|---|---|---|---|
| 1 | **Lexer** | Tokenization, BOM handling, operator lexing (`??`, `?.`, `**`, `~/`, `...`, `=>`), comment/doc-comment stripping, position tracking | [`src/parsing/lexer.rs`](file:///d:/Projects/AdeshLang/src/parsing/lexer.rs), [`src/parsing/error.rs`](file:///d:/Projects/AdeshLang/src/parsing/error.rs) |
| 2 | **Parser** | Recursive-descent grammar, expression/statement/type-annotation parsing, error recovery to next statement boundary | [`src/parsing/parser`](file:///d:/Projects/AdeshLang/src/parsing/parser) — `core.rs`, `statements.rs`, `expressions.rs`, `expressions_primary.rs`, `expressions_unary.rs`, `literals.rs`, `functions.rs`, `classes.rs`, `type_annotations.rs`, `type_decls.rs`, `declarations.rs`, `extern_ffi.rs` |
| 3 | **AST** | Lossless typed tree (`FnStmt`, `ClassStmt`, `StructStmt`, `EnumStmt`, `MatchExpr`, decorators, generics, template literals), receiver normalization | [`src/parsing/ast.rs`](file:///d:/Projects/AdeshLang/src/parsing/ast.rs), [`src/parsing/ast_optimizer.rs`](file:///d:/Projects/AdeshLang/src/parsing/ast_optimizer.rs) |
| 4 | **HIR** | Desugaring (`elif` chains, ternary → canonical if), symbol resolution, scope explicitation, `this`/`self` unification | [`src/ir/hir`](file:///d:/Projects/AdeshLang/src/ir/hir) — `mod.rs`, `lower.rs`; [`src/parsing/hir_lower.rs`](file:///d:/Projects/AdeshLang/src/parsing/hir_lower.rs), [`src/parsing/hir_passes.rs`](file:///d:/Projects/AdeshLang/src/parsing/hir_passes.rs), [`src/parsing/hir.rs`](file:///d:/Projects/AdeshLang/src/parsing/hir.rs) |
| 5 | **Semantic Analysis** | Type inference, trait/generic bound checking, function signature validation, field access, control-flow legality, pattern-match exhaustiveness | [`src/semantics`](file:///d:/Projects/AdeshLang/src/semantics) — `engine.rs`, `mod.rs`; [`src/types`](file:///d:/Projects/AdeshLang/src/types), [`src/typesystem`](file:///d:/Projects/AdeshLang/src/typesystem) |
| 6 | **Borrow / Ownership (MIR)** | Ownership graph, move/borrow tracking, CFG lifetime validation, ARC insertion, drop insertion, escape analysis | [`src/parsing/cfg_borrow`](file:///d:/Projects/AdeshLang/src/parsing/cfg_borrow), [`src/ir/mir`](file:///d:/Projects/AdeshLang/src/ir/mir) — `mod.rs`, `lower.rs`, `types.rs`, `validate.rs`, `borrow_analysis.rs`, `ownership_graph.rs`, `arc_insertion.rs`, `drop_insertion.rs`, `lifetime_inference.rs`; also `src/parsing/borrow_check.rs`, `borrow_inference.rs`, `ownership.rs`, `ownership_enhanced.rs`, `lifetime_tracking.rs`, `escape_analysis.rs`, `variance.rs` |
| 7 | **VIR & Optimizations** | SSA lowering, constant folding/propagation, CSE, DCE, inlining, SIMD vectorization pass, parallel transform, validation & pretty-printing | [`src/ir/vir`](file:///d:/Projects/AdeshLang/src/ir/vir) — `instructions.rs`, `lower.rs`, `types.rs`, `validate.rs`, `pretty_print.rs`; [`src/ir/optimizations`](file:///d:/Projects/AdeshLang/src/ir/optimizations); [`src/ir/simd`](file:///d:/Projects/AdeshLang/src/ir/simd); [`src/ir/parallel`](file:///d:/Projects/AdeshLang/src/ir/parallel) |
| 8 | **CodeGen Backends** | Interpreter (reference), Bytecode VM, baseline/adaptive JIT, Cranelift native JIT, AOT object/linker, WASM, GPU/MLIR | [`src/backends/`](file:///d:/Projects/AdeshLang/src/backends) — `interpreter_backend/`, `jit/` (adaptive, cranelift, tiered), `aot/` (abi, cache, module_linking, object_gen, static_linker, cranelift, cranelift_impl), `wasm_backend/`, `mlir/`, `llvm/`, `common/ffi`, `lowering/` |
| 9 | **Runtime** | 16-byte `Value` enum, string interning, shared `Arc` ownership, nested environments, promise microtask queue, timers, builtin registry | [`src/execution/`](file:///d:/Projects/AdeshLang/src/execution), [`src/typesystem/value_optimized.rs`](file:///d:/Projects/AdeshLang/src/typesystem/value_optimized.rs), [`src/utils/interner.rs`](file:///d:/Projects/AdeshLang/src/utils/interner.rs) |

---

## Core Invariants

1. **Source of Truth Integrity**: Semantic analysis runs on desugared HIR before VIR lowering. The checker never sees surface sugar.
2. **Compile-Time Safety**: Borrow checking and move analysis reject illegal aliasing, use-after-move, and lifetime violations *before* code generation. See [Borrow Checker](/docs/compiler/borrow-checker).
3. **Multi-Backend Portability**: VIR is the unified input for Interpreter, Bytecode VM, JIT, and AOT. One lowering, many targets — observable semantics are identical.
4. **Diagnostics First**: Every stage preserves source positions (`line`, `col`, `line_text`) so errors render with `--> file:line:col` and source context.
5. **GC-less Determinism**: No garbage collector. Ownership, `Arc`, and RAII drops give deterministic memory behavior (see [Memory Management](/docs/compiler/memory-management)).

---

## How the Stages Interact

```
                ┌─────────────────────────────────────────────┐
                │              Frontend (parsing)             │
  source.adesh ─► Lexer ─► Parser ─► AST ─► ast_optimizer   │
                └──────────────────────┬──────────────────────┘
                                       │
                ┌──────────────────────▼──────────────────────┐
                │           Middle-end (analysis)             │
                │  HIR lower ─► Semantics ─► MIR/Borrow      │
                │  (scopes)    (types)   (ownership/CFG)     │
                └──────────────────────┬──────────────────────┘
                                       │
                ┌──────────────────────▼──────────────────────┐
                │            Low-end (IR + opt)               │
                │  VIR lower ─► optimizations ─► VIR validate │
                │  (SSA)       (fold/CSE/DCE/inline/SIMD)    │
                └──────────────────────┬──────────────────────┘
                                       │
                ┌──────────────────────▼──────────────────────┐
                │              Backends (codegen)             │
                │  Interpreter │ Bytecode │ JIT │ AOT │ WASM  │
                └──────────────────────┬──────────────────────┘
                                       │
                                       ▼
                                   Runtime Value
```

- **Frontend** is syntax-aware but type-blind; its job is to produce a well-formed tree.
- **Middle-end** is where *meaning* is checked: names, types, ownership.
- **Low-end** erases high-level constructs into flat VIR instructions and optimizes them.
- **Backends** consume VIR and emit executable behavior.

---

## Inspecting the Pipeline

The CLI exposes IR dumps for learning and debugging:

```bash
adesh run --emit=hir  --njit myapp.adesh   # dump HIR (desugared, resolved)
adesh run --emit=mir  --njit myapp.adesh   # dump MIR (ownership-annotated)
adesh run --emit=vir  --njit myapp.adesh   # dump VIR (SSA + optimized)
adesh run --emit=cfg  --njit myapp.adesh   # dump CFG for borrow analysis
adesh --help                                 # all flags defined in src/cli/args.rs
```

REPL helpers:

```adesh
:ast let x = 42;      // parser output
:type  x              // semantic type
:env                  // current environment / scopes
```

---

## Inside the Pipeline — Deep Dives

| Stage | Deep dive |
|---|---|
| Source text → tokens → AST | [Lexer & Parser](/docs/compiler/lexer-parser) |
| HIR + type checking + symbol resolution | [Semantic Analysis & HIR](/docs/compiler/semantic-analysis) |
| Ownership, borrows, drops — compile-time safety | [Memory Safety Analysis](/docs/compiler/borrow-checker) |
| HIR → MIR → VIR, optimization & SIMD passes | [The IR Pipeline](/docs/compiler/ir) |
| VIR → interpreter / JIT / AOT / WASM | [Codegen & Backends](/docs/compiler/codegen) |
| Runtime values, environments, async services | [Runtime & Value Model](/docs/compiler/runtime) |
| Allocators, arenas, Arc, cycle detection | [Memory Management](/docs/compiler/memory-management) |

---

## Design Rationale

| Decision | Why |
|---|---|
| Recursive-descent parser | Predictable, debuggable, excellent error recovery; one error doesn't hide the next |
| Lossless AST | Preserves source fidelity for diagnostics and tooling (formatters, linters) |
| HIR desugaring before semantics | Checker sees one canonical form — fewer special cases, fewer bugs |
| MIR for borrow checking | Control-flow graph makes lifetime/move errors decidable and explainable |
| VIR as single backend input | Backends stay consistent; new targets implement one interface |
| GC-less runtime | Latency-free, cache-friendly; ownership checked at compile time |

## Source Tree Quick Reference

```
src/
├── parsing/               # Lexer, Parser, AST, HIR lower, borrow/ownership analyses
│   ├── lexer.rs
│   ├── ast.rs / ast_optimizer.rs
│   ├── hir.rs / hir_lower.rs / hir_passes.rs
│   ├── parser/*.rs        # 12 sub-parsers
│   ├── cfg_borrow/        # CFG + borrow checker
│   └── borrow_check.rs, ownership.rs, lifetime_tracking.rs, ...
├── semantics/             # Type checking, symbol resolution
│   ├── engine.rs
│   └── mod.rs
├── types / typesystem/    # Type definitions + runtime Value
├── ir/
│   ├── hir/               # HIR definition & lowering
│   ├── mir/               # MIR + borrow/ownership analyses
│   ├── vir/               # VIR instructions, lowering, validation
│   ├── optimizations/     # Fold, propagate, CSE, DCE, inline
│   ├── simd/              # Auto-vectorization
│   └── parallel/          # Auto-parallelization
├── backends/
│   ├── interpreter_backend/
│   ├── jit/               # baseline, adaptive, cranelift, tiered
│   ├── aot/               # abi, cache, object_gen, static_linker
│   ├── wasm_backend/ / wasm/
│   ├── mlir/              # GPU path
│   ├── llvm/              # alternative native path
│   └── common/ffi
└── execution/             # Interpreter runtime, environments, async
```
