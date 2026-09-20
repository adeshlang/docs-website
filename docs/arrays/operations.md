---
id: operations
title: Array Builtin Operations & API Reference
sidebar_label: Builtin Operations & API Reference
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Array Builtin Operations & API Reference

<FeatureStatus status="STABLE" />

AdeshLang includes a comprehensive standard library of built-in array methods for buffer mutation, querying, transformation, functional programming, and SIMD hardware acceleration.

---

## 1. Buffer Mutation & Stack Methods

These methods modify the array in place or return an updated array instance:

### `.push(val)` & `.append(val)`

Appends a new element `val` to the end of the array. Returns the new array length or array instance.

```adesh
let base: [i32; 16] = [10, 20, 30, 40];

base.push(50);
print("After push(50): ", base); // [10, 20, 30, 40, 50]

base = base.append(60);
print("After append(60): ", base); // [10, 20, 30, 40, 50, 60]
```

### `.pop()` & `.pop(n)`

Removes the last element (or last `n` elements) from the array and returns the removed element(s):

```adesh
let items = [10, 20, 30, 40, 50];

let popped_val = items.pop();
print("Popped single: ", popped_val); // 50
print("Remaining: ", items);         // [10, 20, 30, 40]

let popped_slice = items.pop(2);
print("Popped 2 elements: ", popped_slice); // [30, 40]
print("Remaining: ", items);                // [10, 20]
```

### `.unshift(val)` & `.shift()`

`unshift` prepends an element to the start of the array (index 0). `shift` removes and returns the first element from index 0:

```adesh
let queue = [10, 20, 30];

queue.unshift(5);
print("After unshift(5): ", queue); // [5, 10, 20, 30]

let first_item = queue.shift();
print("Shifted item: ", first_item); // 5
print("Remaining queue: ", queue);   // [10, 20, 30]
```

### `.insert(idx, val)` & `.remove(val)`

- `insert(idx, val)`: Inserts element `val` at target index `idx`, shifting subsequent elements right.
- `remove(val)`: Searches and removes the first occurrence of `val`:

```adesh
let arr = [10, 20, 40];

arr.insert(2, 30); // Insert 30 at index 2
print("After insert(2, 30): ", arr); // [10, 20, 30, 40]

arr.remove(20); // Remove element with value 20
print("After remove(20): ", arr);    // [10, 30, 40]
```

### `.set_index(idx, val)`

Replaces the element at target `idx` with `val`:

```adesh
let data = [10, 20, 30];
data.set_index(1, 99);
print("After set_index(1, 99): ", data); // [10, 99, 30]
```

### `.extend(other_arr)` & `.concat(other_arr)`

Appends all elements of `other_arr` onto the current array:

```adesh
let list1 = [1, 2, 3];
list1.extend([4, 5]);
print("After extend: ", list1); // [1, 2, 3, 4, 5]

let combined = list1.concat([6, 7]);
print("After concat: ", combined); // [1, 2, 3, 4, 5, 6, 7]
```

### `.clear()`

Empties all elements from the array, resetting length to 0 while preserving allocated capacity:

```adesh
let buffer = [1, 2, 3, 4, 5];
buffer.clear();
print("Cleared buffer: ", buffer); // []
print("Length: ", buffer.length); // 0
```

---

## 2. Functional & Transformation Builtins

AdeshLang supports functional transformations via both method calls (`nums.map(fn)`) and built-in global functions (`map(nums, fn)`, `filter(nums, fn)`, `reduce(nums, fn, init)`).

### `.map(fn)` / `map(arr, fn)`

Applies a mapping function `fn(x)` to each element, returning a new transformed array:

```adesh
let nums = [1, 2, 3, 4, 5];

let squared = nums.map(fn(x) { return x * x; });
print("Squared (method): ", squared); // [1, 4, 9, 16, 25]

let doubled = map(nums, fn(x) { return x * 2; });
print("Doubled (global): ", doubled); // [2, 4, 6, 8, 10]
```

### `.filter(fn)` / `filter(arr, fn)`

Evaluates predicate function `fn(x)` for each element, returning a filtered array of matching items:

```adesh
let values = [10, 15, 20, 25, 30];

let evens = values.filter(fn(x) { return x % 2 == 0; });
print("Evens (method): ", evens); // [10, 20, 30]

let odds = filter(values, fn(x) { return x % 2 != 0; });
print("Odds (global):  ", odds);  // [15, 25]
```

