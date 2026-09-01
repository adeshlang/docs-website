---
id: on
title: on
sidebar_label: on
description: The `on` keyword introduces an event/message handler clause.
---

# `on`

The `on` keyword introduces an event-handler or message-handler clause. It associates a block of code with a named event or message, typically in async/concurrent contexts.

---

## Syntax & Example

```adesh
on message(text: string) {
    print(f"received: {text}");
}
```

---

## Use Cases

- Declaring handlers for incoming messages or events.
- Wiring behavior to named signals in concurrent actors.

:::note
`on` is reserved by the lexer; parser support is focused on event/message handling. Treat uncommon uses as context-specific.
:::
