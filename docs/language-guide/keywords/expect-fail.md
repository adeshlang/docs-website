---
id: expect-fail
title: expect_fail
sidebar_label: expect_fail
description: The `expect_fail` keyword marks a test expected to fail.
---

# `expect_fail`

The `expect_fail` keyword marks a test as expected to fail. The test runner treats such a test as passing when it fails, and as failing when it unexpectedly passes, which guards against regressions that accidentally fix a known issue.

---

## Syntax & Example

```adesh
test "not yet implemented" expect_fail {
    let result = feature();
    assert result == 42;
}
```

---

## Use Cases

- Tracking known bugs and unimplemented features as explicit expectations.
- Detecting when a previously-failing case starts passing.
- Documenting intended behavior that is not yet supported.

See also: [test](./test), [ignore](./ignore).