### `.reduce(fn, init)` / `reduce(arr, fn, init)`

Accumulates array elements into a single value starting from seed accumulator `init`:

```adesh
let numbers = [1, 2, 3, 4, 5];

let sum = numbers.reduce(fn(acc, val) { return acc + val; }, 0);
print("Sum total (method): ", sum); // 15

let product = reduce(numbers, fn(acc, val) { return acc * val; }, 1);
print("Product (global):   ", product); // 120
```

> ⚡ **Multi-Core Work-Stealing Parallelism**: For CPU-intensive data transformations across multiple CPU cores, use `import Parallel;` (`Parallel.map`, `Parallel.filter`, `Parallel.reduce`, `Parallel.sort`, `Parallel.sum`). See [Async & Concurrency](/docs/builtin/concurrency#6-high-speed-work-stealing-parallel-engine-import-parallel).


### `.slice(start, end)`

Extracts a shallow copy section of an array from `start` index up to (excluding) `end` index:

```adesh
let items = [10, 20, 30, 40, 50];

let sub = items.slice(1, 4);
print("Sub-slice [1..4]: ", sub); // [20, 30, 40]
```

---

## 3. Searching & Querying Builtins

### `.indexOf(val)` / `.index(val)` & `.includes(val)`

- `indexOf(val)` / `index(val)`: Returns zero-based index of `val`, or `-1` if not found.
- `includes(val)`: Returns `true` if `val` is present in the array:

```adesh
let fruits = ["apple", "banana", "cherry"];

print("indexOf('banana'): ", fruits.indexOf("banana")); // 1
print("includes('mango'):  ", fruits.includes("mango"));  // false
```

### `.count(val)`

Counts total occurrences of target value `val`:

```adesh
let repeats = [3, 1, 2, 3, 2, 3];
print("Count of 3: ", repeats.count(3)); // 3
```

### `.sort()` & `.reverse()`

- `.sort()`: Sorts primitive array elements in ascending order in place.
- `.reverse()`: Reverses element ordering in place:

```adesh
let unorganized = [3, 1, 4, 1, 5, 9];

unorganized.sort();
print("Sorted: ", unorganized); // [1, 1, 3, 4, 5, 9]

unorganized.reverse();
print("Reversed: ", unorganized); // [9, 5, 4, 3, 1, 1]
```

### `.join(separator)`

Joins string representation of array elements into a single string separated by `separator`:

```adesh
let tags = ["rust", "adesh", "compiler"];
let csv = tags.join(", ");
print("CSV string: ", csv); // "rust, adesh, compiler"
```

---

## 4. Hardware SIMD Acceleration

For numerical processing and vector math, AdeshLang provides SIMD vector
instructions leveraging hardware AVX2 / ARM Neon vector registers. Arrays
support **element-wise operators**, and the `Simd` namespace provides
reductions — all tested in the interpreter:

```adesh
import Simd;

let vec_a: [f32] = [1.0, 2.0, 3.0, 4.0];
let vec_b: [f32] = [5.0, 6.0, 7.0, 8.0];

// Parallel SIMD Vector Addition via element-wise operator
let vec_sum = vec_a + vec_b;
print("SIMD vector sum: ", vec_sum); // [6, 8, 10, 12]

// Reductions
let row = [1.0, 2.0, 3.0, 4.0];
let col = [4.0, 3.0, 2.0, 1.0];
print("SIMD dot:        ", Simd.dot(row, col));   // 20
print("SIMD mean:       ", Simd.mean([10.0, 20.0, 30.0])); // 20

// Instance API
let vx = Simd.vector(vec_a);
print("SIMD scale:      ", vx.scale(3.0)); // [3, 6, 9, 12]
```

---

## Runnable Example References

- [`examples/arrays/array_methods_interpreter.adesh`](https://github.com/adeshlang/adeshlang/tree/main/examples/arrays/array_methods_interpreter.adesh) — Full coverage of array methods.
- [`examples/arrays/advanced_array_ops.adesh`](https://github.com/adeshlang/adeshlang/tree/main/examples/arrays/advanced_array_ops.adesh) — Bounds check exception handling & capacity limits.
