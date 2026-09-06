---
id: print
title: Print Function
sidebar_label: Print
---

# Print Function

The `print` function is AdeshLang's primary output mechanism. It is a high-performance, feature-rich tool designed for everything from simple debugging to professional CLI output with support for colors, styles, and structured data.

## Core Functions

| Function | Description |
| :--- | :--- |
| `print(...args, options?)` | Prints values to standard output (stdout). |
| `println(...args)` | Convenience function that appends a newline (`\n`). |
| `eprint(...args)` | Prints values to standard error (stderr). |

## Basic Usage

You can pass any number of arguments to `print`. Values are automatically converted to strings and separated by a space by default.

```adesh
print("Hello", "World");      // Output: Hello World
print(42, true, [1, 2, 3]);   // Output: 42 true [1, 2, 3]
```

## Formatting Options

The last argument to `print` can be an optional **options object** to customize the output behavior.

### Options Reference

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sep` | `string` | `" "` | Separator string between values. |
| `end` | `string` | `"\n"` | String appended at the end of output. |
| `file` | `string` | - | File path to write output to (creates or appends). |
| `flush` | `boolean` | `false` | Whether to force flush the output buffer. |
| `pretty` | `boolean \| string` | `false` | Enable pretty printing for complex types. Modes: `true`/`"full"`, `"compact"`, `"simple"`, `"none"`/`false`. |

### Examples

```adesh
// Custom separator
print("apple", "banana", "cherry", { sep: ", " }); 
// Output: apple, banana, cherry

// No newline at the end
print("Loading", { end: "..." });
print("Done!"); 
// Output: Loading...Done!

// Custom separator + custom end + color
print("Error", "Warning", "Info", { 
    sep: " | ", 
    end: " <---\n",
    color: "#FF0000"
});
// Output: Error | Warning | Info <---

// Write to file
print("Logged to file", { file: "app.log" });
print("Another entry", { file: "app.log" });
```

## Text Styling (ANSI)

AdeshLang supports rich text styling in terminals using ANSI escape codes. These are configured via the options object.

### Style Options

| Style Option | Type | Description |
| :--- | :--- | :--- |
| `color` | `string` | Text color in hex format (`#RRGGBB` or `#RGB`). |
| `background` | `string` | Background color in hex format. |
| `bold` | `boolean` | Renders text in bold. |
| `italic` | `boolean` | Renders text in italics. |
| `underline` | `boolean` | Underlines the text. |
| `strikethrough` | `boolean` | Adds a strikethrough to the text. |

### Color Format

Colors accept 6-digit (`#RRGGBB`) or 3-digit shorthand (`#RGB`) hex notation:
- `#FF0000` or `#F00` — Red
- `#00FF00` or `#0F0` — Green
- `#0000FF` or `#00F` — Blue
- `#FFFFFF` or `#FFF` — White
- `#000000` or `#000` — Black

### Examples

```adesh
// Basic colors
print("Red text", { color: "#FF0000" });
print("Green text", { color: "#00FF00" });
print("Blue text", { color: "#0000FF" });

// Background colors
print("White on red", { background: "#FF0000", color: "#FFFFFF" });
print("Black on yellow", { background: "#FFFF00", color: "#000000" });

// Text styles
print("Bold text", { bold: true });
print("Italic text", { italic: true });
print("Underlined", { underline: true });
print("Strikethrough", { strikethrough: true });

// Combined styles
print("Bold + Italic", { bold: true, italic: true });
print("Bold + Underline + Red", { bold: true, underline: true, color: "#FF0000" });
print("All styles combined", {
    bold: true,
    italic: true,
    underline: true,
    color: "#FFFFFF",
    background: "#800080"
});

// Practical log levels
print("SUCCESS:", "Operation completed", { color: "#00FF00", bold: true });
print("WARNING:", "Low memory", { color: "#FFFF00", bold: true });
print("ERROR:", "File not found", { color: "#FF0000", bold: true });
print("INFO:", "Processing started", { color: "#00FFFF" });

// Log levels with timestamps
let timestamp = "2026-02-03T10:30:00Z";
print("[", timestamp, "]", "DEBUG", "Variable x =", 42, { sep: " ", color: "#888888" });
print("[", timestamp, "]", "INFO", "Server started on port 8080", { sep: " ", color: "#00FFFF" });
print("[", timestamp, "]", "WARN", "Deprecated API usage", { sep: " ", color: "#FFFF00" });
print("[", timestamp, "]", "ERROR", "Connection timeout", { sep: " ", color: "#FF0000" });
```

## Pretty Print

The **Pretty Print** feature provides beautiful, structured, and colored output for complex data types like arrays, objects, tuples, and nested structures. It is invaluable for debugging and logging.

### Enabling Pretty Print

