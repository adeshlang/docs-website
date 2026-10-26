---
id: structs-classes
title: "Structs, Classes, Inheritance & Retroactive Extensions"
description: "Formal specification of struct/class memory layouts, extends inheritance, extend on retroactive extension, interfaces, sealed/abstract modifiers, and VTable dispatch."
sidebar_label: "Structs, Classes & Extensions"
---

# Structs, Classes, Inheritance & Retroactive Extensions

This document defines the physical memory layouts, field alignment rules, class inheritance semantics (`extends`), retroactive type extension (`extend on`), interface implementation (`implements`), class modifiers (`abstract`, `sealed`), and Virtual Table (VTable) dynamic dispatch in Adesh.

---

## 1. `struct` Architecture & Value Semantics

`struct` declarations define value types allocated inline on the stack frame or embedded directly within containing data structures:

```adesh
#[repr(C)]
struct Vector3D {
    x: f64,
    y: f64,
    z: f64,
}
```

### 1.1 Field Offset & Padding Calculation Rules
Fields are laid out sequentially in memory. Every field offset must align to a multiple of that field's natural alignment requirement:

```text
Field Alignment Requirement = min(sizeof(T), Max Alignment)
```

```
#[repr(C)]
struct MixedLayout {
    a: u8,   // Offset 0x00 (1 byte)
             // Offset 0x01..0x03 (3 Padding Bytes)
    b: u32,  // Offset 0x04 (4 bytes)
    c: u8,   // Offset 0x08 (1 byte)
             // Offset 0x09..0x0F (7 Padding Bytes for 8-byte struct alignment)
    d: u64,  // Offset 0x10 (8 bytes)
}
```

```text
Total Struct Size = 24 Bytes (Aligned to 8 Bytes)
```

---

## 2. `class` Architecture & Heap Allocation

`class` declarations define reference types allocated on the managed heap. Variables holding a class instance store an 8-byte heap pointer:

```adesh
class Engine {
    private power_kw: f64;
    public status: string;

    public fn start(self) {
        print("Engine Running");
    }
}
```

### 2.1 Object Memory Header Layout
Every class instance on the heap begins with a **16-byte Object Header** followed immediately by contiguous instance fields:

```
Heap Object Memory Structure
+-------------------------------------------------------+
| Offset 0x00: VTable Pointer (8 Bytes)                 |  --> Points to Class VTable
+-------------------------------------------------------+
| Offset 0x08: Reference Count / GC Header (8 Bytes)    |  --> Atomic Ref Count
+-------------------------------------------------------+
| Offset 0x10: Field 'power_kw' (f64, 8 Bytes)          |  --> Parent & Instance Fields
+-------------------------------------------------------+
| Offset 0x18: Field 'status' (24-byte string header)   |
+-------------------------------------------------------+
```

---

## 3. Inheritance Mechanics (`extends` Keyword)

A class inherits fields and methods from a single parent class using the `extends` keyword:

```adesh
class Vehicle {
    protected weight_kg: f64;

    public fn constructor(weight_kg: f64) {
        self.weight_kg = weight_kg;
    }
}

class ElectricCar extends Vehicle {
    private battery_kwh: f64;

    public fn constructor(weight_kg: f64, battery_kwh: f64) {
        super(weight_kg); // Constructor delegation to parent class
        self.battery_kwh = battery_kwh;
    }
}
```

### 3.1 Field Offset Accumulation in Subclasses
Child class memory layouts prepend the parent class field sequence before appending child instance fields:

```text
Field Offset(ChildField_i) = sizeof(Header) + sizeof(ParentFields) + Offset_child_relative(i)
```

This layout allows functions expecting a parent pointer `&Vehicle` to accept a child pointer `&ElectricCar` without pointer adjustment (Zero-Cost Polymorphism).

---

## 4. Retroactive Type Extension (`extend ... on` Block)

Adesh allows developers to extend existing built-in or user-defined types with additional methods retroactively without modifying the original declaration or wrapper structs:

```adesh
// Add custom method to built-in string type
extend on string {
    public fn is_empty_or_whitespace(self): bool {
        return self.trim().len() == 0;
    }
}

// Add methods to custom Person class
extend on Person {
    public fn generate_badge(self): string {
        return f"Badge: {self.name}";
    }
}
```

### 4.1 Implementation & Symbol Table Expansion
`extend on Type` declarations do not mutate object memory layouts or add VTable slots. Instead:
- The compiler registers extension methods in the target type's extended symbol namespace.
- Method calls (`str.is_empty_or_whitespace()`) are resolved at compile time to direct monomorphic functions passing the target instance as `self`.

---

## 5. Interfaces (`interface` & `implements` Keywords)

Interfaces declare method contracts without providing concrete implementations:

```adesh
interface Resizable {
    fn resize(factor: f64);
}

class Canvas implements Resizable {
    private width: f64;

    public fn resize(self, factor: f64) {
        self.width *= factor;
    }
}
```

When a class implements an interface, the compiler builds an **Interface Table (ITable)** array referenced inside the primary VTable, allowing $O(1)$ dynamic interface dispatch.

---

## 6. Class Modifiers (`abstract` & `sealed`)

### 6.1 `abstract` Classes & Methods
`abstract` classes cannot be directly constructed with `new`. They can define incomplete `abstract fn` declarations that subclasses must override:

```adesh
abstract class Shape {
    public abstract fn calculate_area(self): f64;
}
```

### 6.2 `sealed` Classes
`sealed` classes restrict inheritance to the module in which they are defined. Attempting to extend a `sealed` class in an external module triggers a fatal compilation error (`E0043: Cannot extend sealed class outside defining module`).

---

## 7. Virtual Table (VTable) & Dynamic Dispatch

When a class defines or overrides virtual methods, the compiler constructs a static, read-only Virtual Table (VTable) array in the `.rodata` segment:

```
VTable Memory Array for Class ElectricCar (.rodata segment)
+-------------------------------------------------------+
| Offset 0x00: Type Descriptor Pointer                  |
+-------------------------------------------------------+
| Offset 0x08: Method Slot 0: Vehicle.get_weight()      |  --> Inherited parent method
+-------------------------------------------------------+
| Offset 0x10: Method Slot 1: ElectricCar.start()       |  --> Overridden child method
+-------------------------------------------------------+
```

### 7.1 Dynamic Method Call Lowering
Dynamic virtual method invocations (`car_ptr.start()`) execute via two-level pointer dereferencing:

```text
MOV   RAX, [RDI + 0]     ; Load VTable Pointer from Object Header (Offset 0x00)
MOV   RAX, [RAX + 16]    ; Load Method Address from VTable Slot 1 (Offset 0x10)
CALL  RAX                ; Jump to method code
```

---

## 8. Access Modifier Enforcement

Field and method access boundaries (`public`, `protected`, `private`) are enforced strictly at compile time during semantic analysis:

| Access Modifier | Enclosing Class | Subclasses (`extends`) | External Scope |
| :--- | :--- | :--- | :--- |
| `public` | Accessible | Accessible | Accessible |
| `protected` | Accessible | Accessible | Rejected by compiler (`E0041`) |
| `private` | Accessible | Rejected by compiler (`E0042`) | Rejected by compiler (`E0042`) |
