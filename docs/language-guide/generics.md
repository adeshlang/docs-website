---
id: generics
title: "Generics Architecture & Monomorphization Engine"
description: "Formal specification of AdeshLang generic instantiation, compile-time monomorphization, trait bounds, symbol mangling, and dynamic trait objects."
sidebar_label: "Generics & Monomorphization"
---

# Generics Architecture & Monomorphization Engine

This document defines the compile-time monomorphization engine, generic type resolution, trait bound validation, symbol name mangling algorithms, and dynamic trait object dispatch in AdeshLang.

---

## 1. Generics Architecture Overview

AdeshLang supports generic functions, structs, enums, classes, traits, and type aliases. Generics are parametric polymorphism checked at compile time and eliminated via monomorphization.

```adesh
struct Stack<T> {
    items: [T],
}

fn swap<T>(a: &mut T, b: &mut T) {
    let temp = *a;
    *a = *b;
    *b = temp;
}

trait Printable {
    fn format(&self): string;
}
class Box<T> implements Printable {
    value: T,
    fn format(&self): string { return f"{self.value}"; }
}
```

### 1.1 EBNF

```ebnf
TypeParams    ::= "<" TypeParam { "," TypeParam } ">"
TypeParam     ::= IDENT [ ":" TraitBound { "+" TraitBound } ]
TraitBound    ::= IDENT [ "<" Type { "," Type } ">" ]
GenericArgs   ::= "<" Type { "," Type } ">"
Type          ::= IDENT [ GenericArgs ] | "[" Type "]" | "(" TypeList ")" | "fn" "(" Params ")" ":" Type   // `:` is canonical; `->` still parsed (compat) but only `extern "C"` uses `->`
```

All generic declarations are lowered in `src/parsing/ast.rs` via `Function.type_params`, `ClassDecl.type_params`, `StructDecl.type_params`, `TypeAliasDecl.type_params`, and `InterfaceDecl.type_params`.

AdeshLang implements **Compile-Time Monomorphization**. Generic code incurs zero runtime performance penalty; every concrete type instantiation generates dedicated, fully optimized native assembly.

---

## 2. Compile-Time Monomorphization Engine

Monomorphization executes during the semantic and IR generation phases in `src/semantics/hir_lower.rs` and `src/semantics/hir_passes.rs`:

```
[ Generic Template ]           [ Concrete Instantiations ]           [ Native Assembly Code ]
  fn swap<T>(a, b)    ---->     Instantiate swap<i64>       ---->     fn swap_i64(a, b)
                                Instantiate swap<f64>       ---->     fn swap_f64(a, b)
                                Instantiate swap<string>    ---->     fn swap_string(a, b)
```

### 2.1 Monomorphization Processing Pipeline

1. **Instantiation Discovery**: The compiler scans the HIR for all calls to generic functions or uses of generic data structures, recording concrete type arguments (`T = i64`, `T = string`). This is performed by the interprocedural analysis in `src/parsing/interprocedural.rs` and `src/semantics/engine.rs`.
2. **AST Template Clone**: For each unique concrete type tuple, a specialized duplicate of the function or struct AST is generated. The clone reuses `Arc<Vec<Stmt>>` for bodies to avoid deep copies until substitution.
3. **Type Substitution**: Type parameters (`T`, `U`) are substituted with target concrete types via the type substitution map in `src/typesystem` and `src/parsing/variance.rs`. Nested generics such as `Stack<Result<T, E>>` are substituted recursively.
4. **Symbol Name Mangling**: The compiler assigns a unique mangled symbol name for the linker.
5. **IR Emission & Optimization**: Each monomorphized instance is emitted to LIR and optimized independently (inlining, DCE, constant propagation).

### 2.2 Symbol Mangling `_Adesh_M_*`

```text
Mangled Symbol Name = _Adesh_M_ + ModuleName + _ + FunctionName + _ + TypeHashes
```

| Generic Source | Concrete Instantiation | Mangled Symbol |
|---|---|---|
| `swap<T>` | `swap<i64>` | `_Adesh_M_main_swap_i64` |
| `swap<T>` | `swap<f64>` | `_Adesh_M_main_swap_f64` |
| `Stack<T>::push` | `Stack<string>::push` | `_Adesh_M_main_Stack_push_string` |
| `max<T: Comparable<T>>` | `max<i32>` | `_Adesh_M_main_max_i32` |

Mangling is deterministic and collision-resistant: type hashes include module-qualified names, pointer depth, and generic arity. The prefix `_Adesh_M_` (Adesh Monomorphized) distinguishes monomorphized symbols from `extern "C"` and `dyn Trait` vtable symbols during linking. See `src/semantics/hir_lower.rs:Function lowering`.

