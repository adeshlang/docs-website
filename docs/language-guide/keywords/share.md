---
id: share
title: share
sidebar_label: share
description: The share keyword introduces a shared (aliased, non-exclusive) reference — a copyable, read-oriented handle with shared ARC ownership.
---

# `share`

`share` introduces a *shared* reference handle. Shared handles are copyable, may be freely aliased, and provide read-oriented access to a value whose lifetime is governed by ARC strong counts. In the AST it is a dedicated ownership declaration (`ShareDeclaration`) with its own `ShareDecl` struct, distinct from `strong` (owning) and `weak` (non-owning).

> **Ground truth:** Lexer `TokenKind::Share` (`src/parsing/lexer.rs:1011`, keyword `"share"`), AST `StmtKind::ShareDeclaration(ShareDecl, bool /*export*/)` (`src/parsing/ast.rs:586`), `ShareDecl { name, expr, type_ann }` (`ast.rs:947-951`), `OwnershipKind::Shared` (`ast.rs:938-943`), runtime lowers via `memory::arc::shared_object` and `HirExpr::Share` (`hir.rs:230`).

---

## Syntax

```text
share_decl   ::= "share" ident (":" type)? "=" expr ";"
export_share ::= "export"? "share" ident ...
type         ::= ident | generic_type | "raw" type | ...
```

`share` is a declaration-level qualifier, not a type modifier on arbitrary expressions. It must appear at statement start (or after `export`). The initializer expression's value becomes the shared contents.

### Canonical forms

```adesh
share cache = [1, 2, 3];                // inferred element type (i64 per DynamicArray inference)
share cfg: Config = Config { host: "localhost", port: 8080 };
export share VERSION = "1.2.0";

share graph = alloc_graph();              // strong count initialized to 1
strong alias = graph;                     // bumps strong count to 2 (see strong)
weak observer = graph;                    // non-owning view (see weak)
```

### Lexer & parser

- Reserved as `TokenKind::Share`; cannot be used as identifier.
- Parsed as `StmtKind::ShareDeclaration` before any `Let` fallback — `share x = ...` is not confused with `let x = share ...`.
- `type_ann` captures an optional `: Type` annotation as a raw string (`ast.rs:950`).
- `export` flag threaded from parser for module visibility (`ast.rs:586`).

### HIR & MIR

- Lowered to `HirExpr::Share(inner)` / declaration handles via `hir_lower.rs:43` (`StmtKind::ShareDeclaration` → `SharedObject` allocation `allocate_share` (`ast.rs:1628`)).
- Runtime type `Value::Share(StrongRef)` is not yet distinct from strong in current interpreter — both are `Share(StrongRef)` / `Strong` shares the same `StrongRef` backing. The qualifier primarily affects *intent* and borrow semantics at the CFG level, with weak observers incrementing `weak_count` only.

---

## Semantics

### Ownership model

```
share owner = expr
   |
   +--> StrongRef { ptr: SharedObject { value, strong=1, weak=0 } }
          |
          +-- strong alias = owner   (strong=2, shared alias)
          +-- weak w = owner         (strong=2, weak=1)
          +-- share copy = owner     (strong=3) — copyable
```

- **Shared ownership:** A `share` declaration creates a `StrongRef` with `strong_count=1`. Further `share` or `strong` aliases bump `strong_count`. The allocation lives until the last strong/share handle is dropped (borrow checker / drop insertion).
- **Copyable / aliased:** Unlike `let` unique values, `share`/`strong` handles are `Copy` in the ownership sense — assignment clones the handle, not the data (`user.rs:copy` clone increments count).
- **Read bias:** Shared handles are intended for read-heavy sharing; mutation requires interior coordination (e.g., `RwLock`-like discipline via interpreter) — best expressed through safe accessor methods rather than raw `&mut`.
- **Not the same as borrowed `&T`:** Borrow handles (`Value::Ref`) are non-owning, scoped borrows. `share` is *owning* shared — it keeps the value alive.

### Compilation pipeline

1. **Lex** `share` → `TokenKind::Share`.
2. **Parse** `ShareDecl { name, expr, type_ann }`.
3. **Optimize** `ast_optimizer.rs:396` folds initializer.
4. **Lower** → allocate via `allocate_share(value)` producing `StrongRef` (`memory::arc::shared_object`).
5. **Borrow check/CFG** — `Shared` ownership kind joins with `Strong` correctly; `share`+`share` merge does not conflict, whereas `share`+`exclusive` does (`merge.rs:174 BorrowKindConflict`).
6. **Codegen** — reference count bumps are atomic (`StrongRef`/`WeakRef` counts).

### Distinction: `share` vs. `strong` vs. `weak`

| Qualifier | Declaration | ARC effect | Copyable | Keeps alive | Prevents cycles alone |
|---|---|---|---|---|---|
| `share` | `share x = expr` (`ShareDecl`) | `strong+1` (shared ownership) | yes | yes | no — needs a `weak` edge |
| `strong` | `strong x = expr` (`StrongDecl`) | `strong+1` (strong ownership) | yes | yes | no |
| `weak` | `weak x = expr` (`WeakDecl`) | `weak+1` only | yes | **no** | yes — breaks cycles |

