---
id: compression
title: Compression Library
sidebar_label: Compression
---

# Compression Library

The **Compression** builtin library is Adesh's lossless data-compression ecosystem. It provides seven production codecs (Zstandard, GZIP, Brotli, LZ4, XZ/LZMA, DEFLATE, ZLIB), a general-purpose `compress`/`decompress` API with codec selection and level control, adaptive payload classification, stateful streaming, seekable random-access archives, ZIP/TAR archive creation and extraction with path-traversal protection, multi-threaded parallel compression, disk-to-disk file streaming, magic-header auto-detection, and fast non-cryptographic checksums. Everything is implemented natively in Rust on top of audited codec crates (`zstd`, `flate2`, `brotli`, `lz4_flex`, `lzma-rs`), and every decoder enforces decompression-bomb limits.

## Namespace

| Name | What it provides |
| :--- | :--- |
| `Compression` | The namespace: 30+ functions covering codecs, adaptive compression, streaming, seekable archives, ZIP/TAR, parallel compression, file streaming, detection, and checksums |

## Importing the library

```adesh
import Compression;          // or import "std:Compression" as Compression;
```

Selective imports work too:

```adesh
import { gzip, gunzip, zstd, unzstd, brotli, unbrotli } from Compression;
```

:::tip
Functions that take *data* accept a string or a byte array. Compressed results are always byte arrays — send them to `Encoding.base64Encode`/`Encoding.hexEncode` for transport or storage, and use `len(...)` to measure sizes.
:::

---

## Choosing a codec

All codecs are lossless. Pick one by your throughput/ratio needs:

| Codec | Names(s) | Level range | Speed / Ratio | Best for |
| :--- | :--- | :---: | :--- | :--- |
| **Zstandard** | `"zstd"`, `"zst"` | 1–22 (default 5) | Very fast decode, high ratio, dictionary support | General purpose, logs, storage, RPC |
| **GZIP** | `"gzip"`, `"gz"` | 1–9 (default 6) | Universal compatibility | Cross-system file exchange, legacy HTTP |
| **Brotli** | `"brotli"`, `"br"` | 1–11 (default 6) | Best ratio on text/JSON, slower at high levels | Web static assets, HTTP payloads |
| **LZ4** | `"lz4"` | — | Ultra-fast, lower ratio | High-throughput streaming, caches, IPC |
| **XZ / LZMA** | `"xz"`, `"lzma"` | — | Maximum ratio, slowest | Software distribution, firmware blobs |
| **DEFLATE** | `"deflate"` | 1–9 (default 6) | Raw RFC 1951 | PNG streams, PDF, raw zip chunks |
| **ZLIB** | `"zlib"` | 1–9 (default 6) | RFC 1950 wrapper of DEFLATE | Interop with tools expecting a zlib header |

Levels above the codec's maximum are clamped (`zstd` at 22, `gzip`/`deflate`/`zlib` at 9, `brotli` at 11). Zstd levels ≤ 0 are mapped to level 3.

---

## General-purpose compress / decompress

The single entry point for every codec. `compress` defaults to Zstd level 5; `decompress` defaults to Zstd. Both are **strict** — unknown codecs and corrupt input throw.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `compress(data, codec?, level?)` | Compress with the given codec; defaults `"zstd"`, level `5` | `data`, `codec?: string`, `level?: int` | `array<int>` |
| `decompress(data, codec?, maxOutputSize?)` | Decompress; `maxOutputSize` caps the output (bomb protection) | `data`, `codec?: string`, `maxOutputSize?: int` | `array<int>` |
| `compressBound(inputLen, codec?)` | Upper bound on the compressed size for `inputLen` bytes | `inputLen: int`, `codec?: string` | `int` |
| `supportedCodecs()` | The list of supported codec names | — | `array<string>` |
| `isSupported(codec)` | `true` if the name is a supported codec | `codec: string` | `boolean` |

```adesh
import Compression;

print(Compression.supportedCodecs());
// ["zstd", "gzip", "brotli", "lz4", "xz", "deflate", "zlib"]

let text = "Hello Adesh Compression Standard Library! World class performance and safety. " * 10;
let compressed = Compression.compress(text, "zstd", 5);
print("original:", len(text), "compressed:", len(compressed));

let restored = Compression.decompress(compressed, "zstd");
print("round-trip:", restored == text);       // true
```

