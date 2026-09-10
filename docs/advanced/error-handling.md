---
id: error-handling
title: Robust Error Handling
sidebar_label: Error Handling
description: Deterministic error handling in AdeshLang with Result, Option, the ? operator, custom errors, and defer cleanup.
---

# Robust Error Handling

AdeshLang avoids hidden runtime exceptions in favor of **explicit, type-safe, and zero-overhead error handling** via `Result<T, E>` and `Option<T>`, combined with ergonomic propagation through the `?` operator.

```
┌──────────────────────────────────────────────────────────┐
│                   Error Handling Model                   │
├──────────────────────────────────────────────────────────┤
│  • Result<T, E>  : Ok(T) | Err(E)                        │
│  • Option<T>     : Some(T) | None                        │
│  • ? Operator    : Early-return on error                 │
│  • defer         : Guaranteed deterministic resource RAII│
└──────────────────────────────────────────────────────────┘
```

---

## 1. The `Result<T, E>` Type

`Result<T, E>` is a standard sum type used for functions that can fail:

```adesh
enum MathError {
    DivisionByZero,
    NegativeSquareRoot,
}

fn safe_divide(numerator: f64, denominator: f64): Result<f64, MathError> {
    if denominator == 0.0 {
        return Err(MathError::DivisionByZero);
    }
    return Ok(numerator / denominator);
}

fn calculate() {
    match safe_divide(10.0, 2.0) {
        Ok(value) => print(f"Calculation result: {value}"),
        Err(MathError::DivisionByZero) => print("Error: Cannot divide by zero"),
        Err(MathError::NegativeSquareRoot) => print("Error: Negative square root"),
    }
}
```

---

## 2. The `?` Error Propagation Operator

Instead of verbose `match` boilerplate, use the `?` operator to propagate errors up the call stack automatically:

```adesh
import { fs } from "builtin";
import { json } from "builtin";

struct Config {
    port: i64,
    host: string,
    database_url: string,
}

fn load_app_config(path: string): Result<Config, Error> {
    // 1. Read file. If Err, returns immediately from load_app_config with Err
    let contents = fs::read_to_string(path)?;
    
    // 2. Parse JSON. If parse fails, returns immediately with Err
    let parsed_json = json::parse(contents)?;
    
    let config = Config {
        port: parsed_json.get("port")?.as_int()?,
        host: parsed_json.get("host")?.as_string()?,
        database_url: parsed_json.get("db")?.as_string()?,
    };

    return Ok(config);
}
```

---

## 3. The `Option<T>` Type

Use `Option<T>` when a value may or may not be present:

```adesh
fn find_user_by_id(users: [User], id: i64): Option<User> {
    for user in users {
        if user.id == id {
            return Some(user);
        }
    }
    return None;
}

fn greet_user(users: [User], target_id: i64) {
    if let Some(user) = find_user_by_id(users, target_id) {
        print(f"Hello, {user.name}!");
    } else {
        print("User not found.");
    }
}
```

### Useful `Option` & `Result` Methods:

```adesh
let opt: Option<i64> = Some(42);

let val = opt.unwrap_or(0);                  // 42
let mapped = opt.map(fn(x) => x * 2);        // Some(84)
let is_present = opt.is_some();              // true
let is_empty = opt.is_none();                // false
```

---

## 4. Deterministic Cleanup with `defer`

The `defer` statement schedules a statement or block to execute automatically when the enclosing function or scope exits—whether by normal return, early error exit (`?`), or panic:

```adesh
import { fs } from "builtin";

fn process_log_file(file_path: string): Result<(), Error> {
    let file = fs::open(file_path, "r")?;
    
    // Guaranteed to close file upon function exit!
    defer file.close();

    let buffer = file.read_all()?;
    let stats = parse_statistics(buffer)?; // If this returns Err, file.close() STILL executes!
    save_statistics(stats)?;

    return Ok(());
}
```

---

## 5. Panics vs Recoverable Errors

| Category | Mechanism | When to Use |
|----------|-----------|-------------|
| **Recoverable Errors** | `Result<T, E>` | Network timeouts, missing files, invalid user inputs, authentication failures. |
| **Optional Values** | `Option<T>` | Cache misses, end of iterator streams, optional configuration keys. |
| **Unrecoverable Bugs** | `panic!("...")` | Broken internal invariants, memory corruption prevention, failed assertions. |

```adesh
// Panics should be reserved for catastrophic programmer bugs:
fn get_element_unchecked<T>(list: &[T], index: usize): &T {
    if index >= list.len() {
        panic(f"Fatal index out of bounds: index {index} >= length {list.len()}");
    }
    return &list[index];
}
```
