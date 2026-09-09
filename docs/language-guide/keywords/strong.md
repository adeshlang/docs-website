---
id: strong
title: strong
sidebar_label: strong
description: The strong keyword declares a strong ARC owning reference that increments the strong count and keeps the value alive until the last owner is dropped.
---

# `strong`

`strong` declares a **strong owning** ARC reference. A `strong` handle increments the allocation's strong count, keeps the value alive for at least as long as the handle itself lives, and participates in deterministic destruction when the count reaches zero. Use `strong` for dominant owners; pair with [`weak`](./weak) to break cycles.

> **Ground truth:** Lexer `TokenKind::Strong` (`src/parsing/lexer.rs:1012`, keyword `"strong"`), AST `StmtKind::StrongDeclaration(StrongDecl, bool /*export*/)` (`src/parsing/ast.rs:587`), `StrongDecl { name, expr, type_ann }` (`ast.rs:954-958`), `OwnershipKind::Strong` (`ast.rs:939`), runtime `Value::Share(StrongRef)` via `memory::arc::shared_object::{StrongRef,allocate_share,create_weak_from_strong}` (`ast.rs:1629`), lowering `StmtKind::StrongDeclaration` in `hir_lower.rs:57`.

---

## Syntax

```text
strong_decl ::= "strong" ident (":" type)? "=" expr ";"
export_strong ::= "export"? "strong" ident ...
type        ::= ident | generic_type | ...
```

`strong` is a declaration qualifier like `share` and `weak`, not a type operator. It appears at statement start.

### Minimal grammar

```adesh
strong owner = expr;
strong owner: T = expr;
export strong shared_cache = make_cache();
```

### Lexer

Reserved as `TokenKind::Strong`. Not usable as identifier; case-sensitive `strong` only.

### Parser → AST

```rust
// src/parsing/ast.rs:954
pub struct StrongDecl {
    pub name: String,
    pub expr: Expr,
    pub type_ann: Option<String>,
}
```

Stored as `StmtKind::StrongDeclaration(decl, export_flag)` where `export_flag` captures `export strong ...`.

### HIR / MIR

Lowered in `hir_lower.rs:57`: initializer evaluated, then `allocate_share` (`ast.rs:1628`) allocates `SharedObject { value, strong:1, weak:0 }` and returns `StrongRef`. `HirExpr::Share` may alias the handle (`hir.rs:230`). Assignment of a `strong` value clones the `StrongRef` (atomic increment).

Value representation at runtime (`ast.rs:1020`):

```rust
Value::Share(StrongRef) // strong ref (used for both share and strong today)
Value::Weak(WeakRef)     // created via weak decl / downgrade
```

Debug formatting shows counts (`ast.rs:1168`):

```text
<strong ref count=2, weak_count=1, value=[1, 2, 3]>
```

---

## Semantics

### ARC strong ownership

```
strong a = [1,2,3]     // SharedObject { strong=1, weak=0 }
strong b = a           // clone StrongRef → strong=2
{
    strong c = a       // strong=3
}                      // c dropped → strong=2
// a,b dropped → strong=0 → SharedObject::drop frees value
// if any WeakRef existed (weak>0), control block lingers until last Weak dropped
```

- **Strong count** = number of `share`+`strong` handles aliased to the same `SharedObject`. Value lives while `strong > 0`.
- **Weak count** = number of `WeakRef` observers (`weak` decls or `.downgrade()` results). Observers do *not* keep value alive and must `upgrade()` to obtain a temporary `StrongRef`.
- **Thread safety:** `StrongRef`/`WeakRef` atomics use the underlying ARC runtime; current interpreter counts are atomic.
- **Destruction:** Last strong drop destroys `value` immediately (deterministic, no GC pause) but may leave the control block until last weak dropped.

### Compilation pipeline

1. **Lex** `strong` → `TokenKind::Strong`.
2. **Parse** `StrongDecl { name, expr, type_ann }`.
3. **Optimize** `ast_optimizer.rs:404` folds initializer.
4. **Lower** → `allocate_share(initial_value)` then bind name to `StrongRef`.
5. **Borrow / ownership check** — `OwnershipKind::Strong` tracked like `Shared`; exclusive borrows conflict with shared/strong at CFG join (`merge.rs:174`).
6. **Drop insertion** — each strong handle gets a drop point at scope exit / `RegionExit` boundary.
7. **Codegen** — retains are `strong_ref.clone()`, releases are `drop(strong_ref)`; FFI boundary keeps count consistent via `invoke_arc_method` (`ast.rs:1629`).

### OwnershipKind context

```rust
pub enum OwnershipKind { Unique, Shared, Strong, Weak }
```

`Strong` and `Shared` (via `share`) both map to owning ARC; `Unique` is the implicit `let` single-owner form; `Weak` is non-owning (`WeakDecl`). The checker uses `OwnershipKind` to suggest fixes (`ownership_help::use_after_move`, `use_weak_for_cycle` in `error.rs:562`).

### Interaction with other primitives

- **`share`** — same runtime handle type, distinct intent: `share` = cache/interned shared-mutable resource, `strong` = dominant owner. Intermix freely — counts combine.
- **`weak`** — borrow a strong/share without incrementing `strong`. Prevents cycles like `parent: strong, child: weak back-link`.
- **`region`/`alloc`/`free`** — strong memory is *not* arena-allocated nor manually freed. Do not `free` a `strong` handle; allocation/free inside a strong-valued object's field still needs manual `free` before final drop.
- **`unsafe`** — `strong` handles remain safe to share across `unsafe` boundaries, but derive raw pointers via `strong.get()` pattern keeps borrow analysis honest.
- **Escape/`spawn`** — ARC types are considered safe for concurrent capture (`escape_analysis.rs:631`).

