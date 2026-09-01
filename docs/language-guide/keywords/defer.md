---
id: defer
title: defer
sidebar_label: defer
description: The `defer` keyword schedules scope-exit cleanup.
---

# `defer`

The `defer` keyword schedules a statement or block to run when the enclosing scope exits, regardless of how it exits (normal completion, `return`, `throw`, `break`, or `continue`). Multiple `defer` statements run in LIFO (last-in, first-out) order.

---

## Syntax & Example

```adesh
fn readData(path) {
    let file = FS.open(path, "r");
    defer file.close(); // guaranteed to run on scope exit

    let contents = file.readAll();
    return contents;
}
```

```adesh
fn testDeferOrder() {
    defer print("runs last");
    defer print("runs first");
    print("body");
}
// Output: body, runs first, runs last
```

---

## Use Cases

- RAII-style resource teardown (closing files, sockets, mutexes).
- Guaranteeing cleanup even when errors are thrown or loops break.
- Releasing locks or buffers at scope exit without try/finally boilerplate.

See also: [Defer Statement](../defer-statement).
