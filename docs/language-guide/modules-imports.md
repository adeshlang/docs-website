---
id: modules-imports
title: "Module System, Symbol Tables & Dependency Graph Specification"
description: "Formal specification of module resolution, namespace symbol tables, import/export semantics, circular dependency detection, and link-time optimization (LTO)."
sidebar_label: "Modules & Import System"
---

# Module System, Symbol Tables & Dependency Graph Specification

This document specifies the module system architecture, file resolution rules, symbol table visibility, circular dependency detection algorithms, and cross-module optimization boundaries in AdeshLang.

---

## 1. Compilation Unit & Module Hierarchy

A module in AdeshLang corresponds to a distinct source file (`.adesh`) or directory package containing a module manifest. Every file creates an isolated, top-level **Lexical Symbol Namespace**.

```
[ Root Module: main.adesh ]
       |
       +---> [ import { net } from "builtin" ]     (Standard Library Module)
       |
       +---> [ import { Worker } from "./worker" ] (Relative File Module)
       |
       +---> [ import * as Utils from "./utils" ]  (Namespace import)
       |
       +---> [ import "./polyfill" ]               (Side-effect only)
```

Each module maps to one `Vec<Stmt>` in the parser (`src/parsing/ast.rs:StmtKind::Import*`). The module loader in `src/semantics/engine.rs` and `src/cli` owns the module graph.

### 1.1 Module Identifiers

| Import Specifier | Resolved As |
|---|---|
| `"./foo"` | Relative file `./foo.adesh` or `./foo/index.adesh` |
| `"../bar"` | Parent directory file |
| `"builtin"` | Standard built-in module map |
| `"stdlib:collections"` | Package-scoped stdlib |
| `"pkg/name"` | `node_modules/.adl` or `$ADESH_PATH` package |

---

## 2. Export & Import Semantics

### 2.1 Explicit Symbol Export

Symbols declared within a module are **private** to that module's compilation unit by default. Symbols become accessible to importing modules when qualified with the `export` keyword:

```adesh
// File: math_utils.adesh
export const PI: f64 = 3.1415926535;

export fn calculate_area(radius: f64): f64 {
    return PI * radius * radius;
}

export type Vec2 = { x: f64, y: f64 };
export class Circle { radius: f64, fn area(&self): f64 { return 3.14 * self.radius * self.radius; } }

fn internal_helper() { } // Private: Not exported
```

Export forms:

```adesh
export let x = 1;
export const Y: i64 = 2;
export fn foo() {}
export class Bar {}
export struct Baz { x: i64 }
export enum Qux { A, B }
export type Alias = { x: i64 }
export { localName as exportedName } from "./other"; // re-export
export * from "./other";                               // bulk re-export
export default fn main() {}                            // default export
```

In AST terms (`src/parsing/ast.rs`):

```rust
StmtKind::Let(_, _, _, export: bool, ...)
StmtKind::Function(Function, export: bool)
StmtKind::Class(ClassDecl, export: bool)
StmtKind::ExportDefaultFunction(Function)
StmtKind::ExportDefaultClass(ClassDecl)
StmtKind::ExportDefault(String)
```

`export: true` marks the symbol slot as visible in the module's export table.

### 2.2 Import Binding Specifications

Import statements bind exported symbols into the caller's symbol table as immutable aliases:

```adesh
// Named import (destructured)
import { calculate_area, PI } from "./math_utils";

// Alias import
import { calculate_area as get_area } from "./math_utils";

// Namespace import
import * as MathUtils from "./math_utils";
print(MathUtils.PI);

// Default import
import main from "./math_utils";
import MyClass from "./models";

// Side-effect import (executes module, binds nothing)
import "./polyfill";

// Re-export (no local binding, forwards export)
export { PI } from "./math_utils";
export * from "./math_utils";
```

AST variants:

```rust
StmtKind::ImportNames { path, names: Vec<String> }  // import { a, b } from "path"
StmtKind::Import { path, alias }                     // import * as alias, import alias
StmtKind::ImportDefault { path, alias }              // import alias from "path" (default)
StmtKind::HeaderImport { path }                      // @cImport("header.h") for FFI
```

