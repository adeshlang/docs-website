---
id: runtime-abi
title: Standardized Runtime ABI (ADESH_RUNTIME_ABI_V1)
sidebar_label: Runtime ABI
---

# Adesh Runtime ABI Specification (`ADESH_RUNTIME_ABI_V1`)

The **Adesh Runtime ABI** establishes the formal in-memory data representations and C-ABI calling conventions shared across all Adesh execution engines: the **Tree-Walking Interpreter**, **Bytecode VM**, **Native JIT**, and the **Ahead-of-Time Native Compiler (`adesh build`)**.

---

## In-Memory Type Representations

All composite data types follow strict `#[repr(C)]` layouts to enable seamless zero-copy foreign function interface (FFI) with C, C++, Rust, and OS system libraries.

### 1. `AdeshString`
A standard 32-byte struct on 64-bit platforms:
```rust
#[repr(C)]
pub struct AdeshString {
    pub ptr: *const u8,   // UTF-8 byte buffer (null-terminated for C-FFI)
    pub len: usize,       // Length in bytes
    pub cap: usize,       // Total buffer capacity
    pub flags: u32,       // Bitflags: STATIC (0x1), MUTABLE (0x2), SSO (0x4)
    pub reserved: u32,    // Alignment padding
}
```

### 2. `AdeshArray` & `AdeshSlice<T>`
```rust
// Immutable View Slice (16 Bytes)
#[repr(C)]
pub struct AdeshSlice<T> {
    pub data: *const T,
    pub len: usize,
}

// Resizable Dynamic Array (32 Bytes)
#[repr(C)]
pub struct AdeshArray {
    pub data: *mut u8,
    pub len: usize,
    pub cap: usize,
    pub elem_size: usize,
}
```

### 3. Tagged Unions (`AdeshOption` & `AdeshResult`)
Discriminant tags are placed in the first byte, followed by 7 bytes of alignment padding, ensuring the 64-bit payload is 8-byte aligned:

```rust
#[repr(C)]
pub struct AdeshOptionU64 {
    pub tag: u8,          // 0 = None, 1 = Some
    pub _pad: [u8; 7],    // Padding to 8-byte boundary
    pub value: u64,       // Payload value
}

#[repr(C)]
pub struct AdeshResultU64 {
    pub tag: u8,          // 0 = Ok, 1 = Err
    pub _pad: [u8; 7],    // Padding
    pub payload: u64,     // Value or error code
}
```

### 4. Closures & Fat Pointers
```rust
#[repr(C)]
pub struct AdeshClosure {
    pub fn_ptr: *const (),
    pub env_ptr: *mut (),
    pub drop_fn: Option<unsafe extern "C" fn(*mut ())>,
}

#[repr(C)]
pub struct AdeshFatPointer {
    pub data_ptr: *mut (),
    pub vtable_ptr: *const (),
}
```

---

## C-ABI Export Symbols

The native runtime library (`libadesh_rt` / `libadesh_std.adob`) exports standard C-ABI functions:

```c
// String Operations
AdeshString adesh_str_new(const char* utf8_bytes, size_t len);
AdeshString adesh_str_from_cstr(const char* c_str);
AdeshString adesh_str_concat(AdeshString s1, AdeshString s2);
void adesh_str_free(AdeshString s);

// Array Primitives
AdeshArray adesh_arr_new(size_t elem_size, size_t initial_cap);
int32_t adesh_arr_push(AdeshArray* arr, const uint8_t* elem_ptr);
uint8_t* adesh_arr_get(const AdeshArray* arr, size_t index);
void adesh_arr_free(AdeshArray* arr);

// Memory Management
uint8_t* adesh_mem_alloc(size_t size, size_t align);
void adesh_mem_free(uint8_t* ptr, size_t size, size_t align);
uint8_t* adesh_mem_realloc(uint8_t* ptr, size_t old_size, size_t new_size, size_t align);

// Panic & Abort
void adesh_panic_abort(const char* msg, size_t len);
```

---

## Precompiled Native Standard Library (`libadesh_std.adob`)

Using `StdlibAdobBuilder`, Adesh precompiles standard runtime functions into multi-target fat bundles (`AdobBundle`). When `adesh build` runs, `adeshlink` links against these precompiled native archives in milliseconds, avoiding standard library source recompilation on every build.
