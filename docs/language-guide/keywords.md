---
id: keywords
title: Keywords
sidebar_label: Keywords
description: Reference for the 84 documented language keywords in Adesh (including proceed, extend on).
---

# Keywords

Adesh documents **84 language keywords** here. Every identifier that matches one of these spellings is tokenized as the corresponding keyword token rather than as an ordinary identifier, so none of them may be used as a variable, function, type, or parameter name.

Each keyword below links to a reference with an explanation, syntax/example, and use cases.

:::note Case sensitivity
Keyword matching is case sensitive. `int` and `Int` are two distinct reserved spellings (both map to the same integer-type token), and `Int` is reserved separately from the lowercase `int`. See [int](./keywords/int) and [Int](./keywords/int-type).
:::

## Reserved keywords by category

| # | Keyword | Category | Summary | Page |
|---|---------|----------|---------|------|
| 1 | `type` | Type System & Declarations | Declares a type alias or custom type. | [type](./keywords/type) |
| 2 | `abstract` | Type System & Declarations | Marks a type/member as abstract (no direct instantiation). | [abstract](./keywords/abstract) |
| 3 | `sealed` | Type System & Declarations | Restricts subtyping to a closed set. | [sealed](./keywords/sealed) |
| 4 | `interface` | Type System & Declarations | Declares an interface (contract). | [interface](./keywords/interface) |
| 5 | `implements` | Type System & Declarations | Declares that a type implements an interface. | [implements](./keywords/implements) |
| 6 | `struct` | Type System & Declarations | Declares a structure type. | [struct](./keywords/struct) |
| 7 | `enum` | Type System & Declarations | Declares an enumeration. | [enum](./keywords/enum) |
| 8 | `let` | Type System & Declarations | Binds a variable (immutable by default). | [let](./keywords/let) |
| 9 | `const` | Type System & Declarations | Declares a compile-time constant. | [const](./keywords/const) |
| 10 | `fn` | Type System & Declarations | Declares a function. | [fn](./keywords/fn) |
| 11 | `return` | Control Flow | Returns a value from a function. | [return](./keywords/return) |
| 12 | `if` | Control Flow | Conditional branch. | [if](./keywords/if) |
| 13 | `else` | Control Flow | Alternative branch of `if`. | [else](./keywords/else) |
| 14 | `elif` | Control Flow | Else-if chain branch. | [elif](./keywords/elif) |
| 15 | `do` | Control Flow | `do...while` loop body introducer. | [do](./keywords/do) |
| 16 | `while` | Control Flow | Conditional loop. | [while](./keywords/while) |
| 17 | `break` | Control Flow | Exits the nearest loop. | [break](./keywords/break) |
| 18 | `continue` | Control Flow | Skips to the next loop iteration. | [continue](./keywords/continue) |
| 19 | `jump` | Control Flow | Unconditional/local jump (context-specific). | [jump](./keywords/jump) |
| 20 | `extend` | Object-Oriented Programming | Retroactive extension — `extend on Type` / `extend Name on Type` (no VTable, monomorphic). | [extend](./keywords/extend) |
| 21 | `extends` | Object-Oriented Programming | Single-inheritance class header — `class Dog extends Animal`. | [extends](./keywords/extends) |
| 22 | `extern` | FFI & Linkage | Declares external/FFI linkage. | [extern](./keywords/extern) |
| 23 | `private` | Object-Oriented Programming | Most restrictive visibility modifier. | [private](./keywords/private) |
| 24 | `protected` | Object-Oriented Programming | Inheritance-aware visibility modifier. | [protected](./keywords/protected) |
| 25 | `public` | Object-Oriented Programming | Fully visible access modifier. | [public](./keywords/public) |
| 26 | `super` | Object-Oriented Programming | References the parent type/member. | [super](./keywords/super) |
| 27 | `on` | Object-Oriented Programming | Mandatory target marker in `extend … on Type`. | [on](./keywords/on) |
| 28 | `for` | Control Flow | Iterator loop. | [for](./keywords/for) |
| 29 | `in` | Control Flow | Iteration membership clause. | [in](./keywords/in) |
| 30 | `of` | Control Flow | Value-iteration clause. | [of](./keywords/of) |
| 31 | `true` | Boolean & Null Literals | Boolean true literal. | [true](./keywords/true) |
| 32 | `false` | Boolean & Null Literals | Boolean false literal. | [false](./keywords/false) |
| 33 | `null` | Boolean & Null Literals | Null reference literal. | [null](./keywords/null) |
| 34 | `and` | Logical & Type Operators | Logical AND operator. | [and](./keywords/and) |
| 35 | `or` | Logical & Type Operators | Logical OR operator. | [or](./keywords/or) |
| 36 | `not` | Logical & Type Operators | Logical NOT operator. | [not](./keywords/not) |
| 37 | `instanceof` | Logical & Type Operators | Runtime type test. | [instanceof](./keywords/instanceof) |
| 38 | `typeof` | Logical & Type Operators | Compile-time type query. | [typeof](./keywords/typeof) |
| 39 | `class` | Object-Oriented Programming | Declares a class. | [class](./keywords/class) |
| 40 | `new` | Object-Oriented Programming | Allocates/constructs an instance. | [new](./keywords/new) |
| 41 | `this` | Object-Oriented Programming | Reference to the current instance. | [this](./keywords/this) |
| 42 | `self` | Object-Oriented Programming | Reference to the current type/self receiver. | [self](./keywords/self) |
| 43 | `uint` | Primitive Type Keywords | Unsigned integer type keyword. | [uint](./keywords/uint) |
| 44 | `int` | Primitive Type Keywords | Signed integer type keyword. | [int](./keywords/int) |
| 45 | `Int` | Primitive Type Keywords | Case-sensitive alias mapping to the integer type token. | [Int](./keywords/int-type) |
| 46 | `static` | Object-Oriented Programming | Member is associated with the type, not an instance. | [static](./keywords/static) |
| 47 | `constructor` | Object-Oriented Programming | Lexed but rejected by the parser; use the class name instead. | [constructor](./keywords/constructor) |
| 48 | `get` | Object-Oriented Programming | Property getter accessor. | [get](./keywords/get) |
| 49 | `set` | Object-Oriented Programming | Property setter accessor. | [set](./keywords/set) |
| 50 | `operator` | Object-Oriented Programming | Declares an overloaded operator. | [operator](./keywords/operator) |
| 51 | `import` | Modules & Imports | Imports a module or symbol. | [import](./keywords/import) |
| 52 | `as` | Modules & Imports | Renames an imported/converted symbol. | [as](./keywords/as) |
| 53 | `export` | Modules & Imports | Exports a symbol from a module. | [export](./keywords/export) |
| 54 | `from` | Modules & Imports | Names the source module in an import. | [from](./keywords/from) |
| 55 | `default` | Modules & Imports | Default export/import. | [default](./keywords/default) |
| 56 | `try` | Error Handling | Begins a protected block. | [try](./keywords/try) |
| 57 | `catch` | Error Handling | Catches a thrown error. | [catch](./keywords/catch) |
| 58 | `throw` | Error Handling | Raises an error. | [throw](./keywords/throw) |
| 59 | `async` | Async & Concurrency | Marks a function/value as asynchronous. | [async](./keywords/async) |
| 60 | `await` | Async & Concurrency | Awaits an async value. | [await](./keywords/await) |
| 61 | `spawn` | Async & Concurrency | Spawns a concurrent task. | [spawn](./keywords/spawn) |
| 62 | `match` | Control Flow | Pattern-matching expression. | [match](./keywords/match) |
| 63 | `decorator` | Metaprogramming & Compile-time | Declares/attaches a decorator. | [decorator](./keywords/decorator) |
| 64 | `readonly` | Object-Oriented Programming | Marks a field as read-only. | [readonly](./keywords/readonly) |
| 65 | `raw` | Metaprogramming & Compile-time | Raw string/verbatim marker. | [raw](./keywords/raw) |
| 66 | `vec` | Primitive Type Keywords | Vector type keyword. | [vec](./keywords/vec) |
| 67 | `region` | Memory & Safety | Declares a memory region. | [region](./keywords/region) |
| 68 | `defer` | Memory & Safety | Schedules scope-exit cleanup. | [defer](./keywords/defer) |
| 69 | `unsafe` | Memory & Safety | Marks an unchecked/unsafe block. | [unsafe](./keywords/unsafe) |
| 70 | `share` | Memory & Safety | Shares a reference. | [share](./keywords/share) |
| 71 | `strong` | Memory & Safety | Strong reference qualifier. | [strong](./keywords/strong) |
| 72 | `weak` | Memory & Safety | Weak reference qualifier. | [weak](./keywords/weak) |
| 73 | `alloc` | Memory & Safety | Allocates memory. | [alloc](./keywords/alloc) |
| 74 | `free` | Memory & Safety | Frees memory. | [free](./keywords/free) |
| 75 | `compile` | Metaprogramming & Compile-time | Compile-time evaluation block. | [compile](./keywords/compile) |
| 76 | `runtime` | Metaprogramming & Compile-time | Runtime-evaluation block/marker. | [runtime](./keywords/runtime) |
| 77 | `typecheck` | Metaprogramming & Compile-time | Compile-time type assertion. | [typecheck](./keywords/typecheck) |
| 78 | `emit` | Metaprogramming & Compile-time | Emits code/directive. | [emit](./keywords/emit) |
| 79 | `require` | Metaprogramming & Compile-time | Compile-time precondition. | [require](./keywords/require) |
| 80 | `test` | Testing | Declares a test. | [test](./keywords/test) |
| 81 | `ignore` | Testing | Marks a test to be ignored. | [ignore](./keywords/ignore) |
| 82 | `expect_fail` | Testing | Marks a test expected to fail. | [expect_fail](./keywords/expect-fail) |
| 83 | `proceed` | Metaprogramming & Compile-time | Decorator continuation — `call.proceed()` inside `runtime` phase. | [proceed](./keywords/proceed) |
| 84 | `_` | Wildcard / Placeholder | Wildcard/placeholder token (not an identifier). | [_ (underscore)](./keywords/underscore) |

