---
id: calculator
title: Building a Calculator - Complete Project
sidebar_label: 10. Calculator Project
---

# Building a Calculator — Putting It All Together

You've learned variables, conditionals, loops, functions, and collections. Now let's build a **complete calculator application**!

## Project Overview

We'll build a calculator that:
- Shows a menu of operations
- Takes user input
- Performs calculations
- Handles errors gracefully
- Keeps a history of calculations

## Step 1: Basic Structure

```adesh
// calculator.adesh

fn main() {
    print("╔══════════════════════╗");
    print("║   ADESH CALCULATOR   ║");
    print("╚══════════════════════╝");
    print("");
    
    // TODO: Menu loop
}
```

## Step 2: Operation Functions

```adesh
fn add(a, b) { return a + b; }
fn subtract(a, b) { return a - b; }
fn multiply(a, b) { return a * b; }

fn divide(a, b) {
    if (b == 0) {
        return { ok: false, error: "Cannot divide by zero" };
    }
    return { ok: true, value: a / b };
}

fn power(a, b) {
    let result = 1;
    for i in 0..b {
        result = result * a;
    }
    return result;
}

fn modulo(a, b) {
    if (b == 0) {
        return { ok: false, error: "Cannot modulo by zero" };
    }
    return { ok: true, value: a % b };
}
```

## Step 3: Menu System

```adesh
fn show_menu() {
    print("┌──────────────────────┐");
    print("│   SELECT OPERATION   │");
    print("├──────────────────────┤");
    print("│ 1. Add (+)           │");
    print("│ 2. Subtract (-)      │");
    print("│ 3. Multiply (*)      │");
    print("│ 4. Divide (/)        │");
    print("│ 5. Power (^)         │");
    print("│ 6. Modulo (%)        │");
    print("│ 7. View History      │");
    print("│ 8. Clear History     │");
    print("│ 0. Exit              │");
    print("└──────────────────────┘");
}

fn get_choice() {
    // Simulated input (in real app, use input())
    let choice = 1;  // Change this to test different options
    return choice;
}
```

## Step 4: Get Numbers from User

```adesh
fn get_numbers() {
    // Simulated input
    let a = 10;
    let b = 5;
    return { a: a, b: b };
}
```

## Step 5: Execute Operation

```adesh
fn calculate(choice, a, b) {
    if (choice == 1) return { ok: true, value: add(a, b), symbol: "+" };
    if (choice == 2) return { ok: true, value: subtract(a, b), symbol: "-" };
    if (choice == 3) return { ok: true, value: multiply(a, b), symbol: "*" };
    if (choice == 4) return divide(a, b);
    if (choice == 5) return { ok: true, value: power(a, b), symbol: "^" };
    if (choice == 6) return modulo(a, b);
    return { ok: false, error: "Invalid operation" };
}
```

## Step 6: History System

```adesh
let history = [];

fn add_to_history(a, symbol, b, result) {
    let entry = {
        a: a,
        symbol: symbol,
        b: b,
        result: result,
        timestamp: "2024-01-15 10:30:00"  // Simulated
    };
    history.push(entry);
}

fn show_history() {
    if (len(history) == 0) {
        print("No calculations yet.");
        return;
    }
    
    print("┌─────────────────────────────────────┐");
    print("│         CALCULATION HISTORY         │");
    print("├─────────────────────────────────────┤");
    
    for i in 0..len(history) {
        let h = history[i];
        print(i + 1, ". ", h.a, " ", h.symbol, " ", h.b, " = ", h.result);
    }
    
    print("└─────────────────────────────────────┘");
}

fn clear_history() {
    history = [];
    print("History cleared.");
}
```

## Step 7: Main Loop

```adesh
fn main() {
    print("╔══════════════════════╗");
    print("║   ADESH CALCULATOR   ║");
    print("╚══════════════════════╝");
    print("");
    
    let running = true;
    
    while (running) {
        show_menu();
        let choice = get_choice();
        
        if (choice == 0) {
            print("Thank you for using Adesh Calculator!");
            running = false;
        } elif (choice == 7) {
            show_history();
        } elif (choice == 8) {
            clear_history();
        } elif (choice >= 1 && choice <= 6) {
            let nums = get_numbers();
            let result = calculate(choice, nums.a, nums.b);
            
            if (result.ok) {
                print("Result: ", nums.a, " ", result.symbol, " ", nums.b, " = ", result.value);
                add_to_history(nums.a, result.symbol, nums.b, result.value);
            } else {
                print("Error: ", result.error);
            }
        } else {
            print("Invalid choice. Please try again.");
        }
        
        print("");  // Empty line for readability
    }
}
```

## Complete Working Version

Here's the full calculator you can run:

```adesh
// calculator.adesh - Complete Calculator App

let history = [];

fn add(a, b) { return a + b; }
fn subtract(a, b) { return a - b; }
fn multiply(a, b) { return a * b; }

fn divide(a, b) {
    if (b == 0) return { ok: false, error: "Cannot divide by zero" };
    return { ok: true, value: a / b };
}

fn power(a, b) {
    let result = 1;
    for i in 0..b {
        result = result * a;
    }
    return result;
}

fn modulo(a, b) {
    if (b == 0) return { ok: false, error: "Cannot modulo by zero" };
    return { ok: true, value: a % b };
}

fn show_menu() {
    print("┌──────────────────────┐");
    print("│   SELECT OPERATION   │");
    print("├──────────────────────┤");
    print("│ 1. Add (+)           │");
    print("│ 2. Subtract (-)      │");
    print("│ 3. Multiply (*)      │");
    print("│ 4. Divide (/)        │");
    print("│ 5. Power (^)         │");
    print("│ 6. Modulo (%)        │");
    print("│ 7. View History      │");
    print("│ 8. Clear History     │");
    print("│ 0. Exit              │");
    print("└──────────────────────┘");
}

fn calculate(choice, a, b) {
    if (choice == 1) return { ok: true, value: add(a, b), symbol: "+" };
    if (choice == 2) return { ok: true, value: subtract(a, b), symbol: "-" };
    if (choice == 3) return { ok: true, value: multiply(a, b), symbol: "*" };
    if (choice == 4) return divide(a, b);
    if (choice == 5) return { ok: true, value: power(a, b), symbol: "^" };
    if (choice == 6) return modulo(a, b);
    return { ok: false, error: "Invalid operation" };
}

fn add_to_history(a, symbol, b, result) {
    history.push({ a: a, symbol: symbol, b: b, result: result });
}

fn show_history() {
    if (len(history) == 0) {
        print("No calculations yet.");
        return;
    }
    print("┌─────────────────────────────────────┐");
    print("│         CALCULATION HISTORY         │");
    print("├─────────────────────────────────────┤");
    for i in 0..len(history) {
        let h = history[i];
        print(i + 1, ". ", h.a, " ", h.symbol, " ", h.b, " = ", h.result);
    }
    print("└─────────────────────────────────────┘");
}

fn clear_history() {
    history = [];
    print("History cleared.");
}

// Demo runner (simulates user interaction)
fn run_demo() {
    let demo_choices = [1, 2, 3, 4, 5, 6, 4, 7, 0];
    let demo_numbers = [
        { a: 10, b: 5 },    // 10 + 5
        { a: 20, b: 8 },    // 20 - 8
        { a: 6, b: 7 },     // 6 * 7
        { a: 15, b: 3 },    // 15 / 3
        { a: 2, b: 8 },     // 2 ^ 8
        { a: 17, b: 5 },    // 17 % 5
        { a: 10, b: 0 },    // 10 / 0 (error)
    ];
    
    print("╔══════════════════════╗");
    print("║   ADESH CALCULATOR   ║");
    print("╚══════════════════════╝");
    print("");
    
    let num_idx = 0;
    
    for choice in demo_choices {
        show_menu();
        print("Choice:", choice);
        
        if (choice == 0) {
            print("Thank you for using Adesh Calculator!");
            break;
        } elif (choice == 7) {
            show_history();
        } elif (choice == 8) {
            clear_history();
        } elif (choice >= 1 && choice <= 6) {
            if (num_idx >= len(demo_numbers)) {
                print("Demo numbers exhausted");
                break;
            }
            
            let nums = demo_numbers[num_idx];
            num_idx = num_idx + 1;
            
            print("Input:", nums.a, "and", nums.b);
            let result = calculate(choice, nums.a, nums.b);
            
            if (result.ok) {
                print("Result: ", nums.a, " ", result.symbol, " ", nums.b, " = ", result.value);
                add_to_history(nums.a, result.symbol, nums.b, result.value);
            } else {
                print("Error: ", result.error);
            }
        } else {
            print("Invalid choice");
        }
        
        print("");
    }
}

run_demo();
```

## Run It

Save as `calculator.adesh` and run:

```bash
adesh run calculator.adesh
```

## Expected Output

