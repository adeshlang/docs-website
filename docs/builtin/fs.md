---
id: fs
title: FS Library
sidebar_label: FS
---

# FS Library

The **FS** builtin library is AdeshLang's unified filesystem and path API. It provides everything you need to read and write files, manage directories, list contents, compute hashes, watch for changes, work with paths, and even run transactional or batched file operations — all from a single `fs` namespace.

It is backed by the operating system (interpreter, JIT, Native JIT, AOT) and polyfilled with an in-memory virtual filesystem on WebAssembly, so the same code runs everywhere.

## Namespaces

| Namespace | What it provides |
| :--- | :--- |
| `fs` | Core file and directory operations. |
| `fs.path` | Pure path-string utilities (join, split, normalize). |
| `fs.async` | Promise-based non-blocking read/write. |
| `fs.tx` | Transactional filesystem operations (write/rename/remove with rollback). |
| `fs.snapshot` | Snapshot of all files under the working directory. |
| `fs.batch` | Run many file operations in one call. |
| `fs.fsql` | Query a directory as rows (`{name, ext, isFile, size}`). |

## Importing the library

`fs` is **globally available**, but importing it is the idiomatic way to make it explicit:

```adesh
import fs;        // or import "fs";
import { read, write } from "fs";   // selective import also works
```

:::note
Every `fs` method accepts a path as a plain string. Returned values: `fs.read` → `string`, `fs.copy` → `number` (bytes copied), `fs.readDir` → `array<string>`, and so on (see each table).
:::

---

## Methods: Read & Write

The core of the library — working with file **contents**.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.read(path)` | Read a file's contents as a UTF-8 string | `path: string` | `string` |
| `fs.readText(path)` | Alias of `fs.read` | `path: string` | `string` |
| `fs.write(path, text)` | Write a string to a file (overwrites; creates if missing) | `path: string`, `text: string` | `null` |
| `fs.writeText(path, text)` | Alias of `fs.write` | `path: string`, `text: string` | `null` |
| `fs.writeAtomic(path, text)` | Write to a temp file, then rename into place — a crash mid-write never leaves a partially written file | `path: string`, `text: string` | `null` |
| `fs.mmapRead(path)` | Read a file as raw **bytes** (`RawArray("u8", ...)`) | `path: string` | `bytes` |

```adesh
import fs;

fs.write("greeting.txt", "Hello, AdeshLang!");
print(fs.read("greeting.txt"));          // Hello, AdeshLang!

// Atomic write is safer for config/log files:
fs.writeAtomic("config.json", '{"port": 8080}');

// Read raw bytes:
let bytes = fs.mmapRead("image.png");    // RawArray("u8", ...)
print(len(bytes));                       // number of bytes
```

:::tip
Prefer `fs.writeAtomic` over `fs.write` when durability matters — the file is either fully written or not changed at all.
:::

---

## Methods: File & Directory Management

Create, delete, move, copy, and inspect the filesystem.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.delete(path)` | Delete a **file** or a **directory** (directories are removed recursively) | `path: string` | `null` |
| `fs.copy(src, dst)` | Copy a file; returns the number of bytes copied | `src: string`, `dst: string` | `number` |
| `fs.move(src, dst)` | Move/rename a file or directory | `src: string`, `dst: string` | `null` |
| `fs.exists(path)` | `true` if the path exists (file, dir, or link) | `path: string` | `boolean` |
| `fs.isFile(path)` | `true` if the path is a regular file | `path: string` | `boolean` |
| `fs.isDir(path)` | `true` if the path is a directory | `path: string` | `boolean` |
| `fs.readDir(path)` | List the **names** of entries inside a directory (non-recursive) | `path: string` | `array<string>` |
| `fs.mkdir(path)` | Create a directory, including any missing parents (recursive) | `path: string` | `null` |

```adesh
import fs;

fs.mkdir("backups");                     // creates ./backups
fs.write("backups/a.txt", "A");

print(fs.exists("backups/a.txt"));       // true
print(fs.isFile("backups/a.txt"));       // true
print(fs.isDir("backups"));              // true

fs.copy("backups/a.txt", "backups/b.txt");
fs.move("backups/b.txt", "backups/c.txt");
print(fs.readDir("backups"));            // ["a.txt", "c.txt"]

fs.delete("backups");                    // removes dir + contents recursively
```

---

## Methods: Temporary Files & Locking

