---
id: decorator
title: decorator
sidebar_label: decorator
description: The decorator keyword — multi-phase metaprogramming declarations with compile, runtime, typecheck, and emit phases, plus the @name application form.
---

# `decorator`

`decorator` declares a **multi-phase metaprogramming transform** that can wrap, constrain, and generate code for any declaration it annotates. A `decorator` definition bundles up to four phases — `compile`, `typecheck`, `runtime`, `emit` — and is applied concisely with the `@name` symbol form. Decorators are the backbone of AdeshLang's compile-time metaprogramming.

> **Ground truth:** Lexer `TokenKind::Decorator` (`src/parsing/lexer.rs:1004`, keyword `"decorator"`), `TokenKind::At` (`lexer.rs:400`, `"@"`), `StmtKind::Decorator(DecoratorDef, bool)` (`src/parsing/ast.rs:687`), `DecoratorDef { name, params, phases, requires_unsafe, is_new_style }` (`ast.rs:711-718`), `DecoratorPhase::{Compile,Runtime,Typecheck,Emit}(Arc<Vec<Stmt>>)` (`ast.rs:698-708`), `DecoratorPipeline`/`DecoratorPipelineStage` (`ast.rs:720-736`), applied via `@decorator` / `@decorator(args)`.

---

## Syntax

```text
decorator_decl  ::= "decorator" ident "(" param_list? ")" decorator_body
decorator_body  ::= "{" phase* "}"
phase           ::= "compile"   "{" stmt* "}"
                  | "typecheck" "{" stmt* "}"
                  | "runtime"   "{" stmt* "}"
                  | "emit"      "{" stmt* "}"
param_list      ::= param ("," param)*
param           ::= ident (":" type)? ("=" expr)?

decorator_apply ::= "@" ident ("(" arg_list? ")")?
applied_decl    ::= decorator_apply+ ( "fn" ... | "class" ... | "struct" ... | "let" ... )
```

`decorator` is reserved (`TokenKind::Decorator`). `@` is a separate token (`TokenKind::At`) consumed by the parser's decorator-attachment loop (`src/parsing/parser/declarations.rs:111`).

### Defining a decorator — all four phases (rare)

```adesh
decorator audited(target) {
    compile   { emit(`target.__audited = true;`); }
    typecheck { require target.params.len() == 1, "audited expects single param"; }
    runtime   { print("audit: " + target.name); return call.proceed(); }
    emit      { directive("audit", target); }
}
```

Most decorators use one or two phases; four-phase decorators are compiler-plugin-like and uncommon.

### Applying a decorator

```adesh
@logged
@retry(3, 100)
fn fetch(url: string) -> string { return http_get(url); }

// Decorator with args is a Call-like syntax after @ — args captured as DecoratorPipelineStage.args
// Zero-arg form @logged and parameterized @retry(3) are both valid.
```

Parser loop: `while matchk(&[TokenKind::At]) { parse decorator name + optional (args) }` (`declarations.rs:111-127`), decorating the immediately following declaration.

---

## Semantics

### Compilation model — how decorators compile and attach

```
                    decorator decl                         applied declaration
Source ──► Lex ──► "decorator" ident(params) "{" phases "}" ──► @name fn f() { ... }
                TokenKind::Decorator                     TokenKind::At
                    │                                            │
                    ▼                                            ▼
             DecoratorDef {                                  DecoratorPipeline
               name, params,                               { fn_id, stages, pipeline_hash }
               phases: Vec<DecoratorPhase>                   stages: Vec<DecoratorPipelineStage>
               requires_unsafe,                                each = { decorator_name, phase, args }
               is_new_style                                  hash = fnv(phases + order)
             }  (stored in registry)                            │
                    │                                            │
                    └────────────────────┬───────────────────────┘
                                         ▼
                                HIR build + phase execution
                                ┌──────────────────────────────────────┐
                                │ 1. compile{} phases (in def order)   │
                                │    → AST mutation via emit            │
                                │ 2. HIR rebuild                        │
                                │ 3. typecheck{} phases                 │
                                │ 4. Lower → LIR → emit{} phases       │
                                │ 5. Synthesize runtime wrappers         │
                                │    call.proceed() chain                │
                                └──────────────────────────────────────┘
                                         │
                                         ▼
                                    Runtime calls
                                    @a @b fn f() means a(runtime(b(runtime(f))))
```

1. **Lex/Parse** — `decorator name(params) { ... }` → `DecoratorDef` with `phases: Vec<DecoratorPhase>` (`ast.rs:711`). Each phase body is `Arc<Vec<Stmt>>`.
2. **Registry** — `DecoratorDef` is stored in `decorator_registry.rs`; `requires_unsafe` is inferred if any phase contains `unsafe`.
3. **Application** — `@name` / `@name(args)` before a decl pushes `DecoratorPipelineStage { decorator_name, phase, args: Vec<Expr> }` (`ast.rs:722-727`). `@logged` (no parens) yields `args: []`; `@retry(3)` yields `args: [3]`. Order matters: `@a @b fn f()` → `[a_stage, b_stage, ...]` where `a` is **outermost** wrapper.
4. **Pipeline hash** — `DecoratorPipeline.pipeline_hash: u64` (`ast.rs:734-735`) caches compiled wrappers; changing phase order/args changes the hash.
5. **Phase execution** — see table below. After `compile{}` mutations, HIR is rebuilt before `typecheck{}`/`emit{}`/`runtime`.
6. **Runtime synthesis** — each `runtime{}` becomes a wrapper function; `call.proceed()` (`TokenKind::Proceed`) lowers to the next wrapper or the original body.

