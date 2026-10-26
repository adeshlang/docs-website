---
id: control-flow
title: Conditionals & Control Flow
sidebar_label: Conditionals & Control Flow
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Conditionals & Control Flow

<FeatureStatus status="STABLE" details="if/elif/else branching, ternary expressions, 3-part for loops, do-while loops, and built-in array iterators" />

Adesh provides powerful control flow constructs, including boolean branching (`if`/`elif`/`else`), ternary selection (`? :`), `while` loops, guaranteed-execution `do-while` loops, classic 3-part `for` loops, and multi-variable loop initialization.

---

## 1. Boolean Branching (`if`, `elif`, `else`) & Ternary Expressions

Branches execute code based on boolean evaluation without requiring parentheses around conditions.

### Code Example

```adesh
let score = 85;

// 1. If / Elif / Else Branching
if score >= 90 {
    print("Grade: A (Distinction)");
} elif score >= 80 {
    print("Grade: B (Merit)");
} elif score >= 70 {
    print("Grade: C (Pass)");
} else {
    print("Grade: F (Fail)");
}

// 2. Inline Ternary Expression
let resultStatus = score >= 60 ? "PASS" : "FAIL";
print("Evaluation Status:", resultStatus);
```

### Terminal Output

```text
Grade: B (Merit)
Evaluation Status: PASS
```

### Breakdown

* **`if cond { ... } elif cond { ... } else { ... }`**: Evaluates conditions in order. Execution flows into the first block returning `true`.
* **Ternary Operator (`cond ? true_val : false_val`)**: Compact inline expression returning one of two values.

---

## 2. Classic & Multi-Variable C-Style For Loops

Adesh supports traditional 3-part `for` loops (`init; condition; post-step`), as well as multi-variable initializers and multi-step updates.

### Code Example

```adesh
// 1. Standard 3-part for loop
print("Standard 3-part for loop:");
for (let i = 0; i < 4; i = i + 1) {
    print("  Index i =", i);
}

// 2. Multi-variable initialization & multi-step iteration
print("Multi-variable for loop:");
for (let i = 0, j = 10; i < j; i = i + 2, j = j - 2) {
    print("  i =", i, "| j =", j);
}
```

### Terminal Output

```text
Standard 3-part for loop:
  Index i = 0
  Index i = 1
  Index i = 2
  Index i = 3
Multi-variable for loop:
  i = 0 | j = 10
  i = 2 | j = 8
  i = 4 | j = 6
```

### Breakdown

* **`for (init; cond; post)`**: Executes `init` once, checks `cond` before every iteration, and runs `post` after every loop body completion.
* **Multi-variable Loop Headers**: `let i = 0, j = 10` initializes multiple loop counters, while `i = i + 2, j = j - 2` steps multiple variables per iteration.

---

## 3. Guaranteed-Execution Do-While Loops

Unlike `while` loops, `do-while` loops guarantee at least one execution of the loop body before testing the termination condition.

### Code Example

```adesh
let attempts = 0;

do {
    attempts = attempts + 1;
    print("Executing attempt #", attempts);
} while (attempts < 3);

print("Total attempts completed:", attempts);
```

### Terminal Output

```text
Executing attempt # 1
Executing attempt # 2
Executing attempt # 3
Total attempts completed: 3
```

### Breakdown

* **`do { body } while (condition);`**: Executes the inner block first, then tests `condition`. If `true`, execution loops back to the start of the block.

---

## 4. Built-in Array Iteration (`forEach`)

Array instances provide built-in iteration methods like `forEach` for cleanly processing elements without manual index management.

### Code Example

```adesh
let fruits = ["Apple", "Banana", "Cherry", "Dragonfruit"];

fruits.forEach(fn(item) {
    print("Fruit:", item);
});
```

### Terminal Output

```text
Fruit: Apple
Fruit: Banana
Fruit: Cherry
Fruit: Dragonfruit
```

### Breakdown

* **`array.forEach(fn(element))`**: Invokes an anonymous or named callback function for every element in the array.
