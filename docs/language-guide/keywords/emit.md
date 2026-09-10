---
id: emit
title: emit
sidebar_label: emit
description: The emit keyword — backend code generation hook and directive emission. Used inside compile and emit decorator phases to inject or mutate IR.
---

# `emit`

`emit` is the **code-generation** primitive of AdeshLang's metaprogramming system. From within a `compile { ... }` block or an `emit { ... }` decorator phase, `emit` injects source, declarations, or backend IR directives into the program being built. It is the only way compile-time logic materializes as runtime code.

> **Ground truth:** Lexer `TokenKind::Emit` (`src/parsing/lexer.rs:1019`, keyword `"emit"`), AST `DecoratorPhase::Emit(Arc<Vec<Stmt>>)` (`src/parsing/ast.rs:707-708`), `DecoratorDef` (`ast.rs:711-718`), HIR/LIR lowering handles emit output, `StmtKind::Decorator` phases capture `emit {}` bodies.

---

## Syntax

```text
emit_stmt     ::= "emit" expr ";"                 // string or template injection
emit_block    ::= "emit" "{" stmt* "}"            // structured injection (de sugar to string)
emit_phase    ::= "emit" "{" stmt* "}"            // inside decorator → DecoratorPhase::Emit
decorator     ::= "decorator" ident "(" params ")" "{" phase* "}"
phase         ::= "compile" "{" stmt* "}"
                | "runtime" "{" stmt* "}"
                | "typecheck" "{" stmt* "}"
                | "emit" "{" stmt* "}"
```

`emit` is reserved (`TokenKind::Emit`). Two syntactic forms exist: **statement** `emit "code";` / `emit(`...`)` and **phase** `emit { ... }` inside a decorator.

### String/template injection (inside `compile`)

```adesh
compile {
    emit "let x = 42;";                 // raw source injection
    emit(`const N = ${computeN()};`);   // template with interpolation
}
```

### Structured emit block

```adesh
compile {
    emit {
        let generated = 99; // statements here are emitted into parent scope
    }
}
```

### Emit phase inside decorator (backend/IR mutation)

```adesh
decorator instrument(target) {
    compile { emit(`target.__instrumented = true;`); }
    emit {
        // Backend-specific: mutate IR, attach directives, or lower annotations
        // Runs during LIR generation, after typecheck
    }
    runtime { return call.proceed(); }
}
```

Parser expects `emit` followed by either an expression+`;` or a `{ ... }` block. `emit x is T` is not valid — `is` belongs to `typecheck`.

---

## Semantics

### Compilation model — where `emit` runs

```
Source ──► Lex(Emit) ──► Parse ──┐
                                 │  ┌─────────────────────┐
                          compile{ } ─►│ compile-time interp│──► emit "..." ──► parent AST
                          typecheck{ } │ (type resolution)  │                injected
                          runtime{ }  │ (captured)         │                (Hir build)
                          emit{ }     └─────────────────────┘                │
                                           │                                  ▼
                                           ▼                              HIR rebuild
                                    Lower ──► LIR ──► emit{} phase  ──► IR mutation/hooks
                                                            │                  │
                                                            └─────────► Backend (emit directives)
                                                                            Runtime (generated code runs)
```

1. **Lex/Parse** — `emit` inside `compile {}` is parsed as a regular statement that calls the emit intrinsic; `emit { ... }` at decorator top-level becomes `DecoratorPhase::Emit(Arc<Vec<Stmt>>)`.
2. **Compile evaluation** — the compile-time interpreter executes `compile{}` bodies; each `emit expr` evaluates `expr` to a string (or template) and **splices** it into the surrounding module's AST as if that source had been written at the decoration site. Injection re-enters lex/parse for the emitted fragment.
3. **HIR rebuild** — after all `compile` `emit`s have fired, HIR is rebuilt so `typecheck` and `emit` phases see the new declarations.
4. **LIR `emit` phase** — `DecoratorPhase::Emit` runs during lowering; it may mutate IR nodes directly (backend-specific) or emit directives (e.g., `#[inline]`, `extern` attributes).
5. **Runtime** — generated code executes with no trace that it was emitted.

