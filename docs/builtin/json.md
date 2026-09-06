---
id: json
title: JSON Library
sidebar_label: JSON
---

# JSON Library

The **JSON** builtin library is AdeshLang's language-level JSON system. It parses JSON text into native values (objects, arrays, strings, numbers, booleans, `null`), serializes values back to JSON, validates input without throwing, and round-trips through files and byte arrays — all exposed on a single `JSON` namespace.

Because it is built into the runtime (backed by `serde_json`), it needs no external dependencies and works identically on every backend, including WebAssembly.

## Namespaces

| Namespace | What it provides |
| :--- | :--- |
| `JSON` | All parsing, serialization, validation, and builder functions. |
| `JSON.object` / `JSON.array` | Constructors for building JSON values in code. |
| `JSON.encode` / `JSON.decode` | Aliases for `stringify` / `parse`. |

## Importing the library

`JSON` is **globally available** — no import is required:

```adesh
let obj = JSON.parse('{"name": "AdeshLang"}');
```

Importing it is optional but makes the dependency explicit, and works case-insensitively:

```adesh
import json;       // or import JSON; or import "json";
import { parse, stringify } from "json";   // selective import
```

:::note
The legacy low-level names `json_parse(text)` and `json_stringify(value)` are also registered as global functions. Prefer the `JSON.*` namespace — the primitives are an implementation detail.
:::

---

## Methods: Parse

Turn JSON text into native AdeshLang values. JSON objects become objects (accessed with `.field`), arrays become arrays (indexed with `[i]`), and numbers keep their type (integers stay integers).

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `JSON.parse(text, maxDepth?)` | Parse JSON text; throws with `line`/`column` diagnostics on malformed input | `text: string`, `maxDepth?: int` | `value` |
| `JSON.decode(text)` | Alias of `JSON.parse` | `text: string` | `value` |
| `JSON.tryParse(text, maxDepth?)` | Parse without throwing; returns `null` on any error | `text: string`, `maxDepth?: int` | `value \| null` |
| `JSON.isValid(text)` | `true` if `text` is well-formed JSON (no parse performed) | `text: string` | `boolean` |
| `JSON.parseFile(path)` | Read a file and parse its contents | `path: string` | `value` |
| `JSON.parseBytes(bytes)` | Parse UTF-8 bytes (string, `array<int>`, or `RawArray("u8", …)`) | `bytes` | `value` |

```adesh
// Parse with backtick template strings — no escaping needed:
let text = `
{
    "name": "AdeshLang",
    "version": 3,
    "stable": true,
    "tags": ["lang", "fast"]
}
`;
let lang = JSON.parse(text);

print(lang.name);        // AdeshLang
print(lang.version);     // 3
print(lang.stable);      // true
print(lang.tags[0]);     // lang
```

### Safe parsing

`JSON.tryParse` returns `null` on malformed input instead of throwing, and `JSON.isValid` lets you guard before parsing:

```adesh
let good = '{"status": 200, "ok": true}';
let bad  = '{status: 200}';            // unquoted key — not valid JSON

print(JSON.isValid(good));             // true
print(JSON.isValid(bad));              // false

let ok  = JSON.tryParse(good);
let err = JSON.tryParse("not json at all");

print(ok.status);                      // 200
print(err);                            // null (safe, no crash)
```

:::warning
`JSON.parse` **throws** on invalid input with a diagnostic that includes `line` and `column` (e.g. `JSON parse error: EOF while parsing a value at line 1, column 9`). Use `JSON.tryParse` or guard with `JSON.isValid` when the input is untrusted.
:::

---

## Methods: Serialize

Turn native values into JSON text.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `JSON.stringify(value)` | Compact JSON (no whitespace) | `value` | `string` |
| `JSON.stringifyCompact(value)` | Alias of `JSON.stringify` | `value` | `string` |
| `JSON.stringifyPretty(value)` | Pretty-printed JSON (2-space indent) | `value` | `string` |
| `JSON.encode(value)` | Alias of `JSON.stringify` | `value` | `string` |
| `JSON.stringifyFile(path, value, pretty?)` | Write the serialized value to a file; returns `true` | `path: string`, `value`, `pretty?: boolean` | `boolean` |
| `JSON.stringifyBytes(value)` | Serialize to UTF-8 **bytes** (`array<u8>`) | `value` | `array<u8>` |

