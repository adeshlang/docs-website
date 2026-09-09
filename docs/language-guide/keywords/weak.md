---
id: weak
title: weak
sidebar_label: weak
description: The weak keyword declares a weak non-owning ARC reference that does not keep the value alive and must be upgraded before use — the primary tool for breaking reference cycles.
---

# `weak`

`weak` declares a **weak non-owning** ARC reference. A `weak` handle observes a value owned by `share`/`strong` without incrementing its strong count, so the value may be freed while the `weak` handle remains. Weak references must be `upgrade()`'d to a strong handle (or checked for null) before the value can be accessed; otherwise a cycle-safe observer pattern.

> **Ground truth:** Lexer `TokenKind::Weak` (`src/parsing/lexer.rs:1013`, keyword `"weak"`), AST `StmtKind::WeakDeclaration(WeakDecl, bool /*export*/)` (`src/parsing/ast.rs:588`), `WeakDecl { name, expr, type_ann }` (`ast.rs:960-964`), `OwnershipKind::Weak` (`ast.rs:940`), runtime `Value::Weak(WeakRef)` via `memory::arc::shared_object::{WeakRef,create_weak_from_strong}` (`ast.rs:1629`), `WeakRef::upgrade/is_alive/strong_count/weak_count` and debug `<weak ref count=N, weak_count=M>` (`ast.rs:1178`).

---

## Syntax

```text
weak_decl ::= "weak" ident (":" type)? "=" expr ";"
export_weak ::= "export"? "weak" ident ...
type      ::= ident | generic_type | ...
expr      ::= share_or_strong_handle | share_decl_expr
```

`weak` is a declaration qualifier, not a cast operator. It takes an initializer that is a `share`/`strong` handle (or any expression whose value is currently owned as a `StrongRef`). The handle is downgraded to `WeakRef`.

### Canonical forms

```adesh
strong owner = Node { value: 1 };
weak observer = owner;                     // downgrades StrongRef → WeakRef

share cache = [1, 2, 3];
weak cache_view = cache;                   // observers cache without extending lifetime

weak named: Weak<Node> = owner;            // optional type annotation
```

### Lexer & parser

- Reserved as `TokenKind::Weak`; cannot be identifier.
- Parsed as `StmtKind::WeakDeclaration` before any `Let` fallback.
- `WeakDecl.type_ann` captures optional `: Type` text (`ast.rs:963`).
- Lowering (`hir_lower.rs:70`) evaluates initializer, then calls `create_weak_from_strong` if initializer is a `StrongRef`; otherwise wraps existing `WeakRef`.

### HIR / MIR

- Lowered as downgrade: `HirExpr::Downgrade(inner)` or `HirExpr::Weak` path (`hir.rs:232 comment`).
- Produces `Value::Weak(WeakRef)`; no allocation on downgrade, only a `weak_count` bump.
- `WeakRef::upgrade() -> Option<StrongRef>` and `WeakRef::is_alive() -> bool` map to runtime helpers `memory::arc::shared_object::WeakRef` methods.

---

## Semantics

### Weak ownership

```
strong s = value           // SharedObject { strong=1, weak=0, value }
weak w = s                  // strong=1, weak=1 (observer)
{
    strong s2 = s           // strong=2, weak=1
}                           // s2 dropped → strong=1, weak=1
// drop s → strong=0, value destroyed, control block stays (weak=1)
// w.is_alive() == false after last strong dropped
// w.upgrade() == null
// when w dropped → weak=0 → control block freed
```

- **Non-owning:** `weak` handles increment only `weak_count`; they do not prevent the `value` from being destroyed.
- **Upgrade required:** The value cannot be accessed directly through `WeakRef`. You must `upgrade()` (method on ARC value or explicit `weak.upgrade()` helper) to obtain a temporary `StrongRef` which is valid for `!is_null` span. The upgrade atomically checks `strong > 0` and bumps it on success.
- **Cycle breaker:** The canonical use for `weak` is to break an otherwise strong cycle (see Examples).
- **Copyable:** `WeakRef` is copyable; cloning bumps `weak_count` only.

