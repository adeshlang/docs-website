---
id: await
title: await
sidebar_label: await
description: The `await` keyword awaits an async value.
---

# `await`

The `await` keyword suspends the current `async` context until the awaited value completes, then yields its result. It may only be used inside an `async` function or context.

---

## Syntax & Example

```adesh
async fn fetchAll(urls: [string]) -> [string] {
    let mut results = [];
    for url in urls {
        let body = await fetch(url);
        results.push(body);
    }
    return results;
}
```

---

## Use Cases

- Consuming the result of an `async` operation.
- Sequentially chaining asynchronous steps.
- Coordinating with `spawn` for concurrent task execution.

See also: [async](./async), [spawn](./spawn).
