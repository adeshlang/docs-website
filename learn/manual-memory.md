---
id: manual-memory
title: Manual Memory - alloc, free, and the unsafe escape hatch
sidebar_label: 17. Manual Memory & unsafe
---

# Manual Memory — `alloc`, `free`, and the `unsafe` escape hatch

AdeshLang is **memory-safe by default**: ownership, borrowing, and automatic
cleanup cover almost everything. But for systems programming (embedded
devices, buffers, low-level protocols) you sometimes need **manual memory
management** — and AdeshLang gives you an explicit, block-scoped `alloc` /
`free` pair, exactly like the real files in
[`examples/unsafe/`](https://github.com/adeshlang/adeshlang/tree/main/examples/unsafe)
and
[`examples/memory_allocator/`](https://github.com/adeshlang/adeshlang/tree/main/examples/memory_allocator).

## `alloc<T>` and `free`

```adesh
let p = alloc<i32>();      // allocate one i32 on the heap
*p = 42;                   // write through the pointer
print(*p);                 // read through the pointer
free(p);                   // give the memory back
```

**Output:**
```
42
```

- `alloc<T>()` asks the heap for space to hold a `T`
- `*p` **dereferences** — reads (`*p`) or writes (`*p = 42`) the pointee
- `free(p)` returns the memory to the allocator

This is the exact pattern from
[`examples/memory/borrow_ok.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/memory/borrow_ok.adesh).

## Allocating buffers

For byte buffers (network packets, file chunks), allocate an array of `u8`:

```adesh
let buf = alloc<u8>(100);         // 100 bytes
print("Buffer allocated, size:", buf);   // pointer / size info

free(buf);
print("Buffer freed");
```

**Output (pointer address varies):**
```
Buffer allocated, size: 0x7f8a1c003020
Buffer freed
```

## The `unsafe` block

Manual allocation is wrapped in an explicit `unsafe { }` block so readers —
and the compiler — know exactly where the rules change. This is verbatim
[`examples/unsafe/manual_allocation.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/unsafe/manual_allocation.adesh):

```adesh
unsafe {
  let ptrs = alloc<u8>(100);
  print("Unsafe allocation: requested 100 bytes");
  print(ptrs);

  free ptrs;
  print(ptrs);
  print("Unsafe deallocation: freed memory");
}

print("Unsafe operations completed");
```

**Output (pointer values vary):**
```
Unsafe allocation: requested 100 bytes
0x7f8a1c003020
0x0
Unsafe deallocation: freed memory
Unsafe operations completed
```

Note the two spellings: `free(p)` and `free p` are both accepted; after
`free`, the pointer is left null so you can detect double-free mistakes.

## Why `free` after `free` is a bug

```adesh
unsafe {
  let p = alloc<i32>(8);
  free p;
  print(p);      // prints 0

  // free p;     // ❌ double free — the compiler/runtime catches this
}
```

**Output:**
```
0
```

## Memory allocators

[`examples/memory_allocator/`](https://github.com/adeshlang/adeshlang/tree/main/examples/memory_allocator)
shows the allocator itself offers different **growth strategies**:

| Strategy | File | Idea |
|----------|------|------|
| Static mode | `static_mode.adesh` | fixed-size heap, no growth |
| Dynamic growth | `dynamic_growth.adesh` | heap grows on demand |
| Hybrid | `hybrid_strategy.adesh` | combines both |
| Stress test | `stress_test.adesh` | allocation/deallocation churn |

Dynamic growth in action
([`dynamic_growth.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/memory_allocator/dynamic_growth.adesh)):

```adesh
let arrays = [];
for (i in 0..10) {
    let arr = [];
    for (j in 0..100) {
        arr.append(j * i);
    }
    arrays.append(arr);
}
print("Allocated 10 arrays with 100 elements each");

let more = [];
for (i in 0..100) {
    more.append("string_" + str(i));
}
print("Additional 100 string allocations successful");
print("Total outer allocations:", len(arrays) + len(more) + 1);
```

**Output:**
```
Allocated 10 arrays with 100 elements each
Additional 100 string allocations successful
Total outer allocations: 111
```

(The doubling strategy keeps allocation O(1) amortized as the heap grows.)

## When do you need manual memory?

| You are… | You need |
|----------|----------|
| Writing an embedded driver | fixed buffers via `alloc<u8>(n)` |
| Parsing raw network bytes | packet buffers, then `free` |
| Interfacing with C (FFI) | letting C own pointers you passed |
| Doing normal app logic | **nothing — automatic cleanup handles it** |

The default is: **let AdeshLang manage memory for you**. Reach for
`alloc`/`free` only when you genuinely need byte-level control.

## Practice

Write `buffers.adesh`:

```adesh
unsafe {
    let bytes = alloc<u8>(16);
    bytes[0] = 72;      // 'H'
    bytes[1] = 105;     // 'i'
    print("byte[0]:", bytes[0]);
    print("byte[1]:", bytes[1]);
    free bytes;
}
print("Buffer test done");
```

**Output:**
```
byte[0]: 72
byte[1]: 105
Buffer test done
```

## Summary

✅ **You learned:**
- `alloc<T>()` / `free` for manual heap memory
- `*p` dereferences; `*p = v` writes through a pointer
- `unsafe { }` scopes manual memory explicitly
- Double-free is a bug; pointers go null after `free`
- Memory allocators offer static/dynamic/hybrid strategies
- Manual memory is for systems code — default is automatic

## Next Step

Now let's make types **generic** and meet the built-in **data structures**
(HashMap, VecDeque, stacks, queues, heaps). Continue to
**[Generics & Data Structures](/learn/generics-data-structures)** →
