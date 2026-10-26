---
id: error-handling
title: Error Handling & Cleanup - try, catch, throw, defer
sidebar_label: 15. Error Handling
---

# Error Handling & Cleanup — `try`, `catch`, `throw`, `defer`

Real programs fail: files are missing, inputs are invalid, servers time out.
Adesh gives you a clear, explicit toolkit — **throw, try/catch, defer** —
all proven in the examples repository.

## What can go wrong?

```adesh
// Division by zero
fn divide(a, b) {
    if b == 0 {
        throw "DivisionByZeroError: denominator cannot be 0";
    }
    return a / b;
}

print(divide(10, 0));   // throws!
```

Without a handler, a thrown error crashes the program. With one, we recover:

```adesh
try {
    let result = divide(10, 0);
    print("Result:", result);
} catch (err) {
    print("Caught exception:", err);
}
// Caught exception: DivisionByZeroError: denominator cannot be 0
```

**Output:**
```
Caught exception: DivisionByZeroError: denominator cannot be 0
```

That is the very first error example in `examples/errors/error.adesh`.

## The full pattern

```adesh
fn loadConfig(path) {
    if (!fs.exists(path)) {
        throw "ConfigNotFound: " + path;
    }
    return JSON.parse(fs.read(path));
}

try {
    let cfg = loadConfig("app.json");
    print("Loaded:", cfg.name);
} catch (err) {
    print("Failed to load config:", err);
    print("Starting with defaults...");
}
```

**Output:**
```
Failed to load config: ConfigNotFound: app.json
Starting with defaults...
```

The program keeps running and can fall back to defaults — exactly what a real
app does.

## Throwing structured errors

You can throw any value — strings, numbers, objects:

```adesh
fn processTransaction(amount, balance) {
    if (amount > balance) {
        throw {
            code: "INSUFFICIENT_FUNDS",
            amount: amount,
            balance: balance
        };
    }
    return balance - amount;
}

try {
    processTransaction(500, 100);
} catch (err) {
    print("Error code:", err.code);      // INSUFFICIENT_FUNDS
    print("Tried to spend:", err.amount);
}
```

**Output:**
```
Error code: INSUFFICIENT_FUNDS
Tried to spend: 500
```

## Validation with guard clauses

The repository's [Task Manager](/learn/capstone) validates everywhere:

```adesh
fn handleAdd(args) {
    if (len(args) < 1) {
        print("❌ Error: Task title required");
        return;
    }

    let priority = len(args) > 2 ? args[2] : "medium";

    if (priority != "low" && priority != "medium" && priority != "high") {
        print("❌ Error: Priority must be 'low', 'medium', or 'high'");
        return;
    }

    // ... safe to proceed
}
```

Guard clauses check the invalid cases first and exit early, keeping the happy
path clear.

## `defer`: guaranteed cleanup

`defer` schedules code to run when the current block exits — no matter how it
exits (return, error, or normal end). Perfect for closing files, sockets, and
locks.

```adesh
fn processFile(filename) {
    print("Opening file:", filename);

    defer {
        print("Closing file:", filename);   // always runs
    }

    print("Processing:", filename);

    throw "Something failed mid-way";        // error! but defer still runs
}

try {
    processFile("data.txt");
} catch (err) {
    print("Caught:", err);
}

// Opening file: data.txt
// Processing: data.txt
// Closing file: data.txt      ← even though we threw!
// Caught: Something failed mid-way
```

**Output:**
```
Opening file: data.txt
Processing: data.txt
Closing file: data.txt
Caught: Something failed mid-way
```

This is the exact pattern in `examples/defer/resource_cleanup.adesh` and
`examples/defer/basic_defer.adesh`.

### Multiple defers run LIFO

```adesh
fn demo() {
    defer { print("cleanup 1"); }
    defer { print("cleanup 2"); }
    defer { print("cleanup 3"); }
}
demo();
// cleanup 3   (last registered, runs first)
// cleanup 2
// cleanup 1
```

**Output:**
```
cleanup 3
cleanup 2
cleanup 1
```

LIFO (last-in, first-out) matches how resources nest: close the inner
resource before the outer one.

## Some/None and Result: errors as values

Adesh also models "maybe a value" and "maybe a failure" as types you match
on, instead of throwing:

```adesh
fn findUser(id) {
    let users = { 1: "Alice", 2: "Bob" };
    let name = users[id];
    if name == null {
        return None();
    }
    return Some(name);
}

let result = findUser(3);

match result {
    Some(name) => print("Found:", name),
    None()     => print("User not found")
}
```

**Output:**
```
User not found
```

When a function returns `null` for "not found", combine with `??`:
`let name = findUser(3) ?? "unknown";`.

## The error-handling toolkit at a glance

| Tool | Use for |
|------|---------|
| `throw value` | signal a failure (any payload) |
| `try { } catch (err) { }` | recover from a failure |
| `defer { }` | guarantee cleanup on block exit |
| `Some/None` | optional, maybe-present values |
| `Result.Ok/Err` + `match` | success-or-failure values |
| guard clauses | validate early, keep happy paths clear |

## Practice

```adesh
fn validateEmail(email) {
    if (len(email) < 5) {
        throw "Email too short";
    }
    if (!email.includes("@")) {
        throw "Email must contain @";
    }
    return email;
}

try {
    validateEmail("nope");
} catch (err) {
    print("Invalid email:", err);
}

validateEmail("ok@example.com");
print("All good!");
```

**Output:**
```
Invalid email: Email too short
All good!
```

Run it, then change `defer` to appear in a real cleanup scenario and watch it
run even when an exception is thrown.

## Summary

✅ **You learned:**
- `throw` raises an error (strings, numbers, objects)
- `try { } catch (err) { }` recovers from errors
- Guard clauses validate input before doing work
- `defer` guarantees cleanup on block exit, LIFO order
- `Some/None` and `Result` model absence/failure as values
- Real apps (like the Task Manager) combine all of these

## Next Step

Now let's understand what makes Adesh special under the hood — **memory
safety, ownership, and borrowing**. Continue to **[Memory Safety](/learn/memory-safety)** →
