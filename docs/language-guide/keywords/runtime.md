---
id: runtime
title: runtime
sidebar_label: runtime
description: The runtime keyword — the runtime phase inside decorators and the runtime{} evaluation marker. Code in runtime{} wraps calls and may delegate with call.proceed().
---

# `runtime`

`runtime` marks code that executes **when the decorated program runs**, not at build time. It is the **interception phase** of the decorator pipeline: `runtime { ... }` wraps every invocation of the decorated function/type and may inspect arguments, short-circuit, or delegate to the original via `call.proceed()` (`TokenKind::Proceed`). Outside decorators, a standalone `runtime { ... }` block makes explicit that its body must not be constant-folded.

> **Ground truth:** Lexer `TokenKind::Runtime` (`src/parsing/lexer.rs:1017`, keyword `"runtime"`), AST `DecoratorPhase::Runtime(Arc<Vec<Stmt>>)` (`src/parsing/ast.rs:702-704`), `TokenKind::Proceed` (`lexer.rs:1021`, `ast.rs:2077`), `StmtKind::Decorator` + `DecoratorDef::phases` (`ast.rs:711-718`), pipeline `DecoratorPipelineStage` (`ast.rs:720-728`).

---

## Syntax

```text
runtime_block   ::= "runtime" "{" stmt* "}"
decorator_body  ::= "decorator" ident "(" params ")" "{" phase* "}"
phase           ::= "compile" "{" stmt* "}"
                  | "runtime" "{" stmt* "}"
                  | "typecheck" "{" stmt* "}"
                  | "emit" "{" stmt* "}"
proceed_call    ::= "call" "." "proceed" "(" args? ")"
```

`runtime` is reserved (`TokenKind::Runtime`). Inside a `runtime` phase, the implicit bindings `call`, `target`, and `args` are in scope; `call.proceed()` is only legal there.

### Minimal decorator with runtime phase

```adesh
decorator logged(target) {
    runtime {
        print("enter " + target.name);
        let result = call.proceed(); // invokes the original function
        print("exit");
        return result;
    }
}

@logged
fn add(a: i32, b: i32): i32 { return a + b; }
```

### Standalone marker (rare)

```adesh
runtime {
    // Explicitly runtime-evaluated even inside a compile-heavy file.
    print("evaluated when the program runs");
}
```

---

## Semantics

### Compilation model — where `runtime` sits in the pipeline

```
Source ──► Lex(Runtime) ──► Parse(DecoratorPhase::Runtime) ──► HIR build
                                                        │
                                         ┌──────────────┼──────────────┐
                                         │              │              │
                                     compile{}      typecheck{}     runtime{} (captured, not executed)
                                     executed        checked          │
                                         └──────────────┼──────────────┘
                                                        ▼
                                                  DecoratorPipeline per fn
                                                  ┌─────────────────────┐
                                                  │ PipelineStage {     │
                                                  │  phase: Runtime,    │
                                                  │  args: Vec<Expr>   │
                                                  │ } ordered by        │
                                                  │ definition order    │
                                                  └─────────────────────┘
                                                        │
                                                        ▼
                                                   Call site wrapper
                                                   call.proceed() chain
```

1. **Lex/Parse** — `runtime { ... }` is captured as `DecoratorPhase::Runtime(Arc<Vec<Stmt>>)` and stored in `DecoratorDef.phases`.
2. **Pipeline construction** (`src/parsing/decorator_pipeline.rs`) — for each decorated `Function`, a `DecoratorPipeline { fn_id, stages: Vec<DecoratorPipelineStage>, pipeline_hash }` is built. Each `@decorator` / `@decorator(args)` pushes a `DecoratorPipelineStage { decorator_name, phase: Runtime(...), args }`.
3. **Lowering** — `DecoratorPipeline` is hashed (`pipeline_hash: u64`) for caching; the wrapper function is synthesized. `call.proceed()` lowers to a direct call to the next stage or the original body.
4. **Execution** — at call time, the outermost `runtime` runs first; `call.proceed()` dispatches inward. Omitting `proceed` short-circuits the chain (the original body never runs).

### Implicit bindings inside `runtime`

| Binding | Type | Description |
|---|---|---|
| `target` | `Function`/`ClassDecl` reference | The decorated declaration (name, params, decorators) |
| `call` | call-site object | `call.args: [Value]`, `call.proceed(*modified_args)` |
| `call.proceed` | `fn(*args): Return` | Delegates to next pipeline stage or original (`TokenKind: Proceed`) |

`call.proceed()` may be invoked **0 or 1 times** per `runtime` invocation. Calling it 0 times suppresses the original; calling it >1 times is a runtime `LangError`.

### `runtime` vs. other phases

| Phase | TokenKind | `call.proceed()` | Access to `Value` | Can `emit`? | Typical use |
|---|---|---|---|---|---|
| `compile` (`ast.rs:701`) | `Compile` | No | AST only | Yes | Inject fields/metadata |
| `typecheck` (`ast.rs:705`) | `Typecheck` | No | Types only | No | Type constraints |
| **`runtime`** | **`Runtime`** | **Yes** | **Full runtime values** | No | Logging, caching, retry |
| `emit` (`ast.rs:707`) | `Emit` | No | IR handles | Yes (IR) | Backend directive mutation |

### Ordering and stacking

Decorators stack: `@a @b fn f()` means `a`'s `runtime` wraps `b`'s `runtime` wraps `f`. `pipeline_hash` distinguishes order for caching. Within a single decorator, if multiple phases are present they execute in *pipeline* order: `typecheck` → `compile` → `runtime` (emit may interleave at lowering).

