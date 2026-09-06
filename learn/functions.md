---
id: functions
title: Functions - Reusable Code Blocks
sidebar_label: 5. Functions
---

# Functions — Reusable Code Blocks

**Functions** let you package code into reusable pieces. Write once, use many times.

## Why Functions?

```adesh
// ❌ Without function - repetitive
print("=== Welcome ===");
print("Hello, Alice!");
print("=== Welcome ===");

print("=== Welcome ===");
print("Hello, Bob!");
print("=== Welcome ===");

// ✅ With function - reusable
fn greet(name) {
    print("=== Welcome ===");
    print("Hello, ", name, "!");
    print("=== Welcome ===");
}

greet("Alice");
greet("Bob");
greet("Charlie");
```

## Basic Function Syntax

```adesh
fn function_name(parameters) {
    // body
    return value;  // optional
}
```

### Function with No Parameters

```adesh
fn say_hello() {
    print("Hello!");
}

say_hello();    // Call the function
```

### Function with Parameters

```adesh
fn greet(name) {
    print("Hello, ", name, "!");
}

greet("Alice");   // Hello, Alice!
greet("Bob");     // Hello, Bob!
```

### Function with Return Value

```adesh
fn add(a, b) {
    return a + b;
}

let result = add(5, 3);
print(result);    // 8
```

### Multiple Parameters

```adesh
fn rectangle_area(width, height) {
    return width * height;
}

print(rectangle_area(5, 3));    // 15
print(rectangle_area(10, 4));   // 40
```

## Return Values

### Explicit Return

```adesh
fn max(a, b) {
    if (a > b) {
        return a;
    }
    return b;
}

print(max(10, 20));   // 20
```

### Implicit Return (Last Expression)

```adesh
fn add(a, b) {
    a + b    // Last expression is returned automatically
}

print(add(2, 3));    // 5
```

### Early Return

```adesh
fn divide(a, b) {
    if (b == 0) {
        return "Error: Division by zero";
    }
    return a / b;
}

print(divide(10, 2));   // 5
print(divide(10, 0));   // Error: Division by zero
```

## Parameters and Arguments

| Term | Meaning |
|------|---------|
| **Parameter** | Variable in function definition |
| **Argument** | Value passed when calling |

```adesh
fn greet(name, age) {    // name, age are parameters
    print(name, "is", age, "years old");
}

greet("Alice", 25);      // "Alice", 25 are arguments
```

## Default Parameters

```adesh
fn greet(name, greeting = "Hello") {
    print(greeting, ", ", name, "!");
}

greet("Alice");           // Hello, Alice!
greet("Bob", "Hi");       // Hi, Bob!
```

## Scope in Functions

Variables inside a function are **local** (only exist there):

```adesh
let global_var = "I'm global";

fn demo() {
    let local_var = "I'm local";
    print(global_var);    // ✅ Can access global
    print(local_var);     // ✅ Can access local
}

demo();
print(global_var);        // ✅ Can access global
// print(local_var);     // ❌ Error! local_var doesn't exist here
```

## Practical Examples

### Example 1: Calculator Functions

```adesh
fn add(a, b) { return a + b; }
fn subtract(a, b) { return a - b; }
fn multiply(a, b) { return a * b; }
fn divide(a, b) { 
    if (b == 0) return "Error";
    return a / b; 
}

print("5 + 3 =", add(5, 3));        // 8
print("10 - 4 =", subtract(10, 4)); // 6
print("6 * 7 =", multiply(6, 7));   // 42
print("20 / 4 =", divide(20, 4));   // 5
```

### Example 2: String Utilities

```adesh
fn reverse(text) {
    let result = "";
    for i in 0..len(text) {
        result = text[i] + result;
    }
    return result;
}

fn is_palindrome(text) {
    return text == reverse(text);
}

print(reverse("hello"));           // olleh
print(is_palindrome("racecar"));   // true
print(is_palindrome("hello"));     // false
```

### Example 3: Array Helpers

