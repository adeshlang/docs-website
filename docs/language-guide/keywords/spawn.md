---
id: spawn
title: spawn
sidebar_label: spawn
description: The `spawn` keyword spawns a concurrent task.
---

# `spawn`

The `spawn` keyword launches a concurrent task that runs independently of the caller. It returns a handle to the task whose result can later be awaited.

---

## Syntax & Example

```adesh
async fn main() {
    let t1 = spawn fetch("https://a.example");
    let t2 = spawn fetch("https://b.example");
    let a = await t1;
    let b = await t2;
    print(a, b);
}
```

---

## Use Cases

- Running independent operations concurrently for throughput.
- Starting background work and collecting results later with `await`.
- Building parallel pipelines of asynchronous tasks.

See also: [async](./async), [await](./await), [Async & Concurrency](../async-concurrency).
