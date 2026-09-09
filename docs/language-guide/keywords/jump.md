---
id: jump
title: jump
sidebar_label: jump
description: The jump keyword — reserved low-level unconditional transfer (goto-like). Parsed as jump <expr> and carried as StmtKind::Jump. Rarely used outside compiler-generated or unsafe trampolines.
---

# `jump`

`jump` is a **reserved low-level control-flow** keyword for **unconditional transfer** — a scoped `goto`-like primitive carried as `jump <expr>` / `StmtKind::Jump(Expr)` (`src/parsing/ast.rs:636-637`). In normal application code it is almost never written by hand; it exists for compiler-generated trampolines, `unsafe` control-flow shims, and future structured local-jump extensions. Most programs should use `if`/`while`/`for`/`break`/`continue`/`return` instead.

> **Ground truth:** Lexer `TokenKind::Jump` (`src/parsing/lexer.rs:960`, keyword `"jump"`), AST `StmtKind::Jump(Expr)` (`ast.rs:636-637`), `TokenKind::Break`/`Continue`/`Return` neighbors (`ast.rs:2046-2049`), `Value::LazyRange` and loop lowering unrelated.

---

## Syntax

```text
jump_stmt ::= "jump" expr ";"        // expr typically an identifier/label or computed target
block     ::= "{" stmt* "}"
stmt      ::= jump_stmt
            | "break" ";" | "continue" ";" | "return" expr? ";"
            | ... other StmtKind variants
```

`jump` is reserved (`TokenKind::Jump`). Exactly one expression follows `jump`; braces are not required after it, but a trailing `;` is.

### Forms (current parser support is narrow/experimental)

```adesh
jump label;          // symbolic label target
jump target_expr;    // computed expression form
jump 42;             // integer target (in some experimental branches)
```

Unlike `goto` in C, `jump` targets are **expression-position** (`StmtKind::Jump(Expr)`) rather than a separate `Label` syntax — the evaluator resolves the expression to a jump target.

---

## Semantics

### Compilation model — how `jump` differs from other transfers

```
   break/continue ──► constrained: only inside loops `While`/`ForIn`
   return ─────────► function exit
   jump ───────────► unconditional, label/computed target (scoped, not cross-function)
   throw/catch ────► exception unwind
```

| Construct | TokenKind (`ast.rs:1898-2077`) | Scope | Target | Cross-function? |
|---|---|---|---|---|
| `break` | `Break` (`2046`) | innermost loop | loop exit | No |
| `continue` | `Continue` (`2047`) | innermost loop | loop header | No |
| `return` | `Return` (`1991`) | current function | function exit | No |
| **`jump`** | **`Jump` (`2048`)** | **current block/function** | **`Expr` (label/computed)** | **No** |
| `throw` | `Throw` (ExprKind) | unwind | nearest `catch` | Yes (via unwind) |

### Pipeline placement

1. **Lex** `jump` → `TokenKind::Jump` (`lexer.rs:960`, via `ident()` keyword table).
2. **Parse** — `StmtKind::Jump(Expr)` captured in `Stmt { kind, span }` (`ast.rs:515-518`, `585-637`). No special label table is built at parse time; the `Expr` payload is opaque.
3. **HIR/lower** — `jump` lowers to a direct branch to a label block if the backend supports it, or to a computed jump through a trampoline. In the current interpreter, many `jump` forms are treated as **experimental/narrowly supported** and may be rejected or desugared depending on build flags.
4. **Verification** — jumps are constrained to the **current function**; cross-function `jump` is a `LangError`. Some builds restrict `jump` to `unsafe` contexts only.

### Why `jump` is rarely used

- **Structured alternatives cover ~99% of cases:** `if/else`, `while`, `for..in`, `match`, `break`/`continue` with labeled blocks (when available), and early `return` eliminate the need for `goto`-style control.
- **Safety:** unconditional jumps complicate borrow/region analysis (`Region`, `Defer`) and defect deterministic cleanup; the compiler prefers bounded control flow it can reason about statically.
- **Experimental status:** parser support is intentionally narrow (`jump` is reserved but not generalized across all targets); relying on it in production code risks breaking when the implementation tightens label scoping.

### Safe vs. unsafe `jump`

Some code paths require `jump` to target computed addresses or to escape normal borrow-checked scopes (e.g., coroutine trampolines). Those uses should be confined to `unsafe { jump expr; }` blocks where the compiler's safety guarantees are explicitly suspended. Application-level jumps should stay within a single function and use symbolic labels.

---

## Examples

### Example 1 — Symbolic label jump (structured local transfer)

```adesh
// Illustrative structured use — jump as a conservative replacement for deeply nested breaks.
// Most style guides would prefer refactoring to early returns; this shows the mechanics.

fn find_first_positive(nums: [i32]) -> i32 {
    let result: i32 = -1;
    // Use a sentinel label and jump to centralize exit logic.
    // Note: if label syntax varies by branch, the target is an expr resolver.
    for n in nums {
        if (n > 0) {
            result = n;
            jump done; // transfer to `done:` block (label resolution is backend-specific)
        }
    }
    done: // label (pseudo — actual label decl syntax is backend/experimental)
    return result;
}

print(find_first_positive([-3, -1, 0, 5, 2])); // 5
print(find_first_positive([-2, -3]));          // -1

// Idiomatic alternative without jump (preferred):
fn find_first_positive_idiomatic(nums: [i32]) -> i32 {
    for n in nums { if (n > 0) { return n; } }
    return -1;
}
```

