---
id: ffi
title: Foreign Function Interface (FFI)
sidebar_label: FFI & C Interop
description: Interoperating with C/C++ libraries, native system APIs, and external shared libraries in Adesh.
---

# Foreign Function Interface (FFI)

Adesh provides a zero-overhead **Foreign Function Interface (FFI)** to call native C functions and export Adesh functions with standard C calling conventions (`cdecl`, `stdcall`, `fastcall`).

```
┌────────────────────────────────────────────────────────┐
│                   Adesh Runtime                    │
├────────────────────────────────────────────────────────┤
│  extern "C" fn printf(fmt: *const u8, ...) -> i32;     │
└───────────────────────────┬────────────────────────────┘
                            │ Zero-overhead direct jump
┌───────────────────────────▼────────────────────────────┐
│                    Native C Library                    │
├────────────────────────────────────────────────────────┤
│  int printf(const char* format, ...);                  │
└────────────────────────────────────────────────────────┘
```

---

## 1. Type Mappings

Adesh primitive types map directly to C ABI primitive types without translation overhead:

| Adesh Type | C Equivalent Type | Width / Details |
|----------------|-------------------|-----------------|
| `i8` / `u8` | `int8_t` / `uint8_t` / `char` | 8-bit integer |
| `i16` / `u16` | `int16_t` / `uint16_t` / `short` | 16-bit integer |
| `i32` / `u32` | `int32_t` / `uint32_t` / `int` | 32-bit integer |
| `i64` / `u64` | `int64_t` / `uint64_t` / `long long` | 64-bit integer |
| `isize` / `usize` | `intptr_t` / `uintptr_t` / `size_t` | Pointer-sized integer |
| `f32` | `float` | 32-bit IEEE 754 float |
| `f64` | `double` | 64-bit IEEE 754 float |
| `bool` | `bool` / `_Bool` | 1 byte boolean |
| `*const T` | `const T*` | Immutable raw pointer |
| `*mut T` | `T*` | Mutable raw pointer |
| `[T; N]` | `T[N]` | Fixed-size array (contiguous) |
| `struct S` | `struct S` | C-compatible struct with `#[repr(C)]` |

---

## 2. Declaring and Calling External C Functions

External C declarations use the `extern "C"` block or function declaration. Calling FFI functions requires an `unsafe` block or function annotation because the compiler cannot verify foreign code safety.

```adesh
// Import functions from the standard C library
extern "C" {
    fn puts(s: *const u8) -> i32;
    fn sqrt(x: f64) -> f64;
    fn malloc(size: usize) -> *mut u8;
    fn free(ptr: *mut u8);
}

fn main() {
    let message = "Hello from C puts!\0";
    
    // SAFETY: message is null-terminated and valid memory
    unsafe {
        puts(message.as_ptr());
    }

    let root = unsafe { sqrt(144.0) };
    print(f"Square root of 144.0 is: {root}");
}
```

---

## 3. Passing Structs Across FFI Boundaries

To ensure binary layout compatibility with C struct memory alignment, use the `#[repr(C)]` attribute:

```adesh
#[repr(C)]
struct TimeVal {
    tv_sec: i64,
    tv_usec: i64,
}

#[repr(C)]
struct TimeZone {
    tz_minuteswest: i32,
    tz_dsttime: i32,
}

extern "C" {
    fn gettimeofday(tv: *mut TimeVal, tz: *mut TimeZone) -> i32;
}

fn get_current_epoch(): i64 {
    let tv = TimeVal { tv_sec: 0, tv_usec: 0 };
    let null_tz: *mut TimeZone = null;
    
    let res = unsafe { gettimeofday(&tv, null_tz) };
    if res == 0 {
        return tv.tv_sec;
    }
    return -1;
}
```

---

## 4. Linking External Libraries

You can link shared libraries (`.so`, `.dylib`, `.dll`) or static archives (`.a`, `.lib`) using the `#[link]` attribute or CLI flags:

### In Source Code:
```adesh
#[link(name = "sqlite3")]
extern "C" {
    fn sqlite3_open(filename: *const u8, ppDb: *mut *mut u8) -> i32;
    fn sqlite3_close(pDb: *mut u8) -> i32;
}
```

### Via CLI Compiler Flags:
```bash
# Link external library during AOT compilation
adesh build main.adesh -l sqlite3 -L /usr/local/lib
```

---

## 5. Exporting Adesh Functions to C

You can export Adesh functions with C linkage for embedding into C/C++, Rust, Python, or Go hosts:

```adesh
#[export_name("adesh_compute_hash")]
pub extern "C" fn adesh_compute_hash(data: *const u8, len: usize) -> u64 {
    let slice = unsafe { slice_from_raw_parts(data, len) };
    return hash_data(slice);
}
```

Compile as a shared library:
```bash
adesh build --crate-type=cdylib -o libadesh_math.so src/lib.adesh
```

---

## 6. Safety Guidelines

> [!CAUTION]
> When working with FFI:
> 1. **Null-termination**: Strings passed to C functions expecting `char*` must be null-terminated (`\0`).
> 2. **Memory Allocation Ownership**: Never free memory in Adesh that was allocated by C `malloc()`, and never call C `free()` on memory managed by Adesh ARC.
> 3. **Unsafe Isolation**: Wrap foreign FFI calls in safe idiomatic Adesh wrapper functions that validate inputs and return `Result<T, E>`.
