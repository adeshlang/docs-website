---
id: unsafe
title: unsafe
sidebar_label: unsafe
description: The `unsafe` keyword marks an unchecked block where raw pointers, FFI, and manual memory management are permitted.
---

# `unsafe`

The `unsafe` keyword marks a block or function as exempt from AdeshLang's safety guarantees. Inside an `unsafe` block the programmer — not the borrow-checker — is responsible for upholding invariants. The compiler disables or downgrades specific checks (raw-pointer dereference, unchecked `alloc`/`free`, `extern` calls, layout-dependent casts) and treats the interior as an audit boundary.

AdeshLang's safety model is opt-in to unsafety: all safe code must remain borrow-checked, null-safe, and double-free-free. `unsafe` isolates the small fraction of code that needs to touch untyped memory or foreign ABIs so reviewers and tools can focus on it.

> **Ground truth:** Lexer token `TokenKind::Unsafe` (`src/parsing/lexer.rs:1011`), parser `StmtKind::UnsafeBlock(Box<Stmt>)` (`src/parsing/ast.rs:683`), HIR `HirStmt::Unsafe { body }` with `is_unsafe` flag on `Function` (`src/parsing/hir.rs:358,379`).

---

## Syntax

```text
unsafe_block   ::= "unsafe" block
unsafe_fn      ::= "unsafe"? "fn" ident "(" params ")" block
                 | "unsafe" "fn" ident "(" params ")" "{" statements "}"
block          ::= "{" statements "}"
```

`unsafe` is a prefix modifier for a block statement. It does not introduce a new scope for name resolution, but does introduce a new borrow-checker context (`drop_insertion.rs:306`).

### Minimal grammar

```adesh
unsafe {
    // statements allowed to use raw memory / FFI
}

unsafe fn fast_copy(dst: *mut u8, src: *const u8, len: usize) {
    // body is implicitly unsafe
}
```

### Lexer

Reserved exactly as `unsafe` (`TokenKind::Unsafe`). Not contextual: cannot be used as identifier. Case-sensitive.

### Parser location

Parsed in `parser.rs` as `StmtKind::UnsafeBlock`. The body is boxed as a single `Stmt` (typically a `Block`), preserving span for diagnostics at `unsafe {`.

---

## Semantics

### What `unsafe` disables and enables

| Capability | Safe code | Inside `unsafe` |
|---|---|---|
| `alloc<T>(count)` / `free(ptr)` | Error: considered unsafe operation | Allowed |
| Raw pointer dereference (`*ptr`, `ptr[idx]`) | Rejected at HIR lowering | Allowed (still requires valid `*mut T` / `*const T`) |
| `extern "C" fn` calls | Requires `unsafe` wrapper (HIR `ExternFunctionDecl`) | Allowed directly |
| `RawArray` / `raw T[N]` access without bounds-check | Not permitted | Permitted with manual checks |
| Borrow-checker relaxations | None | Still runs, but `alloc`ed pointers are not tracked as borrowed; raw pointers are opaque |

`unsafe` does **not** turn off all checking: the CFG borrow checker (`src/parsing/cfg_borrow/`) still validates that safe references do not alias raw pointers unsafely, and the ownership state machine still tracks `Freed` (`cfg_borrow/state_vec.rs:Freed`).

### Compilation

1. **Parse** → `StmtKind::UnsafeBlock(Block([...]))`.
2. **AST optimizer** folds through `UnsafeBlock` (`ast_optimizer.rs:545`).
3. **HIR lowering** sets `HirStmt::Unsafe` and propagates `is_unsafe=true` into nested expressions (`hir_lower.rs:347`). `alloc`/`free` HIR nodes (`HirExpr::Alloc`, `HirExpr::Free`) are only legal here; lowering emits `ErrorKind::Compile` if found outside `unsafe`.
4. **Borrow checking** — `crate::parsing::borrow_check` skips move-validation for raw pointers inside `unsafe` but keeps `FreeWhileBorrowed` and `UseAfterFree`.
5. **Drop insertion** — defers region exit handling until `unsafe` block exit (`drop_insertion.rs:306`).
6. **Backend** — emits unchecked `malloc`/`free` calls or LLVM `alloca`+`bitcast` with no guard pages. FFI calls use the declared ABI (C, Rust, Wasm).

### Interaction with other keywords

- **`alloc`/`free`** — almost always inside `unsafe`. See [alloc](./alloc) and [free](./free).
- **`region`** — may nest inside or outside `unsafe`. Allocations inside `unsafe` that use `region`'s arena are still bulk-freed on exit.
- **`share`/`strong`/`weak`** (ARC) — safe to use inside `unsafe` but downgrade/upgrade still checked.
- **`raw` arrays** (`Value::RawArray`) — safe construction outside unsafe is possible, but mutating through a raw pointer requires `unsafe`.
- **FFI (`extern`, `@cImport`)** — foreign calls must be inside `unsafe` unless the extern declaration is marked safe via a decorator (`decorator_compile.rs:154`).

