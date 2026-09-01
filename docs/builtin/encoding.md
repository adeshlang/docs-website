---
id: encoding
title: Encoding Library
sidebar_label: Encoding
---

# Encoding Library

The **Encoding** builtin library is AdeshLang's complete text, binary, and wire-format encoding system. It covers Unicode text encodings (UTF-8, UTF-16, UTF-32, ASCII), byte-string encodings (Base64, Base64URL, hex), web encodings (percent, URL component, `application/x-www-form-urlencoded`), fixed-width integer/float serialization with explicit endianness, bounds-checked buffer reads, variable-length integers (VarInt, ZigZag, LEB128 — including the WASM binary format variants), and Byte Order Mark (BOM) detection/removal. Everything is implemented natively in Rust, so behavior is identical across every backend.

## Namespace

| Name | What it provides |
| :--- | :--- |
| `Encoding` | The namespace: 80+ functions covering text encodings, Base64/Base64URL/hex, percent & form encoding, endian binary serialization, buffer reads, VarInt/LEB128, and BOM handling |

## Importing the library

```adesh
import Encoding;            // or import "std:Encoding" as Encoding;
```

Selective imports work too:

```adesh
import { utf8Encode, base64Encode, hexEncode } from Encoding;
```

:::tip
Most functions that take *bytes* accept either a byte array (`[65, 66, 67]`), a `RawArray("u8", …)`, a `DynArray`, or a plain **string** (strings are treated as their UTF-8 bytes). Byte-array results are always returned as plain arrays of numbers you can index with `[i]` or measure with `.length`.
:::

---

## Text encodings (UTF-8, UTF-16, UTF-32, ASCII)

Convert between AdeshLang strings and raw bytes for any Unicode encoding. All strict decoders throw a runtime error on invalid input; lossy/boolean variants let you handle malformed data gracefully.

### UTF-8

UTF-8 is the native string representation in AdeshLang, so round-tripping is exact for every Unicode code point.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `utf8Encode(text)` | Encode a string into UTF-8 bytes | `text: string` | `array<int>` (bytes) |
| `utf8Decode(bytes)` | Decode UTF-8 bytes to a string — **strict**, errors on invalid sequences | `bytes` | `string` |
| `utf8DecodeLossy(bytes)` | Decode UTF-8 bytes to a string, replacing invalid sequences with U+FFFD (`�`) | `bytes` | `string` |
| `isValidUtf8(bytes)` | `true` if the bytes are well-formed UTF-8 | `bytes` | `boolean` |
| `validateUtf8(bytes)` | Full validation; returns `null` on success, throws a diagnostic with the exact byte offset on failure | `bytes` | `null` |

```adesh
import Encoding;

let text = "AdeshLang 🚀 नमस्ते संस्कृत 你好 こんにちは";
let bytes = Encoding.utf8Encode(text);

print(Encoding.isValidUtf8(bytes));     // true
print(Encoding.utf8Decode(bytes) == text);   // true

// utf8Encode never fails; utf8Decode never loses data
let corrupted = [72, 101, 108, 128, 111];    // 0x80 is not valid UTF-8
print(Encoding.utf8DecodeLossy(corrupted));  // "Hel�o"
print(Encoding.isValidUtf8(corrupted));      // false
```

`validateUtf8` is the diagnostics version — it throws an error that pinpoints the corruption:

```adesh
import Encoding;

try {
    Encoding.validateUtf8([72, 101, 108, 128, 111]);   // 0x80 at index 3
} catch (e) {
    print(e);   // Invalid UTF-8 sequence at byte offset 3
}
```

### UTF-16 (LE & BE)

Two-byte code units with surrogate-pair support for emoji and other non-BMP characters. `utf16Encode`/`utf16Decode` are the convenience pair — **encode produces UTF-16 LE**, and **decode auto-detects the BOM** (defaulting to LE when none is present). The explicit `LE`/`BE` variants do exactly what their names say.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `utf16Encode(text)` | Encode to UTF-16 **LE** bytes | `text: string` | `array<int>` |
| `utf16Decode(bytes)` | Decode UTF-16 bytes; honors a leading BOM, defaults to LE | `bytes` | `string` |
| `utf16LEEncode(text)` / `utf16LEDecode(bytes)` | UTF-16 little-endian encode/decode | `text: string` / `bytes` | `array<int>` / `string` |
| `utf16BEEncode(text)` / `utf16BEDecode(bytes)` | UTF-16 big-endian encode/decode | `text: string` / `bytes` | `array<int>` / `string` |

