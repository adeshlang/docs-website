---
id: memory-safety
title: Memory Safety Without Garbage Collection
sidebar_label: Memory Safety
---

# Memory Safety Without Garbage Collection

Adesh ensures memory safety at compile time without requiring a garbage collector, using an ownership-based system inspired by Rust.

## Core Concepts

### 1. Ownership

Every value has exactly one owner at compile time. When the owner goes out of scope, the value is automatically dropped.

```adesh
{
    let s = create_string("Hello");  // s owns the string
    // ... use s ...
}  // s goes out of scope, string is automatically freed
```

**Key Rules:**
- Each value has one owner
- When owner goes out of scope → value is dropped
- No manual `free()` or `delete` needed

### 2. Move Semantics

Assignment transfers ownership (move), not copy:

```adesh
let a = Obj();      // a owns the object
let b = a;          // Ownership moved to b
// print(a);        // ❌ Compile error: use after move
print(b);           // ✅ OK: b now owns the object
```

**Why?** Prevents double-free and use-after-free bugs at compile time.

### 3. Borrowing

References allow temporary access without transferring ownership:

```adesh
let data = Data::new();

// Immutable borrow (shared, read-only)
fn read(x) { 
    print(x.value);  // Can read but not modify
}

// Mutable borrow (exclusive, write access)
fn update(x) { 
    x.value = 42;    // Can modify
}

read(data);     // ✅ Multiple immutable borrows allowed
read(data);     // ✅ Still allowed

update(data);   // ✅ Exclusive mutable borrow
// read(data);  // ❌ Error: can't borrow while mutably borrowed
```

**Borrowing Rules:**
- ✅ Multiple immutable borrows allowed simultaneously
- ✅ Only one mutable borrow at a time
- ❌ Can't have immutable and mutable borrows together

### 4. Lifetimes

The compiler tracks how long references are valid:

```adesh
fn get_first(arr: [i64]): i64 {
    return arr[0];  // Compiler ensures arr lives long enough
}

let numbers = [1, 2, 3];
let first = get_first(numbers);  // ✅ Safe
```

## Practical Examples

### Ownership in Practice

```adesh
// Function takes ownership
fn process(data: Data) {
    // ... process data ...
}  // data dropped here

let my_data = Data::new();
process(my_data);        // Ownership transferred
// my_data no longer accessible
```

### Borrowing Patterns

```adesh
// Read-only function (immutable borrow)
fn calculate_sum(nums: [i64]): i64 {
    let sum = 0;
    for n in nums {
        sum = sum + n;
    }
    return sum;
}

// Modify function (mutable borrow)
fn increment_all(nums: [i64]) {
    for i in 0..nums.length() {
        nums[i] = nums[i] + 1;
    }
}

let numbers = [1, 2, 3, 4, 5];

// Multiple reads allowed
let sum1 = calculate_sum(numbers);
let sum2 = calculate_sum(numbers);  // ✅ OK

// But only one write at a time
increment_all(numbers);  // ✅ OK
// calculate_sum(numbers);  // ❌ Would be error if called during mutation
```

### Return Values and Ownership

```adesh
// Function returns owned value
fn create_data(): Data {
    let d = Data::new();
    return d;  // Ownership transferred to caller
}

let data = create_data();  // Caller now owns data
```

## Advanced Features

### Reference Counting (Arc/Rc)

For shared ownership scenarios:

```adesh
use std::sync::Arc;

// Thread-safe reference counting
let shared = Arc::new(Data::new());

let ref1 = Arc::clone(shared);  // Increment ref count
let ref2 = Arc::clone(shared);  // Increment ref count

// All refs share ownership
// Data dropped when last ref goes out of scope
```

### Weak References

Break reference cycles with weak pointers:

```adesh
let strong = Arc::new(Node::new());
let weak = Arc::downgrade(strong);  // Weak reference

// Try to upgrade weak reference
match weak.upgrade() {
    Some(node) => process(node),  // Strong ref still exists
    None => print("Data was dropped")  // Strong ref dropped
}
```

### Raw Pointers (Unsafe)

For low-level control (use with caution):

```adesh
unsafe {
    let ptr: *i64 = alloc(8);  // Allocate memory
    *ptr = 42;                  // Write to memory
    let value = *ptr;           // Read from memory
    free(ptr);                  // Manually free
}
```

**⚠️ Warning:** Raw pointers bypass safety checks. Only use in `unsafe` blocks when necessary.

### Region-Based Allocation

Arena allocation for batch deallocation:

```adesh
region {
    let temp1 = allocate_in_region();
    let temp2 = allocate_in_region();
    let temp3 = allocate_in_region();
    
    // All allocations live within region
    
}  // All freed at once when region ends
```

**Benefits:**
- ✅ Fast bulk deallocation
- ✅ No individual tracking overhead
- ✅ Perfect for request/response cycles

## Memory Safety Guarantees

### Compile-Time Checks

Adesh prevents these errors **at compile time**:

1. **Use After Free**
   ```adesh
   let ptr = get_pointer();
   free(ptr);
   // print(*ptr);  // ❌ Compile error: use after free
   ```

2. **Double Free**
   ```adesh
   let data = Data::new();
   drop(data);
   // drop(data);  // ❌ Compile error: double free
   ```

3. **Data Races**
   ```adesh
   let x = 0;
   
   spawn_thread(|| {
       x = 1;  // ❌ Compile error: data race prevented
   });
   
   x = 2;  // Concurrent mutation not allowed
   ```

4. **Null Pointer Dereference**
   ```adesh
   let maybe: Option<i64> = None;
   // let val = maybe.unwrap();  // ❌ Compile error: must check None case
   
   match maybe {
       Some(val) => print(val),  // ✅ Safe access
       None => print("No value")
   }
   ```

### Runtime Safety

Zero-cost abstractions - all checks happen at compile time:

- ✅ No null pointer exceptions
- ✅ No dangling pointers
- ✅ No buffer overflows
- ✅ No data races
- ✅ No use-after-free
- ✅ No double-free

## Comparison with Other Languages

### vs. Garbage-Collected Languages (Java, Python, Go)

| Aspect | Adesh | GC Languages |
|--------|----------|--------------|
| **Performance** | Zero runtime overhead | GC pauses, overhead |
| **Memory** | Deterministic deallocation | Non-deterministic |
| **Safety** | Compile-time guarantees | Runtime checks |
| **Predictability** | Instant deallocation | GC can pause anytime |

### vs. Manual Memory Management (C, C++)

| Aspect | Adesh | C/C++ |
|--------|----------|-------|
| **Safety** | Guaranteed safe | Manual correctness |
| **Ease** | Automatic | Error-prone |
| **Bugs** | Prevented at compile time | Common security issues |
| **Productivity** | Focus on logic | Debug memory issues |

## Best Practices

### 1. Prefer Borrowing Over Moving

```adesh
// ❌ Unnecessary move
fn process(data: Data) { ... }
process(my_data);  // Can't use my_data after

// ✅ Borrow instead
fn process(data: &Data) { ... }
process(my_data);  // Can still use my_data
```

### 2. Use Arc for Shared State

```adesh
// Multiple owners need Arc
let shared = Arc::new(Data::new());
```

### 3. Leverage Region Allocation

```adesh
// For temporary allocations in a scope
region {
    // Fast bulk allocation
    let temps = create_many_objects();
}  // All freed at once
```

### 4. Avoid Unsafe Unless Necessary

```adesh
// ✅ Safe code preferred
let arr = [1, 2, 3];
let len = arr.length();

// ⚠️ Only use unsafe when required
unsafe {
    let ptr = custom_allocator_alloc();
    // ... use carefully ...
    custom_allocator_free(ptr);
}
```

## Common Pitfalls and Solutions

### Pitfall 1: Trying to Use Moved Value

```adesh
let a = expensive_create();
let b = a;  // Move
// use(a);  // ❌ Error

// Solution: Clone if you need both
let a = expensive_create();
let b = a.clone();  // Deep copy
use(a);  // ✅ OK
use(b);  // ✅ OK
```

### Pitfall 2: Borrow Checker Errors

```adesh
let data = Data::new();
read(data);
update(data);  // ❌ Error: can't mutably borrow while immutably borrowed

// Solution: Scope borrows separately
{
    read(data);
}  // borrow ended
update(data);  // ✅ OK now
```

### Pitfall 3: Circular References

```adesh
// ❌ Memory leak with Arc
struct Node {
    parent: Arc<Node>,  // Strong reference to parent
    children: [Arc<Node>]
}

// Solution: Use Weak for back-references
struct Node {
    parent: Weak<Node>,  // Weak reference to parent
    children: [Arc<Node>]
}
```

## Next Steps

- **[Ownership & Borrowing](/docs/advanced/ownership-borrowing)** - Deep dive into ownership rules
- **[Concurrency](/docs/builtin/concurrency)** - Thread-safe memory sharing
- **[Async/Await](/docs/advanced/async-await)** - Asynchronous memory patterns

Master Adesh's memory system for writing safe, high-performance code! 🚀
