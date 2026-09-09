---
id: semantics-rules
title: "Formal Memory Safety & Borrow Checker Specification"
description: "Formal specification of AdeshLang ownership semantics, destructive move invariants, Drop glue, Aliasing XOR Mutability theorem, and Non-Lexical Lifetimes (NLL)."
sidebar_label: "Memory Safety & Borrow Checker"
---

# Formal Memory Safety & Borrow Checker Specification

This document provides the formal mathematical and architectural specification of AdeshLang's compile-time memory safety invariants, destructive move semantics, Drop glue generation, and Borrow Checker specification.

---

## 1. Ownership System Invariants

Memory safety in AdeshLang is guaranteed at compile time without a Garbage Collector (GC) through strict enforcement of three core ownership invariants. The implementation spans `src/parsing/ownership.rs`, `src/parsing/ownership_enhanced.rs`, `src/parsing/borrow_check.rs`, and the unified pass `src/parsing/unified_safety_pass.rs`.

1. **Single Owner Invariant**: Every value has exactly one owner binding at any point.
2. **Deterministic Lifetime Invariant**: When the owner goes out of scope, heap memory is deterministically deallocated via Drop glue.
3. **Move Transfer Invariant**: Assigning or passing by value transfers ownership, invalidating the source (**destructive move**). Captures and coroutine suspensions also move or borrow per ownership.

These invariants are encoded as a bitmask status map over SSA variables during HIR lowering (`src/parsing/hir_lower.rs`, `src/parsing/hir.rs`).

---

## 2. Destructive Move Semantics & Drop Glue

When ownership of a heap-backed variable is assigned or passed to a function, the source is marked uninitialized:

```adesh
let a = Container { id: 100 };
let b = a; // Ownership MOVED to 'b'. 'a' is now uninitialized.
// print(a.id); // COMPILE ERROR E0030: Use of moved value 'a'

fn consume(c: Container) {}
consume(b); // moves b
// print(b.id); // E0030: use of moved value 'b'
```

### 2.1 Compiler SSA Lowering & Drop Flags

During compilation, the AST transformer inserts conditional **Drop Flags** for variables whose initialization status depends on control flow (see `src/parsing/drop_insertion.rs` and `src/parsing/unified_safety_pass.rs`):

```text
[ Scope Exit ]
      |
      v
[ Check Drop Flag for 'a' ]
      |
   +--+--+
   |     |
 (1)     (0)
   v     v
[Run]   [Skip]  --> Deallocate heap buffer iff Drop Flag == 1
```

If a value has been moved, its Drop Flag is `0`, preventing double-free. For variables always initialized, the flag is elided and the drop is unconditional. For conditional moves:

```adesh
let x;
if (cond) {
    x = Container { id: 1 };
    // Flag(x) = 1
} else {
    // Flag(x) = 0
    print("no init");
}
// At scope exit: if Flag(x) then drop(x)
```

Drop glue also runs for compound values: dropping `Vec<T>` drops each element `T` in reverse declaration order, then frees the buffer. This is visible in `src/parsing/drop_insertion.rs`.

### 2.2 Copy vs Move

Primitive fixed-width types (`i32`, `f64`, `bool`, `char`) and trivially copyable tuples thereof are `Copy` — assignment duplicates the value without invalidating the source:

```adesh
let a: i64 = 42;
let b = a; // Copy: a remains valid
print(a);  // OK
let s: string = "hello"; // string is not Copy (heap allocation)
let t = s;
// print(s); // E0030: s moved
```

Heap types (`string`, `[T]`, `Class`, `Struct` with heap fields, `Share<T>`) are non-`Copy` and move. Custom types control this via ownership annotations.

### 2.3 Ownership Across Calls & Returns

```adesh
fn make() -> Container { return Container { id: 1 }; }
fn take(c: Container) -> i64 { return c.id; } // takes ownership
let c = make();         // c owns the returned allocation
let id = take(c);       // c moved into take; c invalid after
// c.id; // E0030
```

Returning a local variable moves it to the caller (NRVO where possible). Returning a reference to a local is rejected (`E0031: cannot return reference to local`).

---

## 3. Borrow Checker Formal Specification

Borrowing references values without transferring ownership. Enforced by `src/parsing/borrow_check.rs` and refined by `src/parsing/borrow_inference.rs` and `src/parsing/lifetime_tracking.rs`.

### 3.1 Aliasing XOR Mutability Theorem

```text
For all active references r_1, r_2 to value V:
  (is_shared(r_1) AND is_shared(r_2)) XOR (is_exclusive(r_1) AND r_2 == NULL)

Invariant: at any program point, for any value V,
  either 0 or more shared borrows (&T) exist with NO exclusive borrow,
  or exactly 1 exclusive borrow (&mut T) exists with NO other borrows.
```

- **Shared Borrows (`&T`)**: Unlimited concurrent read-only references; no mutation while shared refs are live.
- **Exclusive Borrows (`&mut T`)**: Exactly one exclusive reference; no other references coexist.

```adesh
let data = DataBuffer::new();
read(&data);  // shared borrow
read(&data);  // shared: OK (multiple readers)
update(&mut data); // exclusive: requires no active shared borrows
```

