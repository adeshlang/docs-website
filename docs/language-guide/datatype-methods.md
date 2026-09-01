---
id: datatype-methods
title: Built-in Data Type Methods
sidebar_label: Type Methods & Iterators
description: Comprehensive reference for built-in methods on strings, arrays, hash maps, sets, numbers, and functional iterators in AdeshLang.
---

# Built-in Data Type Methods

AdeshLang provides an extensive suite of built-in methods on all core data types, enabling expressive functional programming and high-performance data manipulation.

---

## 1. String Methods

Strings in AdeshLang are UTF-8 encoded, immutable, and zero-allocation slice-friendly:

```adesh
let s = "  Hello, AdeshLang!  ";

// Length and inspection
let len = s.len();                        // Byte length
let char_count = s.chars().len();          // Unicode character count
let is_empty = s.is_empty();              // false

// Trimming & Case conversion
let trimmed = s.trim();                   // "Hello, AdeshLang!"
let upper = trimmed.to_uppercase();       // "HELLO, ADESHLANG!"
let lower = trimmed.to_lowercase();       // "hello, adeshlang!"

// Search & Substring
let has_adesh = trimmed.contains("Adesh"); // true
let starts = trimmed.starts_with("Hello"); // true
let ends = trimmed.ends_with("!");        // true
let index = trimmed.find("Adesh");        // Some(7)

// Splitting & Replacement
let parts = trimmed.split(", ");          // ["Hello", "AdeshLang!"]
let replaced = trimmed.replace("Adesh", "Rust"); // "Hello, RustLang!"
let slice = &trimmed[0..5];               // "Hello" (zero-copy string slice &str)
```

---

## 2. Array / Vec Methods

Arrays (`[T]`) and dynamic vectors support both imperative mutation and functional chaining:

```adesh
let mut numbers = [10, 20, 30, 40, 50];

// Basic Operations
numbers.push(60);                         // Append element
let last = numbers.pop();                 // Some(60)
numbers.insert(0, 5);                     // Insert at index 0: [5, 10, 20, 30, 40, 50]
let removed = numbers.remove(0);          // Remove at index 0: 5

// Querying
let count = numbers.len();                // 5
let contains_30 = numbers.contains(30);   // true
let first_opt = numbers.first();          // Some(10)
let last_opt = numbers.last();            // Some(50)

// In-place transformations
numbers.reverse();                        // [50, 40, 30, 20, 10]
numbers.sort();                           // [10, 20, 30, 40, 50]
```

### Functional Iterator Methods

```adesh
let nums = [1, 2, 3, 4, 5, 6];

// Map, Filter, and Fold
let doubled_evens = nums
    .filter(fn(x) => x % 2 == 0)
    .map(fn(x) => x * 2);                // [4, 8, 12]

let sum = nums.fold(0, fn(acc, x) => acc + x); // 21

// Finding and Matching
let first_large = nums.find(fn(x) => x > 4); // Some(5)
let all_positive = nums.all(fn(x) => x > 0); // true
let any_odd = nums.any(fn(x) => x % 2 != 0); // true
```

---

## 3. HashMap / Map Methods

Key-value hash collections with $O(1)$ amortized lookups:

```adesh
import { adesh_alloc::HashMap } from "adesh_alloc";

let mut user_scores = HashMap::new();

// Insertion and update
user_scores.insert("Alice", 95);
user_scores.insert("Bob", 88);

// Lookup
let alice_score = user_scores.get("Alice");   // Some(95)
let charlie = user_scores.get("Charlie");     // None
let score_or_default = user_scores.get_or("Bob", 0); // 88

// Membership & Size
let exists = user_scores.contains_key("Bob"); // true
let size = user_scores.len();                 // 2

// Iterating keys, values, and entries
for (key, val) in user_scores.entries() {
    print(f"{key}: {val}");
}

user_scores.remove("Bob");                    // Removes "Bob"
user_scores.clear();                          // Empties map
```

---

## 4. HashSet / Set Methods

Unordered collection of unique items:

```adesh
import { adesh_alloc::HashSet } from "adesh_alloc";

let mut set_a = HashSet::from([1, 2, 3, 4]);
let set_b = HashSet::from([3, 4, 5, 6]);

set_a.insert(5);
let is_member = set_a.contains(2);            // true

// Set Algebra
let union_set = set_a.union(&set_b);          // {1, 2, 3, 4, 5, 6}
let intersect = set_a.intersection(&set_b);   // {3, 4, 5}
let diff = set_a.difference(&set_b);          // {1, 2}
```

---

## 5. Numeric Primitive Methods

```adesh
let val = -42.75;

let absolute = val.abs();                     // 42.75
let rounded = val.round();                    // -43.0
let floor_val = val.floor();                  // -43.0
let ceil_val = val.ceil();                    // -42.0
let clamped = val.clamp(0.0, 100.0);          // 0.0

let sqrt_res = 144.0.sqrt();                  // 12.0
let pow_res = 2.0.pow(8.0);                   // 256.0
```