Imported bindings are **immutable aliases** to the exported module's symbol table slots — reassigning an import is `E0062`.

### 2.3 EBNF

```ebnf
ImportDecl   ::= "import" ImportClause "from" StringLiteral ";"
ImportClause ::= "*" "as" IDENT
               | "{" ImportItem { "," ImportItem } "}"
               | IDENT
               | StringLiteral          (* side-effect only: import "mod"; *)
ImportItem   ::= IDENT [ "as" IDENT ]

ExportDecl   ::= "export" ( Declaration | "{" ExportItem {"," ExportItem } "}" | "*" | "default" ... )
ExportItem   ::= IDENT [ "as" IDENT ]
ReExport     ::= "export" ( "{" ExportItem "}" | "*" ) "from" StringLiteral
```

---

## 3. Module Resolution & Search Algorithm

When resolving `import ... from "target"`, the compiler executes a 4-tier module path resolution lookup:

```
                          [ Resolving import "path" ]
                                       |
                   +-------------------+-------------------+
                   | Is Relative Path? ("./" or "../")     |
                   v                                       v
         [ Resolves relative to ]                [ Search Module Search Paths ]
         [ Current File Dir     ]                          |
              |                                            +---> 1. Standard Built-in Modules ("builtin", "stdlib")
              |                                            +---> 2. Project ADL Package Dir (".adl", "node_modules")
              |                                            +---> 3. Global ADL Package Path ($ADESH_PATH)
              |                                            +---> 4. FFI headers (@cImport)
              v
    Try: target
         target.adesh
         target/index.adesh
         target/mod.adesh
```

If resolution fails at all tiers, compilation halts with `E0060: Cannot resolve module 'target'`.

### 3.1 File Resolution Precedence

Given `import { x } from "./utils"` in `/project/src/main.adesh`:

1. `/project/src/utils.adesh` (exact file)
2. `/project/src/utils/index.adesh` (directory index)
3. `/project/src/utils/mod.adesh` (alternative index)
4. Builtin lookup if Specifier is bare (`"utils"` without `./`)
5. Package lookup (`$ADESH_PATH/utils.adesh`, `.adl/utils.adesh`)

### 3.2 Caching & Incremental Builds

Resolved modules are cached by canonical absolute path. Re-importing the same file reuses the parsed `Vec<Stmt>` and symbol table, avoiding re-parse. Cache invalidation keys on file mtime and `ADESH_PATH` contents.

---

## 4. Symbol Tables & Visibility

### 4.1 Per-Module Symbol Table

```
Module "math_utils.adesh" Symbol Table (src/semantics/engine.rs)
+---------------------------------------------+
|  Name            | Exported | Kind           |
|------------------|----------|----------------|
|  PI              |  true    | const f64      |
|  calculate_area  |  true    | fn(f64): f64  |
|  internal_helper |  false   | fn()           |
+---------------------------------------------+

Module "main.adesh" Symbol Table (after imports)
+---------------------------------------------+
|  Name            | Source                   |
|------------------|--------------------------|
|  PI              | alias -> math_utils.PI   |
|  get_area        | alias -> math_utils.calculate_area |
|  MathUtils       | namespace -> math_utils.* |
+---------------------------------------------+
```

Shadowing an import with a local `let` is `E0063: import 'x' shadows local declaration` unless the local is in a nested block.

### 4.2 Namespace Imports `import * as NS`

Namespace imports bind a single object-like namespace containing all exports as properties:

```adesh
import * as M from "./math_utils";
print(M.PI);
M.calculate_area(10.0);
```

Lowered as `Value::Object(Arc<HashMap<String, Value>>)` in interpreter mode; in native codegen, as a module struct with field offsets.

---

## 5. Re-Exports & Barrel Files

Barrel files aggregate exports from submodules:

```adesh
// File: lib/index.adesh  (barrel)
export * from "./math_utils";
export * from "./string_utils";
export { PI as MathPI } from "./math_utils";

// Consumer:
import { MathPI, capitalize } from "./lib";
```

