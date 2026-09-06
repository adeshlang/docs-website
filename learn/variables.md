---
id: variables
title: Variables & Data - Storing Information
sidebar_label: 2. Variables & Data
---

# Variables & Data — Storing Information

Now that you can print output, let's learn how to **store and manipulate data** using variables.

## What Is a Variable?

A **variable** is a named box that holds a value. You can put data in, take it out, or replace it.

```adesh
let name = "Alice";    // Put "Alice" in the box named 'name'
let age = 25;          // Put 25 in the box named 'age'
let height = 5.75;     // Put 5.75 in the box named 'height'
let is_student = true; // Put true in the box named 'is_student'
```

In AdeshLang, use `let` to create a variable:

```adesh
let variable_name = value;
```

## Variable Names

Follow these rules for names:

| Rule | Example |
|------|---------|
| Start with letter or `_` | `name`, `_count`, `user1` |
| Can contain letters, numbers, `_` | `user_name`, `count2`, `_private` |
| Case-sensitive | `name` ≠ `Name` ≠ `NAME` |
| Can't use keywords | ❌ `let`, `if`, `else`, `fn`, `class` |

**Good names:**
```adesh
let user_name = "Alice";
let max_score = 100;
let is_active = true;
let _temp = 42;
```

**Bad names:**
```adesh
let 2names = "Bob";      // ❌ Starts with number
let user-name = "Bob";   // ❌ Hyphen not allowed
let let = 10;            // ❌ 'let' is a keyword
```

## Basic Types

AdeshLang infers the type from the value:

```adesh
let whole_number = 42;        // number (integer)
let decimal = 3.14;           // number (float)
let text = "Hello, World!";   // string
let yes = true;               // boolean
let no = false;               // boolean
let nothing = null;           // null (empty value)
```

Check the type with `typeof`:

```adesh
let x = 42;
print(typeof x);     // "number"

let name = "Alice";
print(typeof name);  // "string"

let flag = true;
print(typeof flag);  // "boolean"
```

## Reassignment — Changing Values

In AdeshLang, **variables are mutable by default** — just assign a new value:

```adesh
let score = 0;
print("Score:", score);    // Score: 0

score = 10;
print("Score:", score);    // Score: 10

score = score + 5;
print("Score:", score);    // Score: 15
```

No `mut` keyword needed! Just use `=` to update.

## Arithmetic Operations

```adesh
let a = 10;
let b = 3;

print("Add:", a + b);       // 13
print("Subtract:", a - b);  // 7
print("Multiply:", a * b);  // 30
print("Divide:", a / b);    // 3.333...
print("Modulo:", a % b);    // 1 (remainder)
```

## String Operations

```adesh
let first = "Hello";
let last = "World";

print(first + " " + last);    // Hello World
print(first + ", " + last);   // Hello, World

// String length
let word = "AdeshLang";
print("Length:", len(word));  // Length: 9
```

## Collections: Arrays and Objects

### Arrays — Ordered Lists

```adesh
let numbers = [1, 2, 3, 4, 5];
let names = ["Alice", "Bob", "Charlie"];
let mixed = [1, "two", true, 3.14];

print("First:", numbers[0]);        // First: 1 (index 0)
print("Length:", len(numbers));     // Length: 5

// Add to end
numbers.push(6);
print(numbers);                     // [1, 2, 3, 4, 5, 6]
```

### Objects — Key-Value Pairs

```adesh
let person = {
    name: "Alice",
    age: 25,
    city: "New York"
};

print("Name:", person.name);        // Name: Alice
print("Age:", person.age);          // Age: 25

// Add/modify properties
person.email = "alice@example.com";
person.age = 26;

print(person);                      // { name: "Alice", age: 26, city: "New York", email: "alice@example.com" }
```

## Practice Exercise

Create a file `profile.adesh` and build a user profile:

```adesh
// 1. Create variables for your info
let my_name = "Your Name";
let my_age = 20;
let my_height = 5.8;
let is_coder = true;

// 2. Create an array of your hobbies
let hobbies = ["coding", "reading", "gaming"];

// 3. Create an object for your favorites
let favorites = {
    color: "blue",
    food: "pizza",
    language: "AdeshLang"
};

// 4. Print everything nicely
print("=== MY PROFILE ===");
print("Name:", my_name);
print("Age:", my_age);
print("Height:", my_height);
print("Coder?", is_coder);
print("");
print("Hobbies:", hobbies);
print("Favorites:", favorites);
```

Run it:
```bash
adesh run profile.adesh
```

## Common Mistakes

| Mistake | Error | Fix |
|---------|-------|-----|
| Using variable before declaring | `x is not defined` | Add `let x = ...` first |
| Typo in variable name | `name is not defined` | Check spelling: `my_name` vs `my_nmae` |
| Forgetting quotes on string | `Unexpected token` | Use `"text"` not `text` |
| Using `=` instead of `==` in condition | Logic bug | `=` assigns, `==` compares |

## Summary

✅ **You learned:**
- `let name = value` creates a variable
- Variables are **mutable by default** — just reassign with `=`
- Basic types: `number`, `string`, `boolean`, `null`
- `typeof` reveals the type
- Arrays `[]` for lists, Objects `{}` for key-value data
- `len()` gives array/string length

## Next Step

Now let's make programs that **make decisions**! Continue to **[Making Decisions](/learn/conditionals)** →