---
id: type-aliases
title: Type Aliases & Custom Types
sidebar_label: Type Aliases
description: Creating expressive domain types, generic aliases, function signatures, and union type aliases in AdeshLang.
---

# Type Aliases & Custom Types

Type aliases allow you to give new, meaningful domain names to existing primitive or complex types using the `type` keyword. They improve readability, encapsulate complex types, and simplify refactoring across large systems.

```adesh
type UserID = u64;
type SessionToken = string;
type Coordinates = (f64, f64);
```

---

## 1. Basic Type Aliases

Type aliases establish a synonym for an underlying type with zero runtime cost:

```adesh
type Port = u16;
type Milliseconds = u64;
type IPAddress = string;

fn connect_to_server(host: IPAddress, port: Port, timeout: Milliseconds) -> bool {
    print(f"Connecting to {host}:{port} with timeout {timeout}ms");
    return true;
}

fn main() {
    let server_ip: IPAddress = "192.168.1.100";
    let server_port: Port = 8080;
    let timeout_ms: Milliseconds = 5000;

    connect_to_server(server_ip, server_port, timeout_ms);
}
```

---

## 2. Generic Type Aliases

Type aliases can accept generic type parameters:

```adesh
import { adesh_alloc::HashMap } from "adesh_alloc";

// Simplify complex nested generic signatures
type Cache<K, V> = HashMap<K, (V, u64)>; // Key -> (Value, ExpirationTimestamp)
type AsyncResult<T> = Result<T, Error>;
type Pair<T> = (T, T);

fn create_cache<K, V>() -> Cache<K, V> {
    return HashMap::new();
}

fn get_min_max(points: [f64]) -> Pair<f64> {
    let mut min = points[0];
    let mut max = points[0];
    for p in points {
        if p < min { min = p; }
        if p > max { max = p; }
    }
    return (min, max);
}
```

---

## 3. Function Signature Aliases

Type aliases are especially helpful for defining readable callback and handler signatures:

```adesh
// Define high-level callback signatures
type EventHandler = fn(event_type: string, payload: [u8]) -> bool;
type Comparator<T> = fn(a: &T, b: &T) -> i32;
type Transform<T, R> = fn(item: T) -> R;

struct EventDispatcher {
    handlers: [EventHandler],

    pub fn register_handler(&mut self, handler: EventHandler) {
        self.handlers.push(handler);
    }

    pub fn dispatch(&self, event: string, data: [u8]) {
        for handler in self.handlers {
            handler(event, data);
        }
    }
}
```

---

## 4. Union / Algebraic Aliases

You can combine multiple distinct types into a single named sum type:

```adesh
type JsonScalar = string | i64 | f64 | bool | null;

fn print_scalar(val: JsonScalar) {
    match val {
        s: string => print(f"String: {s}"),
        i: i64 => print(f"Integer: {i}"),
        f: f64 => print(f"Float: {f}"),
        b: bool => print(f"Boolean: {b}"),
        null => print("Null value"),
    }
}
```

---

## 5. Type Aliases vs Structs (When to Use Which)

| Feature | Type Alias (`type X = Y`) | Struct (`struct X { ... }`) |
|---------|---------------------------|----------------------------|
| **Runtime Overhead** | Zero | Zero |
| **Nominal Type Safety** | Transparent / Structural equivalence | Strict nominal typing |
| **Methods & Traits** | Cannot implement distinct methods | Can implement methods and traits |
| **Best Used For** | Aliasing primitives, tuples, callbacks, complex generics | Data models, domain entities, OOP abstractions |