```adesh
// Source
fn identity<T>(x: T): T { return x; }
let a = identity<i64>(42);
let b = identity<string>("hello");

// Lowered symbols (conceptual)
// _Adesh_M_main_identity_i64  -> fn(i64): i64
// _Adesh_M_main_identity_string -> fn(string): string
```

---

## 3. Generic Structs, Enums, and Classes

### 3.1 Generic Structs

```adesh
struct Pair<A, B> {
    first: A,
    second: B,
}
let p1: Pair<i64, string> = Pair { first: 42, second: "hello" };
let p2: Pair<f64, bool>   = Pair { first: 3.14, second: true };
```

Each instantiation has distinct layout: `Pair<i64,string>` size is `8 + 24` bytes (i64 + string header), while `Pair<f64,bool>` is `8 + 1` (+ padding). No boxing occurs.

### 3.2 Generic Enums

```adesh
enum Option<T> { Some(T), None, }
enum Result<T, E> { Ok(T), Err(E), }
let x: Option<i64> = Option::Some(42);
let y: Result<string, Error> = Result::Err(Error { msg: "fail" });
```

Discriminant optimization (1/2/4 bytes) is applied per instantiation (see `enums-pattern-matching.md`).

### 3.3 Generic Classes with Ownership

```adesh
class Container<T> {
    value: T,
    fn get(&self): &T { return &self.value; }
    fn set(&mut self, v: T) { self.value = v; }
}
let c = new Container<i64>();
c.set(100);
```

Ownership tracking in `src/parsing/ownership.rs` and `src/parsing/borrow_check.rs` is instantiation-aware: moving `Container<string>` moves the inner string allocation.

---

## 4. Trait Bounds & Static Constraints

Generic parameters can enforce interface contracts via trait bounds (`: Trait`):

```adesh
trait Printable {
    fn format(&self): string;
}
trait Comparable<T> {
    fn compare(&self, other: &T): i32;
}
// Enforce T implements both Printable and Comparable
fn process_item<T: Printable + Comparable<T>>(item: &T) {
    print(item.format());
    if (item.compare(item) == 0) { print("equal"); }
}
```

### 4.1 Static Dispatch Verification

Trait bounds are verified during semantic analysis in `src/semantics/engine.rs`. The type checker verifies that the concrete type implements every required trait method. Because bounds are checked at compile time, call sites dispatch method invocations directly without runtime vtable lookups (**Static Dispatch**).

```adesh
class User implements Printable, Comparable<User> {
    name: string,
    fn format(&self): string { return self.name; }
    fn compare(&self, other: &User): i32 { return 0; }
}
process_item<User>(new User()); // OK
// process_item<i64>(42); // E0401: i64 does not implement Printable
```

### 4.2 Where-Clause Style Bounds (Desugared)

Multi-bound constraints are normalized to a flat bound list before HIR lowering:

```text
fn foo<T: Clone + Debug, U: T>(x: T, y: U)  ~~~>  bounds(T)=[Clone,Debug], bounds(U)=[T]
```

Bounds are invariant by default; see §7 for variance.

---

## 5. Method-Level Generics in `extend on`

AdeshLang supports generic methods inside `extend on` blocks, enabling retroactive generic extensions without modifying the original type:

```adesh
struct Vec<T> { data: [T], len: u64, }

// Extend with generic methods
extend on Vec<T> {
    fn map<U>(self: &Vec<T>, f: fn(&T): U): Vec<U> {
        let out: Vec<U> = Vec { data: [], len: 0 };
        for item in self.data { out.data.push(f(&item)); }
        return out;
    }
    fn find<P: fn(&T): bool>(self: &Vec<T>, pred: P): Option<&T> {
        for item in self.data {
            if (pred(&item)) { return Option::Some(&item); }
        }
        return Option::None;
    }
}
let v: Vec<i64> = Vec { data: [1,2,3], len: 3 };
let strs: Vec<string> = v.map<string>((x) => f"{x}");
```

Key rules:

| Rule | Description |
|---|---|
| `extend on Type<Params>` | `Params` introduce type parameters scoped to the block |
| Method generics `fn foo<U>` | Fresh parameters per method, independent of the impl block |
| Shadowing | Method `T` shadows outer `T` if duplicated; compiler warns `W0030` |
| Mangling | `Vec<T>::map<U>` mangles as `_Adesh_M_main_Vec_map_T_U` |

The desugaring in `src/parsing/hir_lower.rs` treats each `extend on` method as a free function with a `self` parameter, then monomorphizes it.

