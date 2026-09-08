---
id: builtins
title: Built-in Functions
sidebar_label: Built-in Functions
---

# Built-in Functions

AdeshLang ships with a rich standard library of built-in functions organized by namespace. This page provides a complete reference.

## Native datatype methods

Core values expose behavior through receiver syntax:

```adesh
let title = " adesh ".trim().toUpperCase();
let unique = [1, 2, 2, 3].distinct().toSet();
let config = {port: 8080};
print(config.getOr("host", "localhost"));
```

See the complete [Native Datatype API Reference](/docs/language-guide/datatype-methods).

## Core Functions

### Printing

| Function | Description |
|----------|-------------|
| `print(...values, options?)` | Primary print function with styling options. [Details](print) |
| `println(...values)` | Print with automatic newline |
| `eprint(...values)` | Print to stderr |

```adesh
print("Hello", { color: "#00FF00", bold: true });
println("Line 1"); println("Line 2");
eprint("Error:", "Something went wrong");
```
### Type Inspection

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `type(value)` | Get type name of any value | `value: any` | `string` |
| `len(value)` | Length of array, string, object, tuple, set | `value: any` | `number` |
| `hasKey(object, key)` | Check if object has key | `object: object`, `key: string/number` | `boolean` |
| `capacity(array)` | Get capacity of dynamic array | `array: array` | `number` |
| `metadata_size(array)` | Get metadata overhead in bytes | `array: array` | `number` |

```adesh
print(type(42));           // "f64"
print(type("hello"));      // "string"
print(type([1,2,3]));      // "array"
print(len("abc"));         // 3
print(len([1,2,3]));       // 3
print(hasKey({a:1}, "a")); // true
print(capacity([1,2,3]));  // 3
print(metadata_size([1,2,3])); // 24
```

### Data Constructors

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `set(array)` | Create set from array (unique values) | `array: array` | `set` |
| `makeSet(array)` | Alias for `set()` | `array: array` | `set` |
| `tuple(array)` | Create tuple from array | `array: array` | `tuple` |
| `complex(real, imag)` | Create complex number | `real: number`, `imag: number` | `complex` |
| `Error(message?)` | Create error instance | `message?: string` | `error` |
| `error(message?)` | Alias for `Error()` | `message?: string` | `error` |
| `alloc(value)` | Check allocation kind ("inline" or "heap") | `value: any` | `string` |

```adesh
let s = set([1,2,2,3]);     // {1,2,3}
let t = tuple([1, "two", 3.0]); // (1, "two", 3.0)
let c = complex(3, 4);      // 3+4i
let err = Error("Oops");    // Error: Oops
print(alloc(42));           // "inline"
print(alloc([1,2,3]));      // "heap"
```

### Array/Collection Operations

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `map(array, fn)` | Transform each element | `array: array`, `fn: function` | `array` |
| `filter(array, fn)` | Keep elements matching predicate | `array: array`, `fn: function` | `array` |
| `reduce(array, fn, initial?)` | Reduce to single value | `array: array`, `fn: function`, `initial?: any` | `any` |

```adesh
let xs = [1, 2, 3, 4];
let evens = filter(xs, fn(x) { return x % 2 == 0; });  // [2, 4]
let doubled = map(evens, fn(x) { return x * 2; });     // [4, 8]
let sum = reduce(doubled, fn(a, b) { return a + b; }, 0); // 12
```

**Method syntax also works (VM mode):**
```adesh
let filtered = numbers.filter(fn(x) { return x > 5; });
let mapped = numbers.map(fn(x) { return x * x; });
let reduced = numbers.reduce(fn(a, x) { return a + x; }, 0);
```

### Array Methods (Available on Array Values)

These are called as methods on arrays (require VM mode for callbacks):

