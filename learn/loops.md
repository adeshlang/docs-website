---
id: loops
title: Repeating Tasks - For and While Loops
sidebar_label: 5. Loops
---

# Repeating Tasks — For and While Loops

**Loops** let you run code multiple times without writing it over and over. Adesh has two main loop types.

## The `for` Loop — Count-Based

Use `for` when you know **how many times** to repeat.

### Range Loop

```adesh
// Count from 0 to 4 (5 times)
for i in 0..5 {
    print("Iteration:", i);
}
```

**Output:**
```
Iteration: 0
Iteration: 1
Iteration: 2
Iteration: 3
Iteration: 4
```

### Range Syntax

| Syntax | Meaning | Values |
|--------|---------|--------|
| `0..5` | 0 to 4 (exclusive end) | 0, 1, 2, 3, 4 |
| `1..6` | 1 to 5 (exclusive end) | 1, 2, 3, 4, 5 |
| `0..=5` | 0 to 5 (inclusive end) | 0, 1, 2, 3, 4, 5 |

```adesh
// Inclusive range
for i in 1..=5 {
    print(i);
}
// Output: 1 2 3 4 5
```

### Loop Over Arrays

```adesh
let fruits = ["apple", "banana", "cherry"];

for fruit in fruits {
    print("I like", fruit);
}
```

**Output:**
```
I like apple
I like banana
I like cherry
```

### Loop with Index

```adesh
let names = ["Alice", "Bob", "Charlie"];

for i in 0..len(names) {
    print(i, ":", names[i]);
}
```

**Output:**
```
0 : Alice
1 : Bob
2 : Charlie
```

## The `while` Loop — Condition-Based

Use `while` when you repeat **until a condition becomes false**.

```adesh
let count = 0;

while (count < 5) {
    print("Count:", count);
    count = count + 1;    // Must update!
}
```

**Output:**
```
Count: 0
Count: 1
Count: 2
Count: 3
Count: 4
```

⚠️ **Warning:** Always update the condition variable, or you'll create an **infinite loop**!

## Loop Control: `break` and `continue`

### `break` — Exit Loop Early

```adesh
for i in 0..10 {
    if (i == 5) {
        print("Stopping at", i);
        break;    // Exit loop completely
    }
    print(i);
}
```

**Output:**
```
0
1
2
3
4
Stopping at 5
```

### `continue` — Skip to Next Iteration

```adesh
for i in 0..5 {
    if (i == 2) {
        continue;    // Skip rest of this iteration
    }
    print(i);
}
```

**Output:**
```
0
1
3
4
```

## Practical Examples

### Example 1: Sum Array Elements

```adesh
let numbers = [10, 20, 30, 40, 50];
let sum = 0;

for n in numbers {
    sum = sum + n;
}

print("Sum:", sum);    // Sum: 150
```

### Example 2: Find Maximum

```adesh
let scores = [85, 92, 78, 96, 88];
let max = scores[0];

for score in scores {
    if (score > max) {
        max = score;
    }
}

print("Highest:", max);    // Highest: 96
```

### Example 3: Countdown

```adesh
let seconds = 10;

while (seconds > 0) {
    print(seconds, "...");
    seconds = seconds - 1;
}

print("🚀 Blast off!");
```

### Example 4: Number Guessing Game (Simulated)

```adesh
let secret = 7;
let guess = 0;
let attempts = 0;
let max_attempts = 3;

while (guess != secret && attempts < max_attempts) {
    // Simulated guesses
    if (attempts == 0) guess = 5;
    elif (attempts == 1) guess = 8;
    else guess = 7;
    
    attempts = attempts + 1;
    print("Attempt", attempts, ": You guessed", guess);
    
    if (guess < secret) print("Too low!");
    elif (guess > secret) print("Too high!");
}

if (guess == secret) {
    print("Correct! You won in", attempts, "attempts!");
} else {
    print("Game over! The number was", secret);
}
```

## Nested Loops

Loops inside loops:

```adesh
// Multiplication table 1-3
for i in 1..=3 {
    for j in 1..=3 {
        print(i, "x", j, "=", i * j);
    }
    print("---");
}
```

**Output:**
```
1 x 1 = 1
1 x 2 = 2
1 x 3 = 3
---
2 x 1 = 2
2 x 2 = 4
2 x 3 = 6
---
3 x 1 = 3
3 x 2 = 6
3 x 3 = 9
---
```

## `for` vs `while` — When to Use Which?

| Situation | Use |
|-----------|-----|
| Known number of iterations | `for` |
| Iterating over array/collection | `for` |
| Counting with range | `for` |
| Unknown iterations, condition-based | `while` |
| Waiting for user input | `while` |
| Game loop | `while` |

## Infinite Loop (Intentional)

```adesh
// Use break to exit
while (true) {
    let input = "quit";    // Simulated
    if (input == "quit") break;
    print("Processing:", input);
}
```

## Quick Reference

| Task | Code |
|------|------|
| Range loop | `for i in 0..n { }` |
| Inclusive range | `for i in 0..=n { }` |
| Array loop | `for item in array { }` |
| While loop | `while (condition) { }` |
| Exit loop | `break;` |
| Skip iteration | `continue;` |

## Practice Exercise

Create `exercise.adesh`:

```adesh
// 1. Print even numbers 1-20
print("Even numbers:");
for i in 1..=20 {
    if (i % 2 == 0) {
        print(i);
    }
}

// 2. Sum 1 to 100
let total = 0;
for i in 1..=100 {
    total = total + i;
}
print("Sum 1-100:", total);    // 5050

// 3. Factorial with while
let n = 5;
let factorial = 1;
let i = 1;
while (i <= n) {
    factorial = factorial * i;
    i = i + 1;
}
print("5! =", factorial);    // 120

// 4. Print pattern
print("Pattern:");
for row in 1..=5 {
    let line = "";
    for col in 1..=row {
        line = line + "*";
    }
    print(line);
}
```

**Expected Output:**
```
Even numbers:
2
4
6
...
20
Sum 1-100: 5050
5! = 120
Pattern:
*
**
***
****
*****
```

## Summary

✅ **You learned:**
- `for i in 0..5 { }` — count from 0 to 4
- `for i in 1..=5 { }` — count from 1 to 5
- `for item in array { }` — iterate array elements
- `while (condition) { }` — repeat while true
- `break` — exit loop immediately
- `continue` — skip to next iteration
- Nested loops for grids/patterns

## Next Step

Now let's organize code into **functions**! Continue to **[Functions](/learn/functions)** →