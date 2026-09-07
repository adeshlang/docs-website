---
id: modules-imports
title: Modules & Imports - Reusing Code
sidebar_label: 19. Modules & Imports
---

# Modules & Imports — Reusing Code

No real program lives in one file. AdeshLang lets you split code into
**modules** and pull them back together with `import` — the exact syntax
demoed in
[`examples/modules/imports.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/modules/imports.adesh).

## Importing a local file

```adesh
// utils.adesh — a module we wrote ourselves
fn add(a, b) {
    return a + b;
}
```

```adesh
// main.adesh — importing utils
import "./utils.adesh";

print("add:", utils.add(2, 3));
```

**Output:**
```
add: 5
```

The `import "./path.adesh"` statement loads the module and exposes its
functions through the module's name (`utils`).

## Named imports

```adesh
// from "./utils.adesh" import sum, PI;
// print("sum:", sum(4, 5), "PI:", PI);
```

When you only need some symbols, import them by name — anything not listed
stays out of scope. (This form is shown commented out in the example file
because it requires a module that the examples folder doesn't ship.)

## The standard library is pre-imported

Built-in modules (Math, JSON, fs, HTTP, …) are available through the runtime
with no file path — usually available globally:

```adesh
let result = Math.floor(3.7);
print("Math.floor(3.7):", result);

let pi = Math.PI;
print("Math.PI:", pi);
```

**Output:**
```
Math.floor(3.7): 3
Math.PI: 3.141592653589793
```

Some libraries need an explicit `import` to use (see the
[Standard Library Tour](/learn/stdlib-tour)):

```adesh
import JSON;
import "fs";
import Math;
import Collections;
import Time;
```

## A practical split: the Task Manager as modules

You already built [the Task Manager](/learn/capstone) as one file. Real
projects split it:

```text
task_manager/
├── main.adesh        → CLI loop, imports everything
├── task.adesh        → the Task type and TaskManager class
└── commands.adesh    → handleAdd, handleList, handleComplete...
```

```adesh
// main.adesh
import "./task.adesh";
import "./commands.adesh";

fn main() {
    let manager = new TaskManager();
    handleAdd(manager, ["Buy milk", "", "low"]);
    handleList(manager, []);
}

main();
```

**Output:**
```
✅ Task added successfully!
   ID: 1
   Title: Buy milk
```
```
📋 Task List

  ID  | Status | Priority | Title
  ────┼────────┼──────────┼─────────────────────
     1 | ○ Todo | 🟢 Low   | Buy milk
```

## Practice

Create your own two-file program: a `math_utils.adesh` with `square` and
`cube`, imported by `main.adesh`:

```adesh
// math_utils.adesh
fn square(x) { return x * x; }
fn cube(x)   { return x * x * x; }
```

```adesh
// main.adesh
import "./math_utils.adesh";

print("3 squared:", math_utils.square(3));
print("3 cubed:", math_utils.cube(3));
```

**Output:**
```
3 squared: 9
3 cubed: 27
```

## Summary

✅ **You learned:**
- `import "./file.adesh"` loads another module
- Module members are used through the module name (`utils.add(...)`)
- Named imports (`from "..." import x, y`) pull in only what you need
- The standard library is pre-imported / available via runtime
- Multi-file project structure for real apps

## Next Step

Programs that talk to *you* — **interactive input and timers**.
Continue to **[Interactive Input & Timers](/learn/input-timers)** →
