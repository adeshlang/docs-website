---
id: basics
title: Language Basics
description: Core syntax, variables, expressions, blocks, comments, and fundamental patterns in AdeshLang.
sidebar_label: Basics
---

# Language Basics

This page introduces the everyday syntax and structure used in almost every AdeshLang program. It explains the fundamental building blocks that make complex programs possible.

---

## Your first program

```adesh
print("Hello, World!");
```

This is the simplest form of a working AdeshLang script. A program can start by emitting output, evaluating a value, or defining reusable logic.

---

## File style and statement conventions

AdeshLang programs typically use `.adesh` files and follow a familiar block-based structure.

### Core conventions

- files use the `.adesh` extension
- statements are usually terminated with `;`
- blocks use braces like `{ ... }`
- comments use `//`
- indentation is used for readability and organization

```adesh
// This is a comment.
let message = "Hi";

if message != null {
    print(message);
}
```

A style that is easy to scan visually is important in any language, especially when programs grow from a few lines into larger systems.

---

## Variables and binding

Variables are declared using `let`.

```adesh
let x = 42;
let name = "Alice";
```

### Optional explicit type annotations

```adesh
let count: i64 = 100;
let price: f64 = 19.99;
let active: bool = true;
let label: string = "Ready";
```

This can improve clarity when the type contract matters, especially around APIs and structured software.

### Multi-Variable Declarations & Variable Swapping

AdeshLang supports declaring and assigning multiple variables concurrently without requiring tuple parentheses `()`:

```adesh
// Multi-variable declaration
let a, b, c = 10, 20, 30;

// Typed multi-variable declaration
let x: i32, y: f64 = 100, 3.14159;

// Variable swapping without temporary variables
a, b = b, a; // Swaps 'a' and 'b' safely
```

RHS expressions in multi-variable assignments and swaps are evaluated **first** into zero-cost temporary storage before variable bindings are updated, ensuring complete ownership and memory safety during variable swaps.

---

## Primitive values

AdeshLang supports the usual scalar data types.

```adesh
let n = 42;             // integer
let pi = 3.14159;       // floating-point value
let ok = true;          // boolean
let message = "Adesh"; // string
let missing = null;     // no value
```

### Numeric literal syntax

```adesh
let dec = 42;
let hex = 0xFF;
let bin = 0b1010;
let exp = 1.2e3;

let small = 200u8;
let signed = -10i32;
```

This makes it easy to work with both general numbers and precise binary or fixed-width values.

---

## Collections and composite values

AdeshLang includes several collection types for grouping related values. The most commonly used are arrays, tuples, and objects. Arrays are the primary container for ordered sequences, while objects model named records and tuples represent fixed-position data.

### Arrays

Arrays are ordered, indexable collections of values. They are the core data structure for lists, buffers, results, and nested data. In AdeshLang, array literals are written with square brackets, and the first element is at index `0`.

```adesh
let values = [1, 2, 3, 4];
let names = ["Ada", "Linus", "Grace"];
let mixed = [1, "two", true, 3.14];
```

#### Creating arrays

```adesh
let empty = [];
let numbers = [10, 20, 30, 40, 50];
let words = ["hello", "world", "from", "Adesh"];
let nested = [[1, 2], [3, 4], [5, 6]];
```

The array literal form is the default and works well for general list-building. Arrays may contain values of mixed types, although typed arrays are also supported when a program wants stronger constraints.

#### Accessing elements

```adesh
let fruits = ["apple", "banana", "cherry"];

print(fruits[0]); // apple
print(fruits[1]); // banana
print(fruits[2]); // cherry
```

Indexing uses zero-based numbering. This is the same convention used across many modern languages and makes it natural to work with sequences in loops and pipelines.

```adesh
let numbers = [10, 20, 30, 40];
print(numbers[3]); // 40
```

If an index is out of range, AdeshLang raises an error or reports the access as invalid, depending on the backend and the execution mode. This helps catch bugs before they silently corrupt logic.

```adesh
let a = [10, 20, 30];

try {
    print(a[99]);
} catch (e) {
    print("index out of bounds:", e);
}
```

#### Reading length and size

The built-in `len(...)` helper returns the count of elements in an array.

```adesh
let numbers = [5, 10, 15, 20];
print(len(numbers)); // 4
```

Arrays also support direct length-style access patterns depending on the runtime surface in use:

```adesh
let numbers = [7, 8, 9];
print(numbers.length);
```

This is useful when checking whether a collection is empty, iterating in range-based loops, or validating data before processing.

```adesh
let values = [1, 2, 3];
if len(values) > 0 {
    print("array is not empty");
}
```

#### Mutating arrays

Arrays are mutable: values can be replaced or appended after creation.

```adesh
let colors = ["red", "green", "blue"];
colors[1] = "yellow";
print(colors); // ["red", "yellow", "blue"]
```

Appending a value adds it to the end of the array.

```adesh
let nums = [1, 2, 3];
nums.push(4);
print(nums); // [1, 2, 3, 4]
```

Removing the last item is equally common:

```adesh
let nums = [1, 2, 3, 4];
let last = nums.pop();
print(last); // 4
print(nums); // [1, 2, 3]
```

You can also add and remove from the front of the list:

```adesh
let nums = [2, 3, 4];
nums.unshift(1);
print(nums); // [1, 2, 3, 4]

let first = nums.shift();
print(first); // 1
print(nums); // [2, 3, 4]
```

These operations are useful for queue-like data, buffering, or processing streams where the head or tail of the list matters.

#### Searching and comparing values

AdeshLang provides pattern-based checks for array membership and positions.