### Compilation pipeline

1. **Lex** `weak` → `TokenKind::Weak`.
2. **Parse** `WeakDecl { name, expr, type_ann }`.
3. **Optimize** `ast_optimizer.rs:412`.
4. **Lower** → downgrade `StrongRef` via `create_weak_from_strong` (`ast.rs:1629`).
5. **Borrow check** — `OwnershipKind::Weak` not counted as strong owner; CFG joins do not treat weak presence as keeping value alive. Loops handling treats `Weak` as safe observer (`escape_analysis.rs:631` views ARC types as safe for concurrent capture).
6. **Drop** — `WeakRef` drop decrements `weak_count`; when both counts reach zero the control block is freed.
7. **Diagnostics** — `OwnershipError` helpers suggest `weak` for cycles (`error.rs:562 use_weak_for_cycle`).

### `weak` vs. borrow `&` vs `share`/`strong`

| Feature | `weak` | `&` borrow | `share`/`strong` |
|---|---|---|---|
| Owns memory | No | No (scoped) | Yes (keep alive) |
| Extends lifetime | No | Extends for borrow scope only | Yes |
| Access | Via `upgrade()` → temporary strong | Direct while borrow live | Direct |
| Cycle-safe | Yes | Yes when scope small | No — needs one `weak` edge |
| Value after owner dropped | `null` / `is_alive()==false` | N/A (borrow ended) | N/A (value gone) |

### Runtime surface

From `memory::arc::shared_object` (re-exported at `ast.rs:1629`):

- `StrongRef::weak_count()`, `weak_count()` — for diagnostics.
- `WeakRef::strong_count()`, `weak_count()`, `is_alive() -> bool`, `upgrade() -> Option<StrongRef>`.
- `Value::Weak` debug: `<weak ref count=1, weak_count=2>` (`ast.rs:1178`).
- `invoke_arc_method` dispatches `.upgrade()`, `.is_alive()` etc.

---

## Examples

### Example 1 — Observing without extending lifetime

```adesh
strong owner = [1, 2, 3];
weak observer = owner; // weak_count=1, strong_count=1

print(observer); // <weak ref count=1, weak_count=1> (debug)
print(observer.strong_count()); // 1 — still alive
print(observer.is_alive());     // true

// Must upgrade to touch the value:
let held = observer.upgrade();
if held != null {
    print(held); // [1, 2, 3]
} else {
    print("already freed");
}

// After last strong dropped, observer becomes dangling-but-safe:
{
    strong tmp = owner;
} // example scope — still 1 strong

// Simulate drop of last strong by re-binding scope exit — then:
// print(observer.upgrade()); // null
// print(observer.is_alive()); // false
```

### Example 2 — Breaking a parent ↔ child reference cycle (canonical ARC pattern)

```adesh
// Each Node conceptually owns children strongly but references parent weakly.
struct Node { value: i32 }

strong parent = Node { value: 10 };
strong child  = Node { value: 20 };

// Parent owns child strongly (parent's drop keeps child alive otherwise)
// Child observes parent weakly — no cycle.
weak parent_ref = parent;

// Associate child under parent (conceptual graph):
// In current interpreter, field holding strong/weak is expressed via separate decls
// but field storage would eventually be: parent.child = child; child.weak_parent = parent_ref

print(parent_ref.is_alive()); // true — parent still held by `parent`
print(parent_ref.upgrade().value); // 10 — via upgraded temporary strong

// If we had used strong for both edges, the cycle would leak:
// strong child_cycle = parent; strong parent_cycle = child; // both strong=2 — never drops
// Fix via error::ownership_help::use_weak_for_cycle suggestion:
// "to break a reference cycle, keep one side as `weak` instead of `strong`/`share` only.
//  Upgrade with `.upgrade()` when needed, and check for null."
```

