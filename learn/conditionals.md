---
id: conditionals
title: Making Decisions - If, Else, Comparisons
sidebar_label: 3. Conditionals
---

# Making Decisions — If, Else, Comparisons

Programs need to **think** — to do different things based on conditions. This is called **control flow**.

## Comparisons

Before decisions, you need to compare values:

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| `==` | Equal to | `5 == 5` | `true` |
| `!=` | Not equal | `5 != 3` | `true` |
| `>` | Greater than | `10 > 5` | `true` |
| `<` | Less than | `3 < 7` | `true` |
| `>=` | Greater or equal | `5 >= 5` | `true` |
| `<=` | Less or equal | `4 <= 4` | `true` |

```adesh
let age = 20;

print(age == 20);    // true
print(age != 20);    // false
print(age >= 18);    // true
print(age < 18);     // false
```

> **Note:** Use `==` for comparison, `=` is for assignment!

## The `if` Statement

Run code **only if** a condition is true:

```adesh
let score = 85;

if (score >= 60) {
    print("You passed!");
}
```

**Output:** `You passed!`

If condition is false, the block is skipped:

```adesh
let score = 45;

if (score >= 60) {
    print("You passed!");
}
print("Done checking.");  // Always runs
```

**Output:** `Done checking.`

## The `else` Block

Run **alternative** code when condition is false:

```adesh
let score = 45;

if (score >= 60) {
    print("Pass");
} else {
    print("Fail");
}
```

**Output:** `Fail`

## The `elif` Chain

Check **multiple conditions** in order:

```adesh
let score = 82;

if (score >= 90) {
    print("Grade: A");
} elif (score >= 80) {
    print("Grade: B");
} elif (score >= 70) {
    print("Grade: C");
} elif (score >= 60) {
    print("Grade: D");
} else {
    print("Grade: F");
}
```

**Output:** `Grade: B`

> **Key:** Only the **first** matching block runs. Order matters!

## Logical Operators

Combine multiple conditions:

| Operator | Name | Example | True When |
|----------|------|---------|-----------|
| `&&` | AND | `a > 0 && a < 100` | Both true |
| `||` | OR | `age < 18 || age > 65` | At least one true |
| `!` | NOT | `!(age >= 18)` | Condition is false |

```adesh
let age = 25;
let has_ticket = true;

// AND - both must be true
if (age >= 18 && has_ticket) {
    print("Entry allowed");
}

// OR - at least one true
let is_student = false;
let is_senior = false;
if (is_student || is_senior) {
    print("Discount applies");
}

// NOT - invert
if (!(age >= 18)) {
    print("Minor");
}
```

## Nested Conditions

Conditions inside conditions:

```adesh
let user = "admin";
let logged_in = true;

if (logged_in) {
    if (user == "admin") {
        print("Welcome, Administrator!");
    } else {
        print("Welcome, User!");
    }
} else {
    print("Please log in first");
}
```

**Output:** `Welcome, Administrator!`

## Practical Examples

### Example 1: Number Guessing Game

```adesh
let secret = 42;
let guess = 50;

if (guess == secret) {
    print("Correct! You win!");
} elif (guess > secret) {
    print("Too high! Try lower.");
} else {
    print("Too low! Try higher.");
}
```

### Example 2: Login System

```adesh
let username = "alice";
let password = "secret123";
let input_user = "alice";
let input_pass = "wrongpass";

if (username == input_user && password == input_pass) {
    print("Login successful!");
} elif (username != input_user) {
    print("Invalid username");
} else {
    print("Incorrect password");
}
```

### Example 3: Temperature Advisor

```adesh
let temp = 15;  // Celsius

if (temp < 0) {
    print("Freezing! Wear heavy coat.");
} elif (temp < 10) {
    print("Cold. Wear jacket.");
} elif (temp < 20) {
    print("Cool. Light sweater.");
} elif (temp < 30) {
    print("Nice! T-shirt weather.");
} else {
    print("Hot! Stay hydrated.");
}
```

### Example 4: Simple Calculator

```adesh
let a = 10;
let b = 5;
let op = "/";

if (op == "+") {
    print("Result:", a + b);
} elif (op == "-") {
    print("Result:", a - b);
} elif (op == "*") {
    print("Result:", a * b);
} elif (op == "/") {
    if (b != 0) {
        print("Result:", a / b);
    } else {
        print("Error: Cannot divide by zero!");
    }
} else {
    print("Unknown operator:", op);
}
```

## Ternary Expression (One-Liner)

For simple choices, use the ternary operator:

```adesh
let age = 20;
let status = (age >= 18) ? "Adult" : "Minor";
print(status);    // Adult

let score = 85;
let result = (score >= 60) ? "Pass" : "Fail";
print(result);    // Pass
```

**Syntax:** `condition ? value_if_true : value_if_false`

## Truthy and Falsy Values

In conditions, these values are **falsy** (act like `false`):

| Value | Type |
|-------|------|
| `false` | Boolean |
| `0` | Number |
| `""` | Empty string |
| `null` | Null |

Everything else is **truthy**:

```adesh
let values = [1, "hello", true, -5, [1], {a:1}];

for v in values {
    if (v) {
        print(v, "is truthy");
    }
}

let falsy = [0, "", false, null];
for v in falsy {
    if (!v) {
        print(v, "is falsy");
    }
}
```

## Common Patterns

### Guard Clause (Return Early)

```adesh
fn process(user) {
    // Check invalid first, exit early
    if (!user) {
        print("No user provided");
        return;
    }
    if (!user.active) {
        print("User not active");
        return;
    }
    
    // Main logic here
    print("Processing:", user.name);
}
```

### Range Check

```adesh
let x = 50;

if (x >= 0 && x <= 100) {
    print("In range 0-100");
}

// Or
if (0 <= x && x <= 100) {  // Works too
    print("In range");
}
```

### Default Value

```adesh
let input = null;
let value = (input != null) ? input : "default";
print(value);    // default
```

## Quick Reference

| Task | Code |
|------|------|
| Simple if | `if (cond) { }` |
| If-else | `if (cond) { } else { }` |
| If-elif-else | `if (c1) { } elif (c2) { } else { }` |
| AND | `a && b` |
| OR | `a \|\| b` |
| NOT | `!a` |
| Ternary | `cond ? a : b` |

## Practice Exercise

Create `grade_calculator.adesh`:

```adesh
fn get_grade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
}

let scores = [95, 87, 72, 65, 58, 100];

for s in scores {
    print("Score:", s, "→ Grade:", get_grade(s));
}
```

## Summary

✅ **You learned:**
- Comparison operators: `==`, `!=`, `>`, `<`, `>=`, `<=`
- `if`, `elif`, `else` for branching
- Logical operators: `&&` (and), `||` (or), `!` (not)
- Nested conditions
- Ternary operator for one-liners
- Truthy/falsy values
- Guard clause pattern

## Next Step

Now let's **repeat** actions automatically with loops! Continue to **[Loops](/learn/loops)** →