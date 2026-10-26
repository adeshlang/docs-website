---
id: arc
title: ARC — Automatic Reference Counting
sidebar_label: ARC
description: A complete guide to Adesh ARC, covering share, strong, weak, lifecycle, cycle breaking, and the example programs under examples/arc.
---

# ARC — Automatic Reference Counting

ARC is Adesh's shared-ownership memory model. It lets one heap value be safely held by multiple owners at the same time, without a garbage collector.

The idea is simple:

- a value created with `share` is stored on the heap
- each strong reference increases the strong count
- each weak reference tracks liveness without owning the object
- when the last strong reference disappears, the value is freed immediately

This gives Adesh deterministic cleanup, which makes it easier to reason about lifetime, scopes, and resource ownership.

> ARC is grounded in the example programs under `examples/arc`. Each file below is a concrete demonstration of the same model in action.

---

## Why ARC exists

Not every object should be owned by one variable only. In real programs, you often need multiple parts of the system to point at the same data:

- configuration objects shared by many subsystems
- cache entries reused by several handlers
- graph-like or tree-like structures with common subnodes
- observer patterns where listeners need to check liveness without forcing the object to stay alive

Without ARC, one object would need either single ownership or a full garbage collector. Adesh chooses a middle ground: shared ownership with reference counting and weak references.

---

## The three ARC concepts

Adesh exposes exactly three relevant ideas:

### 1. `share`

`share` creates a reference-counted heap value. The initial strong count is 1.

```adesh
share data = { name: "Alice", age: 30 };
print(data.strong_count()); // 1
```

This means the object is alive because the variable itself holds a strong reference.

### 2. `strong`

A `strong` binding adds another strong owner.

```adesh
share config = { host: "localhost", port: 8080 };
strong c1 = config;
strong c2 = config;
```

The allocation remains live as long as at least one strong reference exists.

### 3. `weak`

A `weak` binding does not own the object. It observes it without preventing cleanup.

```adesh
share subject = { topic: "news" };
weak observer = subject;
```

A weak reference is useful for caches, delegated listeners, parent/child back-pointers, or anything that must check whether an object is still alive without extending its lifetime.

---

## The lifecycle model

ARC is deterministic. The runtime tracks reference counts, and the heap object is freed when the last strong reference drops.

```text
share value = { ... }
  => strong_count = 1

strong a = value
  => strong_count = 2

weak w = value
  => strong_count unchanged
  => weak_count = 1

// later, when all strong refs disappear
strong_count = 0
  => object is freed
```

The important rule is:

- strong refs keep the object alive
- weak refs do not keep it alive
- object destruction happens immediately once `strong_count` reaches zero

---

## Built-in introspection methods

Every ARC handle can inspect its current state using a few runtime methods.

### `.strong_count()`

Returns the number of strong references currently held.

```adesh
share user = { id: 1 };
strong a = user;
strong b = user;
print(user.strong_count()); // 3
```

### `.weak_count()`

Returns how many weak references are currently attached.

```adesh
share user = { id: 1 };
weak w = user;
print(user.weak_count()); // 1
```

### `.is_alive()`

Returns true if the value still has at least one strong reference.

```adesh
weak w = user;
if (w.is_alive()) {
    print("still alive");
}
```

### `.upgrade()`

Only meaningful on a weak reference. It tries to temporarily create a strong reference and returns the value if the object is still alive; otherwise it returns `null`.

```adesh
let maybe = watcher.upgrade();
if (maybe != null) {
    print(maybe.name);
}
```

This is how Adesh safely navigates from a non-owning observer back to a live object.

---

## Scope semantics

The reference count is tied to scope lifetime. This is the key reason ARC feels natural and predictable.

```adesh
share data = { value: 42 };
{
    strong temp = data;
    print(data.strong_count()); // 2
}
print(data.strong_count()); // 1
```

When `temp` leaves scope, its strong reference is dropped and the count decreases. If the last strong reference vanishes, the object is destroyed.

This makes ARC especially useful in nested block logic, function-local values, and nested object graphs.

---

## Passing values through functions

Functions may receive a shared object and temporarily hold a strong reference while the call is active.

```adesh
fn print_state(obj) {
    print(obj.strong_count());
}

share sensor = { value: 42 };
print_state(sensor);
```

The exact lifetime during the call is managed automatically; the count returns to its previous value when the function exits.

This pattern appears in the repo's function-based ARC examples and is a practical reminder that ARC is not just for variables in one scope — it also works naturally in callable APIs.

---

## Why weak references matter

The strongest reason to use `weak` is to break cycles.

If two objects each hold strong references to each other, neither can reach zero and the memory leaks.

```text
Parent --strong--> Child
  ^                |
  |                |
  +----strong-----+
```

The fix is to make one side weak:

```text
Parent --strong--> Child
  ^
  +-----weak------+
```

Now when the external owners disappear, the cycle no longer keeps the object alive.

This exact pattern is used throughout the ARC examples for parent/child structures and observer systems.

---

## Example-by-example guide from the repo

The examples in `examples/arc` are the authoritative source for understanding the model. Here is a full walkthrough of each one.

### 01_basic_share.adesh

This is the most basic introduction to ARC.

What it demonstrates:

- `share` creates a heap-backed object
- the initial strong count is 1
- additional `strong` bindings raise the count
- scopes reduce the count automatically
- the object is still available through each strong handle

Key concept:

```adesh
share data = { name: "Alice", age: 30 };
strong ref1 = data;
strong ref2 = data;
```

This shows the core idea: one object can have multiple live owners without copying the underlying value.

### 02_strong_references.adesh

