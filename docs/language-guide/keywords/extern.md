---
id: extern
title: extern
sidebar_label: extern
description: The `extern` keyword declares external linkage for FFI — exposing C/native symbols with optional ABI and pairing with $cImport.
---

# `extern`

`extern` declares that a function or static has **external linkage** — its implementation is provided by native code (C/C++/Rust) through the **FFI layer**, not by Adesh source. The compiler leaves the symbol unresolved for the linker and generates the appropriate calling-convention glue. Adesh's FFI also uses the special `$cImport` directive to bring C headers into scope.

> **Ground truth:** Lexer `TokenKind::Extern` (`src/parsing/lexer.rs:1017`, keyword `"extern"`), FFI docs `tools/ffi.md`, hover *Declares a foreign function for FFI* (`als/src/hover.rs:396`), `$cImport` header import, `unsafe` required for raw calls.

---

## Syntax

```text
extern_decl   ::= "extern" abi? ("fn" fn_sig ";" | "static" ident ":" type ";")
               |  "extern" block
abi           ::= "\"C\"" | "\"C++\"" | string_literal
fn_sig        ::= ident "(" params? ")" ("->" type)?

c_import      ::= "$cImport" string_literal ";"   // Adesh special: imports a C header

params        ::= param ("," param)* ("," "...")?  // "..." for C varargs where allowed
param         ::= ident ":" type

extern_block  ::= "extern" abi? "{" extern_decl* "}"
```

`extern` is reserved and cannot be used as an identifier. Declarations are statement-level and typically appear at top level or inside `unsafe` modules.

### Canonical forms

```adesh
$cImport "stdio.h";
extern fn printf(fmt: *u8, ...) -> i32;

extern "C" fn puts(s: *const u8) -> i32;
extern "C" fn add(a: i32, b: i32) -> i32;

extern "C" {
    fn open(path: *const u8, flags: i32) -> i32;
    fn read(fd: i32, buf: *mut u8, n: usize) -> isize;
    fn close(fd: i32) -> i32;
}

// With static external symbol
extern "C" static errno: i32;

// Using an extern inside Adesh code — calls are unsafe-adjacent
fn main() {
    unsafe {
        printf("Hello from C\n");
        let n = add(2, 3);
        print(n); // 5
    }
}
```

### ABI string

`"C"` is the default and most portable (System V / Win64 ABI depending on target). `"C++"` enables C++ name mangling where the backend supports it. If omitted, `"C"` is assumed.

### `$cImport`

`$cImport "header.h";` is a **special directive** (not a plain `import`) that makes the header's declarations visible to the FFI header parser. It must appear before the corresponding `extern` declarations that use those types. Multiple `$cImport`s are allowed.

---

## Semantics

### Linking model

`extern` items have **no Adesh body**. The compiler emits an external symbol reference; the linker resolves it against a native library (`.a`/`.so`/`.dll`/`.lib`) supplied via build flags (`--link`, `build.adesh`, or toolchain config). If the symbol cannot be resolved, linking fails.

### Calling convention and ABI

The `extern "C"` ABI guarantees the callee uses the C calling convention (argument passing in registers/stack per target, caller-cleanup). Mismatched ABIs (e.g., declaring `"C"` but linking a Rust `extern "Rust"` symbol) is undefined behavior.

### Type mapping

Adesh FFI maps primitive types to C types:

| Adesh | C |
|---|---|
| `i8` / `u8` | `int8_t` / `uint8_t` |
| `i32` / `u32` | `int` / `unsigned int` |
| `i64` / `u64` | `int64_t` / `uint64_t` |
| `f32` / `f64` | `float` / `double` |
| `*mut T` / `*const T` | `T*` |
| `*u8` / `string` (raw) | `char*` |
| `usize` / `isize` | `size_t` / `ssize_t` |

Complex types (`struct`, `class`) require `#[repr(C)]`-like layout guarantees — use `raw` or `struct` with verified layout, or opaque `*mut void`.

### Safety

Calling an `extern` function is **unsafe** in effect, even if the call site is not syntactically `unsafe` in all builds. Raw pointers, varargs, and C UB (null deref, buffer overflow) are not checked by Adesh's borrow checker. Wrap calls in `unsafe { }` and validate preconditions:

```adesh
unsafe {
    let p: *mut u8 = alloc<u8>(64);
    // ensure NUL termination for C string
    p[0] = 104; p[1] = 0;
    puts(p as *const u8);
    free(p);
}
```

### Compilation pipeline

1. **Lex** `extern` → `TokenKind::Extern`, `$cImport` → special directive.
2. **Parse** as `ExternDecl` with optional ABI and `fn`/`static`/block payload.
3. **HIR** — `HirExtern { abi, name, params, ret, is_varargs }` with no body.
4. **Type check** — verify Adesh signature matches imported header (where `$cImport` provides it).
5. **Codegen** — emit `external` symbol with `extern "C"` linkage; call via `call_indirect` with C ABI.
6. **Link** — resolve against native library; emit error if unresolved.

---

## Examples

### Example 1 — Minimal C FFI with `$cImport` and varargs

