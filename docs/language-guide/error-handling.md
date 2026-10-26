---
id: error-handling
title: "Monadic Error Model vs Stack Unwinding Architecture"
description: "Formal specification of Adesh error handling architectures: Result/Option monadic zero-cost error propagation vs native DWARF/SEH stack unwinding exceptions."
sidebar_label: "Error Handling Architecture"
---

# Monadic Error Model vs Stack Unwinding Architecture

This document specifies Adesh's dual error handling models: zero-cost monadic error propagation using `Result<T, E>` / `Option<T>` and target-native stack unwinding exception tables (`try`/`catch`/`throw`).

---

## 1. Dual Error Handling Model Overview

Adesh provides two complementary error handling mechanisms suited for different operational requirements. Both integrate with `defer` and ownership (see `semantics-rules.md`, `defer-statement.md`):

```
                                   +-----------------------+
                                   |  Error Propagation    |
                                   +-----------------------+
                                               |
                    +--------------------------+--------------------------+
                    |                                                     |
          +-------------------+                                 +-------------------+
          | Monadic Propagation|                                 | Stack Unwinding   |
          | (Result / Option) |                                 | (try/catch/throw) |
          +-------------------+                                 +-------------------+
          | - Zero runtime cost|                                 | - Out-of-band     |
          | - Explicit checks |                                 | - Deep call-stack |
          | - No unwinding    |                                 |   unwinding       |
          | - Typed errors    |                                 | - Dynamic catch   |
          | - ? operator      |                                 | - Drop+defer safe |
          +-------------------+                                 +-------------------+
                     |                                                     |
           [User errors, I/O, parsing]                       [Faults, invariants, deep stacks]
```

| Criterion | Monadic (`Result`/`Option`/`?`) | Unwinding (`try`/`catch`/`throw`) |
|---|---|---|
| Cost on success | Zero (tagged union check) | Zero-cost (table-driven, no branch) |
| Cost on error | Return value + branch | Stack walk + table lookup |
| Flow | Explicit, caller-visible | Out-of-band, skips frames |
| Exhaustiveness | Compiler forces handling (`match`/`?`) | Catch may be far from throw |
| Use for | Expected failures (file not found, parse) | Unexpected faults (invariant, deep call) |

---

## 2. Monadic Error Propagation (`Result<T, E>` & `Option<T>`)

Monadic propagation represents operations that can fail as explicit, stack-allocated **tagged unions** without runtime exception overhead. The compiler treats `Result` and `Option` as ordinary enums but optimizes their layout:

```adesh
enum Result<T, E> {
    Ok(T),
    Err(E),
}
enum Option<T> {
    Some(T),
    None,
}
type Maybe<T> = Option<T>; // alias form
```

Lowered in `src/parsing/ast.rs:EnumDecl`, `src/parsing/hir.rs`, and `src/types/value_optimized.rs`.

### 2.1 `Result<T, E>` & `Option<T>` Memory Layout

Both are tagged unions — 1-byte discriminant + max-payload union buffer, aligned to 8 bytes (see `enums-pattern-matching.md`):

```
Result<T, E> Memory Layout (conceptual, native backend)
+-------------------------+-----------------------------------------------------+
|  Discriminant Tag (1B)  |  Payload Union Buffer (max(sizeof(T), sizeof(E)))   |
+-------------------------+-----------------------------------------------------+
|  0 = Ok(T), 1 = Err(E)  |  Stores either T payload or E error payload         |
+-------------------------+-----------------------------------------------------+
|  padding 7B             |  aligned to 8B                                     |
+-------------------------+-----------------------------------------------------+

Option<T> Memory Layout
+-------------------------+-----------------------------------------------------+
|  Discriminant Tag (1B)  |  Payload Buffer (sizeof(T)) if Some, empty if None  |
+-------------------------+-----------------------------------------------------+
|  0 = Some, 1 = None     |                                                     |
+-------------------------+-----------------------------------------------------+
```

Niche optimization: `Option<&T>` or `Option<Share<T>>` may use null-pointer optimization (null = `None`, non-null = `Some`) with no discriminant byte where the backend supports it.

