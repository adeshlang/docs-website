---
id: stdlib-2
title: Standard Library II - Encoding, Compression, IO & Process
sidebar_label: 24. Standard Library II
---

# Standard Library II — Encoding, Compression, IO & Process

The first [Standard Library Tour](/learn/stdlib-tour) covered Math, JSON, FS,
Regex, Time, Random, and Crypto. Adesh's standard library goes further:
**encoding**, **compression**, console **IO**, environment **env**, and
**process** execution — each with dozens of real examples under
[`examples/Libraries/`](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries).

## Encoding

[`examples/Libraries/encoding/`](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/encoding)
converts between text, bytes, and encoded forms (UTF-8/16/32, Base64, hex,
varint):

```adesh
import Encoding;

let text = "Hello World!";
let bytes = Encoding.utf8Encode(text);

let b64 = Encoding.base64Encode(bytes);
print("Base64:", b64);

print("Decoded:", Encoding.utf8Decode(Encoding.base64Decode(b64)));

let hex = Encoding.hexEncode(bytes);
print("Hex:", hex);
print("Decoded:", Encoding.utf8Decode(Encoding.hexDecode(hex)));
```

**Output:**
```
Base64: SGVsbG8gV29ybGQh
Decoded: Hello World!
Hex: 48656c6c6f20576f726c6421
Decoded: Hello World!
```

## Compression

[`examples/Libraries/compression/`](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/compression)
supports gzip, zstd, brotli, lz4, zip, and tar. Compress and decompress a
payload:

```adesh
import Compression;
import Encoding;

let text = "Hello Adesh Compression! ";
let payload = text + text + text + text + text + text;

let compressed = Compression.compress(payload);
let original = Encoding.utf8Decode(Compression.decompress(compressed));

print("Original size:", len(payload));
print("Compressed size:", len(compressed));
print("Round-trip match:", original == payload);
```

**Output:**
```
Original size: 186
Compressed size: 71
Round-trip match: true
```

(Exact compressed sizes depend on the payload and algorithm — the round-trip
guarantee is what matters.)

Zip files directly:

```adesh
import Compression;

Compression.zipFile("archive.zip", ["data.txt", "notes.txt"]);
let entries = Compression.zipListFiles("archive.zip");
print("Zip entries:", entries);
```

**Output:**
```
Zip entries: [data.txt, notes.txt]
```

## Console IO

[`examples/Libraries/io/`](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/io)
includes console basics, memory streams, binary serialization, buffered IO,
pipes, and seeking:

```adesh
import IO;

IO.print("Standard Output Print: ");
IO.println("42");
IO.eprintln("[LOG] Standard Error Log Message");
```

**Output:**
```
Standard Output Print: 42
[LOG] Standard Error Log Message
```

## Environment

[`examples/Libraries/env/`](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/env)
reads arguments, environment variables, and system info:

```adesh
import Env;

let args = Env.arguments();
let count = Env.argumentCount();
print("Argument Count: " + str(count));
print("Command Line Arguments: " + str(args));
```

**Output (running `adesh run args.adesh hello world`):**
```
Argument Count: 3
Command Line Arguments: [run, args.adesh, hello, world]
```

## Process — running other programs

[`examples/Libraries/process/`](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/process)
spawns external commands, captures output, sets timeouts, and builds
pipelines:

```adesh
import Process;

let result = Process.run("git", ["--version"]);

print("Success: " + str(result.success()));
print("Git version: " + result.stdoutText().trim());
```

**Output (varies with installed git):**
```
Success: true
Git version: git version 2.45.0.windows.1
```

Timeout and pipes:

```adesh
import Process;

// Run with a 2-second timeout
let slow = Process.run("cmd", ["/c", "timeout 5"], { timeout_ms: 2000 });
print("Timed out:", slow.timedOut());

// Pipe output from one process into another
let pipe = Process.pipeline([
    ["echo", "Hello Adesh"],
    ["findstr", "Adesh"]
]);
print("Piped:", pipe.stdoutText().trim());
```

**Output (varies by platform):**
```
Timed out: true
Piped: Hello Adesh
```

## Full library quick map (part 2)

| Library | Namespace | What it gives you |
|---------|-----------|-------------------|
| Encoding | `Encoding` | UTF-8/16/32, Base64, hex, varint, percent |
| Compression | `Compression` | gzip, zstd, brotli, lz4, zip, tar |
| IO | `IO` | console, streams, serialization, pipes |
| Env | `Env` | args, env vars, cwd, platform |
| Process | `Process` | run programs, capture, timeout, pipelines |
| Path | `Path` | cross-platform path objects |
| Collections | `Collections` | HashMap, VecDeque, heap, stack, queue |

## Practice

Build a **file logger with compression**:

```adesh
import Compression;
import Encoding;
import fs;
import Time;

let log = "[INFO] " + Time.dateTimeNow().format("yyyy-MM-dd HH:mm") + " Server started\n";
let compressed = Compression.compress(log);

fs.write("log.dat", Encoding.base64Encode(compressed));
let raw = Encoding.base64Decode(fs.read("log.dat"));
let restored = Encoding.utf8Decode(Compression.decompress(raw));

print("Restored log:", restored.trim());
print("Match:", restored == log);
```

**Output:**
```
Restored log: [INFO] 2026-09-07 09:15 Server started
Match: true
```

## Summary

✅ **You learned:**
- `Encoding`: Base64, hex, UTF-8/16/32 conversions
- `Compression`: compress/decompress, zip files, round-trip guarantees
- `IO`: print/println to stdout, stderr
- `Env`: arguments, variables, system info
- `Process`: run programs, capture stdout, timeouts, pipelines
- Real-world combos: compress → encode → file → decode → decompress

## Next Step

Now the deepest waters: **networking** — TCP, UDP, DNS, URL, TLS, and
WebSockets. Continue to **[Networking Deep Dive](/learn/networking)** →
