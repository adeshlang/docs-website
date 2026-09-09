---
id: require
title: require
sidebar_label: require
description: The require keyword — compile-time and runtime precondition contracts. Fails the build or the call if the asserted condition does not hold.
---

# `require`

`require` states a **precondition contract** that must hold for compilation or execution to continue. Unlike `typecheck` (which asserts static types) or `assert` (which is a runtime-only debug check), `require` is **phase-aware**: inside `compile`/`typecheck`/`emit` it fails the build, inside `runtime` it throws at call time. It is the common vocabulary for decorator contracts and defensive file-level invariants.

> **Ground truth:** Lexer `TokenKind::Require` (`src/parsing/lexer.rs:1020`, keyword `"require"`), usable inside `DecoratorPhase::Compile/Runtime/Typecheck/Emit` (`src/parsing/ast.rs:699-708`), distinct from `TokenKind::Typecheck`/`Compile`/`Emit`/`Runtime`, `LangError` reporting with file:line:col + `line_text`.

---

## Syntax

```text
require_stmt   ::= "require" expr ("," expr)? ";"   // expr may be call or binary
                 | "require" "(" expr ")" ";"        // optional parens (style)
                 | "require" expr "is" type ";"       // type-form forwarded to typecheck
phase_usage    ::= "require" condition "," string ";" // with diagnostic message
decorator_body ::= "decorator" ident "(" params ")" "{" phase* "}"
phase          ::= ("compile"|"typecheck"|"emit"|"runtime") "{" require_stmt* ... "}"
```

`require` is reserved (`TokenKind::Require`). Two-argument form `require(cond, "message")` is idiomatic; single-argument `require(cond)` uses a default message.

### Examples of each form

```adesh
require T is Numeric;                          // type precondition (like typecheck sugar)
require x > 0;                                 // value precondition
require(x > 0, "x must be positive");          // with message
require target.params.len() == 1;              // decorator-site assertion
```

Parser expects `require` followed by an expression. A bare `require;` without condition is a parse error.

---

## Semantics

### Compilation model — phase-aware failure

```
                          compile{ require(...) } ──► build fails → LangError
                          typecheck{ require(...) } ─► build fails
                          emit{ require(...) }      ─► build fails
Source ──► Lex(Require) ──► Parse ──► HIR ──► phases ──┤
                          runtime{ require(...) } ──► call fails at runtime (throw)
                          top-level require(...)   ──► build fails (file-level invariant)
```

| Site | When checked | On failure | `call.proceed()` available? |
|---|---|---|---|
| `compile { require }` | compile time | `CompileError: requirement failed` | No |
| `typecheck { require }` | type resolution | `TypeError: requirement failed` | No |
| `emit { require }` | LIR lowering | `LowerError: requirement failed` | No |
| `runtime { require }` | per-call, at runtime | `LangError` thrown (catchable) | Yes |
| file / `compile { require }` at top level | compile time | build abort | No |

All failures emit `LangError { kind, line, col, line_text, hint }` with clickable file:line:col (lexer tracks `file` in `Lexer::with_file`, `lexer.rs:46-52`).

### `require` vs. `typecheck` vs. `assert`

| Primitive | TokenKind (`ast.rs:2072-2077`) | Checks | Phase | Failure |
|---|---|---|---|---|
| `typecheck x is T` | `Typecheck` | **static type** of `x` vs. `T` | compile only | build abort |
| `require cond` | `Require` | **value/AST property** | compile *or* runtime | build abort or throw |
| `require T is Numeric` | `Require` (type form) | **type constraint** sugar | compile only | build abort |
| `assert(cond)` (if present) | — | runtime value | runtime only | panic/debug trap |

Prefer:
- `typecheck` when you want the **type table** explicitly mentioned (`is`).
- `require` when the condition is a **value, arity, or AST shape** (`target.params.len() == 1`, `x > 0`).
- `require` in `runtime` when the condition involves a **live `Value`** that is only known at call time.

### Short-circuit and message convention

```adesh
require(x > 0, "x must be positive, found ${x}");
```

- The second argument, if present, must be a `String`/`Template`; it becomes `LangError.message`.
- `require` is not short-circuited by the compiler — the condition is evaluated; side effects in the condition do execute (avoid them — keep conditions pure).

### Decorator contract pattern

Contracts compose: each `require` in a decorator phase contributes a conjunctive precondition. Multiple `require`s in one phase are equivalent to `&&` but give better diagnostics (each failure is pinpointed to its source span).

---

## Examples

### Example 1 — File-level and `compile` preconditions

```adesh
// File-level invariant: this module only works with 64-bit pointer width
compile {
    require WORD_SIZE == 8, "this module requires 64-bit target";
    require VERSION >= "2.0.0", "AdeshLang >=2.0 required";
}

// Precompute a table and assert structural invariant at compile time
compile {
    const SIZES = [1, 2, 4, 8];
    fn validate_sizes() -> bool {
        for s in SIZES { require s > 0 && (s & (s - 1)) == 0, "sizes must be powers of two"; }
        return true;
    }
    require validate_sizes(), "size validation failed";
    emit(`const SIZES = [1,2,4,8];`); // freeze after validation
}

// Value requirement that fails at compile time — build aborts with message + span
// compile { require(1 > 2, "math is broken"); } // CompileError: requirement failed: math is broken

print(SIZES.len()); // 4 — validated and emitted before runtime
```

