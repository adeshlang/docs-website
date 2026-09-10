---
id: defer
title: defer
sidebar_label: defer
description: The `defer` keyword schedules LIFO scope-exit cleanup that runs on every exit path — return, throw, break, or fall-through.
---

# `defer`

`defer` schedules a statement or block to run when the **enclosing scope exits**, regardless of how it exits — normal fall-through, `return`, `throw`, `break`, or `continue`. Multiple `defer` statements in the same scope run in **LIFO** (last-in, first-out) order, making them ideal for RAII-style resource teardown without `try`/`finally` boilerplate.

> **Ground truth:** Lexer `TokenKind::Defer` (`src/parsing/lexer.rs:1009`), AST `StmtKind::Defer(Stmt)` (`src/parsing/ast.rs:683`), drop insertion `DropReason::Defer` / LIFO ordering (`src/parsing/drop_insertion.rs:12,180,290`), hover doc *Defers execution until scope exit (LIFO order)* (`als/src/hover.rs:383`).

---

## Syntax

```text
defer_stmt ::= "defer" ( block | expr_stmt )
block      ::= "{" statements "}"
expr_stmt  ::= expr ";"        // e.g., file.close(); free(ptr);
```

`defer` is a statement-level keyword. It takes a single statement or block; the deferred code is **not** executed immediately — it is registered and runs at scope exit.

### Canonical forms

```adesh
fn readData(path: string): string {
    let file = FS.open(path, "r");
    defer file.close();              // single expression
    let contents = file.readAll();
    return contents;                 // close runs here, even on early return/throw
}

fn withLock(m: Mutex) {
    m.lock();
    defer m.unlock();               // LIFO with other defers in this scope

    defer print("unlocking");       // runs second (registered first)
    defer print("cleaning");        // runs first  (registered last)
    // body — any exit runs cleaning → unlocking → unlock
}

fn withBlock() {
    defer {
        cleanup();
        log("done");
    }
    work();
}
```

### Scope

`defer` is tied to the **enclosing block scope** (function body, `if` branch, loop body, `region` body), not the file. A `defer` inside a loop runs at the end of **each iteration** before the next iteration or loop exit, not just at function exit.

---

## Semantics

### LIFO ordering

Defsers in the same scope form a stack:

```adesh
fn order() {
    defer print("A");  // registered 1st → runs 3rd
    defer print("B");  // registered 2nd → runs 2nd
    defer print("C");  // registered 3rd → runs 1st
    print("body");
}
// Output: body, C, B, A
```

This mirrors Go/Rust `defer`/`Drop` semantics and ensures **acquisition order = reverse release order** (locks, files, arenas).

### Exit paths

A deferred action runs on **every** exit from its scope:

| Exit | Defer runs? | Notes |
|---|---|---|
| Fall-through `}` | Yes | Normal scope end |
| `return` | Yes | Before return value is yielded |
| `throw` / `catch` | Yes | Before unwinding to `catch` |
| `break` / `continue` | Yes | For `defer` inside loop body, before jump |
| `region` exit | Yes, **before** bulk-free | `drop_insertion.rs` orders `Defer` before `RegionExit` |

### Interaction with `region` and `alloc`/`free`

Inside a `region`, `defer` handlers run **before** `RegionExit` bulk-free, so deferred code can still touch arena memory:

```adesh
region scratch {
    unsafe {
        let buf: *mut u8 = alloc<u8>(64);
        defer free(buf);         // free is no-op inside region but still runs first
        defer print("defer sees buf[0]=", buf[0]); // valid — region still live
    }
} // defer(s) → then bulk-free
```

Pairing `alloc`/`free` via `defer` is the idiomatic way to handle early `return`/`throw`:

```adesh
unsafe {
    let p: *mut u8 = alloc<u8>(n);
    defer free(p);
    if cond { return; }  // free still runs
    use(p);
} // free runs here too
```

### Compilation pipeline

1. **Lex** `defer` → `TokenKind::Defer`.
2. **Parse** `StmtKind::Defer(innerStmt)` with boxed payload preserving span.
3. **Drop insertion** (`drop_insertion.rs:180`) — `plan_stmt` records `DropReason::Defer` points and emits LIFO cleanup edges in CFG.
4. **CFG/Borrow** — `defer` does not create a borrow; it captures values for later execution — ensure captured pointers outlive the scope (region/escape analysis).
5. **Codegen** — emits cleanup blocks and branches from every scope-exit to the defer chain.

---

## Examples

### Example 1 — File and lock cleanup with LIFO guarantees

```adesh
fn copyFile(src: string, dst: string): bool {
    let s = FS.open(src, "r");
    defer s.close();                 // runs last (registered first)

    let d = FS.open(dst, "w");
    defer d.close();                 // runs first (registered last) — LIFO

    // Any early return or throw still closes both files in LIFO order
    let data = s.readAll();
    if data.len() == 0 { return false; } // both closes run
    d.write(data);
    return true; // both closes run
} // s.close, d.close in LIFO order

fn withMutex(m: Mutex, op: fn(): void) {
    m.lock();
    defer m.unlock(); // paired even if op throws
    op();
} // unlock runs even on throw
```