---

## 6. Dynamic Trait Objects (`dyn Trait`)

When heterogeneous collections or runtime dynamic dispatch are explicitly required, AdeshLang supports dynamic trait objects (`dyn Trait`):

```adesh
fn print_dynamic_items(items: [&dyn Printable]) {
    for item in items {
        print(item.format()); // Dynamic vtable dispatch
    }
}
let items: [&dyn Printable] = [&User { name: "A" } as dyn Printable, &Admin { name: "B" } as dyn Printable];
print_dynamic_items(items);
```

### 6.1 Trait Object Fat Pointer Layout (16 Bytes)

A `dyn Trait` reference is stored as a 16-byte fat pointer:

```
dyn Trait Fat Pointer (16 bytes)
+------------------------------------+------------------------------------+
|  Data Pointer (8 Bytes)            |  VTable Pointer (8 Bytes)          |
+------------------------------------+------------------------------------+
  Points to heap/stack concrete value  Points to Trait VTable for target type

VTable Layout (per concrete Trait impl):
+------------------------------------+
|  size: usize (8B)                  |
|  align: usize (8B)                 |
|  drop: fn(*mut void) (8B)          |
|  method[0]: fn(*mut void): ...   |
|  method[1]: fn(*mut void): ...   |
+------------------------------------+
```

Fat pointers are handled in `src/types/value_optimized.rs` and codegen. Unlike monomorphized generics, `dyn Trait` incurs one indirect call per method.

### 6.2 Monomorphized Generics vs `dyn Trait`

| Aspect | `fn foo<T: Printable>(x: T)` | `fn foo(x: &dyn Printable)` |
|---|---|---|
| Dispatch | Static (direct call) | Dynamic (vtable) |
| Code size | N copies | 1 copy |
| Heterogeneous vec | Not allowed (`Vec<T>` homogeneous) | Allowed (`Vec<&dyn Printable>`) |
| Performance | Zero overhead | ~1 indirect branch |
| When to use | Hot loops, tight generics | Plugin systems, heterogeneous collections |

Example mixing both:

```adesh
fn static_print<T: Printable>(x: &T) { print(x.format()); } // monomorphized
fn dynamic_print(x: &dyn Printable) { print(x.format()); }   // vtable

static_print<User>(user);          // inlined potentially
dynamic_print(user as dyn Printable); // vtable lookup
```

---

## 7. Variance & Subtyping

Variance controls how generic type constructors relate under subtyping, implemented in `src/parsing/variance.rs`:

```
                 Variance Diagram
         Invariant<T>      Covariant<out T>      Contravariant<in T>
         T == T only       Child <: Parent        Parent <: Child
         e.g., &mut T      e.g., &T, [T]          e.g., fn(T) param
```

| Type Constructor | Variance | Reason |
|---|---|---|
| `&T`, `&mut T` (mutable) | Invariant over `T` | Mutation would break soundness |
| `*T`, `Share<T>` | Covariant over `T` | Read-only or owned |
| `fn(T): U` | Contravariant in `T`, Covariant in `U` | Function parameter vs return |
| `Vec<T>`, `Stack<T>` | Invariant | Interior mutability |
| `Option<T>`, `Result<T,E>` | Covariant | Immutable payload |

```adesh
class Animal {}
class Dog extends Animal {}
// &Dog <: &Animal  (covariant)  OK
// &mut Dog !<: &mut Animal (invariant)  E0503
// fn(Animal) <: fn(Dog)  (contravariant param)  OK

fn feed(animal: &Animal) {}
let dog: Dog = new Dog();
feed(&dog); // OK: &Dog coerces to &Animal
```

The variance pass (`src/parsing/variance.rs:check_variance`) rejects unsound assignments at compile time with `E05xx` errors.

---

## 8. Code Bloat Mitigation

To mitigate executable binary size expansion from extensive monomorphization, the compiler performs several strategies:

### 8.1 Pointer Instantiation Merging

Generic instantiations over pointer-like types (`&String`, `&ClassInstance`, `*u8`) share a single underlying machine code template operating over `*void` raw pointers, casting data types at instruction boundaries.

```
swap<&String>  ──┐
swap<&User>    ──┼──> single template swap<*void> (raw pointer swap)
swap<*u8>      ──┘
swap<i64>      ────> dedicated template (value semantics differ)
```

### 8.2 Identical Code Folding (ICF)

The linker merges bit-identical monomorphized functions (e.g., `Vec<i32>::len` and `Vec<u32>::len` may codegen identically).

### 8.3 Explicit Bloat Controls

