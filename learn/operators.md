---
id: operators
title: Operators & Expressions - Working With Values
sidebar_label: 3. Operators & Expressions
---

# Operators & Expressions — Working With Values

Operators are the verbs of a programming language: they take values and
produce new ones. AdeshLang has a full, expressive operator set —
arithmetic, comparison, logical, nullish, bitwise, and more — demonstrated in
[`examples/syntax/operators.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/syntax/operators.adesh).

## Arithmetic

```adesh
let a = 10;
let b = 3;

print(a + b);   // addition
print(a - b);   // subtraction
print(a * b);   // multiplication
print(a / b);   // division
print(a % b);   // modulo (remainder)
print(2 ** 8);  // power
print(7 ~/ 3);  // integer (truncated) division
```

**Output:**
```
13
7
30
3.3333333333333335
1
256
2
```

## Comparison

```adesh
let a = 10;
let b = 3;

print(a == b, a != b, a > b, a >= b, a < b, a <= b);
```

**Output:**
```
false true true true false false
```

## Loose `==` vs strict `===`

`==` compares values (allowing type coercion); `===` also requires the same
type. This comes from
[`examples/operators/strict_equality.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/operators/strict_equality.adesh):

```adesh
let a = 2;
let b = "2";
print("typeof a:", typeof a);     // number
print("typeof b:", typeof b);     // string
print("a==b:", a == b);           // true  (values match)
print("a===b:", a === b);         // false (types differ)

let s1 = "hello";
let s2 = "hello";
print("s1==s2:", s1 == s2);       // true
print("s1===s2:", s1 === s2);     // true  (same type AND value)
```

**Output:**
```
typeof a: number
typeof b: string
a==b: true
a===b: false
s1==s2: true
s1===s2: true
```

Arrays and objects compare **by reference** with `===`, by content with `==`:

```adesh
let x = [1];
let y = [1];
let z = &x;
print("x==y:", x == y);       // true  (same content)
print("x===y:", x === y);     // false (different arrays)
print("x===z:", x === z);     // true  (z points at x)
```

**Output:**
```
x==y: true
x===y: false
x===z: true
```

## Logical operators

```adesh
print(true && false);   // AND
print(true || false);   // OR
print(!false);          // NOT
print((!false) && (true || false));  // combined
```

**Output:**
```
false
true
true
true
```

## Nullish coalescing `??`

`??` picks the value on the right **only when the left is `null`** — never
for `0`, `false`, or `""`. From
[`examples/syntax/test_nullish_coalescing.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/syntax/test_nullish_coalescing.adesh):

```adesh
let n = null;
print(n ?? 42);         // null → use 42

let zero = 0;
print(zero ?? 99);      // 0 is a real value → stays 0

let a = null;
let b = null;
let c = 100;
print(a ?? b ?? c);     // chains: 100

let keep = "existing";
keep ??= "set-on-null"; // only assigns if null
print(keep);
```

**Output:**
```
42
0
100
existing
```

## Optional chaining `?.`

`?.` safely reads nested fields even when an intermediate value is `null`.
From
[`examples/syntax/test_optional_chaining.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/syntax/test_optional_chaining.adesh):

```adesh
let obj = { user: { name: "Alice", age: 30 } };
print(obj?.user?.name);   // Alice

let nullObj = null;
print(nullObj?.field);    // null, no crash!

let deep = { a: { b: { c: 42 } } };
print(deep?.a?.b?.c);     // 42
```

**Output:**
```
Alice
null
42
```

## Spread `...` and ranges

```adesh
let arr = [1, 2, 3];
let arr2 = [...arr, 4, 5];
print(arr2);               // spread copies elements

let rng = 1 .. 5;          // half-open range (excludes end)
let rngi = 1 ... 5;        // inclusive range
print(rng, rngi);
```

**Output:**
```
[1, 2, 3, 4, 5]
[1, 2, 3, 4] [1, 2, 3, 4, 5]
```

## Bitwise, membership, and `typeof`

```adesh
print(6 & 3);              // AND  → 2
print(6 | 1);              // OR   → 7
print(6 ^ 5);              // XOR  → 3
print(1 << 4);             // shift left  → 16
print(16 >> 2);            // shift right → 4

print(2 in [1, 2, 3]);     // membership in array
print("a" in { a: 1 });    // membership in object
print("llo" in "hello");   // substring check
print(typeof(123), typeof("abc"));
```

**Output:**
```
2
7
3
16
4
true
true
true
number string
```

## Ternary, arrow functions, and updates

```adesh
let cond = true;
print(cond ? "yes" : "no");   // ternary

let inc = x => x + 1;         // arrow function
print(inc(10));

let ux = 1;
ux++;                          // increment
let uy = 5;
--uy;                          // decrement
print(ux, uy);
```

**Output:**
```
yes
11
2 4
```

## Type-level operators `|` and `?` (DSA new syntax)

Not runtime ops but **type operators** — documented here because they appear beside `??`/`?.`:

```adesh
fn findIndex(nums: [int], target: int): int | null { ... }   // union
fn getTopWord(freq: dict): string | null { ... }
fn describeValue(v: int | string | bool): string { ... }     // multi-union
let x: int? = null;             // T? == T | null (postfix)
type Node = { data: int, next: Node? };
type User = { name: String, age?: u8 = 20 }; // optional field with default
type Box<T> = { value: T, tag?: String = "generic-box" };
print(typeof(x)); // "int?" — nullable type tag
```

* `A | B` — union type; `[]`/`{}` are valid members (`[int] | []`)
* `T?` — postfix optional; `field?: T` — optional field; with `= default` for injection
* Always written with **colon** `:` return (`fn f(): T | null`), never `->` (only `extern "C"` uses `->`)

## Container + set operators

```adesh
let s: set; s.insert(1); s.insert(2);           // default decl
let sA = Set([1, 2, 3]); let sB = Set([3, 4]);
print(sA.union(sB));        // {1,2,3,4}
print(sA.intersection(sB)); // {3}
print(sA.contains(2));      // true
print(2 in [1, 2, 3]);      // true  (membership)
print("llo" in "hello");    // true
```

## Practice

Write `operators_work.adesh` and predict each line before you run it:

```adesh
let price = 120;
let discount = 0.2;
let final = price * (1 - discount);
print(final);

let user = { profile: { email: "a@b.c" } };
print(user?.profile?.phone ?? "no phone");

let tags = ["core", ...(price > 100 ? ["premium"] : [])];
print(tags);
```

**Output:**
```
96
no phone
[core, premium]
```

## Summary

✅ **You learned:**
- Arithmetic: `+ - * / % ** ~/`
- Comparison: `==` vs `===`, `!=`, `< > <= >=`
- Logical: `&&`, `||`, `!`
- `??` for null defaults and `??=` for safe assignment
- `?.` for safe nested access
- `...` spread, `..`/`...` ranges
- bitwise ops, `in` membership, `typeof`
- ternary `?:`, arrow functions, `++`/`--`

## Next Step

Now put these expressions to work making **decisions with conditionals**.
Continue to **[Conditionals](/learn/conditionals)** →
