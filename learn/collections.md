---
id: collections
title: Collections - Arrays, Objects, and More
sidebar_label: 9. Collections
---

# Collections — Working with Multiple Values

So far you've worked with single values. **Collections** let you store and manipulate groups of data.

## Arrays — Ordered Lists

Arrays hold multiple values in order, accessed by index (starting at 0).

### Creating Arrays

```adesh
let empty = [];
let numbers = [1, 2, 3, 4, 5];
let names = ["Alice", "Bob", "Charlie"];
let mixed = [1, "two", true, 3.14];
```

### Accessing Elements

```adesh
let fruits = ["apple", "banana", "cherry"];

print(fruits[0]);    // apple (first)
print(fruits[1]);    // banana
print(fruits[2]);    // cherry (last)
print(fruits[3]);    // null (out of bounds = null)
```

**Output:**
```
apple
banana
cherry
null
```

### Modifying Elements

```adesh
let colors = ["red", "green", "blue"];

colors[1] = "yellow";
print(colors);    // ["red", "yellow", "blue"]
```

**Output:**
```
["red", "yellow", "blue"]
```

### Array Properties

```adesh
let arr = [10, 20, 30];

print(len(arr));       // 3 (length)
print(arr.length());   // 3 (method form)
```

**Output:**
```
3
3
```

### Array Methods

```adesh
let nums = [1, 2, 3];

// Add to end
nums.push(4);
print(nums);    // [1, 2, 3, 4]

// Remove from end
let last = nums.pop();
print(last);    // 4
print(nums);    // [1, 2, 3]

// Add to beginning
nums.unshift(0);
print(nums);    // [0, 1, 2, 3]

// Remove from beginning
let first = nums.shift();
print(first);   // 0
print(nums);    // [1, 2, 3]

// Check if contains
print(nums.includes(2));    // true
print(nums.includes(99));   // false

// Find index
print(nums.indexOf(2));     // 1
print(nums.indexOf(99));    // -1 (not found)

// Slice (portion of array)
let slice = nums.slice(1, 3);
print(slice);    // [2, 3]

// Join to string
print(nums.join(", "));     // "1, 2, 3"
```

**Output:**
```
[1, 2, 3, 4]
4
[1, 2, 3]
[0, 1, 2, 3]
0
[1, 2, 3]
true
false
1
-1
[2, 3]
1, 2, 3
```

## Objects — Key-Value Pairs

Objects store data as named properties.

### Creating Objects

```adesh
let empty = {};

let person = {
    name: "Alice",
    age: 25,
    city: "New York"
};

let mixed = {
    count: 42,
    label: "answer",
    items: [1, 2, 3]
};
```

### Accessing Properties

```adesh
let user = {
    name: "Bob",
    email: "bob@example.com",
    age: 30
};

// Dot notation (most common)
print(user.name);      // Bob
print(user.age);       // 30

// Bracket notation (for dynamic keys)
let key = "email";
print(user[key]);      // bob@example.com
```

**Output:**
```
Bob
30
bob@example.com
```

### Modifying Properties

```adesh
let car = {
    brand: "Toyota",
    year: 2020
};

car.year = 2021;           // Update existing
car.color = "blue";        // Add new
car["doors"] = 4;          // Add with bracket notation

print(car);
// { brand: "Toyota", year: 2021, color: "blue", doors: 4 }
```

**Output:**
```
{ brand: "Toyota", year: 2021, color: "blue", doors: 4 }
```

### Deleting Properties

```adesh
let obj = { a: 1, b: 2, c: 3 };
delete obj.b;
print(obj);    // { a: 1, c: 3 }
```

**Output:**
```
{ a: 1, c: 3 }
```

### Checking Properties

```adesh
let user = { name: "Alice", age: 25 };

print("name" in user);      // true
print("email" in user);     // false
print(user.hasOwnProperty("age"));  // true
```

**Output:**
```
true
false
true
```

### Object Methods

```adesh
let person = { name: "Alice", age: 25 };

// Get all keys
print(Object.keys(person));    // ["name", "age"]

// Get all values
print(Object.values(person));  // ["Alice", 25]

// Get key-value pairs
print(Object.entries(person)); // [["name", "Alice"], ["age", 25]]
```

**Output:**
```
["name", "age"]
["Alice", 25]
[["name", "Alice"], ["age", 25]]
```

## Nested Collections

### Array of Objects

```adesh
let users = [
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
    { name: "Charlie", age: 35 }
];

for user in users {
    print(user.name, "is", user.age);
}

// Find user by name
for user in users {
    if (user.name == "Bob") {
        print("Found Bob!");
    }
}
```

**Output:**
```
Alice is 25
Bob is 30
Charlie is 35
Found Bob!
```

### Object with Arrays

```adesh
let school = {
    name: "Tech Academy",
    students: ["Alice", "Bob", "Charlie"],
    grades: {
        math: [90, 85, 95],
        science: [88, 92, 87]
    }
};

print(school.students[0]);         // Alice
print(school.grades.math[1]);      // 85
```

**Output:**
```
Alice
85
```

### Multi-dimensional Arrays

```adesh
// 2D grid (matrix)
let grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

print(grid[0][0]);    // 1 (row 0, col 0)
print(grid[1][2]);    // 6 (row 1, col 2)
print(grid[2][1]);    // 8 (row 2, col 1)

// Iterate 2D array
for row in grid {
    for cell in row {
        print(cell, " ");
    }
    print("");  // newline
}
```

