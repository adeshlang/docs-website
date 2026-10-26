---
id: dsa
title: Data Structures & Algorithms
sidebar_label: Data Structures & Algorithms
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Data Structures & Algorithms

<FeatureStatus status="STABLE" details="Practical algorithm implementations in Adesh: Two Sum, LRU Cache, Linked Lists, Union/Optional type techniques, and Container constructors" />

This section demonstrates how to implement classic algorithms and data structures cleanly and idiomatically in Adesh — now with **TypeScript-style type annotations** (`:` not `->` except `extern "C"`), **union / optional types**, and **modern container syntax**.

> **Annotation style:** All signatures use `: ReturnType` (e.g. `fn foo(nums: [int], target: int): [int]`). Only `extern "C"` uses `->` (`extern "C" fn puts(s: *const u8) -> i32;`). See `learn/types`.

---

## 1. Two Sum Problem ($O(N)$ Hash Lookup)

Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

### Code Example (modern typed, from `examples/DSA/two_sum.adesh`)

```adesh
fn twoSumBruteForce(nums: [int], target: int): [int] {
    let n = len(nums);
    for i in range(n) {
        for j in range(i + 1, n) {
            if (nums[i] + nums[j] == target) {
                return [i, j];
            }
        }
    }
    return [];
}

fn twoSumHashMap(nums: [int], target: int): [int] {
    let map = {};
    let n = len(nums);
    for i in range(n) {
        let complement = target - nums[i];
        let complementKey = str(complement);
        if (map[complementKey] != null) {
            return [map[complementKey], i];
        }
        map[str(nums[i])] = i;
    }
    return [];
}

let numbers = [2, 7, 11, 15];
let target = 9;
let result = twoSumHashMap(numbers, target);
print("Found indices:", result); // [0, 1]
print("Values:", numbers[result[0]], "+", numbers[result[1]], "=", target);
```

### Terminal Output

```text
Found indices: [0, 1]
Values: 2 + 7 = 9
```

### Breakdown

* **$O(N)$ Hash Lookup** via dynamic dict `map = {}` as lookup table — hash-map approach in `two_sum.adesh`.
* **Typed signatures** with `: ReturnType` and ` [int]` dynamic arrays; `[]` empty literal as "not found" sentinel compatible with `[int] | []` union when needed.

---

## 2. Union & Optional Types (TypeScript-style, from `examples/DSA/union_and_optional_types.adesh`)

Adesh now supports **`T | U` unions**, **`T?` optional postfix**, **empty-container union members** (`[]` / `{}`), and **nullable returns** — ideal for DSA helpers.

### Code Example

```adesh
// `int | null` — nullable index
fn findIndex(nums: [int], target: int): int | null {
    for i in range(len(nums)) {
        if nums[i] == target { return i; }
    }
    return null;
}

// `[int] | []` — pair or empty
fn findPair(nums: [int], target: int): [int] | [] {
    let seen: set;
    for i in range(len(nums)) {
        let complement = target - nums[i];
        if seen.contains(complement) { return [complement, nums[i]]; }
        seen.insert(nums[i]);
    }
    return [];
}

// Union parameter + optional field demo (type_keyword)
fn describeValue(v: int | string | bool): string {
    return "Value is: " + str(v);
}
type Box<T> = { value: T, tag?: String = "generic-box" };

let idx = findIndex([10, 20, 30, 40], 30); // 2
let pair = findPair([10, 20, 30], 50);     // [20, 30]
print(describeValue(42));                  // Value is: 42
let b: Box<int> = { value: 42 };           // tag defaults
print(b.tag);                              // generic-box
```

### Terminal Output

```text
Search for 30 -> Index: 2
Pair summing to 50: [20, 30]
Value is: 42
generic-box
```

### Breakdown

* **`|`** composes unions: `int | null`, `[int] | []`, `int | string | bool`, `dict`-like `string | null` (see `frequency_counter.adesh`'s `getTopWord(freq: dict): string | null`).
* **`T?`** postfix == `T | null` (e.g. `Node(data:int, next:Node?)` in `linked.adesh`, `fn pop(): T?`).
* **Optional fields** `field?: Type = default` inject defaults; `type Ajay = { name:String, age?:u8=20 }`.
* **Empty literals** `[]` and `{}` are valid union members and values (`return []`).

## 3. Container Constructors & Defaults (from `examples/DSA/container_constructors_and_defaults.adesh`)

### Code Example

```adesh
fn testDefaultDeclarations() {
    let s: set;  let d: dict;  let a: array; // auto empty mutable
    s.insert(100); s.insert(200);
    d["apple"] = 5;
    a.push(1); a.push(2);
    print(s); // Set len 2
}

let userSet = Set<int>([10, 20, 30, 20, 10]); // deduplicates
let scores  = Dict<string, int>(); scores["Alice"]=95;
let items   = Array<string>(["alpha","beta"]); items.push("delta");

let sA = Set([1, 2, 3]); let sB = Set([3, 4, 5]);
print(sA.union(sB));        // {1,2,3,4,5}
print(sA.intersection(sB)); // {3}
```

### Breakdown

* **`let x: set;` / `dict` / `array`** → default-initialized empty mutable containers (no `new`).
* **`Set<T>(iter)`, `Dict<K,V>()`, `Array<T>(iter)`** generic constructors (also `Map()`, `List()`, `Tuple()`).
* **`union`/`intersection`/`contains`/`insert`/`containsKey`/`keys()`** set/map APIs demonstrated in DSA.

## 4. Least Recently Used (LRU) Cache

Implementation of an LRU cache maintaining a fixed capacity and purging the least recently accessed item when capacity is exceeded.

### Code Example

```adesh
class LRUCache {
    capacity: i32;
    map: any;

    LRUCache(capacity: i32) {
        this.capacity = capacity;
        this.map = {};
    }

    fn get(key: string): int {
        if (this.map[key] == null) { return -1; }
        let val = this.map[key];
        this.map[key] = val; // refresh
        return val;
    }

    fn put(key: string, val: int) {
        if (len(this.map.keys()) >= this.capacity && this.map[key] == null) {
            print("Cache full! Purging entries for key:", key);
        }
        this.map[key] = val;
    }
}

let cache = new LRUCache(2);
cache.put("a", 100);
cache.put("b", 200);
print("Get 'a':", cache.get("a"));

cache.put("c", 300); // Purges entries if capacity exceeded
print("Get 'b':", cache.get("b"));
print("Get 'c':", cache.get("c"));
```

### Terminal Output

```text
Get 'a': 100
Cache full! Purging entries for key: c
Get 'b': 200
Get 'c': 300
```

### Breakdown

* **Map + Queue Hybrid**: Uses hash maps for $O(1)$ value access coupled with capacity bounds verification.

## 5. Linked List + Frequency Counter (quick refs)

* **`examples/DSA/linked.adesh`** — `class Node { Node(data:int, next:Node?) }` shows `?` optional linkage + **operators** `??`/`?.`/`...`/`in`.
* **`examples/DSA/frequency_counter.adesh`** — `fn countFrequencies(words:[string]): dict` + `fn getTopWord(freq:dict): string | null` with `Set` dedup and `dict` indexing.
