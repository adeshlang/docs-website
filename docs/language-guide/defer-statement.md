---
id: defer-statement
title: Defer Statement & Scope Cleanup
sidebar_label: Defer Statement
---

# Defer Statement & Scope Cleanup

The `defer` statement schedules a statement or code block to execute automatically when the current enclosing scope terminates. It guarantees RAII-like resource teardown (closing sockets, releasing file descriptors, unlocking mutexes) regardless of how the scope exits.

---

## 1. Syntax & Core Guarantees

```adesh
defer statementOrBlock;
```

### Core Execution Guarantees

1. **Guaranteed Execution on Exit**: A `defer` block is guaranteed to run whenever execution exits the enclosing block scope, whether by:
   - Reaching the end of the block normally.
   - Executing an explicit `return` statement.
   - Raising an uncaught exception (`throw`).
   - Breaking out of a loop (`break` or `continue`).
2. **LIFO (Last-In, First-Out) Order**: Multiple `defer` statements in the same scope execute in reverse lexical order (stack order).
3. **Lexical Scope Boundaries**: `defer` is tied to its immediate block scope (function body, `if` branch, or `for`/`while` loop iteration).

---

## 2. LIFO Stack Execution Order

When multiple `defer` statements exist in the same scope, the last evaluated `defer` statement is the first one executed upon scope termination.

```adesh
fn testDeferOrder() {
    print("1. Function Start");

    defer print("4. First Defer Statement (Evaluated First, Runs Last)");
    defer print("3. Second Defer Statement (Evaluated Second, Runs Second)");
    defer print("2. Third Defer Statement (Evaluated Last, Runs First)");

    print("5. Function End");
}

testDeferOrder();
```

### Output:
```text
1. Function Start
5. Function End
2. Third Defer Statement (Evaluated Last, Runs First)
3. Second Defer Statement (Evaluated Second, Runs Second)
4. First Defer Statement (Evaluated First, Runs Last)
```

---

## 3. RAII Resource Management Examples

### File Descriptor Teardown

```adesh
import FS;

fn readDataFile(path) {
    let file = FS.open(path, "r");
    // Ensure file handle is closed as soon as readDataFile exits
    defer file.close();

    let contents = file.readAll();
    return contents;
}
```

### Network Socket Teardown

```adesh
import Net;

fn queryRemoteEndpoint(host, port) {
    let socket = Net.tcpConnect(host, port);
    // Guarantee socket closure even if socket.write or socket.read throws an error
    defer socket.close();

    socket.write("GET /ping HTTP/1.1\r\n\r\n");
    return socket.read();
}
```

---

## 4. Defer in Loops

In loops, `defer` statements run at the end of *each iteration*, not when the loop overall finishes:

```adesh
for (i in [1, 2, 3]) {
    defer print("Cleaned up iteration:", i);
    print("Processing iteration:", i);
}
```

### Output:
```text
Processing iteration: 1
Cleaned up iteration: 1
Processing iteration: 2
Cleaned up iteration: 2
Processing iteration: 3
Cleaned up iteration: 3
```
