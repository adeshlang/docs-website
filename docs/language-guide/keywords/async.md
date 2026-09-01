---
id: async
title: async
sidebar_label: async
description: The `async` keyword marks a function or value as asynchronous.
---

# `async`

The `async` keyword marks a function (or value) as asynchronous. An `async` function returns a value that can be awaited and may suspend without blocking the caller.

---

## Syntax & Example

```adesh
async fn fetch(url: string) -> string {
    // ... asynchronous work ...
    return "body";
}

let body = await fetch("https://example.com");
```

---

## Use Cases

- Writing non-blocking I/O and network code.
- Producing awaitable values consumed with `await`.
- Building concurrent pipelines with `spawn`.

See also: [await](./await), [spawn](./spawn), [Async & Concurrency](../async-concurrency).
