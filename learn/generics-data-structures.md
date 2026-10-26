---
id: generics-data-structures
title: Generics & the Data Structures Library
sidebar_label: 18. Generics & Data Structures
---

# Generics & the Data Structures Library

Two ideas make code reusable at scale: **generics** (write one function that
works for any type) and the **Data Structures library** (ready-made
HashMap, VecDeque, stacks, queues, and heaps). Both have rich real examples —
[`examples/generics/`](https://github.com/adeshlang/adeshlang/tree/main/examples/generics)
and
[`examples/Libraries/collections/`](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/collections).

## Generics: functions that work on any type

```adesh
fn identity<T>(value: T): T {
    return value;
}

let num: int = identity<int>(100);
let str: string = identity<string>("Adesh Generics");
print(num);
print(str);
```

**Output:**
```
100
Adesh Generics
```

From [`examples/generics/01_basic_generics.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/generics/01_basic_generics.adesh).

## Generic type aliases

You can parameterize a type alias, like a pair/tuple:

```adesh
type Pair<A, B> = { first: A; second: B };

fn makePair<A, B>(first: A, second: B): Pair<A, B> {
    return { first: first, second: second };
}

let pair: Pair<int, string> = makePair<int, string>(1, "First Element");
print("first =", pair.first, "| second =", pair.second);
```

**Output:**
```
first = 1 | second = First Element
```

## Generic classes

```adesh
class BoxHolder<T> {
    BoxHolder(val: T) {
        this.value = val;
    }

    fn getValue(): T {
        return this.value;
    }
}

let numBox = new BoxHolder(42);
print("Boxed value:", numBox.getValue());
```

**Output:**
```
Boxed value: 42
```

The same class works for strings, numbers, or any type you give it.

## The Collections library

The `Collections` namespace brings production data structures. All examples
below come straight from `examples/Libraries/collections/`.

### HashMap — key → value lookup

```adesh
import Collections;

let map = Collections.HashMap();
map.insert("name", "Adesh");
map.insert("author", "Ajay");
map.insert("year", 2026);

print("Len:", map.len());
print("Get 'name':", map.get("name"));
print("Contains 'author':", map.containsKey("author"));
print("Keys:", map.keys());
print("Removed 'author':", map.remove("author"));
print("Contains after remove:", map.containsKey("author"));
```

**Output:**
```
Len: 3
Get 'name': Adesh
Contains 'author': true
Keys: [name, author, year]
Removed 'author': Ajay
Contains after remove: false
```

### VecDeque — a double-ended queue

```adesh
import Collections;

let deque = Collections.VecDeque();
deque.pushBack(10);
deque.pushBack(20);
deque.pushFront(5);
deque.pushFront(1);

print("Length: ", deque.len());
print("Pop Front: ", deque.popFront());   // 1
print("Pop Back: ", deque.popBack());     // 20
```

**Output:**
```
Length: 4
Pop Front: 1
Pop Back: 20
```

### HashSets, stacks, queues, heaps

The library also provides `HashSet` (unique elements with set operations),
a stack (`push`/`pop`), a queue, and a priority heap. A quick tour from
`set_operations.adesh`, `stack_examples.adesh`, and
`heap_priorityqueue_examples.adesh`:

```adesh
import Collections;

// HashSet: uniqueness is the point
let set = Collections.HashSet();
set.add("a");
set.add("b");
set.add("a");               // duplicate — ignored
print("Set length:", set.len());
print("Has 'a':", set.contains("a"));

// Stack: last-in, first-out
let stack = Collections.Stack();
stack.push(1);
stack.push(2);
print("Stack pop:", stack.pop());   // 2

// Priority queue: biggest wins
let heap = Collections.Heap();
heap.push(3);
heap.push(9);
heap.push(1);
print("Heap peek:", heap.peek());   // 9
```

**Output:**
```
Set length: 2
Has 'a': true
Stack pop: 2
Heap peek: 9
```

## Real-world algorithms from the folder

The collections examples aren't toy demos — they solve real problems:

| File | Problem it solves |
|------|-------------------|
| `two_sum.adesh` | classic Two-Sum via HashMap |
| `word_frequency.adesh` | count words in text with HashMap |
| `lru_cache_example.adesh` | LRU cache (HashMap + mechanics) |
| `bfs.adesh` / `dfs.adesh` | graph traversal |
| `kth_largest_element.adesh`, `top_k.adesh` | heaps for ranks |
| `binary_search.adesh`, `sorting.adesh` | search & sort |
| `adjacency_list.adesh`, `graph_adjacency_map.adesh` | graph modeling |

A taste of `word_frequency.adesh` (word counting):

```adesh
import Collections;

fn countWords(lines) {
    let freq = Collections.HashMap();
    for line in lines {
        for word in line.split(" ") {
            let w = word.trim();
            if w != "" {
                freq.insert(w, (freq.get(w) ?? 0) + 1);
            }
        }
    }
    return freq;
}

let freq = countWords([
    "ad adesh adesh",
    "adi",
    "alpha beta",
]);
print("'adesh' count:", freq.get("adesh"));
print("'ad' count:", freq.get("ad"));
```

**Output:**
```
'adesh' count: 2
'ad' count: 1
```

## Practice

Build a **to-do tracker** with a HashMap keyed by task ID:

```adesh
import Collections;

let tasks = Collections.HashMap();
tasks.insert(1, "Write docs");
tasks.insert(2, "Review PR");

let nextId = 3;
tasks.insert(nextId, "Ship release");

print("Total tasks:", tasks.len());
print("Task 2:", tasks.get(2));
tasks.remove(2);
print("After removing #2:", tasks.len());
```

**Output:**
```
Total tasks: 3
Task 2: Review PR
After removing #2: 2
```

## Summary

✅ **You learned:**
- Generics: `fn identity<T>(value: T): T`
- Generic type aliases (`type Pair<A, B>`) and classes (`class Box<T>`)
- `Collections.HashMap` for key/value lookup
- `VecDeque`, `HashSet`, `Stack`, `Queue`, and `Heap`
- Real algorithms in the examples folder (Two-Sum, word frequency, LRU, BFS)

## Next Step

Programs grow — so let's organize them into **modules and imports**.
Continue to **[Modules & Imports](/learn/modules-imports)** →