In the interpreter, `Result`/`Option` are `Value::Enum` / `Value::EnumCtor` variants with similar discriminant handling.

### 2.2 Typed Errors

Errors are values — any type `E` can be the error payload:

```adesh
type IoError = { kind: string, path: string };
type ParseError = { line: u64, col: u64, message: string };
fn read_config(path: string): Result<Config, IoError> { ... }
fn parse_int(s: string): Result<i64, ParseError> { ... }
```

Callers match exhaustively:

```adesh
let res = parse_int("42a");
match res {
    Result::Ok(n) => print(f"got {n}"),
    Result::Err(e) => print(f"error at {e.line}:{e.col} {e.message}"),
}
```

Higher-order combinators:

```adesh
extend on Result<T, E> {
    fn map<U>(self: Result<T,E>, f: fn(T): U): Result<U,E> { ... }
    fn map_err<F>(self: Result<T,E>, f: fn(E): F): Result<T,F> { ... }
    fn and_then<U>(self: Result<T,E>, f: fn(T): Result<U,E>): Result<U,E> { ... }
    fn unwrap_or(self: Result<T,E>, default: T): T { ... }
}
extend on Option<T> {
    fn map<U>(self: Option<T>, f: fn(T): U): Option<U> { ... }
    fn unwrap_or(self: Option<T>, default: T): T { ... }
    fn ok_or<E>(self: Option<T>, err: E): Result<T,E> { ... }
}
```

---

## 3. Early Return Operator (`?`) Compiler Lowering

The `?` operator is syntactic sugar for unwrapping `Ok`/`Some` or early-returning `Err`/`None` from the enclosing function:

```adesh
fn read_and_parse(filename: string): Result<i64, Error> {
    let text = read_file(filename)?; // Early returns Err if read_file fails
    let num = parse_int(text)?;     // Early returns Err if parse_int fails
    return Ok(num);
}

fn get_first<T>(arr: [T]): Option<T> {
    let first = arr.get(0)?; // returns None if out of bounds (if get returns Option)
    return Some(first);
}
```

### 3.1 Desugared AST Lowering

The compiler desugars `expr?` into a `match` basic block during `src/parsing/hir_lower.rs` (and `src/parsing/ast.rs:ExprKind::Try`):

```adesh
// Source:  let num = parse_int(text)?;
// Desugared:
let num = match parse_int(text) {
    Result::Ok(val) => val,
    Result::Err(err) => return Result::Err(err), // or throw for mixed models
};

// Source:  let x = maybe?;
// Desugared:
let x = match maybe {
    Option::Some(val) => val,
    Option::None => return Option::None,
};
```

Inside `try`/`catch`, `?` on `Result::Err` may lower to `throw err` if the function is exception-aware; otherwise it returns the error value. The lowering respects the function's return type.

### 3.2 `?` with `defer` and Ownership

`?` is an early-return terminator — it triggers the same scope-exit injection as `return`/`throw` (§ `defer-statement.md`):

```adesh
fn with_cleanup(path: string): Result<string, Error> {
    let file = open_file(path)?; // if Err, no file to clean — no defer yet
    defer file.close();          // only deferred if open succeeded
    let text = file.read_all()?; // if Err, file.close() runs before return
    return Ok(text);
} // normal path: file.close() runs before Ok
```

Drop flags and defer stacks are injected before the early return.

### 3.3 EBNF

```ebnf
TryExpr   ::= Expr "?"                 (* postfix, highest precedence *)
            | "try" Block "catch" "(" IDENT ")" Block
ThrowStmt ::= "throw" Expr ";"
```

`Try` here overloads `ExprKind::Try(Box<Expr>)` for `?` and `StmtKind::TryCatch` for `try`/`catch`.

---

## 4. Native Stack Unwinding Exception Architecture (`try` / `catch` / `throw`)

For unexpected runtime faults, invariant violations, or deep call-stack errors, Adesh implements native unwinding exceptions that propagate out-of-band:

