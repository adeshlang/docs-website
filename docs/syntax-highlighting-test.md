---
title: Syntax Highlighting Test
description: Comprehensive test of AdeshLang syntax highlighting
# Hide from sidebar – this is for verification only
---

# Syntax Highlighting Verification

## Keywords

```adesh
let name = "Ajay"
const MAX_COUNT = 100
var counter = 0
fn add(a: i32, b: i32): i32 { return a + b }
if x > 0 { } else { }
elif y < 0 { }
while running { }
for item in collection { }
loop { break }
continue
match value { pattern => expr, _ => 0 }
defer { cleanup() }
unsafe { raw_pointer() }
return result
```

## Types

```adesh
let a: i8 = 0
let b: i16 = 0
let c: i32 = 0
let d: i64 = 0
let e: i128 = 0
let f: u8 = 0
let g: u16 = 0
let h: u32 = 0
let i: u64 = 0
let j: u128 = 0
let k: f32 = 0.0
let l: f64 = 0.0
let m: bool = true
let n: char = 'a'
let o: string = "hello"
let p: Str = "world"
let q: String = "!"
let r: void = undefined
```

## Numbers

```adesh
let decimal = 42
let hex = 0xFF
let binary = 0b1010
let octal = 0o755
let float = 3.14
let scientific = 1.5e10
let negative_exp = 2.5e-3
let separator = 1_000_000
let typed = 42u8
let typed_hex = 0xFFi32
let typed_float = 3.14f64
let bigint = 100n
let hex_sep = 0xFF_AB_CD
let bin_sep = 0b1111_0000
```

## Strings and Characters

```adesh
let s = "Hello, World!"
let escaped = "Line 1\nLine 2\tTabbed"
let unicode = "\u{1F600}"
let hex_escape = "\x41"
let c = 'a'
let escaped_char = '\n'
let unicode_char = '\u{1F600}'
```

## Template Literals

```adesh
let name = `Hello, ${user}`
let formatted = `Value: ${x:>10}`
let multi = `Line 1
Line 2
Line 3`
```

## Comments

```adesh
// Single-line comment
# Hash-style comment
/* Block comment */
/** Doc comment */
```

## Functions

```adesh
// Function definition
fn greet(name: string) {
  println("Hello, " + name)
}

// Typed return
fn add(a: i32, b: i32): i32 {
  return a + b
}

// Function call
let result = add(5, 3)
fn process(data: [i32])
fn map<T, U>(items: [T], callback: fn(T): U): [U]
```

## Modules and Imports

```adesh
import "module.adesh"
import { foo, bar } from "./utils.adesh"
import "./math.adesh" as Math
export let version = "1.0"
export default fn main() { }
export const PI = 3.14159
```

## Generics

```adesh
fn identity<T>(x: T): T { return x }
class Box<T> { value: T }
type Pair<A, B> = { first: A; second: B }
let wrapped = Box<i32>(42)
let first = identity<string>("hello")
```

## Annotations and Decorators

```adesh
@Test
@Inline
@deprecated
@benchmark
@compile
@Runtime
@Test("should pass")
```

## Control Flow

```adesh
if x > 0 {
  println("positive")
} else {
  println("negative or zero")
}

while running {
  process()
  if should_stop { break }
  if should_skip { continue }
}

for item in items {
  println(item)
}
```

## Classes and Structs

```adesh
class Animal {
  constructor(name: string) { }
  speak() { }
}

class Dog extends Animal {
  constructor(name: string) { super(name) }
}

struct Point {
  x: i32;
  y: i32;
}

enum Direction {
  North,
  South,
  East,
  West
}
```

## Error Handling

```adesh
try {
  let result = risky_operation()
  println(result)
} catch(e) {
  println("Error: " + e)
}

throw Error("Something went wrong")
```

## Operators

```adesh
// Arithmetic
let sum = a + b
let diff = a - b
let product = a * b
let quotient = a / b
let remainder = a % b
let power = a ** b
let int_div = a ~/ b

// Comparison
let eq = a == b
let strict = a === b
let neq = a != b
let strict_neq = a !== b
let gt = a > b
let lt = a < b
let gte = a >= b
let lte = a <= b

// Logical
let and = a && b
let or = a || b
let not = !a

// Assignment
a += 5
a -= 3
a *= 2
a /= 4
a %= 3

// Bitwise
let bits = a & b
let bits_or = a | b
let bits_xor = a ^ b
let bits_not = ~a
let shifted = a << 2
let shifted_r = a >> 2

// Range and Spread
let range = 0..10
let inclusive = 0...10
let spread = ...array

// Other
let optional = obj?.prop
let fallback = value ?? default
let arrow = (x) => x * 2
let ret = fn(x: i32): i32
```

## Memory Management

```adesh
region Arena {
  let data = alloc(1024)
  free(data)
}
defer { file.close() }
unsafe { pointer_deref() }
share let shared = Rc::new(value)
strong let owned = value
weak let weak_ref = Weak::new()
```

## Async and Concurrency

```adesh
async fn fetch_data(url: string): string {
  let response = await http_get(url)
  return response
}

spawn async_task()
```

## Built-in Functions

```adesh
print("hello")
println("world")
let length = len(array)
array.push(item)
let popped = array.pop()
let filtered = array.filter(fn(x) => x > 0)
let mapped = array.map(fn(x) => x * 2)
let reduced = array.reduce(0, fn(acc, x) => acc + x)
assert(condition)
assert_eq(a, b)
assert_ne(a, b)
panic("unexpected state")
unwrap(optional_value)
expect(optional_value, "message")
```

## Collections

```adesh
let array = [1, 2, 3]
let tuple = (1, "hello", true)
let single = (x,)
let object = { name: "Ajay", age: 30 }
let set = {1, 2, 3, 4, 5}
let typed_array: [i32] = [1, 2, 3]
let fixed: [i32; 4] = [1, 2, 3, 4]
```

## Type Annotations

```adesh
let a: [u8] = []
let b: [u8; 4] = []
let c: &[u8] = []
let d: *u8 = null
let e: u8? = null
let f: vec4<f32> = vec4(1.0, 0.0, 0.0, 1.0)
```