> The labeled block `done:` after the loop is illustrative — the current parser's label binding is experimental. Treat this as the **intended** semantics, not as guaranteed syntax in every build.

### Example 2 — Computed jump inside `unsafe` (trampoline pattern)

```adesh
// Compiler-generated/unsafe trampolines may compute a jump target at runtime.
// This pattern is legitimate inside `unsafe` + `region` where pointer targets are stable.

unsafe fn dispatch(op: u8, handlers: [fn() -> void]) {
    // handlers is a fixed array of entry points; jump selects one.
    // Bounds check first — jump itself does not validate the target.
    if (op >= handlers.len() as u8) {
        throw "invalid op";
    }
    // Computed jump — target is an expression, not a literal label
    // (lowered as indirect branch / table jump in capable backends)
    jump handlers[op as usize]; // jump to handler[op] entry
    // Control never falls through here
}

// Safe wrapper that validates before delegating to the unsafe trampoline
fn safe_dispatch(op: u8) {
    let table: [fn() -> void] = [() => print("op0"), () => print("op1"), () => print("op2")];
    unsafe { dispatch(op, table); }
}

safe_dispatch(1u8); // op1 (via computed jump inside unsafe)
// safe_dispatch(99u8); // throws before jump — bounds check protects the trampoline

// Contrast with structured match (preferred for application code):
fn safe_dispatch_match(op: u8) {
    match op {
        0u8 => print("op0"),
        1u8 => print("op1"),
        2u8 => print("op2"),
        _   => throw "invalid op",
    }
}
```

**Lesson:** `jump handlers[op]` is strictly more dangerous than `match` because the compiler cannot verify exhaustiveness; reserve it for generated code or `unsafe` shims.

### Example 3 — Why `jump` is a poor fit for normal control flow (and what to use instead)

```adesh
// Anti-pattern: using jump to simulate loops
fn count_with_jump(n: i32) -> i32 {
    let i: i32 = 0;
    loop_start:
    if (i >= n) { jump loop_end; }
    i += 1;
    jump loop_start;
    loop_end:
    return i;
}

print(count_with_jump(5)); // 5 — works, but unreadable and defeats analysis

// Preferred: structured loops cover the same behavior with safety guarantees.
// `defer` and `region` cleanup reason about these forms; they cannot reason about arbitrary jumps.

fn count_structured(n: i32) -> i32 {
    let i: i32 = 0;
    while (i < n) { i += 1; }
    return i;
}

fn count_for(n: i32) -> i32 {
    let c: i32 = 0;
    for _ in 0..n { c += 1; }
    return c;
}

print(count_structured(5)); // 5
print(count_for(5));        // 5
// Both structured forms participate in borrow/region/defer dataflow;
// `jump` may inhibit those passes or require `unsafe`.
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let jump = 1` | `unexpected token 'jump', expected identifier` | `TokenKind::Jump` is reserved (`lexer.rs:960`) |
| **Parse** | `jump;` with no expr | `Expect expression after 'jump'` | Write `jump label;` or `jump expr;` |
| **Parse** | `jump label, other` with comma | `unexpected ',' after jump target` | `jump` takes exactly one `Expr` |
| **Semantic** | `jump` outside any function | `jump is only valid inside a function body` | Move transfer inside a `fn` |
| **Semantic** | `jump` targeting cross-function label | `jump target escapes function boundary` | Targets must be local to the current function |
| **Semantic** | `jump` out of `defer`/`region` cleanup scope | `jump cannot bypass defer/region cleanup` (in strict builds) | Use structured exit (`return`/`break`) that triggers cleanup |
| **Runtime** | `jump` to unresolved/undefined label | `LangError: unknown jump target '<label>'` | Define the label or correct the target expression |
| **Safety** | `jump` inside safe code to computed pointer | May be rejected: `jump target requires unsafe` | Wrap in `unsafe { jump expr; }` |
| **Linter** | `jump` in application code | Warning: `use of low-level jump; prefer structured control flow` | Replace with `if`/`while`/`for`/`match`/`return` |

**Common pitfall — using `jump` where `break`/`continue`/`return` is intended:**

```adesh
for x in items {
    if (x == sentinel) { jump done; } // jump out of loop — works but non-idiomatic
    process(x);
}
done:

// Preferred (clearer and analyzable):
for x in items {
    if (x == sentinel) { break; } // break is scoped to the loop, needs no label
    process(x);
}
```

Reserve `jump` for **generated code and `unsafe` trampolines**; application logic belongs in structured control flow that participates in verification passes (`cfg_borrow`, `defer`, `region`).

---

## See Also

- [break & continue (control flow)](../control-flow/break-continue) — `TokenKind::Break`/`Continue` structured loop exits
- [return](../control-flow/return) — `TokenKind::Return` function exit
- [unsafe](./unsafe) — `TokenKind::Unsafe` required for dangerous `jump` targets
- [region](./region) / [defer](./defer) — `TokenKind::Region`/`Defer` cleanups that `jump` may bypass
- [decorator](./decorator) — `TokenKind::Decorator` (unrelated to control flow)
- [readonly](./readonly) — `TokenKind::Readonly` (orthogonal immutability)
- `src/parsing/lexer.rs:960`, `src/parsing/ast.rs:636-637,2046-2049`, `src/parsing/cfg_borrow/*`