### Auditing pattern

Treat `unsafe` as an audit fence: keep blocks small, annotate invariant with a `// SAFETY:` comment, and isolate proof obligations.

```adesh
// SAFETY: `ptr` is non-null, 16-byte aligned, and points to `len` valid `f32`s.
// Caller guarantees `len` was returned by `alloc<f32>(len)` and has not been freed.
unsafe {
    process_batch(ptr, len);
}
```

Large `unsafe` blocks hide bugs. Prefer many narrow blocks.

---

## Examples

### Example 1 — Typed allocation, manual init, deterministic free

```adesh
// Allocate 64 bytes, fill, and free — all in one audited block.
unsafe {
    let buf: *mut u8 = alloc<u8>(64);
    // initialize — else reading uninitialized memory is UB
    for i in 0..64 {
        buf[i] = (i & 0xFF) as u8;
    }
    let v = buf[0];          // raw read
    print(v);                // 0
    free(buf);               // must pair exactly once
}
// buf is Freed from here — see Errors below
```

### Example 2 — Calling a C function imported via FFI

```adesh
@cImport("string.h")
extern "C" fn strlen(s: *const u8) -> usize;

fn c_strlen_safe(s: string): usize {
    // Convert AdeshLang string to NUL-terminated buffer, then call C.
    unsafe {
        let n = s.len() + 1;
        let p: *mut u8 = alloc<u8>(n);
        // ... copy bytes and NUL-terminate (omitted) ...
        let len = strlen(p as *const u8);
        free(p);
        return len;
    }
}

print(c_strlen_safe("hello")); // 5
```

### Example 3 — `unsafe fn` plus borrow-checker interaction

```adesh
struct Node { value: i32, next: *mut Node }

unsafe fn link(a: *mut Node, b: *mut Node) {
    // Raw pointer write — only legal in unsafe context
    (*a).next = b;
}

let n1: *mut Node = unsafe { alloc<Node>(1) };
let n2: *mut Node = unsafe { alloc<Node>(1) };

unsafe {
    (*n1).value = 10;
    (*n1).next = null;
    (*n2).value = 20;
    (*n2).next = null;
    link(n1, n2);            // ok: unsafe fn called from unsafe block
    print((*n1).next == n2); // true
    free(n2);
    free(n1);
}

// Outside unsafe, raw deref is rejected at compile time:
// let bad = *n1; // ErrorKind::Compile: raw dereference outside unsafe
```

---

## Restrictions / Errors

| Code | Condition | Message / help |
|---|---|---|
| **E0507** (`Ownership::UseAfterFree`) | Use after `free` inside or outside `unsafe` | `use of freed value: 'buf' (freed at line 5)` — note points at `free` span (`compile_time_memory_safety/error.rs:26`) |
| **E0508** (`Ownership::DoubleFree`) | `free(ptr)` twice on same pointer | `double free of 'buf' (first freed at line 5)` — second free is rejected |
| **E0506** (`Ownership::FreeWhileBorrowed`) | `free` while a shared/exclusive borrow of the allocation is live | `cannot free 'data' while borrows are still active` — `error::ownership_help::free_while_borrowed` |
| **Compile** | `alloc`/`free` or raw deref / `extern` call outside `unsafe` | `raw pointer operation requires unsafe block — wrap in 'unsafe { }'` (HIR lowering) |
| **Compile** | `unsafe` used as identifier | Lexer emits `TokenKind::Unsafe`; parser expects block — `expect block after 'unsafe'` |
| **Ownership** | Escaping raw pointer beyond `unsafe` + `region` lifetime | `escape_analysis.rs` reports `unsafe_captures: Vec<String>` if closure captures raw pointer |

**Borrow-checker Freed state:** `Freed` (`cfg_borrow/state_vec.rs:69`) is sticky and meets any other state as `FreedMerge` error — the value cannot be revived. Merging a `Freed` branch with a live branch produces `FreedAcrossBranches` (`merge.rs:120`).

Best practice for diagnostics: match on `LangError.code` (`E0507`, `E0508`) in tooling.

---

## See Also

- [alloc](./alloc) — typed allocation `alloc<T>(count)` returning `*mut T`
- [free](./free) — deterministic deallocation and its pairing rules
- [region](./region) — arena allocation and bulk-free scopes (`StmtKind::Region`)
- [raw](./raw) — `raw T[N]` arrays without metadata (`Value::RawArray`)
- [extern](../extern) / `@cImport` — FFI declarations (must be called in `unsafe`)
- [Memory & Safety](../../advanced/memory-safety) — ownership/borrow overview
- [Lexer & Parser](/docs/compiler/lexer-parser) — `TokenKind::Unsafe` and AST `UnsafeBlock`
- `src/parsing/ast.rs:683` `UnsafeBlock`, `src/parsing/hir.rs:358`, `src/parsing/borrow_check.rs:365`
