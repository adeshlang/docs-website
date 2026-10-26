---
id: oop
title: Object-Oriented Programming
sidebar_label: OOP
---

# Object-Oriented Programming (OOP)

Adesh provides a production-ready, highly optimized Object-Oriented Programming (OOP) system. It features state encapsulation, single inheritance, properties, interfaces, abstract classes, sealed classes, and a packed memory layout for class instances.

---

## 1. Classes and Constructors

Classes are declared using the `class` keyword. Constructors are defined as functions named identically to the class, and instantiating a class requires the `new` keyword.

```adesh
class Person {
    name: string;
    age: i64;
    
    Person(name: string, age: i64) {
        this.name = name;
        this.age = age;
    }
    
    fn greet() {
        print("Hello, I'm", this.name);
    }
}

let user = new Person("Alice", 30);
user.greet();
```

---

## 2. Inheritance and Super Calls

Adesh supports single inheritance using the `extends` keyword. Child classes must delegate constructor arguments to parent constructors using `super(...)`.

```adesh
class Employee extends Person {
    department: string;
    
    Employee(name: string, age: i64, department: string) {
        super(name, age); // Calls parent constructor
        this.department = department;
    }
    
    // Method Overriding
    fn greet() {
        print("Hello, I'm", this.name, "from", this.department);
    }
}
```

---

## 3. Visibility Modifiers

To enforce encapsulation, Adesh supports member-level visibility modifiers for both fields and methods:

| Modifier | Accessibility |
| :--- | :--- |
| `public` | Default. Accessible from anywhere in the codebase. |
| `protected` | Accessible only within the declaring class and its subclasses. |
| `private` | Accessible only within the declaring class itself. |

### Visibility Example

```adesh
class BankAccount {
    private balance: f64;
    protected accountNumber: string;
    public owner: string;

    BankAccount(owner: string, initial: f64, accNum: string) {
        this.owner = owner;
        this.balance = initial;
        this.accountNumber = accNum;
    }

    private fn logTransaction(action: string) {
        print("[TX LOG]", this.accountNumber, ":", action);
    }

    public fn deposit(amount: f64) {
        this.balance = this.balance + amount;
        this.logTransaction("Deposit of " + string(amount));
    }
}
```

---

## 4. Properties (Getters and Setters)

Properties behave like fields but execute code on access. Define them using the `get` and `set` keywords to enable computed values, input validation, and API abstraction.

```adesh
class Circle {
    radius: f64;

    Circle(radius: f64) {
        this.radius = radius;
    }

    // Getter - computed property
    get diameter() {
        return 2.0 * this.radius;
    }

    // Setter - validates and updates underlying state
    set diameter(value: f64) {
        if value < 0.0 {
            panic("Diameter cannot be negative");
        }
        this.radius = value / 2.0;
    }
}

let c = new Circle(5.0);
print(c.diameter); // 10.0 (calls getter)
c.diameter = 12.0; // Calls setter, sets radius to 6.0
```

---

## 5. Abstract Classes and Interfaces

To design extensible systems, use abstract classes and interfaces:

* **Abstract Classes**: Marked with `abstract`. They cannot be instantiated. Methods marked with `abstract` have no body and must be overridden in subclasses.
* **Interfaces**: Declare behavior contracts without state. Classes adopt them using the `implements` keyword.

```adesh
abstract class Shape {
    abstract fn area(): f64;
}

interface Drawable {
    fn draw(): void;
}

class Square extends Shape implements Drawable {
    side: f64;

    Square(side: f64) {
        this.side = side;
    }

    fn area() {
        return this.side * this.side;
    }

    fn draw() {
        print("Drawing a square.");
    }
}
```

---

## 6. Sealed Classes

The `sealed` modifier prevents classes from being extended. This is a zero-runtime-overhead, compile-time assertion that is useful for final implementations, API stability, security, and compiler devirtualization.

```adesh
sealed class Config {
    environment: string;

    Config(env: string) {
        this.environment = env;
    }
}

// Compiling this will raise a compiler error:
// "Cannot extend sealed class 'Config'"
class CustomConfig extends Config {} 
```

---

## 7. Memory Optimization: Packed Contiguous Layout

Adesh features transparent runtime layout optimization for class instances.
* ** HashMap Fallback**: Old class field storages historically used slow HashMaps (~100ns per lookup, 200+ bytes overhead).
* **Packed Layout**: The runtime automatically packs primitive fields (`i8-i128`, `u8-u128`, `f32`, `f64`, `bool`, etc.) into a packed, contiguous memory buffer.
* **Performance Impact**:
  * **Memory**: Overhead drops from 200+ bytes to **8–16 bytes** per instance (90%+ reduction).
  * **Access Speed**: Field access is compiled to direct memory offsets (single-digit nanoseconds).
  * **Locality**: Highly optimized CPU cache alignment.
  * **Transparent Fallback**: Complex reference types (e.g. `string`, arrays, objects, functions) seamlessly fall back to HashMap storage without changing any user-facing APIs.