| Method | Description | Parameters |
|--------|-------------|------------|
| `push(value)` | Append element | `value: any` → `number` (new length) |
| `pop(index?)` | Remove and return last element (or at index) | `index?: number` → `any` |
| `shift()` | Remove and return first element | → `any` |
| `unshift(value)` | Prepend element | `value: any` → `number` (new length) |
| `insert(index, value)` | Insert at index | `index: number`, `value: any` → `number` |
| `remove(index)` | Remove element at index | `index: number` → `any` |
| `extend(array)` | Append all elements from array | `array: array` → `number` |
| `concat(array)` | Return new concatenated array | `array: array` → `array` |
| `set_index(index, value)` | Set element at index | `index: number`, `value: any` → `any` |
| `count(value)` | Count occurrences | `value: any` → `number` |
| `index(value)` / `indexOf(value)` | Find first index | `value: any` → `number` (-1 if not found) |
| `includes(value)` | Check if contains | `value: any` → `boolean` |
| `sort()` | Sort in place | → `array` |
| `reverse()` | Reverse in place | → `array` |
| `clear()` | Remove all elements | → `array` |

```adesh
let arr = [3, 1, 4, 1, 5];
arr.push(9);           // [3,1,4,1,5,9]
arr.unshift(0);        // [0,3,1,4,1,5,9]
arr.insert(2, 99);     // [0,3,99,1,4,1,5,9]
let popped = arr.pop(); // 9, arr = [0,3,99,1,4,1,5]
let arr = [3, 1, 4, 1, 5, 9];
arr.sort();            // [1, 1, 3, 4, 5, 9]
arr.reverse();         // [9, 5, 4, 3, 1, 1]
```

---

## Math Namespace

All math functions live under the `Math` namespace.

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `Math.PI` | 3.141592653589793 | π |
| `Math.E` | 2.718281828459045 | Euler's number |
| `Math.TAU` | 6.283185307179586 | 2π |
| `Math.SQRT2` | 1.4142135623730951 | √2 |
| `Math.LN2` | 0.6931471805599453 | ln(2) |
| `Math.LN10` | 2.302585092994046 | ln(10) |

### Random Number Generation

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `Math.seed(value)` | Set RNG seed for deterministic results | `value: number` | `void` |
| `Math.random()` | Random float [0, 1) | — | `number` |
| `Math.randomInt(min, max)` | Random integer [min, max) | `min: number`, `max: number` | `number` |
| `Math.randomRange(min, max)` | Random float [min, max) | `min: number`, `max: number` | `number` |

```adesh
Math.seed(42);
print(Math.random());        // 0.731...
print(Math.randomInt(1, 7)); // 1-6 (dice roll)
print(Math.randomRange(0, 100)); // 0-100
```

### Numeric Operations

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `Math.abs(x)` | Absolute value | `x: number` | `number` |
| `Math.min(...values)` | Minimum of arguments | `...values: number[]` | `number` |
| `Math.max(...values)` | Maximum of arguments | `...values: number[]` | `number` |
| `Math.pow(x, y)` | x to the power y | `x: number`, `y: number` | `number` |
| `Math.sqrt(x)` | Square root | `x: number` | `number` |
| `Math.floor(x)` | Round down | `x: number` | `number` |
| `Math.ceil(x)` | Round up | `x: number` | `number` |
| `Math.round(x)` | Round to nearest | `x: number` | `number` |
| `Math.trunc(x)` | Truncate fractional part | `x: number` | `number` |
| `Math.sign(x)` | Sign (-1, 0, or 1) | `x: number` | `number` |

### Trigonometric & Logarithmic

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `Math.sin(x)` | Sine (radians) | `x: number` | `number` |
| `Math.cos(x)` | Cosine (radians) | `x: number` | `number` |
| `Math.tan(x)` | Tangent (radians) | `x: number` | `number` |
| `Math.asin(x)` | Arc sine | `x: number` | `number` |
| `Math.acos(x)` | Arc cosine | `x: number` | `number` |
| `Math.atan(x)` | Arc tangent | `x: number` | `number` |
| `Math.atan2(y, x)` | Arc tangent of y/x | `y: number`, `x: number` | `number` |
| `Math.exp(x)` | e^x | `x: number` | `number` |
| `Math.log(x)` | Natural logarithm | `x: number` | `number` |
| `Math.log10(x)` | Base-10 logarithm | `x: number` | `number` |
| `Math.log2(x)` | Base-2 logarithm | `x: number` | `number` |

```adesh
print(Math.sin(Math.PI / 2));    // 1
print(Math.sqrt(16));            // 4
print(Math.max(1, 5, 3, 9, 2));  // 9
print(Math.log(Math.E));         // 1
```

---

## Time Namespace (`time.*`)