### What `emit` can and cannot do

| Capability | `emit` inside `compile{}` | `emit` phase `emit{}` |
|---|---|---|
| Inject source text (`emit "let x=1;"`) | Yes — parent scope | No — use IR handles |
| Inject via template (`emit(`...`)`) | Yes — with `${}` interpolation | Yes — string form |
| Mutate IR nodes | No — AST only | **Yes** — via IR builder handles |
| Emit backend directives | No | Yes (e.g., `#[inline]`) |
| Access `target` | Yes | Yes |
| Call `call.proceed()` | No (`TokenKind::Proceed` is runtime-only) | No |
| Valid outside `compile`/`emit` | **No** — `emit is only valid inside compile or emit phase` | — |

### String vs. IR emission

- **String emission** (`emit "let ..."` / `emit(`...`)`) is parsed as source; hygiene is the responsibility of the emitter — use `${target.name}`-qualified names to avoid shadowing (`__generated_${target.name}` pattern).
- **IR emission** (inside `emit {}` phase) works on typed IR handles; it is stronger (can alter calling convention, add attributes) but backend-specific and rarely needed outside compiler plugins.

### Ordering guarantees

`emit`s execute in **definition order** within a single `compile{}` body, and across decorators in **pipeline order** (`DecoratorPipelineStage` order, outermost first). A second decorator's `compile{}` sees declarations emitted by the first decorator's `compile{}` because HIR is rebuilt incrementally.

---

## Examples

### Example 1 — Generating declarations at compile time

```adesh
// Generate a family of accessors from a list — without macros the file would repeat by hand.
compile {
    const FIELDS = ["x", "y", "z"];
    for field in FIELDS {
        emit(`fn get_${field}(p: Point): f64 { return p.${field}; }`);
        emit(`fn set_${field}(p: mut Point, v: f64) { p.${field} = v; }`);
    }
    // Also emit a constant that runtime code can reference:
    emit(`const FIELD_COUNT = ${FIELDS.len()};`);
}

struct Point { x: f64, y: f64, z: f64 }

print(get_x(Point { x: 1.0, y: 2.0, z: 3.0 })); // 1.0 — generated
print(FIELD_COUNT); // 3 — emitted constant

// Hygiene note: generated names incorporate FIELD to avoid collision:
// get_x, get_y, get_z each derived from interpolated field — no manual repetition
```

Each `emit` re-parses its string; the three accessor pairs appear to the type checker as if they were written by hand.

### Example 2 — `emit` inside a decorator's `compile` phase (injecting metadata/fields)

```adesh
// Decorator that stamps each decorated class with an auto-incrementing type id
// via compile-time emission. The runtime phase then exposes it.

decorator type_id(target) {
    compile {
        // Count how many times this decorator has fired — compile-time counter
        // (shared across decoration sites in the same compilation)
        // Note: state across sites requires external file or global counter pattern.
        let id = next_type_id(); // compile-time helper (global counter)
        // Inject a static field onto the target class
        emit(`extend ${target.name} { static const TYPE_ID: u32 = ${id}u32; }`);
        // Also emit a runtime registration call
        emit(`register_type("${target.name}", ${id});`);
    }
    runtime {
        return call.proceed();
    }
}

@type_id
class User { name: string, age: u32 }

@type_id
class Post { title: string }

print(User.TYPE_ID); // 0 — injected
print(Post.TYPE_ID); // 1 — injected
// The compile phases emitted both extend blocks and registration calls before typecheck ran.
```

Emitted `extend` uses the `StmtKind::Extend` form (`ast.rs:637-638`), which is why `emit` can target classes as well as functions.