```adesh
try {
    execute_risky_operation();
    validate_invariant(state);
} catch (e) {
    print(f"Caught exception: {e.message}");
    log_error(e);
}

// Throwing
fn validate(x: i64) {
    if (x < 0) { throw Error { message: "negative not allowed", code: 400 }; }
}
```

### 4.1 Exception Frame Tables (DWARF / SEH)

`try`/`catch` blocks have **zero-cost** on the non-exception path — no branch, no flag check. The compiler generates binary exception tables:

- **Linux/macOS**: DWARF `.eh_frame` and `.gcc_except_table` landing pads with call-site tables (LSDA).
- **Windows**: Structured Exception Handling (SEH) `.pdata` and `.xdata` exception directories.
- **Interpreter mode**: `StmtKind::TryCatch { try_block, err_name, catch_block }` with explicit unwind stack in `src/execution` / `src/runtime`.

Each `try` block maps to a call-site entry:

```
Call Site Table (conceptual):
+--------+--------+-------------+-------------+
|  start |  end   |  landing   |  action     |
|  addr  |  addr  |  pad addr  |  type filter|
+--------+--------+-------------+-------------+
|  0x100 |  0x140 |  0x200      |  catch(e)   |
+--------+--------+-------------+-------------+
```

On normal execution, the table is never consulted.

### 4.2 Two-Phase Stack Unwinding Algorithm

When `throw` or a hardware fault occurs, the runtime executes a two-phase unwind (Itanium C++ ABI / Windows SEH model):

```
[ Throw Exception (throw expr or trap) ]
        |
        v
[ Phase 1: Search Phase ] ----> Traverse stack frames via .eh_frame/SEH tables
        |                       to locate matching 'catch' landing pad.
        |                       If no pad found -> terminate / unhandled handler.
        v
[ Phase 2: Cleanup Phase ] ---> Re-traverse stack from throw site to landing pad.
        |                       For each frame F between:
        |                         Run F's defer stack (LIFO)
        |                         Run F's Drop glue (ownership.rs / drop_insertion.rs)
        |                         Pop F's stack frame / region arena
        v
[ Jump to Landing Pad ] ------> Transfer CPU execution to 'catch' block.
                               Throw value bound to err_name in catch scope.
                               Execution resumes normally after catch.
```

This ensures `defer` and destructors interleave correctly with exception propagation.

### 4.3 Throw Value & Catch Typing

`throw expr` moves `expr` (often an `Error` struct) into the exception payload. `catch (e)` binds it in the catch block's scope:

```adesh
type AppError = { message: string, code: i64, cause: string? };
fn fail() { throw AppError { message: "db down", code: 500 }; }
try { fail(); } catch (e) {
    // e: AppError (inferred from throw site, or `Error` if heterogeneous throws)
    print(e.message);
    if (e.cause != null) { print(e.cause); }
}
```

Throwing is a terminator — code after `throw` in the same block is unreachable (W0300).

### 4.4 `try`/`catch` vs `Result` Tradeoffs

```adesh
// Monadic: error is part of return type, caller must handle
fn parse(s: string): Result<i64, ParseError> { ... }
let r = parse("hi");
match r { Result::Ok(n) => print(n), Result::Err(e) => print(e.message) }

// Unwinding: error skips call stack, caught far away
fn deep() { throw Error { message: "deep failure" }; }
fn mid() { deep(); }
fn top() { try { mid(); } catch (e) { print(e.message); } }
```

Use `Result` for expected, recoverable errors that are part of the function's contract. Use `throw`/`catch` for invariant failures, deep stacks where threading `Result` through every frame is noisy, or faults that should unwind `defer`/`Drop` uniformly.

---

## 5. Defer Interplay with Both Models

Defer runs on **all** scope exits, regardless of error model:

```adesh
fn example(path: string): Result<string, Error> {
    let file = open_file(path)?; // Result early return => defer still runs for outer scope
    defer file.close();

    try {
        let data = risky_parse(file.read_all()?);
        defer print("inner defer: parse succeeded path");
        return Ok(data);
    } catch (e) {
        defer print("catch defer: logging");
        log(e);
        return Err(Error { message: f"parse failed: {e.message}" });
    }
} // file.close() + outer defers run here for any path
```

