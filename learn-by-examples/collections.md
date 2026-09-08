---
id: collections
title: Arrays, Tuples & Collections
sidebar_label: Arrays & Collections
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Arrays, Tuples & Collections

<FeatureStatus status="STABLE" details="Array literals, map/filter/reduce functional transforms, and stdlib Collections (HashMap, HashSet, VecDeque)" />

AdeshLang includes built-in dynamic arrays, functional iteration operations (`map`, `filter`, `reduce`), and high-performance collection primitives via `import Collections;`.

---

## 1. Array Operations & Functional Transformations (`map`, `filter`, `reduce`)

Arrays are dynamic, indexable sequences of values. Higher-order functions process arrays functionally without mutating original buffers.

### Code Example

```adesh
let numbers = [10, 15, 20, 25, 30];
print("Initial array:", numbers);
print("First element [0]:", numbers[0]);
print("Array length:", numbers.len());

// 1. map: transform each element
let doubled = map(numbers, fn(n) { return n * 2; });
print("Mapped (x2):", doubled);

// 2. filter: retain elements matching predicate
let evens = filter(numbers, fn(n) { return n % 2 == 0; });
print("Filtered (evens):", evens);

// 3. reduce: accumulate into scalar result
let sum = reduce(numbers, fn(acc, val) { return acc + val; }, 0);
print("Reduced (sum):", sum);
```

### Terminal Output

```text
Initial array: [10, 15, 20, 25, 30]
First element [0]: 10
Array length: 5
Mapped (x2): [20, 30, 40, 50, 60]
Filtered (evens): [10, 20, 30]
Reduced (sum): 100
```

### Breakdown

* **`map(arr, fn)`**: Applies callback function `fn` to each item, producing a new transformed array.
* **`filter(arr, fn)`**: Evaluates boolean predicate `fn`, retaining items where `fn` returns `true`.
* **`reduce(arr, fn, init)`**: Combines array elements into a single accumulated result starting from `init`.

---

## 2. Standard Library Collections (`HashMap`, `HashSet`, `VecDeque`)

The `Collections` standard library (`import Collections;`) provides 15 specialized data structures with full generic type compatibility (`<T>`, `<K, V>`).

### Code Example

```adesh
import Collections;

// 1. HashMap: Key-Value storage with generics <string, i32>
let scores = Collections.HashMap<string, i32>();
scores.insert("Alice", 95);
scores.insert("Bob", 88);
scores.insert("Charlie", 92);

print("Alice's score:", scores.get("Alice"));
print("HashMap size:", scores.len());

// 2. HashSet: Unique set membership with generics <string>
let set = Collections.HashSet<string>();
set.insert("apple");
set.insert("banana");
set.insert("apple"); // Duplicate skipped automatically

print("Set contains 'apple':", set.contains("apple"));
print("Set contains 'orange':", set.contains("orange"));
print("Set unique count:", set.len());

// 3. VecDeque: Double-ended queue with generics <string>
let queue = Collections.VecDeque<string>();
queue.push_back("job_1");
queue.push_back("job_2");
print("Dequeued front item:", queue.pop_front());
```

### Terminal Output

```text
Alice's score: 95
HashMap size: 3
Set contains 'apple': true
Set contains 'orange': false
Set unique count: 2
Dequeued front item: job_1
```

### Breakdown

* **`Collections.HashMap()`**: $O(1)$ key-value map supporting `.insert(key, val)`, `.get(key)`, and `.len()`.
* **`Collections.HashSet()`**: Unique element collection eliminating duplicates automatically.
* **`Collections.VecDeque()`**: Double-ended queue supporting fast $O(1)$ push/pop operations from both ends.
