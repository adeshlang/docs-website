---
id: extends
title: extends — Class Inheritance
sidebar_label: extends
description: Production reference for `extends` — single-inheritance class headers, field offset accumulation, constructor delegation via super, visibility, sealed/abstract, VTable dispatch, and distinction from extend on.
---

# `extends`

`extends` declares **single-inheritance** in a class header. A subclass inherits its parent's fields and methods, may add new members, and may override virtual methods via dynamic VTable dispatch. It is handled in `src/parsing/parser/classes.rs:40` as `matchk([Extends])` in the class header.

Contrast with retroactive augmentation:

* `extends` — **inheritance at definition time** (child *is-a* parent, memory layout changes, VTable participates).
* [`extend on`](./extend) — **retroactive augmentation** (adds methods to an *existing* type, layout unchanged, no VTable slot).

## Syntax

```ebnf
ClassDecl ::= [ "abstract" | "sealed" ] "class" IDENT [ "extends" IDENT ]
              [ "implements" InterfaceList ] "{" Member* "}"
```

```adesh
// minimal
class Animal {
    fn speak() { print("..."); }
}
class Dog extends Animal {
    fn speak() { print("woof"); }   // override
}

// with inheritance + interface
interface Resizable { fn resize(factor: f64); }

class Canvas extends Widget implements Resizable {
    fn resize(factor: f64) { self.width *= factor; }
}

// abstract / sealed parents
abstract class Shape {
    abstract fn area() -> f64;
}
class Circle extends Shape {
    fn area() -> f64 { return 3.14159 * self.radius * self.radius; }
}
```

### Constructor Delegation via `super`

Child constructors delegate to the parent with `super(...)`:

```adesh
class Vehicle {
    Vehicle(weight_kg: f64) { self.weight_kg = weight_kg; }
    protected weight_kg: f64;
}

class ElectricCar extends Vehicle {
    // child fields follow parent fields in layout
    private battery_kwh: f64;

    ElectricCar(weight_kg: f64, battery_kwh: f64) {
        super(weight_kg);              // delegate to Vehicle constructor
        self.battery_kwh = battery_kwh;
    }

    fn range() -> f64 { return self.battery_kwh * 5.0; }
}
```

`super(...)` is required when the parent declares constructor parameters; omission is a semantic error.

---

## Memory Layout — Field Offset Accumulation

Child layout **prepends** parent fields before appending its own:

```
Heap object for ElectricCar instance

+0x00  VTable*              → ElectricCar VTable (.rodata)
+0x08  RC / GC header       (atomic count)
+0x10  Vehicle::weight_kg   (inherited, offset = header + 0)
+0x18  ElectricCar::battery_kwh  (child field, offset = header + sizeof(ParentFields))
...
Field offset formula:  offset(ChildField_i) = sizeof(Header) + sizeof(ParentFields) + offset_child_relative(i)
```

This prefix layout enables **zero-cost polymorphism**: a `&Vehicle` pointer can accept a `&ElectricCar` without adjustment.

---

## VTable & Dynamic Dispatch

When a class overrides or introduces virtual methods, the compiler emits a read-only VTable:

```
VTable for ElectricCar (.rodata)
+0x00  TypeDescriptor*        (runtime type info)
+0x08  Slot 0: Vehicle::get_weight  (inherited, not overridden)
+0x10  Slot 1: ElectricCar::speak   (overridden)
+0x18  Slot 2: ElectricCar::range   (new)
```

Dynamic calls lower to two-level indirection:

```text
MOV  RAX, [RDI + 0]     ; load VTable* from object header
MOV  RAX, [RAX + 16]    ; load method address (slot 1)
CALL RAX
```

`extend on` methods do **not** occupy VTable slots; they are monomorphic direct calls.

---

## Visibility & Modifiers

Access is enforced at semantic analysis (`E0041`/`E0042`/`E0043`):

| Modifier | Meaning |
|----------|---------|
| `public` | visible everywhere |
| `protected` | visible in defining class + subclasses (`extends` children) |
| `private` | visible only in defining class |
| `abstract` | class cannot be constructed with `new`; may contain `abstract fn` members |
| `sealed` | class may only be extended inside its defining module (cross-module `extends` → `E0043`) |
| `static` | member belongs to type, not instance |

Example:

```adesh
class Engine {
    private power_kw: f64;
    public status: string;
    protected fn check() { return self.power_kw > 0.0; }
}
class TurboEngine extends Engine {
    fn canStart() -> bool {
        return self.check();       // OK: protected via inheritance
        // return self.power_kw;  // ERROR E0042: private not visible in subclass
    }
}
```

---

## Restrictions

* **Single inheritance only** — `class C extends A, B` is illegal.
* **Interfaces use `implements`**, not `extends` (except interface-to-interface inheritance: `interface I extends J`).
* **`sealed` boundary** — `class X extends SealedParent` outside defining module → `E0043`.
* **`abstract` must be implemented** — a non-abstract subclass that fails to implement inherited `abstract fn` is rejected.
* `extends` is **not** `extend` — `class Dog extend Animal` (missing `s`) is parsed as a class named `Dog` followed by a stray `extend` declaration, not inheritance.

---

## See Also

* [`extend`](./extend) — retroactive type extension (`extend on Type`, `extend Name on Type`)
* [`on`](./on) — mandatory bridge in `extend … on`
* [`implements`](./implements) / [`interface`](./interface) — contract conformance
* [`super`](./super) / [`this`](./this) — receiver and parent delegation
* [`abstract`](./abstract) / [`sealed`](./sealed) — class modifiers
* [Structs, Classes & Extensions — §3-7](../structs-classes) — heap header, VTable diagrams, sealed/abstract semantics
