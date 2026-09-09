---
id: in
title: in
sidebar_label: in
description: The `in` keyword introduces the iteration clause of for loops and acts as the membership test operator for collections and ranges.
---

# `in`

`in` has two related roles: (1) the **iteration clause** of `for` loops — `for binding in iterable` — where it binds each element from the iterable to the loop variable, and (2) the **membership / containment operator** — `value in collection` / `key in map` — that tests whether a value is present. Both forms derive from the iterator/containment protocol and share the keyword token.

> **Ground truth:** Lexer `TokenKind::In` (`src/parsing/lexer.rs:942`, keyword `"in"`), hover doc *Used in `for ... in ...` loops and `... in collection` membership checks* (`als/src/hover.rs:348`), loop desugaring in `control-flow.md:2.2`.

---

## Syntax

```text
for_in_stmt   ::= "for" binding "in" iterable block
binding       ::= ident | "(" ident ("," ident)* ")" | ident "," ident
iterable      ::= expr

membership    ::= expr "in" expr          // value in collection / range
                            // also: key in map / element in array / substring in string
```

`in` is reserved (`TokenKind::In`). It never stands alone — it always sits between a binding/value on the left and an iterable/collection on the right.

### Canonical forms

```adesh
for item in [1, 2, 3] { print(item); }
for key in map { print(key); }           // key iteration
for i in 0..5 { print(i); }              // range iteration
for (k, v) in entries { print(k, v); }  // destructure

if "hello" in greeting { print("found"); }  // membership (where supported)
if 3 in [1, 2, 3, 4] { print("yes"); }
if key in map { print(map[key]); }
for ch in "hello" { print(ch); }           // string iterable
```

### `in` vs `of`

| Form | What it binds / tests | Typical iterable |
|---|---|---|
| `for x in xs` | elements / keys | array, range, map keys, set, string chars |
| `for x of xs` | values | map values, value-iterable collections |
| `value in coll` | membership boolean | array, map (key), range, string |

Check backend coverage for `of` and `in` as pure membership operator — `for ... in ...` is the universally supported form.

---

## Semantics

### As loop clause: `for ... in ...`

`for pat in iterable { body }` evaluates `iterable` once, obtains an iterator (or range counter), and repeatedly binds `pat` to `iter.next()` until exhaustion. Desugared:

```adesh
// Iterable path
let __iter = iterable.into_iter();
while let Some(pat) = __iter.next() { body }

// Range path (optimized — no heap allocation)
let __end = N; let pat = 0; while pat < __end { body; pat += 1; }
```

Bindings are scoped per iteration; mutating the pattern inside the body does not affect iteration state.

### As membership operator: `value in collection`

Where supported, `value in collection` evaluates to `bool` by delegating to a `contains` protocol:

- **Array / set:** linear or hash containment (`[1,2,3].contains(2)`).
- **Map:** key presence (`"a" in {"a": 1}` → `true`).
- **Range:** bounds check (`3 in 0..10` → `true`, `10 in 0..10` → `false` for exclusive `..`).
- **String:** substring search (`"ell" in "hello"` → `true` in builds that enable it).

Membership is **non-mutating** and does not advance any iterator. For maps, prefer `key in map` before `map[key]` to avoid missing-key traps.

### Performance

- `for x in 0..N`: `O(N)` counter increments, no allocation — the fastest loop form.
- `for x in array`: `O(N)` pointer bump with bounds check per element.
- `x in array` (linear array): `O(N)` scan; `x in set` / `x in map`: `O(1)` hash lookup.

### Compilation pipeline

1. **Lex** `in` → `TokenKind::In`.
2. **Parse** — inside `for` header as part of `ForIn`; outside as binary `In` expression (membership).
3. **HIR** — loop: `HirStmt::ForIn`; membership: `HirExpr::In { lhs, rhs }` → `contains` call.
4. **CFG/Desugar** — loop lowered to `while let` or counter; membership to method call / intrinsic.
5. **Codegen** — range: registers; array: pointer loop; map/set: hash probe.

---

## Examples

### Example 1 — `for ... in ...` over arrays, ranges, and destructuring

```adesh
fn sum(xs: [i32]) -> i32 {
    let total = 0;
    for v in xs { total += v; }
    return total;
}
print(sum([1, 2, 3])); // 6

// Range iteration with inclusive/exclusive bounds
for i in 0..3 { print(i); }   // 0,1,2
for i in 0..=3 { print(i); }  // 0,1,2,3

// Enumerate with destructuring (index + value)
for i, v in [10, 20, 30].enumerate() {
    print(f"{i}:{v}");
}
// 0:10  1:20  2:30

// Destructure pair entries
let pairs = [["a", 1], ["b", 2]];
for (k, n) in pairs { print(k + "=" + str(n)); }
```