Order for a frame that exits via throw:

```
throw site
  -> Phase 2: defer (LIFO) then Drop for throw frame
  -> defer/Drop for each popped frame up to catch
  -> catch block (with its own defer stack for its scope)
```

For `?` early returns:

```
? triggers:
  run defers for current scope (LIFO)
  run Drop glue
  return Err(e) to caller
```

This unification is implemented via shared cleanup edges in the CFG (`src/parsing/hir.rs`, `src/parsing/drop_insertion.rs`).

---

## 6. `async` / `await` & Error Propagation

Futures propagate errors via `Result`-typed `Poll::Ready`:

```adesh
async fn fetch(url: string): Result<string, Error> {
    let conn = await connect(url)?; // ? on Result inside async fn => early returns Err
    let resp = await conn.get()?;   // ? triggers async early return (future Ready(Err))
    return Ok(resp.body);
}

async fn caller() {
    let res = await fetch("https://example.com");
    match res {
        Result::Ok(body) => print(body),
        Result::Err(e) => print(f"fetch failed: {e.message}"),
    }
}
```

Throwing inside `async fn` rejects the future with the thrown value (analogous to `Promise.reject` / `BuiltinEnv::schedule_reject`). Awaiting a rejected promise surfaces as `Err` or throw depending on `await` context and `try`/`catch`:

```adesh
async fn failing(): string {
    throw Error { message: "async failure" };
}
try {
    let v = await failing(); // throw propagates to catch
} catch (e) {
    print(f"caught async: {e.message}");
}
```

The state machine stores the error payload and transitions to `Done` with `Ready(Err(...))` or enters the exception path.

---

## 7. Compilation Pipeline & IR Lowering

```
Source: expr? / try { } catch(e) { } / throw e
       |
       v
Lexer (src/parsing/lexer.rs: "try", "catch", "throw", "?" as Try)
       |
       v
Parser --> ExprKind::Try(Box<Expr>)          -- for postfix ?
        --> StmtKind::TryCatch { try_block, err_name, catch_block }
        --> ExprKind::Throw(Box<Expr>)
       |
       v
HIR Lower (src/parsing/hir_lower.rs, src/semantics/hir_lower.rs)
        -- desugars ? to match+return/throw
        -- emits try/catch as exception regions with landing pads
        -- attaches cleanup edges for defer/Drop on every unwind path
       |
       v
Borrow/Ownership/Drop (borrow_check.rs, drop_insertion.rs, ownership.rs)
        -- verifies throw value is moved, catch binding is owned
       |
       v
Codegen (src/backends/*)
        -- Result/Option: tagged union branches (if + return)
        -- try/catch: .eh_frame/.gcc_except_table or SEH .pdata/.xdata
        -- throw: call to _Unwind_RaiseException or SEH RaiseException
```

---

## 8. Error Handling Patterns

### 8.1 Result Chain with `?` and `map`

```adesh
fn load_user(id: string): Result<User, Error> {
    let raw = read_file(f"users/{id}.json")?;
    let json = parse_json(raw)?;
    let user = User::from_json(json)?; // each ? short-circuits
    return Ok(user);
}
let user = load_user("42").map((u) => f"{u.name}").unwrap_or(User { name: "guest", age: 0 });
```

### 8.2 Option Safety

```adesh
fn find_user(id: string): Option<User> {
    let users: [User] = load_all();
    for u in users { if (u.id == id) { return Some(u); } }
    return None;
}
let name = find_user("42").map((u) => u.name).unwrap_or("unknown");
print(name);
```

### 8.3 Mixing `try`/`catch` with `Result` Boundaries

```adesh
fn risky(): Result<i64, Error> {
    try {
        let n = parse_int("not a number")?; // inner ? returns Err, but throw would also work
        if (n < 0) { throw Error { message: "negative" }; }
        return Ok(n);
    } catch (e) {
        return Err(Error { message: f"caught: {e.message}" });
    }
}
// Normalize exception boundary to Result for callers that prefer monadic handling
```

