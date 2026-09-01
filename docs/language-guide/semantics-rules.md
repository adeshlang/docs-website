---
id: semantics-rules
title: Semantics and Rules
sidebar_label: Semantics and Rules
---

# Semantics and Rules

This page explains how AdeshLang behaves at runtime and which rules are important for writing predictable code.

## 1. Execution Model

AdeshLang supports multiple backends (interpreter, VM, JIT, native JIT, AOT, WASM). The language intent is consistent across backends: same source should produce the same result.

## 2. Values and Truthiness

Common falsy values in conditions:

- `false`
- `null`
- `0`

Everything else is treated as truthy in normal control flow.

```adesh
if 0 {
    print("not expected");
} else {
    print("0 is falsy");
}
```

## 3. Assignment and Mutation

- `let` declares a binding
- Re-assignment uses `=`
- Objects and arrays are mutable through property/index assignment

```adesh
let obj = { count: 1 };
obj.count = obj.count + 1;

let arr = [10, 20, 30];
arr[1] = 99;
```

## 4. Ownership and Compile-Time Safety

AdeshLang enforces compile-time memory safety checks before execution. Ownership and borrow-style constraints are validated before backend execution.

Practical effect:

- Unsafe patterns are rejected early
- Runtime behavior is more deterministic

## 5. Function Rules

- Functions are first-class values
- Closures capture values from outer scope
- `return` exits function immediately
- Parameter defaults are supported in many patterns

```adesh
fn add(a, b = 2) {
    return a + b;
}
```

## 6. Error and Exception Flow

Use `try`/`catch` for failure handling and `throw` to raise errors.

```adesh
try {
    throw "failure";
} catch (e) {
    print("caught", e);
}
```

## 7. Null Safety Helpers

AdeshLang provides concise null-safe operators:

- `??` nullish coalescing
- `?.` optional chaining

```adesh
let user = null;
let name = user?.profile?.name ?? "guest";
print(name);
```

## 8. Concurrency Semantics

Core async behavior:

- `Promise(...)`
- `sleep(ms)` and `delay(ms)`
- `setTimeout`, `setInterval`, clear variants
- channel and parallel helpers in concurrency examples

Some APIs are conceptually parallel but may run sequentially today for correctness and portability.

## 9. Practical Rules of Thumb

- Prefer clear expressions over dense one-liners
- Be explicit with numeric casts when crossing widths
- Use built-ins like `type`, `len`, `hasKey` for robust checks
- Test backend-sensitive logic in the backend you deploy

## 10. Related Pages

- [Language Basics](basics)
- [Type System](type-system)
- [Control Flow](control-flow)
- [Built-in Functions](../stdlib/builtins)