For scratch space and simple cross-process coordination.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.tempFile(prefix)` | Return a unique path in the system temp directory (the file is **not** created) | `prefix: string` | `string` |
| `fs.tempDir(prefix)` | Create a unique temp **directory** and return its path | `prefix: string` | `string` |
| `fs.lock(path)` | Create a sidecar lock file `{path}.lock`; fails if it already exists | `path: string` | `string` (lock path) |
| `fs.unlock(lockPath)` | Remove a previously created lock file | `lockPath: string` | `null` |

```adesh
import fs;

let tmp = fs.tempFile("adesh-cache");
fs.write(tmp, "cache data");             // now the file exists
fs.delete(tmp);

// Simple mutex over a shared resource:
let lock = fs.lock("data.txt");          // creates data.txt.lock
// ... do work ...
fs.unlock(lock);
```

:::tip
`fs.lock` uses atomic `create_new`, so two processes can race safely — only one wins. Remember to call `fs.unlock` when done.
:::

---

## Methods: Hashing & Integrity

Checksums and digests for verifying data integrity, caching, and deduplication.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.crc32(data)` | CRC-32 checksum (32-bit unsigned) | `data: string \| bytes` | `u32` |
| `fs.sha256(data)` | SHA-256 hash, returned as a lowercase hex string | `data: string \| bytes` | `string` |

```adesh
import fs;

fs.write("file.txt", "hello world");
print(fs.crc32(fs.read("file.txt")));   // 222957957 (u32)
print(fs.sha256(fs.read("file.txt")));  // 2ef7bde6... (64 hex chars)
```

---

## Methods: Symlinks

Create and inspect symbolic links (requires platform permissions).

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.symlinkFile(src, link)` | Create a symlink to a **file** | `src: string`, `link: string` | `null` |
| `fs.symlinkDir(src, link)` | Create a symlink to a **directory** | `src: string`, `link: string` | `null` |
| `fs.readLink(path)` | Read the target that a symlink points to | `path: string` | `string` |

```adesh
import fs;

fs.write("real.txt", "data");
fs.symlinkFile("real.txt", "alias.txt");
print(fs.readLink("alias.txt"));        // real.txt
fs.delete("alias.txt");
```

---

## Methods: Watching for Changes

Poll a path and run a callback whenever its modification time changes.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.watch(path, fn)` | Watch a path; the callback is invoked with `(event, path)` when a change is detected | `path: string`, `fn: function(event, path)` | `number` (watch id) |
| `fs.unwatch(id)` | Cancel a watch by its id | `id: number` | `null` |

```adesh
import fs;

let id = fs.watch("logs/app.log", fn(event, path) {
    print("Event:", event, "Path:", path);   // Event: change Path: logs/app.log
});

// ... later ...
fs.unwatch(id);
```

:::note
`fs.watch` detects changes by polling the file's modified-time every ~500 ms, so it is simple and portable but not real-time. In production, guard callbacks with your own debouncing.
:::

---

## The `fs.path` namespace (Path Utilities)

Pure string helpers for building and decomposing paths — no filesystem access.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.path.join(...parts)` | Join path segments with the platform separator | `...parts: string[]` | `string` |
| `fs.path.basename(path)` | Final component of a path (file name) | `path: string` | `string` |
| `fs.path.dirname(path)` | Directory portion of a path | `path: string` | `string` |
| `fs.path.extname(path)` | File extension **without** the dot (`""` if none) | `path: string` | `string` |
| `fs.path.normalize(path)` | Rebuild the path from its components, cleaning redundant separators and `.`/`..` | `path: string` | `string` |

```adesh
import fs;

print(fs.path.join("a", "b", "c.txt"));       // a\b\c.txt   (Windows) or a/b/c.txt
print(fs.path.basename("a/b/c.txt"));         // c.txt
print(fs.path.dirname("a/b/c.txt"));          // a/b
print(fs.path.extname("a/b/c.txt"));          // txt
print(fs.path.normalize("a/./b/../c.txt"));   // a/c.txt
```

---

## The `fs.async` namespace (Promise-based I/O)

Non-blocking versions of the core read/write that return **Promises**, ideal for async/await workflows and WebAssembly.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.async.read(path)` | Read a file asynchronously | `path: string` | `Promise<string>` |
| `fs.async.write(path, text)` | Write a string asynchronously | `path: string`, `text: string` | `Promise<null>` |

```adesh
import fs;

async fn loadConfig() {
    let text = await fs.async.read("config.json");
    print(text);
}

// Or chain with .then()
fs.async.write("note.txt", "async content").then(fn() {
    return fs.async.read("note.txt");
}).then(fn(content) {
    print("Read:", content);
});
```

---

## Methods: Advanced Operations

Higher-level batch features for scripts, tooling, and build systems.