```adesh
let server = { host: "127.0.0.1", port: 8080, tls: false };

print(JSON.stringify(server));
// {"host":"127.0.0.1","port":8080,"tls":false}

print(JSON.stringifyPretty(server));
// {
//   "host": "127.0.0.1",
//   "port": 8080,
//   "tls": false
// }

JSON.stringifyFile("config.json", server, true);   // pretty output to disk
let back = JSON.parseFile("config.json");
print(back.port);                                  // 8080
```

:::tip
For byte-level transport (WebSockets, protobuf-style framing), pair `JSON.stringifyBytes` with `JSON.parseBytes` — the round-trip preserves the same values.
:::

---

## Methods: Format & Validate Text

Reformat an existing JSON **string** without touching the underlying data.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `JSON.minify(text)` | Strip all insignificant whitespace | `text: string` | `string` |
| `JSON.pretty(text)` | Pretty-print an existing JSON string | `text: string` | `string` |

```adesh
let min = JSON.minify('{  "a" : 1,  "b" : [1, 2, 3]  }');
print(min);            // {"a":1,"b":[1,2,3]}

let fmt = JSON.pretty(min);
print(fmt);            // pretty-printed, 2-space indent
```

---

## Methods: Build JSON in Code

Construct JSON values programmatically instead of writing raw strings.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `JSON.object()` | Create an empty JSON object (assign fields with `.field = ...`) | — | `object` |
| `JSON.array()` | Create an empty JSON array (append with `push`) | — | `array` |
| `JSON.from(value)` | Convert any value/collection into a JSON-compatible value | `value` | `value` |

```adesh
let server = JSON.object();
server.host    = "127.0.0.1";
server.port    = 8080;
server.tls     = false;
server.methods = ["GET", "POST"];        // nested arrays work directly

let db = JSON.object();
db.host = "localhost";
db.port = 5432;
server.database = db;                     // nested objects work directly

print(server.database.host);              // localhost
print(JSON.stringifyPretty(server));

let arr = JSON.array();
push(arr, 1); push(arr, 2); push(arr, 3);
print(JSON.stringify(arr));               // [1,2,3]
```

---

## Complete example

A round-trip that builds a config object, writes it to disk, reads it back, and validates the result.

```adesh
import json;

print("--- JSON round-trip ---");

let config = JSON.object();
config.app       = "adesh-service";
config.port      = 8080;
config.replicas  = 3;
config.features  = ["metrics", "tracing"];
config.debug     = false;

JSON.stringifyFile("config.json", config, true);
print("Wrote config.json");

let loaded = JSON.parseFile("config.json");
print("loaded:", loaded != null);
print("app:", loaded.app);
print("port:", loaded.port);

let json_text = JSON.stringify(loaded);
print("compact:", json_text);
print("minify(pretty):", JSON.minify(JSON.pretty(json_text)));

let bad = '{oops:';
print("guarded:", JSON.tryParse(bad) == null ? "returned null" : "unexpected");
```

---

## Notes & edge cases

- **Type mapping**: JSON `null` → `null`; `true`/`false` → booleans; integers stay integers (`int`), floats → numbers; strings → strings; objects/arrays map to native objects/arrays.
- **Depth limit**: parsing enforces a maximum nesting depth of **128** by default to prevent stack overflows from maliciously nested input. `JSON.parse`/`JSON.tryParse` accept an optional `maxDepth` override.
- **Errors**: `JSON.parse` throws with `line`/`column` diagnostics; `JSON.tryParse` swallows errors and returns `null`; `JSON.isValid` never parses.
- **Duplicate/order**: object key order is preserved on stringify; `JSON.isValid` is a pure syntax check.
- **Backend parity**: fully supported on Interpreter, Bytecode VM, JIT, Native JIT, LLVM AOT, and WebAssembly.
- **UTF-8**: `JSON.parseBytes`/`JSON.stringifyBytes` assume UTF-8; invalid UTF-8 in `parseBytes` is rejected with an error.
- Always sanitize/validate JSON from untrusted sources before using it in security-sensitive paths (`JSON.tryParse` + explicit field checks).

## Source & examples

- Implementation: `src/runtime/stdlib_src/json/` (`parse.rs`, `stringify.rs`, `extended.rs`)
- Runnable examples: `examples/Libraries/json/` (`basics.adesh`, `validation.adesh`, `formatting.adesh`, `builders.adesh`, `file_io.adesh`, `bytes.adesh`, `error_handling.adesh`, `all.adesh`)
- API reference (from the repo): `examples/Libraries/json/README.md`

## Related

- [Builtin Libraries Overview](overview)
- [Standard Library Overview](overview)
- [JSON Module](json) — short module overview
