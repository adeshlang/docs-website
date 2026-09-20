---
id: collections
title: Collections Library
sidebar_label: Collections
---

# Collections Library

The **Collections** builtin library provides 15 high-performance, memory-safe data structures built around AdeshLang's ownership/RAII model — no garbage collector required. It ships as the `Collections` namespace with one constructor per type, plus fluent array methods `arr.map(fn)`, `arr.filter(fn)`, and `arr.reduce(fn, initial)`. All types are available identically across every backend (Interpreter, Bytecode VM, JIT, Native JIT, AOT, WASM).

## Namespace

| Name | What it provides |
| :--- | :--- |
| `Collections` | The namespace: 15 constructor functions (`Vec`, `Slice`, `HashMap`, `HashSet`, `VecDeque`, `BTreeMap`, `BTreeSet`, `BinaryHeap`, `PriorityQueue`, `BitSet`, `RingBuffer`, `Queue`, `Stack`, `OrderedMap`, `OrderedSet`) |
| `array.map(fn)` | Method — transform each element |
| `array.filter(fn)` | Method — keep matching elements |
| `array.reduce(fn, initial?)` | Method — fold elements to a single value |

## Importing the library

```adesh
import Collections;              // or import "std:Collections" as Collections;
```


## Generic Type Safety Compatibility

All `Collections` data structures support compile-time and runtime generic type annotations (`<T>`, `<K, V>`). Supplying generic parameters ensures production-grade type safety by validating and coercing elements inserted into the collection:

```adesh
import Collections;

// Single generic parameter <T>
let numbers = Collections.Vec<u8>();
let set = Collections.HashSet<string>();
let stack = Collections.Stack<i32>();

// Dual generic parameters <K, V>
let map = Collections.HashMap<u8, bool>();
let cache = Collections.BTreeMap<string, f64>();
let pq = Collections.PriorityQueue<string, f64>();
```

## Selection guide

| Requirement | Constructor | Complexity |
| :--- | :--- | :--- |
| Dynamic growable sequence | `Collections.Vec<T>()` | `O(1)` amortized push/pop, `O(1)` access |
| Non-owning view of a sequence | `Collections.Slice(arr, start?, end?)` | `O(1)` index |
| Double-ended queue | `Collections.VecDeque<T>()` | `O(1)` push/pop at both ends |
| Fast key-value mapping | `Collections.HashMap<K, V>()` | expected `O(1)` |
| Unique value set | `Collections.HashSet<T>()` | expected `O(1)` |
| Sorted key-value mapping | `Collections.BTreeMap<K, V>()` | `O(log N)` |
| Sorted unique set | `Collections.BTreeSet<T>()` | `O(log N)` |
| Max-heap | `Collections.BinaryHeap<T>()` | `O(log N)` push/pop, `O(1)` peek |
| Explicit priority queue | `Collections.PriorityQueue<T, P>()` | `O(log N)` push/pop |
| Compact bit array | `Collections.BitSet()` | `O(1)` set/test/clear |
| Fixed-capacity stream buffer | `Collections.RingBuffer(cap)` | `O(1)` push/pop |
| FIFO queue | `Collections.Queue<T>()` | `O(1)` enqueue/dequeue |
| LIFO stack | `Collections.Stack<T>()` | `O(1)` push/pop |
| Insertion-ordered map | `Collections.OrderedMap<K, V>()` | expected `O(1)` |
| Insertion-ordered set | `Collections.OrderedSet<T>()` | expected `O(1)` |

---

## `Vec` — dynamic array

```adesh
import Collections;

let v = Collections.Vec<i32>();
v.push(10);
v.push(20);
v.push(30);

print(v.len());          // 3
print(v.first());        // 10
print(v.last());         // 30
print(v.contains(20));   // true
print(v.indexOf(30));    // 2

v.insert(1, 15);         // [10, 15, 20, 30]
print(v.get(1));         // 15

print(v.remove(1));      // 15  (shifts left)
v.swapRemove(0);         // removes 10 by swapping with last (no shift)

v.reverse();             // in place
v.sort();                // ascending, in place
print(v.capacity());     // allocated capacity
v.clear();               // empty
```

