---
id: error-handling
title: Error Handling & Exception Guarding
sidebar_label: Error Handling
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Error Handling & Exception Guarding

<FeatureStatus status="STABLE" details="Structured exception guarding with try, catch, and throw statements" />

AdeshLang provides exception handling constructs (`try`, `catch`, `throw`) to raise, intercept, and gracefully recover from runtime errors.

---

## 1. Throwing & Catching Exceptions

Exceptions interrupt normal execution flow. Catch blocks intercept exceptions and expose error payload objects.

### Code Example

```adesh
fn validateAge(age: i32) {
    if age < 0 {
        throw "InvalidAgeError: age cannot be negative";
    }
    if age < 18 {
        throw "UnderageError: access restricted to adults";
    }
    return "Access Granted";
}

fn tryProcess(inputAge: i32) {
    try {
        let status = validateAge(inputAge);
        print("Success:", status);
    } catch (err) {
        print("Caught Exception ->", err);
    }
}

tryProcess(25);
tryProcess(-5);
tryProcess(15);
```

### Terminal Output

```text
Success: Access Granted
Caught Exception -> InvalidAgeError: age cannot be negative
Caught Exception -> UnderageError: access restricted to adults
```

### Breakdown

* **`throw payload;`**: Raises a runtime exception, immediately aborting current stack frame execution.
* **`try { ... } catch (err) { ... }`**: Encapsulates risky operations and executes recovery logic when exceptions are raised.