---

## Examples

### Example 1 — Strong ownership, cloning, and deterministic drop

```adesh
strong root = Node { value: 1 };
print(root.value); // 1

strong alias = root; // strong=2
print(alias.value);  // 1 — aliased, not copied

// Dropping one handle leaves value alive via the other:
{
    strong inner = root; // strong=3
    print("inner alive");
} // inner dropped → strong=2

print(root); // still alive, value=1

// After last strong dropped at scope exit → deallocated
```

Effectively:

```adesh
strong a = [1, 2, 3];
print(a);         // <strong ref count=1, weak_count=0, value=[1,2,3]> in debug
strong b = a;     // bumps count
print(a);         // <strong ref count=2, ...> — same allocation, pointer equality
print(b == a);    // true (handle equality, not element-wise)
```

### Example 2 — Cycle risk and breaking it with `weak` (graph/parent-child)

```adesh
struct Node { value: i32, next: Weak<Node> | null, child: strong Node | null }

// Pitfall: strong cycle leaks!
strong parent = Node { value: 1, next: null, child: null };
strong child  = Node { value: 2, next: null, child: null };

// If we write parent.next = child and child.next = parent as strong, both keep each other alive forever.
// Solution: back-edge is weak.
weak back = parent;                     // weak=1 (observer)
parent.child = child;                   // parent (strong=1) owns child
// child models back-link as weak — not automatically upgraded
fn parent_of(c) {
    let p = back.upgrade();             // returns StrongRef or null
    if p != null { print(p.value); }    // 1
    else { print("parent dropped"); }
}
parent_of(child); // 1

// When parent goes out of scope, back.upgrade() -> null, child can still be dropped.
```

Note: `Weak<T>.upgrade()` → `StrongRef | null`, and `WeakRef` debug format (`ast.rs:1178`) prints `<weak ref count=1, weak_count=1>`.

### Example 3 — `export strong` and mixing qualifiers

```adesh
// Shared configuration interned at module top-level
export strong CONFIG = Config { host: "localhost", port: 8080 };

// Consumers can alias without moving — moves would destroy single owner:
strong local_cfg = CONFIG; // alias, CONFIG still valid
print(local_cfg.host);     // localhost
print(CONFIG.host);        // localhost — not moved

// share vs strong interop — both increment the same counter
share cache = [1, 2, 3];
strong alias = cache;      // strong=2
share another = alias;     // strong=3 — counters are combined
weak observer = cache;     // weak=1 — does not bump strong

print(alias);              // <strong ref count=3, weak_count=1, value=[1,2,3]>
print(observer);           // <weak ref count=3, weak_count=1>

// Cleanup order demonstration with defer-style reasoning
region scratch {
    strong tmp = alloc_graph(); // ARC heap, outlives region if aliased outside
    strong leaked_out = tmp;    // strong escape
} // scratch bulk-free runs, but tmp's ARC value stays alive via leaked_out
print(leaked_out); // valid — region did not free ARC memory
```

---

## Restrictions / Errors

| Code / Kind | Trigger | Diagnostics |
|---|---|---|
| **Parse** | `let strong = 1` or `x.strong` as identifier | `unexpected token 'strong', expected identifier` — `TokenKind::Strong` reserved |
| **Parse** | `strong x;` missing `= expr` | `expected '=' after strong declaration` at `StrongDecl` span |
| **Type** | `strong x: T = expr` where `expr` not subtype of `T` | `TypeError: expected T, found U` with `type_ann` span |
| **Borrow** `BorrowKindConflict` | Mixing `strong/share` with simultaneous exclusive borrow at CFG join | `merge.rs:174` — narrow exclusive scope before aliasing |
| **Ownership** | Cycle with only `strong`s leaks | No compiler error (leak is semantic). Lint suggests `error::ownership_help::use_weak_for_cycle`: "keep one side as `weak` instead of `strong`/`share` only. Upgrade with `.upgrade()`" (`error.rs:562`) |
| **Use after move** | `let moved = unique_value; strong alias = moved;` use of `moved` | `ownership_help::use_after_move` suggests `share`/`strong`/`weak` instead of moving a `let` unique (`error.rs:499`) |
| **Mismatch** | `free(strong_handle)` | `free expects *mut T, found Share/StrongRef` — ARC memory not manually freed |
| **Export** | `export strong x = ...` outside module top-level | Parser restricts `export` flag; error notes `export only at top-level` |

**Debugging tip:** Print a `strong` handle with debug formatting to inspect `strong_count` / `weak_count` (`ast.rs:1169`). If `strong_count` never reaches 0, look for a missing scope exit or a `strong` cycle that should be `weak`.

---

## See Also

- [share](./share) — `ShareDecl` / `OwnershipKind::Shared`, copyable shared alias
- [weak](./weak) — `WeakDecl` / `WeakRef`, non-owning observer and `upgrade()` pattern
- [region](./region) — arena bulk-free vs ARC scope-based drop (`DropReason::RegionExit`)
- [alloc](./alloc) / [free](./free) — manual memory vs ARC-managed memory
- [Memory & Safety](/docs/advanced/memory-safety) — ARC patterns, breaking cycles
- [Lexer & Parser](/docs/compiler/lexer-parser) — `TokenKind::Strong` / `ShareDeclaration`
- `src/parsing/ast.rs:587,954-958,1020-1022` `StrongDeclaration`, `Value::Share`
- `src/memory/arc/shared_object.rs` `StrongRef`, `WeakRef`, `allocate_share`, `StrongRef::strong_count/weak_count`

