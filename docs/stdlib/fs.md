---
id: fs
title: File System Module (stdlib/fs)
sidebar_label: File System
description: Comprehensive file system I/O, synchronous and asynchronous file reading, writing, directories, and metadata in AdeshLang.
---

# File System Module (`stdlib/fs`)

The `fs` module provides robust, cross-platform file system operations for reading, writing, inspecting, and manipulating files and directories.

:::info
A comprehensive reference with the full builtin API table is also available in the [**Builtin Libraries → File System**](../builtin/fs) section.
:::

```adesh
import { fs } from "stdlib/fs";
```

---

## 1. Quick File Reading & Writing

```adesh
import { fs } from "stdlib/fs";

fn main() -> Result<(), Error> {
    let file_path = "output.txt";

    // Write text to file
    fs::write_to_file(file_path, "Hello from AdeshLang File System!")?;

    // Read entire file as string
    let contents = fs::read_to_string(file_path)?;
    print(f"File contents:\n{contents}");

    // Append text to existing file
    fs::append(file_path, "\nSecond line appended.")?;

    return Ok(());
}
```

---

## 2. Streaming File I/O with `File` Object

For large files requiring buffered or chunk-by-chunk reading:

```adesh
import { fs } from "stdlib/fs";

fn process_large_file(path: string) -> Result<(), Error> {
    let mut file = fs::File::open(path, mode = "r")?;
    defer file.close();

    let mut buffer = [0u8; 4096]; // 4KB chunk buffer

    while let Ok(bytes_read) = file.read(&mut buffer) {
        if bytes_read == 0 {
            break; // EOF reached
        }
        print(f"Read {bytes_read} bytes");
    }

    return Ok(());
}
```

---

## 3. Directory Operations

```adesh
import { fs } from "stdlib/fs";

fn main() -> Result<(), Error> {
    let dir_name = "workspace/logs";

    // Create directory recursively (like mkdir -p)
    fs::create_dir_all(dir_name)?;

    // List directory entries
    let entries = fs::read_dir(dir_name)?;
    for entry in entries {
        print(f"Found: {entry.name} (is_dir={entry.is_dir})");
    }

    // Check existence
    if fs::exists("workspace/logs/app.log") {
        print("Log file exists!");
    }

    // Delete file or directory
    fs::remove_file("output.txt")?;
    fs::remove_dir_all("workspace")?;

    return Ok(());
}
```

---

## 4. File Metadata

```adesh
import { fs } from "stdlib/fs";

fn inspect_file(path: string) -> Result<(), Error> {
    let meta = fs::metadata(path)?;

    print(f"Size: {meta.size} bytes");
    print(f"Is Directory: {meta.is_directory}");
    print(f"Is Read-Only: {meta.is_readonly}");
    print(f"Modified Time: {meta.modified_epoch_seconds}");

    return Ok(());
}
```