Set the `pretty` option to `true` (or `"full"`) to enable the default full mode, or specify a specific mode:

```adesh
let data = {
    name: "Alice",
    age: 30,
    skills: ["AdeshLang", "Rust", "LLVM"]
};

print(data, { pretty: true });      // Full mode (default)
print(data, { pretty: "full" });    // Explicit full mode
print(data, { pretty: "compact" }); // Compact mode
print(data, { pretty: "simple" });  // Simple mode
print(data, { pretty: "none" });    // Disable (regular print)
print(data, { pretty: false });     // Disable (regular print)
```

### Pretty Print Modes

| Mode | Usage | Description |
| :--- | :--- | :--- |
| `"full"` (default) | `pretty: true` or `pretty: "full"` | **Full Mode**: Includes indentation, auto-coloring, object key alignment, and type hints. Best for detailed debugging. |
| `"compact"` | `pretty: "compact"` | **Compact Mode**: Clean indentation and alignment, but removes type hints for a cleaner look. |
| `"simple"` | `pretty: "simple"` | **Simple Mode**: Basic colors, minimal formatting. Good for terminals with limited color support. |
| `"none"` / `false` | `pretty: false` or `pretty: "none"` | **Disabled**: Standard print output without formatting. |

### Pretty Print with Combined Options

Pretty print can be combined with other options like `sep`, `end`, and styling:

```adesh
let obj = { name: "Test", count: 42, items: [1, 2, 3] };

// Pretty print with custom separator
print(obj, { pretty: true, sep: " | " });
// Output: { name: "Test", count: 42, items: [1, 2, 3] } | 

// Pretty print without newline
print(obj, { pretty: true, end: " <---\n" });

// Multiple values with pretty print
let arr = [1, 2, 3];
let tup = (true, "test", 3.14);
print(arr, tup, { pretty: "compact", sep: "\n---\n" });
```

### Pretty Print Examples

#### Collections

```adesh
// Array
let arr = [10, 20, 30, 40, 50];
print(arr, { pretty: true });
// Full output:
// [
//   10 (number),
//   20 (number),
//   30 (number),
//   40 (number),
//   50 (number)
// ]

// Object
let person = {
    name: "John Doe",
    age: 28,
    email: "john@example.com"
};
print(person, { pretty: true });
// Full output:
// {
//   name: "John Doe" (string),
//   age: 28 (number),
//   email: "john@example.com" (string)
// }

// Tuple
let tup = (true, "test", 3.14);
print(tup, { pretty: true });
// Full output:
// (
//   true (bool),
//   "test" (string),
//   3.14 (number)
// )
```

#### Nested Structures

```adesh
let company = {
    name: "Tech Corp",
    employees: 150,
    departments: ["Engineering", "Sales", "HR"],
    headquarters: {
        city: "San Francisco",
        country: "USA"
    }
};

print(company, { pretty: true });
/* Full output:
{
  name: "Tech Corp" (string),
  employees: 150 (number),
  departments: [
    "Engineering" (string),
    "Sales" (string),
    "HR" (string)
  ] (array),
  headquarters: {
    city: "San Francisco" (string),
    country: "USA" (string)
  } (object)
}
*/
```

#### Compact Mode Comparison

```adesh
let data = { name: "Test", count: 42, items: [1, 2, 3] };

print("Full mode:");
print(data, { pretty: "full" });

print("\nCompact mode:");
print(data, { pretty: "compact" });
/*
{
  name: "Test",
  count: 42,
  items: [1, 2, 3]
}
*/

print("\nSimple mode:");
print(data, { pretty: "simple" });
/*
{ name: "Test", count: 42, items: [1, 2, 3] }
*/
```

#### Type Hints

In full mode, pretty print shows type hints for each value (e.g., `(string)`, `(number)`, `(bool)`):

```adesh
let num = 42;
let flt = 3.14159;
let str_val = "hello";
let bool_val = true;

print(num, { pretty: true });      // 42 (number)
print(flt, { pretty: true });      // 3.14159 (number)
print(str_val, { pretty: true });  // "hello" (string)
print(bool_val, { pretty: true }); // true (bool)
```

#### Complex Nested Example

```adesh
let complex = {
  user: { name: "Alice", age: 30 },
  items: [1, 2, 3],
  active: true,
  metadata: {
    tags: ["admin", "premium"],
    settings: { theme: "dark", lang: "en" }
  }
};

print(complex, { pretty: true });
/* Full output:
{
  user: {
    name: "Alice" (string),
    age: 30 (number)
  } (object),
  items: [
    1 (number),
    2 (number),
    3 (number)
  ] (array),
  active: true (bool),
  metadata: {
    tags: [
      "admin" (string),
      "premium" (string)
    ] (array),
    settings: {
      theme: "dark" (string),
      lang: "en" (string)
    } (object)
  } (object)
}
*/
```

