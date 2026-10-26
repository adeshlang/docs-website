---
id: io
title: IO Library
sidebar_label: IO
---

# IO Library

The **IO** builtin library is Adesh's streaming subsystem: console I/O, in-memory readers/writers, buffered streams, binary serialization with configurable endianness, pipes, and stream adapters (tees, limits, counters). It is **UTF-8 first**, deterministic, and behaves identically on every backend (Interpreter, Native JIT, AOT, and WebAssembly).

The high-level API is written in Adesh itself (`src/stdlib/IO.adesh`) and sits on top of native `io_*` primitives (console read/write, byte packing/unpacking, UTF-8 conversion).

## Classes

| Class | What it provides |
| :--- | :--- |
| `IO` | Facade with static helpers (`IO.print`, `IO.println`, `IO.readLine`, stream constructors, …) |
| `Reader` / `Writer` | Abstract base interfaces for all streams |
| `MemoryReader` / `MemoryWriter` | Byte-backed in-memory streams (seekable) |
| `BufferedReader` / `BufferedWriter` | Chunked buffering for performance |
| `BinaryReader` / `BinaryWriter` | Fixed-width primitive serialization with endianness |
| `TextReader` / `TextWriter` | Text-oriented adapters over a reader/writer |
| `ByteBuffer` / `StringBuffer` | Raw byte buffer and string builder |
| `Pipe` / `NullReader` / `NullWriter` | Communication channel and discard/empty streams |
| `TeeReader` / `TeeWriter` | Duplicate reads/writes across streams |
| `LimitedReader` / `CountingReader` / `CountingWriter` | Cap output / count bytes |
| `StdinReader` / `StdoutWriter` / `StderrWriter` | Console-backed streams |
| `IOError` / `IOResult` | Error type and `ok`/`err` result wrapper |

## Importing the library

Unlike `Math`/`fs`/`JSON`, the `IO` module is loaded from source — **import it** to make it available. The import is case-insensitive:

```adesh
import IO;                        // or import io; or import "std:IO";
import { MemoryReader, IO } from "IO";   // selective import also works
```

:::note
Classes are accessed through the namespace (`new IO.MemoryReader(...)`), or bound directly with a selective import. Every stream implements the `Reader`/`Writer` method set, so adapters compose freely.
:::

---

## Methods: Console I/O

Print to stdout/stderr and read from stdin — the high-level, always-available entry points.

| Function | Description | Returns |
| :--- | :--- | :--- |
| `IO.print(val)` | Write `val` to stdout (no newline) | `null` |
| `IO.println(val)` | Write `val` to stdout with a trailing newline | `null` |
| `IO.eprint(val)` | Write `val` to stderr (no newline) | `null` |
| `IO.eprintln(val)` | Write `val` to stderr with a trailing newline | `null` |
| `IO.readLine()` | Read one line from stdin (trailing newline stripped) | `string` |
| `IO.readChar()` | Read a single character from stdin | `string` |
| `IO.stdin()` | A `StdinReader` for use with stream APIs | `StdinReader` |
| `IO.stdout()` | A `StdoutWriter` for use with stream APIs | `StdoutWriter` |
| `IO.stderr()` | A `StderrWriter` for use with stream APIs | `StderrWriter` |

```adesh
import IO;

IO.println("Hello, Adesh!");
IO.eprintln("[log] wrote to stderr");
IO.print("No newline here -> ");

let name = IO.readLine();       // interactive
IO.println("Hi, " + name);
```

---

## Interfaces: `Reader` & `Writer`

The base contracts implemented by every stream class.

**`Reader`** methods:

| Method | Description |
| :--- | :--- |
| `.read(buf, off, length)` | Fill `buf` starting at `off`; returns bytes read |
| `.readBytes(length)` | Read up to `length` bytes as an array |
| `.readToEnd()` | Read everything remaining as a UTF-8 string |
| `.readLine()` | Read the next line (without `\n`/`\r\n`); `null` at EOF |
| `.readLines()` | Read all remaining lines into an array |
| `.readUntil(delim)` | Read characters until (and including) `delim` |