```adesh
import Encoding;

let text = "AdeshLang 🚀";
let utf16le = Encoding.utf16LEEncode(text);
print(utf16le.length);                                 // 24 (12 code units × 2 bytes)
print(Encoding.utf16LEDecode(utf16le) == text);        // true

let utf16be = Encoding.utf16BEEncode(text);
print(Encoding.utf16BEDecode(utf16be) == text);        // true

// utf16Decode auto-detects the BOM, so either byte order round-trips
print(Encoding.utf16Decode(utf16be) == text);          // true
```

### UTF-32 (LE & BE)

Four-byte scalar values — one code point per code unit, no surrogate pairs. `utf32Encode`/`utf32Decode` behave like the UTF-16 convenience pair (encode = LE, decode = BOM-aware with LE default).

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `utf32Encode(text)` | Encode to UTF-32 **LE** bytes | `text: string` | `array<int>` |
| `utf32Decode(bytes)` | Decode UTF-32 bytes; honors a leading BOM, defaults to LE | `bytes` | `string` |
| `utf32LEEncode(text)` / `utf32LEDecode(bytes)` | UTF-32 little-endian encode/decode | `text: string` / `bytes` | `array<int>` / `string` |
| `utf32BEEncode(text)` / `utf32BEDecode(bytes)` | UTF-32 big-endian encode/decode | `text: string` / `bytes` | `array<int>` / `string` |

```adesh
import Encoding;

let text = "AdeshLang 🚀";
let utf32le = Encoding.utf32LEEncode(text);
print(utf32le.length);                                 // 44 (11 code points × 4 bytes)
print(Encoding.utf32LEDecode(utf32le) == text);        // true

let utf32be = Encoding.utf32BEEncode(text);
print(Encoding.utf32BEDecode(utf32be) == text);        // true
print(Encoding.utf32Decode(utf32be) == text);          // true (BOM-aware)
```

### ASCII (strict)

Strict 7-bit ASCII. Unlike the UTF encoders, `asciiEncode` and `asciiDecode` **reject** non-ASCII data instead of transcribing it.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `asciiEncode(text)` | Encode to ASCII bytes; errors if the string contains non-ASCII characters | `text: string` | `array<int>` |
| `asciiDecode(bytes)` | Decode ASCII bytes to a string; errors if any byte is > 127 | `bytes` | `string` |
| `isAscii(data)` | `true` if the string **or** byte array is entirely ASCII | `string \| bytes` | `boolean` |

```adesh
import Encoding;

let asciiText = "Hello World 123!";
let bytes = Encoding.asciiEncode(asciiText);           // [72, 101, ...]
print(Encoding.asciiDecode(bytes) == asciiText);       // true
print(Encoding.isAscii(asciiText));                    // true
print(Encoding.isAscii("café"));                       // false

// Strict: non-ASCII input throws
try {
    Encoding.asciiEncode("Hello 🚀");
} catch (e) {
    print(e);   // String contains non-ASCII characters
}
```

---

## Binary encodings (Base64, Base64URL, hex)

Turn raw bytes into printable text for storage or transport. Base64 is RFC 4648 standard (`+`, `/`, `=` padding); Base64URL is the URL-safe variant (`-`, `_`, no padding) used by JWTs and OAuth tokens; hex comes in lowercase and uppercase.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `base64Encode(bytes)` | Standard RFC 4648 Base64 with `=` padding | `bytes` | `string` |
| `base64Decode(b64Str)` | Decode standard Base64 — strict, errors on invalid input | `b64Str: string` | `array<int>` |
| `base64UrlEncode(bytes)` | URL-safe Base64: `+`→`-`, `/`→`_`, no padding | `bytes` | `string` |
| `base64UrlDecode(b64UrlStr)` | Decode URL-safe Base64; accepts padded or unpadded input | `b64UrlStr: string` | `array<int>` |
| `hexEncode(bytes)` | Encode to a lowercase hex string | `bytes` | `string` |
| `hexEncodeUpper(bytes)` | Encode to an uppercase hex string | `bytes` | `string` |
| `hexDecode(hexStr)` | Decode hex; rejects odd lengths and invalid characters | `hexStr: string` | `array<int>` |