Rules:

| Re-export Form | Effect |
|---|---|
| `export * from "./a"` | Re-exports all `export` symbols from `a`; local overrides win on collision (W0060) |
| `export { X } from "./a"` | Re-exports only `X`; verifies `a` exports `X` (E0064) |
| `export { X as Y } from "./a"` | Renamed re-export |
| `export * as NS from "./a"` | Re-exports `a` as namespace `NS` (if supported) |

Re-exports do not execute side effects twice; the underlying module is evaluated once (see §6).

---

## 6. Module Evaluation Order & Side Effects

Modules are evaluated **once** in topological order (dependencies before dependents). A module's top-level statements execute on first import; subsequent imports alias the already-evaluated exports.

```
main.adesh imports A, B
A imports C
B imports C
Evaluation order: C -> A -> B -> main
```

Top-level side effects (file I/O, global registration) should be idempotent:

```adesh
// config.adesh
export let initialized = false;
initialized = true; // runs once
print("config loaded"); // prints once even if imported by 3 modules
```

The interpreter's module cache (`src/runtime` / `src/execution`) holds `Arc<ModuleInstance>` per canonical path.

---

## 7. Circular Dependency Detection Algorithm

During AST analysis, the compiler constructs a directed **Module Dependency Graph** $G = (V, E)$, where vertices $V$ represent modules and directed edges $E = (u, v)$ represent `import` from module $u$ to module $v$.

### 7.1 DFS Topological Cycle Detection

Before code generation, a DFS with Tarjan's Strongly Connected Components performs cycle detection:

```text
Algorithm DFS_Detect_Cycles(module_u):
    State[module_u] = VISITING
    For each dependency_v in Imports(module_u):
        If State[dependency_v] == VISITING:
            TRAP_FATAL_ERROR("E0061: Circular dependency detected: " + CyclePath(dependency_v -> module_u))
        Else If State[dependency_v] == UNVISITED:
            DFS_Detect_Cycles(dependency_v)
    State[module_u] = VISITED
```

Circular dependencies are **strictly rejected** at compile time. The error reports the cycle path:

```text
E0061: Circular dependency detected: main.adesh -> a.adesh -> b.adesh -> a.adesh
```

### 7.2 Workarounds for Cycles

```adesh
// Instead of A <-> B direct cycle, introduce C:
// c.adesh: shared types/interfaces
// a.adesh: import { Shared } from "./c"
// b.adesh: import { Shared } from "./c"
```

Dynamic imports (if supported via `import("./path")` expression) are not part of the static graph and are excluded from cycle detection.

---

## 8. Default Imports/Exports & Interop

### 8.1 Default Export

```adesh
// math.adesh
export default fn run() { print("default"); }
export default class Main {}
export default "literal value";

// main.adesh
import run from "./math";        // default import (no braces)
import Main from "./math";
```

Default exports are sugar for an export named `default` in the export table. Mixing default and named exports is allowed:

```adesh
// lib.adesh
export default fn main() {}
export fn helper() {}
// consumer
import main, { helper } from "./lib"; // if syntax supports; else two statements
```

### 8.2 `from` / `as` Summary

| Syntax | Meaning |
|---|---|
| `import { X } from "mod"` | Named import `X` from `mod` |
| `import { X as Y } from "mod"` | Rename `X` to local `Y` |
| `import * as NS from "mod"` | Namespace import |
| `import D from "mod"` | Default import |
| `export { X } from "mod"` | Re-export `X` from `mod` |
| `export * from "mod"` | Re-export all |
| `export { X as Y } from "mod"` | Renamed re-export |

---

## 9. FFI & Header Imports

```adesh
@cImport("stdio.h")
extern "C" fn printf(fmt: string) -> i32;

@cImport("my_lib.h")
extern "C" { fn init() -> i32; fn shutdown(); }
```

`HeaderImport` is handled in `src/parsing/ast.rs:StmtKind::HeaderImport` and lowered via `src/cli` FFI pipeline. FFI modules bypass cycle detection (they are external).

