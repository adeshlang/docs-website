---
id: compile
title: compile
sidebar_label: compile
description: The compile keyword — compile-time evaluation block and the compile phase inside decorator definitions. Code in compile{} runs at compile time and may transform the AST.
---

# `compile`

`compile` is AdeshLang's **compile-time execution** primitive. A `compile { ... }` block runs **during compilation** (not at runtime) and its effects — new bindings, computed constants, or AST transformations — are baked into the generated program. It is both a standalone metaprogramming block and the **first phase** inside a `decorator` definition.

> **Ground truth:** Lexer `TokenKind::Compile` (`src/parsing/lexer.rs:1016`, keyword `"compile"` → `TokenKind::Compile` `lexer.rs:1016`, `ast.rs:2072`), AST `DecoratorPhase::Compile(Arc<Vec<Stmt>>)` (`src/parsing/ast.rs:698-708`), `DecoratorDef` (`ast.rs:711-718`) groups compile/runtime/typecheck/emit phases, statement `StmtKind::Decorator`.

---

## Syntax

```text
compile_block   ::= "compile" "{" stmt* "}"
decorator_phase ::= "compile" "{" stmt* "}"   // inside decorator body
compile_expr    ::= "compile" "{" expr "}"    // where block yields a value
```

`compile` is a **reserved keyword** (`TokenKind::Compile`). It may not be used as an identifier and is only valid as a leading block marker.

### Standalone compile block (module/top-level)

```adesh
compile {
    const TABLE: [u32] = build_lookup_table(); // executed once at build time
    // bindings introduced here are frozen into the artifact
}
```

### Compile phase inside a decorator

```adesh
decorator logged(target) {
    compile {
        // AST transform: inject a field, rename, or attach metadata
        // Runs once per decoration site at compile time
        print("decorating " + target.name);
    }
    runtime {
        call.proceed(); // actual wrapped call happens at runtime
    }
}
```

Parser expects `compile { ... }` exactly — no parentheses, no arguments, and braces are required. A bare `compile;` or `compile expr` without braces is a parse error.

---

## Semantics

### Compilation model — when `compile{}` runs

```
Source .adesh ──Lex(TokenKind::Compile)──► Parse ──► HIR ──► Decorator compile phase
                                   │                    │
                                   ▼                    ▼
                          compile{ } executed   AST mutated / constants folded
                                   │                    │
                                   └──────► Lower ► LIR ► Runtime
                                                                     runtime{ } not yet executed
```

1. **Lex** `compile` → `TokenKind::Compile` (keyword table `lexer.rs:1016`).
2. **Parse** — body is captured as `Vec<Stmt>` inside `DecoratorPhase::Compile(Arc<Vec<Stmt>>)` (`ast.rs:701`). Standalone blocks are evaluated by the compile-time interpreter before code generation.
3. **Evaluate** — compile-time interpreter executes the block with access to the compiler's AST and type table; `emit` and `require` may be called from within.
4. **Freeze** — values/bindings produced are serialized into the artifact; subsequent pipeline stages (typecheck/runtime/emit) see the mutated AST.
5. **Discard** — compile-phase locals do not exist at runtime (no retention) unless explicitly emitted.

### What is allowed inside `compile{}`

| Construct | Allowed? | Notes |
|---|---|---|
| `let/const` bindings | Yes | Become compile-time constants or injected declarations via `emit` |
| `emit "code"` / `emit {}` | Yes | Injected into surrounding scope at the decoration site |
| `require` assertions | Yes | Fail the build if a contract is violated |
| `if/match/for` | Yes | Evaluated at compile time; branches may call `emit` |
| `call.proceed()` | No | Only in `runtime` phase (`TokenKind::Proceed`) |
| `await/spawn` (async) | No | Async is a runtime effect; compile phase is synchronous |
| FFI / `unsafe` pointer ops | Restricted | Allowed with `requires_unsafe` on owning decorator (`DecoratorDef::requires_unsafe`) |

### `compile` vs. `runtime` vs. `typecheck` vs. `emit`

| Phase | TokenKind (`ast.rs:2072-2076`) | When | `call.proceed()` | Typical use |
|---|---|---|---|---|
| `compile` | `Compile` | compile time, before type checking | no | AST rewriting, metadata injection |
| `typecheck` | `Typecheck` | compile time, type-resolution | no | Custom type constraints |
| `runtime` | `Runtime` | at call time (wrapped function) | **yes** | Interception, logging, retry |
| `emit` | `Emit` | backend IR lowering | no | IR mutation, directive emission |

A decorator may declare any subset; phases execute in **definition order** except `typecheck` is always hoisted before `runtime` during pipeline build (`src/parsing/decorator_pipeline.rs`).

### Value semantics

`compile { expr }` as an expression evaluates to the block's final value **at compile time** and constant-folds:

```adesh
const N = compile { 40 + 2 }; // N is lexically 42; no runtime addition
```

If the block uses `emit`, its value is `null` — emission is a side-effect on the parent AST, not a value.

---

## Examples

### Example 1 — Precomputing a lookup table at compile time

