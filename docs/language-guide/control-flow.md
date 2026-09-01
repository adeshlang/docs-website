---
id: control-flow
title: Control Flow and Decision Making
description: Detailed guide to conditionals, loop constructs, error-aware execution, and null/optional logic in AdeshLang.
sidebar_label: Control Flow
---

# Control Flow and Decision Making

Control flow is the logic that decides what a program does next. It includes conditionals, loops, iteration, error handling, and short-circuiting patterns for optional or null-safe values.

AdeshLang gives you a familiar set of control constructs, while also emphasizing safety and clarity.

---

## If / else branching

The most common branching pattern is:

```adesh
if condition {
    // run when condition is true
} elif other_condition {
    // run when the first check fails and this one succeeds
} else {
    // fallback block
}
```

### Example

```adesh
let x = 12;

if x > 10 {
    print("x is large");
} elif x == 10 {
    print("x is exactly 10");
} else {
    print("x is small");
}
```

### Notes

- conditions are evaluated as boolean expressions
- `elif` chains are supported
- blocks are delimited with braces

---

## While loops

A `while` loop continues until the condition becomes false.

```adesh
let i = 0;

while i < 5 {
    print(i);
    i = i + 1;
}
```

### Typical usage

Use `while` when:

- the loop depends on a condition that is not known ahead of time
- you are iterating until a value changes or a condition is met
- the number of iterations may vary at runtime

---

## Classic C-Style `for` Loops

AdeshLang supports classic 3-part `for (init; cond; post)` loops for index-driven iteration:

```adesh
// 1. Classic single-variable for loop
for (let i = 0; i < 5; i = i + 1) {
    print("i =", i);
}

// 2. Multi-variable initialization & iteration
for (let i = 0, j = 10; i < j; i = i + 1, j = j - 1) {
    print("i =", i, "j =", j);
}
```

### Loop Semantics & Performance
- **`init`**: Supports `let` declarations (`let i = 0` or `let i = 0, j = 10`), single/multi-variable assignments, or empty `;`. Initializer variables are scoped strictly to the loop.
- **`cond`**: Evaluated before each iteration. Defaults to `true` if omitted.
- **`post`**: Evaluated at the end of each iteration. When `continue` is called inside the loop body, the `post` step automatically executes before evaluating `cond`, preventing infinite loops.

---

## `do { ... } while (condition);` Loops

`do-while` loops guarantee that the loop body executes at least once before evaluating the condition:

```adesh
let count = 0;
do {
    count = count + 1;
    print("Iteration:", count);
} while (count < 3);
```

### Key Semantics
- **Minimum Iteration**: Always executes `body` on initial entry without checking `condition`.
- **`continue` Handling**: Invoking `continue` inside `do-while` jumps directly to evaluating `condition`. If true, the loop repeats; if false, execution exits cleanly.

---

## Collection Iteration & `forEach`

AdeshLang offers three distinct styles for iterating over collections:

### 1. `for..in` Collection Loop

```adesh
let items = ["apple", "banana", "cherry"];
for (item in items) {
    print(item);
}
```

### 2. Functional `arr.forEach(fn)` Method

Array instances provide a high-performance built-in `.forEach(fn)` method:

```adesh
let numbers = [10, 20, 30];
numbers.forEach(fn(num) {
    print("Value:", num);
});
```

### 3. Parallel `Parallel.forEach(start, end, fn)` Concurrency Loop

For CPU-intensive workloads, `Parallel.forEach` partitions index ranges across OS worker threads:

```adesh
import Parallel;

Parallel.forEach(0, 100, fn(i) {
    print("Parallel processing index:", i);
});
```


---

## Break and continue

These keywords help control loop execution precisely.

```adesh
let i = 0;

while i < 10 {
    i = i + 1;

    if i == 3 {
        continue;
    }

    if i == 7 {
        break;
    }

    print(i);
}
```

### `continue`

Skips the rest of the current loop body and continues with the next iteration.

### `break`

Stops the loop immediately.

This is especially useful for search logic, filtering, and early exit conditions.

---

## Ternary expressions

The ternary operator is a compact conditional expression.

```adesh
let cond = true;
let status = cond ? "yes" : "no";
print(status);
```

This is useful when you want a single expression that resolves to one of two values.

---

## Nullish coalescing

Use `??` to provide a fallback value when the left side is null.

```adesh
let maybe = null;
let value = maybe ?? 42;
print(value); // 42
```

This pattern is especially useful for configuration, optional user input, and safe default values.

---

## Optional chaining

Optional chaining is a safe way to read nested properties without crashing on null values.

```adesh
let obj = { user: { name: "Asha" } };
print(obj?.user?.name);

let other = null;
print(other?.user?.name); // null
```

### Why it matters

This prevents null-related runtime failures in code paths where a value may not exist yet.

---

## Error-aware control flow

AdeshLang supports exception-style control flow with `try` and `catch`.

```adesh
try {
    throw "boom";
} catch (e) {
    print("Caught:", e);
}
```

### Typical use cases

- file or I/O operations
- validation failures
- invalid input handling
- runtime guard logic

This pattern makes error handling explicit and structured rather than relying on silent failure.

---

## Switch-like patterns and matching

AdeshLang also supports pattern-oriented logic in a language-appropriate style, allowing values to be compared against several alternatives.

```adesh
match value {
    0 => print("zero"),
    1 => print("one"),
    _ => print("other")
}
```

This is useful when a value needs to branch across many cases in a readable structure.

---

## Control-flow API reference

| Construct | Syntax | Purpose |
|---|---|---|
| Branching | `if cond { ... } else { ... }` | Choose one path |
| Elif chain | `elif cond { ... }` | Multiple decision points |
| While loop | `while cond { ... }` | Repeat while condition remains true |
| For loop | `for item in collection { ... }` | Iterate over data |
| Range loop | `for i in 1..5 { ... }` | Counted iteration |
| Break | `break;` | Exit loop immediately |
| Continue | `continue;` | Skip remainder of loop body |
| Ternary | `cond ? a : b` | Compact two-way expression |
| Null coalescing | `a ?? b` | Use fallback for null |
| Optional chaining | `obj?.prop?.nested` | Safely access nested values |
| Try/catch | `try { ... } catch (e) { ... }` | Handle runtime failure |

---

## Best practices

- keep conditional blocks small and readable
- avoid deeply nested logic when a helper function would clarify intent
- use range loops when a bounded sequence is known
- use `continue` and `break` sparingly, but clearly
- handle optional values with `?.` and `??` rather than unsafe assumptions
- use `try/catch` for exceptional conditions, not routine branch logic

---

## Related examples and source references

### Examples

- `examples/operators/strict_equality.adesh`
- `examples/conditionals/elif.adesh`
- `examples/01_Basics/test.adesh`

### Source references

The language runtime and compiler implement control-flow semantics in the core frontend and execution engine. If you want to understand how these constructs are evaluated in practice, review the source directories related to parsing, runtime execution, and standard language features.

Relevant places include:

- `src/main.rs`
- `src/frontend/`
- `src/runtime/`
- `src/stdlib/`

This provides a direct bridge from language-level syntax to implementation behavior.

---

## Summary

Control flow is what makes programs actually behave intelligently. It is the mechanism by which code decides, loops, handles failure, and works through data in predictable ways.

The most important patterns to know are:

- if/else branches
- while and for loops
- early exits with `break` and `continue`
- null-safe access using `?.` and `??`
- structured failure handling with `try/catch`

These constructs are the foundation of nearly every real program you will write in AdeshLang.

