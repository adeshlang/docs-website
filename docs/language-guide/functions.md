---
id: functions
title: Functions and Callables
description: Complete reference for function declarations, parameters, return semantics, closures, higher-order functions, async calls, and runtime behavior in AdeshLang.
sidebar_label: Functions
---

# Functions and Callables

Functions are one of the core concepts in AdeshLang. They are not just syntax sugar for one-off code blocks — they are first-class values that can be assigned, passed around, returned, and composed.

This makes AdeshLang usable both as a straightforward scripting language and as a structured language for reusable code, libraries, and complex application logic.

---

## Function declaration syntax

The most common form is:

```adesh
fn name(param1: Type1, param2: Type2): ReturnType {
    // body
    return value;
}
```

### Minimal example

```adesh
fn greet(name: string): string {
    return "Hello, " + name + "!";
}

let message = greet("Alice");
print(message);
```

This pattern is the standard approach for writing reusable logic in AdeshLang.

---

## Parameter semantics

### Required parameters

```adesh
fn multiply(x: i64, y: i64): i64 {
    return x * y;
}

print(multiply(4, 5));
```

### Typed and untyped parameters

```adesh
fn add(a: i64, b: i64): i64 {
    return a + b;
}

fn add_loose(a, b) {
    return a + b;
}
```

The first function is explicit and self-documenting. The second relies on inference or dynamic-style flexibility. In practice, typed parameters are better for API clarity and compiler validation.

### Default parameter values

```adesh
fn pow(base: i64, exponent: i64 = 2): i64 {
    let result = 1;
    let i = 0;

    while i < exponent {
        result = result * base;
        i = i + 1;
    }

    return result;
}

print(pow(3));      // 9
print(pow(3, 3));   // 27
```

The value after `=` is used when the caller omits that argument.

---

## Return values

A function can return a value explicitly with `return`.

```adesh
fn factorial(n: i64): i64 {
    if n <= 1 {
        return 1;
    }

    return n * factorial(n - 1);
}
```

### Early returns

Early return is useful when a function should terminate at a specific condition:

```adesh
fn find_positive(numbers: [i64]): i64 {
    for num in numbers {
        if num > 0 {
            return num;
        }
    }

    return 0;
}
```

### Expression-bodied behavior

Some languages support the final expression as an implicit return. AdeshLang follows a clear, explicit pattern where `return` is still the common choice for readability and predictability. This keeps semantics easy to reason about in larger codebases.

---

## Function calls and evaluation

A function call looks like normal invocation syntax:

```adesh
let result = add(10, 20);
print(result);
```

Function calls are expressions, so they can be nested into larger expressions:

```adesh
print(add(2, 3) * 10);
```

This matches the general idea that code should compose naturally instead of requiring awkward wrapper statements.

---

## Anonymous functions and lambda expressions

AdeshLang supports function values directly.

```adesh
let inc = fn(x) {
    return x + 1;
};

let square = x => x * x;

print(inc(10));
print(square(8));
```

### Why this matters

Anonymous functions give you a way to define behavior inline and pass it around as data.

This is especially useful in:

- list transformation
- filters and reducers
- callbacks
- closures
- asynchronous processing

---

## Closures

Functions can capture values from the surrounding scope.

```adesh
fn make_adder(base: i64): fn(i64): i64 {
    return fn(x: i64): i64 {
        return x + base;
    };
}

let add10 = make_adder(10);
print(add10(5));
print(add10(20));
```

Here, the returned function closes over `base` even after `make_adder` has finished executing. That is one of the major reasons function values are so useful in real-world application design.

---

## Higher-order functions

AdeshLang is designed to work naturally with list-oriented functional patterns.

```adesh
let xs = [1, 2, 3, 4, 5];

let evens = filter(xs, fn(x) { return x % 2 == 0; });
let doubled = map(evens, fn(x) { return x * 2; });
let sum = reduce(doubled, fn(a, b) { return a + b; }, 0);

print(evens);
print(doubled);
print(sum);
```

### Typical higher-order usage patterns

- `map` to transform each item
- `filter` to keep elements matching a predicate
- `reduce` to combine items into a single result
- custom callback functions for iteration and pipelines

This is an important part of AdeshLang’s usability in data processing and scripting tasks.

---

## Recursion

Recursion is supported as long as the function terminates correctly.

```adesh
fn factorial(n: i64): i64 {
    if n <= 1 {
        return 1;
    }

    return n * factorial(n - 1);
}

print(factorial(5));
```

Recursion is commonly used for tree traversal, mathematical definitions, and divide-and-conquer algorithms.

---

## Async functions

AdeshLang supports asynchronous function patterns with `async fn` and `await`.

```adesh
async fn delayed_log(msg: string) {
    await sleep(100);
    print(msg);
}
```

### Behavior

- `async fn` marks a function as asynchronous
- `await` pauses execution until the awaited task resolves
- async code is useful for timers, I/O, and concurrency-oriented workflows

This allows AdeshLang to support non-blocking design without requiring a completely different programming style.

---

## API-style reference

| Construct | Example | Purpose |
|---|---|---|
| Named function | `fn add(a, b) { ... }` | Reusable block of logic |
| Typed function | `fn add(a: i64, b: i64): i64` | Stronger API contracts |
| Default parameter | `fn pow(base, exp = 2)` | Optional call arguments |
| Anonymous function | `let f = fn(x) { ... }` | Inline callable value |
| Arrow function | `let square = x => x * x` | Shorter function literal |
| Closure | `fn make_adder(base) { return fn(x) { ... } }` | Captures outer state |
| Recursive function | `fn fact(n) { ... }` | Self-referential logic |
| Async function | `async fn load()` | Non-blocking execution |

---

## Best practices

- prefer typed parameters for public APIs
- keep functions short and focused
- use `return` consistently for clarity
- prefer named functions for reusable logic
- use closures for callbacks and scoped behavior
- avoid deep recursion when iterative logic is clearer

---

## Related examples and source references

### Examples

- `examples/functions/01_basic_functions.adesh`
- `examples/functions/02_higher_order.adesh`
- `examples/functions/nested_functions.adesh`

### Source concepts

The runtime and compiler support for functions is represented across the language implementation, including parsing and execution logic in the project source tree, especially around the compiler frontend and runtime evaluator.

For reference, inspect the project sources under:

- `src/main.rs`
- `src/runtime/`
- `src/frontend/`
- `src/stdlib/`

This gives you a direct path from the language reference to the actual implementation and examples.

---

## Summary

Functions are the main abstraction mechanism in AdeshLang. They support:

- clear modularity
- reusable logic
- data transformation
- higher-order programming
- asynchronous behavior
- closure-based state management

Once you understand functions, most of the rest of the language becomes easier to reason about because it builds on the same compositional model.

