---
id: strings
title: Strings & Text - Working with Characters
sidebar_label: 11. Strings & Text
---

# Strings & Text — Working with Characters

Almost every real program processes text: usernames, log lines, file paths,
JSON payloads, emails. This lesson teaches you Adesh's strings from the
ground up, using the exact patterns from the examples repository.

## What is a string?

A **string** is a sequence of characters wrapped in quotes. Think of it as a
word or sentence your program carries around.

```adesh
let greeting = "Hello, World!";
let empty = "";
let digits = "123";          // text, not the number 123
let multiline = `            // backticks make multi-line strings work
  Line one
  Line two
`;
```

## Printing text

```adesh
print("Hello");            // Hello
print("Name:", "Ajay");    // Name: Ajay
print(42);                 // 42  (numbers print too)
print(true);               // true

// Control the separator between values
print("Apple", "Banana", "Cherry", { sep: ", " });
// Apple, Banana, Cherry

// Control the ending
print("Loading", { end: "..." });
print("Done!");
// Loading...Done!
```

**Output:**
```
Hello
Name: Ajay
42
true
Apple, Banana, Cherry
Loading...Done!
```

`print` is the workhorse of every example in the repository. Watch how even
the biggest programs (like the [Task Manager](/learn/capstone)) build their
entire user interface out of `print`.

## String interpolation (template literals)

The easiest way to put a value inside text is **backtick interpolation** —
`${expression}` fills in the value:

```adesh
let name = "Ajay";
let age = 25;

print(`Hello, ${name}! You are ${age}.`);
// Hello, Ajay! You are 25.

let a = 6;
let b = 7;
print(`6 + 7 = ${a + b}`);      // expressions work too
print(`Hypotenuse: ${(a ** 2 + b ** 2) ** 0.5}`); // 9.21...
```

**Output:**
```
Hello, Ajay! You are 25.
6 + 7 = 13
Hypotenuse: 9.219544457292887
```

This is exactly how `examples/syntax/test_template_literals.adesh` and the
repository's real-world apps write their output — it keeps text readable
instead of chaining `+` everywhere.

## Concatenation and length

```adesh
let first = "Hello";
let last  = "World";

print(first + " " + last);     // Hello World
print(len("Adesh"));       // 9

// Building a sentence piece by piece
let name = "Ajay";
let msg = "Welcome to " + name;
print(msg);
```

**Output:**
```
Hello World
9
Welcome to Ajay
```

## Indexing and slicing

Strings behave like arrays of characters:

```adesh
let text = "Adesh";
print(text[0]);    // A  (indexes start at 0)
print(text[4]);    // h
print(text[len(text) - 1]);  // g  (last character)
```

**Output:**
```
A
h
g
```

## Common string method

```adesh
let title = "  adesh lang  ";

print(title.trim().toUpperCase());   // ADESH LANG
print(title.toUpperCase());          //   ADESH LANG
print(title.toLowerCase());          //   adesh lang
print(title.trim());                 // adesh lang
print(title.trim().length);          // 10
```

**Output:**
```
ADESH LANG
  ADESH LANG  
  adesh lang  
adesh lang
10
```

## Splitting and joining

```adesh
let csv = "apple,banana,cherry";
let words = csv.split(",");
print(words);                // ["apple", "banana", "cherry"]
print(words.join(" | "));    // apple | banana | cherry

let sentence = "one two three";
print(sentence.split(" ").length);  // 3
```

**Output:**
```
[apple, banana, cherry]
apple | banana | cherry
3
```

The repository uses this to parse tags, CSV lines, path segments, and more
(see `examples/Libraries/json/parse.adesh`, `examples/Libraries/fs/basic_demo.adesh`).

## Checking text

```adesh
let email = "test@example.com";

print(email.startsWith("test"));   // true
print(email.endsWith(".com"));     // true
print(email.includes("@"));        // true
print(email.indexOf("@"));         // 4
print(email.replace("example", "gmail"));  // test@gmail.com
```

**Output:**
```
true
true
true
4
test@gmail.com
```

## Raw strings and regex

When text contains backslashes (like regex patterns), use `r"..."` so you do
not have to escape them:

```adesh
import Regex;

let pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
let re = Regex.new(pattern);

print(re.test("test@example.com"));  // true
print(re.test("not-an-email"));      // false
```

**Output:**
```
true
false
```

That exact pattern is the email validator in
`examples/Libraries/regex/email_validator.adesh`.

## Real-world examples you have already seen the pattern for

| Real file | The string feature it uses |
|-----------|----------------------------|
| `examples/01_Basics/main.adesh` | `print` with styling, string `+` |
| `examples/syntax/test_template_literals.adesh` | `${}` interpolation everywhere |
| `examples/real_world/01_task_manager.adesh` | building UI lines with `+` and `str()` |
| `examples/Libraries/json/basics.adesh` | backtick multi-line JSON payloads |
| `examples/Libraries/regex/email_validator.adesh` | raw string regex patterns |

## Practice

Create `greeting.adesh`:

```adesh
let first = "Ada";
let last  = "Lovelace";
let year  = 1843;

print(`Meet ${first} ${last}, who wrote the first algorithm in ${year}.`);
print(`That is ${2026 - year} years ago.`);
print(first.split("a").join("-"));   // Ad-  (try it!)
```

**Output:**
```
Meet Ada Lovelace, who wrote the first algorithm in 1843.
That is 183 years ago.
Ad-
```

Run it with `adesh run greeting.adesh`, then change one string and watch the
output change.

## Summary

✅ **You learned:**
- Strings are text in `"double quotes"`, and `\`backticks\`` for interpolation
- `${expression}` fills values into text
- `+` concatenates, `len()` measures
- `[i]` indexes characters, indexing starts at 0
- methods: `trim`, `toUpperCase`, `toLowerCase`, `includes`, `startsWith`,
  `endsWith`, `split`, `join`, `replace`, `indexOf`
- raw strings `r"..."` for regex and backslash-heavy text

## Next Step

Now let's see how Adesh thinks about **data types** — numbers, booleans,
and the type system. Continue to **[Types & Type System](/learn/types)** →