### Example 3 — Cache / memoizer that does not pin large values

```adesh
strong db = load_database(); // large object, expensive
weak cache_entry = db;       // cache does not prevent db eviction

fn handle_request() {
    let local = cache_entry.upgrade();
    if local == null {
        // Cache miss — db was evicted, reload
        print("cache miss, reloading");
        // local stays null, safe fallback
        return;
    }
    // Cache hit — use live db
    print("cache hit");
    print(local); // use via temporary strong
}

// Simulate eviction by dropping last strong elsewhere:
// drop(db) → cache_entry.is_alive()==false, next handle_request shows miss

// Multiple observers, mixed qualifiers:
share shared_cfg = Config { host: "cache.example.com" };
weak o1 = shared_cfg;
weak o2 = shared_cfg; // weak_count=2 shared observers, strong still 1

print(o1.is_alive()); // true
print(o2.upgrade());  // Config alive
```

---

## Restrictions / Errors

| Code / Kind | Trigger | Diagnostics |
|---|---|---|
| **Parse** | `weak` as identifier: `let weak = 1` | `unexpected token 'weak', expected identifier` (reserved `TokenKind::Weak`) |
| **Parse** | `weak x;` missing initializer | `expected '=' after weak declaration` |
| **Type** | `weak x: T = expr` where `expr` not dereferenceable as ARC handle | `TypeError: weak target must be a share/strong handle, found U` |
| **Runtime** | `weak_view = null_upgrade; weak_view.upgrade().field` without null-check | Traps as `null dereference` / `TypeError: cannot read property of null` — always check `is_alive()` or `!= null` |
| **Ownership** | Constructing strong cycle without any weak edge | No compile error — leak detected at runtime by `strong_count` never reaching 0. Lint help: `error::ownership_help::use_weak_for_cycle()` (`error.rs:562`) |
| **CFG** | Upgrading inside exclusive borrow region that conflicts with a live exclusive borrow of same handle | `BorrowKindConflict` at `merge.rs:174` — restructure to upgrade outside exclusive section |
| **Type** | `free(weak_ref)` | `free expects *mut T` — weak memory is ARC-managed, not manually freed |
| **Escape** | Capturing raw pointer derived from `weak.upgrade()` past the upgraded strong's scope | `escape_analysis.rs:131 unsafe_captures` reports `unsafe_captures: Vec<String>` if closure captures stack-derived raw pointer |

**Pitfall — forgetting to upgrade:**

```adesh
strong s = make();
weak w = s;
// print(w.value);       // ERROR: WeakRef has no .value — only StrongRef does
print(w.upgrade().value); // ERROR if upgrade returned null — must guard
if let u = w.upgrade() { print(u.value); } // safe guard pattern (if let upgrade)
```

**Pitfall — strong upgrade kept too long extending lifetime:**

```adesh
weak w = s;
let held = w.upgrade(); // strong=2 while held live
// held pins s alive here — if intent was transient check, drop held promptly
// Scope held narrowly or shadow with a block: { let h = w.upgrade(); use(h); }
```

---

## See Also

- [share](./share) — `ShareDecl` (`ast.rs:947-951`), shared aliased handle
- [strong](./strong) — `StrongDecl` (`ast.rs:954-958`), owning reference and destructor semantics
- [Memory & Safety](../../advanced/memory-safety#weak-references) / [Advanced ARC](/docs/advanced/arc) — cycle breaking and upgrade protocol
- [alloc](./alloc) / [free](./free) — manual memory (distinct lifetime system from ARC)
- [Lexer & Parser](/docs/compiler/lexer-parser) — `TokenKind::Weak`
- `src/parsing/ast.rs:588,960-964,1021-1022` — `WeakDeclaration`, `Value::Weak`
- `src/memory/arc/shared_object.rs` — `WeakRef`, `StrongRef`, `create_weak_from_strong`, `WeakRef::upgrade/is_alive`

