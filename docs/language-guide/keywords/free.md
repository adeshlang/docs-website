---
id: free
title: free
sidebar_label: free
description: The `free` keyword releases memory previously obtained with alloc — with compile-time protection against double-free, use-after-free, and freeing while borrowed.
---

# `free`

`free(ptr)` is the deterministic deallocation primitive. It releases the allocation referenced by `ptr` that was obtained via [`alloc`](./alloc). After `free(ptr)` the place transitions to `Freed`; any further use is a compile-time `UseAfterFree` and a second `free` is a `DoubleFree`. `free` is an `unsafe` operation and must appear inside `unsafe { }` (or an `unsafe fn`).

> **Ground truth:** Lexer `TokenKind::Free` (`src/parsing/lexer.rs:1015`), HIR `HirExpr::Free(Box<HirExpr>)` (`src/parsing/hir.rs:236`), MIR `MirInstr::Free { place }` (`src/parsing/cfg_borrow/mir.rs:231`), state `Freed` (`src/parsing/cfg_borrow/state_vec.rs:69`), borrow errors `FreeWhileBorrowed`, `UseAfterFree`, `DoubleFree` (`src/parsing/compile_time_memory_safety/error.rs:33-48`).

---

## Syntax

```text
free_expr ::= "free" "(" ptr_expr ")"
ptr_expr  ::= expression of type "*mut T" | "*const T"
```

`free` is a keyword. It takes exactly one argument: a pointer expression. It is a statement-expression (returns unit) and is typically used as `free(buf);`.

### Canonical forms

```adesh
unsafe {
    let p: *mut u8 = alloc<u8>(64);
    free(p);        // ok: inside unsafe
}

unsafe fn drop_buf(p: *mut u8) { free(p); } // ok: unsafe fn body
```

Using `free` outside `unsafe` is a compile error:

```adesh
let p = alloc<u8>(8); // error: alloc requires unsafe
free(p);              // error: free requires unsafe (HIR lowering / ErrorKind::Compile)
```

### Parser & HIR

Parsed as an `HirExpr::Free(target)` where `target` is the lowered pointer expression. No type argument — the allocation size is recovered from the MIR place metadata (or arena region handle).

---

## Semantics

### Ownership lifecycle

```
alloc<T>(n)  -->  Owned  --free-->  Freed  --any use-->  UseAfterFree (E0507)
                           --second free--> DoubleFree (E0508)
```

`Freed` is sticky and incompatible with any other state. `cfg_borrow/merge.rs:109` treats `Freed` in any predecessor branch as a merge error (`FreedAcrossBranches`). A `Freed` value inside a loop body produces `FreedInLoop` (`state_vec.rs:224`).

### When freeing is allowed

- Exactly once per allocation returned by `alloc`.
- Only when no live shared or exclusive borrow of the same place exists (`borrow_check.rs:546 validate_free`).
- The `defer` pattern is often used to guarantee pairing even on early `return` / `throw`.

### What `free` does at runtime

- **Heap allocation** (`AllocKind::Heap`): calls the global allocator's deallocation (often `free()`/`de HeapFree`) and, in debug builds, poisons memory (`memory::dynamic_allocator::poison_memory` in `memory_management_research.md:122`) to surface use-after-free.
- **Region (arena) allocation** (`AllocKind::Region`): `free` is a no-op for correctness — the arena's bulk free on `region` exit reclaims everything. Explicit `free` inside a region is accepted but redundant; prefer to rely on the region exit.
- **ARC memory** (`share`/`strong`/`weak`): not freed via `free`. ARC objects are reclaimed when strong count drops to zero (`memory::arc::shared_object`). Calling `free` on an ARC handle is a type error.

### Compilation pipeline

1. **Lex** `free` → `TokenKind::Free`.
2. **Parse** as unary-like expression with parenthesized target.
3. **Lower** → `HirExpr::Free(boxed_target)` only if in `unsafe` context; else `ErrorKind::Compile`.
4. **MIR** → `MirInstr::Free { place }` with place resolution.
5. **Borrow check** → `validate_free(place, free_at)` consults `BorrowState` / `CfgBorrowState`. Rejects `FreeWhileBorrowed` and `DoubleFree`.
6. **CFG merge** → any predecessor where place is `Freed` makes the join an error.
7. **Codegen** → heap: call deallocator; region: optional nop; debug: poison then free.

### Interaction with ARC and `drop`

- `free` does **not** decrement ARC counts. Use ARC assignment / scope exit to drop `strong` handles.
- Custom `drop` logic (`drop_insertion.rs`) inserts `RegionExit` and `Unsafe` handlers; `free` is orthogonal to `DropReason::RegionExit`.

---

## Examples

### Example 1 — Minimal correct pairing (with `defer` for exception safety)