### Decompression bomb protection

Every decoder accepts a `maxOutputSize` limit. If decompressing would produce more than the limit, the call throws instead of exhausting memory:

```adesh
import Compression;

let payload = "A" * 10000;
let compressed = Compression.zstd(payload, 5);

try {
    let result = Compression.decompress(compressed, "zstd", 5000);   // only 5,000 bytes allowed
} catch (err) {
    print("Safeguard triggered:", err);
    // Decompression bomb protection triggered in Zstd: maximum output limit of 5000 bytes exceeded
}
```

---

## Codec shortcuts

Convenience functions per codec — no need to pass the codec name.

| Compress | Decompress | Level default | Notes |
| :--- | :--- | :---: | :--- |
| `zstd(data, level?)` | `unzstd(data, maxOutputSize?)` | 5 | Level 1–22 |
| `gzip(data, level?)` | `gunzip(data, maxOutputSize?)` | 6 | Level 1–9 |
| `brotli(data, level?)` | `unbrotli(data, maxOutputSize?)` | 6 | Level 1–11 |
| `lz4(data)` | `unlz4(data, maxOutputSize?)` | — | Block format, size-prepended |
| `xz(data)` | `unxz(data, maxOutputSize?)` | — | Maximum ratio |
| `deflate(data, level?)` | `inflate(data, maxOutputSize?)` | 6 | Raw DEFLATE |
| `zlib(data, level?)` | `unzlib(data, maxOutputSize?)` | 6 | ZLIB wrapper |

```adesh
import Compression;

let text = "Zstandard provides fast decompression and top-tier compression ratio. " * 20;

let z = Compression.zstd(text, 5);
print(len(text), "->", len(z), Compression.unzstd(z) == text);

let gz = Compression.gzip(text, 6);
print(len(text), "->", len(gz), Compression.gunzip(gz) == text);

let br = Compression.brotli(text, 6);
print(len(text), "->", len(br), Compression.unbrotli(br) == text);

let l4 = Compression.lz4(text);
print(len(text), "->", len(l4), Compression.unlz4(l4) == text);
```

`compress(data, codec, level)` and the shortcuts are interchangeable — `Compression.zstd(x, 5)` ≡ `Compression.compress(x, "zstd", 5)`.

---

## Adaptive compression & entropy

`compressAdaptive` (alias `auto`) analyzes the payload's structure and entropy, picks the best codec automatically, and skips compression entirely when output would expand (e.g. data that is already compressed or high-entropy).

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `compressAdaptive(data)` | Classify + compress with the best codec | `data` | `object` (see below) |
| `auto(data)` | Alias of `compressAdaptive` | `data` | `object` |
| `entropyEstimate(data)` | Shannon entropy in bits per byte (0–8) | `data` | `float` |

The result object has `compressedData` (byte array), `originalSize`, `compressedSize`, `ratio`, `spaceSavedPercent`, `algorithm` (the chosen codec name), `wasCompressed` (whether compression was applied), and `checksum` (CRC32 of the compressed payload).

```adesh
import Compression;

let jsonPayload = "{\"id\": 101, \"title\": \"Adesh Adaptive Compression\", \"score\": 99.8}" * 25;

let result = Compression.auto(jsonPayload);
print("Was compressed:", result.wasCompressed);
print("Algorithm chosen:", result.algorithm);
print("Original size:", result.originalSize);
print("Compressed size:", result.compressedSize);
print("Space saved %:", result.spaceSavedPercent);

// Compare with the raw entropy of the payload
print("Entropy (bits/byte):", Compression.entropyEstimate(jsonPayload));

// If it compressed, decompress the payload it produced:
if (result.wasCompressed) {
    let back = Compression.decompress(result.compressedData, result.algorithm);
    print("Round-trip:", back == jsonPayload);   // true
}
```

---

## Seekable random-access archives

