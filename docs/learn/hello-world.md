---
id: hello-world
title: Hello World - Your First Program
sidebar_label: 1. Hello World
---

# Hello World — Your First Program

Traditionally, the first program in any language prints "Hello, World!" to the screen. Let's do that!

## Create Your First File

1. Open your text editor (VS Code, Notepad, etc.)
2. Create a new file named `hello.adesh`
3. Type this code:

```adesh
print("Hello, World!");
```

## Run It

Open a terminal in the folder where you saved the file:

```bash
adesh run hello.adesh
```

**Output:**
```
Hello, World!
```

🎉 You just ran your first AdeshLang program!

## What Just Happened?

| Code | Meaning |
|------|---------|
| `print(...)` | A **function** that displays text |
| `"Hello, World!"` | A **string** — text wrapped in quotes |
| `;` | Ends a **statement** (like a period in English) |

## Try It Yourself

Change the message and run again:

```adesh
print("Hello, AdeshLang!");
print("I'm learning to code!");
print("This is fun!");
```

**Output:**
```
Hello, AdeshLang!
I'm learning to code!
This is fun!
```

## Understanding the Parts

### The `print` Function

Think of `print` as a machine: you give it something, it shows it on screen.

```adesh
print("Hello");        // Input: "Hello" → Output: Hello
print(42);             // Input: 42 → Output: 42
print(true);           // Input: true → Output: true
print(3.14);           // Input: 3.14 → Output: 3.14
```

### Strings

Text in programming is called a **string** (a string of characters).

```adesh
"This is a string"
"123"           // Numbers as text
"Hello, World!" // With punctuation
""              // Empty string
```

Use double quotes `"` for strings. Single quotes `'` are for single characters.

### Statements and Semicolons

Each line of action ends with `;`. It tells AdeshLang "this instruction is complete."

```adesh
print("Line 1");    // Statement 1
print("Line 2");    // Statement 2
print("Line 3");    // Statement 3
```

Without `;`, AdeshLang gets confused about where one instruction ends and the next begins.

## Common Mistakes

| Mistake | Error | Fix |
|---------|-------|-----|
| Missing quotes | `print(Hello)` | Use `print("Hello")` |
| Missing semicolon | `print("Hi")` | Add `;` at end |
| Wrong file extension | `hello.txt` | Use `.adesh` |

## Experiment!

Try these variations:

```adesh
// Print multiple things at once
print("Name:", "Alice", "Age:", 30);

// Print with custom separator
print("Apple", "Banana", "Cherry", { sep: ", " });
// Output: Apple, Banana, Cherry

// Print without newline at end
print("Loading", { end: "..." });
print("Done!");
// Output: Loading...Done!
```

## Summary

✅ **You learned:**
- How to create and run an `.adesh` file
- The `print` function displays output
- Strings are text in double quotes
- Statements end with `;`

## Next Step

Ready to store and use data? Continue to **[Variables & Data](/learn/variables)** →