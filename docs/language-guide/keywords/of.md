---
id: of
title: of
sidebar_label: of
description: The `of` keyword introduces value-iteration in for loops — for value of collection — complementing for in.
---

# `of`

`of` introduces **value-iteration** in `for` loops — `for value of collection` — complementing `for ... in ...` which iterates keys/elements. Where `for key in map` yields keys, `for value of map` yields values; for value-iterable collections (maps, iterables with a dedicated value channel) `of` selects the value projection. It is reserved by the lexer; parser support is focused on iteration forms.

> **Ground truth:** Lexer `TokenKind::Of` (`src/parsing/lexer.rs:943`, keyword `"of"`), hover doc *Iterator-style `for ... of ...` loop over iterables* (`als/src/hover.rs:349`), loop family with `for`/`in` (`control-flow.md:2.2`). `of` is context-sensitive outside loops.

---

## Syntax

```text
for_in_stmt  ::= "for" binding "in" iterable block
for_of_stmt  ::= "for" binding "of" iterable block   // value projection

binding      ::= ident | "(" ident ("," ident)* ")" | ident "," ident
iterable     ::= expr
block        ::= "{" statements "}"
```

`of` is reserved (`TokenKind::Of`). It only has special meaning inside a `for` header immediately after the binding; elsewhere it is not an operator.

### Canonical forms

```adesh
for value of map { print(value); }            // value iteration over a map
for v of [10, 20, 30] { print(v); }           // value iteration over array (similar to `in` for arrays)
for (k, v) of entries { print(k, v); }        // when entries yield pairs and value is destructured

// Contrast with `in`
for key in map { print(key); }                // keys
for value of map { print(value); }            // values
for item in [10, 20, 30] { print(item); }    // elements (arrays: in ≈ of)
```

### `in` vs `of` — when to use which

| Form | Binds to | Iterable example | Use when |
|---|---|---|---|
| `for x in xs` | element / key / entry key | array, range, map keys, string chars | You need keys or elements |
| `for x of xs` | value | map values, value-iterable | You need the value channel |
| `for (k,v) in xs` | destructure | entries / `enumerate()` | You need both |
| `value in xs` | membership test | array/set/map | Membership, not iteration (keyword `in` as operator) |

For plain arrays and ranges, `in` and `of` are often interchangeable (both yield elements). For maps and keyed collections the distinction matters. If `of` is not yet fully wired in your build, `for value in map.values()` is the explicit fallback.

---

## Semantics

### Value projection

`for pat of iterable { body }` evaluates `iterable` once, obtains a value-iterator (`values()` / `into_value_iter()` per stdlib), and binds `pat` to `iter.next()` each iteration:

```adesh
// Conceptual desugaring
let __iter = iterable.into_value_iter(); // or .values() / .value_iter()
while let Some(pat) = __iter.next() { body }
```

This contrasts with `for ... in ...` which uses `into_iter()` (key/element iterator). For ranges and arrays the two iterators coincide; for maps/ordered maps they diverge.

### Scoping and control flow

- Loop variable is scoped per iteration and does not leak.
- `break` exits, `continue` skips to next value, `return`/`throw` exit the enclosing function (running `defer` handlers).
- `defer` inside the body runs once per iteration before the next `next()` or before loop exit.

### Ownership and mutation

The value iterator may borrow or snapshot values depending on backend. For collections with reference-type values (objects, arrays), `of` typically yields a borrowed or shared reference (`share`/`strong` semantics may apply). Mutating the collection's size while a value iterator is live is rejected or raises a runtime error — snapshot first if mutation is needed:

```adesh
let snapshot = [...map.values()]; // copy values to array, then iterate
for v of snapshot { /* may mutate map */ }
```

### Relation to iterator protocol

| Header | Desugars to | Optimizations |
|---|---|---|
| `for x in 0..N` | counter loop (`CMP`/`JGE`/`INC`) | No allocation, register counter |
| `for x in array` | `into_iter().next()` or pointer bump | Bounds-checked |
| `for x of map` | `into_value_iter().next()` | Hash/value array walk |

### Compilation pipeline

1. **Lex** `of` → `TokenKind::Of`.
2. **Parse** — inside `for` header: `ForOf { binding, iterable, body }`; outside: treated as identifier/contextual (no operator).
3. **HIR** — `HirStmt::ForOf` with value-iterator target.
4. **Desugar/CFG** — emit `while let` with value-iterator.
5. **Codegen** — inline value walk for maps / pointer bump for arrays.

---

## Examples

### Example 1 — `of` over maps and value collections