```adesh
import Encoding;

let rawBytes = [65, 100, 101, 115, 104, 76, 97, 110, 103];   // "AdeshLang"
print(Encoding.base64Encode(rawBytes));         // "QWRlc2hMYW5n"
print(Encoding.hexEncode(rawBytes));            // "41646573684c616e67"
print(Encoding.hexEncodeUpper(rawBytes));       // "41646573684C616E67"

print(Encoding.hexDecode("41646573684c616e67"));           // [65, 100, ...]
print(Encoding.base64Decode("QWRlc2hMYW5n"));              // [65, 100, ...]
```

The difference between standard and URL-safe Base64 only shows up when the data produces `+`/`/` characters:

```adesh
import Encoding;

let bytes = [251, 255, 191];                     // base64 would contain + and /
print(Encoding.base64Encode(bytes));             // "+//+"
print(Encoding.base64UrlEncode(bytes));          // "-__-"
```

---

## Percent & form encodings

Encode text for URLs and HTML forms. Percent encoding (RFC 3986) keeps unreserved characters (`A-Z`, `a-z`, `0-9`, `-`, `_`, `.`, `~`) and percent-encodes everything else. Form encoding (`application/x-www-form-urlencoded`) additionally encodes spaces as `+`.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `percentEncode(text)` | RFC 3986 percent-encode a URI component | `text: string` | `string` |
| `percentDecode(text)` | Decode a percent-encoded string; errors on truncated/invalid escapes | `text: string` | `string` |
| `urlEncodeComponent(text)` | Alias of `percentEncode` | `text: string` | `string` |
| `urlDecodeComponent(text)` | Alias of `percentDecode` | `text: string` | `string` |
| `formEncode(text)` | Form-URL-encode; spaces become `+` | `text: string` | `string` |
| `formDecode(text)` | Form-URL-decode; `+` becomes space | `text: string` | `string` |

```adesh
import Encoding;

let path = "hello world & foo=bar?";
print(Encoding.percentEncode(path));    // "hello%20world%20%26%20foo%3Dbar%3F"
print(Encoding.percentDecode("hello%20world%20%26%20foo%3Dbar%3F") == path);   // true

// application/x-www-form-urlencoded (spaces -> '+')
let query = "name=Ajay Tainwala&city=New Delhi";
let formEnc = Encoding.formEncode(query);
print(formEnc);                         // "name%3DAjay+Tainwala%26city%3DNew+Delhi"
print(Encoding.formDecode(formEnc) == query);   // true
```

---

## Fixed-width integer & float encodings (endianness)

Serialize `u16`/`u32`/`u64`/`i16`/`i32`/`i64` and IEEE-754 `f32`/`f64` values to and from explicit little-endian (LE) or big-endian (BE) byte arrays. Use these when writing binary protocols, file formats, or network payloads where byte order matters.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `u16ToBytesLE(value)` / `u16ToBytesBE(value)` | u16 → 2 bytes (LE/BE) | `value: number` | `array<int>` |
| `bytesToU16LE(bytes)` / `bytesToU16BE(bytes)` | 2 bytes → u16 (needs ≥ 2 bytes) | `bytes` | `number` |
| `u32ToBytesLE(value)` / `u32ToBytesBE(value)` | u32 → 4 bytes (LE/BE) | `value: number` | `array<int>` |
| `bytesToU32LE(bytes)` / `bytesToU32BE(bytes)` | 4 bytes → u32 (needs ≥ 4 bytes) | `bytes` | `number` |
| `u64ToBytesLE(value)` / `u64ToBytesBE(value)` | u64 → 8 bytes (LE/BE) | `value: number` | `array<int>` |
| `bytesToU64LE(bytes)` / `bytesToU64BE(bytes)` | 8 bytes → u64 (needs ≥ 8 bytes) | `bytes` | `number` |
| `i16ToBytesLE(value)` / `i16ToBytesBE(value)` | Signed i16 → 2 bytes (LE/BE) | `value: number` | `array<int>` |
| `bytesToI16LE(bytes)` / `bytesToI16BE(bytes)` | 2 bytes → i16 (needs ≥ 2 bytes) | `bytes` | `number` |
| `i32ToBytesLE(value)` / `i32ToBytesBE(value)` | Signed i32 → 4 bytes (LE/BE) | `value: number` | `array<int>` |
| `bytesToI32LE(bytes)` / `bytesToI32BE(bytes)` | 4 bytes → i32 (needs ≥ 4 bytes) | `bytes` | `number` |
| `i64ToBytesLE(value)` / `i64ToBytesBE(value)` | Signed i64 → 8 bytes (LE/BE) | `value: number` | `array<int>` |
| `bytesToI64LE(bytes)` / `bytesToI64BE(bytes)` | 8 bytes → i64 (needs ≥ 8 bytes) | `bytes` | `number` |
| `f32ToBytesLE(value)` / `f32ToBytesBE(value)` | IEEE-754 f32 → 4 bytes (LE/BE) | `value: number` | `array<int>` |
| `bytesToF32LE(bytes)` / `bytesToF32BE(bytes)` | 4 bytes → f32 (needs ≥ 4 bytes) | `bytes` | `number` |
| `f64ToBytesLE(value)` / `f64ToBytesBE(value)` | IEEE-754 f64 → 8 bytes (LE/BE) | `value: number` | `array<int>` |
| `bytesToF64LE(bytes)` / `bytesToF64BE(bytes)` | 8 bytes → f64 (needs ≥ 8 bytes) | `bytes` | `number` |

