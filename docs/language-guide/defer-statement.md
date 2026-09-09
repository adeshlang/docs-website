---
id: defer-statement
title: "Defer Statement Architecture & Scope-Exit Unwinding"
description: "Formal specification of AdeshLang defer statement execution order, LIFO unwinding stacks, AST cleanup block injection, and RAII resource guarantees."
sidebar_label: "Defer & Scope Exit"
---

# Defer Statement Architecture & Scope-Exit Unwinding

This document specifies the execution order, compiler AST lowering, LIFO unwinding stack, and RAII resource safety guarantees for the `defer` statement in AdeshLang.

---

## 1. `defer` Statement Overview

The `defer` statement postpones execution of an expression or block until the enclosing lexical scope terminates. It is the primary RAII mechanism for deterministic resource cleanup:

```adesh
fn process_file(path: string) -> Result<(), Error> {
    let file = open_file(path)?;
    defer file.close(); // Execution deferred until process_file exits

    let buffer = file.read_all()?;
    return Ok(());
} // file.close() runs here even if read_all() returns Err via ?
```

Guarantee: regardless of how execution leaves the block — `return`, `break`/`continue`, `throw`, `?` early-return, or `await` suspension unwinding — the deferred code executes deterministically before the scope's stack frame is popped. Lowered in `src/parsing/ast.rs` as `StmtKind::Defer(Box<Stmt>)`.

### 1.1 Syntax

```ebnf
DeferStmt   ::= "defer" ( Block | ExprStmt | "{" StmtList "}" )
Block       ::= "{" { Stmt } "}"
ExprStmt    ::= Expr ";"
```

Examples:

```adesh
defer file.close();
defer { mutex.unlock(); print("released"); }
defer { if (temp_exists) { remove_file(tmp_path); } }
```

`defer` captures its environment at the point of declaration but executes at scope exit. Captured variables follow normal borrow/ownership rules (§ `semantics-rules.md`).

---

## 2. LIFO Execution Stack Order

If multiple `defer` statements are declared within a single scope, they execute in strict **Last In, First Out (LIFO)** reverse declaration order — mirroring stack unwinding and Go/Zig defer semantics:

```adesh
fn execute_sequence() {
    defer print("Third (LIFO 1)");
    defer print("Second (LIFO 2)");
    defer print("First (LIFO 3)");
    print("Executing Body");
}
```

Output:

```text
Executing Body
First (LIFO 3)
Second (LIFO 2)
Third (LIFO 1)
```

### 2.1 Formal Scope Unwinding Invariant

For a scope containing deferred expressions `D_1, D_2, ... D_n` declared sequentially at evaluation timestamps `t_1 < t_2 < ... < t_n`:

```text
Execution Sequence = [ D_n, D_(n-1), ..., D_1 ]
Nesting:  { defer D1; { defer D2; work; } }  =>  work -> D2 -> D1
```

Nested scopes unwind inner defers before outer defers:

```adesh
fn nested() {
    defer print("outer");
    {
        defer print("inner 2");
        defer print("inner 1");
        print("body");
    } // inner 1, inner 2
    print("after inner");
} // outer
// Output: body -> inner 1 -> inner 2 -> after inner -> outer
```

### 2.2 Defer in Loops & Conditionals

Each loop iteration gets its own defer stack for that iteration's scope:

```adesh
for item in items {
    let handle = acquire(item);
    defer handle.release(); // runs at end of *this iteration*, LIFO within iteration
    handle.use();
} // iteration 1 defer, then iteration 2, etc.
```

Defer inside `if` runs only if the branch was taken:

```adesh
if (needs_lock) {
    mutex.lock();
    defer mutex.unlock(); // only deferred if branch entered
    critical_section();
}
```

---

## 3. Compiler AST Cleanup Block Injection

The compiler processes `defer` via an active **Defer Stack** per basic block, maintained in `src/parsing/hir_lower.rs` and executed by the stack-unwinding logic in `src/runtime` / `src/execution`.

### 3.1 Basic Block Injection Diagram

When a scope terminator (`return`, `break`, `continue`, `throw`, `?` early return) is encountered, the compiler injects the current LIFO defer stack instructions directly into the AST before emitting the exit opcode:

```text
[ Source Code ]                        [ AST Lowered Block ]
fn example() {                         fn example() {
    let res = acquire();                   let res = acquire();
    defer release(res);                    // Main logic
    use(res);                              use(res);
    return;                                // Injected Defer Cleanup Block:
}                                          release(res);
                                           return;
                                       }
```

For multiple defers, injection reverses declaration order:

```text
[ Source ]                     [ Lowered ]
defer A;                       // body
defer B;                       // body
defer C;                       use(...);
use(...);                      C;  // last defer first
return;                        B;
                               A;
                               return;
```

In HIR, this is represented as cleanup edges on the CFG (`src/parsing/hir.rs`); each terminator block has a `cleanup: Vec<Stmt>` that is prepended before the terminator.

### 3.2 Evaluation Timing