### Example 2 — Maps, sets, strings, and `of` contrast

```adesh
fn map_iteration() {
    let scores = { "alice": 10, "bob": 20, "carol": 30 };

    // `for ... in ...` on a map yields keys (per runtime spec)
    for key in scores { print(key); }         // "alice", "bob", "carol"

    // `for ... of ...` yields values (reserved form)
    for value of scores { print(value); }     // 10, 20, 30

    // To get both, iterate entries (shape depends on stdlib)
    let entries = [["alice", 10], ["bob", 20]];
    for (name, score) in entries { print(name, score); }

    // String iteration
    for ch in "Adesh" { print(ch); } // "A","d","e","s","h"
}

// Membership tests (availability per backend; pattern is idiomatic)
fn membership_demo() {
    let xs = [1, 2, 3, 4];
    if 3 in xs { print("3 is in xs"); }
    if 9 in xs { print("unreachable"); } else { print("9 not in xs"); }

    let map = { "x": 1, "y": 2 };
    if "x" in map { print(map["x"]); } // safe — key presence check before access

    if 5 in 0..10 { print("in range"); }      // true
    if 10 in 0..10 { print("no"); } else { print("10 is exclusive end"); }
}
```

### Example 3 — `in` with control flow, async, and regions

```adesh
fn filter_with_continue(xs: [i32]) -> [i32] {
    let out: [i32] = [];
    for v in xs {
        if v < 0 { continue; }
        if v > 100 { break; }
        out.push(v);
    }
    return out;
}
print(filter_with_continue([5, -1, 50, 200, 3])); // [5, 50]

async fn fetch_all(urls: [string]) -> [string] {
    let bodies: [string] = [];
    for url in urls {
        // Sequential awaits inside for — each iteration suspends
        let body = await fetch(url);
        bodies.push(body);
    }
    return bodies;
}

async fn fetch_all_concurrent(urls: [string]) -> [string] {
    let handles = [];
    for url in urls { handles.push(spawn fetch(url)); } // spawn inside for
    let bodies: [string] = [];
    for h in handles { bodies.push(await h); }
    return bodies;
}

// Region per iteration — bulk-free scratch buffer
fn batched_process(items: [i32]) {
    for item in items {
        region scratch {
            unsafe {
                let buf: *mut u8 = alloc<u8>(256);
                for i in 0..256 { buf[i] = (item + i) as u8; }
                // bulk-free at end of iteration
            }
        }
    }
}
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let in = 1` | `unexpected token 'in', expected identifier` | `TokenKind::In` reserved |
| **Parse** | `for x { }` (missing `in`) | `expected 'in' or 'of' after for binding` | Write `for x in xs { }` |
| **Parse** | `for in xs { }` (missing binding) | `expected identifier after 'for'` | Provide `for item in xs` |
| **Parse** | `for x in { }` with no iterable | `expected expression after 'in'` | Provide iterable/range |
| **Type** | `for x in 42` (non-iterable) | `type 'i32' is not iterable` | Use array/range/map/string/iterator |
| **Type** | `x in 42` (membership on non-collection) | `type 'i32' has no 'contains' protocol` | Check RHS is collection/range/string/map |
| **Destructure** | `for (a,b) in xs` where `xs` element not 2-tuple | `cannot destructure <type> into 2 bindings` | Fix pattern arity |
| **Borrow** | Mutating collection size while `for ... in ...` iterator live | `cannot mutate collection while iterating` | Snapshot or use index `while` |
| **Region** | Capturing region pointer from `for` body past region | `allocation from region does not outlive region` | Copy data out |

**Common pitfall — confusing `in` iteration with C-style index loop:**

```adesh
// Adesh: directly iterates elements
for v in [10, 20, 30] { print(v); } // 10,20,30
// Not: for (let i=0; i<n; i++) — use range loops instead:
for i in 0..3 { print(i); } // 0,1,2 — then xs[i] if index is needed
```

---

## See Also

- [for](./for) — `for` loop header and desugaring (`ForIn`/`ForOf`)
- [of](./of) — value iteration `for ... of ...` (`TokenKind::Of`)
- [while](./while) / [do](./do) — condition-based loops
- [break](./break) / [continue](./continue) — loop control
- [range syntax](../control-flow) — `0..N` / `0..=N` optimized counters
- [Control Flow](../control-flow) — iterator protocol and loop lowering
- `src/parsing/lexer.rs:942`, `als/src/hover.rs:348`