```adesh
import Encoding;

let val = 305419896;                              // 0x12345678
print(Encoding.hexEncode(Encoding.u32ToBytesLE(val)));   // "78563412"
print(Encoding.hexEncode(Encoding.u32ToBytesBE(val)));   // "12345678"

print(Encoding.bytesToU32LE(Encoding.u32ToBytesLE(val)));   // 305419896
print(Encoding.bytesToU32BE(Encoding.u32ToBytesBE(val)));   // 305419896

// Floats round-trip exactly (IEEE-754)
let pi = 3.141592653589793;
print(Encoding.bytesToF64LE(Encoding.f64ToBytesLE(pi)));    // 3.141592653589793
print(Encoding.bytesToF64BE(Encoding.f64ToBytesBE(pi)));    // 3.141592653589793
```

The byte converters read from the **front** of the input and require at least the full width; they throw `Insufficient bytes for u32 (need 4)` when the array is too short.

---

## Bounds-checked buffer reads at offset

Read unsigned integers directly out of a larger buffer at a specific offset, with full bounds checking (reads past the end of the buffer throw instead of corrupting memory).

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `readU16LE(buffer, offset)` / `readU16BE(buffer, offset)` | Read u16 at `offset` (needs 2 bytes) | `buffer`, `offset: number` | `number` |
| `readU32LE(buffer, offset)` / `readU32BE(buffer, offset)` | Read u32 at `offset` (needs 4 bytes) | `buffer`, `offset: number` | `number` |
| `readU64LE(buffer, offset)` / `readU64BE(buffer, offset)` | Read u64 at `offset` (needs 8 bytes) | `buffer`, `offset: number` | `number` |

```adesh
import Encoding;

let buf = [0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0];
print(Encoding.readU16BE(buf, 0));   // 4660        (0x1234)
print(Encoding.readU32LE(buf, 0));   // 2018915346  (0x78563412)
print(Encoding.readU64BE(buf, 0));   // 1311768467463790320 (0x123456789ABCDEF0)

// Out-of-bounds reads throw a descriptive error instead of crashing
try {
    Encoding.readU32LE(buf, 6);      // 6 + 4 > 8
} catch (e) {
    print(e);   // Offset out of bounds: 6 + 4 > 8
}
```

:::tip
For building (not just reading) binary payloads, combine the `*ToBytes*` converters with a simple loop and `push`, or use `readU*` on the receiving side. The `createBinaryReader`/`createBinaryWriter` helpers are reserved low-level hooks; the `readU16LE`/`readU32LE`/`readU64LE` family plus the `*ToBytes*`/`bytesTo*` functions are the complete public API.
:::

---

## VarInt, ZigZag & LEB128

