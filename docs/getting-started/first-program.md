---
id: first-program
title: Your First AdeshLang Program
sidebar_label: First Program
description: Step-by-step beginner guide to writing, compiling, and running your first programs in AdeshLang.
---

# Your First AdeshLang Program

Welcome to AdeshLang! In this tutorial, you will write, analyze, compile, and run your first AdeshLang programs.

---

## 1. The Classic "Hello, World!"

Create a new file named `hello.adesh`:

```adesh
fn main() {
    print("Hello, World from AdeshLang!");
}
```

### Running It

Execute the program with the `adesh run` command:

```bash
adesh run hello.adesh
```

**Output:**
```text
Hello, World from AdeshLang!
```

---

## 2. Anatomy of an AdeshLang Program

Let's break down each element:

```adesh
fn main() {
    print("Hello, World!");
}
```

1. **`fn main()`**: The entry point of every standalone executable. When your program starts, execution begins here.
2. **`{ ... }`**: Braces define the code block and lexical scope.
3. **`print(...)`**: A built-in standard function that writes formatted text to standard output (`stdout`), followed by a newline.
4. **`;`**: Semicolons denote the end of a statement.

---

## 3. Interactive Program: CLI User Greeter

Let's build a program that reads user input from the terminal:

Create `greeter.adesh`:

```adesh
import { io } from "builtin";

fn main() {
    print("Enter your name: ");
    let name = io::read_line();
    
    // String interpolation using f"..."
    print(f"Welcome to systems programming in AdeshLang, {name.trim()}!");
}
```

Run it:
```bash
adesh run greeter.adesh
```

---

## 4. Building a Temperature Converter

Let's explore variables, type annotations, functions, and control flow:

Create `convert.adesh`:

```adesh
// Convert Fahrenheit to Celsius
fn fahrenheit_to_celsius(deg_f: f64) -> f64 {
    return (deg_f - 32.0) * (5.0 / 9.0);
}

// Convert Celsius to Fahrenheit
fn celsius_to_fahrenheit(deg_c: f64) -> f64 {
    return (deg_c * 9.0 / 5.0) + 32.0;
}

fn main() {
    let boiling_f: f64 = 212.0;
    let freezing_f: f64 = 32.0;
    let room_temp_c: f64 = 22.5;

    let boiling_c = fahrenheit_to_celsius(boiling_f);
    let freezing_c = fahrenheit_to_celsius(freezing_f);
    let room_temp_f = celsius_to_fahrenheit(room_temp_c);

    print("=== Temperature Conversions ===");
    print(f"{boiling_f}°F is {boiling_c}°C");
    print(f"{freezing_f}°F is {freezing_c}°C");
    print(f"{room_temp_c}°C is {room_temp_f}°F");
}
```

---

## 5. Compiling to a Standalone Executable (AOT)

While `adesh run` runs your code instantly with JIT or the interpreter, you can compile your code to an optimized, standalone native binary that has zero external runtime dependencies:

```bash
# Compile to a native binary
adesh build --release convert.adesh -o convert

# On Linux/macOS:
./convert

# On Windows:
.\convert.exe
```

---

## 6. Next Steps

Now that you have written and compiled your first programs, explore the foundational concepts of the language:
- [Language Basics](../language-guide/basics)
- [Variables & Types](../language-guide/variables)
- [Memory Safety & Zero-GC](../advanced/memory-safety)
- [Standard Library Overview](../builtin/overview)