### Phase cheat-sheet

| Phase | TokenKind (`ast.rs:2072-2076`) | When | `call.proceed()` | `emit`? | Sees `call`? | Typical use |
|---|---|---|---|---|---|---|
| `compile` | `Compile` | compile, before typecheck | No | **Yes** (AST injection) | No | AST rewrite, metadata |
| `typecheck` | `Typecheck` | type resolution | No | No | No (sees `target`) | Type constraints |
| `runtime` | `Runtime` | per-call at runtime | **Yes** (`Proceed`) | No | **Yes** (`call.args`) | Logging, retry, cache |
| `emit` | `Emit` | LIR lowering | No | IR only | No | IR/backend directives |

A decorator may omit any phase; omitting `runtime` means the decorated declaration runs undecorated at call time (pure compile-time decorator).

### Arguments and `is_new_style`

- `decorator with_args(n: i32, label: string = "x") { ... }` — params behave like function params (with optional type and default, `ast.rs:713`).
- `@with_args(5)` / `@with_args(5, "hi")` — positional args matched to params; missing defaulted params use their defaults.
- `is_new_style: bool` (`DecoratorDef::is_new_style`) tracks whether the definition used the newer multi-phase block syntax vs. legacy single-body form.

### `unsafe` decorators

If any phase contains an `unsafe` block, `DecoratorDef.requires_unsafe` becomes `true` and decorating an `unsafe fn` without `unsafe` at the application site is an error (see `unsafe` keyword docs). This mirrors `Function.is_unsafe`.

### Stacking and composition

```adesh
@a @b @c fn f() {}
// Desugars to pipeline [a_stage, b_stage, c_stage]; call chain:
// a.runtime { call.proceed() → b.runtime { call.proceed() → c.runtime { call.proceed() → f } } }
```

`compile` phases all fire **before** any `runtime` wrapper synthesis, so `a`'s `compile` sees the pre-decoration AST; interleaving is not per-decorator round-robin.

---

## Examples

### Example 1 — Simple logging decorator (single `runtime` phase)

```adesh
// The most common shape: one runtime phase that wraps every call.

decorator logged(target) {
    runtime {
        let t0 = now_ms();
        print("→ " + target.name + "(" + call.args.join(", ") + ")");
        let result = call.proceed(); // delegate exactly once
        let dt = now_ms() - t0;
        print("← " + target.name + " = " + result + " (" + dt + "ms)");
        return result;
    }
}

@logged
fn add(a: i32, b: i32) -> i32 { return a + b; }

@logged
fn greet(name: string) -> string { return "hi " + name; }

print(add(2, 3));    // → add(2, 3) ← add = 5 (…ms) → 5
print(greet("Adesh")); // → greet(Adesh) … → greet = hi Adesh → hi Adesh

// Key rule: omit `return` before proceed and caller sees null.
// Fixed inside decorator: always `return call.proceed();` unless intentionally short-circuiting.
```

### Example 2 — Multi-phase decorator with args, validation, and emission

```adesh
// Caching decorator with compile-time emission (per-site cache), type checking, and runtime interception.

type Numeric = i32 | i64 | f64;

decorator memoize(target) {
    compile {
        // Validate shape at decoration site (AST phase)
        require target.params.len() == 1, "memoize expects single-arg function";
        // Emit a dedicated cache per decorated function — hygienic name includes target.name
        emit(`let __memo_${target.name}: Map<string, any> = Map.new();`);
    }
    typecheck {
        // Param should be hashable; return can be any — keep constraint light
        // Require that the single param is not void
        require target.params[0].type != "void", "memoize param must not be void";
    }
    runtime {
        let key = call.args[0].to_string(); // simplistic key; real impl handles objects
        let cache = lookup_memo_cache(target.name); // finds emitted __memo_<name>
        if (cache.has(key)) {
            print("cache hit for " + target.name + " key=" + key);
            return cache.get(key); // short-circuit: no proceed
        }
        let value = call.proceed(); // cache miss — compute
        cache.set(key, value);
        return value;
    }
}

decorator retry(n: i32) {
    compile   { require n > 0 && n <= 5, "retry attempts must be 1..5"; }
    typecheck { require n is i32; }
    runtime {
        let last: any = null;
        for i in 0..n {
            try { return call.proceed(); }
            catch e { last = e; print("retry " + (i + 1) + "/" + n + " failed: " + e); }
        }
        throw last;
    }
}

// Stacking: memoize outermost, retry inner — retries only happen on cache miss
@memoize
@retry(3)
fn expensive(n: i32) -> i32 {
    if (rand() < 0.4) { throw "transient failure"; }
    return n * n;
}

print(expensive(7)); // may retry, then caches
print(expensive(7)); // cache hit → no retry needed
print(expensive(8)); // new key → recompute with retry

// Decorator with arguments: retry's param n is bound from @retry(3)
// and visible as `n` inside compile/typecheck/runtime blocks
```