**`Writer`** methods:

| Method | Description |
| :--- | :--- |
| `.write(buf, off, length)` | Write up to `length` bytes from `buf`; returns bytes written |
| `.writeLine(s)` | Write `s` followed by a newline |
| `.writeLines(lines)` | Write each line in the array |
| `.flush()` | Force buffered data out |

`SeekableStream` adds `.seek(offset, whence)` (whence: `"start"` / `"current"` / `"end"`), `.rewind()`, `.skip(n)`, `.position()`, `.length()`, `.remaining()`.

---

## In-Memory Streams: `MemoryReader` & `MemoryWriter`

Work with bytes in memory without touching the filesystem — useful for testing, transforms, and buffering.

| Class | Constructor | Key methods |
| :--- | :--- | :--- |
| `MemoryReader(data)` | `data: string \| array<u8>` | `readBytes(n)`, `readLine()`, `readLines()`, `readToEnd()`, `readUntil(delim)`, `getBytes()`, `seek()`, `rewind()`, `position()`, `length()`, `remaining()` |
| `MemoryWriter()` | — | `write()`, `writeLine(s)`, `getBytes()`, `toString()`, `clear()` |

```adesh
import IO;

let writer = new IO.MemoryWriter();
writer.writeLine("Adesh");
writer.writeLine("IO subsystem");

print(writer.toString());       // Adesh\nIO subsystem\n

let reader = new IO.MemoryReader(writer.toString());
while true {
    let line = reader.readLine();
    if line == null { break; }
    print("-> " + line);
}

print(reader.remaining());      // 0 (fully consumed)
reader.rewind();                // back to the start
print(reader.readLine());       // Adesh
```

---

## Buffered I/O: `BufferedReader` & `BufferedWriter`

Wrap any reader/writer with a fixed-size buffer to cut per-byte overhead.

| Class | Constructor | Key methods |
| :--- | :--- | :--- |
| `BufferedReader(reader, capacity)` | any reader + buffer bytes | `readBytes(n)`, `readLine()`, `readLines()`, `readToEnd()`, `peek()` (next byte without consuming), `consume(n)`, `clear()` |
| `BufferedWriter(writer, capacity)` | any writer + buffer bytes | `write()`, `writeLine(s)`, `flush()`, `clear()` |

```adesh
import IO;

let mw = new MemoryWriter();
let bw = new BufferedWriter(mw, 64);
for i in 1..1000 {
    bw.writeLine("record " + i);
}
bw.flush();                     // write everything out in chunks

let br = new BufferedReader(new MemoryReader(mw.toString()), 32);
print(br.peek());               // first byte without consuming
print(len(br.readLines()));     // 1000 lines read back
```

:::tip
Call `flush()` on a `BufferedWriter` when you're done (or when data must be visible downstream) — buffered writers hold data until the buffer fills.
:::

---

## Binary Serialization: `BinaryReader` & `BinaryWriter`

Fixed-width primitive serialization with explicit **endianness** (`"little"` default, or `"big"` / `"BE"`).

**`BinaryWriter`** — all methods return the number of bytes written:

| Method | Writes |
| :--- | :--- |
| `writeByte(b)` / `writeBytes(bytes)` | Single byte / byte array |
| `writeBool(v)` | 1 byte (`0`/`1`) |
| `writeChar(ch)` | UTF-8 encoded character |
| `writeU8` / `writeI8` | 1 byte |
| `writeU16` / `writeI16` | 2 bytes |
| `writeU32` / `writeI32` | 4 bytes |
| `writeU64` / `writeI64` | 8 bytes |
| `writeF32` / `writeF64` | 4 / 8 bytes (IEEE 754) |
| `writeString(s)` | UTF-8 bytes of `s` |
| `flush()` | Flush the underlying writer |

**`BinaryReader`** — matching `readU8` … `readF64`, plus:

| Method | Returns |
| :--- | :--- |
| `readByte()` | Next byte (`0` at EOF) |
| `readBytes(n)` | Next `n` bytes as an array |
| `readBool()` | `true`/`false` from one byte |
| `readChar()` | One UTF-8 character |
| `readString(length)` | `length` bytes decoded as UTF-8 |
| `getBytes()` | Remaining bytes |

```adesh
import { MemoryWriter, MemoryReader, BinaryWriter, BinaryReader, IO } from "IO";

let mw = new MemoryWriter();
let bw = new BinaryWriter(mw, "big");        // big-endian packing

bw.writeU8(0xAB);
bw.writeU16(0x1234);
bw.writeU32(0x87654321);
bw.writeF64(2.718281828459);
bw.writeString("hello");
bw.flush();

let br = new BinaryReader(new MemoryReader(mw.getBytes()), "big");
print(br.readU8());          // 171
print(br.readU16());         // 4660
print(br.readU32());         // 2271560481
print(br.readF64());         // 2.718281828459
print(br.readString(5));     // hello
```

:::warning
The reader must be created with the **same endianness** as the writer, and `readString(n)` needs to know the exact byte length written. Mixing endianness or lengths produces garbage, not errors.
:::

---

## `ByteBuffer` & `StringBuffer`

Simple mutable buffers.

| Class | Constructor | Key methods |
| :--- | :--- | :--- |
| `ByteBuffer(capacity)` | pre-sized raw byte buffer | `setEndianness(endian)`, `writeByte(b)`, `readByte()` (`-1` when exhausted), `getBytes()`, `clear()` |
| `StringBuffer()` | string builder | `append(s)`, `appendLine(s)` (both chainable), `toString()`, `clear()` |

```adesh
import IO;

let sb = new StringBuffer();
sb.append("A").append("B").appendLine("C");
print(sb.toString());        // ABC\n
sb.clear();

let bb = new ByteBuffer(4);
bb.setEndianness("big");
bb.writeByte(0xDE);
bb.writeByte(0xAD);
print(bb.getBytes());        // [222, 173]
```

---

## Stream Adapters & Combinators

Wrap or combine streams to add behavior. All compose because they share the `Reader`/`Writer` interface.

### Pipe & Null streams

| Class / fn | Description |
| :--- | :--- |
| `Pipe()` | Bounded in-memory reader-writer channel; `write()` returns `-1` after `close()` |
| `IO.pipe()` / `pipe()` | Returns `[reader, writer]` backed by one `Pipe` |
| `NullReader()` | Always returns EOF (empty reads) |
| `NullWriter()` | Discards writes (returns `length`) |

### Tee, Limit, Counting

| Class | Constructor | Behavior |
| :--- | :--- | :--- |
| `TeeReader(reader, writer)` | source + sink | Reads source fully, copying each chunk to the writer; then serves the same bytes back |
| `TeeWriter(w1, w2)` | two writers | Writes to both; returns the smaller byte count |
| `LimitedReader(reader, n)` | source + max bytes | Serves at most `n` bytes |
| `CountingReader(reader)` | source | Counts bytes consumed; `.count()` |
| `CountingWriter(writer)` | sink | Counts bytes written; `.count()` |

```adesh
import IO;

// Count bytes while copying:
let src = new MemoryReader("hello world");
let dst = new MemoryWriter();
let counted = new CountingWriter(dst);
IO.copy(src, counted);
print(counted.count());         // 11
print(dst.toString());          // hello world

// Cap how much is read:
let capped = new LimitedReader(new MemoryReader("0123456789"), 4);
print(capped.readToEnd());      // 0123

// Branch a write to two sinks:
let a = new MemoryWriter(); let b = new MemoryWriter();
let tee = new TeeWriter(a, b);
tee.write(io_utf8_encode("dup"), 0, 3);
print(a.toString() == b.toString());   // true
```

### Combinator functions