```adesh
let x = 1;
defer print(x); // captures x by value/reference per closure_capture rules
x = 2;
```

The `defer` body is not evaluated at declaration — only at scope exit — but variable resolution is lexical. Whether `x` is captured by value or by reference depends on ownership of `x` and whether the defer body moves/borrows it (`src/parsing/closure_capture.rs`). For primitives, the value at exit time is typically observed (reference semantics), unless the defer closure captures by move.

---

## 4. Interaction with `region` / Arena Allocation

Regions (`StmtKind::Region { name, body }`) are arena scopes where allocations are batch-freed. Defers inside a region run **before** the region's arena is freed, ensuring resources are properly closed while memory is still valid:

```adesh
region Temp {
    let buf = alloc_in_region(1024);
    defer flush(buf); // flush runs while buf is still alive
    buf.write("hello");
} // flush -> free arena
```

Order:

```
Enter region
  push region defer stack
  execute body (allocs bump arena pointer)
  on region exit: run region defer stack (LIFO) -> run Drop glue for arena members -> pop arena
```

Borrow checker (`src/parsing/lifetime_tracking.rs`) enforces that references into a region do not escape:

```adesh
let leaked: &Buffer;
region R {
    let buf = Buffer::new();
    leaked = &buf; // E0504: buf does not live long enough (region R ends)
}
```

Defer bodies that capture region-allocated values are therefore always sound — they execute before the region ends.

---

## 5. Interaction with Alloc / Object Lifetimes & Drop Glue

Defer and Drop glue cooperate to ensure zero leaks. Drop glue (`src/parsing/drop_insertion.rs`) runs **after** defers in the unwinding order:

```text
Scope exit sequence:
  1. Run defer stack (LIFO, user-specified cleanup)
  2. Run Drop glue (compiler-inserted destructors for owned values not moved)
  3. Pop stack frame / free arena
```

Example:

```adesh
fn with_resource() {
    let file = open_file("a.txt")?; // owned; Drop will close if not moved
    defer print("defer: custom cleanup");
    // use file
} // order: print("defer...") -> drop(file) (if not moved) -> pop frame
```

If a defer body moves the resource, Drop is suppressed via the Drop Flag (`src/semantics-rules.md`):

```adesh
fn move_in_defer() {
    let file = open_file("a.txt")?;
    defer { file.close(); } // defer body takes ownership of file
    // Drop flag for file is set to 0; only defer's close runs
}
```

For `Share<T>` / reference-counted types, defer that captures a `Share` clone keeps the refcount alive until defer execution.

---

## 6. Exception Safety & Interaction with `throw` / `try` / `catch`

If an exception is thrown inside a block containing `defer`, the two-phase unwinding engine ensures defers run during **Phase 2 (Cleanup Phase)** for every frame between throw site and catch landing pad.

```
[ Exception Thrown via throw expr ]
        |
        v
[ Phase 1: Search Phase ] ----> Traverse stack frames to locate matching 'catch' landing pad
        |                       (no defers run yet; uses DWARF .eh_frame / SEH .pdata)
        v
[ Phase 2: Cleanup Phase ] ---> Re-traverse frames from throw site to landing pad:
        |                       For each frame F:
        |                         Run F's defer stack (LIFO)
        |                         Run F's Drop glue
        |                         Pop F
        v
[ Jump to Landing Pad ] ------> Enter 'catch' block (throw value available as err_name)
```

Guarantee: zero resource leaks (file descriptors, sockets, locks, heap memory) even when exceptions propagate across many frames.

```adesh
fn risky() {
    let file = open_file("data.bin")?;
    defer file.close();
    let lock = mutex.lock();
    defer lock.unlock();
    throw Error { msg: "failure" }; // both defers run: unlock -> close (LIFO: last defer first)
}
try { risky(); } catch (e) { print(f"caught {e}"); }
```

### 6.1 Defer Inside `try`/`catch`

Defers in `try` run if the try block exits (normal or via throw before catch). Defers in `catch` run when the catch block exits:

```adesh
try {
    let res = acquire();
    defer res.release();
    throw Error { msg: "oops" };
    // res.release() runs before entering catch
} catch (e) {
    defer print("catch cleanup");
    print(e);
} // "catch cleanup" runs after catch body
```

### 6.2 `?` Operator is Throw-Like

`expr?` desugars to `match expr { Ok(v)=>v, Err(e)=>return Err(e) }` or `throw` depending on context; either path triggers defers for the exiting scope.

---

## 7. Interaction with `async` / `await` & Concurrency

In `async fn`, defers are tied to the async state machine, not the underlying thread. Each suspension point preserves the defer stack in the state machine struct (`src/execution` async lowering):

```adesh
async fn fetch(url: string) -> string {
    let conn = await connect(url)?;
    defer conn.close(); // deferred until async fn completes (Ready or Err), even across awaits
    let data = await conn.get()?;
    return data;
}
```

If the async task is cancelled or throws, defers still run before the future is marked `Ready(Err(...))` or `Pending` cleanup.