### `fs.fsql` — query a directory as rows

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.fsql(path, ext?)` | List a directory as rows; optionally filter to one file extension | `path: string`, `ext?: string` | `array<object>` |

Each row is an object `{ name, ext, isFile, size }`.

```adesh
import fs;

let rows = fs.fsql("examples", "adesh");   // only .adesh files
for row in rows {
    print(row.name, row.size, row.isFile);
}
```

### `fs.snapshot` — snapshot all files

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.snapshot(name)` | Walk the working directory recursively and record every file's size | `name: string` | `object` |

Returns `{ name, files: { "<path>": <size> } }`.

```adesh
import fs;
let snap = fs.snapshot("release-build");
print(snap.name);                          // "release-build"
print(snap.files["Cargo.toml"]);           // file size in bytes
```

### `fs.batch` — batch operations

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.batch(ops)` | Execute an array of operations in one call; results align with inputs | `ops: array<object>` | `array<any>` |

Each op is `{ op: "write" | "read" | "delete", path: string, data?: string }`. Successful ops return `null` (write/delete) or the file `string` (read); failures return an error `string`.

```adesh
import fs;

let results = fs.batch([
    { op: "write", path: "tmp/a.txt", data: "one" },
    { op: "write", path: "tmp/b.txt", data: "two" },
    { op: "read",  path: "tmp/a.txt" },
    { op: "delete", path: "tmp/b.txt" },
]);
print(results);   // [null, null, "one", null]
```

### `fs.tx` — transactional filesystem

Run a batch of operations that can be **rolled back** as a group.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `fs.tx(fn)` | Call `fn(t)` with a transaction object `t` | `fn: function(t)` | `null` |

The transaction object `t` provides:

| Method | Description |
| :--- | :--- |
| `t.write(path, text)` | Write a file and log the operation |
| `t.rename(src, dst)` | Rename/move and log the operation |
| `t.remove(path)` | Delete a file (backed up) and log the operation |
| `t.commit()` | Confirm the transaction (keeps all changes) |
| `t.rollback()` | Undo logged operations in reverse order (best-effort) |

```adesh
import fs;

fs.tx(fn(t) {
    let tmp = fs.tempFile("txn");
    t.write(tmp, "data");
    print(fs.read(tmp));        // "data"
    t.rollback();               // undo: tmp is removed
});
```

:::warning
`fs.tx` is **experimental** — rollback is best-effort and driven by an operation log, so always validate results in critical workflows.
:::

---

## Complete example

A small script that ties the pieces together — backup a config file, hash it, and print a report.

```adesh
import fs;

let src = "app.conf";
let dst = fs.path.join("backups", "app.conf.1");

print("--- Backup script ---");

if (!fs.exists("backups")) {
    fs.mkdir("backups");
}

fs.write(src, "port=8080\nhost=0.0.0.0\n");
fs.copy(src, dst);

print("Source exists:", fs.exists(src));
print("Copied bytes:", fs.copy(src, dst + ".2"));
print("Dir listing:", fs.readDir("backups"));
print("SHA-256:", fs.sha256(fs.read(src)));
print("CRC-32:", fs.crc32(fs.read(src)));

fs.delete(src);
fs.delete(dst + ".2");
fs.delete(dst);
fs.delete("backups");
```

---

## Notes & edge cases

- `fs.read`/`fs.write` treat files as **UTF-8 text**. For binary data use `fs.mmapRead` (bytes) or `fs.crc32`/`fs.sha256` with raw bytes.
- `fs.mkdir` and `fs.delete` (directories) operate **recursively**.
- `fs.copy` returns the byte count; most other mutating methods return `null`.
- `fs.tempFile` only returns a path — create the file yourself with `fs.write`.
- `fs.watch` is polling-based (~500 ms interval); it is not a real-time OS event watcher.
- Hashing accepts strings or byte arrays/`RawArray("u8", …)`. `fs.sha256` returns lowercase hex.
- On WebAssembly, `fs` is polyfilled with an in-memory virtual filesystem — `fs.async.*` is recommended there.
- Always validate and sanitize paths (reject `..`, absolute paths) when the filesystem is exposed to untrusted input.

## Source & examples

- Implementation: `src/runtime/stdlib_src/fs/mod.rs`
- Runnable examples: `examples/Libraries/fs/` (`basic_demo.adesh`, `async_demo.adesh`, `fsql_demo.adesh`, `tx_demo.adesh`, `watch_demo.adesh`, `safe_io_examples.adesh`)
- API reference (from the repo): `examples/Libraries/fs/README.md`

## Related

- [Builtin Libraries Overview](overview)
- [Standard Library Overview](overview)
- [Built-in Functions](builtins) — quick reference including `fs.*`
