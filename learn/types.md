---
id: types
title: Types & Type System - Numbers, Booleans, and More
sidebar_label: 9. Types & Type System
---

# Types & Type System — Numbers, Booleans, and More

AdeshLang has a **static, explicit type system**: every value has a known type,
and you can (and often should) say what it is. This lesson teaches the type
system using the exact code from the examples repository.

## The core types

| Type | Meaning | Examples |
|------|---------|----------|
| `i8`…`i128` | signed integers (8–128 bit) | `-42`, `1000i64` |
| `u8`…`u128` | unsigned integers | `255u8`, `0` |
| `f32`, `f64` | floating-point (decimal) numbers | `3.14`, `0.5f32` |
| `bool` | true/false | `true`, `false` |
| `string` | text | `"hello"` |
| `null` | absence of a value | `null` |
| `[T]` | array of type T | `[1, 2, 3]` |
| `T?` / `Option<T>` | nullable / maybe-a-value | `let age: i32? = null;` |

AdeshLang infers types automatically, but lets you write them:

```adesh
// Inference
let age = 25;
let price = 99.99;
let active = true;

// Explicit annotations
let age: i32 = 25;
let price: f64 = 99.99;
let active: bool = true;
```

This is straight from `examples/misc/features.adesh` and
`examples/01_Basics/variable.adesh`.

## Inspecting types

```adesh
let x = 42;
print(typeof x);         // i64 (or the inferred integer type)
print(typeof 3.14);      // f64
print(typeof "hi");      // string
print(typeof true);      // bool
print(typeof [1,2,3]);   // array
print(typeof {a:1});     // object

// sizeof shows memory footprint in bytes
print(sizeof([1,2,3]));  // depends on array tier (see below)
print(sizeof("hello"));  // 5 (plus string header)
```

## Numeric types and why they matter

AdeshLang has the same wide range as Rust: choose the smallest type that
fits what you are storing.

```adesh
let tiny: u8   = 255;           // 0..=255
let small: i16 = -32_000;       // -32,768..=32,767
let normal: i32 = 1_000_000;    // the default for integer literals
let big: i64   = 2_000_000_000;
let huge: i128 = 9_000_000_000_000_000_000;

let pi: f64 = 3.14159;
let half: f32 = 0.5;
```

Mixing types is legal but usually needs an explicit cast:

```adesh
let a: u8 = 200;
let b: u8 = 100;
let result = (a as u16) + (b as u16);   // 300, without overflow
print(result);

let raw: f64 = 42.8;
let whole: i64 = raw as i64;           // 42  (truncates the decimal)
print(whole);
```

That exact pattern — casting in arithmetic to avoid overflow — comes from
`examples/functions/01_basic_functions.adesh`.

## Strict vs loose equality

AdeshLang supports both `==` (loose) and `===` (strict). From
`examples/operators/strict_equality.adesh`:

```adesh
let a = 2;        // number
let b = "2";      // string

print(a == b);    // true  (loose: compares values)
print(a === b);   // false (strict: types must match too)

let arr1 = [1];
let arr2 = [1];
print(arr1 == arr2);    // false (different array objects, even if equal contents)
print(arr1 === arr2);   // false (not the same object)
```

> Use `===` when you need to be sure both value and type match.

## Nullability: `?` and `??`

A value can be explicitly nullable with `T?`:

```adesh
let maybePort: i32? = null;   // valid: could be an i32 or null
let host: string? = null;

let resolved = host ?? "127.0.0.1";   // ?? gives a default when null
print(resolved);  // 127.0.0.1
```

`??` — null coalescing — appears in database configs all over the real
examples (`examples/syntax/test_nullish_coalescing.adesh`):

```adesh
let config = { host: null, port: 8080 };
let host = config.host ?? "localhost";
print(host);   // localhost
```

## Optional chaining `?.`

Access a property only if it exists, without crashing:

```adesh
let user = { profile: { name: "Alice" } };
print(user?.profile?.name);    // Alice

let emptyUser = null;
print(emptyUser?.profile?.name);   // null, no crash

let partial = { profile: null };
print(partial?.profile?.name);     // null
```

From `examples/syntax/test_optional_chaining.adesh`.

## Arrays: tiers, and why it matters

AdeshLang's array system selects the best representation automatically
(`examples/arrays/comprehensive_array_demo.adesh`):

| Tier | When | Overhead |
|------|------|----------|
| Raw (`[u8;raw]`) | fixed-size compile-time | 0 bytes |
| SSO (small) | ≤22 bytes total | 2 bytes |
| Compact | ≤65,535 elements | 16 bytes |
| Dynamic | anything bigger | 16–24 bytes |

As a beginner you rarely need to care — but `metadata_size()` shows it:

```adesh
let small: [u8] = [1, 2, 3];
print(small.metadata_size());    // small tier, minimal overhead

let large = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
print(large.metadata_size());    // dynamic tier
```

## Tuples and destructuring

A tuple is a fixed-size group of values:

```adesh
let point = (10, 20, 30);

print(point[0]);       // 10
print(first(point));   // 10
print(last(point));    // 30

let (x, y, z) = point; // destructure into names
print(x, y, z);        // 10 20 30

let typed: (u8, i32, f64, string) = (42u8, 1000i32, 3.14, "hello");
let (a, b, c, d): (u8, i32, f64, string) = typed;
```

From `examples/arrays/tuple_examples.adesh` and
`examples/arrays/comprehensive_array_demo.adesh`.

## Type aliases

Give a type a readable name:

```adesh
type ScoreMap = [i32];
type UserId = i64;

let scores: ScoreMap = [100, 200, 300];
let id: UserId = 42;

fn findScore(list: ScoreMap, v: i32): i32 {
    for s in list {
        if (s == v) return s;
    }
    return -1;
}
print(findScore(scores, 200));   // 200
```

See `docs/language-guide/type-aliases` for the full reference.

## Real-world usage

| Real file | The type feature it uses |
|-----------|--------------------------|
| `examples/01_Basics/variable.adesh` | multi-var declarations, `typeof`, `sizeof` |
| `examples/arrays/comprehensive_array_demo.adesh` | array tiers, tuple destructuring |
| `examples/functions/01_basic_functions.adesh` | typed params + `as` casts |
| `examples/operators/strict_equality.adesh` | `==` vs `===` |
| `examples/syntax/test_nullish_coalescing.adesh` | `??` defaults |
| `examples/syntax/test_optional_chaining.adesh` | `?.` safe access |

## Practice

Create `types.adesh`:

```adesh
let speed: f64 = 88.0;
let units: i32 = 2;
print(`Speed: ${speed} units per hour`);

let maxTemp: u8 = 42;
print(`Max temp: ${maxTemp} °C`);

let maybe: string? = null;
print(maybe ?? "default");

let pair = ("tag", 1);
let (label, num): (string, i32) = pair;
print(label, num);
```

## Summary

✅ **You learned:**
- The full numeric range: `i8…i128`, `u8…u128`, `f32`/`f64`
- Explicit annotations: `let x: i32 = 5;`
- `typeof` and `sizeof` introspection
- `as` casting between types (and avoiding overflow)
- `==` vs `===` strict equality
- Nullable `T?` with `??` coalescing and `?.` chaining
- Array tiers (raw/SSO/compact/dynamic) and `metadata_size()`
- Tuples and destructuring
- `type` aliases for readable names

## Next Step

Now let's model real-world data: **structs, enums, and pattern matching**.
Continue to **[Structs, Enums & Matching](/learn/structs-enums)** →
