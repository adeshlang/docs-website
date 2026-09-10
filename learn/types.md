---
id: types
title: Types & Type System - Numbers, Booleans, and More
sidebar_label: 12. Types & Type System
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

**Output:**
```
number
number
string
boolean
array
object
27
5
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

**Output:**
```
300
42
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

**Output:**
```
true
false
true
false
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

**Output:**
```
127.0.0.1
```

`??` — null coalescing — appears in database configs all over the real
examples (`examples/syntax/test_nullish_coalescing.adesh`):

```adesh
let config = { host: null, port: 8080 };
let host = config.host ?? "localhost";
print(host);   // localhost
```

**Output:**
```
localhost
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

**Output:**
```
Alice
null
null
```

From `examples/syntax/test_optional_chaining.adesh`.

## Union Types `T | U` and Empty-Container Literals

AdeshLang supports **TypeScript-style union types** — a value can be one of several types. This is idiomatic for DSA and API code where a function may return a value *or* `null` / an empty container. From `examples/DSA/union_and_optional_types.adesh` and `examples/DSA/frequency_counter.adesh`:

```adesh
// Union return: index or null, array or empty []
fn findIndex(nums: [int], target: int): int | null {
    for i in range(len(nums)) {
        if nums[i] == target { return i; }
    }
    return null;
}

fn findPair(nums: [int], target: int): [int] | [] {
    let seen: set; // default-initialized empty Set
    for i in range(len(nums)) {
        let complement = target - nums[i];
        if seen.contains(complement) {
            return [complement, nums[i]];
        }
        seen.insert(nums[i]);
    }
    return []; // empty array literal as valid union member
}

// Union parameter: accept int, string, or bool
fn describeValue(v: int | string | bool): string {
    return "Value is: " + str(v);
}

let idx: int | null = findIndex([10, 20, 30], 30); // 2
let pair: [int] | [] = findPair([10, 20, 30], 50);  // [20, 30]
print(describeValue(42));          // Value is: 42
print(describeValue("AdeshLang")); // Value is: AdeshLang

// Another real example: top word or null
fn getTopWord(freq: dict): string | null {
    let maxCount = 0;
    let topWord: string | null = null;
    for word in freq.keys() {
        if freq[word] > maxCount { maxCount = freq[word]; topWord = word; }
    }
    return topWord;
}
```

**Key rules:**
- Unions are written with `|` : `int | null`, `string | null`, `[int] | []`, `int | string | bool`
- `[]` (empty array) and `{}` (empty object/dict) are valid types **and** values in union positions: `[int] | []`, `dict | {}`
- `null` is a standalone type/keyword usable in unions for nullable results
- Unions compose with `: Type` annotations — never `-> Type` (only `extern "C"` uses `->`)

## Optional Types `T?` and Optional Record Fields `field?: Type`

Optional is syntactic sugar for nullable / union-with-null, plus field-level optionality:

```adesh
// Postfix `?` — compact nullable (from examples/DSA/linked.adesh, examples/generics)
class Node {
    Node(data: int, next: Node?) { // next may be Node or null
        this.data = data; this.next = next;
    }
}
fn pop(): int? { return null; }           // shorthand for int | null
let maybe: string? = null;                // same as string | null
let top: string? = getTopWord(freq);     // T? interop with T | null

// Optional record fields with `?:` and defaults (examples/type_keyword/*.adesh)
type User = { name: String, age?: u8 = 20, isStudent: Bool };
type Box<T> = { value: T, tag?: String = "generic-box" };
type Maybe<T> = { value?: T; present: bool };

let u: User = { name: "Ajay", isStudent: true }; // age defaults to 20
print(u.age); // 20

let intBox: Box<int> = { value: 42 };            // tag defaults to "generic-box"
print(intBox.tag); // generic-box

// Optional chaining + optional types compose
let nested: Box<string?> = { value: null, present: false };
print(nested.value ?? "default"); // default
```

**When to use which:**
| Form | Meaning | Use when |
|------|---------|----------|
| `T?` | `T | null` | return/param is nullable, or field may be absent |
| `field?: Type` | optional field | record field with default or omission |
| `field?: Type = default` | optional with default | inject default if omitted (like `age?: u8 = 20`) |
| `T | U` | broader union | value may be unrelated types (e.g. `int | string | bool`) |

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

