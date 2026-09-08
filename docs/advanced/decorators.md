---
id: decorators
title: Decorators & Metaprogramming
sidebar_label: Decorators
description: Compile-time and runtime metaprogramming in AdeshLang with multi-phase decorators and pipeline fusion.
---

# Decorators & Metaprogramming

AdeshLang features an advanced, zero-overhead **Decorator Pipeline System**. Decorators in AdeshLang extend beyond runtime function wrapping—they are full **multi-phase metaprogramming constructs** that execute across typechecking, compile-time AST transformation/metadata injection, and runtime execution.

```
┌─────────────────────────────────────────────────────────┐
│                    Decorator Phases                     │
├──────────────────┬──────────────────┬───────────────────┤
│    typecheck     │     compile      │      runtime      │
│  Validates AST & │ Injects metadata │ Wraps or replaces │
│   type contracts │ & optimizes AST  │  function call    │
└──────────────────┴──────────────────┴───────────────────┘
```

---

## 1. Built-in Decorators

AdeshLang provides several high-performance built-in decorators optimized directly by the compiler.

| Decorator | Target | Phase | Description |
|-----------|--------|-------|-------------|
| `@pure` | Functions | Compile-time | Enforces pure functional semantics: no side effects, no mutable captures, deterministic return value. Incompatible with `async`. |
| `@memoize` | Functions | Compile/Runtime | Automatically caches function return values based on hashable arguments. Zero-GC cache integration. |
| `@noalloc` | Functions | Compile-time | Verifies at compile time that the function performs zero heap allocations (guaranteed stack-only execution). |
| `@inline` | Functions | Compile-time | Hints the compiler/JIT backend to inline the function body at call sites. |
| `@deprecated(reason)` | Functions/Structs | Compile-time | Emits a compiler warning with the specified deprecation message when invoked. |
| `@log` | Functions | Runtime | Automatically logs function entry, parameters, exit, execution duration, and return values. |
| `@measure_time` | Functions | Runtime | Measures and reports wall-clock execution time with nanosecond precision. |
| `@sealed` | Classes/Structs | Compile-time | Prevents inheritance or trait implementation outside the defining module. |

### Example: Using Built-in Decorators

```adesh
// Enforce compile-time purity and automatic memoization
@pure
@memoize
fn fibonacci(n: i64) -> i64 {
    if n <= 1 {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Guarantee zero heap allocations for real-time safety
@noalloc
@inline
fn compute_vector_dot(a: [f32; 4], b: [f32; 4]) -> f32 {
    let sum: f32 = 0.0;
    for i in 0..4 {
        sum += a[i] * b[i];
    }
    return sum;
}

// Log execution metrics in development builds
@log
@measure_time
fn process_batch_records(records: [Record]) -> Result<i64, Error> {
    let count = records.len();
    // Process items...
    return Ok(count);
}
```

---

## 2. Multi-Phase Custom Decorators

Custom decorators can hook into three distinct compilation and execution lifecycle phases:

```adesh
decorator audit_trail(level: string) {
    // 1. Typecheck Phase: Validates arguments and return types at compile time
    typecheck(func) {
        if func.return_type == "void" {
            error("audit_trail requires functions that return an explicit status or value");
        }
    }

    // 2. Compile Phase: Injects compiler metadata or attributes
    compile(func) {
        func.inject_attribute("security_level", level);
    }

    // 3. Runtime Phase: Intercepts function execution
    runtime(call) {
        print(f"[AUDIT {level}] Entering {call.fn_name} with args: {call.args}");
        let result = call.proceed();
        print(f"[AUDIT {level}] {call.fn_name} returned: {result}");
        return result;
    }
}
```

### Applying Custom Decorators

```adesh
@audit_trail("CRITICAL")
fn transfer_funds(from_account: string, to_account: string, amount: f64) -> bool {
    print(f"Transferring ${amount} from {from_account} to {to_account}");
    return true;
}
```

---

## 3. Simplified Runtime Decorators

For standard runtime wrapper use cases, AdeshLang supports a concise syntax:

```adesh
decorator log_calls(target, meta) {
    return fn(...args) {
        print(f"Calling {meta.name} with {args.len()} arguments");
        let start = time::now_nanos();
        let result = target(...args);
        let elapsed = time::now_nanos() - start;
        print(f"{meta.name} finished in {elapsed}ns");
        return result;
    };
}

@log_calls
fn calculate_hash(data: string) -> string {
    return crypto::sha256(data);
}
```

---

## 4. Decorator Pipeline & Fusion Optimization

When multiple decorators are applied to a single function or class, AdeshLang builds a **Decorator Pipeline**:

```adesh
@auth("admin")
@rate_limit(100)
@cache(ttl = 60)
@measure_time
fn get_user_profile(user_id: string) -> UserProfile {
    // Fetch profile...
}
```

### How the Pipeline Optimizer Works:

1. **Phase Extraction**: The compiler extracts compile-time phases (`typecheck` and `compile`) from all decorators and executes them sequentially.
2. **Safety Depth Check**: The compiler validates pipeline recursion depth (with safety thresholds up to 10,000 decorators without recursion overflow).
3. **Stage Fusion**: The **Fusion Optimizer** (`can_fuse_stages`) analyzes adjacent runtime interceptors. Pure wrappers without side-effects are collapsed into a single consolidated stack frame:

```
Unoptimized Pipeline:
Caller -> [Auth Stage] -> [RateLimit Stage] -> [Cache Stage] -> [Timer Stage] -> Target Function

Optimized Fused Pipeline:
Caller -> [Fused Stage: Auth + RateLimit + Cache + Timer] -> Target Function
```

4. **Bytecode Generation**: Emits a specialized `CallDecorated` opcode (`opcode = 15`) with pre-computed pipeline registry index (`pipeline_index`) and target function index (`fn_index`) for $O(1)$ dispatch overhead.

---

## 5. Decorators on Structs and Classes

Decorators can also be applied to struct and class definitions to inject methods, validate invariants, or generate boilerplate:

```adesh
decorator data_class {
    compile(cls) {
        // Automatically inject equals, hash_code, and to_string methods
        cls.generate_equals();
        cls.generate_hash_code();
        cls.generate_to_string();
    }
}

@data_class
struct Customer {
    id: i64,
    name: string,
    email: string,
}
```

---

## 6. Best Practices

> [!TIP]
> - Use `@pure` whenever a function has no external side effects to unlock aggressive compiler optimizations and auto-vectorization.
> - Combine `@pure` with `@memoize` for expensive pure computations.
> - Use `@noalloc` in high-throughput hot loops, audio processing, or embedded/kernel routines to guarantee deterministic zero-allocation behavior.
> - Put security and authentication decorators first in the decorator chain.
