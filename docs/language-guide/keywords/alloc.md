---
id: alloc
title: alloc
sidebar_label: alloc
description: The `alloc` keyword performs typed heap allocation and returns a raw pointer — typically used inside unsafe blocks and paired with free or a region.
---

# `alloc`

`alloc<T>(count)` is the typed allocation primitive. It reserves space for `count` values of type `T` on the native heap (or the enclosing `region`'s arena when inside one) and returns a raw pointer `*mut T`. The pointer is untracked by the safe borrow checker; the programmer must initialize memory before reading and must free exactly once.

> **Ground truth:** Lexer `TokenKind::Alloc` (`src/parsing/lexer.rs:1014`, keyword `alloc`), HIR `HirExpr::Alloc { type_name, count }` (`src/parsing/hir.rs:234`), runtime lowers to `malloc`-style allocator (`src/memory/dynamic_allocator.rs`). Pair with [free](./free) and [unsafe](./unsafe).

---

## Syntax

```text
alloc_expr ::= "alloc" "<" type ">" "(" count_expr ")"
           |   "alloc" "<" type ">"        // count defaults to 1 when omitted in some forms
type       ::= "u8" | "i32" | "f32" | "f64" | ident | ...
count_expr ::= integer_expr    // number of T elements, not bytes
```

`alloc` is a keyword, not a function. The type argument is mandatory; the lexer still tokenizes `alloc` as keyword regardless of following `<`.

### Pointer type produced

`alloc<T>(n)` returns `*mut T`. Indexing and arithmetic are pointer arithmetic in units of `T`:

```adesh
let p: *mut u8  = alloc<u8>(16);
let q: *mut f32 = alloc<f32>(8);
```

### Where it is allowed

- Inside `unsafe { }` blocks — always allowed.
- Inside `unsafe fn` bodies — allowed (function body is implicitly unsafe).
- At top level / in safe code — rejected at HIR lowering (`ErrorKind::Compile: alloc requires unsafe`).

### Relation to `region`

When `alloc` appears inside a `region` block, the allocation may be arena-allocated instead of heap-allocated, depending on the backend and the `kind: AllocKind::Region(RegionId)` (`src/parsing/cfg_borrow/mir.rs:149`). Such allocations are still returned as `*mut T` but are bulk-freed on region exit even if `free` is not called. See [region](./region).

---

## Semantics

### Allocation

- **Count vs. bytes:** `alloc<T>(n)` allocates `n * sizeof(T)` bytes, aligned to `alignof(T)`. Compare `RawArray` where size is `N * element_type.element_size()` (`src/parsing/ast.rs:119`).
- **Initialization:** Memory is *uninitialized* (may contain garbage). Reading before writing is UB. For zeroed memory, write an explicit loop or call a zero-init helper.
- **Failure:** On OOM the allocator traps or returns null (backend-dependent); the current interpreter traps with `ErrorKind::Runtime: allocation failed`.
- **Alias:** The returned `*mut T` may be freely copied as a value, but dereferencing it requires `unsafe`.

### Compilation pipeline

1. **Lex** `alloc` → `TokenKind::Alloc`.
2. **Parse** as call-like expression with generic `<T>` (`parser.rs` alloc/free branch).
3. **Lower** → `HirExpr::Alloc { type_name: String, count: Box<HirExpr> }` (`hir.rs:234`).
4. **MIR** → `MirInstr::Alloc { place, kind, size }` with `AllocKind::Heap` or `AllocKind::Region`.
5. **Codegen** → `malloc(count * sizeof(T))` or arena `bump(count * sizeof(T))`.
6. **Borrow check** — raw pointer itself is not borrow-tracked; the memory behind it is `OwnedUntilFreed`, entering `Freed` at `free`.

### Ownership state

`alloc` creates a resource in `Owned` state. `free` moves it to `Freed` (`cfg_borrow/state_vec.rs:Freed`). Any later use is `UseAfterFree` (`E0507`). Mixing branches where one freed and one didn't is `FreedAcrossBranches` (`cfg_borrow/merge.rs:120`).

### Interaction with ARC

`alloc` is *independent* of ARC qualifiers (`share`/`strong`/`weak`). You can store an ARC pointer *inside* allocated memory (`*mut StrongRef`), but the allocation backing that memory is still manual. ARC objects (`ShareDecl`, `StrongDecl`, `WeakDecl` in `ast.rs:586-588`) are typically heap-allocated by the ARC runtime (`memory::arc::shared_object::allocate_share`), not via `alloc`.

---

## Examples

### Example 1 — Single typed allocation and scalar init

```adesh
unsafe {
    let p: *mut i32 = alloc<i32>(1);
    *p = 42;                 // write through raw pointer
    print(*p);               // 42
    free(p);                 // must free exactly once
}
// p is Freed; any later *p is E0507
```

### Example 2 — Array-style allocation, initialization loop, and bulk free via region

```adesh
// Pair alloc with a region for scoped, bulk-free semantics.
region scratch {
    unsafe {
        let buf: *mut u8 = alloc<u8>(1024);  // arena bump inside region
        for i in 0..1024 {
            buf[i] = (i & 0xFF) as u8;
        }
        let sum = 0;
        for i in 0..1024 { sum += buf[i] as i64; }
        print(sum); // deterministic
        // Explicit free is optional inside region — bulk-free on exit reclaims it anyway.
        // free(buf); // allowed but not required if region will exit
    }
} // <- all scratch allocations freed at once (DropReason::RegionExit)
```

### Example 3 — Allocating a structured type and using raw indexing

```adesh
struct Pixel { r: u8, g: u8, b: u8, a: u8 }

unsafe {
    let img: *mut Pixel = alloc<Pixel>(2);
    // initialize both pixels
    img[0] = Pixel { r: 255, g: 0,   b: 0,   a: 255 };
    img[1] = Pixel { r: 0,   g: 255, b: 0,   a: 255 };

    print(img[0].r); // 255
    print(img[1].g); // 255

    // Pointer arithmetic example (parses as binary + on *mut T in HIR)
    let second: *mut Pixel = img + 1;
    print((*second).b); // 0

    free(img);
}
```

---

## Restrictions / Errors

| Code / Kind | Trigger | Help |
|---|---|---|
| **Compile** (`E000x`) | `alloc` outside `unsafe` | `alloc requires unsafe — wrap in 'unsafe { }' or make the enclosing fn 'unsafe fn'` (HIR lowering) |
| **Compile** | Missing type argument: `alloc(10)` | `expected '<Type>' after 'alloc'` |
| **Compile** | Non-integer count: `alloc<u8>(3.5)` | `alloc count must be an integer expression` |
| **Runtime** | `alloc<T>(0)` with backend that returns null | Check for null before deref if backend is null-on-zero (interpreter traps instead) |
| **Runtime** | OOM | `allocation failed: <type> * <count> bytes` — currently traps the interpreter |
| **Ownership** `E0507` | Dereferencing or passing `p` after `free(p)` | `use after free: 'p' freed at line X` (`compile_time_memory_safety/error.rs:26`) |
| **Ownership** `E0508` | Double evaluation of `alloc` / leaking the pointer and freeing an unrelated value | Caught as `DoubleFree` when same place freed twice |
| **Borrow** `FreeWhileBorrowed` | `free` while a shared/exclusive borrow of `*p` is live | `cannot free 'buf' while borrows are still active` |

**Type-specific aliasing:** `element_type.metadata_size()` (`ast.rs:146`) governs how `DynArray` vs `RawArray` metadata is sized, but `alloc<T>` always uses `element_size()` alignment of `T`. Mixing `alloc<u8>` and reading as `f32` through aliasing casts is UB without `unsafe` cast helper.

---

## See Also

- [free](./free) — releasing `alloc`'d memory (`TokenKind::Free`, `HirExpr::Free`)
- [unsafe](./unsafe) — audit fence for raw memory (`StmtKind::UnsafeBlock`)
- [region](./region) — arena/bulk-free scopes (`StmtKind::Region`, `AllocKind::Region`)
- [raw](./raw) — `raw T[N]` contiguous arrays without per-array metadata (`Value::RawArray`)
- [Memory & Safety](../../advanced/memory-safety) — ownership overview
- [Lexer & Parser](/docs/compiler/lexer-parser) — `TokenKind::Alloc`
- `src/parsing/ast.rs:102-116` `ArrayElementType`, `src/parsing/hir.rs:234`, `src/memory/dynamic_allocator.rs`