```adesh
// Build a 256-entry CRC table once at build time — zero runtime cost.
compile {
    fn build_crc32_table(): [u32; 256] {
        let tbl: [u32; 256] = [0u32; 256];
        for i in 0..256 {
            let crc = i as u32;
            for _ in 0..8 {
                if (crc & 1) != 0 { crc = 0xEDB88320 ^ (crc >> 1); }
                else { crc >>= 1; }
            }
            tbl[i] = crc;
        }
        return tbl;
    }
    const CRC_TABLE: [u32; 256] = build_crc32_table();
}

// At runtime CRC_TABLE is a frozen constant — no initialization loop.
fn crc32(data: [u8]): u32 {
    let crc: u32 = 0xFFFFFFFF;
    for b in data { crc = CRC_TABLE[(crc ^ (b as u32)) & 0xFF] ^ (crc >> 8); }
    return ~crc;
}

print(crc32([104, 105])); // deterministic, table came from compile phase
```

### Example 2 — `compile` phase inside a decorator (AST metadata injection)

```adesh
// Decorator that records the decorated function's arity at compile time.
// The runtime phase then uses that metadata.

decorator arity_tag(target) {
    compile {
        // Runs once per decoration site, during compilation.
        let n = target.params.len();
        // Attach synthetic field; later read by runtime phase or reflection.
        emit(`target.__arity = ${n};`);
    }
    runtime {
        print("calling " + target.name + " with arity " + target.__arity);
        return call.proceed(); // proceed is only legal in runtime
    }
}

@arity_tag
fn add(a: i32, b: i32): i32 { return a + b; }

print(add(2, 3)); // calling add with arity 2 → 5
// The compile block injected target.__arity = 2 before typecheck saw the call site.
```

### Example 3 — Conditional emission and error handling with `require`

```adesh
decorator must_be_numeric(target) {
    compile {
        require target.params.length == 1, "must_be_numeric expects single-param function";
    }
    typecheck {
        // Validate the single param is numeric; fails build if not.
        if !(target.params[0].type is Numeric) {
            typecheck(target.params[0]) is Numeric; // explicit typecheck assert
        }
    }
    runtime {
        return call.proceed();
    }
}

@must_be_numeric
fn square(x: i32): i32 { return x * x; }  // ok

// @must_be_numeric
// fn bad(s: string): string { return s; } // typecheck phase error

// Standalone compile-time guard:
compile {
    require CRC_TABLE.len() == 256, "CRC table must be exactly 256 entries";
    emit(`const CRC_READY = true;`);
}
print(CRC_READY); // true — emitted by compile block
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let compile = 1` | `unexpected token 'compile', expected identifier` | `compile` is reserved `TokenKind::Compile` |
| **Parse** | `compile;` or `compile expr` without braces | `Expect '{' after 'compile'` | Always write `compile { ... }` |
| **Parse** | `compile()` with parens | `unexpected '(' after 'compile'` | Phases take no arguments — `compile { }` only |
| **Semantic** | `call.proceed()` inside `compile` | `proceed is only valid inside runtime phase` (`TokenKind::Proceed`) | Move interception logic to `runtime {}` |
| **Semantic** | `await`/`spawn` inside `compile` | `async effect not allowed in compile phase` | Compile evaluation is synchronous |
| **Type** | `require` condition false in compile | `CompileError: requirement failed: <msg>` | Fix the invariant or guard with `if` before `require` |
| **Phase order** | Using runtime value inside compile | `value not available at compile time` | Emit the value or compute it from AST/type info only |
| **Unsafe** | `unsafe { ptr[0] = 1 }` inside compile without `requires_unsafe` | `unsafe not allowed in compile phase of safe decorator` | Mark decorator `unsafe` or move mutation to `runtime` |

**Common pitfall — confusing `compile` with `const`:**

```adesh
const A = 42;              // compile-time constant, always inlined
compile { const B = 42; }  // B exists only if emitted; compile locals don't leak
// print(B); // error — B is not in runtime scope unless emit injected it
compile { emit(`const B = 42;`); }
print(B); // ok — emitted declaration is now a runtime binding
```

---

## See Also

- [decorator](./decorator) — `TokenKind::Decorator`, multi-phase `compile`/`runtime`/`typecheck`/`emit` definitions (`src/parsing/ast.rs:698-718`)
- [runtime](./runtime) — `TokenKind::Runtime` and `call.proceed()` interception (`ast.rs:703`)
- [typecheck](./typecheck) — `TokenKind::Typecheck` compile-time type assertions
- [emit](./emit) — `TokenKind::Emit` code generation hooks
- [require](./require) — `TokenKind::Require` preconditions inside compile phases
- [raw](./raw) — `TokenKind::Raw` / `Value::RawArray` vs. compile-time buffers
- [Memory & Safety](../../advanced/memory-safety) — arena `region` vs. compile-time allocation
- `src/parsing/lexer.rs:1016`, `src/parsing/ast.rs:698-738`, `src/parsing/decorator_pipeline.rs`, `src/parsing/decorator_compile.rs`