```adesh
fn sum_array(arr) {
    let total = 0;
    for n in arr {
        total = total + n;
    }
    return total;
}

fn average(arr) {
    return sum_array(arr) / len(arr);
}

fn find_max(arr) {
    let max = arr[0];
    for n in arr {
        if (n > max) max = n;
    }
    return max;
}

let scores = [85, 92, 78, 96, 88];
print("Sum:", sum_array(scores));      // 439
print("Avg:", average(scores));        // 87.8
print("Max:", find_max(scores));       // 96
```

### Example 4: Recursive Function

A function that calls itself:

```adesh
fn factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

print(factorial(5));    // 120 (5*4*3*2*1)
```

```adesh
fn fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

for i in 0..10 {
    print(fibonacci(i));   // 0 1 1 2 3 5 8 13 21 34
}
```

## Functions as Values

Functions can be stored in variables and passed around:

```adesh
fn add(a, b) { return a + b; }
fn multiply(a, b) { return a * b; }

let operation = add;
print(operation(5, 3));     // 8

operation = multiply;
print(operation(5, 3));     // 15
```

### Passing Functions to Functions

```adesh
fn apply_twice(fn, value) {
    return fn(fn(value));
}

fn double(x) { return x * 2; }
fn increment(x) { return x + 1; }

print(apply_twice(double, 5));      // 20 (5*2*2)
print(apply_twice(increment, 5));   // 7 (5+1+1)
```

## Anonymous Functions (Closures)

```adesh
let greet = fn(name) {
    return "Hello, " + name + "!";
};

print(greet("World"));    // Hello, World!

// Short form
let square = fn(x) { x * x; };
print(square(4));         // 16
```

## Built-in Higher-Order Functions

```adesh
let numbers = [1, 2, 3, 4, 5];

// map - transform each element
let doubled = map(numbers, fn(x) { x * 2; });
print(doubled);    // [2, 4, 6, 8, 10]

// filter - keep matching elements
let evens = filter(numbers, fn(x) { x % 2 == 0; });
print(evens);      // [2, 4]

// reduce - combine to single value
let sum = reduce(numbers, 0, fn(acc, x) { acc + x; });
print(sum);        // 15
```

## Best Practices

| Principle | Description |
|-----------|-------------|
| **Single responsibility** | One function, one job |
| **Descriptive names** | `calculate_tax` not `calc` |
| **Small functions** | 10-20 lines max |
| **Avoid side effects** | Pure functions are easier to test |
| **Document purpose** | Comment what it does, not how |

## Quick Reference

| Task | Code |
|------|------|
| Define function | `fn name(params) { body }` |
| Call function | `name(args)` |
| Return value | `return value` or last expression |
| Default param | `fn name(param = default) { }` |
| Anonymous function | `fn(params) { body }` |

## Practice Exercise

Create `math_utils.adesh`:

```adesh
// 1. Basic operations
fn add(a, b) { return a + b; }
fn subtract(a, b) { return a - b; }
fn multiply(a, b) { return a * b; }
fn divide(a, b) { 
    if (b == 0) return null; 
    return a / b; 
}

// 2. Advanced
fn power(base, exp) {
    let result = 1;
    for i in 0..exp {
        result = result * base;
    }
    return result;
}

fn is_even(n) { return n % 2 == 0; }
fn is_odd(n) { return n % 2 != 0; }

// 3. Test them
print("2^8 =", power(2, 8));        // 256
print("Is 42 even?", is_even(42));  // true
print("Is 7 odd?", is_odd(7));      // true

// 4. Calculator using functions
fn calculate(a, op, b) {
    if (op == "+") return add(a, b);
    if (op == "-") return subtract(a, b);
    if (op == "*") return multiply(a, b);
    if (op == "/") return divide(a, b);
    return "Unknown operator";
}

print(calculate(10, "+", 5));    // 15
print(calculate(10, "/", 0));    // null
```

## Summary

✅ **You learned:**
- `fn name(params) { body }` defines a function
- Call with `name(args)`
- `return` sends value back (last expression auto-returns)
- Parameters vs arguments
- Default parameters
- Local vs global scope
- Functions as values (first-class)
- Anonymous functions
- `map`, `filter`, `reduce`

## Next Step

Now let's work with **collections** — arrays and objects! Continue to **[Collections](/learn/collections)** →