```adesh
let nums = [10, 20, 30, 40];

print(nums.includes(20)); // true
print(nums.includes(999)); // false
print(nums.indexOf(30)); // 2
print(nums.indexOf(999)); // -1
```

The `includes` call checks whether a value exists; `indexOf` returns the first matching index, or `-1` when the item is not present.

```adesh
let names = ["Ada", "Grace", "Linus"];
print(names.includes("Grace")); // true
print(names.indexOf("Linus")); // 2
```

#### Slicing, joining, and transformations

Arrays can be sliced into subranges and joined into strings.

```adesh
let nums = [10, 20, 30, 40, 50];
let slice = nums.slice(1, 4);
print(slice); // [20, 30, 40]

print(nums.join(", ")); // "10, 20, 30, 40, 50"
```

The `slice(start, end)` pattern takes a contiguous portion of the array. This is valuable for working with partial datasets without modifying the original collection.

Arrays also mesh naturally with functional style and iteration operations:

```adesh
let nums = [1, 2, 3, 4];
let doubled = map(nums, fn(x) {
    return x * 2;
});

print(doubled); // [2, 4, 6, 8]
```

This shows the same list can be processed declaratively instead of manually looping over every element.

#### Typed and fixed-size arrays

When a program needs stronger guarantees, arrays can be declared with a specific element type and, in some cases, a fixed capacity.

```adesh
let ints: [i32] = [1, 2, 3, 4];
let bytes: [u8; 4] = [10, 20, 30, 40];
```

This signals intent to the compiler and runtime. A typed array is useful when a function is meant to operate on integers, bytes, or other machine-level values. Fixed-capacity arrays are useful for bounded buffers and systems-style data layouts.

```adesh
let values: [i32; 6] = [1, 2, 3, 4];
print(values.length); // 4
print(values.capacity); // 6
```

These forms are especially relevant in performance-sensitive code, memory-heavy workloads, and backend-specific optimization scenarios.

#### Nested arrays

Arrays can hold other arrays, which is a natural way to represent matrices, tables, and grouped records.

```adesh
let matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

print(matrix[1][2]); // 6
```

Nested arrays are common in scientific code, game grids, table-driven data, and any workload that needs multiple dimensions of ordered values.

#### Spread syntax

A common pattern is to build an array by combining existing ones:

```adesh
let xs = [1, 2, 3];
let ys = [4, 5, 6];
let merged = [...xs, ...ys];
print(merged); // [1, 2, 3, 4, 5, 6]
```

This is especially useful for composing configuration data, combining results from multiple stages, or passing multiple values into a function or literal.

#### Practical array rules

- Arrays are zero-indexed.
- `len(arr)` gives the number of elements.
- Arrays can be mutated in place.
- Out-of-range indexing is rejected instead of silently producing garbage.
- Nested arrays are valid and often used for structured data.
- Arrays are one of the primary building blocks for data processing and control flow.

Arrays are foundational in AdeshLang: they are the language's standard way to store lists, process data in order, and form larger structured values.

### Tuples

```adesh
let point = (10, 20);
let data = (1, "two", true);
```

### Objects

```adesh
let user = {
    name: "Ravi",
    age: 30,
    active: true
};

print(user.name);
```

### Spread composition

```adesh
let xs = [1, 2, 3];
let ys = [...xs, 4, 5];
print(ys);
```

Collections are one of the main ways programs represent larger real-world data.

---

## Expressions and operators

AdeshLang supports the usual arithmetic and comparison operations.

```adesh
let x = 10;
let y = 5;

let sum = x + y;
let diff = x - y;
let product = x * y;
let quotient = x / y;
let remainder = x % y;

let ok = x > y && x != 0;
```

These operators are the heart of conditionals, data processing, and calculations within a program.

---

## Control flow

### If statements

```adesh
let score = 85;

if score >= 90 {
    print("Excellent");
} elif score >= 70 {
    print("Good");
} else {
    print("Try again");
}
```

### Loops

```adesh
for i in 1..5 {
    print(i);
}
```

Range-based loops are a very common pattern in AdeshLang code and a central part of beginner-friendly iteration.

---

## Functions

Functions organize logic and allow reuse.

```adesh
fn add(a: i64, b: i64): i64 {
    return a + b;
}

let total = add(10, 20);
print(total);
```

This is the basis of modularity: code becomes reusable rather than duplicated.

---

## Common built-ins

AdeshLang includes a set of runtime helpers for everyday work.

```adesh
print(type(42));          // "number"
print(len([1, 2, 3]));    // 3
print(hasKey({ a: 1 }, "a"));

let doubled = map([1, 2, 3], fn(x) {
    return x * 2;
});

print(doubled);
```

These helpers are designed to make common tasks smaller and easier to reason about in real programs.

---

## Writing good AdeshLang code

A typical AdeshLang program follows a straightforward flow:

1. declare variables
2. build functions
3. apply conditionals
4. iterate through data
5. print or return a result

This pattern keeps code readable and predictable as it grows.

### Beginner best practices

- choose descriptive variable names
- keep each function focused on one job
- prefer explicit types when semantics matter
- test small snippets before larger programs
- read compiler messages carefully

---

## Next steps

Continue with the deeper language reference:

- [Type System](/language-guide/type-system)
- [Functions](/language-guide/functions)
- [Control Flow](/language-guide/control-flow)
- [Semantics and Rules](/language-guide/semantics-rules)
- [Modules and Imports](/language-guide/modules-imports)

Once these basics feel natural, the rest of the language becomes significantly easier to understand and extend.