---

## Examples

### Example 1 — Logging and argument mutation with `call.proceed()`

```adesh
decorator logged(target) {
    compile {
        print("compile: decorating " + target.name + " with " + target.params.len() + " params");
    }
    runtime {
        print("enter " + target.name + " args=" + call.args);
        let start = now_ms();
        let result = call.proceed();          // invoke original (or next decorator)
        let elapsed = now_ms() - start;
        print("exit " + target.name + " -> " + result + " in " + elapsed + "ms");
        return result;
    }
}

@logged
fn multiply(a: i32, b: i32): i32 { return a * b; }

print(multiply(6, 7)); // enter multiply args=[6,7] → exit multiply -> 42 in 0ms → 42
```

`compile` printed at build time; `runtime` prints on every call. Removing `call.proceed()` would prevent `multiply`'s body from ever executing.

### Example 2 — Caching / memoization decorator (stacked runtime phases)

```adesh
decorator memoize(target) {
    compile {
        // Per-site cache table — compile-time fixed map injected via emit.
        emit(`let __cache_${target.name}: Map<string, any> = Map.new();`);
    }
    runtime {
        let key = call.args.map(x => x.to_string()).join(",");
        let cache = get_cache(target.name); // lookup emitted map via reflection
        if (cache.has(key)) {
            return cache.get(key); // short-circuit: don't call original
        }
        let value = call.proceed(); // cache miss — delegate
        cache.set(key, value);
        return value;
    }
}

decorator retry(attempts: i32) {
    runtime {
        let last_err: any = null;
        for i in 0..attempts {
            try { return call.proceed(); }
            catch e { last_err = e; print("retry " + (i+1) + "/" + attempts); }
        }
        throw last_err;
    }
}

@memoize
@retry(3)
fn fetch(url: string): string {
    // runtime wrappers nest: memoize(runtime(retry(runtime(fetch))))
    return http_get(url);
}

print(fetch("https://example.com")); // memoized after first success; retried on failure
```

Stacking order matters: `@memoize` outermost means retries happen inside the cache miss path only.

### Example 3 — Standalone `runtime{}` and interaction with `compile{}`

```adesh
// File with mixed compile-time and runtime work.
compile {
    const SEED: u64 = 0xDEADBEEFu64;
    const LOOKUP: [u8; 4] = [3u8, 1u8, 4u8, 1u8];
    emit(`const LOOKUP = [3u8, 1u8, 4u8, 1u8];`); // freeze for runtime
}

runtime {
    // Explicit marker: even though LOOKUP was built at compile time, this block
    // is guaranteed to re-evaluate at runtime (not folded away).
    let sum = 0;
    for v in LOOKUP { sum += v as i32; }
    print("runtime sum " + sum); // 9 — uses emitted LOOKUP
}

// Contrast:
fn dynamic(add: i32): i32 {
    runtime { return LOOKUP[0] as i32 + add; } // forced runtime
    // vs. compile { LOOKUP[0] } would have constant-folded before lowering
}

print(dynamic(10)); // 13
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let runtime = 1` | `unexpected token 'runtime', expected identifier` | `TokenKind::Runtime` is reserved (`lexer.rs:1017`) |
| **Parse** | `runtime;` or `runtime expr` | `Expect '{' after 'runtime'` | Always `runtime { ... }` with braces |
| **Semantic** | `call.proceed()` outside `runtime` | `proceed is only valid inside runtime phase` (`TokenKind::Proceed`) | Move call into `runtime {}`; other phases have no call-site |
| **Semantic** | `call.proceed()` called twice | `LangError: proceed already called for this invocation` | Guard with a flag; wrapper must delegate at most once |
| **Semantic** | `runtime` phase without `call.proceed()` that should return value | No error — valid short-circuit | `return` early or omit proceed to suppress original; ensure return type matches |
| **Type** | `call.proceed(bad_arity)` with wrong arity | `TypeError: proceed expects N args, found M` | Pass `call.args` or matching signature |
| **Pipeline** | Decorator applied but HIR not rebuilt | Stale `pipeline_hash` mismatch; wrapper not updated | Clean build after editing decorator phase list |
| **Async** | `await call.proceed()` where target is not async | `await is only valid in async function` | Mark wrapper `async` or avoid `await` |

**Common pitfall — forgetting `return` before `call.proceed()`:**

```adesh
decorator broken(target) {
    runtime {
        call.proceed(); // result discarded!
        // implicit return null — caller gets null instead of original return
    }
}
decorator fixed(target) {
    runtime { return call.proceed(); } // correct — forwards return value
}
```

---

## See Also

- [decorator](./decorator) — `TokenKind::Decorator`, defining `compile`/`runtime`/`typecheck`/`emit` phases (`src/parsing/ast.rs:701-718`)
- [compile](./compile) — `TokenKind::Compile` compile-time AST transformation
- [typecheck](./typecheck) — `TokenKind::Typecheck` type-constraint phase (runs before `runtime`)
- [emit](./emit) — `TokenKind::Emit` IR/backend hooks
- [require](./require) — `TokenKind::Require` contract preconditions usable in any phase
- [jump](./jump) — `TokenKind::Jump` low-level transfer (rare; not a phase)
- `src/parsing/lexer.rs:1017,1021`, `src/parsing/ast.rs:699-737`, `src/parsing/decorator_pipeline.rs`, `src/parsing/decorator_registry.rs`