```adesh
// Import the C header so the compiler knows the signature of printf
$cImport "stdio.h";

extern fn printf(fmt: *u8, ...) -> i32;
extern "C" fn puts(s: *const u8) -> i32;

fn main() {
    unsafe {
        // Varargs extern — format string plus arguments
        printf("Hello from C: %d\n", 42);
        puts("Hello via puts" as *const u8);
    }
}

// Linking (toolchain dependent):
// adesh build --link c -lc  # link against libc
// or via build.adesh: extern_libs = ["c"]
```

### Example 2 — Extern block, opaque handles, and callback

```adesh
$cImport "mylib.h";

extern "C" {
    // Opaque handle — Adesh never inspects layout
    fn mylib_open(path: *const u8) -> *mut void;
    fn mylib_process(handle: *mut void, data: *const u8, len: usize) -> i32;
    fn mylib_close(handle: *mut void) -> void;

    // Callback type: C calls back into Adesh
    fn mylib_set_callback(handle: *mut void, cb: *mut void) -> void;
}

// Adesh callback that C will call — must be `extern "C"` on Adesh side too
extern "C" fn my_callback(code: i32) -> void {
    print("callback:", code);
}

fn use_mylib(path: string): i32 {
    unsafe {
        let handle = mylib_open(path as *const u8);
        if handle as usize == 0 { throw "open failed"; }
        defer mylib_close(handle); // ensure close on every exit path

        mylib_set_callback(handle, my_callback as *mut void);
        let data = "payload";
        let rc = mylib_process(handle, data as *const u8, data.len() as usize);
        return rc;
    }
}
```

### Example 3 — Struct layout, `raw`, and mixing with `region`/`alloc`

```adesh
$cImport "geometry.h";

// C struct: struct Point { double x, y; };
struct Point { x: f64, y: f64 }

extern "C" fn distance(a: *const Point, b: *const Point) -> f64;
extern "C" fn transform(points: *mut Point, n: usize) -> void;

fn demo_struct_ffi() {
    unsafe {
        // Heap allocation for C to mutate
        let pts: *mut Point = alloc<Point>(2);
        defer free(pts);
        pts[0] = Point { x: 0.0, y: 0.0 };
        pts[1] = Point { x: 3.0, y: 4.0 };
        print(distance(&pts[0], &pts[1])); // 5.0

        transform(pts, 2);
        print(pts[0].x, pts[0].y);
    }

    // Region-based scratch for hot-path FFI — bulk-free
    region scratch {
        unsafe {
            let tmp: *mut Point = alloc<Point>(1024);
            // tmp is arena-allocated inside region — no per-alloc free needed
            for i in 0..1024 { tmp[i] = Point { x: i as f64, y: 0.0 }; }
            transform(tmp, 1024);
            // bulk-free at region exit
        }
    }
}

// Raw contiguous storage for C interop (no DynArray metadata)
fn raw_array_ffi() {
    let buf: raw u8[256] = raw u8[256];
    unsafe {
        // Pass raw pointer to C that expects `uint8_t*`
        extern "C" fn fill_random(buf: *mut u8, n: usize) -> void;
        fill_random(&buf[0], 256);
    }
}
```

---

## Restrictions / Errors

| Kind | Trigger | Diagnostic | Help |
|---|---|---|---|
| **Lexical** | `let extern = 1` | `unexpected token 'extern', expected identifier` | `TokenKind::Extern` reserved |
| **Parse** | `extern 42;` | `expected 'fn' or 'static' or '{' after 'extern'` | Write `extern fn f(...);` |
| **Parse** | `extern fn f() { }` with body | `extern function cannot have a body` | Use `;` not `{ }` |
| **Parse** | `$cImport` without string literal | `expected string literal after '$cImport'` | Write `$cImport "header.h";` |
| **Type** | Mismatched param/return types vs. header | `mismatched FFI signature for '<name>'` | Fix Adesh decl to match C header |
| **Safety** | Calling `extern fn` without `unsafe` (strict builds) | `call to extern function requires unsafe` | Wrap in `unsafe { }` |
| **Link** | Unresolved `extern` symbol at link time | `undefined reference to '<name>'` | Add native library to link args / `build.adesh` |
| **ABI** | `extern "C++"` without C++ toolchain | `C++ ABI not supported on this target` | Use `extern "C"` or enable C++ toolchain |
| **Varargs** | `...` not last param | `varargs '...' must be last parameter` | Move `...` to end |
| **Runtime** | Null pointer passed to `extern` expecting non-null | UB / segfault | Validate pointers before call; NUL-terminate C strings |

**Common pitfall — mismatched layout:**

```adesh
// C: struct S { int32_t a; double b; }  // padded to 16 bytes on most ABIs
struct S { a: i32, b: f64 } // may mismatch without repr guarantee
// Fix: verify layout with padding fields or use opaque *mut void and accessor fns
```

---

## See Also

- [unsafe](./unsafe) — `unsafe { }` audit fence for raw pointers and FFI calls
- [alloc](./alloc) / [free](./free) — manual memory for FFI buffers (`*mut T`)
- [region](./region) — arena bulk-free for scratch FFI buffers (`AllocKind::Region`)
- [raw](./raw) — `raw T[N]` contiguous storage for C interop
- [FFI Guide](../../tools/ffi) — full FFI tutorial, `$cImport`, linking, and build config
- [Modules & Imports](../modules-imports) — module system and imports
- `src/parsing/lexer.rs:1017`, `als/src/hover.rs:396`, `tools/ffi.md`
