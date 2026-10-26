---
id: oop
title: Object-Oriented Programming - Classes, Inheritance, and More
sidebar_label: 14. OOP
---

# Object-Oriented Programming — Classes, Inheritance, and More

Object-oriented programming (OOP) bundles **data and behavior** into objects.
Adesh supports classes, inheritance, visibility modifiers, interfaces,
extension methods, and decorators — all demonstrated in the examples
repository.

## Classes: data + behavior

A `class` is like a struct that also carries methods:

```adesh
class Person {
    Person(name, age) {          // constructor — same name as the class
        this.name = name;
        this.age = age;
    }

    fn greet() {
        print("Hello, my name is", this.name);
    }

    fn isAdult() {
        return this.age >= 18;
    }
}

let p = new Person("Ajay", 25);
p.greet();          // Hello, my name is Ajay
print(p.isAdult()); // true
```

**Output:**
```
Hello, my name is Ajay
true
```

That is exactly `examples/oop/class.adesh`. Note the constructor is a function
named after the class, and `new` creates the instance.

## Private fields and access modifiers

```adesh
class BankAccount {
    BankAccount(balance) {
        this._balance = balance;      // underscore convention
    }

    private fn _validate(amount) {    // private method
        return amount > 0;
    }

    fn deposit(amount) {
        if (this._validate(amount)) {
            this._balance = this._balance + amount;
        }
        return this._balance;
    }

    fn getBalance() {
        return this._balance;
    }
}

let acct = new BankAccount(100);
acct.deposit(50);
print(acct.getBalance());    // 150
```

**Output:**
```
150
```

Access modifiers (`public`, `private`, `protected`) and `get`/`set` properties
are covered in `examples/oop/advanced_visibility.adesh` and the
[docs](/docs/language-guide/structs-classes).

## Inheritance: `extends` and `super`

```adesh
class Shape {
    Shape(name) {
        this.name = name;
    }

    fn describe() {
        print("Shape:", this.name);
    }
}

class Circle extends Shape {
    Circle(name, radius) {
        super(name);             // call the parent constructor
        this.radius = radius;
    }

    fn area() {
        return Math.PI * this.radius * this.radius;
    }
}

let c = new Circle("Unit Circle", 2.0);
c.describe();                    // Shape: Unit Circle
print(c.area());                 // 12.566370614359172
```

**Output:**
```
Shape: Unit Circle
12.566370614359172
```

`extends` gives the child all parent fields and methods; `super(...)` chains
the parent constructor. From `examples/oop/inheritance_test.adesh` and the
[learn-by-examples catalog](/learn-by-examples/oop).

## Extension methods: `extend on`

Add methods to *existing* types (including your own structs) without touching
their definition:

```adesh
class Person {
    Person(name, age) {
        this.name = name;
        this.age = age;
    }
}

extend on Person {
    fn canVote() {
        return this.age >= 18;
    }

    fn birthday() {
        this.age = this.age + 1;
        print("Happy birthday,", this.name, "! Now", this.age);
    }
}

let p = new Person("Priya", 17);
print(p.canVote());    // false
p.birthday();          // Happy birthday, Priya! Now 18
print(p.canVote());    // true
```

**Output:**
```
false
Happy birthday, Priya! Now 18
true
```

This is the exact `extend on` syntax from `examples/extend/01_basic_extend.adesh`.

## Interfaces: contracts any class can fulfill

An `interface` declares what a class *must* provide; any class that
`implements` it can be used interchangeably:

```adesh
interface Printable {
    fn print_details();
}

class Book implements Printable {
    fn print_details() {
        print("Book: 'The Rust Programming Language' by Steve Klabnik");
    }
}

class Magazine implements Printable {
    fn print_details() {
        print("Magazine: Tech Monthly (Issue #42)");
    }
}

fn display(printable: Printable) {
    printable.print_details();
}

display(new Book());
display(new Magazine());
```

**Output:**
```
Book: 'The Rust Programming Language' by Steve Klabnik
Magazine: Tech Monthly (Issue #42)
```

Both `Book` and `Magazine` satisfy `Printable`, so `display` accepts either.
From `examples/interfaces/01_basic_interfaces.adesh`.

## Decorators: wrapping behavior with `@`

A decorator wraps a function with extra behavior — logging, caching,
validation — without changing its body:

```adesh
decorator log(target, meta) {
    return fn(a, b) {
        print("  → Calling:", meta.name);
        let r = target(a, b);
        print("  ← Result:", r);
        return r;
    };
}

@log
fn add(x, y) {
    return x + y;
}

print(add(2, 3));
//   → Calling: add
//   ← Result: 5
// 5
```

**Output:**
```
  → Calling: add
  ← Result: 5
5
```

Decorators appear throughout `examples/decorators/` — logging, caching,
authorization (`validate_authorize.adesh`), and retry (`factory_retry.adesh`).

## OOP in the real world

The full repository already uses everything in this lesson:

| Real file | What OOP it demonstrates |
|-----------|--------------------------|
| `examples/oop/class.adesh` | basic class + method |
| `examples/oop/inheritance_test.adesh` | inheritance + `super` |
| `examples/oop/advanced_visibility.adesh` | access modifiers |
| `examples/extend/01_basic_extend.adesh` | `extend on` |
| `examples/interfaces/01_basic_interfaces.adesh` | interfaces + polymorphism |
| `examples/decorators/validate_authorize.adesh` | validation/auth decorators |
| `examples/real_world/01_task_manager.adesh` | a whole CLI app built as a class |

## Practice

Build a mini library model:

```adesh
class LibraryItem {
    LibraryItem(title) {
        this.title = title;
    }
    fn describe() {
        return "Item: " + this.title;
    }
}

extend on LibraryItem {
    fn stamp() {
        print("📚 " + this.describe());
    }
}

let book = new LibraryItem("1984");
book.stamp();
```

**Output:**
```
📚 Item: 1984
```

## Summary

✅ **You learned:**
- `class` bundles data and methods, `new` creates instances
- `this` refers to the current instance
- `private`/`public`/`protected` visibility
- `extends` inheritance + `super` parent constructor
- `extend on` adds methods to existing types
- `interface` + `implements` for shared contracts
- `@decorator` wraps behavior (logging, caching, validation)

## Next Step

Programs fail. Let's learn how Adesh handles failure gracefully with
**error handling** and `defer`. Continue to **[Error Handling](/learn/error-handling)** →