| Method | Description |
| :--- | :--- |
| `push(val)` | Append to the end |
| `pop()` | Remove and return the last element (`null` if empty) |
| `get(idx)` / `set(idx, val)` | Indexed access |
| `insert(idx, val)` | Insert at `idx`, shifting the rest right |
| `remove(idx)` | Remove at `idx`, shifting the rest left |
| `swapRemove(idx)` | Remove at `idx` by swapping in the last element (no shift) |
| `first()` / `last()` | Ends of the array (`null` if empty) |
| `contains(val)` / `indexOf(val)` | Membership and position (`-1` if absent) |
| `reverse()` / `sort()` | In-place operations |
| `len()` / `capacity()` / `isEmpty()` | Size, allocated capacity, emptiness |
| `clear()` | Empty the vector |
| `iter()` / `toArray()` / `to_array()` | Copy as a plain array |

---

## `Slice` — non-owning view

```adesh
import Collections;

let src = [0, 1, 2, 3, 4, 5];
let sl = Collections.Slice(src, 1, 4);   // view of [1, 2, 3]

print(sl.len());        // 3
print(sl.first());      // 1
print(sl.last());       // 3
print(sl.get(0));       // 1
print(sl.contains(2));  // true
print(sl.toArray());    // [1, 2, 3]
```

| Method | Description |
| :--- | :--- |
| `len()` / `isEmpty()` | Size |
| `get(idx)` / `first()` / `last()` | Indexed access |
| `contains(val)` | Membership |
| `iter()` / `toArray()` | Copy as a plain array |

`Collections.Slice(array, start?, end?)` accepts a plain array, tuple, raw array, or dynamic array; `start` defaults to `0` and `end` to the collection length.

---

## Maps: `HashMap`, `BTreeMap`, `OrderedMap`

All three map types share the same method set. `HashMap` gives expected `O(1)` operations; `BTreeMap` keeps keys sorted (`O(log N)`); `OrderedMap` preserves insertion order.

```adesh
import Collections;

let map = Collections.HashMap();
map.insert("language", "AdeshLang");
map.insert("version", "1.0.0");

print(map.get("language"));       // AdeshLang
print(map.containsKey("version"));// true
print(map.len());                 // 2
print(map.keys());                // ["language", "version"]
print(map.values());              // ["AdeshLang", "1.0.0"]
print(map.entries());             // [["language", "AdeshLang"], ["version", "1.0.0"]]

print(map.remove("version"));     // 1.0.0
map.clear();
```

| Method | Description |
| :--- | :--- |
| `insert(key, val)` | Set a key (stringified) to a value |
| `get(key)` | Value for `key`, or `null` if absent |
| `containsKey(key)` | Membership |
| `remove(key)` | Remove and return the value, or `null` |
| `keys()` / `values()` | Keys and values as arrays |
| `entries()` / `iter()` | Array of `[key, value]` pairs |
| `len()` / `isEmpty()` | Size |
| `clear()` | Empty the map |

:::note
Map keys are **stringified** (via the runtime formatter), matching object-style semantics: `insert(1, "x")` and `insert("1", "x")` collide.
:::

---

## Sets: `HashSet`, `BTreeSet`, `OrderedSet`

`HashSet` is expected `O(1)`, `BTreeSet` is sorted (`O(log N)`), and `OrderedSet` preserves insertion order. All share the same API.

```adesh
import Collections;

let set = Collections.HashSet();
print(set.insert("apple"));    // true  (was absent)
print(set.insert("apple"));    // false (already present)
print(set.contains("apple"));  // true
print(set.len());              // 1
print(set.values());           // ["apple"]
print(set.remove("apple"));    // true
set.clear();
```

| Method | Description |
| :--- | :--- |
| `insert(val)` | Add; `true` if newly inserted |
| `contains(val)` | Membership |
| `remove(val)` | `true` if it was present |
| `values()` / `iter()` / `toArray()` | Elements as an array |
| `len()` / `isEmpty()` | Size |
| `clear()` | Empty the set |

---

## `VecDeque` — double-ended queue

```adesh
import Collections;

let dq = Collections.VecDeque();
dq.pushBack(20);
dq.pushFront(10);

print(dq.front());       // 10
print(dq.back());        // 20
print(dq.popFront());    // 10
print(dq.popBack());     // 20
print(dq.toArray());     // []
```