### Example 3 — `emit` phase for backend/IR mutation (directive emission)

```adesh
// Advanced: use the emit phase to attach backend directives that string emission cannot express.
// This is rarely needed in application code; it shows the split between compile.emit vs. emit{}.

decorator inline(target) {
    compile {
        // Optional: guard with typecheck-friendly condition
        require target.params.len() < 5, "inline only for small functions";
    }
    emit {
        // Backend hook — conceptually:
        // - mark the LIR node for target as #[inline(always)]
        // - or insert a custom calling convention attribute
        // Actual IR API is backend-specific; represented here as pseudo-directive:
        directive("inline", target, "always");
        // Unlike compile's string emit, this mutates the already-typed IR node.
    }
    runtime {
        // Inline is a codegen hint — runtime wrapping is still possible but
        // the emitted hint may cause the backend to inline the wrapper itself.
        return call.proceed();
    }
}

@inline
fn hot(x: i32): i32 { return x * x + 1; }

print(hot(10)); // 101 — with inline hint applied at LIR level
// Contrast with compile's string emit:
// compile { emit("fn hot(...) { ... }") } replaces source;
// emit { directive(...) } mutates IR after type checking.
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let emit = 1` | `unexpected token 'emit', expected identifier` | `TokenKind::Emit` is reserved (`lexer.rs:1019`) |
| **Parse** | `emit;` (no expr/block) | `Expect expression or '{' after 'emit'` | Write `emit "code";` or `emit { stmts }` |
| **Parse** | `emit x is T` | `unexpected 'is' after 'emit'` | `is` belongs to `typecheck`; `emit` takes an expression |
| **Semantic** | `emit "..."` outside `compile`/`emit` phase | `emit is only valid inside compile or emit phase` | Move `emit` into `compile {}` or `emit {}` |
| **Semantic** | `call.proceed()` inside `emit` | `proceed is only valid inside runtime phase` | Delegation is runtime-only |
| **Compile-time** | `emit(expr)` where `expr` is not string/template | `emit expects a string or template, found '<type>'` | Use `` `...` `` templates or explicit `to_string()` |
| **Type** | Emitted source has type error | `TypeError in emitted code at <decoration site>: ...` + span of emission | Fix the emitted string; use interpolated qualified names |
| **Phase order** | `emit` phase tries to see runtime values | `value not available at emit time` | IR-phase code sees IR handles, not `Value`s |
| **Hygiene** | `emit("let x=1;")` shadows existing `x` | No error — shadowing is allowed, but may confuse | Qualify as `__gen_${target.name}_x` |

**Common pitfall — confusing `compile { emit }` with `emit {}`:**

```adesh
decorator a(target) {
    compile { emit(`let A = 1;`); } // A becomes a runtime binding via AST injection
    // vs.
    emit { directive("hint", target); } // mutates IR — no new binding A
}

compile { emit("let B = 1;"); } // B exists at runtime
emit { directive("hint", some_fn); } // error outside decorator — emit phase only exists there
```

Prefer **string `emit` in `compile`** for generating declarations; reserve **`emit {}` phase** for backend/IR directives that have no source-level syntax.

---

## See Also

- [compile](./compile) — `TokenKind::Compile` block where string `emit` is legal
- [decorator](./decorator) — defining `emit {}` backend phase (`src/parsing/ast.rs:707-718`)
- [typecheck](./typecheck) — `TokenKind::Typecheck` phase that runs after compile `emit` rebuild
- [runtime](./runtime) — `TokenKind::Runtime` / `call.proceed()` (never inside `emit`)
- [require](./require) — `TokenKind::Require` preconditions guarding emission
- [raw](./raw) — `TokenKind::Raw` contiguous buffers vs. emitted constants
- `src/parsing/lexer.rs:1019`, `src/parsing/ast.rs:707-738`, `src/parsing/decorator_compile.rs`, `src/parsing/hir_lower.rs`
