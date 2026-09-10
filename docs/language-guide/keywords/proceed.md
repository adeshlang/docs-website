---
id: proceed
title: proceed — Decorator Continuation
sidebar_label: proceed
description: The `proceed` keyword — call.proceed() continuation inside decorator runtime phase. Syntax, compilation, examples, errors.
---

# `proceed`

`proceed` is the **decorator continuation** keyword. Inside a decorator's `runtime(call)` phase, `call.proceed()` invokes the wrapped original function and returns its result. It is lexed as `TokenKind::Proceed` (`src/parsing/lexer.rs:1021`), described in `src/parsing/ast.rs:2077` as `Proceed — call.proceed() in runtime phase`, and implemented via native closure capture in `src/execution/runtime_core/interpreter_core.rs:6748,6913`.

:::note Reserved outside decorators
`proceed` is a reserved keyword everywhere (like `return`), but the only legal production use is `call.proceed()` inside a decorator `runtime` block. Using it elsewhere is a semantic error.
:::

## Syntax

```ebnf
DecoratorDecl ::= "decorator" IDENT [ "(" ParamList ")" ] "{" Phase* "}"
Phase         ::= "typecheck" "(" IDENT ")" "{" Block "}"
                | "compile"   "(" IDENT ")" "{" Block "}"
                | "runtime"   "(" IDENT ")" "{" Statement* "}"
CallProceed   ::= IDENT "." "proceed" "(" [ ArgList ] ")"   (* typically `call.proceed()` *)
```

`call` is the parameter name of the `runtime(call)` phase — the runtime dispatch object. Its `.proceed` property is injected by the interpreter as a captured native function.

## Runtime Object Shape

When the decorator pipeline invokes a `runtime` phase, the interpreter synthesizes a call object:

```rust
// src/execution/runtime_core/interpreter_core.rs:6748-6791 (simplified)
let proceed_fn = Value::Function(NativeFn(|_args| target_callable.call(args)));
call_map.insert("proceed", proceed_fn);   // call.proceed
call_map.insert("args", args_value);
call_map.insert("fn_name", fn_name);
call_map.insert("target", target_value);
```

* `call.proceed(args)` — forwards to the *next* stage or ultimately the target function. If the target is not callable, the runtime traps: `decorator proceed: target is not callable`.
* The return value of `call.proceed()` is whatever the target returned, which the decorator may inspect, mutate, or suppress.

## Examples

### 1 — Minimal Decorator with `proceed`

```adesh
decorator audit_trail(level: string) {
    typecheck(func) {
        if func.return_type == "void" {
            error("audit_trail requires a return value");
        }
    }
    compile(func) {
        func.inject_attribute("security_level", level);
    }
    runtime(call) {
        print(f"[AUDIT {level}] entering {call.fn_name}");
        let result = call.proceed();               // ← continuation
        print(f"[AUDIT {level}] returned {result}");
        return result;
    }
}

@audit_trail("CRITICAL")
fn transfer_funds(from: string, to: string, amount: f64): bool {
    print(f"Transferring ${amount} from {from} to {to}");
    return true;
}

transfer_funds("alice", "bob", 100.0);
// [AUDIT CRITICAL] entering transfer_funds
// Transferring $100 from alice to bob
// [AUDIT CRITICAL] returned true
```

### 2 — Conditional Proceed (guard)

```adesh
decorator require_auth(role: string) {
    runtime(call) {
        if current_user.role != role {
            throw "unauthorized: need " + role;
        }
        return call.proceed();   // only behind guard
    }
}

decorator cache(ttl: int) {
    runtime(call) {
        let key = call.fn_name + ":" + call.args.to_string();
        if cache.has(key) {
            return cache.get(key);  // short-circuit: no proceed
        }
        let result = call.proceed();
        cache.set(key, result, ttl);
        return result;
    }
}

@require_auth("admin")
@cache(60)
fn get_profile(id: string): Profile {
    return db.fetch(id);
}
```

### 3 — Error Wrapping Around `proceed`

```adesh
decorator retry(times: int) {
    runtime(call) {
        let attempt = 0;
        while attempt < times {
            try {
                return call.proceed();
            } catch e {
                attempt += 1;
                if attempt >= times { throw e; }
                print(f"retry {attempt}/{times}: {e}");
            }
        }
    }
}
```

### 4 — Simplified `proceed` Pattern (pipeline fusion)

Multiple decorators fuse at bytecode level (`CallDecorated` opcode `15`, `pipeline_index` + `fn_index`, O(1) dispatch — `advanced/decorators.md: §4`). `proceed` is the *logical* boundary even after fusion:

```
Caller → [Fused: auth + rate_limit + cache + timer] → Target
             each inner `call.proceed()` is a hop inside the fused stage
```

## `proceed` vs Similar Keywords

| Keyword | Where | Purpose |
|---------|-------|---------|
| `proceed` | `runtime(call)` only | forwards to next decorator / target |
| `super` | class constructors/methods | delegates to parent `extends` |
| `return` | any function | returns from current function |
| `call(...)` | decorator concise form | alternate wrapper: `fn(...args) => target(...args)` |

The **concise runtime** decorator form (`decorator log_calls(target, meta) { return fn(...args){ target(...args) } }`) does **not** use `proceed` — it returns a wrapper fn directly. Use `proceed` only in the full `runtime(call)` form.

## Restrictions & Errors

* `call.proceed()` **outside** `runtime` → semantic error `proceed is only valid inside decorator runtime phase`.
* `call.proceed()` with non-callable `target` → runtime error `decorator proceed: target is not callable` (`interpreter_core.rs:6783,6937`).
* `proceed` cannot be used as an identifier — `let proceed = 1` is a parse error (keyword).
* Async gap: `@pure` and `async` are incompatible; `proceed` itself is synchronous — the surrounding `runtime` block is not `async`.

## See Also

* [`decorator`](./decorator) — decorator declaration
* [`compile`](./compile) / [`runtime`](./runtime) / [`typecheck`](./typecheck) — decorator phases
* [Decorators & Metaprogramming](../../advanced/decorators) — pipeline, fusion optimizer, builtins like `@pure`, `@memoize`, `@inline`
* `examples/decorators/decorator_pipeline_demo.adesh` — runnable `call.proceed()` pipeline
* `src/execution/runtime_core/interpreter_core.rs:6748,6913` — native injection of `proceed`
