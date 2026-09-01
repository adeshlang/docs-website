---
id: path
title: Path Library
sidebar_label: Path
---

# Path Library

The **Path** builtin library is a production-grade, cross-platform abstraction for filesystem paths in AdeshLang. A path is represented as a parsed `Path` object rather than a plain string, so the library automatically manages OS-specific separators (`\` on Windows, `/` on POSIX), UNC network paths, Windows drive letters, roots, relative/absolute normalization, and safe path traversal. It integrates natively with the `FS` library and with `Env` (whose directory methods return `Path` objects).

## Namespace

| Name | What it provides |
| :--- | :--- |
| `Path` | Core path object: creation, joining, components, normalization, filesystem queries |
| `PathComponent` | Parsed element of a path with `kind` (`Root`, `Prefix`, `Parent`, `Current`, `Normal`) and `value` |
| `PathIterator` | Iterator over path components: `hasNext()` / `next()` |
| `PathBuilder` | Fluent builder: `join(part)` then `build()` |
| `PathError` | Exception type for invalid path operations |
| `Root` | Filesystem root descriptor (e.g. `/` or `C:\`) |
| `Prefix` | Windows drive letter or UNC prefix descriptor |
| `RelativePath` / `AbsolutePath` | Type-safe wrappers for relative / absolute paths |

## Importing the library

```adesh
import Path;                  // or import "std:Path" as Path;
```

## Basic usage

```adesh
import Path;
import FS;

let file = Path.new("assets")
    .join("images")
    .join("logo.png");

print(file);                  // Windows: assets\images\logo.png
                              // Unix:    assets/images/logo.png
```

---

## Construction & Factories

| Static method | Description |
| :--- | :--- |
| `Path.new(raw)` / `Path.fromString(s)` | Create a path from a string (or object with `toString()`) |
| `Path.empty()` | Empty path |
| `Path.current()` | Current working directory |
| `Path.home()` | User home directory |
| `Path.temp()` | System temporary directory |
| `Path.executable()` | Location of the running binary/script |

```adesh
import Path;

let p1 = Path.new("images/logo.png");
let p2 = Path.fromString("docs/spec.pdf");
let empty = Path.empty();
let cwd = Path.current();
let home = Path.home();
let temp = Path.temp();
let exe = Path.executable();
```

---

## Joining & Mutation

| Method | Description |
| :--- | :--- |
| `join(other)` | Join two paths; if `other` is absolute it replaces the base. Returns a new normalized `Path` |
| `push(component)` | Mutating `join` — appends and returns `self` |
| `pop()` | Mutating `parent` — removes the last component and returns `self` |

```adesh
import Path;

let joined = Path.new("assets").join("icons").join("home.svg");

let p = Path.new("usr").push("local").push("bin");  // usr/local/bin
p.pop();                                             // usr/local
```

`join` accepts a string or another `Path` and normalizes the result, so redundant separators and `.`/`..` segments are cleaned automatically.

---

## Inspection: Name, Stem & Extension

| Method | Description |
| :--- | :--- |
| `fileName()` | Last component (e.g. `report.final.pdf`); `null` for root |
| `stem()` | File name without the extension (e.g. `report.final`) |
| `extension()` | Extension without the dot (e.g. `pdf`); `null` if none |
| `withExtension(ext)` | New path with a different extension |
| `removeExtension()` | New path with the extension removed |
| `withFileName(name)` | New path with a different file name |

```adesh
import Path;

let file = Path.new("docs/report.final.pdf");

print(file.fileName());           // report.final.pdf
print(file.stem());               // report.final
print(file.extension());          // pdf

let web = file.withExtension("html");        // docs/report.final.html
let stripped = file.removeExtension();       // docs/report.final
let renamed = file.withFileName("summary.txt");  // docs/summary.txt
```

---

## Parent, Root & Components

| Method | Description |
| :--- | :--- |
| `parent()` | Parent directory; `null` at the root |
| `root()` | Root descriptor (`/`, `C:\`, `\\server\share`); `null` for relative paths |
| `components()` | Array of `PathComponent` objects |
| `isAbsolute()` / `isRelative()` | Path kind checks |

```adesh
import Path;

let p = Path.new("/var/log/system.log");

let parent = p.parent();  // /var/log
let root = p.root();      // /  (Unix) or C:\ (Windows)

let p2 = Path.new("/home/ajay/projects/app/main.adesh");
let comps = p2.components();
print(len(comps));        // 5  (Root + 4 Normal)
for part in comps {
    print("[" + part.kind + "] " + part.value);
}
// [Root] /
// [Normal] home
// [Normal] ajay
// [Normal] projects
// [Normal] app
// [Normal] main.adesh
```

`PathComponent` kinds: `Root`, `Prefix` (Windows drive/UNC), `Parent` (`..`), `Current` (`.`), `Normal` (regular segment). Iterate with a `PathIterator`:

```adesh
import Path;

let iter = Path.new("a/b/c").components();   // array of PathComponent
```

---

## Normalization & Canonicalization

| Method | Description |
| :--- | :--- |
| `normalize()` | **Logical** normalization: removes `.`, collapses `..`, and deletes redundant separators without touching the filesystem |
| `canonicalize()` | **Physical** canonicalization: resolves symlinks and real casing against the OS filesystem (throws on missing paths) |
| `absolute()` | Convert to an absolute path by joining the current working directory when relative |

```adesh
import Path;

let messy = Path.new("a/b/../c/./d/..");
let norm = messy.normalize();   // a/c

let real = Path.new("./app").canonicalize();   // resolves symlinks on disk

let rel = Path.new("docs/readme.md");
print(rel.isRelative());   // true
print(rel.isAbsolute());   // false
let abs = rel.absolute();  // /current/working/dir/docs/readme.md
```

`normalize()` guarantees that `..` never escapes above the root, which is the basis for the library's path-traversal safety.

---

## Relative Paths

| Method | Description |
| :--- | :--- |
| `relativeTo(base)` | Relative path from `base` to `self` (both are resolved to absolute and normalized) |

```adesh
import Path;

let base = Path.new("/home/ajay");
let target = Path.new("/home/ajay/docs/file.txt");

let rel = target.relativeTo(base);
print(rel);   // docs/file.txt

// When there is no shared ancestor, parent segments are emitted:
let rel2 = Path.new("/var/log").relativeTo("/home/ajay");
print(rel2);  // ../../var/log
```

When both paths are equal, `relativeTo` returns `.`.

---

## Filesystem Integration

`Path` delegates existence and type checks to `FS`, so a `Path` can be used directly with `FS` functions.

| Method | Description |
| :--- | :--- |
| `exists()` | `true` if the path exists |
| `isFile()` | `true` if it is a regular file |
| `isDirectory()` | `true` if it is a directory |

```adesh
import Path;
import FS;

let config = Path.current().join("demo_config.json");

FS.writeText(config, "{\"env\": \"production\"}");

if config.exists() {
    print("Is file: " + str(config.isFile()));       // true
    print("Is directory: " + str(config.isDirectory()));  // false
    print(FS.readText(config));
    FS.delete(config);
}
```

---

## The `PathBuilder` fluent builder

```adesh
import Path;

let p = PathBuilder()
    .join("projects")
    .join("adesh")
    .join("src")
    .build();   // projects/adesh/src
```

---

## Complete example

A config-file workflow that combines `Path`, `FS`, and `Env`:

```adesh
import Path;
import FS;
import Env;

let config = Env.home()
    .join(".adesh")
    .join("config.toml");

if !config.exists() {
    FS.writeText(config, "theme = \"dark\"\n");
}

print("Config: " + config.toString());
print("Parent: " + config.parent().toString());
print("Stem:   " + config.stem());
print("Ext:    " + config.extension());

if config.isFile() {
    print(FS.readText(config));
}
```

---

## Notes & edge cases

- **Separators** are chosen per-host: `\` on Windows, `/` on Unix — including in `join`, `normalize`, and `root`.
- **Windows specifics**: drive letters (`C:`), UNC paths (`\\server\share`), and mixed slashes are handled; a root like `C:\` comes back from `root()`.
- **Unicode**: non-ASCII paths are fully supported (e.g. `C:\Users\अजय`, `/home/日本/docs`).
- **Path traversal safety**: normalization cannot let `..` climb above the root.
- `parent()` and `fileName()` return `null` at the root; `extension()` returns `null` when there is no dot in the file name.
- `canonicalize()` hits the real filesystem and errors if the path does not exist; `normalize()` is purely logical.
- Paths are also returned by `Env` directory/executable methods (`Env.home()`, `Env.tempDirectory()`, …), so they chain directly with `Path` and `FS`.

## Source & examples

- Implementation: `src/stdlib/Path.adesh` (backed by `src/runtime/stdlib_src/path/mod.rs` for `path_sep`, `path_current`, `path_home`, `path_temp`, `path_executable`, `path_canonicalize`)
- Runnable examples: `examples/Libraries/path/` (`01_create.adesh`, `02_join.adesh`, `03_components.adesh`, `04_parent.adesh`, `05_extension.adesh`, `06_relative.adesh`, `07_absolute.adesh`, `08_normalize.adesh`, `09_unicode.adesh`, `10_fs_integration.adesh`, `path_test.adesh`, `user_examples_test.adesh`)

## Related

- [Builtin Libraries Overview](overview)
- [FS Library](fs) — filesystem operations that accept `Path` objects
- [Env Library](env) — directory and executable methods that return `Path`
- [Standard Library Overview](../stdlib/overview)
- [Built-in Functions](../stdlib/builtins)