Failures here abort the build before any `runtime` code is generated.

### Example 2 — Decorator contract with `require` across all four phases

```adesh
// A decorator that only makes sense on async functions with exactly one numeric param.
// Each phase guards a different aspect.

decorator numeric_retry(attempts: i32) {
    compile {
        // Structural: decorator arg and target shape known at AST level
        require attempts > 0 && attempts <= 10, "attempts must be 1..10";
        require target.params.len() == 1, "numeric_retry expects single-param function";
    }
    typecheck {
        // Type-level: param and return must be numeric
        require target.params[0].type is Numeric, "param must be Numeric, found ${target.params[0].type}";
        require target.ret_type is Numeric, "return must be Numeric";
    }
    emit {
        // Backend: ensure target isn't already marked no-retry
        require !has_directive(target, "no_retry"), "target marked no_retry but retry requested";
    }
    runtime {
        // Value-level: runtime arg must satisfy value constraint too (any-typed callers)
        require(call.args[0] is Numeric, "runtime arg must be numeric"); // isinstance-like check
        let last: any = null;
        for i in 0..attempts {
            try { return call.proceed(); }
            catch e { last = e; }
        }
        throw last;
    }
}

@numeric_retry(3)
fn fetch_count(n: i32) -> i32 {
    if (n < 0) { throw "negative"; }
    return n + 1;
}

print(fetch_count(5));  // 6 — succeeds first try
// print(fetch_count("hi")); // runtime require fails: runtime arg must be numeric
// @numeric_retry(20)
// fn bad(a: i32, b: i32) -> i32 { return a+b; } // compile require fails: attempts must be 1..10 / single-param
```

This shows the idiomatic split: `compile` checks AST shape, `typecheck` checks types, `emit` checks IR directives, `runtime` checks live values.

### Example 3 — `require` vs. `typecheck` and runtime fallback

```adesh
type Port = u16;

fn serve(port: Port) { print("serving on " + port); }

// Compile-time type precondition — fails build if port type drifts
typecheck serve is fn(Port) -> void;

// Runtime value precondition — fails call, but builds fine
decorator valid_port(target) {
    compile {
        // Ensure decorated function takes exactly one Port-like param (type-level)
        require target.params.len() == 1, "valid_port expects single param";
    }
    typecheck {
        require target.params[0].type is Port, "param must be Port";
    }
    runtime {
        let p = call.args[0] as i32;
        // Runtime range check — value only known at call time
        require(p >= 1 && p <= 65535, "port out of range: ${p}");
        return call.proceed();
    }
}

@valid_port
fn bind(port: Port) { print("bound to " + port); }

bind(8080u16); // ok
// bind(99999); // runtime require throw: port out of range: 99999
// @valid_port
// fn bad2(host: string) { ... } // typecheck require fails at decoration site

// Choosing between them:
// - Want build to break if someone changes bind's signature → typecheck/require in compile/typecheck
// - Want call to throw if someone passes 0              → require in runtime
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let require = 1` | `unexpected token 'require', expected identifier` | `TokenKind::Require` is reserved (`lexer.rs:1020`) |
| **Parse** | `require;` (no condition) | `Expect expression after 'require'` | Write `require cond;` or `require(cond, "msg");` |
| **Parse** | `require x is T` outside type-aware phase | `unexpected 'is' after 'require'` in some parser versions | Use `typecheck x is T;` for pure type assertions |
| **Compile** | `require(false)` in `compile` | `CompileError: requirement failed: <msg>` + span | Fix invariant or guard with `if` before `require` |
| **Compile** | `require` message not a string | `require message must be a string` | Second arg must be `String` or template `` `...` `` |
| **Runtime** | `require(false)` in `runtime` | `LangError` thrown at call site (catchable via `try/catch`) | Caller may `try` the decorated call |
| **Type** | `require T is Numeric` where `T` unknown | `TypeError: unknown type 'T'` | Define `type T` or correct the bound |
| **Phase** | `require` referring to `call` outside `runtime` | `call is only defined inside runtime phase` | `call`/`call.proceed()` exist only in `runtime {}` |

**Common pitfall — putting value checks in the wrong phase:**

```adesh
decorator bad_range(target) {
    compile {
        // Wrong: call.args is a runtime value, meaningless at compile time
        // require(call.args[0] > 0, "must be positive"); // error: call not defined in compile phase
    }
    runtime {
        // Correct: check live values here
        require(call.args[0] > 0, "must be positive, found ${call.args[0]}");
        return call.proceed();
    }
}
```

Keep **AST/type** invariants in `compile`/`typecheck`, **live `Value`** invariants in `runtime`.

---

## See Also

- [typecheck](./typecheck) — `TokenKind::Typecheck` type assertions vs. `require` value contracts
- [compile](./compile) — `TokenKind::Compile` where file-level `require` fails the build
- [runtime](./runtime) — `TokenKind::Runtime` / `call.proceed()` runtime `require` as catchable throw
- [emit](./emit) — `TokenKind::Emit` where `require` guards IR mutation
- [decorator](./decorator) — multi-phase `require` contracts (`src/parsing/ast.rs:699-718`)
- [readonly](./readonly) — `TokenKind::Readonly` field immutability complements `require` field invariants
- `src/parsing/lexer.rs:1020`, `src/parsing/ast.rs:699-718`, `src/parsing/error.rs`