### 3.2 Borrow Kinds & Syntax

```adesh
fn read(data: &Data) -> i64 { return data.len(); }
fn write(data: &mut Data) { data.push(42); }
let x = &data;       // shared borrow
let y = &mut data;   // exclusive borrow
```

References are lowered in HIR as `HirType::Ref` with mutability flags; captures in closures are inferred as shared/exclusive per `src/parsing/closure_capture.rs`.

### 3.3 Common Borrow Errors

| Code | Message | Fix |
|---|---|---|
| `E0500` | `cannot borrow as mutable because it is also borrowed as immutable` | End shared borrow before `&mut` |
| `E0501` | `cannot borrow as immutable because it is already borrowed as mutable` | End `&mut` before `&` |
| `E0502` | `cannot assign to borrowed value` | Drop borrows before assignment |
| `E0503` | `cannot move out of borrowed value` | Clone or end borrow |
| `E0504` | `borrowed value does not live long enough` | Extend owner scope or clone |

Example `E0500`:

```adesh
let mut data = DataBuffer::new();
let r1 = &data;
let r2 = &mut data; // E0500: cannot borrow as mutable because it is also borrowed as immutable (r1)
print(r1.len());    // r1 used here, so lifetime overlaps
```

Fix via NLL (§4):

```adesh
let mut data = DataBuffer::new();
let r1 = &data;
print(r1.len()); // last use of r1 ends its lifetime here
let r2 = &mut data; // OK now
r2.push(42);
```

---

## 4. Non-Lexical Lifetimes (NLL) Analysis Graph

AdeshLang utilizes **Non-Lexical Lifetimes (NLL)**. A reference's lifetime is not restricted to its enclosing lexical block `{ ... }`. It is the **Control Flow Graph (CFG)** region from creation to last actual use:

```adesh
fn process() {
    let data = DataBuffer::new();
    let ref1 = &data;
    print(ref1.size); // <-- LAST USE of 'ref1'. Lifetime of 'ref1' ENDS HERE.
    update(&mut data); // VALID: ref1 no longer active, exclusive mutation permitted!
}
```

If NLL were lexical, the `update` call would be rejected because `ref1`'s block is still open. NLL eliminates such false positives.

### 4.1 CFG Lifetime Calculation Algorithm

Implemented in `src/parsing/lifetime_tracking.rs` and `src/parsing/cfg_borrow` / `src/parsing/compile_time_memory_safety`:

1. Construct the Control Flow Graph (CFG) for the function body (basic blocks from `src/parsing/hir.rs`).
2. For each reference `r`, identify the set `P_use(r)` where `r` is read/dereferenced.
3. Compute lifetime region `L(r)` as the smallest connected sub-graph of CFG nodes containing `P_use(r)` and reachable from `r`'s creation.
4. Verify that for any exclusive borrow `r_ex`, `L(r_ex) ∩ L(r') == ∅` for all other active references `r'`.
5. Report overlap violations with precise spans (`E0500`-`E0504`).

```
CFG Example:
  B0: let data = ...
      let r1 = &data;
      print(r1.size);   // P_use(r1) includes this block
      // L(r1) ends here (no further use)
  B1: update(&mut data) // L(r_mut) starts here, disjoint from L(r1) => OK
  B2: return
```

For branches, `L(r)` unions across successor blocks until the last use on each path.

### 4.2 Lifetime Elision & Annotations (where applicable)

References in function signatures have lifetimes tracked by the borrow checker. While AdeshLang's syntax largely elides explicit lifetime parameters, the compiler internally assigns lifetime variables and solves constraints; escaping a local reference is caught:

```adesh
fn bad() -> &i64 {
    let x: i64 = 42;
    return &x; // E0031: cannot return reference to local variable
}
```

---

## 5. Ownership & Borrowing Interaction

### 5.1 Move Closes Borrows

Moving the owner invalidates all outstanding borrows:

```adesh
let mut data = DataBuffer::new();
let r = &data;
let owned = data; // E0503: cannot move out of borrowed value (r active)
// fix: end r's lifetime before move
```

### 5.2 Reborrowing

Mutable references can be reborrowed as shared or exclusive without moving:

```adesh
fn peek(x: &mut Vec<i64>) -> &i64 { return &x[0]; } // reborrow &mut Vec as &i64
fn extend(v: &mut Vec<i64>) { peek(v); v.push(1); }  // peek's borrow ends before push
```

Reborrow lifetimes are shorter than the original borrow; the borrow checker treats `&*x` as a derived borrow with `L(child) ⊆ L(parent)`.

### 5.3 Interior Mutability Boundaries

`Share<T>` / `StrongDecl` / `WeakDecl` (see `src/parsing/ast.rs:ShareDecl`, `StrongDecl`) introduce reference-counted shared ownership that relaxes aliasing rules at the cost of runtime refcount and, for `Mutex<T>`/`RwLock<T>`, synchronization.

---

## 6. Region & Arena Interaction

Region blocks (`StmtKind::Region { name, body }` in `src/parsing/ast.rs`) create arena scopes where allocations are batched and freed together:

```adesh
region Temp {
    let buf = alloc_in_region(1024);
    use(buf);
} // all Temp allocations freed here, Drop glue coalesced

// Borrows into a region cannot escape the region:
region R {
    let x = alloc_in_region(42);
    let r = &x;
}
// print(r); // E0504: r does not live long enough (region ended)
```

Regions are verified by the ownership pass; `defer` inside regions still runs before region teardown (see `defer-statement.md`).

---

## 7. Unsafe & Escape Analysis

Escape analysis (`src/parsing/escape_analysis.rs`) tracks whether references escape via return, global, or closure capture:

```adesh
let leaked: &i64;
{
    let x: i64 = 42;
    leaked = &x; // E0504: x does not live long enough (escape analysis)
}
```

`unsafe { ... }` blocks (`StmtKind::UnsafeBlock`) may permit raw pointer dereference tracked by `src/parsing/unsafe_pointer_tracking.rs`, but safe borrow violations inside `unsafe` are still diagnosed unless explicitly suppressed.

---

## 8. Diagnostics & Error Catalog

| Code | Cause | Example |
|---|---|---|
| `E0030` | Use of moved value | `let b = a; print(a)` |
| `E0031` | Return ref to local | `fn f() -> &i64 { let x=1; &x }` |
| `E0500` | Shared + exclusive alias | `let r=&x; let m=&mut x;` |
| `E0501` | Exclusive + shared alias | `let m=&mut x; let r=&x;` |
| `E0502` | Assignment while borrowed | `let r=&x; x=1;` |
| `E0503` | Move out of borrowed | `let r=&x; let y=x;` |
| `E0504` | Does not live long enough | `return &local` |
| `E0505` | Double move / double free risk | `drop(x); drop(x)` |
| `W0500` | Unnecessary `&mut` (never mutated) | Suggest `&` instead |

Errors include spans from `Span { line, col, line_text }` (`src/parsing/ast.rs:Span`) and suggestions.

---

## 9. Extended Examples

### 9.1 Classic NLL Example

```adesh
fn nll_demo() {
    let mut buf: [i64] = [1,2,3];
    let first = &buf[0];
    print(*first);       // last use of first
    buf.push(4);         // OK: first's lifetime ended
    let second = &buf[0];
    let third = &buf[1]; // OK: multiple shared borrows
    print(*second + *third);
    // buf is dropped here, after all borrows end
}
```

### 9.2 Mutable Iterator Pattern

```adesh
fn update_all(data: &mut [i64]) {
    for item in data {
        // item: &mut i64 — exclusive borrow per element, no alias
        *item *= 2;
    }
}
let mut arr: [i64] = [1,2,3];
update_all(&mut arr);
```

### 9.3 Borrow Splitting

```adesh
struct Pair { a: i64, b: i64 }
let mut p = Pair { a: 1, b: 2 };
let ra = &mut p.a;
let rb = &mut p.b; // OK: disjoint fields borrowed mutably
*ra += 1;
*rb += 2;
// let r_all = &p; // E0501 while ra/rb live — whole-struct borrow conflicts with field borrows
print(p.a + p.b); // after ra/rb lifetimes end
```

### 9.4 Move + Borrow Interaction

```adesh
fn consume_and_borrow() {
    let s: string = "hello";
    let r = &s;
    print(r);          // last use of r
    let t = s;         // move after borrow ends => OK
    print(t);
    // print(s); // E0030: s moved
}
```

---

## 10. Compilation Model & Source References

```
Source --> Parser (ast.rs: StmtKind::{Let, Function, Class, ...}, Span)
       --> HIR Lower (hir_lower.rs) --> HirType with ownership kinds (src/parsing/ownership.rs:OwnershipKind::{Unique,Shared,Strong,Weak})
       --> Unified Safety Pass (unified_safety_pass.rs)
            |-- ownership_enhanced.rs (move tracking, drop flags)
            |-- borrow_check.rs (aliasing XOR mutability)
            |-- borrow_inference.rs (infer & vs &mut)
            |-- lifetime_tracking.rs + cfg_borrow (NLL CFG)
            |-- drop_insertion.rs (insert Drop glues)
            |-- escape_analysis.rs (escape, region checks)
       --> Diagnostics (error.rs: LangError, E0030/E0500 family)
       --> Codegen (backends/*) --> Drop glue emits free calls; borrows are just pointers (no runtime cost)
```

Reference types are erased to raw pointers in codegen; safety is purely compile-time. `Value::Ref` / `BorrowHandle` exist only in the interpreter (`src/parsing/ast.rs:Value::Ref`, `src/types/value_optimized.rs`).

---

## 11. Best Practices

1. Prefer `&T` over `&mut T` until mutation is needed — reduces aliasing conflicts.
2. Keep borrow lifetimes short: extract the value, use it, then mutate.
3. Use field-level borrows (`&p.a`) instead of whole-struct borrows when mutating distinct fields.
4. For shared mutable state across threads/scopes, use `Share<T>` / `Arc` / `Mutex` rather than fighting the borrow checker.
5. Run `adesh check` and `adesh fix --suggest-borrows` to get NLL-aware suggestions.
