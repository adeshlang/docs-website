---
id: defer-and-memory
title: Defer & Memory Management
sidebar_label: Defer & Memory Safety
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Defer & Memory Management

<FeatureStatus status="STABLE" details="Scope teardown scheduling with defer (LIFO execution) and compile-time borrowing references" />

This section demonstrates scope teardown using `defer` and compile-time memory safety using references (`&`).

---

## 1. Defer Statement & Scope Teardown

The `defer` statement schedules code to execute automatically when exiting the current block scope (via return, completion, or exception propagation). Multiple `defer` statements execute in Last-In, First-Out (LIFO) stack order.

### Code Example

```adesh
fn processDatabaseTransaction() {
    print("1. Beginning database transaction");
    
    // Scheduled teardown 1 (runs last)
    defer print("4. [Defer LIFO 2] Transaction status finalized");
    
    print("2. Performing table mutations");

    // Scheduled teardown 2 (runs first upon scope exit)
    defer print("3. [Defer LIFO 1] Releasing database locks");

    print("2b. Operations complete inside block");
}

processDatabaseTransaction();
```

### Terminal Output

```text
1. Beginning database transaction
2. Performing table mutations
2b. Operations complete inside block
3. [Defer LIFO 1] Releasing database locks
4. [Defer LIFO 2] Transaction status finalized
```

### Breakdown

* **`defer statement;`**: Schedules execution for scope termination.
* **LIFO Teardown Order**: Deferred cleanup operations are stored in a stack; when scope exits, deferred statements execute in reverse order of declaration.

---

## 2. Borrowing References (`&`) & Memory Ownership

Passing values directly moves ownership unless explicitly borrowed using read-only references (`&`).

### Code Example

```adesh
struct Resource {
    name: string;
    id: i32;
};

// Function accepting immutable reference (borrowing)
fn inspectResource(res: &Resource) {
    print("Inspecting Resource -> Name:", res.name, "ID:", res.id);
}

let res = Resource { name: "DatabaseConnection", id: 101 };

// Pass by reference
inspectResource(&res);

// Caller retains full ownership of res
print("Owner retains resource:", res.name);
```

### Terminal Output

```text
Inspecting Resource -> Name: DatabaseConnection ID: 101
Owner retains resource: DatabaseConnection
```

### Breakdown

* **`&Resource`**: Pass-by-reference signature allowing read access without transferring variable ownership.
* **Ownership Preservation**: Retains allocation validity in the caller's stack frame without double-free risks.