### Example 3 — Class decorator, `@` stacking order, and `emit` backend hint

```adesh
// Class decorator (target is a ClassDecl) and emit-phase IR hint.

decorator sealed(target) {
    typecheck {
        // Custom rule: sealed classes must not have subclass-ready methods
        require !target.is_abstract, "sealed class cannot also be abstract";
    }
    emit {
        // Backend hint: mark class as sealed for LIR/layout passes
        directive("sealed", target);
    }
    runtime {
        // Runtime guard: prevent extension via extend syntax check
        return call.proceed();
    }
}

decorator audited(target) {
    compile { emit(`target.__audited = true;`); } // stamp metadata
    runtime { print("audited creation of " + target.name); return call.proceed(); }
}

// Order matters: @sealed outer, @audited inner
@sealed
@audited
class Account {
    balance: f64,
    owner: string,
}

let a = Account { balance: 100.0, owner: "Adesh" };
print(a.__audited); // true — injected by audited's compile phase
// If order were @audited @sealed, the wrappers would nest oppositely:
// @audited outer → audited.runtime wraps sealed.runtime wraps Account construction
// Pipeline hash captures this: swapping order changes DecoratorPipeline.pipeline_hash

// Decorator on a struct field family via field decorator (if supported):
// @readonly  let x: i32 = 1;  // see readonly keyword — enforced by type system
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let decorator = 1` | `unexpected token 'decorator', expected identifier` | `TokenKind::Decorator` reserved (`lexer.rs:1004`) |
| **Parse** | `decorator` without name | `Expect identifier after 'decorator'` | `decorator <name>(...) { phases }` |
| **Parse** | `decorator name { }` with no phase | No error — valid empty decorator (no-op) | Add at least one phase if transform is intended |
| **Parse** | `@` with no ident | `Expect decorator name after '@'` | Write `@logged` or `@retry(3)` |
| **Parse** | Phase outside decorator `compile {}` at top level | Not a `decorator` — parsed as standalone compile block | Wrap multi-phase logic inside `decorator name(...) { ... }` |
| **Semantic** | `call.proceed()` outside `runtime` | `proceed is only valid inside runtime phase` (`TokenKind::Proceed`) | Move delegation to `runtime {}` |
| **Semantic** | `emit` outside `compile`/`emit` | `emit is only valid inside compile or emit phase` | Emit only inside those two phases |
| **Semantic** | `@unknown fn f()` unknown decorator | `unknown decorator 'unknown'` | Define `decorator unknown(...) { ... }` before use |
| **Semantic** | Arity mismatch `@retry()` with no args | `missing required argument 'n' for decorator 'retry'` | Provide `@retry(3)` matching `decorator retry(n: i32)` |
| **Pipeline** | Unsafe decorator on safe site | `decorator requires unsafe but site is not unsafe` (`DecoratorDef.requires_unsafe`) | Add `unsafe` to site or remove unsafe from decorator |
| **Type** | Decorator applied to unsupported decl | `decorator 'x' cannot be applied to <kind>` | Check `DecoratorDef` applicability (some restrict to fn/class) |
| **Hash** | Reordered `@a @b` vs `@b @a` | No error — different `pipeline_hash` | Intended: order defines wrapping; be deliberate |

**Common pitfall — forgetting that `@a @b` is outer→inner:**

```adesh
decorator a(target) { runtime { print("a before"); let r = call.proceed(); print("a after"); return r; } }
decorator b(target) { runtime { print("b before"); let r = call.proceed(); print("b after"); return r; } }

@a @b fn f() { print("f"); }

// Execution order on f(): a before → b before → f → b after → a after
// NOT b before → a before.  Outermost annotation is outermost wrapper.

@b @a fn g() { print("g"); } // g(): b before → a before → g → a after → b after
```

Use outermost position for the decorator that should see the **most-abstract** view (e.g., logging outside, caching inside).

---

## See Also

- [compile](./compile) — `TokenKind::Compile` / `DecoratorPhase::Compile`
- [runtime](./runtime) — `TokenKind::Runtime` / `call.proceed()` (`TokenKind::Proceed`)
- [typecheck](./typecheck) — `TokenKind::Typecheck` phase for decorator type constraints
- [emit](./emit) — `TokenKind::Emit` backend phase and string emission
- [require](./require) — `TokenKind::Require` contracts inside any phase
- [readonly](./readonly) — `TokenKind::Readonly` field modifier (often set via compile `emit`)
- [jump](./jump) — `TokenKind::Jump` low-level control flow (not a decorator phase)
- [Decorators](../../advanced/decorators) — high-level guide and additional patterns
- `src/parsing/lexer.rs:1004,1016-1021`, `src/parsing/ast.rs:687-737`, `src/parsing/decorator_registry.rs`, `src/parsing/decorator_pipeline.rs`, `src/parsing/decorator_compile.rs`