**Output:**
```
2
24
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

**Output:**
```
10
10
30
10 20 30
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

**Output:**
```
200
```

### Type annotation technique — `:` not `->` (except `extern "C"`)

All AdeshLang type annotations use **colon** `:` — `let x: Type`, `param: Type`, `fn foo(a: t): Ret`. The arrow `->` is **only** for `extern "C"` FFI signatures (`extern "C" fn puts(s: *const u8) -> i32;`). Function-type aliases also use `:` : `type Cb = fn(x: i32): bool;` and generic instantiations like `fn(x: i64): i64` (see `examples/functions/02_higher_order.adesh`). Prefer `let s: set;` / `let d: dict;` default-decl syntax for containers (see `examples/DSA/container_constructors_and_defaults.adesh`).

```adesh
fn add(a: i32, b: i32): i32 { return a + b; }          // ✅ colon
fn find(nums: [int], target: int): int | null { ... }  // ✅ union return
let n: Node? = null;                                   // ✅ optional postfix
type Handler = fn(event: string): bool;                // ✅ function type with :
extern "C" fn puts(s: *const u8) -> i32;               // ✅ -> only here
```

See `docs/language-guide/type-aliases` for the full reference.

## Container constructors & defaults (DSA new syntax)

From `examples/DSA/container_constructors_and_defaults.adesh`:

```adesh
let s: set;    // → empty mutable Set   (no `new`, no `{}`)
let d: dict;   // → empty mutable Dict/Object
let a: array;  // → empty mutable Array
s.insert(100); d["apple"] = 5; a.push(1);

let userSet = Set<int>([10, 20, 30, 20, 10]); // generic constructor deduplicates
let scores  = Dict<string, int>();            // generic map
let items   = Array<string>(["alpha", "beta"]);
let sA = Set([1, 2, 3]); let sB = Set([3, 4, 5]);
let u = sA.union(sB);          // {1,2,3,4,5}
let i = sA.intersection(sB);   // {3}
```

Primitives `set`/`dict`/`array` are also available lower-case as type keywords with the same semantics.

## Real-world usage

| Real file | The type feature it uses |
|-----------|--------------------------|
| `examples/01_Basics/variable.adesh` | multi-var declarations, `typeof`, `sizeof` |
| `examples/arrays/comprehensive_array_demo.adesh` | array tiers, tuple destructuring |
| `examples/functions/01_basic_functions.adesh` | typed params + `as` casts |
| `examples/operators/strict_equality.adesh` | `==` vs `===` |
| `examples/syntax/test_nullish_coalescing.adesh` | `??` defaults |
| `examples/syntax/test_optional_chaining.adesh` | `?.` safe access |
| `examples/DSA/union_and_optional_types.adesh` | `T | null`, `T | []`, `T?`, `int | string` unions |
| `examples/DSA/frequency_counter.adesh` | `string | null` returns, `dict` usage |
| `examples/DSA/container_constructors_and_defaults.adesh` | `let s: set;`, `Set<T>()`, `union()` / `intersection()` |

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

**Output:**
```
Speed: 88 units per hour
Max temp: 42 °C
default
tag 1
```

## Summary

✅ **You learned:**
- The full numeric range: `i8…i128`, `u8…u128`, `f32`/`f64`
- Explicit annotations: `let x: i32 = 5;` and `fn foo(a: T): Ret` (`:` not `->` except `extern "C"`)
- Union types: `int | null`, `[int] | []`, `int | string | bool` (and empty literals `[]`/`{}` as type members)
- Optional types: `T?`, `field?: Type`, `field?: Type = default` and `T?`/`T | null` interop
- `typeof` and `sizeof` introspection
- `as` casting between types (and avoiding overflow)
- `==` vs `===` strict equality
- Nullable `T?` with `??` coalescing and `?.` chaining
- Container shorthand: `let s: set;` + `Set<T>()`/`Dict<K,V>()`/`Array<T>()` + `union()`/`intersection()`
- Array tiers (raw/SSO/compact/dynamic) and `metadata_size()`
- Tuples and destructuring
- `type` aliases for readable names

## Next Step

Now let's model real-world data: **structs, enums, and pattern matching**.
Continue to **[Structs, Enums & Matching](/learn/structs-enums)** →
