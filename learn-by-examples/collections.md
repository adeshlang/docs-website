---
id: collections
title: Arrays, Tuples & Collections
sidebar_label: Arrays & Collections
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Arrays, Tuples & Collections

<FeatureStatus status="STABLE" details="Array literals, global and method-style map/filter/reduce functional transforms, and stdlib Collections (HashMap, HashSet, VecDeque)" />

AdeshLang includes built-in dynamic arrays, functional transformation operations (`map`, `filter`, `reduce`), and high-performance collection primitives via `import Collections;`.

---

## 1. Functional Transformations (`.map()`, `.filter()`, `.reduce()`)

Arrays in AdeshLang support functional transformations via fluent array methods (`arr.map(fn)`, `arr.filter(fn)`, `arr.reduce(fn, init)`). These higher-order methods process collections immutably without mutating the source buffers and can be chained seamlessly.

### Code Example

```adesh
let numbers = [10, 15, 20, 25, 30];
print("Initial array:", numbers);
print("First element [0]:", numbers[0]);
print("Array length:", len(numbers));

// 1. Filtering elements
let evens = numbers.filter(fn(n) { return n % 2 == 0; });
print("Filtered evens:", evens);

// 2. Mapping / transforming elements
let doubled = evens.map(fn(n) { return n * 2; });
print("Doubled evens:", doubled);

let tripled = numbers.map(fn(n) { return n * 3; });
print("Tripled numbers:", tripled);

// 3. Reducing elements to a single value
let sumTotal = doubled.reduce(fn(acc, val) { return acc + val; }, 0);
print("Reduced sum:", sumTotal);

let total = numbers.reduce(fn(acc, val) { return acc + val; }, 0);
print("Sum total:", total);

// 4. Method chaining
let chainedResult = numbers
    .filter(fn(n) { return n >= 20; })
    .map(fn(n) { return n * 2; })
    .reduce(fn(acc, val) { return acc + val; }, 0);
print("Chained result (filter >= 20 -> double -> sum):", chainedResult);
```

### Terminal Output

```text
Initial array: [10, 15, 20, 25, 30]
First element [0]: 10
Array length: 5
Filtered evens: [10, 20, 30]
Doubled evens: [20, 40, 60]
Tripled numbers: [30, 45, 60, 75, 90]
Reduced sum: 120
Sum total: 100
Chained result (filter >= 20 -> double -> sum): 150
```

### Breakdown

* **`arr.map(fn)`**: Applies callback function `fn` to each item, producing a new transformed array with preserved element order.
* **`arr.filter(fn)`**: Evaluates boolean predicate `fn`, retaining items where `fn` returns `true`.
* **`arr.reduce(fn, init)`**: Combines array elements into a single accumulated result starting from `init`.

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
