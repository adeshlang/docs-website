---
id: enums-pattern-matching
title: Enums & Algebraic Data Types
sidebar_label: Enums & ADTs
description: Algebraic data types, payload variants, exhaustive pattern matching, and methods on enums in AdeshLang.
---

# Enums & Algebraic Data Types

Enums in AdeshLang are full **Algebraic Data Types (ADTs)**. Unlike simple C-style enumerations that only represent numeric constants, AdeshLang enums can store arbitrary heterogeneous data payloads in each variant.

```adesh
enum Shape {
    Circle(radius: f64),
    Rectangle(width: f64, height: f64),
    Point,
}
```

---

## 1. Defining Enums

### Simple Unit Enums
```adesh
enum Direction {
    North,
    East,
    South,
    West,
}
```

### Enums with Data Payloads
Variants can contain tuple payloads, named struct fields, or zero fields:

```adesh
enum UserAction {
    Quit,
    Move { x: i32, y: i32 },
    Write(string),
    ChangeColor(u8, u8, u8),
}
```

---

## 2. Exhaustive Pattern Matching with `match`

The primary way to consume and inspect enum values is the `match` expression. The compiler enforces that every possible variant is handled:

```adesh
fn process_action(action: UserAction) {
    match action {
        UserAction::Quit => {
            print("Quitting application...");
        }
        UserAction::Move { x, y } => {
            print(f"Moving to coordinates ({x}, {y})");
        }
        UserAction::Write(text) => {
            print(f"Writing message: {text}");
        }
        UserAction::ChangeColor(r, g, b) => {
            print(f"Changed color to RGB({r}, {g}, {b})");
        }
    }
}
```

---

## 3. Concise Matching with `if let` and `while let`

When you only care about matching one specific enum variant:

```adesh
let action = UserAction::Write("Save file");

// if let executes only if variant matches
if let UserAction::Write(msg) = action {
    print(f"Received write task: {msg}");
}

// while let iterates until an iterator returns Option::None
let mut stack = [10, 20, 30];
while let Some(top) = stack.pop() {
    print(f"Popped: {top}");
}
```

---

## 4. Implementing Methods on Enums

Enums can have associated functions and instance methods using `impl`:

```adesh
enum Shape {
    Circle(f64),
    Rectangle(f64, f64),
    Square(f64),
}

impl Shape {
    pub fn area(&self) -> f64 {
        match self {
            Shape::Circle(r) => 3.1415926535 * r * r,
            Shape::Rectangle(w, h) => w * h,
            Shape::Square(s) => s * s,
        }
    }

    pub fn is_square(&self) -> bool {
        match self {
            Shape::Square(_) => true,
            Shape::Rectangle(w, h) => w == h,
            _ => false,
        }
    }
}

fn main() {
    let circle = Shape::Circle(5.0);
    let rect = Shape::Rectangle(4.0, 6.0);

    print(f"Circle area: {circle.area()}");
    print(f"Rectangle area: {rect.area()}");
}
```

---

## 5. Memory Representation & Optimization

AdeshLang enums are laid out efficiently in memory:

1. **Tag Byte / Discriminant**: A small integer (`u8` or `u16`) identifying the active variant.
2. **Payload Union**: The memory required is sized to the largest variant payload plus alignment padding.
3. **Null Pointer Optimization (Niche Filling)**: For types like `Option<&T>` or `Option<Arc<T>>`, the compiler uses the null pointer representation (`0x0`) for `None`, reducing the memory size to exactly pointer width (8 bytes) with 0 tag overhead!
