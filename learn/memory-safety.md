---
id: memory-safety
title: Memory Safety, Ownership & Borrowing
sidebar_label: 16. Memory Safety & Ownership
---

# Memory Safety, Ownership & Borrowing

This is where AdeshLang (like Rust) is genuinely different: the **compiler
proves your program has no use-after-free, no double-free, no data races** —
before you even run it. This lesson explains the mental model using the
repository's own valid and failing borrow examples.

## The idea: every value has an owner

Every value is owned by exactly one variable. When that variable's scope ends,
the value is cleaned up automatically.

```adesh
fn main() {
    let data = [1, 2, 3];   // 'data' owns the array
    print(data);

    // ... scope ends, 'data' is freed automatically
}
```

**Output:**
```
[1, 2, 3]
```

No garbage collector pauses, no manual `free` needed. Simple programs just
work.

## Passing values moves ownership

When you pass a value to a function *without* a reference, ownership **moves**
— the original variable can no longer be used:

```adesh
struct Container {
    id: i32;
}

fn takeOwnership(c) {
    print("Got container with id", c.id);
}

let c = Container { id: 42 };
takeOwnership(c);
// print(c.id);   // ❌ ERROR: 'c' was moved into takeOwnership
```

**Output:**
```
Got container with id 42
```

## Borrowing with `&`: share without giving up

A **reference** `&` lets you *lend* a value to a function while keeping
ownership. The function can read it, but not take it away:

```adesh
fn inspect(ref: &Container) {
    print("Inspecting container id:", ref.id);
}

let c = Container { id: 42 };
inspect(&c);              // lend it temporarily
print("Owner still has it:", c.id);   // ✅ still usable
```

**Output:**
```
Inspecting container id: 42
Owner still has it: 42
```

This is the exact valid-borrow pattern from
`examples/memory/borrow_ok.adesh`:

```adesh
let p = alloc<i32>();
*p = 42;

let r1 = &p;   // shared read borrow
let r2 = &p;   // another shared read — fine
print(*r1, *r2);

free(p);       // owned pointer, freed by us
```

**Output:**
```
42 42
```

## The two rules, remembered by one phrase

The borrow checker enforces two rules:

1. **You may have many read-only borrows (`&`) at once.**
2. **You may have one mutable access at a time** — or no borrows while you
   mutate.

Mutations are auto-inferred: if the compiler sees you mutate a value, it treats
the reference as exclusive.

```adesh
let p2 = alloc<i32>();
let mr = &p2;       // compiler sees the mutation below → exclusive borrow
*mr = 100;          // mutate through the reference
print(*mr);
free(p2);
```

**Output:**
```
100
```

## What the compiler rejects

`examples/memory/borrow_fail.adesh` shows exactly the errors the compiler
catches:

```adesh
// ERROR: cannot mutate through a shared (read-only) reference
let r = &p;
*r = 42;    // ❌ compile error

// ERROR: cannot get exclusive access while a shared borrow is active
let r = &p;
let mr = &p;  // ❌ the first &p is still active
*mr = 42;

// ERROR: cannot use p after it was moved
let q = p;    // move
let r2 = &p;  // ❌ p is gone
```

The compiler finds these problems at compile time — the program does not even
run. That is the "zero-cost" part: correctness guaranteed, no runtime cost.

## Shared ownership with `Arc`

When multiple parts of a program need to share the *same* data, use `Arc`
(atomically reference-counted). The counter tracks every clone; the data lives
until the last clone drops:

```adesh
import { adesh_alloc::Arc } from "adesh_alloc";

let shared = Arc::new(42);
let a = shared.clone();     // reference count: 2
let b = shared.clone();     // reference count: 3
print(*a);                  // 42
// when a and b drop, the count reaches 0 and the value frees
```

**Output:**
```
42
```

`examples/arc/` has 23 files demonstrating reference-counted sharing,
including the [tree structure with smart pointers](/learn/memory-safety#smart-pointers-in-real-code)
below.

## Smart pointers in real code

`examples/pointers/tree_structure.adesh` builds a real tree where:

- **children** are owned by their parent (`Shared<TreeNode>[]`)
- **parent back-references** are `Weak` — they do not keep the parent alive,
  and become `null` when the parent dies

```adesh
class TreeNode {
    fn init(value) {
        this.value = value;
        this.children = [];
        this.parent = null;    // Weak back-reference, breaks cycles
    }

    fn addChild(child) {
        this.children.push(child);
        child.parent = this;
        return child;
    }
}

let root = TreeNode();
let child = TreeNode();
root.addChild(child);
print(child.parent.value);     // root's value
```

**Output:**
```
root
```

`Weak` prevents reference-count cycles (a parent holding a child holding the
parent) that would otherwise leak memory forever.

## The practical takeaway for beginners

You rarely manage memory by hand in AdeshLang. The mental model is:

- **Own**: every value has exactly one owner (its variable).
- **Borrow**: pass `&value` to *read* without transferring ownership.
- **Share**: use `Arc` when several places genuinely need the same data.
- **Trust the compiler**: if a borrow-check error appears, the fix is usually to
  *copy the value*, *reorder* the borrows, or *scope* the reference earlier.

## Real files to study

| File | Lesson |
|------|--------|
| `examples/memory/borrow_ok.adesh` | valid borrow patterns |
| `examples/memory/borrow_fail.adesh` | every rule the compiler enforces |
| `examples/memory/comprehensive_ownership.adesh` | ownership moves + scopes |
| `examples/arc/` | shared ownership with `Arc` |
| `examples/pointers/tree_structure.adesh` | `Shared`/`Weak` smart pointers |
| `examples/advanced/arc.md` (docs) | the full deep dive |

## Summary

✅ **You learned:**
- Every value has exactly one **owner**
- Passing a value **moves** ownership; `&` **borrows** it
- Multiple read-only borrows are fine; mutation needs exclusive access
- The compiler catches violations at compile time — zero runtime cost
- `Arc` shares data with reference counting; `Weak` breaks cycles
- Real code (trees, caches, threads) uses these patterns everywhere

## Next Step

Sometimes you need to pull the lever yourself — now let's talk about
**manual memory** with `alloc`/`free` and the `unsafe` block. Continue to
**[Manual Memory & unsafe](/learn/manual-memory)** →