| Method | Description |
| :--- | :--- |
| `pushBack(val)` / `pushFront(val)` | Add at either end |
| `popBack()` / `popFront()` | Remove from either end (`null` if empty) |
| `front()` / `back()` | Peek either end |
| `get(idx)` | Indexed access |
| `len()` / `isEmpty()` | Size |
| `clear()` | Empty |
| `iter()` / `toArray()` | Copy as a plain array |

---

## `Queue` — FIFO

```adesh
import Collections;

let q = Collections.Queue();
q.enqueue("Task 1");
q.enqueue("Task 2");

print(q.front());       // Task 1
print(q.back());        // Task 2
print(q.dequeue());     // Task 1
print(q.isEmpty());     // false
```

| Method | Description |
| :--- | :--- |
| `enqueue(val)` | Add to the back |
| `dequeue()` | Remove from the front (`null` if empty) |
| `front()` / `back()` | Peek either end |
| `len()` / `isEmpty()` | Size |
| `clear()` | Empty |

---

## `Stack` — LIFO

```adesh
import Collections;

let s = Collections.Stack();
s.push("Page A");
s.push("Page B");

print(s.peek());     // Page B
print(s.pop());      // Page B
print(s.isEmpty());  // false
```

| Method | Description |
| :--- | :--- |
| `push(val)` | Push on top |
| `pop()` | Remove the top (`null` if empty) |
| `peek()` | Top without removing |
| `len()` / `isEmpty()` | Size |
| `clear()` | Empty |

---

## `BinaryHeap` — max-heap

The largest element is always at the top (`pop()` and `peek()` return the max).

```adesh
import Collections;

let heap = Collections.BinaryHeap();
heap.push(30);
heap.push(10);
heap.push(50);

print(heap.peek());    // 50
print(heap.pop());     // 50
print(heap.pop());     // 30
print(heap.pop());     // 10
print(heap.pop());     // null
```

| Method | Description |
| :--- | :--- |
| `push(val)` | Insert |
| `pop()` | Remove and return the maximum (`null` if empty) |
| `peek()` | Maximum without removing |
| `len()` / `isEmpty()` | Size |
| `clear()` | Empty |

---

## `PriorityQueue` — explicit priority scores

Items are popped in order of **highest priority value** (`push(val, priority)`).

```adesh
import Collections;

let pq = Collections.PriorityQueue();
pq.push("Low Priority Task", 1);
pq.push("Critical Security Patch", 100);
pq.push("Bug Fix", 50);

print(pq.pop());   // Critical Security Patch
print(pq.pop());   // Bug Fix
print(pq.pop());   // Low Priority Task
print(pq.pop());   // null
```

| Method | Description |
| :--- | :--- |
| `push(val, priority)` | Insert with a priority score |
| `pop()` | Remove and return the highest-priority item |
| `peek()` | Highest-priority item without removing |
| `len()` / `isEmpty()` | Size |
| `clear()` | Empty |

---

## `BitSet` — compact bit array

```adesh
import Collections;

let bs = Collections.BitSet();
bs.set(42);
bs.set(10);

print(bs.test(42));   // true
print(bs.test(10));   // true
print(bs.test(11));   // false

bs.clear(10);
print(bs.test(10));   // false
```

| Method | Description |
| :--- | :--- |
| `set(idx)` | Set bit `idx` |
| `clear(idx)` | Clear bit `idx` |
| `test(idx)` | `true` if bit `idx` is set |

---

## `RingBuffer` — fixed-capacity circular buffer

When full, `push` overwrites the oldest element and **returns the evicted value** (`null` if nothing was evicted).

```adesh
import Collections;

let ring = Collections.RingBuffer(2);
ring.push("event_1");
ring.push("event_2");

let evicted = ring.push("event_3");   // evicts event_1
print(evicted);                       // event_1
print(ring.len());                    // 2
print(ring.isFull());                 // true
print(ring.pop());                    // event_2
```

| Method | Description |
| :--- | :--- |
| `push(val)` | Add; returns the evicted element when full |
| `pop()` | Remove the oldest element |
| `len()` / `capacity()` | Current size / capacity |
| `isEmpty()` / `isFull()` | State checks |

---

## Array methods: `.map()`, `.filter()`, `.reduce()`

AdeshLang arrays provide higher-order transformation methods. They accept a native function, user function, bound method, or closure.

