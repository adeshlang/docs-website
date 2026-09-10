---
id: for
title: for
sidebar_label: for
description: The `for` keyword begins iterator loops over arrays, ranges, maps, and any iterable — desugaring into while-let iterator protocol and optimized range counters.
---

# `for`

`for` begins an **iterator loop**. It binds one or two loop variables to each element produced by an iterable and runs the body once per element. AdeshLang currently supports `for ... in ...` (keys/elements) and the reserved `for ... of ...` (values) forms; both desugar to the iterator protocol (`into_iter` / `next`). Range loops (`for i in 0..N` / `0..=N`) are specially optimized to hardware counter loops without heap allocation.

> **Ground truth:** Lexer `TokenKind::For` (`src/parsing/lexer.rs:940`), AST `StmtKind::ForIn` / `ForOf` family, hover doc *For-in loop over collections/ranges* (`als/src/hover.rs:347`), lowering documented in `control-flow.md:2.2`.

---

## Syntax

```text
for_in_stmt  ::= "for" binding "in" iterable block
for_of_stmt  ::= "for" binding "of" iterable block   // reserved for value iteration
binding      ::= ident | "(" ident ("," ident)* ")" | ident "," ident  // single or destructure
iterable     ::= expr                               // array, range, map, string, iterator
block        ::= "{" statements "}"
range        ::= expr ".." expr                      // exclusive 0..N
              |  expr "..=" expr                     // inclusive 0..=N
```

`for` is reserved and cannot be used as an identifier. The iterable is evaluated once before loop entry; the binding is fresh per iteration.

### Canonical forms

```adesh
for item in [10, 20, 30] { print(item); }

for i in 0..5 { print(i); }          // 0,1,2,3,4 (exclusive)
for i in 0..=5 { print(i); }         // 0,1,2,3,4,5 (inclusive)

for key in map { print(key); }
for value of map { print(value); }   // value iteration (reserved form)

for (k, v) in entries { print(k, v); } // destructuring when iterable yields tuples

for i, v in [10, 20, 30].enumerate() { print(i, v); }

for ch in "hello" { print(ch); }     // string iteration (char or string per build)
```

### Range desugaring vs. iterator desugaring

```adesh
// General iterable: desugars to iterator protocol
for item in collection { process(item); }
// ≈
let iter = collection.into_iter();
while let Some(item) = iter.next() { process(item); }

// Range: hardware counter optimization — no iterator object
for i in 0..1000 { work(i); }
// ≈
let __end = 1000; let i = 0; while i < __end { work(i); i += 1; }
```

---

## Semantics

### Evaluation order

1. Evaluate `iterable` once, obtaining an iterator or range bounds.
2. On each iteration, bind the next element(s) to `binding` and execute `block`.
3. If the iterable is empty, the body never runs.
4. Loop variables are **scoped to the loop** — they do not leak after the closing `}`.

### Break / continue / return / throw

- `break` exits the loop immediately (jumps to after the loop).
- `continue` skips to the next iteration (re-evaluates iterator / increments counter).
- `return` / `throw` exit the enclosing function, running any `defer` handlers in the loop scope first.
- `break`/`continue` with `defer` inside the body: `defer` runs before the jump, once per iteration.

### Ownership and borrowing

The iterator may borrow the collection. Mutating the collection's size during iteration while an iterator is live is typically rejected or yields a runtime error, depending on backend. Use indexed `while` or snapshot (`[...collection]`) if mutation is needed.

### Performance

- **Range loops** (`0..N`, `0..=N`) bypass allocation and compile to `CMP`/`JGE`/`INC` counter loops — the fastest iteration form.
- **Array loops** use a bounds-checked pointer bump or iterator object; `raw` arrays and `DynArray` differ in metadata size (`ast.rs:119,146`).
- **Iterator loops** pay one `next()` call per element; branch prediction favors tight bodies.

### Compilation pipeline

1. **Lex** `for` → `TokenKind::For`, `in` → `TokenKind::In`, `of` → `TokenKind::Of`.
2. **Parse** as `ForIn { binding, iterable, body }` or `ForOf` variant.
3. **Desugar** ranges → counter loop; general → `while let` iterator loop.
4. **HIR/CFG** — loop header/body/exit blocks with `defer` cleanup points.
5. **Codegen** — range: registers; iterator: vtable dispatch or inlined `next`.

---

## Examples

### Example 1 — Arrays, ranges, and early exit

```adesh
fn sum_array(xs: [i32]): i32 {
    let total = 0;
    for item in xs { total += item; }
    return total;
}
print(sum_array([1, 2, 3, 4])); // 10

fn sum_range(n: i32): i32 {
    let total = 0;
    for i in 0..n { total += i; }   // exclusive upper bound
    return total;
}
print(sum_range(5)); // 0+1+2+3+4 = 10

fn sum_inclusive(n: i32): i32 {
    let total = 0;
    for i in 0..=n { total += i; }  // inclusive
    return total;
}
print(sum_inclusive(5)); // 15

fn find_first(xs: [i32], want: i32): i32? {
    for i, v in xs.enumerate() {
        if v == want { return i; }
    }
    return null;
}
print(find_first([10, 20, 30], 20)); // 1
```