### 8.4 `defer` + `Result` for Resource Safety

```adesh
fn with_file<T>(path: string, body: fn(&File): Result<T, Error>): Result<T, Error> {
    let file = open_file(path)?;
    defer file.close();
    return body(&file)?; // if body returns Err, close still runs
}
let content = with_file("data.txt", (f) => Ok(f.read_all()));
```

---

## 9. Common Errors

| Code | Message | Fix |
|---|---|---|
| `E0080` | `? operator used outside function returning Result/Option` | Change return type or remove `?` |
| `E0081` | `try/catch cannot catch non-throwable type` | Throw a valid `Error`/object |
| `E0082` | `unreachable code after throw/return/?` | Remove dead code or guard with condition |
| `E0083` | `mismatched error types in ? propagation` | Ensure `Err` types are compatible or `From` |
| `E0084` | `throw outside try context may terminate` | Wrap in `try` or document as unrecoverable |
| `W0080` | `Result value ignored, use match or ?` | Handle `Result` — not checking is likely a bug |
| `W0081` | `empty catch block` | Add handling or rethrow |

---

## 10. Extended Examples

### 10.1 Robust File Pipeline with Both Models

```adesh
type FileError = { path: string, kind: string };
fn safe_read(path: string): Result<string, FileError> {
    try {
        let file = open_file(path)?; // ? on I/O Result
        defer file.close();
        let content = file.read_all()?; // ? on read Result
        if (content.len() == 0) { throw FileError { path: path, kind: "empty" }; }
        return Ok(content);
    } catch (e) {
        return Err(FileError { path: path, kind: f"exception: {e.message}" });
    }
}
let res = safe_read("config.json");
match res {
    Result::Ok(text) => print(f"read {text.len()} bytes"),
    Result::Err(err) => print(f"failed {err.path}: {err.kind}"),
}
```

### 10.2 Async Error Aggregation

```adesh
async fn fetch_all(urls: [string]): [Result<string, Error>] {
    let handles: [JoinHandle<Result<string, Error>>] = [];
    for url in urls {
        handles.push(spawn(async move {
            try {
                let body = await fetch(url)?; // ? inside async Result fn
                return Ok(body);
            } catch (e) {
                return Err(Error { message: f"{url}: {e.message}" });
            }
        }));
    }
    let out: [Result<string, Error>] = [];
    for h in handles { out.push(await h); }
    return out;
}
```

### 10.3 `Option` Chain for Nullable Lookup

```adesh
type User = { name: string, email: string?, age: u64 };
let db: HashMap<string, User> = load_db();
let email = db.get("42")?.email?.toLowerCase();
print(email.unwrap_or("no email"));
```

### 10.4 Transaction with `defer` + `throw`

```adesh
fn transfer(from: &mut Account, to: &mut Account, amount: i64): Result<(), Error> {
    from.lock();
    defer from.unlock();
    to.lock();
    defer to.unlock();
    if (from.balance < amount) {
        throw Error { message: "insufficient funds" };
    }
    try {
        from.balance -= amount;
        to.balance += amount;
        commit().map_err((e) => Error { message: e })?;
        return Ok(());
    } catch (e) {
        rollback();
        return Err(Error { message: e.message });
    }
} // locks released for any path: success, ?, or throw
```

---

## 11. Best Practices

1. Prefer `Result`/`Option` + `?` for expected failures; reserve `throw` for invariant violations and deep-stack aborts.
2. Always handle `Result` — enable `W0080` (`Result ignored`) as an error in CI.
3. At API boundaries, normalize exceptions to `Result` via `try`/`catch` so callers have uniform handling.
4. Pair every `acquire` with `defer release` even when using `?` — the compiler will run defers on early returns.
5. Keep `try` blocks narrow: wrap only the fallible operation so `catch` does not accidentally swallow unrelated throws.
6. For `async fn` returning `Result`, use `?` freely — the state machine propagates `Ready(Err(...))` without unwinding.
7. Document the error type `E` in `Result<T,E>` function signatures; use type aliases (`type ApiResult<T> = Result<T, ApiError>`) for consistency.
