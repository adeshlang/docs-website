---
id: raw
title: raw
sidebar_label: raw
description: The raw keyword and raw string/array forms — verbatim text without escape processing and C-compatible contiguous raw T[N] arrays without per-array metadata.
---

# `raw`

`raw` is AdeshLang's escape hatch for **verbatim** storage: verbatim strings that treat escapes and interpolation literally, and contiguous `raw T[N]` arrays that map 1:1 to C arrays without the `DynArray` length/capacity header. Raw arrays show up in the interpreter as `Value::RawArray(type_name, elements)` (`src/parsing/ast.rs:978`) and are the correct target for FFI buffers, image planes, and any data that must be directly readable by foreign code.

> **Ground truth:** Lexer `TokenKind::Raw` (`src/parsing/lexer.rs:1006`, keyword `"raw"` and `r"..."`/`R"..."`/`r#"..."#` forms in `raw_string()` `lexer.rs:537`), AST `Value::RawArray(String, Vec<Value>)` (`ast.rs:978,1086`), `TokenKind::VecType` related SIMD forms, `ArrayElementType` (`ast.rs:102-116`) governs metadata sizing that `raw` opts out of.

---

## Syntax

```text
raw_decl       ::= "raw" type "[" size "]" ident? "=" initializer
raw_type       ::= "raw" type "[" integer "]"
raw_string     ::= ("r" | "R") hashes? '"' content '"' hashes?
                 | raw_expr: "raw" '"' content '"'
```

`raw` appears in two independent roles; they share spelling but are parsed by different lexer branches:

### 1. Raw strings — verbatim string literals (`r"..."`, `R"..."`, `r#"..."#`)

Backslashes and `${...}` are taken verbatim — no `\n` processing, no template interpolation.

```adesh
let path = r"C:\Users\Adesh\Documents";   // \ is literal, no escape
let pattern = raw"\d+\.\d+";               // regex without double-escaping
let with_quote = r#"He said "hi""#;        // hash delimiters allow inner quotes
```

Lexer branch `raw_string()` (`lexer.rs:537`): `r` or `R` followed by zero or more `#` then `"`, scanning until matching `"#*` even across newlines. Like `string()` but without escape handling.

### 2. Raw arrays — `raw T[N]` contiguous storage

```adesh
let buf: raw u8[1024] = [0; 1024];          // pseudo-syntax; stored as Value::RawArray("u8", elements)
let pixels: raw u32[64] = [0xFF; 64];
```

Parser: treated as type annotation `raw u8[1024]` in `Let`/`Function` params; runtime value is `Value::RawArray(element_type_name, Vec<Value>)`. Variant doc: *"Raw array without metadata overhead (like C arrays) — stores element type name and elements"* (`ast.rs:977`).

---

## Semantics

### Raw strings vs. normal strings vs. templates

| Form | TokenKind | Escape `\n` | Interpolation `${}` | Example lexeme |
|---|---|---|---|---|
| `"hello\nworld"` | `String` (`lexer.rs:string()`) | processed → newline | rejected (`${` in non-template is error) | `hello\nworld` internal |
| `` `hello ${x}` `` | `Template` (`lexer.rs:template()`) | processed | required backticks | — |
| `r"C:\x"` / `raw"..."` | `String` via `raw_string()` | **literal** `"\x"` | **literal** `"${"` | `C:\x` |
| `'a'` | `CharLit` | processed | n/a | `a` |

Raw strings still produce `TokenKind::String` tokens — they share the runtime `Value::Str` type but differ lexically in that no escapes are applied.

### Raw arrays: layout and metadata distinction

```
Dynamic (DynArray)         Raw (RawArray)
┌─────────┬────────┐       ┌────────┬────────┐
│ ptr 8B  │Header  │       │elem_ty │ data*  │
│ len 4/8 │ cap 4/8│       │ String │ Vec<T>│  (elem count = N)
│ alloc   │ contents│      │ fixed N│ contents (no len/cap header)
└─────────┴────────┘       └────────┴────────┘
8 + 2*metadata_size        N * element_size  (no extra header)
suite A:1/2/4/8/16  (§ast.rs:146)    raw: always exactly N elements
```