Variable-length integers pack small values into few bytes (1 byte for values < 128, up to 10 bytes for a full u64), saving space in wire protocols and binary formats.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `varIntEncode(value)` | Encode an unsigned u64 as a Base-128 VarInt | `value: number` | `array<int>` |
| `varIntDecode(bytes)` | Decode the first unsigned VarInt; errors on truncation/overflow | `bytes` | `number` |
| `zigzagEncode(value)` | Map a signed i64 to unsigned space: `0→0, -1→1, 1→2, -2→3, …` | `value: number` | `number` |
| `zigzagDecode(value)` | Inverse of `zigzagEncode` | `value: number` | `number` |
| `signedVarIntEncode(value)` | Encode a signed i64 as ZigZag + VarInt | `value: number` | `array<int>` |
| `signedVarIntDecode(bytes)` | Decode a signed VarInt back to an i64 | `bytes` | `number` |
| `uleb128Encode(value)` | WASM-compliant unsigned LEB128 | `value: number` | `array<int>` |
| `uleb128Decode(bytes)` | Decode a WASM ULEB128 | `bytes` | `number` |
| `sleb128Encode(value)` | WASM-compliant signed LEB128 | `value: number` | `array<int>` |
| `sleb128Decode(bytes)` | Decode a WASM SLEB128 | `bytes` | `number` |

```adesh
import Encoding;

// Unsigned VarInt — 300 needs 2 bytes
print(Encoding.varIntEncode(300));          // [172, 2]
print(Encoding.varIntDecode([172, 2]));     // 300

// ZigZag maps signed integers to non-negative numbers
print(Encoding.zigzagEncode(0));            // 0
print(Encoding.zigzagEncode(-1));           // 1
print(Encoding.zigzagEncode(1));            // 2
print(Encoding.zigzagEncode(-2));           // 3
print(Encoding.zigzagDecode(3));            // -2

// Signed VarInt = ZigZag + unsigned VarInt
let signedEnc = Encoding.signedVarIntEncode(-150);
print(signedEnc);                           // [171, 2]
print(Encoding.signedVarIntDecode(signedEnc));   // -150

// WASM binary-format LEB128
print(Encoding.uleb128Encode(624485));      // [229, 142, 38]
print(Encoding.uleb128Decode([229, 142, 38]));   // 624485
print(Encoding.sleb128Decode(Encoding.sleb128Encode(-123456)));   // -123456
```

---

## Byte Order Mark (BOM)

Detect, strip, and prepend BOM headers so multi-encoding data can be identified unambiguously.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `detectBom(bytes)` | Identify the BOM; one of `"UTF-8"`, `"UTF-16LE"`, `"UTF-16BE"`, `"UTF-32LE"`, `"UTF-32BE"`, or `"NONE"` | `bytes` | `string` |
| `removeBom(bytes)` | Strip a leading BOM; returns `{ bom, bytes }` | `bytes` | `object` |
| `addBom(bytes, encodingName?)` | Prepend the BOM for an encoding name (defaults to `"UTF-8"`); accepts `UTF-8`, `UTF-16LE/BE`, `UTF-32LE/BE` | `bytes`, `encodingName?: string` | `array<int>` |

```adesh
import Encoding;

// UTF-8 BOM (EF BB BF) followed by "Hello"
let utf8BomBytes = [0xEF, 0xBB, 0xBF, 72, 101, 108, 108, 111];
print(Encoding.detectBom(utf8BomBytes));        // "UTF-8"

let stripped = Encoding.removeBom(utf8BomBytes);
print(stripped.bom);                            // "UTF-8"
print(Encoding.utf8Decode(stripped.bytes));     // "Hello"

// Re-tag for a different encoding
let retagged = Encoding.addBom(stripped.bytes, "UTF-16LE");
print(Encoding.detectBom(retagged));            // "UTF-16LE"

print(Encoding.detectBom([72, 105]));           // "NONE"
```

`addBom` accepts encoding names case-insensitively (`"UTF-8"`/`"UTF8"`, `"UTF-16LE"`/`"UTF16LE"`, `"UTF-32BE"`/`"UTF32BE"`, etc.). Unrecognized names return the bytes unchanged.

---

## Complete example

A realistic end-to-end pipeline: build a binary network packet (like the examples suite), transport it as a URL-safe token, and reconstruct the original data.