```
╔══════════════════════╗
║   ADESH CALCULATOR   ║
╚══════════════════════╝

┌──────────────────────┐
│   SELECT OPERATION   │
├──────────────────────┤
│ 1. Add (+)           │
│ 2. Subtract (-)      │
│ 3. Multiply (*)      │
│ 4. Divide (/)        │
│ 5. Power (^)         │
│ 6. Modulo (%)        │
│ 7. View History      │
│ 8. Clear History     │
│ 0. Exit              │
└──────────────────────┘
Choice: 1
Input: 10 and 5
Result: 10 + 5 = 15

Choice: 2
Input: 20 and 8
Result: 20 - 8 = 12

Choice: 3
Input: 6 and 7
Result: 6 * 7 = 42

Choice: 4
Input: 15 and 3
Result: 15 / 3 = 5

Choice: 5
Input: 2 and 8
Result: 2 ^ 8 = 256

Choice: 6
Input: 17 and 5
Result: 17 % 5 = 2

Choice: 4
Input: 10 and 0
Error: Cannot divide by zero

Choice: 7
┌─────────────────────────────────────┐
│         CALCULATION HISTORY         │
├─────────────────────────────────────┤
1. 10 + 5 = 15
2. 20 - 8 = 12
3. 6 * 7 = 42
4. 15 / 3 = 5
5. 2 ^ 8 = 256
6. 17 % 5 = 2
└─────────────────────────────────────┘

Choice: 0
Thank you for using Adesh Calculator!
```

## Key Concepts Used

| Concept | Where Used |
|---------|------------|
| Variables | `history`, `running`, `choice`, `nums` |
| Functions | `add`, `calculate`, `show_menu`, etc. |
| Conditionals | `if/elif/else` in `calculate` and main loop |
| Loops | `while (running)` main loop, `for` in `power` and history |
| Arrays | `history` array, `demo_choices` |
| Objects | Operation results `{ ok, value, error }`, history entries |
| Error Handling | Division by zero returns error object |

## Extensions to Try

### 1. Add More Operations
```adesh
fn sqrt(a) { ... }
fn percent(a, b) { return a * b / 100; }
```

### 2. Scientific Mode
```adesh
fn sin(a) { ... }
fn cos(a) { ... }
fn log(a) { ... }
```

### 3. Expression Parser
```adesh
fn evaluate("2 + 3 * 4") { ... }  // Returns 14
```

### 4. Save/Load History
```adesh
fn save_history() {
    // Write to file
    print(history, { file: "calc_history.json" });
}

fn load_history() {
    // Read from file
}
```

### 5. Real Input (when available)
```adesh
fn get_choice() {
    print("Enter choice: ");
    return input();  // Future feature
}

fn get_numbers() {
    print("First number: ");
    let a = number(input());
    print("Second number: ");
    let b = number(input());
    return { a, b };
}
```

## Summary

✅ **You built a complete calculator with:**
- Menu-driven interface
- 6 mathematical operations
- Error handling (division by zero)
- Calculation history
- Clean, organized code with functions

## What You've Learned

```
┌─────────────────────────────────────────────────────────────┐
│                 LEARN PROGRAMMING SO FAR                    │
├─────────────────────────────────────────────────────────────┤
│  1. Hello World     →  First program, print, strings       │
│  2. Variables       →  let, types, mutability, arrays      │
│  3. Operators       →  + - * / %, == ===, ??, ?.          │
│  4. Conditionals    →  if/else, comparisons, logic         │
│  5. Loops           →  for/while, break/continue, patterns │
│  6. Functions       →  fn, parameters, return, closures    │
│  7. Higher-order    →  callbacks, factories, composition   │
│  8. Recursion       →  self-calls, tail calls, multiple ✅ │
│  9. Collections     →  arrays, objects, map/filter/reduce  │
│ 10. Calculator      →  Complete project integrating all    │
└─────────────────────────────────────────────────────────────┘
```

## Where to Go Next

The calculator consolidated **lessons 1–9**. The course continues with text,
types, and data modeling:

| Path | Description |
|------|-------------|
| **Next lesson** | [Strings & Text](/learn/strings) — interpolation, templates, methods |
| **Language Guide** | [Basics](/docs/language-guide/basics) — Deep dive into syntax |
| **Memory Safety** | [Ownership](/docs/advanced/memory-safety) — AdeshLang's superpower |
| **OOP** | [Classes](/docs/advanced/oop) — Object-oriented programming |
| **Async** | [Async/Await](/docs/advanced/async-await) — Concurrent programming |
| **Backends** | [Native JIT](/docs/backends/native-jit) — 100x+ speedups |
| **Examples** | [400+ examples](/learn-by-examples/runnable-examples) — Learn by reading code |

## Final Challenge

Try building these on your own:

1. **Todo List** — Add, remove, mark complete, save to file
2. **Number Guessing Game** — Random number, hints, score tracking
3. **Text Adventure** — Rooms, items, commands, story
4. **Expense Tracker** — Categories, totals, monthly reports

---

**Congratulations!** 🎉 You've completed the "Learn Programming with AdeshLang" tutorial series. You now have the foundation to build real applications. Keep coding, keep exploring, and remember:

> **आदेश (Adesh)** — Give the command. The machine obeys.

Happy coding! 🚀