- `ArrayElementType::metadata_size()` (`ast.rs:146-152`) decides whether `DynArray` length/capacity use 4-byte or 8-byte fields. `RawArray` sidesteps this entirely — capacity is not tracked separately; `.len()` is structural `N`.
- `ArrayElementType::element_size()` (`ast.rs:119`) still governs raw data size per element (1/2/4/8/16).
- Type name string stored as first field of `Value::RawArray` (`"u8"`, `"i32"`, etc.) — checked on FFI boundary vs. `cImport` type.

### Compilation pipeline

1. **Lex** `raw` keyword → `TokenKind::Raw`; `r"..."` forms intercepted at `scan()` `r|R if peek=="\"|#"` (`lexer.rs:420`) and produce `String` with verbatim contents.
2. **Parse** `raw T[N]` annotation via type parser; elements parsed as `array_expr` with `RawArray` construction path in `Value::RawArray`.
3. **Type check** — raw element assignments coerced per `DynamicArray::new` inference rules (`ast.rs:304`) but without `concrete_type` metadata beyond stored string.
4. **Lower** — FFI `ExternFunctionDecl` (`ast.rs:896`) expecting `*mut u8` may accept `raw u8[N]` passed as raw pointer/length pair; build inserts decay-to-pointer.
5. **Runtime** — `Value::RawArray` equality/formatting treat it as array (`ast.rs:1086` prints as `[a,b,...]`), but `truthy` checks use `!a.is_empty()` (`ast.rs:1198`).

### FFI use

```adesh
@cImport("stdint.h")
extern "C" fn process_pixels(p: *mut u8, n: usize);

let img: raw u8[256] = [0u8; 256];
process_pixels(img as *mut u8, img.len()); // raw decay is intentional & must be in unsafe when mutating
```

Raw arrays are preferred to `DynArray` when:
- Buffer must be exactly `N * sizeof(T)` with no extra header (IPC structs, GPU maps).
- Size is compile-time constant `N`.
- You need C-compat: `raw u8[64]` ≡ `uint8_t buf[64]` in C header.

DynArrays are preferred for growable sequences.

---

## Examples

### Example 1 — Raw strings for paths, regexes, and cross-line verbatim

```adesh
// Windows path — no double-escaping
let path = r"C:\Users\Adesh\Projects\AdeshLang\src\parsing\lexer.rs";
print(path); // C:\Users\Adesh\Projects\AdeshLang\src\parsing\lexer.rs

// Regex — reads literally, backslashes not consumed by lexer
let pattern = raw"\d{3}-\d{2}-\d{4}"; // US SSN pattern — \d stays two chars
let pattern_alt = r"\d+\.\d+";       // decimal pattern

// Hash delimiters allow embedded quotes and newlines verbatim:
let snippet = r#"raw = `template ${x}`: quotes="hi", backslash=\n"#;
print(snippet); // raw = `template ${x}`: quotes="hi", backslash=\n (literal backslash-n)

let multi = r#"
SELECT * FROM users
WHERE name = "Adesh" AND path = 'C:\tmp';
"#;
print(multi.len() > 0); // true — multi-line verbatim via raw_string()
// Normal string would require \n and \" per line:
let escaped = "line1\nline2 \"quoted\"";
```

### Example 2 — Raw arrays for FFI and stable layouts

```adesh
// A fixed-size 128-byte packet buffer — exactly like C uint8_t[128]
let packet: raw u8[128] = [0u8; 128]; // N=128, element type "u8"
print(packet.len()); // 128 — structural, not tracked cap

// Fill deterministically via indexing (or unsafe raw pointer when required)
for i in 0..packet.len() {
    packet[i] = (i & 0xFF) as u8;
}

// Pass to foreign code without metadata translation (unsafe where spec requires):
@cImport("packet.h")
extern "C" fn send_packet(buf: *const u8, len: usize) -> i32;

unsafe {
    let rc = send_packet(packet as *const u8, packet.len());
    print(rc == 0); // success
}

// Compare DynArray — carries length/capacity metadata (ast.rs:152):
let dyn_packet = [0u8; 128]; // DynArray(Box<DynamicArray>) with metadata_size 4
print(dyn_packet.len());      // 128
// dyn_packet additionally tracks capacity, pointer — good for growth, bad for C FFI fixed map
```

