---
id: pattern-matching
title: Advanced Pattern Matching
sidebar_label: Pattern Matching
description: Exhaustive pattern matching, destructuring, range patterns, guards, and algebraic data type matching in Adesh.
---

# Advanced Pattern Matching

Adesh provides powerful, expressive, and compile-time exhaustive **Pattern Matching** via the `match` expression and destructuring syntax.

```adesh
let message = match status_code {
    200 => "OK",
    400 => "Bad Request",
    404 => "Not Found",
    500..=599 => "Server Error",
    _ => "Unknown Status",
};
```

---

## 1. Core Pattern Types

### Literals & Multiple Alternatives
Match exact scalar constants or multiple alternative patterns separated by `|`:

```adesh
fn categorize_char(c: char): string {
    return match c {
        'a' | 'e' | 'i' | 'o' | 'u' => "vowel",
        '0'..='9' => "digit",
        'a'..='z' | 'A'..='Z' => "letter",
        ' ' | '\t' | '\n' => "whitespace",
        _ => "symbol",
    };
}
```

### Inclusive Range Patterns
Match integer or character ranges using `start..=end`:

```adesh
fn evaluate_grade(score: i64): string {
    return match score {
        90..=100 => "A",
        80..=89 => "B",
        70..=79 => "C",
        60..=69 => "D",
        0..=59 => "F",
        _ => "Invalid Score",
    };
}
```

---

## 2. Destructuring Patterns

### Destructuring Tuples and Fixed Arrays
Extract values from tuples and arrays directly in patterns:

```adesh
fn describe_point(point: (f64, f64, f64)): string {
    return match point {
        (0.0, 0.0, 0.0) => "Origin",
        (x, 0.0, 0.0) => f"On X-axis at {x}",
        (0.0, y, 0.0) => f"On Y-axis at {y}",
        (0.0, 0.0, z) => f"On Z-axis at {z}",
        (x, y, z) => f"In 3D space at ({x}, {y}, {z})",
    };
}
```

### Destructuring Structs
Match struct fields and bind them to local variables:

```adesh
struct User {
    id: i64,
    name: string,
    role: string,
    active: bool,
}

fn check_access(user: &User): string {
    return match user {
        User { role: "admin", active: true, .. } => "Full Admin Access",
        User { role: "editor", active: true, name, .. } => f"Editor access granted to {name}",
        User { active: false, .. } => "Account is deactivated",
        _ => "Guest Access",
    };
}
```

---

## 3. Matching Algebraic Data Types (Enums with Data)

Enums in Adesh can carry arbitrary payloads. Pattern matching safely unpacks payloads:

```adesh
enum NetworkEvent {
    Connected(string),                   // Tuple variant (IP address)
    Disconnected(reason: string),        // Named struct variant
    DataReceived([u8], usize),           // Payload bytes + length
    Ping,                                // Unit variant
}

fn handle_event(event: NetworkEvent) {
    match event {
        NetworkEvent::Connected(ip) => {
            print(f"Client connected from IP: {ip}");
        }
        NetworkEvent::Disconnected(reason) => {
            print(f"Client disconnected. Reason: {reason}");
        }
        NetworkEvent::DataReceived(bytes, len) => {
            print(f"Received {len} bytes of data");
        }
        NetworkEvent::Ping => {
            print("Ping received, responding with Pong");
        }
    }
}
```

---

## 4. Pattern Guards (`if` clauses)

Add custom boolean conditions to patterns with the `if` guard syntax:

```adesh
fn process_transaction(amount: f64, is_vip: bool): string {
    return match amount {
        a if a <= 0.0 => "Invalid transaction amount",
        a if a > 10000.0 && !is_vip => "Transaction requires manager approval",
        a if a > 10000.0 && is_vip => "VIP Large transaction auto-approved",
        a => f"Standard transaction of ${a} approved",
    };
}
```

---

## 5. Variable Binding with `@` Patterns

Bind a matched value to a variable while simultaneously checking sub-patterns:

```adesh
fn process_message(code: i64): string {
    return match code {
        val @ 100..=199 => f"Informational status: {val}",
        val @ 200..=299 => f"Success status: {val}",
        val @ 400..=499 => f"Client error: {val}",
        val @ 500..=599 => f"Server error: {val}",
        other => f"Unhandled status code: {other}",
    };
}
```

---

## 6. Compile-Time Exhaustiveness Checking

The Adesh compiler verifies that every `match` expression covers all possible cases:

```adesh
enum Color { Red, Green, Blue }

// COMPILE ERROR: Non-exhaustive patterns in match expression. Missing case: Color::Blue
let color_name = match current_color {
    Color::Red => "Red",
    Color::Green => "Green",
};
```
