---
id: native-jit
title: Native JIT Compilation Backend
sidebar_label: Native JIT
---

# Native JIT Compilation Backend

The Native Just-In-Time (JIT) compilation backend executes Adesh programs by compiling LIR (Low-level IR) directly into native machine code at runtime.

---

## 1. Engine and Architecture

The Native JIT backend uses **Cranelift** (not LLVM) as its compilation engine. It compiles LIR blocks into Cranelift IR, optimizes them using Cranelift's built-in optimization passes, and generates native CPU machine code (x86_64 or AArch64) directly into executable memory.

### Compilation Pipeline
```
Adesh Source
      ↓
     LIR (Low-level IR)
      ↓
Cranelift IR CodeGen
      ↓
Optimization Passes
      ↓
Native Machine Code (in-memory)
      ↓
Zero-Overhead Native Call
```

### Performance Characteristics
* **Compilation Speed**: Less than 10ms per function.
* **Execution Speed**: Native machine code generated at runtime; no interpreter loop dispatch.
* **Zero Overhead**: Direct memory read/write instructions (1-2ns load/store) and native memory management (100ns malloc/free) without JVM-like garbage collection or VM loop dispatch overhead.

---

## 2. Command Line Usage

Select the Native JIT backend using one of the equivalent execution flags:

```bash
# Run program with Native JIT compilation
adesh run --jit-native program.adesh
adesh run --native-jit program.adesh
adesh run --njit program.adesh
```

---

## 3. Print and Pretty Printing System

The Native JIT backend integrates with a Rust-side runtime bridge (`runtime_bridge.rs`) to support first-class pretty printing, styling, and color formatting.

### Supported Data Types
* **Primitives**: `int`, `float`, `string`, `bool`, `null`.
* **Sized Types**: `i8` to `i128`, `u8` to `u128`, `f32`, `f64`.
* **Collections**: Arrays, Objects, Tuples, Sets (rendered as arrays).
* **BigInt**: Arbitrary precision integers.
* **Nested Structures**: Properly formats recursive and deeply nested data structures.

### Pretty Printing Modes
Pass options as an object parameter in `print()`:

```adesh
let user = { name: "Alice", age: 30 };

// 1. Full Mode (default pretty) - Indented with type annotations
print(user, { pretty: true });
// Output:
// {
//   name: "Alice" ⟨string⟩,
//   age: 30 ⟨int⟩
// } ⟨object⟩

// 2. Compact Mode - Inline without indentation or types
print(user, { pretty: "compact" });
// Output: {name: "Alice", age: 30}

// 3. Simple Mode - Normal unformatted output
print(user, { pretty: "simple" });
```

### Text Styling and Colors
The JIT backend compiles print options into ANSI escape sequences at compile-time:

* **Text Colors**: `color` Accepts hex strings (e.g. `"#FF0000"`).
* **Background Colors**: `background` Accepts hex strings.
* **Text Styles**: `bold: true`, `italic: true`, `underline: true`, `strikethrough: true`.
* **Layout**: `sep` (separator between parameters) and `end` (custom suffix).
* **IO Controls**: `file` (path to write output directly to a file) and `flush: true` (flushes stdout buffer).

```adesh
// Print SUCCESS message in bold green
print("SUCCESS:", "Operation complete", {
    color: "#00FF00",
    bold: true,
    sep: " "
});
```

---

## 4. Current Limitations & Workarounds

* **Function Call Stack Limit**: Compiling complex recursive function loops with heavy printing inside nested blocks can trigger compiler stack limits.
  * *Workaround*: Move heavy formatting logic to module-level execution, or use the standard Interpreter if deep recursion limits are hit.
* **Builtin Date/Time Formatting**: Builtin Time/Date object parsing has partial Native JIT compatibility.
  * *Workaround*: Format dates as strings in user space before passing them to the Native JIT compiler.