---

## Special directive: `$cImport`

In addition to the 84 documented keywords above, the lexer recognizes a single special directive, `$cImport`, which is tokenized as the `CImport` token and used for FFI/C interop. It is **not** counted among the 84 identifier keywords because it begins with `$` and is not part of the identifier-keyword mapping table. See [FFI](../tools/ffi) for usage.

```adesh
$cImport "stdio.h";
```

---

## Notes on parser support

Several reserved tokens have narrow or context-specific parser support in the current implementation. Where that is the case, the dedicated page says so explicitly:

- **`constructor`** is lexed as a keyword but the parser explicitly rejects it. The supported constructor form is a method named after the class. See [constructor](./keywords/constructor).
- **`_`** is a wildcard/placeholder token, not an ordinary identifier, and cannot be used as a binding name in the usual way. See [_ (underscore)](./keywords/underscore).
- **`Int`** is case-sensitive and distinct from `int`; both map to the same integer-type token. See [Int](./keywords/int-type).
- A number of memory-safety and metaprogramming keywords (`region`, `share`, `strong`, `weak`, `alloc`, `free`, `compile`, `runtime`, `typecheck`, `emit`, `require`, `jump`) are reserved for current or experimental features and may have limited parser support.
- **`extend` without `on`** — writing `extend Type { … }` is a compile error; always use `extend on Type` or `extend Name on Type`. See [extend](./keywords/extend) and [on](./keywords/on).
- **`proceed`** is only meaningful as `call.proceed()` inside a decorator `runtime(call)` phase. See [proceed](./keywords/proceed).