**Output:**
```
1
6
8
1
2
3

4
5
6

7
8
9
```

## Functional Array Methods

AdeshLang provides powerful functional methods:

```adesh
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// map - transform each element
let doubled = map(numbers, fn(x) { x * 2; });
print(doubled);    // [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

// filter - keep only matching
let evens = filter(numbers, fn(x) { x % 2 == 0; });
print(evens);      // [2, 4, 6, 8, 10]

// reduce - combine to single value
let sum = reduce(numbers, 0, fn(acc, x) { acc + x; });
print(sum);        // 55

// find - first matching element
let found = find(numbers, fn(x) { x > 5; });
print(found);      // 6

// findIndex - index of first match
let idx = findIndex(numbers, fn(x) { x > 5; });
print(idx);        // 5

// some - any match?
let hasBig = some(numbers, fn(x) { x > 100; });
print(hasBig);     // false

// every - all match?
let allPositive = every(numbers, fn(x) { x > 0; });
print(allPositive); // true
```

**Output:**
```
[2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
[2, 4, 6, 8, 10]
55
6
5
false
true
```

## Strings as Collections

Strings behave like arrays of characters:

```adesh
let text = "Hello";

print(len(text));       // 5
print(text[0]);         // H
print(text[4]);         // o

// String methods
print(text.toUpperCase());    // HELLO
print(text.toLowerCase());    // hello
print(text.includes("ell"));  // true
print(text.startsWith("He")); // true
print(text.endsWith("lo"));   // true
print(text.replace("l", "L")); // HeLlo (first only)
print(text.repeat(3));        // HelloHelloHello

// Split into array
let words = "apple,banana,cherry".split(",");
print(words);    // ["apple", "banana", "cherry"]

// Join array to string
print(words.join(" | "));     // apple | banana | cherry
```

**Output:**
```
5
H
o
HELLO
hello
true
true
true
HeLlo
HelloHelloHello
["apple", "banana", "cherry"]
apple | banana | cherry
```

## Practical Example: Contact Manager

```adesh
let contacts = [];

fn add_contact(name, phone, email) {
    contacts.push({
        name: name,
        phone: phone,
        email: email
    });
}

fn find_contact(name) {
    for c in contacts {
        if (c.name == name) return c;
    }
    return null;
}

fn list_contacts() {
    if (len(contacts) == 0) {
        print("No contacts yet");
        return;
    }
    for c in contacts {
        print(c.name, ":", c.phone, "(", c.email, ")");
    }
}

// Test
add_contact("Alice", "555-1234", "alice@email.com");
add_contact("Bob", "555-5678", "bob@email.com");
add_contact("Charlie", "555-9012", "charlie@email.com");

print("=== All Contacts ===");
list_contacts();

print("\n=== Search ===");
let found = find_contact("Bob");
if (found) {
    print("Found:", found.name, found.email);
}
```

**Output:**
```
=== All Contacts ===
Alice : 555-1234 ( alice@email.com )
Bob : 555-5678 ( bob@email.com )
Charlie : 555-9012 ( charlie@email.com )

=== Search ===
Found: Bob bob@email.com
```

## Quick Reference

| Task | Array | Object |
|------|-------|--------|
| Create | `[1, 2, 3]` | `{ a: 1 }` |
| Access | `arr[0]` | `obj.key` or `obj["key"]` |
| Length | `len(arr)` | `len(Object.keys(obj))` |
| Add | `push()` | `obj.key = value` |
| Remove | `pop()` / `shift()` | `delete obj.key` |
| Check | `includes()` | `"key" in obj` |
| Iterate | `for x in arr` | `for k in Object.keys(obj)` |

## Practice Exercise

Create `shopping_cart.adesh`:

```adesh
let cart = [];

fn add_item(name, price, quantity = 1) {
    // Check if already in cart
    for item in cart {
        if (item.name == name) {
            item.quantity = item.quantity + quantity;
            return;
        }
    }
    cart.push({ name, price, quantity });
}

fn remove_item(name) {
    for i in 0..len(cart) {
        if (cart[i].name == name) {
            cart.splice(i, 1);
            return;
        }
    }
}

fn get_total() {
    let total = 0;
    for item in cart {
        total = total + item.price * item.quantity;
    }
    return total;
}

fn print_receipt() {
    print("=== RECEIPT ===");
    for item in cart {
        print(item.name, " x", item.quantity, " @ $", item.price);
    }
    print("----------------");
    print("TOTAL: $", get_total());
}

// Test
add_item("Apple", 1.50, 3);
add_item("Bread", 2.99);
add_item("Milk", 3.50, 2);
add_item("Apple", 1.50);  // Add more apples

print_receipt();
```

**Expected Output:**
```
=== RECEIPT ===
Apple x 4 @ $ 1.5
Bread x 1 @ $ 2.99
Milk x 2 @ $ 3.5
----------------
TOTAL: $ 15.99
```

## Summary

✅ **You learned:**
- Arrays `[]` — ordered lists, indexed by number
- Objects `{}` — key-value pairs, accessed by name
- Array methods: `push`, `pop`, `shift`, `unshift`, `includes`, `indexOf`, `slice`, `join`
- Object methods: `Object.keys`, `Object.values`, `Object.entries`
- Nested collections (arrays of objects, objects with arrays)
- Functional methods: `map`, `filter`, `reduce`, `find`, `some`, `every`
- Strings as character collections

## Next Step

Now let's **build a complete project** — a calculator app! Continue to **[Building a Calculator](/learn/calculator)** →