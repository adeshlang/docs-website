---
id: test
title: test
sidebar_label: test
description: The `test` keyword declares a test.
---

# `test`

The `test` keyword declares a test: a named block of code that the test runner executes to verify behavior. Tests are excluded from normal builds and are collected by the testing tooling.

---

## Syntax & Example

```adesh
test "addition works" {
    let result = add(2, 3);
    assert result == 5;
}
```

---

## Use Cases

- Verifying functions and modules with runnable checks.
- Grouping assertions under a descriptive test name.
- Pairing with `ignore` and `expect_fail` to control test execution.

See also: [Testing](../../tools/testing).