```adesh
// Prefer dyn Trait when N is large and dispatch cost is negligible
fn process_many(items: [&dyn Printable]) {} // 1 copy, not N copies

// Use trait bounds to constrain instantiations
fn only_comparable<T: Comparable<T>>(x: T) {} // fewer valid T's => fewer instantiations
```

Diagnostics: `adesh build --stats` reports `monomorphization_count` and `estimated_bloat_bytes`. Exceeding thresholds emits `W0040: excessive monomorphization`.

---

## 9. Compilation Model & Source References

```
Source .adesh  -->  Lexer (src/parsing/lexer.rs)
                -->  Parser (src/parsing/parser/*)  -- builds StmtKind::Function with type_params
                -->  HIR Lower (src/semantics/hir_lower.rs) -- resolves TypeParams to HirType
                -->  Ownership/Borrow (src/parsing/ownership.rs, borrow_check.rs)
                -->  Monomorphization (hir_passes.rs, interprocedural.rs)
                -->  Mangling (_Adesh_M_*) + LIR emission
                -->  Backend (src/backends/*) -- per-instance optimization
```

HIR representation (`src/parsing/hir.rs`):

```rust
struct HirFunction { name: String, type_params: Vec<String>, params: Vec<HirParam>, ... }
struct HirType::Generic { base: String, args: Vec<HirType> }
```

---

## 10. Common Errors

| Code | Message | Example Fix |
|---|---|---|
| `E0400` | `cannot find type parameter T in scope` | Declare `<T>` on function/struct |
| `E0401` | `type X does not implement trait Y` | Add `implements Y` or change bound |
| `E0402` | `wrong number of generic arguments: expected 2, found 1` | Supply all params: `Pair<i64,string>` |
| `E0403` | `mangled symbol collision` | Rename module or use distinct type hashes (rare) |
| `E0404` | `generic type not allowed in dyn Trait` | Use concrete: `dyn Printable` not `dyn Printable<T>` |
| `W0040` | `excessive monomorphization (N > 64)` | Switch to `dyn Trait` or reduce instantiations |

---

## 11. Extended Examples

### 11.1 Generic Bubble Sort with Trait Bound

```adesh
trait Ordered {
    fn less_than(&self, other: &Self): bool;
}
fn bubble_sort<T: Ordered>(arr: &mut [T]) {
    let n = arr.len();
    for i in range(0, n) {
        for j in range(0, n - i - 1) {
            if (arr[j + 1].less_than(&arr[j])) {
                swap(&mut arr[j], &mut arr[j+1]);
            }
        }
    }
}
class Score implements Ordered {
    value: i64,
    fn less_than(&self, other: &Self): bool { return self.value < other.value; }
}
let scores: [Score] = [Score { value: 3 }, Score { value: 1 }];
bubble_sort<Score>(&mut scores);

type Scores = [Score];
let s: Scores = scores; // alias interplay (§ alias docs)
```

### 11.2 Heterogeneous Registry with `dyn Trait`

```adesh
trait Plugin { fn run(&self): string; }
class Logger implements Plugin { fn run(&self): string { return "log"; } }
class Metrics implements Plugin { fn run(&self): string { return "metrics"; } }

fn run_all(plugins: [&dyn Plugin]): [string] {
    let out: [string] = [];
    for p in plugins { out.push(p.run()); }
    return out;
}
let plugins: [&dyn Plugin] = [&Logger{} as dyn Plugin, &Metrics{} as dyn Plugin];
print(run_all(plugins));
```

### 11.3 Method-Level Generics with Multiple Params

```adesh
extend on Result<T, E> {
    fn map<U>(self: Result<T,E>, f: fn(T): U): Result<U,E> {
        match self {
            Result::Ok(v) => Result::Ok(f(v)),
            Result::Err(e) => Result::Err(e),
        }
    }
    fn flat_map<U>(self: Result<T,E>, f: fn(T): Result<U,E>): Result<U,E> {
        match self { Result::Ok(v) => f(v), Result::Err(e) => Result::Err(e), }
    }
}
let r: Result<i64, string> = Result::Ok(42);
let r2 = r.map<string>((n) => f"{n}");
```

---

## 12. Best Practices

1. Prefer static generics for performance-critical hot paths; use `dyn Trait` for plugin boundaries.
2. Keep trait bounds minimal — each bound restricts valid instantiations and documents contracts.
3. Avoid deep generic nesting (`HashMap<string, Vec<Result<Option<T>, E>>>`) without type aliases.
4. Use `extend on` for retroactive generic utilities rather than polluting core struct definitions.
5. Monitor `adesh build --stats` for monomorphization count; split large generic functions.