```adesh
// Pairing alloc/free via defer ensures cleanup on early return or throw.
fn with_temp_buffer(len: usize): bool {
    unsafe {
        let buf: *mut u8 = alloc<u8>(len);
        defer free(buf);           // LIFO at scope exit, even on `return`/`throw`

        for i in 0..len { buf[i] = 0; }
        if len > 100 { return false; } // defer still runs
        buf[0] = 42;
        print(buf[0]);             // 42
        return true;               // free happens here via defer
    }
}

print(with_temp_buffer(64)); // true
```

### Example 2 — Detecting misuse at compile time

```adesh
unsafe {
    let p: *mut u8 = alloc<u8>(8);
    free(p);

    // --- All of the below are compile-time errors ---

    // let x = p[0];      // E0507 UseAfterFree: 'p' freed at line 3
    // free(p);           // E0508 DoubleFree: 'p' already freed at line 3
}

unsafe {
    let data: *mut u8 = alloc<u8>(32);
    let view = &data[0..8]; // shared borrow of allocation (HIR Borrow)
    // free(data);          // E0506 FreeWhileBorrowed: cannot free 'data' while borrows still active
    print(view[0]);         // borrow ends after this use
    // free(data) would be ok after borrow ends
    free(data);             // ok now
}
```

### Example 3 — Region vs. explicit free

```adesh
// Outside a region — explicit free is mandatory
unsafe {
    let heap_buf: *mut u8 = alloc<u8>(256);
    heap_buf[0] = 1;
    free(heap_buf); // required — else leak
}

// Inside a region — explicit free is optional (bulk-free covers it)
region scratch {
    unsafe {
        let a: *mut u8 = alloc<u8>(256); // arena-allocated when inside region
        let b: *mut u8 = alloc<u8>(512);
        a[0] = 9; b[0] = 7;
        // No free needed — region exit poisons/frees both at once (DropReason::RegionExit)
        // free(a); // allowed redundancy, but prefer omission for clarity
    }
} // scratch: both allocations bulk-freed here

// Mixing region alloc with ARC (separate systems)
share owner = [1, 2, 3];          // ARC-allocated (see strong/weak), not via alloc/free
unsafe { /* ARC objects are not freed via free */ }
```

---

## Restrictions / Errors

| Code / Kind | Trigger | Notes |
|---|---|---|
| **E0507** `UseAfterFree` | Any read/write/call through pointer after `free(ptr)` | `compile_time_memory_safety/error.rs:26`, `borrow_check.rs:334`. Note points at original `freed_at`. |
| **E0508** `DoubleFree` | `free(ptr)` twice without intervening `alloc` | `error.rs:33`. Second free span labeled `double free`, related location shows first free. |
| **E0506** `FreeWhileBorrowed` | `free` while shared or exclusive borrow live | `borrow_check.rs:555` (`shared`), `562` (`exclusive`), `compile_time_memory_safety/borrow.rs:178`. Help: `error::ownership_help::free_while_borrowed`. |
| **Compile** | `free` outside `unsafe` | `expected unsafe context for 'free'` (HIR lowering, `ErrorKind::Compile`) |
| **Compile** | `free` with non-pointer argument | `free expects a pointer (*mut T / *const T), found <type>` |
| **CFG** `FreedAcrossBranches` | One branch frees, another doesn't, then value used after join | `cfg_borrow/merge.rs:120`. Fix: free in both branches or restructure. |
| **CFG** `FreedInLoop` | `free` inside loop body where loop may re-enter | `state_vec.rs:224` — must prove allocation is re-created each iteration or move free outside loop. |
| **Runtime** | `free(null)` | Currently treated as no-op (C-compat); future backend may trap in debug. |
| **Runtime** | `free` on ARC handle | Type error — use ARC scope exit instead. |

**Branching pitfall:**

```adesh
unsafe {
    let p = alloc<u8>(4);
    if ok { free(p); }
    // free(p);          // double-free on ok path
    // print(p[0]);      // use after maybe-freed -> FreedAcrossBranches
    if !ok { free(p); }  // correct: both branches free before join
}
```

---

## See Also

- [alloc](./alloc) — typed allocation `alloc<T>(count): *mut T`
- [unsafe](./unsafe) — `StmtKind::UnsafeBlock` fence for `alloc`/`free`, raw deref, and FFI
- [region](./region) — arena bulk-free (`StmtKind::Region`, `DropReason::RegionExit`)
- [raw](./raw) — `raw T[N]` contiguous storage without DynArray metadata
- [strong](./strong) / [weak](./weak) / [share](./share) — ARC ownership (separate from manual free)
- [Memory & Safety](../../advanced/memory-safety) — compile-time memory guarantees
- `src/parsing/borrow_check.rs:546` `validate_free`, `src/parsing/cfg_borrow/mir.rs:231`, `src/parsing/compile_time_memory_safety/error.rs`