| Function | Description | Returns |
|----------|-------------|---------|
| `time.now()` | Nanoseconds since program start (monotonic) | `bigint` |
| `time.nowMs()` | Milliseconds since program start (monotonic) | `number` |
| `time.nowUs()` | Microseconds since program start (monotonic) | `number` |
| `time.nowSecs()` | Seconds since program start (monotonic) | `number` |
| `time.epoch()` | Unix epoch milliseconds (wall clock) | `number` |
| `time.epochNanos()` | Unix epoch nanoseconds (wall clock) | `bigint` |
| `clock()` | Alias for `time.nowSecs()` | `number` |
| `Date(ms?)` | Create date object from epoch ms | `object` |

```adesh
let start = time.nowMs();
// ... do work ...
let elapsed = time.nowMs() - start;
print("Elapsed:", elapsed, "ms");

print("Epoch ms:", time.epoch());
print("Epoch nanos:", time.epochNanos());
```

---

## JSON Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `json_parse(str)` | Parse JSON string | `str: string` | `any` |
| `json_stringify(value)` | Convert value to JSON string | `value: any` | `string` |

```adesh
let obj = json_parse('{"name":"Adesh","version":1}');
print(obj.name);              // "Adesh"
print(json_stringify(obj));   // '{"name":"Adesh","version":1}'
```

---

## Async Runtime

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `Promise(executor)` | Create Promise | `executor: function(resolve, reject)` | `promise` |
| `sleep(ms)` | Promise that resolves after ms | `ms: number` | `promise` |
| `delay(ms)` | Alias for `sleep` | `ms: number` | `promise` |
| `setTimeout(fn, ms, ...args)` | Schedule callback | `fn: function`, `ms: number`, `...args` | `number` (timer ID) |
| `clearTimeout(id)` | Cancel timeout | `id: number` | `void` |
| `setInterval(fn, ms, ...args)` | Schedule repeating callback | `fn: function`, `ms: number`, `...args` | `number` (timer ID) |
| `clearInterval(id)` | Cancel interval | `id: number` | `void` |

```adesh
async fn demo() {
    print("Start");
    await sleep(1000);
    print("After 1 second");
    
    let id = setTimeout(fn() { print("Timeout!"); }, 500);
    clearTimeout(id); // Cancel it
}
```

---

## Concurrency Namespace

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `parallel_map(array, fn)` | Map function over array | `array: array`, `fn: function` | `array` |
| `parallel_reduce(array, init, fn)` | Reduce array | `array: array`, `init: any`, `fn: function` | `any` |
| `parallel_for(start, end, fn?)` | Loop range with optional function | `start: number`, `end: number`, `fn?: function` | `void` |

> **Note:** Currently sequential implementations; organized for future parallelization.

```adesh
let numbers = [1, 2, 3, 4, 5];
let doubled = parallel_map(numbers, fn(x) { return x * 2; });
let sum = parallel_reduce(numbers, 0, fn(a, b) { return a + b; });
parallel_for(0, 5, fn(i) { print("Index:", i); });
```

---

## System/Process Helpers

### Arguments

| Function | Description | Returns |
|----------|-------------|---------|
| `execName()` | Executable name | `string` |
| `args()` | Raw argv as array | `array<string>` |
| `argsCount()` | Argument count | `number` |
| `argsSlice(start, end?)` | Slice argv | `array<string>` |
| `argsIndexOf(value)` | Find arg index | `number` |
| `argsJoin(separator)` | Join argv | `string` |
| `parseArgs()` | Parse flags and positionals | `object { flags, positionals }` |
| `argGet(name, default?)` | Get flag value | `string` or `default` |
| `argHas(name)` | Check if flag present | `boolean` |

```adesh
print("Executable:", execName());
print("Args:", args());
print("Parsed:", parseArgs());
if (argHas("help")) { print("Usage: ..."); }
```

### Environment Variables

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `env(name)` | Get env var | `name: string` | `string` or `null` |
| `envGet(name, default)` | Get with default | `name: string`, `default: string` | `string` |
| `envHas(name)` | Check if exists | `name: string` | `boolean` |
| `envAll()` | Get all env vars | — | `object` |

