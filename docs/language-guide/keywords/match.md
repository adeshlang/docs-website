---
id: match
title: match
sidebar_label: match
description: The `match` keyword begins exhaustive pattern matching over enums, scalars, ranges, and guards — lowering to jump tables or decision trees.
---

# `match`

`match` begins a **pattern-matching expression**. It evaluates a selector value, compares it against a series of **pattern arms**, and runs the first arm whose pattern matches, binding any captured sub-values for use in that arm. AdeshLang checks **exhaustiveness** (all variants/cases covered or an explicit wildcard `_`) and supports **or-patterns** (`|`), **range patterns**, **guard clauses** (`if`), and **destructuring** of enums, structs, and tuples.

> **Ground truth:** Lexer `TokenKind::Match` (`src/parsing/lexer.rs:955`), AST `ExprKind::Match { selector, arms }`, hover doc *Pattern matching expression with exhaustive arms* (`als/src/hover.rs:341`), memory layout and lowering in `enums-pattern-matching.md:3`.

---

## Syntax

```text
match_expr  ::= "match" selector "{" arms "}"
selector    ::= expr
arms        ::= arm ("," arm)* ","?
arm         ::= pattern ("|" pattern)* ("if" expr)? "=>" (expr | block)

pattern     ::= "_"                          // wildcard (default)
              | literal                      // 0, "hi", true
              | ident                        // variable binding (or enum variant if qualified)
              | ident "::" ident ("(" pattern ("," pattern)* ")")? // enum variant
              | "{" field_pat ("," field_pat)* "}" // struct/record destructure
              | "[" pattern ("," pattern)* "]"    // array destructure (where supported)
              | pattern ".." pattern         // range pattern (inclusive)
              | "(" pattern ("," pattern)* ")" // tuple destructure

field_pat   ::= ident (":" pattern)?
```

`match` is an **expression**, not a statement — it yields the value of the taken arm. All arms must yield compatible types; the `match` expression's type is the common supertype of arm results. Each arm's `=>` body may be a single expression or a `block` (`{ statements }`).

### Exhaustiveness

A `match` must cover all possible values of the selector's type. The compiler rejects non-exhaustive matches unless a wildcard `_` or `_ => ...` arm is present:

```adesh
enum Color { Red, Green, Blue }
match color {
    Color::Red => 0,
    Color::Green => 1,
    Color::Blue => 2,
} // exhaustive — no `_` needed

match n {
    0 => "zero",
    1 | 2 => "one or two",
    _ => "many", // wildcard catches remainder — required for non-enum types like i32
}
```

---

## Semantics

### Evaluation

1. Evaluate `selector` once and retain its value.
2. Test arms top-to-bottom; the first matching pattern wins (later arms are not evaluated).
3. Bind captured variables from the pattern into the arm body scope.
4. Evaluate the arm body and yield its value as the `match` result.
5. If no arm matches and no wildcard exists, compile-time error (exhaustive check failure).

### Pattern forms

| Pattern | Example | Matches |
|---|---|---|
| Wildcard | `_` | Anything (binds nothing) |
| Literal | `0`, `"hi"` | Exact equality |
| Or-pattern | `1 \| 2 \| 3` | Any alternative |
| Range | `0..10`, `'a'..='z'` | Inclusive range |
| Variant (unit) | `Shape::Circle` | Enum variant without payload |
| Variant w/ payload | `Shape::Circle(r)` | Variant and binds `r` |
| Struct | `Point { x, y }` | Struct fields destructure |
| Tuple destruct | `(a, b)` | Tuple/array destructure |
| Guard | `x if x > 0 => ...` | Pattern plus extra condition |

### Guards

An `if expr` guard after the pattern further filters that arm — the arm only fires if both pattern and guard are true. Guards can reference bound variables:

```adesh
match n {
    x if x < 0 => "negative",
    0 => "zero",
    x if x % 2 == 0 => "even",
    _ => "odd",
}
```

### Decision-tree lowering

For dense enums, the compiler lowers `match` to an **`O(1)` jump table** (`SWITCH_TAG`):

```
read discriminant at offset 0x00 → jump table → payload extract per variant
```

For non-contiguous, guarded, or destructured patterns, it generates a **binary decision tree** of comparisons. `if let` / `while let` are sugar for single-arm `match` with wildcard fallback.

### Ownership

Matching **borrows** the selector by default; to consume/move, the selector must be an owned value and the pattern must not alias borrowed data past its live range. Borrow checker tracks moves out of `match` arms.

---

## Examples

### Example 1 — Enums, payloads, and or-patterns

```adesh
enum Shape {
    Circle(f64),
    Square(f64),
    Rect(f64, f64),
}

fn area(s: Shape): f64 {
    return match s {
        Shape::Circle(r)      => 3.14159 * r * r,
        Shape::Square(side)   => side * side,
        Shape::Rect(w, h)     => w * h,
    };
}
print(area(Shape::Circle(2.0))); // ~12.56
print(area(Shape::Rect(3.0, 4.0))); // 12

// Or-patterns and wildcards over scalars
fn classify(n: i32): string {
    return match n {
        0          => "zero",
        1 | 2      => "one or two",
        3..10      => "small",
        _ if n < 0 => "negative",
        _          => "large",
    };
}
print(classify(2));  // "one or two"
print(classify(5));  // "small"
print(classify(-3)); // "negative"
```