---

## 10. Link-Time Optimization (LTO) & Cross-Module Boundaries

When compiling with LTO enabled (`--lto`), the compiler retains intermediate bitcode across modules:

- **Cross-Module Inlining**: Functions marked `@inline` in external modules are inlined directly into calling module basic blocks.
- **Dead Code Elimination (DCE)**: Unreferenced exported functions are stripped from the final binary, reducing footprint.
- **ThinLTO**: Module summaries enable parallel optimization with import of hot call edges.

Without LTO, each module is codegen'd separately and linked; `export` symbols are `global` in the object file, private symbols are `local`.

---

## 11. Compilation Model & Source References

```
Source .adesh --> Lexer (src/parsing/lexer.rs: import/export keywords)
              --> Parser (src/parsing/parser/*) --> StmtKind::Import{,* ,Default} / ExportDefault*
              --> Module Resolver (src/semantics/engine.rs) --> canonical paths, graph G
              --> Cycle Detection (Tarjan DFS) --> E0061 if cycle
              --> Symbol Table Construction (per-module HashMap<String, ExportInfo>)
              --> HIR Lower (src/parsing/hir_lower.rs) --> cross-module type resolution
              --> Codegen (src/backends/*) --> object files + linker (mangled _Adesh_M_*)
              --> LTO (optional) --> cross-module inline/DCE
```

---

## 12. Common Errors

| Code | Message | Fix |
|---|---|---|
| `E0060` | `cannot resolve module 'x'` | Check path, file extension, ADESH_PATH |
| `E0061` | `circular dependency detected: a -> b -> a` | Extract shared types to `c` |
| `E0062` | `cannot reassign import 'x'` | Imports are immutable aliases |
| `E0063` | `import 'x' shadows local declaration` | Rename local or import alias |
| `E0064` | `re-export 'X' not found in module 'y'` | Verify `y` exports `X` |
| `E0065` | `default export not found in 'y'` | Add `export default` in `y` |
| `W0060` | `re-export collision: 'X' overridden` | Disambiguate with explicit `export { X as Y }` |

---

## 13. Extended Examples

### 13.1 Library with Barrel & Namespaces

```adesh
// utils/math.adesh
export fn add(a: i64, b: i64): i64 { return a + b; }
export fn mul(a: i64, b: i64): i64 { return a * b; }

// utils/strings.adesh
export fn capitalize(s: string): string { return s.toUpperCase(); }

// utils/index.adesh
export * from "./math";
export * from "./strings";

// main.adesh
import { add, capitalize } from "./utils";
import * as Strings from "./utils/strings";
print(add(2, 3));
print(Strings.capitalize("hello"));
print(capitalize("world"));
```

### 13.2 Default Export for Application Entry

```adesh
// app.adesh
export default fn main() {
    print("app started");
}
export fn helper() { return 42; }

// main.adesh
import App from "./app";
import { helper } from "./app";
App();
print(helper());
```

### 13.3 Re-Export with Rename & Selective Forwarding

```adesh
// internal.adesh
export fn internal_a() {}
export fn internal_b() {}
fn private_c() {}

// public_api.adesh
export { internal_a as public_a } from "./internal";
// internal_b intentionally not re-exported
// consumer sees only public_a
```

### 13.4 Side-Effect Import for Polyfills

```adesh
// polyfill.adesh
Array.prototype.extra = fn() { return "polyfilled"; };

// main.adesh
import "./polyfill"; // executes polyfill side effects
print([].extra());
```

---

## 14. Best Practices

1. Prefer named imports (`import { X }`) over namespace imports for tree-shaking.
2. Use barrel files (`index.adesh`) sparingly — they can create accidental cycles; keep barrels leaf-only.
3. Keep modules acyclic by extracting shared types to a `types.adesh` or `common.adesh`.
4. Mark public API with explicit `export`; leave everything else private.
5. Avoid top-level side effects that depend on import order; use explicit `init()` functions.
6. For large graphs, run `adesh graph --dot` to visualize `G` and catch cycles early.