The seekable format splits data into compressed chunks with an index and a magic `ADSH` header, so you can read any chunk **without decompressing the whole payload**. Great for large logs or databases you query by block.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `createSeekable(data, codec?, chunkSize?, level?)` | Build an indexed chunked archive; defaults `"zstd"`, 64 KB chunks, level `5` | `data`, `codec?: string`, `chunkSize?: int`, `level?: int` | `array<int>` |
| `readSeekableChunk(archive, chunkIndex)` | Decompress and return one chunk | `archive`, `chunkIndex: int` | `array<int>` |

```adesh
import Compression;

let dataset = "Record 0: Initial database log entry.\n" * 100
            + "Record 1: Secondary log entry.\n" * 100;

// 1 KB chunks → random access without full decompression
let archive = Compression.createSeekable(dataset, "zstd", 1024);
print("Seekable archive bytes:", len(archive));

let chunk0 = Compression.readSeekableChunk(archive, 0);
print("Chunk #0 length:", len(chunk0));
print("Chunk #0 head:", Encoding.utf8Decode(chunk0[0..20]) ?? "");
```

:::note
Each chunk is independently decompressible. `readSeekableChunk` is O(1) relative to the archive size — it locates the chunk via the embedded index instead of replaying earlier chunks. The `detect` magic string for this format is `"seekable"`.
:::

---

## ZIP & TAR archives

Create and extract ZIP and TAR archives either **in memory** or **directly on disk**. Every `extract*` function normalizes entry paths and **rejects path traversal** (`..`, absolute paths, drive letters) so untrusted archives cannot escape the target directory.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `createZip(files)` | Build a ZIP byte archive from `[{name, content\|filePath}]` entries | `files: array<object>` | `array<int>` |
| `createZipFile(fileMappings, outputZipPath)` | Pack disk files directly into a ZIP file (no in-memory bytes) | `fileMappings: array<object\|string>`, `outputZipPath: string` | `int` |
| `extractZip(zipBytes, targetDir)` | Extract a ZIP byte archive to a directory; returns the number of files extracted | `zipBytes`, `targetDir: string` | `int` |
| `extractZipFile(zipFilePath, targetDir)` | Extract a ZIP file on disk to a directory; returns the number of files extracted | `zipFilePath`, `targetDir: string` | `int` |
| `createTar(files)` | Build a TAR byte archive from `[{name, content\|filePath}]` entries | `files: array<object>` | `array<int>` |
| `extractTar(tarBytes, targetDir)` | Extract a TAR byte archive to a directory; returns the number of files extracted | `tarBytes`, `targetDir: string` | `int` |

Entries may supply **inline content** or a **disk path** to read the bytes from a file. `createZipFile` accepts either `{name, path}` objects or bare path strings (the file name is used as the entry name) and streams everything straight to the output ZIP file:

```adesh
import Compression;

let files = [
    { "name": "config.json", "content": "{\"appName\": \"Adesh\", \"port\": 8080}" },
    { "name": "docs/readme.txt", "content": "Welcome to Adesh Compression ZIP support!" }
];

// In-memory ZIP bytes
let zipArchive = Compression.createZip(files);
print("Generated ZIP archive length:", len(zipArchive));

let extracted = Compression.extractZip(zipArchive, "output_dir");
print("Extracted files:", extracted);

// TAR works the same way
let tarBytes = Compression.createTar(files);
let extractedCount = Compression.extractTar(tarBytes, "output_dir");
print("Extracted TAR entries:", extractedCount);
```

```adesh
import Compression;

// Disk-to-disk: pack files straight into a ZIP file on disk
let entryCount = Compression.createZipFile([
    { "name": "logs/server.log", "path": "server.log" },
    { "name": "scripts/start.bat", "path": "start.bat" }
], "logs_and_scripts.zip");
print("Packed ZIP entries:", entryCount);

// Extract that ZIP file back to a directory
let restored = Compression.extractZipFile("logs_and_scripts.zip", "extracted_zip_files");
print("Restored files:", restored);
```

:::warning
Entry `name` fields may include `/`-separated subdirectories (e.g. `docs/readme.txt`) and are recreated on extraction. A name containing `..`, an absolute path, or a Windows drive letter is rejected with an error rather than silently escaping the target directory — for both in-memory and disk-based extraction.
:::

---

## Parallel compression

