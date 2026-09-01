---
id: regex
title: Regex Library
sidebar_label: Regex
---

# Regex Library

The **Regex** builtin library gives AdeshLang production-grade regular expressions, powered by Rust's `regex` engine. It compiles patterns once and reuses them, supports named capture groups, safe `Result`-based dynamic compilation, and provides a full `Match` / `Captures` inspection API — all through a single `Regex` namespace.

## Namespace

| Name | What it provides |
| :--- | :--- |
| `Regex` | The namespace: `new`, `compile`, `escape`, and flag constants |
| Regex instance | Compiled pattern: `test`, `find`, `findAll`, `captures`, `replace`, `split`, … |
| `Match` | A single match: `text()`, `start()`, `end()`, `range()`, `len()`, `isEmpty()` |
| `Captures` | All groups of one match: `get(i)`, `name(n)`, `names()`, `full()` |
| `Option` / `Result` | Enum-like wrappers: `isSome()` / `unwrap()` and `isOk()` / `isErr()` |

## Importing the library

```adesh
import Regex;                  // or import "std:Regex" as Regex;
```

:::tip
Use **raw strings** `r"..."` for patterns so backslashes (`\d`, `\b`) don't need doubling.
:::

---

## Creation & Escaping

| Function | Description | Returns |
| :--- | :--- | :--- |
| `Regex.new(pattern, flags?)` | Compile a pattern; **throws** on invalid syntax | `Regex` |
| `Regex.compile(pattern, flags?)` | Compile without throwing | `Result<Regex, string>` |
| `Regex.escape(text)` | Escape every regex metacharacter so `text` matches literally | `string` |

```adesh
import Regex;

// new() throws on invalid patterns:
let email = Regex.new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");

// compile() returns a Result — safe for dynamic user patterns:
let res = Regex.compile("[a-z");
if res.isOk() {
    print("compiled:", res.value);
} else {
    print("compilation failed:", res.value);   // Regex compilation failed: ...
}

// escape() builds a literal pattern:
let escaped = Regex.escape("cost: $5 (est.)");
print(escaped);                 // cost:\ \$5\ \(est\.\)
print(Regex.new(escaped).test("cost: $5 (est.)"));   // true
```

### Flag constants

Pass any combination (add them) as the second argument:

| Constant (alias) | Value | Effect |
| :--- | :--- | :--- |
| `Regex.IgnoreCase` (`CASE_INSENSITIVE`) | `1` | Case-insensitive matching |
| `Regex.Multiline` (`MULTILINE`) | `2` | `^`/`$` match line boundaries |
| `Regex.DotAll` (`DOT_ALL`) | `4` | `.` matches newlines |
| `Regex.Extended` (`EXTENDED`) | `8` | Ignore whitespace in the pattern |
| `Regex.Unicode` (`UNICODE`) | `16` | Unicode-aware matching |

```adesh
let re = Regex.new(r"\bhello\b", Regex.IgnoreCase);
print(re.test("HELLO"));        // true
print(re.test("hello"));        // true
```

---

## Testing & Matching

Regex instances expose:

| Method | Description | Returns |
| :--- | :--- | :--- |
| `pattern()` | The original pattern string | `string` |
| `flags()` | The flags integer | `int` |
| `test(text)` / `isMatch(text)` | `true` if the pattern matches anywhere | `boolean` |
| `fullMatch(text)` | `true` only if the pattern matches the **entire** string | `boolean` |
| `match(text)` / `matchStart(text)` | Match object only if it begins at index `0` | `Option<Match>` |
| `find(text)` | First match anywhere | `Option<Match>` |
| `findAll(text)` / `findIter(text)` | Every non-overlapping match | `array<Match>` |

```adesh
import Regex;

let re = Regex.new(r"\d{3}");
print(re.test("abc 123 xyz"));        // true
print(re.fullMatch("123"));           // true
print(re.fullMatch("1234"));          // false

let found = re.find("abc 123 xyz");
if found.isSome() {
    let m = found.unwrap();
    print(m.text());                  // 123
    print(m.start(), m.end());        // 4 7
}

let all = Regex.new(r"[cbr]at").findAll("cat, bat, rat");
print(len(all));                      // 3
```

---

## The `Match` object

Unwrap an `Option<Match>` (or index into `findAll`) to get a `Match`:

| Method | Description |
| :--- | :--- |
| `.text()` | The matched substring |
| `.start()` | Byte index where the match begins |
| `.end()` | Byte index where the match ends (exclusive) |
| `.range()` | Tuple `(start, end)` |
| `.len()` | Match length in bytes |
| `.isEmpty()` | `true` if the match is empty (`start == end`) |

---

## Capture Groups

`captures(text)` returns `Option<Captures>`; `capturesAll(text)` returns `array<Captures>` (every match). Both support **positional** and **named** groups.

