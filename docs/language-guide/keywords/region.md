---
id: region
title: region
sidebar_label: region
description: The region keyword declares a lexical arena — a scoped allocation space where all allocations are bulk-freed deterministically when the block exits.
---

# `region`

`region` declares a **lexical arena** (also called a memory region or scoped allocator): a named or anonymous block whose interior allocations live for the duration of the block and are all released together when the block exits. Regions give deterministic, zero-per-allocation cleanup and form the basis for scratch allocators on hot paths and borrow-lifetime bounding.

> **Ground truth:** Lexer `TokenKind::Region` (`src/parsing/lexer.rs:1008`, keyword `"region"`), AST `StmtKind::Region` with fields `name` and `body` (`src/parsing/ast.rs:678-681`), HIR `HirStmt::Region` with `name` and `body` (`src/parsing/hir.rs:351`), MIR `AllocKind::Region` (`src/parsing/cfg_borrow/mir.rs:149`), drop reason `DropReason::RegionExit` (`src/parsing/drop_insertion.rs:15,300`).

---

## Syntax

```text
region_stmt  ::= "region" ident? block
block        ::= "{" statements "}"
ident?       ::= optional arena name for allocation targeting
```

`region` is a block-level statement: the keyword followed by an optional identifier and a brace-delimited body. The identifier names the arena for explicit targeting (`allocate_in` style).

### Canonical forms

```adesh
region {
    let tmp = compute(); // arena-backed when alloc'd inside
}

region scratch {
    let buf: *mut u8 = alloc<u8>(1024); // bump-allocated inside scratch
    let tmp: *mut f32 = alloc<f32>(64);
    // both freed at `}` in one bulk operation
}

region frame {
    region inner {       // nested regions: inner frees before outer
        let a = alloc<u8>(16);
    } // inner bulk-free
    let b = alloc<u8>(32);
} // outer bulk-free of b plus any remaining inner survivors
```

### Named regions in HIR

```rust
// src/parsing/ast.rs:678
Region { name: Option<String>, body: Box<Stmt> }

// src/parsing/hir.rs:351
HirStmt::Region { name: Option<String>, body: Box<HirStmt> }
```

Unnamed regions (`region { }`) get an auto-assigned internal name/ID; named regions (`region scratch { }`) map via `RegionId` (`cfg_borrow/mir.rs:66-68`).

### Parser & lexer

- Reserved as `TokenKind::Region`; not usable as identifier.
- Body is boxed as a single `Block` statement preserving span for drop insertion and diagnostics.
- optimizer folds body: `ast_optimizer.rs:541`.

---

## Semantics

### Arena allocation

An arena is a contiguous buffer (initially per-thread, grown via `mmap`/heap) from which `alloc` requests inside the region are **bump-allocated**: the pointer advances by `size + padding`, with no per-allocation header. On `RegionExit` (`drop_insertion.rs:23,292`) the arena resets its offset to the entry watermark, instantly making all interior allocations available for reuse. No individual tracking overhead — O(1) bulk-free.

```
enter region scratch (watermark = off)
  alloc<u8>(64)   → ptr = base + off, off += 64
  alloc<f32>(16)  → aligned ptr, off += 64
  // ... work ...
exit }             → off = watermark   // bulk free, poisoning in debug
```

### Lifetime and borrow bounding

The compiler treats a `region` as a borrow scope: references and raw pointers derived inside the region that might alias arena memory must not escape past the closing `}`. `escape_analysis.rs` tracks captures and `unsafe_captures`; a raw pointer returned from or stored past a region is an error or at minimum `unsafe`.

### Compilation pipeline

1. **Lex** `region` → `TokenKind::Region`.
2. **Parse** `StmtKind::Region { name, body }`.
3. **Optimize** `fold_stmt` through body (`ast_optimizer.rs:541`).
4. **Lower** → `HirStmt::Region` (`hir_lower.rs: region branch`) and mark interior `alloc`s as `AllocKind::Region(RegionId)` in MIR (`mir.rs:149`).
5. **Drop insertion** → `plan_stmt("loc.region", body, ...)` records a `RegionExit` drop point (`drop_insertion.rs:294,300,306`) and ensures `defer` handlers inside region run *before* bulk-free (LIFO `defer` semantics).
6. **Ownership/CFG** — borrow states tied to region id; join across region boundaries respects `Freed`-like semantics for arena memory (treated as freed on exit).
7. **Backend** → arena base/watermark kept on stack; alloc is `base + offset & alignMask`; exit is single `offset = watermark` (optional debug poison).

### Interaction with `alloc`/`free`/`unsafe`

| Primitive | Inside `region` | Outside `region` |
|---|---|---|
| `alloc<T>(n)` | Arena bump (`Region`) — fast, bulk-free | Heap malloc (`Heap`) — needs `free` |
| `free(ptr)` | Accepted as no-op/redundancy; prefer omit | Required (or leak) |
| `unsafe { }` | May nest arbitrarily; reward is small `unsafe` slices inside region | — |
| `share`/`strong`/`weak` ARC | ARC heap unaffected; region does not free ARC handles | — |

Manual `free` inside a region is not an error but is unnecessary and may be warned by tooling — prefer to let the region reclaim.

### Nesting and `allocate_in`

Future API `allocate_in(arena: RegionId, size)` (`memory_management_research.md: arena pools`) maps to the named `region` parameter; in the interpreter current form, nesting handles targeting implicitly by region id.

---

## Examples

### Example 1 — Unnamed scratch region for hot-path temporaries

