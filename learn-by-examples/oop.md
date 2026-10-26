---
id: oop
title: OOP, Structs & Extensions
sidebar_label: OOP & Extensions
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# OOP, Structs & Extensions

<FeatureStatus status="STABLE" details="Classes, single inheritance, super constructors, nominal structs, and extend on extension blocks" />

Adesh supports object-oriented programming via classes, inheritance (`extends`), `super` constructor delegation, nominal struct records, and static or instance extension blocks (`extend on`).

---

## 1. Classes, Constructors & Inheritance (`extends`, `super`)

Classes define object blueprints containing fields, methods, constructors (`ClassName`), inheritance (`extends`), and parent delegate calls (`super`).

### Code Example

```adesh
import Math;

// Base Class
class Shape {
    name: string;

    Shape(name: string) {
        this.name = name;
    }

    fn describe() {
        print("Shape Name:", this.name);
    }
}

// Derived Subclass
class Circle extends Shape {
    radius: f64;

    Circle(name: string, radius: f64) {
        super(name); // Delegate to parent Shape constructor
        this.radius = radius;
    }

    fn area(): f64 {
        return Math.PI * this.radius * this.radius;
    }
}

let c = new Circle("Unit Circle", 2.5);
c.describe();
print("Calculated Area:", c.area());
```

### Terminal Output

```text
Shape Name: Unit Circle
Calculated Area: 19.634954084936208
```

### Breakdown

* **`class Name`**: Defines object layout and method definitions.
* **`extends`**: Establishes single class inheritance from a base parent class.
* **`super(...)`**: Invokes the parent class constructor from within the derived subclass constructor.
* **`new ClassName(...)`**: Instantiates a new object instance on the heap.

---

## 2. Structs & Extension Blocks (`extend on`)

Structs (`struct Name { ... };`) are nominal data records. Methods can be attached to existing structs or types using extension blocks (`extend on`).

### Code Example

```adesh
import Math;

// Struct record definition (terminated with a semicolon)
struct Vector2D {
    x: f64;
    y: f64;
};

// Extension block attaching methods to Vector2D
extend on Vector2D {
    fn magnitude(): f64 {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    fn scale(factor: f64) {
        return Vector2D {
            x: this.x * factor,
            y: this.y * factor
        };
    }
}

let v1 = Vector2D { x: 3.0, y: 4.0 };
print("Vector1 Magnitude:", v1.magnitude());

let v2 = v1.scale(2.0);
print("Scaled Vector2 -> x:", v2.x, "y:", v2.y);
print("Vector2 Magnitude:", v2.magnitude());
```

### Terminal Output

```text
Vector1 Magnitude: 5
Scaled Vector2 -> x: 6 y: 8
Vector2 Magnitude: 10
```

### Breakdown

* **`struct Name { fields... };`**: Nominal struct definition without behavior. Always terminated with `;`.
* **`extend on TargetType { methods... }`**: Decorates or extends existing structs, classes, or types with additional instance/static methods cleanly without modifying original source definitions.