| Captures method | Description |
| :--- | :--- |
| `.len()` | Number of groups (index `0` is the full match) |
| `.get(i)` / `.group(i)` | `Option<Match>` for group `i` (`0` = full match) |
| `.name(name)` | `Option<Match>` for a named group |
| `.names()` | Array of capture group names |
| `.full()` | `Option<Match>` for the whole match (index `0`) |

```adesh
import Regex;

let phone = Regex.new(r"(?P<area>\d{3})-(?P<exchange>\d{3})-(?P<subscriber>\d{4})");
let res = phone.captures("Call 555-867-5309 now");

if res.isSome() {
    let caps = res.unwrap();

    print(caps.len());                        // 4  (full + 3 groups)

    // Positional:
    print(caps.get(1).unwrap().text());       // 555

    // Named:
    print(caps.name("area").unwrap().text());       // 555
    print(caps.name("subscriber").unwrap().text()); // 5309

    // All names:
    print(caps.names());                      // ["area", "exchange", "subscriber"]
    print(caps.full().unwrap().text());       // 555-867-5309
}

// Multiple matches:
let all = phone.capturesAll("A: 212-555-1234, B: 415-555-9876");
print(len(all));                              // 2
print(all[0].name("area").unwrap().text());   // 212
```

:::note
Groups defined with `(?P<name>...)` can be read by `name(...)`, `get(...)`, or `group(...)`. Unmatched optional groups come back as `None`.
:::

---

## Replacement & Splitting

| Method | Description | Returns |
| :--- | :--- | :--- |
| `replace(text, replacement)` | Replace the **first** occurrence | `string` |
| `replaceAll(text, replacement)` | Replace **every** occurrence | `string` |
| `split(text)` | Split on every match | `array<string>` |
| `splitN(text, limit)` | Split into at most `limit` parts | `array<string>` |

Replacement strings support group references: `$1`, `$2`, ... (positional) and `$name` (named).

```adesh
import Regex;

let color = Regex.new(r"silver|golden");
print(color.replace("silver and golden", "shiny"));      // shiny and golden
print(color.replaceAll("silver and golden", "shiny"));   // shiny and shiny

// Swap words with group references:
let swap = Regex.new(r"(\w+)\s+(\w+)");
print(swap.replaceAll("John Doe, Jane Smith", "$2, $1"));
// Doe, John, Smith, Jane

// Split on any separator mix:
let csv = Regex.new(r"[\s,;]+");
print(csv.split("one, two; three\tfour ,five"));
// ["one", "two", "three", "four", "five"]
print(csv.splitN("a,b,c,d", 3));              // ["a", "b", "c,d"]
```

---

## Complete example

A log-line parser using named groups, plus an email validator.

```adesh
import Regex;

print("--- Log parser ---");

let logRe = Regex.new(r"^\[(?P<ts>[^\]]+)\]\s+\[(?P<level>[^\]]+)\]\s+(?P<msg>.*)$");

let line = "[2026-07-13 23:14:16] [INFO] Starting server";
let caps = logRe.captures(line).unwrap();

print("Timestamp:", caps.name("ts").unwrap().text());
print("Level:    ", caps.name("level").unwrap().text());
print("Message:  ", caps.name("msg").unwrap().text());

print("--- Email validator ---");

let emailRe = Regex.new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
for addr in ["user@example.com", "bad@", "@x.com", "no-at-sign"] {
    print(addr, "=>", emailRe.test(addr));
}
```

---

## Notes & edge cases

- **Engine**: Rust `regex` crate — linear-time and backtracking-free. Backreferences and look-around are **not** supported.
- **Named groups** use `(?P<name>...)` syntax.
- **Flags** are fixed at compile time; combine constants by adding them (`Regex.IgnoreCase + Regex.Multiline`).
- `findAll`/`capturesAll` return **non-overlapping** matches.
- `match`/`matchStart` succeed only when the match begins at byte `0`; `fullMatch` additionally requires it to span the entire string.
- Indices from `start()`/`end()` are **byte** offsets (UTF-8), matching Rust's `regex`.
- Unwrap carefully: `Option.unwrap()` on `None` (or `Result.unwrap()` on `Err`) is a runtime error — prefer `isSome()` / `isOk()` guards.
- Compiled patterns are cached internally by the runtime, so reuse a compiled `Regex` when matching in a loop.

## Source & examples

- Implementation: `src/runtime/stdlib_src/core/regex.rs`
- Runnable examples: `examples/Libraries/regex/` (`regex_examples.adesh`, `email_validator.adesh`, `log_parser.adesh`, `text_replacer.adesh`)

## Related

- [Builtin Libraries Overview](overview)
- [Standard Library Overview](../stdlib/overview)
- [Built-in Functions](../stdlib/builtins)
