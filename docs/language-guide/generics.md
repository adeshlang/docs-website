---
id: generics
title: Generics & Parametric Polymorphism
sidebar_label: Generics
description: Generic functions, structs, traits, type bounds, and zero-cost monomorphization in AdeshLang.
---

# Generics & Parametric Polymorphism

Generics allow you to write flexible, reusable code that works with any data type while preserving full compile-time type safety and maximum execution performance.

```adesh
struct Stack<T> {
    elements: [T],
}
```

---

## 1. Generic Functions

Declare generic type parameters inside angle brackets `<T>`:

```adesh
// Generic swap function working on any type T
fn swap<T>(a: &mut T, b: &mut T) {
    let temp = *a;
    *a = *b;
    *b = temp;
}

fn main() {
    let mut x = 10;
    let mut y = 20;
    swap(&mut x, &mut y);
    print(f"x: {x}, y: {y}"); // x: 20, y: 10

    let mut str1 = "World";
    let mut str2 = "Hello";
    swap(&mut str1, &mut str2);
    print(f"{str1} {str2}"); // Hello World
}
```

---

## 2. Generic Structs & Classes

Structs can be parameterized by one or more generic types:

```adesh
struct KeyValuePair<K, V> {
    key: K,
    value: V,
}

struct Stack<T> {
    items: [T],

    pub fn new() -> Stack<T> {
        return Stack { items: [] };
    }

    pub fn push(&mut self, item: T) {
        self.items.push(item);
    }

    pub fn pop(&mut self) -> Option<T> {
        return self.items.pop();
    }

    pub fn is_empty(&self) -> bool {
        return self.items.len() == 0;
    }
}
```

---

## 3. Trait Bounds & Constraints

You can restrict generic parameters to types that implement specific traits using the `: Trait` syntax:

```adesh
trait Printable {
    fn format(&self) -> string;
}

trait Comparable<T> {
    fn compare(&self, other: &T) -> i32;
}

// Function requires T to implement Printable
fn print_item<T: Printable>(item: &T) {
    print(item.format());
}

// Multiple trait bounds using +
fn find_max<T: Comparable<T> + Clone>(items: &[T]) -> Option<T> {
    if items.is_empty() {
        return None;
    }
    let mut max_val = items[0].clone();
    for item in items {
        if item.compare(&max_val) > 0 {
            max_val = item.clone();
        }
    }
    return Some(max_val);
}
```

---

## 4. Zero-Cost Monomorphization

AdeshLang implements generics using **monomorphization**:
- During compilation, the compiler generates a specialized, optimized version of the generic function or struct for each concrete type used in your program.
- Generic code runs at **100% the speed of hand-written type-specific code**.
- **Zero runtime dispatch overhead** and zero boxing penalty.

```
Source Generic:
fn identity<T>(val: T) -> T { val }

Monomorphized Machine Code:
fn identity_i64(val: i64) -> i64 { val }
fn identity_string(val: string) -> string { val }
```