## File Output

The `file` option writes output directly to a file (creates or appends). This is useful for logging.

```adesh
print("Application started", { file: "app.log" });
print("User logged in: Alice", { file: "app.log" });
print("Error: Connection failed", { file: "app.log" });
```

**Note:** When `file` is specified, output goes to the file instead of stdout. The `color`, `background`, and styling options are ignored for file output (ANSI codes are not written to files).

## Flush Output

The `flush` option forces the output buffer to be written immediately. This is critical for real-time logging, progress indicators, or when output must appear before program termination.

```adesh
// Real-time progress indicator
for i in range(1, 6) {
    print("Processing step ", i, { end: "\r", flush: true });
    sleep(500);  // Simulate work
}
print("Done!          \n");
// Output updates in place: "Processing step 1" → "Processing step 2" → ... → "Done!"
```

## Println and Eprint

### `println(...)`
Equivalent to `print(..., { end: "\n" })`. Adds a newline automatically.

```adesh
println("Line 1");
println("Line 2");
println("Value:", 42, "Status:", "OK");
// Each call ends with a newline
```

### `eprint(...)`
Prints to standard error (stderr). Useful for error messages, diagnostics, or separating error output from regular output. Does not support styling or pretty print options.

```adesh
eprint("Error: Configuration file missing");
eprint("Warning:", "Deprecated function used");
eprint("Debug info:", { attempt: 3, maxRetries: 5 });
```

## Complete Example: Real-World Logging

```adesh
fn log_info(message: string, data: any) {
    let ts = "2026-02-03T10:30:00Z";
    print("[", ts, "] ", "INFO", " ", message, { 
        sep: "", 
        color: "#00FFFF" 
    });
    if data != null {
        print(data, { pretty: "compact", end: "\n" });
    }
}

fn log_error(message: string, error: any) {
    let ts = "2026-02-03T10:30:00Z";
    print("[", ts, "] ", "ERROR", " ", message, { 
        sep: "", 
        color: "#FF0000", 
        bold: true 
    });
    if error != null {
        print(error, { pretty: "compact", end: "\n" });
    }
}

fn log_warn(message: string, data: any) {
    let ts = "2026-02-03T10:30:00Z";
    print("[", ts, "] ", "WARN", " ", message, { 
        sep: "", 
        color: "#FFFF00", 
        bold: true 
    });
    if data != null {
        print(data, { pretty: "compact", end: "\n" });
    }
}

// Usage
log_info("Server started", { port: 8080, workers: 4 });
log_warn("High memory usage", { used: "85%", threshold: "80%" });
log_error("Database connection failed", { host: "db.example.com", code: "ECONNREFUSED" });
```

**Expected Output:**
```
[2026-02-03T10:30:00Z] INFO Server started { port: 8080, workers: 4 }
[2026-02-03T10:30:00Z] WARN High memory usage { used: "85%", threshold: "80%" }
[2026-02-03T10:30:00Z] ERROR Database connection failed { host: "db.example.com", code: "ECONNREFUSED" }
```

## Complete Options Summary

| Option | Type | Default | Applies To | Description |
|--------|------|---------|------------|-------------|
| `sep` | `string` | `" "` | `print`, `println` | Separator between values |
| `end` | `string` | `"\n"` | `print` | String appended after all values |
| `file` | `string` | - | `print` | File path to write to (appends) |
| `flush` | `boolean` | `false` | `print` | Force flush output buffer |
| `color` | `string` | - | `print` | Text color (hex: `#RRGGBB` or `#RGB`) |
| `background` | `string` | - | `print` | Background color (hex) |
| `bold` | `boolean` | `false` | `print` | Bold text |
| `italic` | `boolean` | `false` | `print` | Italic text |
| `underline` | `boolean` | `false` | `print` | Underlined text |
| `strikethrough` | `boolean` | `false` | `print` | Strikethrough text |
| `pretty` | `bool\|string` | `false` | `print` | Pretty print mode: `true`/`"full"`, `"compact"`, `"simple"`, `"none"`/`false` |

## Notes

- **Option Detection**: The options object is detected as the last argument if it contains any known option key (`sep`, `end`, `file`, `color`, `background`, `underline`, `bold`, `italic`, `strikethrough`, `pretty`).
- **ANSI Support**: Colors and styles require a terminal that supports ANSI escape codes (most modern terminals).
- **File Output**: When `file` is used, ANSI styling is stripped (no color codes written to files).
- **Performance**: For high-frequency printing, consider batching output or using `flush: false` (default) for buffered writes.
- **Pretty Print Performance**: Full pretty print mode has overhead for large data structures. Use `"compact"` or `"simple"` for better performance.