### .env File Support

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `envFromFile(path?)` | Load .env file to object | `path?: string = ".env"` | `object` |
| `envFileGet(key, default?, path?)` | Get key from .env | `key: string`, `default?: any`, `path?: string` | `any` |
| `envRuntimeGet(key)` | Get runtime env var | `key: string` | `string` or `null` |
| `envRuntimeHas(key)` | Check runtime env | `key: string` | `boolean` |
| `envRuntimeAll()` | Get all runtime env | — | `object` |
| `envRuntimeLoad(obj)` | Load runtime env from object | `obj: object` | `number` (count loaded) |

```adesh
// .env file: API_KEY=secret123
let config = envFromFile();        // { API_KEY: "secret123" }
let key = envFileGet("API_KEY");   // "secret123"
envRuntimeLoad(config);            // Makes available via env()
print(env("API_KEY"));             // "secret123"
```

---

## Filesystem Functions (`fs.*`)

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `fs.read(path)` | Read file as string | `path: string` | `string` |
| `fs.write(path, content)` | Write string to file | `path: string`, `content: string` | `void` |
| `fs.copy(src, dest)` | Copy file | `src: string`, `dest: string` | `void` |
| `fs.move(src, dest)` | Move/rename file | `src: string`, `dest: string` | `void` |
| `fs.exists(path)` | Check if path exists | `path: string` | `boolean` |
| `fs.isFile(path)` | Check if file | `path: string` | `boolean` |
| `fs.isDir(path)` | Check if directory | `path: string` | `boolean` |
| `fs.tempDir()` | Get temp directory path | — | `string` |
| `fs.lock(path)` | Lock file (sidecar) | `path: string` | `void` |
| `fs.unlock(path)` | Unlock file | `path: string` | `void` |
| `fs.crc32(data)` | CRC32 hash | `data: string/bytes` | `number` |
| `fs.sha256(data)` | SHA256 hash | `data: string/bytes` | `string` |
| `fs.watch(path, callback)` | Watch for changes | `path: string`, `callback: function` | `number` (watch ID) |
| `fs.unwatch(id)` | Cancel watch | `id: number` | `void` |

### Path Utilities (`fs.path.*`)

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `fs.path.join(...parts)` | Join path segments | `...parts: string[]` | `string` |
| `fs.path.basename(path)` | Get file name | `path: string` | `string` |
| `fs.path.dirname(path)` | Get directory | `path: string` | `string` |
| `fs.path.extname(path)` | Get extension | `path: string` | `string` |

```adesh
fs.write("config.json", json_stringify({port: 8080}));
let config = json_parse(fs.read("config.json"));
print(fs.path.join("/home", "user", "file.txt")); // "/home/user/file.txt"
```

---

## Decorators (Built-in)

Used as `@decorator` or `@decorator(args)` on functions.

| Decorator | Factory Args | Description |
|-----------|--------------|-------------|
| `@memoize` | — | Cache function results by arguments |
| `@trace` | — | Log function entry/exit with timing |
| `@deprecated` | `message?: string` | Warn on function call |
| `@timeout` | `ms: number` | Add timeout (stub) |
| `@retry` | `attempts: number, delay_ms?: number` | Retry on failure |
| `@benchmark` | — | Measure and print execution time |

```adesh
@memoize
fn fib(n) {
    if (n <= 1) return n;
    return fib(n-1) + fib(n-2);
}

@trace
fn add(a, b) { return a + b; }

@deprecated("Use v2 instead")
fn oldApi() { ... }

@retry(3, 1000)
fn unreliable() { ... }

@benchmark
fn slow() { sleep(100); }
```

---

## Interactive Input & TUI Subsystem