Split large payloads into chunks and compress them concurrently across worker threads, preserving chunk order in the output. Decompression runs in parallel too.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `parallelCompress(data, codec?, chunkSize?, level?, numThreads?)` | Multi-threaded chunked compression; defaults 128 KB chunks, `numThreads` `0` = all cores | `data`, `codec?: string`, `chunkSize?: int`, `level?: int`, `numThreads?: int` | `array<int>` |
| `parallelDecompress(data, codec?, maxOutputSize?, numThreads?)` | Multi-threaded chunked decompression | `data`, `codec?: string`, `maxOutputSize?: int`, `numThreads?: int` | `array<int>` |

```adesh
import Compression;

let largeDataset = "High frequency financial market tick data row entry...\n" * 500;

let compressed = Compression.parallelCompress(largeDataset, "zstd", 65536, 5, 4);
print("Original:", len(largeDataset), "Parallel compressed:", len(compressed));

let decompressed = Compression.parallelDecompress(compressed, "zstd", null, 4);
print("Verified:", decompressed == largeDataset);   // true
```

---

## File compression (disk to disk)

Stream files through a 64 KB buffer so multi-gigabyte files can be compressed without loading them into RAM.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `compressFile(inputPath, outputPath, codec?, level?)` | Stream-compress one file to another | `inputPath`, `outputPath`, `codec?: string`, `level?: int` | `boolean` |
| `decompressFile(inputPath, outputPath, codec?, maxOutputSize?)` | Stream-decompress one file to another | `inputPath`, `outputPath`, `codec?: string`, `maxOutputSize?: int` | `boolean` |
| `compressFileAtomic(inputPath, outputPath, codec?, level?)` | Compress to a `.tmp` file, then atomically rename into place | `inputPath`, `outputPath`, `codec?: string`, `level?: int` | `boolean` |

```adesh
import Compression;

let ok = Compression.compressFile("server.log", "server.log.zst", "zstd", 5);
print("Compressed:", ok);

// Atomic variant writes server.log.zst.tmp.* first, then renames on success
let atomic = Compression.compressFileAtomic("server.log", "server_atomic.log.zst", "zstd", 5);
print("Atomic compression:", atomic);

let back = Compression.decompressFile("server.log.zst", "server.log.restored", "zstd");
print("Restored:", back);
```

---

## Magic-header detection & auto-decompress

`detect` reads magic bytes and identifies the format; `decompressAuto` detects and decompresses in one step.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `detect(data)` | Identify the format by magic bytes | `data` | `string` |
| `decompressAuto(data, maxOutputSize?)` | Detect then decompress | `data`, `maxOutputSize?: int` | `array<int>` |

`detect` returns one of: `"gzip"` (`1F 8B`), `"zstd"` (`28 B5 2F FD`), `"zip"` (`PK\x03\x04`), `"xz"` (`FD 37 7A 58 5A 00`), `"zlib"` (`78 9C/01/DA/5E`), `"seekable"` (`ADSH`), or `"unknown"`.

```adesh
import Compression;

let z = Compression.zstd("some payload", 5);
let gz = Compression.gzip("some payload", 6);

print(Compression.detect(z));    // "zstd"
print(Compression.detect(gz));   // "gzip"

print(Compression.decompressAuto(z) == "some payload");    // true
print(Compression.decompressAuto(gz) == "some payload");   // true
```

:::note
`decompressAuto` can auto-decompress `gzip`, `zstd`, `xz`, and `zlib` payloads. It errors for formats it detects but cannot decompress (`zip`, `seekable`) and for `unknown` input.
:::

---

## Checksums

Fast, non-cryptographic checksums for payload validation and integrity checks. (For cryptographic digests use the `Crypto` library instead.)

| Function | Description | Returns |
| :--- | :--- | :--- |
| `crc32(data)` | IEEE 802.3 CRC-32 | `int` |
| `crc32c(data)` | Castagnoli CRC-32C | `int` |
| `adler32(data)` | Adler-32 | `int` |
| `xxhash64(data)` | 64-bit XXHash | `int` |

```adesh
import Compression;

let data = "Adesh integrity check payload";

print("CRC32   :", Compression.crc32(data));
print("CRC32C  :", Compression.crc32c(data));
print("Adler32 :", Compression.adler32(data));
print("XXHash64:", Compression.xxhash64(data));
```