```adesh
import Encoding;

print("--- 1. Build a UTF-8 payload ---");
let message = "Login request from Ajay 🚀";
let payload = Encoding.utf8Encode(message);
print("payload bytes:", payload.length);

print("--- 2. Frame it as a binary packet (AD + version u16 BE + cmd u8 + length u32 BE) ---");
let packet = [0x41, 0x44];                       // magic "AD"
let i = 0;
let versionBytes = Encoding.u16ToBytesBE(1);
while (i < versionBytes.length) { packet.push(versionBytes[i]); i = i + 1; }
packet.push(5);                                   // command type LOGIN_CMD
let lenBytes = Encoding.u32ToBytesBE(payload.length);
i = 0;
while (i < lenBytes.length) { packet.push(lenBytes[i]); i = i + 1; }
i = 0;
while (i < payload.length) { packet.push(payload[i]); i = i + 1; }
print("packet hex:", Encoding.hexEncode(packet));

print("--- 3. Read the header back (bounds-checked) ---");
print("version:", Encoding.readU16BE(packet, 2));
print("cmd:", packet[4]);
print("payload length:", Encoding.readU32BE(packet, 5));

print("--- 4. Extract + decode the payload ---");
let extracted = [];
i = 9;
while (i < packet.length) { extracted.push(packet[i]); i = i + 1; }
print("decoded payload:", Encoding.utf8Decode(extracted));

print("--- 5. Transport the packet as a URL-safe token ---");
let token = Encoding.base64UrlEncode(packet);
print("token:", token);
let received = Encoding.base64UrlDecode(token);
print("round-trip intact:", Encoding.hexEncode(received) == Encoding.hexEncode(packet));
```

---

## Notes & edge cases

- **Bytes in, bytes out.** Functions documented as taking `bytes` accept a byte array, a `RawArray("u8", …)`, or a string (treated as UTF-8). Results are always plain arrays of numbers.
- **Strict vs lossy.** `utf8Decode`, `asciiEncode`, `asciiDecode`, `base64Decode`, `base64UrlDecode`, `hexDecode`, `percentDecode`, `formDecode`, and `validateUtf8` throw on malformed input. `utf8DecodeLossy`, `isValidUtf8`, and `isAscii` never throw.
- **Endianness conventions.** `utf16Encode`/`utf32Encode` produce **little-endian**; `utf16Decode`/`utf32Decode` auto-detect a leading BOM and default to little-endian otherwise.
- **Byte-converter width checks.** `bytesToU16LE/BE` need ≥ 2 bytes, `bytesToU32LE/BE` and `bytesToF32LE/BE` need ≥ 4, `bytesToU64LE/BE`, `bytesToI64LE/BE`, and `bytesToF64LE/BE` need ≥ 8 — otherwise they throw.
- **Buffer reads are bounds-checked.** `readU16LE`, `readU32LE`, `readU64LE` and their BE variants throw `Offset out of bounds` instead of reading past the buffer.
- **VarInt/LEB128 decoders read one value.** They decode the first complete value from the front of the array; trailing bytes are ignored. Truncated sequences and u64/i64 overflow (more than 10 bytes) throw.
- **`removeBom` returns an object** `{ bom, bytes }` — use `result.bom` and `result.bytes`; `detectBom` returns the encoding name string (or `"NONE"`).
- **Backend parity.** Implemented natively in Rust, so behavior is identical on Interpreter, Bytecode VM, JIT, Native JIT, LLVM AOT, and WebAssembly.
- **Pair with `Crypto`.** `Encoding.base64Encode`/`hexEncode` work hand-in-hand with the `Crypto` library's byte-array digests and signatures when you need to print or store them.

## Source & examples

- Implementation: `src/runtime/stdlib_src/encoding/` (`utf.rs`, `base64.rs`, `hex.rs`, `percent.rs`, `binary.rs`, `varint.rs`, `bom.rs`, `api.rs`)
- API wrappers: `src/stdlib/Encoding.adesh`
- Runnable examples: `examples/Libraries/encoding/` (`basic_utf8.adesh`, `utf8_unicode.adesh`, `utf8_validation.adesh`, `utf16_utf32.adesh`, `ascii_strict.adesh`, `base64_hex.adesh`, `base64_url_tokens.adesh`, `hex_identifiers.adesh`, `percent_form.adesh`, `binary_integers.adesh`, `varint_leb128.adesh`, `bom_handling.adesh`, `realworld_network_packet.adesh`, `realworld_wasm_header.adesh`, `realworld_file_transcode.adesh`)
- API reference (from the repo): `examples/Libraries/encoding/README.md`
- Unit/integration tests: `tests/encoding_tests.rs`

## Related

- [Builtin Libraries Overview](overview)
- [Standard Library Overview](../stdlib/overview)
- [Crypto Library](crypto) — hashing/encryption primitives that produce and consume byte arrays
- [IO Library](io) — streaming and binary I/O, including endian-aware serialization
