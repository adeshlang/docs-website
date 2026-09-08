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
```

---

## 2. Export & Import Semantics

### 2.1 Explicit Symbol Export
Symbols declared within a module are private to that module's compilation unit by default. Symbols become accessible to importing modules when qualified with the `export` keyword:

```adesh
// File: math_utils.adesh
export const PI: f64 = 3.1415926535;

export fn calculate_area(radius: f64) -> f64 {
    return PI * radius * radius;
}

fn internal_helper() { ... } // Private: Not exported
```

### 2.2 Import Binding Specifications
Import statements bind exported symbols into the caller's symbol table:

```adesh
// Named Import
import { calculate_area, PI } from "./math_utils";

// Alias Import
import { calculate_area as get_area } from "./math_utils";

// Namespace Import
import * as MathUtils from "./math_utils";
```

Imported bindings are immutable aliases to the exported module symbol table slots.

---

## 3. Module Resolution & Search Algorithm

When resolving `import ... from "target"`, the compiler executes a 4-tier module path resolution lookup algorithm:

```
                          [ Resolving import "path" ]
                                       |
                   +-------------------+-------------------+
                   | Is Relative Path? ("./" or "../")     |
                   v                                       v
         [ Resolves relative to ]                [ Search Module Search Paths ]
         [ Current File Dir     ]                          |
                                                           +---> 1. Standard Built-in Modules ("builtin", "stdlib")
                                                           +---> 2. Project ADL Package Directory ("node_modules" / ".adl")
                                                           +---> 3. Global ADL Package Path ($ADESH_PATH)
```

If resolution fails at all tiers, compilation halts with error `E0060: Cannot resolve module target`.

---

## 4. Circular Dependency Detection Algorithm

During AST analysis, the compiler constructs a directed **Module Dependency Graph** $G = (V, E)$, where vertices $V$ represent modules and directed edges $E = (u, v)$ represent an `import` from module $u$ to module $v$.

### 4.1 DFS Topological Cycle Detection
Before code generation, Tarjan's Strongly Connected Components algorithm performs a Depth-First Search (DFS) traversal:

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

Circular module dependencies are strictly rejected at compile time.

---

## 5. Link-Time Optimization (LTO) & Cross-Module Boundaries

When compiling with Link-Time Optimization enabled (`--lto`), the compiler retains intermediate bitcode representation across modules:
- **Cross-Module Inlining**: Functions marked `@inline` in external modules are inlined directly into calling module basic blocks.
- **Dead Code Elimination (DCE)**: Unreferenced exported functions are stripped from the final executable binary, reducing binary footprint.