---

## Complete example

A realistic pipeline: compress a payload with auto-selection, checksum it, package it into a ZIP, and verify the round-trip.

```adesh
import Compression;
import Encoding;

print("--- 1. Adaptive compression of JSON ---");
let payload = "{\"event\":\"transaction\",\"amount\":1000,\"currency\":\"USD\"}" * 50;
let result = Compression.auto(payload);
print("algorithm:", result.algorithm, "| saved %:", result.spaceSavedPercent);

let originalBytes = Encoding.utf8Encode(payload);
let finalBytes = result.wasCompressed ? result.compressedData : originalBytes;

print("--- 2. Checksum the final payload ---");
let checksum = Compression.crc32c(finalBytes);
print("CRC32C:", checksum);

print("--- 3. Package into a ZIP archive ---");
let zipBytes = Compression.createZip([
    { "name": "payload.json", "content": payload },
    { "name": "checksum.txt", "content": String(checksum) }
]);
print("ZIP archive bytes:", len(zipBytes));

print("--- 4. Decompress the adaptive result back ---");
let restored = Compression.decompress(result.compressedData, result.algorithm);
print("payload round-trip:", restored == payload);   // true
```

---

## Notes & edge cases

- **Lossless, always.** Every codec round-trips byte-for-byte; verify with `==` after decompression.
- **Level clamping.** `gzip`/`deflate`/`zlib` clamp to 1–9, `brotli` to 1–11, `zstd` to 1–22 (≤ 0 maps to 3). `lz4` and `xz` have no level parameter.
- **Decompression bomb protection.** All decoders (`decompress`, `*unzstd*`/`gunzip`/`unbrotli`/`unlz4`/`unxz`/`inflate`/`unzlib`, `decompressAuto`, `decompressFile`, `parallelDecompress`) accept `maxOutputSize` and throw when output would exceed it.
- **Strict errors.** Unknown codec names, corrupt input, truncated archives, and unsafe extraction paths throw descriptive runtime errors — always `try`/`catch` around untrusted data.
- **Archive security.** `extractZip`/`extractZipFile`/`extractTar` reject `..`, absolute, and drive-letter paths, and enforce output limits on extraction.
- **Streaming vs in-memory.** `compressFile`/`decompressFile`/`compressFileAtomic` stream through a 64 KB buffer (no full-file RAM cost); `compressFileAtomic` writes a `.tmp` file and atomically renames it, leaving no partial file on failure. `createZipFile`/`extractZipFile` stream straight to/from disk as well.
- **Backend parity.** Implemented natively in Rust, so behavior is identical on Interpreter, Native JIT, AOT, and WebAssembly.
- **Pair with `Encoding`.** Use `Encoding.base64Encode`/`hexEncode` to render compressed byte arrays for transport or logs, and `Encoding.hexDecode`/`base64Decode` to recover them.

## Source & examples

- Implementation: `src/runtime/stdlib_src/compression/` (`codecs.rs`, `adaptive.rs`, `streaming.rs`, `chunking.rs`, `archives.rs`, `checksums.rs`, `parallel.rs`, `dictionary.rs`, `api.rs`)
- API wrappers: `src/stdlib/Compression.adesh`
- Runnable examples: `examples/Libraries/compression/` (`basic_compression.adesh`, `gzip.adesh`, `zstd.adesh`, `brotli.adesh`, `lz4.adesh`, `dictionary_compression.adesh`, `streaming_compression.adesh`, `file_compression.adesh`, `file_decompression.adesh`, `adaptive_compression.adesh`, `seekable_compression.adesh`, `parallel_compression.adesh`, `zip_create.adesh`, `zip_file.adesh`, `tar_create.adesh`, `decompression_security.adesh`, plus `README.md`)
- Unit/integration tests: `tests/compression_test.rs`
- Repo design doc: `docs/compression.md`

## Related

- [Builtin Libraries Overview](overview)
- [Encoding Library](encoding) — transport compressed bytes as Base64/hex
- [Crypto Library](crypto) — cryptographic digests when integrity needs to be tamper-proof
- [IO Library](io) — file streaming and binary I/O