Free functions available through the module: `copy(src, dst)`, `copyN(src, dst, n)`, `pipe()`, `tee(reader, writer)`, `limit(reader, n)`, `repeat(byteVal, count)`, `discard(reader)`, `concat(readers)`, `chain(readers)`. `IO.*` exposes the most common ones (`IO.copy`, `IO.limit`, `IO.repeat`, `IO.concat`, `IO.pipe`, `IO.teeReader`).

```adesh
import IO;

// Repeat n bytes then read back:
let r = IO.repeat(65, 3);          // 'A', 'A', 'A'
print(len(r.readToEnd()));         // 3

// Concatenate several readers into one:
let combo = IO.concat([
    new MemoryReader("one,"),
    new MemoryReader("two,"),
    new MemoryReader("three"),
]);
print(combo.readToEnd());          // one,two,three
```

---

## Errors & Results: `IOError` / `IOResult`

| Class | Description |
| :--- | :--- |
| `IOError(kind, message)` | Carries `kind` + `message`; `toString()` → `IOError[kind]: message` |
| `IOResult(val, err)` | Wrapper with `IOResult.ok(val)` / `IOResult.err(kind, msg)`, `.isOk()`, `.isErr()`, `.unwrap()` (value or `null`), `.error()` |

---

## Complete example

A pipeline that writes text into memory, wraps it in a buffered reader, counts the lines, and reports metrics.

```adesh
import IO;

print("--- IO stream pipeline ---");

let writer = new IO.MemoryWriter();
for i in 1..5 {
    writer.writeLine("line-" + i);
}

let counting = IO.countingReader(new IO.MemoryReader(writer.toString()));
let lines = counting.readLines();

print("lines:", len(lines));            // 5
print("bytes consumed:", counting.count());

let sink = new IO.MemoryWriter();
let buffered = IO.bufferedWriter(sink, 16);
IO.copy(new IO.MemoryReader("stream it all"), buffered);
print("bytes written:", len(sink.toString()));   // 14
```

---

## Notes & edge cases

- **Import required**: unlike `Math`/`fs`/`JSON`, use `import IO;` (or `import "std:IO";`) — the module is loaded from source (`src/stdlib/IO.adesh`).
- **UTF-8**: all text streams are UTF-8. `readLine`/`readLines` strip `\n` (and `\r\n`). `MemoryReader`/`BufferedReader` decode bytes to characters during reads.
- **Endianness**: binary packing defaults to little-endian; pass `"big"` (or `"BE"`) to `BinaryReader`/`BinaryWriter` for network order. `io_pack_number`/`io_unpack_number` also accept `"BE"`.
- **Buffers**: call `flush()` on `BufferedWriter`/`BinaryWriter` before reading the underlying sink.
- **Binary reads return numbers**: `readU16`…`readF64` return numeric values; `readString(n)` needs the exact byte count.
- **`ByteBuffer.readByte()`** returns `-1` when there are no more bytes; `Pipe.write()` returns `-1` after `close()`.
- **Backend parity**: fully supported on Interpreter, Native JIT, AOT, and WebAssembly (the README matrix marks console/binary/in-memory streams YES everywhere).
- `Reader.readLine()` returns `null` at EOF — always check for `null` before using the line.

## Source & examples

- High-level API: `src/stdlib/IO.adesh`
- Native primitives: `src/runtime/stdlib_src/io/` (`stream_builtins.rs`, `file.rs`)
- Runnable examples: `examples/Libraries/io/` (`01_console_basic.adesh`, `02_memory_stream.adesh`, `03_binary_serialization.adesh`, `04_buffered_io.adesh`, `05_pipes_and_tees.adesh`, `06_seeking.adesh`, `07_counting.adesh`, `08_limited.adesh`)
- Architecture & API reference (from the repo): `examples/Libraries/io/Readme.md`

## Related

- [Builtin Libraries Overview](overview)
- [Process Library](process) — `ProcessStream` gives interactive stdin/stdout on child processes
- [Standard Library Overview](overview)
- [Built-in Functions](builtins) — quick reference including `io_*` primitives
