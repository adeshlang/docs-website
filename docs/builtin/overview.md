---
id: overview
title: Standard Libraries Overview
sidebar_label: Overview
---

# Standard Libraries

AdeshLang ships a set of **builtin libraries** — namespaces that are compiled directly into the runtime and available in every program without downloading anything. They provide high-performance, ready-to-use functionality for numeric math, complex numbers, random numbers, file access, JSON, HTTP, concurrency, and more.

Unlike modules you write yourself or pull from a package registry, builtin libraries:

- Are always available — no external files, manifests, or network access required.
- Are **case-insensitive to import** and resolve to the registered namespace (`import Math` and `import math` both work).
- Are implemented natively (in Rust) for speed, with the same behavior across every backend (Interpreter, Bytecode VM, JIT, Native JIT, AOT, WebAssembly, GPU/MLIR).

## How to use a builtin library

Builtin libraries are used through the `import` statement. The import binds the library's **namespace** under a name you can call methods on.

```adesh
import Math;     // real-number math
import cmath;    // complex-number math

print(Math.sqrt(16.0));   // 4.0
print(cmath.sqrt(-4.0));  // 0.0 + 2.0j
```

You can also import individual members:

```adesh
import { sqrt, pow } from "Math";
print(sqrt(25.0));  // 5.0
```

:::tip
Every builtin library follows the same mental model: **import the namespace, then call `Namespace.method(...)`**. Constants are exposed as namespace properties such as `Math.PI`.
:::

## Available builtin libraries

| Library | Namespace | Purpose | Status |
| :--- | :--- | :--- | :--- |
| [Math](math) | `Math` | Real-number arithmetic, trigonometry, logarithms, random numbers, number theory, and special functions | Documented |
| `cmath` | `cmath` | Complex-number math (part of the Math library) | Documented |
| [FS](fs) | `fs` | Filesystem operations, path utilities, hashing, watching, and batch/transactional helpers | Documented |
| [Path](path) | `Path` | Cross-platform path objects: joining, components, normalization, and FS integration | Documented |
| [Process](process) | `Process` | Spawn and control child processes: run, capture, pipeline, timeouts, environment, and process info | Documented |
| [JSON](json) | `JSON` | JSON parsing, serialization, validation, and builders | Documented |
| [IO](io) | `IO` | Console I/O, in-memory/buffered streams, binary serialization with endianness, pipes, and adapters | Documented |
| [Time](time) | `Time` | Durations, instants, dates, naive/UTC/offset/zoned date-times, parsing, formatting, stopwatches | Documented |
| [Regex](regex) | `Regex` | Regular expressions: match, find, capture groups, replace, split, and flags | Documented |
| [Env](env) | `Env` | Environment variables, `.env` files, directories, platform/system info, and command-line args | Documented |
| [Random](random) | `Random` | PRNG, unbiased ints/floats, bytes, strings, UUIDs, sampling, seeded `Rng`, and distributions | Documented |
| [Collections](collections) | `Collections` | 15 data structures (Vec, maps, sets, heaps, queues, stacks) plus `map`/`filter`/`reduce` | Documented |
| [Crypto](crypto) | `Crypto` | Hashing, HMAC/HKDF, Argon2id passwords, AEAD encryption, signatures, key exchange, JWT, and encodings | Documented |
| [Encoding](encoding) | `Encoding` | Text encodings (UTF-8/16/32, ASCII), Base64/Base64URL/hex, percent & form encoding, endian binary serialization, VarInt/LEB128, and BOM handling | Documented |
| [Compression](compression) | `Compression` | 7 lossless codecs (Zstd, GZIP, Brotli, LZ4, XZ, DEFLATE, ZLIB), adaptive compression, streaming & seekable archives, ZIP/TAR, parallel & file compression, auto-detection, and checksums | Documented |
| [Net](net) | `Net` | Cross-platform networking primitives: TCP client/server, UDP sockets, IP & socket address parsing, interface enumeration, and SSRF policy sandboxing | Documented |
| [URL](url) | `URL` | WHATWG URL parsing, protocol/host components, normalization, and URLSearchParams query parameter manipulation | Documented |
| [DNS](dns) | `DNS` | High-performance DNS resolution, record queries (A, AAAA, MX, TXT, NS, CNAME, SOA, SRV, CAA), service discovery, LRU caching, and rebinding policy | Documented |
| [TLS](tls) | `TLS` | Secure TLS client/server connections, certificate verification, ALPN negotiation, STARTTLS wrapping, and handshake diagnostics | Documented |
| `http` | `http` | HTTP client requests | Documented |
| `concurrency` | `parallel_*` | Parallel helpers and threading | Documented |
| `print` | global | Rich console output, styling, and pretty-print | Documented |
| [Input & TUI](input) | `input.*` | 18+ Interactive terminal widgets: prompts, selectors, datepicker, datetime, visual diff, table with sub-properties, PIN/OTP pad, slider, color, hotkey, and test mocks | Documented |

## Library reference pages

- [Input & TUI Library](input) — complete reference for `input`, `input.table`, `input.datepicker`, `input.datetime`, `input.diff`, `input.pin`, and all 18 interactive widgets.
- [Math Library](math) — complete reference for the `Math` and `cmath` namespaces.
- [FS Library](fs) — complete reference for the `fs`, `fs.path`, `fs.async`, `fs.tx`, `fs.snapshot`, `fs.batch`, and `fs.fsql` namespaces.
- [Path Library](path) — complete reference for the `Path` class, components, and builder.
- [Process Library](process) — complete reference for the `Process`, `ProcessBuilder`, and `ChildProcess` namespaces.
- [JSON Library](json) — complete reference for the `JSON` namespace.
- [IO Library](io) — complete reference for the `IO` stream classes and combinators.
- [Time Library](time) — complete reference for the `Time` date/time classes, parsing, and formatting.
- [Regex Library](regex) — complete reference for the `Regex` namespace, `Match`, and `Captures`.
- [Env Library](env) — complete reference for the `Env` namespace: environment variables, directories, platform info, and command-line args.
- [Random Library](random) — complete reference for the `Random` namespace, seeded `Rng`, and distributions.
- [Collections Library](collections) — complete reference for the 15 `Collections` data structures and `map`/`filter`/`reduce`.
- [Crypto Library](crypto) — complete reference for the `Crypto` namespace: hashing, MACs, KDFs, passwords, AEAD, signatures, JWT, and encodings.
- [Encoding Library](encoding) — complete reference for the `Encoding` namespace: text encodings, Base64/Base64URL/hex, percent & form encoding, endian binary serialization, VarInt/LEB128, and BOM handling.
- [Compression Library](compression) — complete reference for the `Compression` namespace: codecs, adaptive compression, streaming & seekable archives, ZIP/TAR, parallel & file compression, auto-detection, and checksums.
- [Net Library](net) — complete reference for the `Net` namespace: TCP client/server, UDP datagrams, IP/socket addresses, interface enumeration, and SSRF sandboxing.
- [URL Library](url) — complete reference for the `URL` namespace: WHATWG URL parsing and URLSearchParams manipulation.
- [DNS Library](dns) — complete reference for the `DNS` namespace: hostname resolution, record queries (A, AAAA, MX, TXT, NS, CNAME, SOA, SRV, CAA), service discovery, LRU caching, and security policies.
- [TLS Library](tls) — complete reference for secure TLS clients, server listeners, STARTTLS wrapping, certificate verification, ALPN negotiation, and handshake tracing.

## Related

- [Standard Library Overview](overview) — the full list of global built-in functions.
- [Built-in Functions](builtins) — quick reference for global functions and namespaces.