### Example 2 — Maps, sets, strings, destructuring, and control flow

```adesh
fn demo_collections() {
    let map = { "a": 1, "b": 2, "c": 3 };

    // `in` on a map iterates keys (per runtime spec)
    for key in map { print(key); }       // "a", "b", "c" (order depends on map type)

    // `of` iterates values (reserved form; check backend support)
    for value of map { print(value); }   // 1, 2, 3

    // Destructuring entries
    let entries = [["a", 1], ["b", 2]];
    for (k, v) in entries { print(k + ":" + str(v)); }

    // String iteration
    for ch in "hello" { print(ch); } // "h","e","l","l","o"

    // Filtering with continue, early exit with break
    let evens: [i32] = [];
    for i in 0..10 {
        if i % 2 != 0 { continue; }
        evens.push(i);
        if evens.len() >= 3 { break; }
    }
    print(evens); // [0, 2, 4]

    // defer inside loop — runs each iteration before next iteration or exit
    for path in ["/tmp/a", "/tmp/b"] {
        let f = FS.open(path, "w");
        defer f.close();
        f.write("hi");
    }
}
```

### Example 3 — Async iteration, `spawn` inside loops, and nested loops

```adesh
async fn fetch_many(urls: [string]): [string] {
    // Sequential: each await suspends until that fetch completes
    let out: [string] = [];
    for url in urls {
        let body = await fetch(url);
        out.push(body);
    }
    return out;
}

async fn fetch_many_concurrent(urls: [string]): [string] {
    // Concurrent: spawn inside the for loop, then join
    let handles = [];
    for url in urls { handles.push(spawn fetch(url)); }
    let out: [string] = [];
    for h in handles { out.push(await h); }
    return out;
}

fn matrix_iter(rows: [[i32]]): i32 {
    let total = 0;
    for row in rows {
        for val in row {
            total += val;
            if total > 100 { break; } // breaks inner loop only
        }
    }
    return total;
}

// Range with region — bulk-free scratch buffer per outer iteration
fn batched(n: i32) {
    for batch in 0..4 {
        region scratch {
            unsafe {
                let buf: *mut u8 = alloc<u8>(1024);
                for i in 0..1024 { buf[i] = (batch + i) as u8; }
                // no free needed — region bulk-frees at end of batch iteration
            }
        }
    }
}
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let for = 1` | `unexpected token 'for', expected identifier` | `TokenKind::For` reserved |
| **Parse** | `for x { }` (missing `in`/`of`) | `expected 'in' or 'of' after for binding` | Write `for x in xs { }` |
| **Parse** | `for in xs { }` (missing binding) | `expected identifier after 'for'` | Provide a loop variable |
| **Parse** | `for x in` with no iterable | `expected expression after 'in'` | Provide an iterable/range |
| **Type** | `for x in 42` where `i32` is not iterable | `type 'i32' is not iterable` | Iterate over array/range/map/iterator |
| **Type** | `for (a,b) in xs` where elements are not 2-tuples | `cannot destructure <type> into 2 bindings` | Match arity to element type |
| **Borrow** | Mutating collection size while `for` iterator is live | `cannot mutate 'xs' while iterator is active` / runtime error | Use indexed `while` or snapshot |
| **Control** | `break`/`continue` outside loop | `break is only valid inside a loop` | Move inside `for`/`while` |
| **Region** | Region pointer from inside `for` escapes loop scope | `allocation from region does not outlive region` | Copy data out before region exit |

**Common pitfall — off-by-one on ranges:**

```adesh
for i in 0..5   { print(i); } // 0,1,2,3,4
for i in 0..=5  { print(i); } // 0,1,2,3,4,5
// Use `..` for array indices (len is exclusive), `..=` when inclusive endpoint is intended.
```

---

## See Also

- [in](./in) — membership and `for ... in ...` binding (`TokenKind::In`)
- [of](./of) — value iteration `for ... of ...` (`TokenKind::Of`)
- [while](./while) / [do](./do) — condition-based loops
- [break](./break) / [continue](./continue) — loop control (`JUMP_OUT` / `JUMP_LOOP_HEAD`)
- [Control Flow](../control-flow) — conditional branching and loop lowering
- [region](./region) — arena lifetimes around loop iterations
- [defer](./defer) — per-iteration cleanup before `break`/`continue`
- `src/parsing/lexer.rs:940`, `src/parsing/ast.rs:636+`, `als/src/hover.rs:347`