### Example 2 — Struct destructuring, guards, and `if let` sugar

```adesh
struct Point { x: f64, y: f64 }

fn quadrant(p: Point): string {
    return match p {
        Point { x, y } if x >= 0 && y >= 0 => "Q1",
        Point { x, y } if x < 0 && y >= 0  => "Q2",
        Point { x, y } if x < 0 && y < 0   => "Q3",
        Point { x, y }                     => "Q4",
    };
}

enum Message {
    Quit,
    Move { x: i64, y: i64 },
    Write(string),
    ChangeColor(u8, u8, u8),
}

fn handle(msg: Message) {
    match msg {
        Message::Quit                     => print("Exiting"),
        Message::Move { x, y }            => print(f"Move to {x}, {y}"),
        Message::Write(text)              => print(text),
        Message::ChangeColor(r, g, b)     => print(f"Color {r},{g},{b}"),
    }
}

// `if let` — sugar for single-arm match with wildcard fallback
fn maybe_print(msg: Message) {
    if let Message::Write(text) = msg {
        print(text);
    }
    // desugars to:
    // match msg {
    //     Message::Write(text) => { print(text); },
    //     _ => (),
    // }
}

// `while let` style via match inside loop (pop/iter pattern)
fn drain(stack: [i32]) {
    let s = stack;
    while true {
        match s.pop() {
            null => break,
            val  => print(val),
        }
    }
}
```

### Example 3 — Match as expression, nested patterns, and exhaustiveness

```adesh
enum Result<T, E> { Ok(T), Err(E) }

fn describe(r: Result<i32, string>): string {
    // match is an expression — its value can be assigned or returned
    let msg: string = match r {
        Result::Ok(v)  => f"ok: {v}",
        Result::Err(e) => f"err: {e}",
    };
    return msg;
}
print(describe(Result::Ok(42)));      // "ok: 42"
print(describe(Result::Err("bad")))); // "err: bad"

// Nested destructuring
enum Wrapper { Pair((i32, i32)), Empty }
fn nested(w: Wrapper): i32 {
    return match w {
        Wrapper::Pair((a, b)) => a + b,
        Wrapper::Empty        => 0,
    };
}

// Exhaustiveness — compiler rejects missing arms
// enum Color { Red, Green, Blue }
// match color {
//     Color::Red => 0,
//     // error: non-exhaustive — missing Green, Blue, no wildcard
// }
// Fix: add missing variants or wildcard:
// match color { Color::Red => 0, _ => 1 }

// Range + guard combo for grading
fn grade(score: i32): string {
    return match score {
        90..=100            => "A",
        80..89              => "B",
        70..79              => "C",
        n if n >= 0 && n < 70 => "F",
        _                   => "invalid",
    };
}
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let match = 1` | `unexpected token 'match', expected identifier` | `TokenKind::Match` reserved (`lexer.rs:955`) |
| **Parse** | `match { }` with no selector | `expected expression after 'match'` | Write `match value { ... }` |
| **Parse** | `match x { 0 => 1 2 => 3 }` (missing comma) | `expected ',' between match arms` | Separate arms with `,` |
| **Parse** | `match x { 0 -> 1 }` (wrong arrow) | `expected '=>' in match arm` | Use `=>` |
| **Type** | `match x { 0 => "a", 1 => 2 }` (mismatched arm types) | `match arms have incompatible types 'string' and 'i32'` | Make arms yield same type/convert |
| **Exhaustiveness** | `match color { Color::Red => 1 }` missing variants | `non-exhaustive match: missing variants Green, Blue` | Add arms or `_ => ...` |
| **Pattern** | `match n { x, y => ... }` invalid pattern | `expected pattern` / `unexpected ','` | Wrap tuple: `(x, y)` |
| **Guard** | `match x { _ if => 1 }` with no guard expr | `expected expression after 'if' in guard` | Write `if cond` |
| **Borrow** | Matching on moved value then using it | `use of moved value` | Clone before match or borrow (`&x`) |
| **Unreachable** | Arm after wildcard `_ => ...` | Warning: `unreachable pattern` | Move wildcard to last |

**Common pitfall — pattern vs. equality:**

```adesh
let x = 5;
match y {
    x => print("x"), // ❌ binds new variable `x` shadowing outer `x`, matches anything
    _ => print("other"),
}
// To match against outer `x`, use guard:
// match y { v if v == x => print("x"), _ => print("other") }
```

Pattern names introduce fresh bindings — they do not compare against outer variables of the same name.

---

## See Also

- [Enums & Pattern Matching](../enums-pattern-matching) — tagged union layout, discriminant, jump tables
- [if](./if) / [elif](./elif) / [else](./else) — conditional branching vs. pattern matching
- [Control Flow](../control-flow) — `match` decision-tree lowering and bytecode
- [let](./let) — pattern bindings introduced by `match` arms
- [typeof](./typeof) / [instanceof](./instanceof) — type queries vs. structural pattern matching
- `src/parsing/lexer.rs:955`, `als/src/hover.rs:341`, `src/parsing/ast.rs` `Match`
