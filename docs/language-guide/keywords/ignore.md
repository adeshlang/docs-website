---
id: ignore
title: ignore
sidebar_label: ignore
description: The `ignore` keyword marks a test to be ignored.
---

# `ignore`

The `ignore` keyword marks a test so the test runner skips it. The test is still registered but not executed, which is useful for temporarily disabling flaky or in-progress tests without deleting them.

---

## Syntax & Example

```adesh
test "known flaky case" ignore {
    // skipped by the runner
}
```

---

## Use Cases

- Temporarily disabling tests that are known to fail or are in progress.
- Skipping platform-specific tests on unsupported platforms.
- Keeping the test suite green while a fix is pending.

See also: [test](./test), [expect_fail](./expect-fail).