`share` vs. `strong` is largely *semantic intent* in current implementation (both use `StrongRef`); documentation and lints distinguish "shared cache / interned value" (`share`) from "dominant owner" (`strong`). Future compiler may assign different borrow precedence.

### Interaction with regions and unsafe

- `share` allocations are heap-ARC, not arena. A `share` inside a `region` still outlives the region if aliased outside; dropping the last handle after region exit frees it.
- Inside `unsafe`, raw pointers to the shared value may be derived (`&*shared_ptr`), but capturing them beyond the strong lifetime is `unsafe_captures` (`escape_analysis.rs:131`).

---

## Examples

### Example 1 — Sharing a value across owners without moves

```adesh
// Without share — move destroys source.
let owner = [1, 2, 3];
// let stolen = owner;     // move: owner unusable after
// print(owner);           // E0507 / use after move

// With share — aliased handles, both remain valid.
share cache = [1, 2, 3];
share cache2 = cache;       // copies handle, strong count = 2
strong primary = cache;     // strong copy, count = 3
print(cache);               // [1, 2, 3]
print(cache2);              // [1, 2, 3] — same allocation, Value::Share pointer eq
print(primary);             // [1, 2, 3]
// All three handles keep the array alive until last drop.
```

### Example 2 — Shared config with weak observers (cycle-safe pattern)

```adesh
struct Node {
    value: i32
    // Do not embed parent as strong — cycle!
}

share config = Config { host: "localhost", port: 8080 };

// Multiple readers share the same config without copying the struct.
fn connect(cfg: Config) { print(cfg.host); }

share reader_a = config;
share reader_b = config;
connect(reader_a);
connect(reader_b);

// Weak observer does not extend lifetime — for caches/memos.
weak observer = config;
if let held = observer.upgrade() {
    print("config still alive via strongs");
    print(held.host); // localhost
} else {
    print("config dropped");
}

// Drop last strong/share => observer.upgrade() returns null.
```

### Example 3 — Reference counting visibility and mutation discipline

```adesh
share counter = 0; // shared primitive — Value::Share(StrongRef) with strong_count 1

// Assignment bumps count (copy-by-handle, not by value)
share c2 = counter;     // strong_count == 2
share c3 = c2;          // strong_count == 3 — proven via runtime debug formatting

// Runtime debug shows counts:
// print(counter); // <strong ref count=3, weak_count=0, value=0> when formatted with debug

// Mutation through share — via owning handle (interpreter mediates interior write).
// Prefer accessor functions for clarity rather than aliasing mutation.
fn increment(s) { s += 1; } // operator assignment over Share-typed value (HirExpr)
increment(counter);

// All handles observe the same value because they alias the same SharedObject.
print(counter); // 1
print(c2);      // 1

// To avoid unintended sharing, bind a fresh let instead of share:
// let isolated = 5; // unique value, not aliased
```

---

## Restrictions / Errors

| Code / Kind | Trigger | Diagnostics |
|---|---|---|
| **Parse** | `share` used as variable name: `let share = 1` | Lexer reserves `TokenKind::Share`; `unexpected token 'share', expected identifier` |
| **Parse** | `share` without initializer: `share x;` | `expected '=' after share declaration` (parser at `ShareDecl`) |
| **Type** | `share x: T = expr` where `expr: U` incompatible with `T` | `TypeError: expected T, found U` at `ShareDecl.type_ann` span |
| **Ownership** `BorrowKindConflict` | Using `share` value while exclusively borrowed in same CFG join | `merge.rs:174` reports `BorrowKindConflict` — narrow the exclusive scope or use `weak` observer |
| **Ownership** | Dropping `share` with live `weak` still formatted as dangling | Not an error — `Weak` print shows `strong=0, weak=N` (`ast.rs:1181`). Upgrade returns `null`. |
| **CFG** | Sharing does not prevent double-free of manual `alloc` inside the shared value | Manual alloc inside a struct must still be freed via `free` before last ARC drop, else leak; leak detector in `dynamic_allocator` reports at exit. |
| **Export** | `export share x = ...` misuse outside module top-level | Parser restricts `export` flag to top-level declarations |

**Common pitfall — confusing `share` with borrow `&`:**

```adesh
share s = compute();
let borrow = &s;             // Ref borrow, not owning
free(s);                    // ERROR: free not valid on Share-typed value (only alloc pointers)
```

Use ARC scope exit to reclaim `share` memory, never `free`.

---

## See Also

- [strong](./strong) — `StrongDecl` (`ast.rs:954-958`), strong owning ref (`OwnershipKind::Strong`)
- [weak](./weak) — `WeakDecl` (`ast.rs:960-964`), non-owning `WeakRef` and `upgrade()`
- [Memory & Safety](/docs/advanced/memory-safety) — ARC patterns and cycle avoidance
- [alloc](./alloc) / [free](./free) — manual memory vs ARC-managed memory
- [Lexer & Parser](/docs/compiler/lexer-parser) — `TokenKind::Share`
- `src/parsing/ast.rs:586-588,938-951,1017-1022` — `ShareDeclaration`, `ShareDecl`, `Value::Share/Weak`
- `src/memory/arc/shared_object.rs` — `allocate_share`, `StrongRef`, `WeakRef`, `create_weak_from_strong`