```adesh
fn render_frame(scene) {
    region {
        // Hundreds of small allocations for clipping, culling — all without per-alloc overhead.
        let visible = alloc<u8>(1024);
        for i in 0..1024 { visible[i] = 1; }

        let projected = alloc<f32>(256);
        for i in 0..256 { projected[i] = compute(scene, i); }

        blend(visible, projected);
        // No free calls — bulk-free here in O(1)
    }
    // No dangling pointers past this point — verified by escape analysis.
    check_no_leak();
}
```

### Example 2 — Named region with nested inner regions and interplay with `defer`/`unsafe`

```adesh
// Named region: explicit arena identity; inner region demonstrates stacking.
region scratch {
    unsafe {
        let outer_buf: *mut u8 = alloc<u8>(512);
        outer_buf[0] = 0xAB;
        defer print("outer defer before bulk-free"); // LIFO defer runs before RegionExit

        region inner {
            let inner_buf: *mut u8 = alloc<u8>(64);
            unsafe {
                inner_buf[0] = 0xCD;
                print(inner_buf[0]); // 205
                // inner_buf bulk-freed at inner `}` before outer continues
            }
        } // inner: bulk-free(inner_buf); defer-s already run

        print(outer_buf[0]); // 171 — outer_buf still live (outer region not exited)
        // free(outer_buf); // optional, redundant — outer bulk-free will reclaim
    }
} // outer: bulk-free(outer_buf) at DropReason::RegionExit

// Raw pointer from inner is not usable here — escape prevents it:
// let escaped: *mut u8;
// region bad {
//     escaped = alloc<u8>(8); // error/unsafe_captures: allocation does not outlive region
// }
// print(*escaped); // UseAfterFree if forced — rejected
```

### Example 3 — Region vs. ARC/manual memory: choosing the right tool

```adesh
// Scenario 1: short-lived batch work → region
fn batch_process(items) {
    region scratch {
        unsafe {
            // Each alloc is bump pointer ~ nanoseconds; free is one offset reset
            for item in items {
                let tmp: *mut u8 = alloc<u8>(item.size_hint());
                process_into(tmp, item);
                // no free per item
            }
        }
    } // one bulk-free regardless of early return or throw inside
}

// Scenario 2: long-lived shared object graph → ARC (share/strong/weak)
share graph = scene_graph();
strong root = graph;
weak observer = graph; // caches etc. do not pin graph

// Scenario 3: one-shot heap buffer that must escape its creating scope → manual alloc/free + unsafe
let escaped_buf: *mut u8;
let escaped_len: usize = 128;
unsafe {
    escaped_buf = alloc<u8>(escaped_len);
    escaped_buf[0] = 42;
}
// caller responsible for free after last use
unsafe { print(escaped_buf[0]); free(escaped_buf); }

// Region size hint (future): memory_management_research.md arena pre-sizing
region huge_batch {
    // Backend may pre-reserve arena based on expected usage
}
```

---

## Restrictions / Errors

| Code / Kind | Trigger | Diagnostics |
|---|---|---|
| **Parse** | `region used as variable: let region = 1` | Reserved `TokenKind::Region`; `unexpected token 'region'` |
| **Parse** | `region 123 { }` (non-ident name) | `expected identifier or '{' after 'region'` |
| **Escape** | Raw pointer or borrow of arena memory escapes `region { }` (stored to outer var, returned, captured by spawn) | `escape_analysis.rs` reports `unsafe_captures` / `Capture` error: "allocation from region does not outlive region" |
| **Ownership** | Use of arena `alloc` result after region exit | Treated similarly to `UseAfterFree` (`E0507`/`Freed`) at CFG level — pointer considered Freed at `RegionExit` |
| **MIR** | `AllocKind::Region` allocation with non-region place leaked | `mir.rs` validation: allocation's RegionId must match an enclosing Region — otherwise falls back to Heap |
| **Lifetimes** | Nested region where inner allocation assumed alive in outer after inner exit | Inner's exit poisons/arbitrary; use-after inner-free detected like `UseAfterFree` |
| **Defer order** | Expecting `defer` after bulk-free | `defer` runs *before* `RegionExit` (`drop_insertion.rs` ordering) — side-effects see memory still valid |
| **Compile** | `region` inside type alias / interface | Only valid as statement-level construct |
| **Runtime** | Arena OOM (watermark exceeds committed pages) | Backend grows arena or traps; currently `allocation failed in region 'scratch'` |

**Best practices for correctness:**

- Keep `region` blocks *narrow*: wrap the hot loop, not the whole program — escaping is harder to reason about the larger the block.
- Never return a raw pointer created inside a `region` without also copying the data out.
- Prefer `defer` for `unsafe` cleanup inside regions where early `return`/`throw` may bypass intended manual frees of heap-surviving allocations.

---

## See Also

- [alloc](./alloc) — typed bump vs. heap allocation (`AllocKind::Heap` vs `AllocKind::Region`)
- [free](./free) — why `free` is usually omitted inside regions
- [unsafe](./unsafe) — audit fence for deriving raw pointers from region arenas
- [raw](./raw) — `raw T[N]` storage vs `DynArray` — both benefit from region scoping
- [defer](./defer) — LIFO cleanup that runs before `RegionExit`
- [Memory & Safety](../../advanced/memory-safety#region-based-allocation) — arena concepts
- `src/parsing/ast.rs:677-683` `Region`/`UnsafeBlock`, `src/parsing/cfg_borrow/mir.rs:149`, `src/memory/dynamic_allocator.rs`, `memory/memory_management_research.md:96`