### Example 3 — Mixing raw arrays with `region` and `alloc` for zero-header batching

```adesh
struct Frame { pixels: raw u8[256], width: u32, height: u32 }

// Bulk-allocate many frames inside a region — raw arrays keep frames compact
region scratch {
    let a: Frame = Frame { pixels: [0xFFu8; 256], width: 16, height: 16 };
    let b: Frame = Frame { pixels: raw_bytes_from_file(), width: 16, height: 16 };
    print(a.pixels[0]); // 255
    print(b.pixels[0]);

    // Explicit unsafe bulk pipeline over raw storage
    unsafe {
        let ptr_a: *mut u8 = a.pixels as *mut u8;
        let ptr_b: *mut u8 = b.pixels as *mut u8;
        // raw pointer ops — safe because length is structural N=256 and owns data in `a`/`b`
        for i in 0..256 { ptr_a[i] = (ptr_a[i] + ptr_b[i]) / 2; }
        print(a.pixels[0]);
    }
} // scratch bulk-free reclaims temporaries that were arena-allocated

// Raw array round-trip through Value::RawArray:
// Internally DynamicArray::new inference applies per element; for raw, stored type is literal "u8"
// Value debug still prints as [0,1,...] via RawArray branch (ast.rs:1096)
```

---

## Restrictions / Errors

| Kind | Trigger | Help |
|---|---|---|
| **Lexical** | `r#unterminated` (missing closing `"#`) | `Unterminated raw string line N` (`lexer.rs:550`) — count `#` must match opening |
| **Parse** | `raw` used as identifier `let raw = 1` | Reserved `TokenKind::Raw` — `unexpected token 'raw', expected identifier` |
| **Parse** | `raw T[expr_non_const]` with non-literal size | `raw array size must be integer literal` — raw requires compile-time `N` (unlike DynArray) |
| **Type** | `raw u8[4] = [1,2,3]` length mismatch | `TypeError: raw array expected length 4, found 3` |
| **Type** | Passing `raw u8[64]` where `*mut i32` expected | `TypeError: raw element type mismatch: expected 'i32' slice, found 'u8'` |
| **Ownership** | Mutating `raw` alias through two handles | Raw pointers alias freely — borrow check treats them as escaped `unsafe_captures`; safe borrow discipline not enforced |
| **FFI** | Returning `raw T[N]` by value across `extern "C"` | Prefer decaying to `*const T` with explicit `len: usize` companion; large raw arrays as return values may be ABI-over-copied |
| **Runtime** | `RawArray` index out of bounds | Interpreter traps: `index out of bounds: 64 >= 64` (matches `Array` handling) |

**Common pitfall — confusing `raw` string vs. `raw` array:**

```adesh
let s = raw"hello";          // string verbatim (r"hello"), Value::Str
let a: raw u8[5] = [1,2,3,4,5]; // array contiguous, Value::RawArray
// let x = raw 5;             // lex error — raw requires following type "[" size "]" or quote
```

Prefer `raw T[N]` for FFI/size-critical buffers; prefer normal `let arr = [1,2,3]` (`DynArray`) for growable sequences.

---

## See Also

- [vec](./vec) — `TokenKind::VecType` SIMD vector type (`vec4<f32>` family), unrelated but lexical neighbor (`raw`/`vec`)
- [alloc](./alloc) / [free](./free) / [region](./region) — manual/arena memory vs fixed raw buffers
- [unsafe](./unsafe) — mutating raw arrays through pointer decay requires unsafe
- [Memory & Safety](../../advanced/memory-safety) — DynArray metadata sizing (`ArrayElementType::metadata_size`), SAO
- [Lexer & Parser](/docs/compiler/lexer-parser) — `TokenKind::Raw`, `raw_string()` / `string()`/`template()` branches
- `src/parsing/ast.rs:976-979` `Value::RawArray`, `src/parsing/ast.rs:102-152` `ArrayElementType`, `src/parsing/lexer.rs:537-575`