This file focuses on strong reference semantics in depth.

What it demonstrates:

- nested scopes increase the count temporarily
- strong refs inside local scopes are released automatically
- function calls can hold strongly referenced values during execution
- reassignment drops the old strong reference and transfers ownership to the new target

The critical idea is that strong references are not just names; they are ownership edges. Every assignment to a strong variable changes the ownership graph.

### 03_weak_references.adesh

This file explains the difference between ownership and observation.

What it demonstrates:

- a `weak` ref does not change `strong_count`
- `weak_count` increases instead
- `.is_alive()` tells whether the object still exists
- `.upgrade()` can temporarily promote a weak ref to a strong one

This is the foundation for event systems, observability, and back-references that must not keep a value alive.

### 04_scope_cleanup.adesh

This file demonstrates the most important guarantee of ARC: cleanup is deterministic at scope exit.

What it demonstrates:

- multiple nested scopes can each hold a strong reference
- counts drop when the scope closes
- object destruction happens at the precise moment the last strong ref is released

This is the runtime behavior that makes ARC feel like a manually managed but safe ownership system.

### 05_upgrade_and_failure.adesh

This file makes the semantics of `upgrade()` explicit.

What it demonstrates:

- `upgrade()` succeeds while the object is still alive
- it fails with `null` when the last strong owner is gone
- weak references are safe to check without forcing the object to live

This is the core pattern for checking whether a cached observer or dependency is still valid before using it.

### 06_reference_counts.adesh

This file focuses on introspection rather than mutation.

What it demonstrates:

- the runtime can read strong and weak counts
- the counts reflect all active owners and observers
- values can be tracked during debugging or assertions

This is the best file for understanding how ARC is being tracked internally and for validating lifecycle invariants in code.

### 07_arc_in_functions.adesh

This file shows that function calls are part of the ARC lifecycle.

What it demonstrates:

- function parameters may temporarily take a strong hold on a shared value
- `weak` refs can be passed into helper functions safely
- values can be returned from function calls while preserving ARC semantics

This is important because real programs often pass shared objects through many layers of logic; ARC must remain predictable across call boundaries.

### 08_breaking_cycles.adesh

This is the most practical cycle-breaking example in the collection.

What it demonstrates:

- parent → child strongly-owned relationships
- child → parent weak back-reference
- observer lists that remain valid only while the subject is alive
- doubly-linked-list-like structures that avoid a strong cycle by using `weak`

This file explains the central reason for `weak`: to keep object graphs acyclic when ownership is logical rather than purely hierarchical.

### 09_arc_with_classes.adesh

This file bridges the memory model with object-oriented programming in Adesh.

What it demonstrates:

- class instances can be shared with `share`
- multiple readers can hold strong references to the same instance
- weak refs can observe a class instance without keeping it alive
- an event-bus pattern can be built where subscribers use weak references and upgrade only when needed

This is the most direct evidence that ARC is not an isolated feature: it integrates naturally with Adesh's user-defined object model.

### 10_edge_cases.adesh

This file is where the language's edge-case behavior is tested.

What it demonstrates:

- sharing primitive wrapper objects
- diamond / fan-in ownership patterns
- empty object sharing
- repeated upgrade calls on one weak reference
- deeply nested scope lifetimes
- liveness checks after ownership drops

This file matters because real-world memory models are not only about happy paths. ARC must behave correctly under unusual ownership patterns and nested lifetime boundaries.

---

## Common ARC patterns in practice

### Shared configuration

```adesh
share config = { host: "localhost", port: 8080 };
strong api = config;
strong worker = config;
```

All consumers see the same configuration object, and cleanup is automatic when the final strong owner is gone.

### Observer pattern

```adesh
share subject = { topic: "events" };
weak listener = subject;

let live = listener.upgrade();
if (live != null) {
    print(live.topic);
}
```

The listener stays non-owning and safe; it is notified only if the subject still exists.

### Graph-like data

```adesh
share parent = { name: "parent" };
share child = { name: "child" };
strong parentOwnsChild = child;
weak childSeesParent = parent;
```

The child can observe the parent without creating a cycle.

---

## ARC and safety

ARC is one of Adesh's core safety features. It does not use a tracing collector, and it does not require manual `free()`. Instead, it lets the runtime enforce a clear ownership model.

This yields a few major benefits:

- no leaks from simple shared ownership patterns
- no need for manual cleanup in common cases
- deterministic object destruction
- better support for observer and graph-like designs
- direct support for reference-aware APIs without garbage collection

At the same time, ARC users still need to be aware of weak refs when modeling cycles. If a structure is intentionally cyclic, one side must be weak to preserve lifetime correctness.

---

## Summary

ARC in Adesh is best understood as a balance between ownership and convenience:

- `share` creates a heap-managed value
- `strong` adds a live owner
- `weak` observes without owning
- counts are tracked automatically
- the value is freed when the last strong ref disappears

The full mental model is visible in the repo's example suite:

- `01_basic_share.adesh` — introduction
- `02_strong_references.adesh` — strong ownership semantics
- `03_weak_references.adesh` — observation without ownership
- `04_scope_cleanup.adesh` — deterministic deallocation
- `05_upgrade_and_failure.adesh` — weak liveness checks
- `06_reference_counts.adesh` — introspection
- `07_arc_in_functions.adesh` — call-boundary semantics
- `08_breaking_cycles.adesh` — reference-cycle prevention
- `09_arc_with_classes.adesh` — object-oriented ownership
- `10_edge_cases.adesh` — unusual but important lifetimes

If you understand these examples, you understand ARC in Adesh.
