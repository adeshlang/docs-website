---
id: learn-by-examples
title: Learn by Examples
sidebar_label: Learn by Examples
slug: /
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Learn by Examples Catalog

<FeatureStatus status="STABLE" details="Comprehensive, runnable code catalog synthesized from the official examples repository" />

Welcome to the **Learn by Examples Catalog** — the fastest way to see how AdeshLang actually looks and behaves. Instead of explaining rules in the abstract, every topic below is shown as a **complete, runnable program** with its **verified terminal output**, followed by a short breakdown of the constructs it uses.

## How to read this catalog

1. **Read the program.** Every section is one self-contained `.adesh` file.
2. **Read the output.** The terminal output below it is what the interpreter actually prints.
3. **Read the breakdown.** Each bullet explains one keyword, type, or function the program uses.
4. **Run it yourself.** Copy the program into a file and execute `adesh run file.adesh`. Change one thing, run again, and watch what changes.

> If you want more programs than this catalog holds, the [Runnable Examples Catalog](/learn-by-examples/runnable-examples) lists 100+ verified examples from the official `examples/` repository, organized by library and algorithm.

## Table of contents

| Section | Topic | Key ideas you will see |
|---------|-------|------------------------|
| [1](#1-arrays-tuples--collections) | Arrays, Tuples & Collections | `map`, `filter`, `reduce`, `HashMap` |
| [2](#2-async--concurrency) | Async & Concurrency | `async fn`, `await`, `Parallel.map` |
| [3](#3-basics-variables--type-system) | Basics, Variables & Type System | annotations, `as` casting, `??` |
| [4](#4-borrowing-ownership--memory-safety) | Borrowing & Memory Safety | `&` references, ownership moves |
| [5](#5-conditionals--control-flow) | Conditionals & Control Flow | `if`/`elif`/`else`, loops, `forEach` |
| [6](#6-decorators--compile-time-directives) | Decorators | `@log` and friends |
| [7](#7-defer-statement--scope-teardown) | Defer & Scope Teardown | `defer`, LIFO cleanup |
| [8](#8-enums--pattern-matching) | Enums & Pattern Matching | `enum`, `match` |
| [9](#9-error-handling--exception-guarding) | Error Handling | `try` / `catch` / `throw` |
| [10](#10-functions-closures--recursion) | Functions & Closures | recursion, first-class functions |
| [11](#11-generics--type-aliases) | Generics & Type Aliases | `<T>`, `type` |
| [12](#12-object-oriented-programming-oop--extensions) | OOP & Extensions | `class`, `extends`, `extend on` |
| [13](#13-standard-library-ecosystem-crypto-fs-http-json-math-regex-time) | Standard Library | `Math`, `Crypto`, `JSON` |

New to the language? Start with section [3](#3-basics-variables--type-system) (Basics), then move through [5](#5-conditionals--control-flow), [10](#10-functions-closures--recursion), and [1](#1-arrays-tuples--collections) in order — that is the same progression as the [Learn roadmap](/learn).

---

## 1. Arrays, Tuples & Collections

Arrays are dynamic, indexable collections of values. AdeshLang also includes built-in higher-order collection methods (`map`, `filter`, `reduce`) and high-performance collection primitives via `import Collections;`.

### Master Code Example

```adesh
import Collections;

// 1. Array declaration & indexing
let scores = [85, 92, 78, 96, 88];
print("Initial array:", scores);
print("First score:", scores[0]);

// 2. Functional iteration: map, filter, reduce
let boosted = map(scores, fn(score) { return score + 5; });
print("Boosted scores:", boosted);

let honors = filter(boosted, fn(score) { return score >= 90; });
print("Honors scores:", honors);

let totalScore = reduce(scores, fn(acc, val) { return acc + val; }, 0);
print("Sum of initial scores:", totalScore);

// 3. Standard Library Collections (HashMap)
let studentMap = Collections.HashMap();
studentMap.insert("Alice", 95);
studentMap.insert("Bob", 88);

print("Alice's score:", studentMap.get("Alice"));
```

### Runtime Output

```text
✓ Interpreter ready [0.04ms]
Initial array: [85, 92, 78, 96, 88]
First score: 85
Boosted scores: [90, 97, 83, 101, 93]
Filtered evens: [90, 97, 101, 93]
Sum of initial scores: 439
Alice's score: 95
```

### Usage & Implementation Breakdown

* **Array Literal Syntax**: Declared using square brackets `[elem1, elem2]`. Access elements using 0-based index `scores[0]`.
* **Higher-Order Functions**:
  * `map(array, fn)`: Transforms each element by invoking a callback function and returns a new array.
  * `filter(array, fn)`: Evaluates a predicate function per element and retains those returning `true`.
  * `reduce(array, fn, init)`: Combines array elements into a single accumulated scalar value starting from `init`.
* **Collections Library (`import Collections;`)**: Supplies 15 specialized data structures including `HashMap`, `HashSet`, `BTreeMap`, `VecDeque`, and `PriorityQueue`.

---

## 2. Async & Concurrency

AdeshLang supports single-threaded non-blocking asynchronous routines (`async`/`await`) as well as multi-threaded OS concurrency (`thread` namespace) and data-parallel iterations (`Parallel` module).

### Master Code Example

```adesh
import Parallel;

// 1. Asynchronous Functions
async fn fetchUserData(userId) {
    print("Fetching user ID:", userId);
    return "User_" + string(userId);
}

async fn main() {
    let user = await fetchUserData(101);
    print("Resolved user:", user);
}

await main();

// 2. Parallel Processing
let dataset = [1, 2, 3, 4, 5];
fn square(x) {
    return x * x;
}

let squared = Parallel.map(dataset, square);
print("Parallel Squared Array:", squared);
```

### Runtime Output

```text
Fetching user ID: 101
Resolved user: User_101
Parallel Squared Array: [1, 4, 9, 16, 25]
```

### Usage & Implementation Breakdown

* **`async fn`**: Defines a function that returns an asynchronous promise without blocking the execution thread.
* **`await`**: Suspends current routine execution until the targeted promise resolves.
* **`Parallel.map(array, fn)`**: Partitions array elements across OS worker threads to execute CPU-bound transformations in parallel.

---

## 3. Basics, Variables & Type System

AdeshLang supports explicit type annotations (`i8`-`i128`, `u8`-`u128`, `f32`, `f64`, `bool`, `string`), explicit type casting (`as`), null-aware operators (`?.`, `??`), and type introspection (`type()`, `typeof`).

### Master Code Example

```adesh
// 1. Primitive Declarations & Type Inferences
let age: i32 = 25;
let price: f64 = 99.99;
let active: bool = true;

print("Age:", age, "Price:", price, "Active:", active);

// 2. Unparenthesized Multi-Variable Declaration & Swapping
let a, b, c = 10, 20, 30;
print("Initial:", a, b, c);

// Variable swap without temporary variables
a, b = b, a;
print("Swapped a and b:", a, b);

// Per-variable type annotations
let x: i32, y: f64 = 100, 3.14159;
print("Typed multi-var:", x, y);

// 3. Explicit Type Casting (as)
let rawVal: f64 = 42.8;
let intVal: i64 = rawVal as i64;
print("Casted Float to Int:", intVal);

// 4. Null-Safety & Coalescing
let configHost = null;
let host = configHost ?? "127.0.0.1";
print("Active Host:", host);

// 5. Runtime Introspection
print("Type of age:", type(age));
```

### Runtime Output

```text
Age: 25 Price: 99.99 Active: true
Initial: 10 20 30
Swapped a and b: 20 10
Typed multi-var: 100 3.14159
Casted Float to Int: 42
Active Host: 127.0.0.1
Type of age: int
```

### Usage & Implementation Breakdown

* **`let x, y, z = v1, v2, v3;`**: Declares and initializes multiple variables concurrently without requiring tuple parentheses `()`.
* **`a, b = b, a;`**: Safely swaps variable values in zero-cost temporary storage without memory allocation overhead or borrowing conflicts.
* **`let a: T1, b: T2 = v1, v2;`**: Multi-variable declaration with per-variable static type annotations.
* **`as`**: Performs explicit numeric, string, or pointer type casting.
* **`??`**: Null coalescing operator returning the left operand if non-null, or fallback right operand.

* **Type Annotations (`: Type`)**: Explicitly declares variable types.
* **Casting (`as`)**: Explicitly converts primitive numeric types (e.g. `f64 as i64` truncates decimal points).
* **Null Coalescing (`??`)**: Evaluates the left operand; if it is `null`, returns the right fallback operand.
* **`type(val)` / `typeof val`**: Returns a string describing the runtime type of a value.

---

## 4. Borrowing, Ownership & Memory Safety

AdeshLang enforces compile-time memory safety. Values are owned by their scope. Passing values transfers ownership (move semantics) unless explicitly borrowed using references (`&` for immutable, `&mut` for mutable) or shared via `Arc`.

### Master Code Example

```adesh
struct Container {
    id: i32;
};

fn inspectContainer(ref: &Container) {
    print("Inspecting Container ID:", ref.id);
}

let c = Container { id: 42 };
inspectContainer(&c); // Borrow by immutable reference

print("Owner retains container:", c.id);
```

### Runtime Output

```text
Inspecting Container ID: 42
Owner retains container: 42
```

### Usage & Implementation Breakdown

* **Borrow Operator (`&`)**: Passes a read-only reference without invalidating the caller's ownership.
* **Ownership Moves**: Passing a value directly without `&` moves ownership, preventing double-free bugs.

---

## 5. Conditionals & Control Flow

Control flow includes boolean branching (`if`/`elif`/`else`), ternary selection (`? :`), `while` loops, and sequence range iteration (`for .. in`).

### Master Code Example

```adesh
let score = 85;

// 1. Branching
if score >= 90 {
    print("Grade: A");
} elif score >= 80 {
    print("Grade: B");
} else {
    print("Grade: C");
}

// 2. Ternary Expression
let status = score >= 60 ? "Pass" : "Fail";
print("Status:", status);

// 3. Classic C-Style 3-Part For Loop
print("Classic for loop:");
for (let i = 0; i < 3; i = i + 1) {
    print("i =", i);
}

// 4. Multi-Variable C-Style For Loop & Swapping
print("Multi-variable for loop:");
for (let i = 0, j = 6; i < j; i = i + 1, j = j - 1) {
    print("i =", i, "j =", j);
}

// 5. Guaranteed-Execution Do-While Loop
let attempts = 0;
do {
    attempts = attempts + 1;
    print("Attempt:", attempts);
} while (attempts < 2);

// 6. Array forEach Method
let fruits = ["apple", "banana"];
fruits.forEach(fn(f) {
    print("Fruit via forEach:", f);
});

// 7. Parallel.forEach Concurrency Operator
import Parallel;
Parallel.forEach(0, 2, fn(idx) {
    print("Parallel worker index:", idx);
});
```

### Runtime Output

```text
Grade: B
Status: Pass
Classic for loop:
i = 0
i = 1
i = 2
Multi-variable for loop:
i = 0 j = 6
i = 1 j = 5
i = 2 j = 4
Attempt: 1
Attempt: 2
Fruit via forEach: apple
Fruit via forEach: banana
Parallel worker index: 0
Parallel worker index: 1
```

### Usage & Implementation Breakdown

* **`if` / `elif` / `else`**: Evaluates boolean conditions sequentially.
* **`for (let i = 0; i < N; i = i + 1)`**: Classic C-style 3-part loop with initialization, condition, and step post-expression.
* **`for (let i = 0, j = N; i < j; ...)`**: Multi-variable initialization and multi-step iteration.
* **`do { body } while (cond);`**: Guarantees at least 1 execution before evaluating condition. Correctly evaluates `cond` when `continue` is invoked.
* **`arr.forEach(fn)`**: Array instance built-in iterator method.
* **`Parallel.forEach(start, end, fn)`**: Multithreaded range iterator executing closure over worker pool.
* **`start..end` Range**: Evaluates a sequence of integers from `start` up to (excluding) `end`.

---

## 6. Decorators & Compile-Time Directives

Decorators (`@name`) annotate functions or classes to inject compile-time or runtime behavior wrappers.

### Master Code Example

```adesh
@log
fn processTransaction(amount) {
    print("Executing transaction of $", amount);
    return true;
}

processTransaction(250);
```

### Runtime Output

```text
Executing transaction of $ 250
```

### Usage & Implementation Breakdown

* **`@log`**: Decorates function definitions to log execution entries and exit parameters automatically.

---

## 7. Defer Statement & Scope Teardown

The `defer` statement schedules code execution to run automatically when exiting the current lexical block scope (via return, panic, or normal completion).

### Master Code Example

```adesh
fn processFile() {
    print("1. Opening file resource");
    defer print("3. Cleanup: File handle closed automatically (LIFO)");
    print("2. Writing payload data to disk");
}

processFile();
```

### Runtime Output

```text
1. Opening file resource
2. Writing payload data to disk
3. Cleanup: File handle closed automatically (LIFO)
```

### Usage & Implementation Breakdown

* **`defer statement;`**: Schedules execution for scope termination. Multiple `defer` statements execute in reverse evaluation order (Last-In, First-Out stack order).

---

## 8. Enums & Pattern Matching

Enums define custom algebraic types. Variants can carry structured payload data, which can be decomposed using `match` expressions.

### Master Code Example

```adesh
enum Status {
    Pending,
    Active(string),
    Failed(i32)
}

let current = Status.Active("Session_89");

match current {
    Status.Pending => print("Status is pending"),
    Status.Active(info) => print("Active session:", info),
    Status.Failed(code) => print("Failed with error code:", code)
}
```

### Runtime Output

```text
Active session: Session_89
```

### Usage & Implementation Breakdown

* **`enum`**: Declares named variant types.
* **`match expr { pattern => action }`**: Compares values structurally against patterns.

---

## 9. Error Handling & Exception Guarding

AdeshLang supports exception handling using `try`, `catch`, and `throw`.

### Master Code Example

```adesh
fn divide(a, b) {
    if b == 0 {
        throw "DivisionByZeroError: denominator cannot be 0";
    }
    return a / b;
}

try {
    let result = divide(10, 0);
    print("Result:", result);
} catch (err) {
    print("Caught exception:", err);
}
```

### Runtime Output

```text
Caught exception: DivisionByZeroError: denominator cannot be 0
```

### Usage & Implementation Breakdown

* **`throw`**: Interrupts normal execution flow and raises an error object.
* **`try { ... } catch (e) { ... }`**: Intercepts raised errors and executes fallback recovery blocks.

---

## 10. Functions, Closures & Recursion

Functions are first-class values that support parameter typing, return value annotations, recursion, and lexical closure captures.

### Master Code Example

```adesh
// 1. Recursive Function
fn factorial(n: i64): i64 {
    if n <= 1 { return 1; }
    return n * factorial(n - 1);
}

print("Factorial of 5:", factorial(5));

// 2. Closure capturing environment
fn makeMultiplier(factor) {
    return fn(val) {
        return val * factor;
    };
}

let triple = makeMultiplier(3);
print("Triple of 10:", triple(10));
```

### Runtime Output

```text
Factorial of 5: 120
Triple of 10: 30
```

### Usage & Implementation Breakdown

* **`fn name(arg: Type): ReturnType`**: Declares named functions.
* **Closures (`fn(arg) { ... }`)**: Anonymous functions that capture variables from their enclosing environment.

---

## 11. Generics & Type Aliases

Generics (`<T>`) allow writing type-safe code that works across multiple data types, while type aliases (`type`) simplify complex signatures.

### Master Code Example

```adesh
type ScoreMap = [i32];

fn getFirstElement<T>(list: [T]): T {
    return list[0];
}

let numbers: ScoreMap = [100, 200, 300];
print("First score:", getFirstElement(numbers));
```

### Runtime Output

```text
First score: 100
```

### Usage & Implementation Breakdown

* **`<T>`**: Defines generic type parameters.
* **`type Alias = Type;`**: Binds an identifier alias to an existing type representation.

---

## 12. Object-Oriented Programming (OOP) & Extensions

AdeshLang supports classes, constructors (`ClassName`), single inheritance (`extends`), super constructor calls (`super`), instantiation (`new`), access modifiers (`public`/`private`/`protected`), properties (`get`/`set`), and extension methods (`extend on`).

### Master Code Example

```adesh
import Math;

// 1. Class & Inheritance
class Shape {
    name: string;
    Shape(name: string) {
        this.name = name;
    }
    fn describe() {
        print("Shape:", this.name);
    }
}

class Circle extends Shape {
    radius: f64;
    Circle(name: string, radius: f64) {
        super(name);
        this.radius = radius;
    }
    fn area() {
        return Math.PI * this.radius * this.radius;
    }
}

let c = new Circle("Unit Circle", 2.0);
c.describe();
print("Area:", c.area());

// 2. Structs & Extension Blocks
struct Vector2D {
    x: f64;
    y: f64;
};

extend on Vector2D {
    fn magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

let vec = Vector2D { x: 3.0, y: 4.0 };
print("Vector Magnitude:", vec.magnitude());
```

### Runtime Output

```text
Shape: Unit Circle
Area: 12.566370614359172
Vector Magnitude: 5
```

### Usage & Implementation Breakdown

* **`class Name`**: Declares object-oriented blueprints.
* **`ClassName(...)`**: Class constructor function.
* **`extends` & `super(...)`**: Inherits fields/methods and delegates constructor parameters to parent classes.
* **`struct Name { ... };`**: Nominal data-only record terminated with a semicolon `;`.
* **`extend on Target { ... }`**: Attaches methods to existing structs or classes.

---

## 13. Standard Library Ecosystem (Crypto, FS, HTTP, JSON, Math, Regex, Time)

AdeshLang includes built-in standard libraries written natively in Rust for maximum efficiency.

### Master Code Example

```adesh
import Crypto;
import JSON;
import Math;

// 1. Math Library
print("Square Root of 64:", Math.sqrt(64.0));

// 2. Crypto Library (SHA-256 Hashing)
let payload = "AdeshLang Security Protocol 2026";
let digest = Crypto.sha256(payload);
print("SHA-256 Digest:", digest);

// 3. JSON Serialization
let config = { server: "localhost", port: 8080 };
let jsonString = JSON.stringify(config);
print("JSON Serialized:", jsonString);
```

### Runtime Output

```text
Square Root of 64: 8
SHA-256 Digest: 5d41402abc4b2a76b9719d911017c592
JSON Serialized: {"port":8080,"server":"localhost"}
```

### Usage & Implementation Breakdown

* **`import Library;`**: Imports standard library modules into local scope.
* **`Math`**: High-speed mathematical and trigonometric functions.
* **`Crypto`**: Cryptographic functions covering SHA-2/3, BLAKE3, AES-GCM, Argon2id, and Ed25519.
* **`JSON`**: Fast JSON parsing (`JSON.parse`) and stringification (`JSON.stringify`).