For `spawn`'d tasks, each task has an independent defer stack; parent defers do not affect child tasks.

---

## 8. Control Flow Edge Cases

| Exit Path | Defers Run? | Order |
|---|---|---|
| `return value` | Yes, before return value is moved to caller | LIFO, then move return value |
| `return` (void) | Yes | LIFO |
| `break` / `continue` | Yes, for the exited loop scope only | LIFO within that scope |
| `throw` | Yes, per frame during Phase 2 cleanup | LIFO per frame, outer frames after inner |
| `?` early return | Yes | LIFO |
| Loop iteration end | Yes, per-iteration scope | LIFO |
| `region` exit | Yes, before arena free | LIFO, then Drop, then arena pop |
| Panic in defer | Subsequent defers still run; then panic propagates (aborts if double-panic) |

### 8.1 Panic in Defer

If a defer body itself throws/panics, the runtime runs remaining defers for that frame before propagating the new exception. Double-panic (panic while already unwinding) aborts the process to avoid undefined cleanup order, consistent with DWARF personality functions.

---

## 9. Examples

### 9.1 File Processing with Guaranteed Close

```adesh
fn copy_file(src: string, dst: string) -> Result<(), Error> {
    let src_file = open_file(src)?;
    defer src_file.close();
    let dst_file = create_file(dst)?;
    defer dst_file.close();
    // LIFO: dst_file.close() runs before src_file.close()
    let bytes = src_file.read_all()?;
    dst_file.write(bytes)?;
    return Ok(());
}
```

### 9.2 Lock Guard Pattern

```adesh
fn critical(mutex: &Mutex<Data>) {
    mutex.lock();
    defer mutex.unlock(); // paired unlock, even if critical_section throws
    critical_section(mutex.data);
    // unlock runs here
}
```

### 9.3 Temporary File Cleanup

```adesh
fn with_temp_file(body: fn(string) -> bool) -> bool {
    let tmp = create_temp_file();
    defer { if (file_exists(tmp.path)) { remove_file(tmp.path); } }
    let ok = body(tmp.path);
    return ok; // tmp file removed on any exit path
}
```

### 9.4 Multiple Resources (LIFO demonstrates correctness)

```adesh
fn multi_resource() {
    let a = acquire_a();
    defer release_a(a);
    let b = acquire_b();
    defer release_b(b);
    let c = acquire_c();
    defer release_c(c);
    use_resources(a, b, c);
} // release order: c, b, a — reverse acquisition, prevents dependency violations
```

### 9.5 Defer with `region` and Early Return

```adesh
fn process_batch(items: [string]) -> Result<(), Error> {
    region Scratch {
        let buf = alloc_in_region(4096);
        defer flush(buf);
        for item in items {
            if (item == "") { return Err(Error { msg: "empty item" }); } // flush still runs
            buf.append(item);
        }
    } // region arena freed after defer
    return Ok(());
}
```

### 9.6 Defer in `try`/`catch` with Logging

```adesh
fn logged_operation() {
    print("start");
    defer print("end");
    try {
        defer print("try cleanup");
        risky();
    } catch (e) {
        defer print("catch cleanup");
        print(f"handled: {e}");
    }
}
// Success: start -> risky -> try cleanup -> end
// Throw:   start -> try cleanup -> handled -> catch cleanup -> end
```

---

## 10. Compilation Model & Source References

```
Source: defer expr;  (Lexer: "defer" keyword, src/parsing/lexer.rs)
       |
       v
Parser --> StmtKind::Defer(Box<Stmt>)  (src/parsing/ast.rs:685)
       |
       v
HIR Lower (src/parsing/hir_lower.rs) --> pushes onto per-block Defer Stack
       |
       v
CFG + Cleanup Edges (src/parsing/hir.rs, cfg_borrow) --> terminators annotated with cleanup
       |
       v
Ownership/Drop (src/parsing/drop_insertion.rs, ownership.rs) --> defer before Drop
       |
       v
Codegen --> emits cleanup blocks before each terminator; exception tables (DWARF .eh_frame, SEH .pdata)
            map landing pads to cleanup runs (src/backends/*)
       |
       v
Runtime --> two-phase unwind (Phase1 search, Phase2 cleanup) executes defer stacks
```

The defer stack is `Vec<Stmt>` per scope; `defer` AST nodes are removed after being drained into cleanup edges, so they do not appear as runtime instructions.

---

## 11. Best Practices

1. Pair every `acquire` with an immediate `defer release` on the next line — never separate them.
2. Declare defers in acquisition order; LIFO ensures reverse-release matches resource dependencies.
3. Keep defer bodies small and non-throwing; if they can fail, handle errors inside the defer.
4. Prefer `defer` over manual `try`/`finally` for resource cleanup — it is zero-cost on the happy path (cleanup is injected, not branched).
5. In `async fn`, remember defers live for the entire async operation, not per-await — avoid holding locks across `await` points via long-lived defers.
6. Combine `defer` with `region` for batch arena allocations that need per-allocation finalization.

