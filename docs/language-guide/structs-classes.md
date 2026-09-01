---
id: structs-classes
title: Structs & Classes (OOP)
sidebar_label: Structs & Classes
---

# Structs & Classes (OOP)

AdeshLang supports nominal data modeling and Object-Oriented Programming (OOP) through `struct` definitions, class inheritance (`extends`), and extension methods (`extend on`).

---

## 1. Structs

Structs are simple nominal data containers with named fields. They are strictly structured records and **cannot** contain method definitions inside the `struct` block itself.

### Defining a Struct

Fields in a struct are separated by either semicolons (`;`) or commas (`,`):

```adesh
struct Point {
    x: f64;
    y: f64;
}
```

### Initializing a Struct

Struct instances are created using struct literal syntax, without the `new` keyword:

```adesh
let p = Point { x: 10.0, y: 20.0 };
print("Coordinates:", p.x, p.y);
```

---

## 2. Extension Methods (`extend on`)

To add functionality to a struct or class, use the `extend on` block. 

### Syntax Rules
* Methods inside the `extend on` block **must not** declare `this` or `self` as a parameter.
* Inside the method body, you can refer to the receiver instance using either `this` or `self`.

```adesh
struct Rectangle {
    width: f64;
    height: f64;
}

extend on Rectangle {
    fn area() {
        return this.width * this.height;
    }
    
    fn perimeter() {
        return 2.0 * (self.width + self.height);
    }
}

let rect = Rectangle { width: 5.0, height: 4.0 };
print("Area:", rect.area());       // 20.0
print("Perimeter:", rect.perimeter()); // 18.0
```

---

## 3. Classes

Classes provide state encapsulation, inheritance, and object-oriented features.

### Defining a Class and Constructor

Unlike structs, classes can define fields, constructors, and methods inside their block:
* **Constructor**: The constructor is a special function named **identically** to the class itself. Using `fn init` or `constructor` is not supported.
* **Method Signatures**: Do not write `this` or `self` as the first parameter. Access the instance using `this` or `self` implicitly.

```adesh
class Animal {
    name: string;

    Animal(name: string) {
        this.name = name;
    }

    fn speak() {
        print(this.name, "makes a sound.");
    }
}
```

### Instantiating a Class

Instantiating a class **requires** the `new` keyword:

```adesh
let a = new Animal("Generic Animal");
a.speak(); // "Generic Animal makes a sound."
```

---

## 4. Inheritance (`extends`)

Subclasses inherit properties and methods from parent classes using the `extends` keyword.

* **Super Constructor**: Subclasses must call the parent constructor using `super(...)` inside their constructor block.
* **Method Overriding**: Child classes can redefine parent methods to customize behavior.

```adesh
class Dog extends Animal {
    breed: string;

    Dog(name: string, breed: string) {
        super(name); // Call the parent constructor
        this.breed = breed;
    }

    fn speak() {
        print(this.name, "the", this.breed, "barks!");
    }
}

let d = new Dog("Buddy", "Golden Retriever");
d.speak(); // "Buddy the Golden Retriever barks!"
```
