---
id: overview
title: Standard Library Overview
sidebar_label: Overview
---

# Standard Library Overview

AdeshLang standard library is built around practical runtime utilities and namespaces.

## Core design goals

- Predictable behavior across backends
- Strong defaults for safety-sensitive operations
- Ergonomic APIs for everyday tasks

## Main module areas

- **Core built-ins**: printing, type/length helpers, object/array helpers
- **Collections**: `map`, `filter`, `reduce`
- **Math**: `Math.*` constants, random, arithmetic/trig/log helpers
- **JSON**: `json_parse`, `json_stringify`
- **Async runtime**: promises, sleep/delay, timeout/interval timers
- **System**: argv/env and runtime process helpers
- **Concurrency**: parallel helper functions
- **FS/HTTP**: larger namespaces for filesystem and network operations

## Typical usage pattern

```adesh
let data = [1, 2, 3, 4, 5];
let squares = map(data, fn(x) { return x * x; });
let total = reduce(squares, fn(a, b) { return a + b; }, 0);

print("count:", len(data));
print("sum:", total);
print("sqrt:", Math.sqrt(total));
```

:::tip
For the complete, self-contained reference to the builtin libraries shipped inside the language (including an in-depth **Math** library guide), see the [**Builtin Libraries**](../builtin/overview) section.
:::

## Next pages

- [Built-in Functions](builtins)
- [Math Module](math)
- [FS Module](fs)
- [HTTP Module](http)
- [JSON Module](json)
- [Concurrency Module](concurrency)
- [Process Module](../builtin/process) — builtin library for spawning and controlling child processes
- [Path Module](../builtin/path) — builtin library for cross-platform path objects and FS integration
- [IO Module](../builtin/io) — builtin library for console, in-memory, buffered, and binary streams
- [Time Module](../builtin/time) — builtin library for durations, dates, and timezone-aware date-times
- [Regex Module](../builtin/regex) — builtin library for regular expressions
- [Env Module](../builtin/env) — builtin library for environment variables, directories, platform info, and command-line args
- [Random Module](../builtin/random) — builtin library for PRNG, sampling, and statistical distributions
- [Collections Module](../builtin/collections) — builtin library for the 15 collection data structures
- [Crypto Module](../builtin/crypto) — builtin library for hashing, encryption, signatures, and JWT
- [Encoding Module](../builtin/encoding) — builtin library for text encodings, Base64/hex, endian serialization, and VarInt
- [Compression Module](../builtin/compression) — builtin library for lossless codecs, archives, streaming, and checksums
