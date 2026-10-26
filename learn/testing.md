---
id: testing
title: Testing - Assertions and test functions
sidebar_label: 22. Testing
---

# Testing — Assertions and `test` Functions

Real code needs proof it works — forever. Adesh has a built-in testing
system: `test fn` blocks with `assert`, `assert_eq`, and `assert_ne`, run
with the `--test` flag. The authoritative examples are in
[`examples/testing/`](https://github.com/adeshlang/adeshlang/tree/main/examples/testing).

## A first test

```adesh
test fn test_true() {
    assert(true);
}
```

Run with:

```bash
adesh run --test 01_basic_tests.adesh
```

**Output:**
```
testing: test_true ... passed (1/1)
All tests passed.
```

## Assertions: the four tools

```adesh
test fn test_basics() {
    assert(5 > 3);                 // must be true, or the test fails
    assert_eq(2 + 2, 4);           // left == right
    assert_ne("Adesh", "Python");  // left != right
    assert(100 > 0, "Value must be positive");  // with a custom message
}
```

If `assert` fails, the test reports the file, line, and your message.

## Testing arithmetic and logic

This is verbatim from
[`examples/testing/01_basic_tests.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/testing/01_basic_tests.adesh):

```adesh
test fn test_arithmetic() {
    assert_eq(2 + 2, 4);
    assert_eq(10 - 5, 5);
    assert_eq(3 * 4, 12);
    assert_eq(15 / 3, 5);
}

test fn test_booleans() {
    assert(true or false);
    assert(true and true);
    assert_eq(false or false, false);
}

test fn test_variables() {
    let x = 42;
    let y = 42;
    assert_eq(x, y);
    assert_ne(10, 20);
}
```

**Output:**
```
testing: test_arithmetic ... passed (1/3)
testing: test_booleans ... passed (2/3)
testing: test_variables ... passed (3/3)
All tests passed.
```

## Testing your own functions

Most of your tests will call functions you wrote. Here's a realistic test
suite for a task manager's validation logic:

```adesh
fn isValidPriority(p) {
    return p == "low" || p == "medium" || p == "high";
}

test fn test_priorities() {
    assert(isValidPriority("low"));
    assert(isValidPriority("high"));
    assert(!isValidPriority("urgent"));
}

test fn test_task_title_required() {
    let args = [];
    // In the real CLI, this would print an error instead of crashing
    assert_eq(len(args), 0);
}
```

**Output:**
```
testing: test_priorities ... passed (1/2)
testing: test_task_title_required ... passed (2/2)
All tests passed.
```

## Selecting one test

When a suite grows, run a single test by name (see
[`examples/testing/05_single_test_selection.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/testing/05_single_test_selection.adesh)):

```bash
adesh run --test --name test_booleans 01_basic_tests.adesh
```

**Output:**
```
testing: test_booleans ... passed (1/1)
All tests passed.
```

## Test blocks

[`examples/testing/06_test_blocks.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/testing/06_test_blocks.adesh)
shows grouping several checks in one named block:

```adesh
test "array operations" {
    let arr = [1, 2, 3];
    assert_eq(arr.length, 3);
    arr.push(4);
    assert_eq(arr.length, 4);
    assert_eq(arr[0], 1);
}
```

**Output:**
```
testing: array operations ... passed (1/1)
All tests passed.
```

## The full testing workflow

```text
write test fn → run adesh run --test file.adesh → fix failures → repeat
```

A failing test looks like:

```text
testing: test_arithmetic ... FAILED
  assertion `assert_eq(2 + 2, 5)` failed at 01_basic_tests.adesh:3
Expected: 5
Actual:   4
1 test failed.
```

## Practice

Write tests for a `fib_dp` implementation:

```adesh
fn fib_dp(n) {
    if n <= 1 { return n; }
    let prev = 0, curr = 1, i = 2;
    while (i <= n) {
        let next = prev + curr;
        prev = curr;
        curr = next;
        i = i + 1;
    }
    return curr;
}

test fn test_fib_known_values() {
    assert_eq(fib_dp(0), 0);
    assert_eq(fib_dp(1), 1);
    assert_eq(fib_dp(10), 55);
    assert_eq(fib_dp(30), 832040);
}

test fn test_fib_matches_naive() {
    assert_eq(fib_dp(10), fib_dp(9) + fib_dp(8));
}
```

**Output:**
```
testing: test_fib_known_values ... passed (1/2)
testing: test_fib_matches_naive ... passed (2/2)
All tests passed.
```

## Summary

✅ **You learned:**
- `test fn name() { ... }` declares a test
- `assert(condition)` / `assert(condition, "message")`
- `assert_eq(a, b)` and `assert_ne(a, b)`
- Run with `adesh run --test file.adesh`
- Select one test with `--name`
- Named `test "block name" { }` groups

## Next Step

Now the tour of everything Adesh ships — the **Standard Library**. Start
with the tour of Math, JSON, FS, Regex, Time, Random, and Crypto.
Continue to **[Standard Library Tour](/learn/stdlib-tour)** →