| Function / Builtin | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `input(prompt?, options?)` | Read stdin with validation options (`regex`, `notEmpty`, `min`, `max`, `masked`, `onSubmit`) | `prompt?: string`, `options?: object` | `string` |
| `input.confirm(prompt)` | Interactive boolean prompt (`(y/N)` or `(Y/n)`) | `prompt: string` | `boolean` |
| `input.password(prompt)` | Masked password input | `prompt: string` | `string` |
| `input.select(prompt, options)` | Interactive single-choice list | `prompt: string`, `options: array` | `string` |
| `input.checkbox(prompt, options)` | Interactive multi-choice checkboxes (Space toggle) | `prompt: string`, `options: array` | `array<string>` |
| `input.radio(prompt, options)` | Interactive radio selector | `prompt: string`, `options: array` | `string` |
| `input.fuzzy(prompt, options)` | Interactive fuzzy search selector | `prompt: string`, `options: array` | `string` |
| `input.datepicker(prompt)` | Interactive 3-field calendar date picker (`YEAR`, `MONTH`, `DAY`) | `prompt: string` | `string` (`YYYY-MM-DD`) |
| `input.datetime(prompt)` | Interactive 6-field timestamp picker (`Y-M-D H:M:S`) | `prompt: string` | `string` (`YYYY-MM-DD HH:MM:SS`) |
| `input.diff(orig, mod)` | Visual split-pane side-by-side patch editor | `orig: string`, `mod: string` | `string` |
| `input.table(prompt?, headers, data)` | 2D data grid selector with `.row`, `.col`, `.value`, `.cell`, `.header`, `.rowData`, `.colData`, `.rowObject`, `.headers`, `.grid` | `headers: array`, `data: array` | `object` |
| `input.pin(prompt, length?)` | Discrete PIN/OTP digit box pad (`[ ● ] [ ● ] [ ● ] [ ● ]`) | `prompt: string`, `length?: number` | `string` |
| `input.slider(prompt, options)` | Interactive visual horizontal gauge slider | `prompt: string`, `options: object` | `number` |
| `input.color(prompt)` | Interactive RGB color component selector | `prompt: string` | `string` (`#RRGGBB`) |
| `input.hotkey(prompt)` | Keyboard shortcut & modifier listener | `prompt: string` | `string` (`"Ctrl+S"`) |
| `input.tree(prompt, root)` | Hierarchical collapsible tree explorer | `prompt: string`, `root: object` | `string` |
| `input.form(fields)` | Multi-field structured form | `fields: array<object>` | `object` |
| `input.mock(values)` | Automated mock input queue for testing | `values: array<any>` | `void` |

See [Interactive Input & TUI Widgets](input) for full documentation and keybindings.

---

## Quick Reference: All Global Functions

```
print, println, eprint
input, input.confirm, input.password, input.select, input.checkbox, input.radio, input.form
input.fuzzy, input.slider, input.color, input.hotkey, input.datepicker, input.datetime
input.diff, input.table, input.tree, input.pin, input.mock
type, len, hasKey, capacity, metadata_size
set, makeSet, tuple, complex, Error, error, alloc
map, filter, reduce
Math.PI, Math.E, Math.TAU, Math.SQRT2, Math.LN2, Math.LN10
Math.random, Math.randomInt, Math.randomRange, Math.seed
Math.abs, Math.min, Math.max, Math.pow, Math.sqrt
Math.floor, Math.ceil, Math.round, Math.trunc, Math.sign
Math.sin, Math.cos, Math.tan, Math.asin, Math.acos, Math.atan, Math.atan2
Math.exp, Math.log, Math.log10, Math.log2
time.now, time.nowMs, time.nowUs, time.nowSecs, time.epoch, time.epochNanos, clock, Date
json_parse, json_stringify
Promise, sleep, delay, setTimeout, clearTimeout, setInterval, clearInterval
parallel_map, parallel_reduce, parallel_for
execName, args, argsCount, argsSlice, argsIndexOf, argsJoin
parseArgs, argGet, argHas
env, envGet, envHas, envAll
envFromFile, envFileGet, envRuntimeGet, envRuntimeHas, envRuntimeAll, envRuntimeLoad
fs.read, fs.write, fs.copy, fs.move, fs.exists, fs.isFile, fs.isDir
fs.tempDir, fs.lock, fs.unlock, fs.crc32, fs.sha256, fs.watch, fs.unwatch
fs.path.join, fs.path.basename, fs.path.dirname, fs.path.extname
```

---

## Modules

For larger APIs, see dedicated pages:
- **[Print Function](print)** — Complete formatting, styling, pretty-print options
- **[Interactive Input & TUI](input)** — 18+ interactive terminal input widgets, data grid, date/datetime pickers, visual diff, and PIN pad
- **[FS Module](fs)** — Filesystem operations
- **[HTTP Module](http)** — HTTP client
- **[Concurrency](concurrency)** — Threading, channels, mutexes
- **[Full Builtin Library List](overview)** — every builtin library reference
- **[Testing Framework](../tools/testing)** — Test framework