```adesh
fn map_values_demo() {
    let scores = { "alice": 10, "bob": 20 };

    // `in` yields keys
    for key in scores { print("key:", key); }    // "alice", "bob"

    // `of` yields values
    for score of scores { print("score:", score); } // 10, 20

    // To get both key and value, iterate entries and destructure
    let entries = [["alice", 10], ["bob", 20]];
    for (name, score) in entries { print(name + "=" + str(score)); }

    // Array value iteration — similar to `in` for arrays
    for v of [10, 20, 30] { print(v); } // 10,20,30

    // String — for...of yields values (chars) where `in` and `of` coincide
    for ch of "hi" { print(ch); } // "h","i"
}

// Fallback when `of` is not fully wired — explicit values()
fn map_values_fallback() {
    let m = { "x": 1, "y": 2 };
    for v in m.values() { print(v); } // 1, 2 — equivalent to `for v of m`
}
```

### Example 2 — Filtering, early exit, and `defer` inside `of` loops

```adesh
fn sum_values(map): i32 {
    let total = 0;
    for v of map {
        if v < 0 { continue; }   // skip negative values
        total += v;
        if total > 100 { break; } // early exit
    }
    return total;
}
print(sum_values({ "a": 10, "b": -5, "c": 40, "d": 80 })); // e.g., 50 or 130 depending on iteration order

fn with_defer_over_values(paths: [string]) {
    for p of paths {
        let f = FS.open(p, "w");
        defer f.close(); // runs each iteration before next value
        f.write("hello " + p);
        if p == "stop" { break; } // defer still runs for this iteration
    }
}

fn enumerate_values(xs: [i32]) {
    // When you need both index and value, `enumerate()` + `in`/`of` destructure
    for i, v of xs.enumerate() { print(f"{i}:{v}"); }
    // or
    for (i, v) in xs.enumerate() { print(i, v); }
}
```

### Example 3 — Async, concurrent `spawn`, and `region` with value iteration

```adesh
async fn process_values(urls: [string]): [string] {
    let results: [string] = [];
    // `for ... of ...` with async suspension — sequential
    for url of urls {
        let body = await fetch(url);
        results.push(body);
    }
    return results;
}

async fn process_values_concurrent(urls: [string]): [string] {
    let handles = [];
    for url of urls { handles.push(spawn fetch(url)); } // spawn inside of-loop
    let out: [string] = [];
    for h in handles { out.push(await h); } // join
    return out;
}

// Region bulk-free per value iteration
fn batched_from_map(map) {
    for v of map {
        region scratch {
            unsafe {
                let buf: *mut u8 = alloc<u8>(256);
                // use v and buf together
                for i in 0..256 { buf[i] = (v as u8 + i as u8) as u8; }
                // bulk-free at end of this value's iteration
            }
        }
    }
}
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let of = 1` | `unexpected token 'of', expected identifier` | `TokenKind::Of` reserved (`lexer.rs:943`) |
| **Parse** | `for x of { }` with missing iterable | `expected expression after 'of'` | Provide `for v of collection { }` |
| **Parse** | `for x of` outside `for` header (e.g., `let a = b of c`) | `unexpected token 'of'` / `expected operator` | `of` only has special meaning inside `for` |
| **Type** | `for v of 42` (non-iterable) | `type 'i32' is not value-iterable` | Use array/map/iterable with value channel |
| **Type** | `for (a,b) of xs` where value not 2-tuple | `cannot destructure <type> into 2 bindings` | Fix pattern arity |
| **Backend** | `of` on build without value-iterator wiring | `for ... of ... is not supported for this type` | Use `for v in xs.values()` fallback |
| **Borrow** | Mutating collection while `of` iterator live | `cannot mutate collection while iterating` | Snapshot: `[...xs.values()]` first |
| **Region** | Region pointer from `of` body escapes region | `allocation from region does not outlive region` | Copy data out |

**Common pitfall — using `of` as a general operator:**

```adesh
// ❌ Not valid: `of` is not a binary operator like `in`
let a = xs of ys; // parse error

// ✅ Only inside `for`:
for v of xs { print(v); }

// For membership tests, use `in`:
if 3 in [1,2,3] { print("yes"); }
if "a" in map { print(map["a"]); }
```

---

## See Also

- [for](./for) — loop header and `ForIn`/`ForOf` desugaring
- [in](./in) — `for ... in ...` and membership `value in collection`
- [while](./while) / [do](./do) — condition-based loops
- [break](./break) / [continue](./continue) — loop control (`JUMP_OUT`/`JUMP_LOOP_HEAD`)
- [Control Flow](../control-flow) — iterator protocol and loop lowering
- [Arrays & Collections](../collections) — value iterators and `values()` fallback
- `src/parsing/lexer.rs:943`, `als/src/hover.rs:349`