### Example 2 — `alloc`/`free` pairing, loop defers, and error paths

```adesh
// Pairing alloc/free across multiple exit paths
unsafe fn process(n: usize): i32 {
    let buf: *mut u8 = alloc<u8>(n);
    defer free(buf);           // LIFO at function scope exit

    defer print("cleanup done"); // runs before free (registered after free → LIFO first)

    if n == 0 { return -1; }  // both defers run
    if n > 1024 { throw "too large"; } // both defers run before catch

    for i in 0..n { buf[i] = (i & 0xFF) as u8; }
    return buf[0] as i32;
    // both defers run on normal return
}

fn loopDefers(items: [string]) {
    for item in items {
        let tmp = FS.open(item, "w");
        defer tmp.close(); // runs at end of EACH iteration, not just function exit
        tmp.write("hi");
        if item == "stop" { break; } // defer for this iteration still runs before break
    }
    // defers do not accumulate across iterations — they run per-iteration
}

fn tryCatchDefers() {
    defer print("outer defer"); // runs even if inner throws
    try {
        let f = FS.open("/tmp/x", "w");
        defer f.close();         // runs before catch on throw
        throw "oops";
    } catch (e) {
        print("caught:", e);     // f.close already ran before this line
    }
}
```

### Example 3 — `defer` with `region`, `unsafe`, and `spawn` boundaries

```adesh
// Defer runs before region bulk-free — arena memory still valid in defer
fn regionDefer() {
    region scratch {
        unsafe {
            let buf: *mut u8 = alloc<u8>(128);
            defer print("buf[0] in defer:", buf[0]); // valid — region live
            buf[0] = 42;
            // no explicit free — region bulk-free handles it after defers
        }
    } // defer prints → then bulk-free

    // Contrast: heap alloc with defer free (outside region, explicit free required)
    unsafe {
        let heap: *mut u8 = alloc<u8>(128);
        defer free(heap); // required outside region
        heap[0] = 99;
        print(heap[0]);
    } // free runs here
}

// Defer does NOT run on spawn boundary — deferred work must be in the same task
async fn spawnDefer() {
    let file = FS.open("/tmp/log", "w");
    defer file.close(); // runs when spawnDefer's scope exits, not when spawned task exits

    let h = spawn async {
        // This task has its own scope — need its own defer
        let f2 = FS.open("/tmp/other", "w");
        defer f2.close();
        await work();
    };
    await h;
    // file.close runs here, after spawned task completes (if awaited)
}
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let defer = 1` | `unexpected token 'defer', expected identifier` | `TokenKind::Defer` reserved (`lexer.rs:1009`) |
| **Parse** | `defer;` with no statement | `expected statement after 'defer'` | Write `defer expr;` or `defer { ... }` |
| **Parse** | `defer` at top level outside any block | `defer is only valid inside a block` | Move inside a `fn` body / block |
| **Borrow** | `defer` capturing a borrowed value that dies before scope exit | `borrowed value does not live long enough` | Clone or extend borrow live range |
| **Region** | `defer` capturing arena pointer after region may have exited | `allocation from region does not outlive region` (when defer scope outlives region) | Ensure defer scope is inside region, not outside |
| **Control** | `defer` inside `defer` with `return`/`throw` inside deferred code | Deferred `return`/`throw` is usually rejected or warns: `defer cannot transfer control` | Use `defer` for cleanup only; handle errors via flags |
| **Linter** | Deferred expression with no side effect | Warning: `defer has no effect` | Remove or add effectful call |

**Common pitfall — `defer` inside loop vs. function:**

```adesh
for item in items {
    let f = FS.open(item, "r");
    defer f.close(); // runs EACH iteration, not after loop
}
// If you need one defer after the loop, move it outside:
let files = [];
for item in items { files.push(FS.open(item, "r")); }
defer { for f in files { f.close(); } }
```

**Pitfall — deferred `return`/`throw`:**

```adesh
defer { return 42; } // usually rejected — defer cannot early-exit its scope in most builds
// Use a flag instead:
let shouldReturn = false;
defer { if shouldReturn { cleanup(); } }
```

---

## See Also

- [region](./region) — arena bulk-free runs **after** `defer` (`DropReason::RegionExit` ordering)
- [alloc](./alloc) / [free](./free) — manual memory paired via `defer free(ptr)`
- [unsafe](./unsafe) — `unsafe` fence for `alloc`/`free` used with `defer`
- [return](./return) / [throw](./throw) / [break](./break) / [continue](./continue) — exits that trigger `defer`
- [Defer Statement](../defer-statement) — dedicated defer reference
- `src/parsing/ast.rs:683`, `src/parsing/drop_insertion.rs:12,180`, `als/src/hover.rs:383`
