---
id: higher-order-functions
title: Higher-Order Functions - Functions That Use Functions
sidebar_label: 7. Higher-Order Functions
---

# Higher-Order Functions — Functions That Use Functions

A **higher-order function** is a function that takes another function as a
parameter, returns a function, or both. This is one of AdeshLang's most
powerful tools — and the full tour lives in
[`examples/functions/02_higher_order.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/functions/02_higher_order.adesh).

## Functions as parameters (callbacks)

```adesh
fn apply_operation(a, b, operation: fn(i64, i64): i64): i64 {
    return operation(a, b);
}

fn add_nums(x, y) {
    return x + y;
}

fn multiply_nums(x, y) {
    return x * y;
}

print(apply_operation(10, 5, add_nums));       // 15
print(apply_operation(10, 5, multiply_nums));  // 50
```

**Output:**
```
15
50
```

Notice the type annotation `fn(i64, i64): i64` — it says "a function that takes
two integers and returns an integer". Passing the function *name* (no
parentheses) hands the function itself to `apply_operation`.

## Functions that return functions (factories)

```adesh
fn make_multiplier(factor) {
    return fn(x) {
        return x * factor;
    };
}

let times_two = make_multiplier(2);
let times_five = make_multiplier(5);

print(times_two(7));    // 14
print(times_five(7));   // 35
```

**Output:**
```
14
35
```

`times_two` and `times_five` are *custom-made* functions, each remembering its
own `factor`. That captured memory is called a **closure**.

## Function composition

Compose `f` and `g` into a new function that applies `g` first, then `f`:

```adesh
fn compose(f, g) {
    return fn(x) {
        return f(g(x));
    };
}

fn add_one(x) { return x + 1; }
fn double(x)  { return x * 2; }

let add_one_then_double = compose(double, add_one);
print(add_one_then_double(5));   // (5 + 1) * 2 = 12

let double_then_add_one = compose(add_one, double);
print(double_then_add_one(5));   // (5 * 2) + 1 = 11
```

**Output:**
```
12
11
```

## Predicates: functions that answer yes/no

```adesh
fn is_even(n) {
    return n % 2 == 0;
}

fn test_condition(value, predicate) {
    return predicate(value);
}

print(test_condition(10, is_even));   // true
print(test_condition(11, is_even));   // false
```

**Output:**
```
true
false
```

## Currying: build a function step by step

```adesh
fn curry_multiply(a) {
    return fn(b) {
        return fn(c) {
            return a * b * c;
        };
    };
}

let multiply_2 = curry_multiply(2);
let multiply_2_3 = multiply_2(3);
print(multiply_2_3(4));   // 2 * 3 * 4 = 24
```

**Output:**
```
24
```

## Stateful closures (functions with memory)

```adesh
fn make_counter() {
    let count = 0;
    return fn() {
        count = count + 1;
        return count;
    };
}

let counter1 = make_counter();
let counter2 = make_counter();

print(counter1());   // 1
print(counter1());   // 2
print(counter2());   // 1  (independent counter!)
print(counter1());   // 3
```

**Output:**
```
1
2
1
3
```

Each counter closes over its *own* `count` — they never interfere.

## Conditional execution

```adesh
fn execute_if(condition, action) {
    if condition {
        return action();
    }
    return 0;
}

fn get_value() {
    return 42;
}

print(execute_if(true, get_value));    // 42
print(execute_if(false, get_value));   // 0
```

**Output:**
```
42
0
```

## Array transformations (the real-world win)

AdeshLang array methods like `.map()`, `.filter()`, and `.reduce()` are higher-order methods — pass them callback functions to transform collections:

```adesh
let arr = [1, 2, 3, 4, 5, 6];

// 1. Transform elements with .map()
let doubled = arr.map(fn(x) { return x * 2; });
print("Doubled:", doubled);   // [2, 4, 6, 8, 10, 12]

// 2. Filter elements with .filter()
let evens = arr.filter(fn(x) { return x % 2 == 0; });
print("Evens:", evens);       // [2, 4, 6]

// 3. Accumulate elements with .reduce()
let sum = arr.reduce(fn(acc, x) { return acc + x; }, 0);
print("Sum:", sum);           // 21
```

**Output:**
```
Doubled: [2, 4, 6, 8, 10, 12]
Evens: [2, 4, 6]
Sum: 21
```

The same pattern powers [`Parallel.map`](/docs/builtin/concurrency) for multi-core CPU work.

## Practice

Write a higher-order function that **times** any function:

```adesh
fn timed(fnToRun) {
    let start = clock();
    let result = fnToRun();
    let elapsed = clock() - start;
    print("Took", elapsed, "seconds");
    return result;
}

let answer = timed(fn() {
    let total = 0;
    for i in 0..100000 {
        total = total + i;
    }
    return total;
});
print("Result:", answer);
```

**Output:**
```
Took 0.007312 seconds
Result: 4999950000
```

(Timing varies by machine — the result is what matters.)

## Summary

✅ **You learned:**
- Functions are values: pass them with their name, no `()`
- Callbacks, predicates, and transformers as parameters
- Factories and closures that remember captured state
- Function composition and currying
- `map` and friends are higher-order functions
- Stateful closures (counters, accumulators)

## Next Step

Some problems are naturally *self-referential* — now let's master
**recursion and multiple returns**. Continue to
**[Recursion & Multiple Returns](/learn/recursion)** →