```adesh
let xs = [1, 2, 3, 4, 5];

let doubled = xs.map(fn(x) { return x * 2; });       // [2, 4, 6, 8, 10]
let evens = xs.filter(fn(x) { return x % 2 == 0; }); // [2, 4]
let sum = xs.reduce(fn(a, b) { return a + b; }, 0);  // 15

// Squares:
let squares = xs.map(fn(x) { return x * x; });
```

| Method | Signature | Description |
| :--- | :--- | :--- |
| `map` | `array.map(fn)` | Return a new array with `fn` applied to each element |
| `filter` | `array.filter(fn)` | Return a new array of elements for which `fn` is truthy |
| `reduce` | `array.reduce(fn, initial?)` | Fold left; without `initial` the first element is the seed and the fold starts at index 1 |

:::note
`reduce` over an **empty** array without an `initial` value is an error. Values can be compared for the sort/heap operations by numeric value first, then by string.
:::

---

## Complete example

A word-frequency counter and a task scheduler built from the collections:

```adesh
import Collections;

print("--- Word frequency (HashMap) ---");

let words = ["adesh", "lang", "adesh", "is", "fast", "lang"];
let freq = Collections.HashMap();

for w in words {
    let cur = freq.get(w);
    if cur == null {
        freq.insert(w, 1);
    } else {
        freq.insert(w, cur + 1);
    }
}
print(freq.entries());

print("--- Task scheduler (PriorityQueue) ---");

let tasks = Collections.PriorityQueue();
tasks.push("Send report", 2);
tasks.push("Fix outage", 10);
tasks.push("Update docs", 1);

while !tasks.isEmpty() {
    print("Running: " + tasks.pop());
}

print("--- Unique visitors (HashSet) ---");

let seen = Collections.HashSet();
for id in ["u1", "u2", "u1", "u3", "u2"] {
    seen.insert(id);
}
print("Unique users: " + str(seen.len()));
```

---

## Notes & edge cases

- **Zero GC**: collections own their elements and free them deterministically on drop (RAII).
- **Borrow safety**: values returned by `get`/`first`/`last`/`peek` are clones, safe to keep.
- **Keys are stringified** in all map/set types, so `1` and `"1"` are the same key.
- **`BinaryHeap` is a max-heap**; use a `PriorityQueue` with explicit scores when you need custom ordering.
- **`RingBuffer(cap)`** requires a capacity argument and auto-evicts the oldest element when full (`push` returns the evicted value).
- **Sorting/comparisons** order numeric values numerically and strings lexically; mixed/complex values compare as equal.
- Map/Set iteration (`entries`, `values`, `keys`) returns plain arrays — safe to pass to `map`/`filter`/`reduce`.

## Source & examples

- Implementation: `src/runtime/stdlib_src/collections/` (`collections_builtins.rs` for the 15 types, `array.rs` for `map`/`filter`/`reduce`)
- Runnable examples: `examples/Libraries/collections/` — `vec_examples.adesh`, `slice_examples.adesh`, `hashmap_examples.adesh`, `hashset_examples.adesh`, `vecdeque_examples.adesh`, `btreemap_examples.adesh`, `heap_priorityqueue_examples.adesh`, `bitset_ringbuffer_examples.adesh`, `queue_examples.adesh`, `stack_examples.adesh`, `ordered_collections.adesh`, `set_operations.adesh`, `iterator_examples.adesh`, `sorting.adesh`, `binary_search.adesh`, `frequency_counter.adesh`, `word_frequency.adesh`, `group_by.adesh`, `deduplicate.adesh`, `top_k.adesh`, `kth_largest_element.adesh`, `two_sum.adesh`, `sliding_window_max.adesh`, `priority_tasks.adesh`, `task_scheduler.adesh`, `cache_example.adesh`, `lru_cache_example.adesh`, `graph_adjacency_map.adesh`, `adjacency_list.adesh`, `graph_traversal.adesh`, `bfs.adesh`, `dfs.adesh`, `nested_collections.adesh`, `ownership_collections.adesh`, `borrowing_collections.adesh`

## Related

- [Builtin Libraries Overview](overview)
- [Built-in Functions](builtins) — the global `map`, `filter`, `reduce` reference
- [Collections (Learn)](/learn/collections) — arrays, objects, tuples, and functional methods
- [Standard Library Overview](overview)
