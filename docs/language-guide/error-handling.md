---
id: error-handling
title: Exception & Error Handling
sidebar_label: Error Handling
---

# Exception & Error Handling

AdeshLang implements a structured exception-handling subsystem using `try`, `catch`, and `throw`. It allows applications to signal, capture, inspect, and recover from runtime failures gracefully without crashing process threads.

---

## 1. The `throw` Statement

The `throw` statement raises an exception, halting standard control flow and initiating stack unwinding.

### Syntax & Mechanics

```adesh
throw <expression>;
```

- **Expression Payload**: `throw` accepts any valid AdeshLang expression — strings, numbers, objects, or custom error structs.
- **Stack Unwinding**: When `throw` executes, the runtime immediately unwinds the call stack frame by frame, looking for the nearest enclosing `try ... catch` block. If no handler is found, the process terminates with an unhandled exception panic log.

### Examples

```adesh
// Throwing a simple string message
fn validatePositive(val) {
    if (val <= 0) {
        throw "Value must be strictly positive!";
    }
    return val;
}

// Throwing a structured error object
fn processTransaction(amount, balance) {
    if (amount > balance) {
        throw {
            code: "ERR_INSUFFICIENT_FUNDS",
            requested: amount,
            available: balance,
            timestamp: 1718000000
        };
    }
    return balance - amount;
}
```

---

## 2. The `try ... catch` Block

Use `try ... catch` to guard code blocks and recover from thrown exceptions.

### Syntax & Mechanics

```adesh
try {
    // Protected Scope: Code that may throw an exception
} catch (err) {
    // Exception Handler Scope: Evaluated if an exception is caught
}
```

1. **Protected Scope**: The `try` block executes standard statements.
2. **Exception Interception**: If an exception is thrown anywhere inside the `try` block (or inside functions called from within it), execution in the `try` block immediately halts.
3. **Handler Scope**: Control transfers to the `catch` block. The thrown exception payload is bound to the declared error variable parameter (`err`).

### Pin-to-Pin Example

```adesh
fn parseConfig(jsonStr) {
    if (len(jsonStr) == 0) {
        throw "Config string cannot be empty";
    }
    // Assume JSON.parse throws on invalid syntax
    return JSON.parse(jsonStr);
}

try {
    let cfg = parseConfig("");
    print("Parsed Port:", cfg.port);
} catch (e) {
    print("Failed to load config:", e);
}
```

---

## 3. Nested `try ... catch` Blocks & Exception Re-throwing

Exceptions can be caught at granular levels or re-thrown to higher caller scopes.

```adesh
fn ServiceHandler(req) {
    try {
        try {
            processTransaction(req.amount, req.balance);
        } catch (innerErr) {
            print("Internal handler caught error:", innerErr.code);
            // Re-throw to caller
            throw innerErr;
        }
    } catch (outerErr) {
        print("Outer service handler logging failure:", outerErr.code);
    }
}
```
