---
id: env
title: Env Library
sidebar_label: Env
---

# Env Library

The **Env** builtin library gives AdeshLang access to environment variables, user/system directories, platform and process metadata, and command-line arguments — all through a single `Env` namespace. Directory and executable queries return `Path` instances so they chain fluently with the `Path` and `FS` libraries, and a runtime "environment" layer backs `.env` file support.

## Namespace

| Name | What it provides |
| :--- | :--- |
| `Env` | The namespace: environment variables, `.env` files, directories, platform info, and command-line args |

## Importing the library

```adesh
import Env;                  // or import "std:Env" as Env;
```

Every method is static — there is no `Env()` instance.

```adesh
import Env;

let home = Env.home();
let config = Env.home().join(".adesh").join("config.toml");

if Env.contains("JAVA_HOME") {
    print("Java installed: " + Env.get("JAVA_HOME"));
}

print("OS: " + Env.os());
print("Args: " + str(Env.arguments()));
```

---

## Environment Variables

| Method | Description | Returns |
| :--- | :--- | :--- |
| `get(key)` | Value of `key`, or `null` if not set | `string \| null` |
| `getOrDefault(key, default = null)` | Value of `key`, else `default` | `string` |
| `set(key, value)` | Set or update `key` | `void` |
| `setIfAbsent(key, value)` | Set `key` only when missing; `true` if set | `boolean` |
| `remove(key)` / `unset(key)` | Remove `key` (aliases) | `void` |
| `contains(key)` / `has(key)` / `exists(key)` | Whether `key` is set (aliases) | `boolean` |
| `clear()` | Clear all runtime-set variables | `void` |
| `variables()` / `environ()` / `toObject()` | All key-value pairs as an object (aliases) | `object` |
| `keys()` | All variable names | `array` |
| `values()` | All variable values | `array` |
| `count()` | Number of visible variables | `int` |
| `getMany(keys)` | Object with only the requested keys that exist | `object` |
| `filter(prefix)` | Object of variables whose key starts with `prefix` | `object` |
| `filterKeys(prefix)` | Array of variable names starting with `prefix` | `array` |

```adesh
import Env;

print("PATH: " + str(Env.get("PATH")));

if Env.contains("JAVA_HOME") {
    print("Java installed at: " + str(Env.get("JAVA_HOME")));
} else {
    print("JAVA_HOME environment variable is not set.");
}

Env.set("APP_MODE", "production");
print(Env.get("APP_MODE"));                 // production
print(Env.getOrDefault("APP_MODE", "dev")); // production
Env.remove("APP_MODE");
print(Env.get("APP_MODE"));                 // null
```

```adesh
import Env;

Env.set("DEMO_MODE", "test");
Env.set("DEMO_REGION", "us-east");

print(Env.getMany(["DEMO_MODE", "DEMO_REGION", "NOPE"]));
// {"DEMO_MODE": "test", "DEMO_REGION": "us-east"}

print(Env.filter("DEMO_"));      // {"DEMO_MODE": "test", "DEMO_REGION": "us-east"}
print(Env.filterKeys("DEMO_"));  // ["DEMO_MODE", "DEMO_REGION"]

print(Env.setIfAbsent("DEMO_MODE", "x"));  // false — already set
print(Env.setIfAbsent("DEMO_NEW", "x"));   // true — was missing
```

---

## `.env` File Support

The runtime keeps a separate "runtime environment" layer. `Env.load` populates it from a `.env` file, and `Env.get` consults runtime-loaded values first, then the OS.

| Method | Description | Returns |
| :--- | :--- | :--- |
| `fromFile(path = ".env")` | Read a `.env` file into an object | `object` |
| `getFromFile(key, default = null, path = ".env")` | Read a single key from a `.env` file | `string` |
| `load(path = ".env", overwrite = false)` / `loadFromFile(...)` | Load a `.env` file into the runtime env (aliases) | `int` |
| `runtimeLoad(objectOrPath, overwrite = false)` | Load variables from an object or file into the runtime env | `int` |
| `runtimeVariables()` | All runtime-stored variables | `object` |
| `runtimeGet(key)` | Value from the runtime env | `string` |
| `runtimeHas(key)` | Whether a runtime variable exists | `boolean` |

```adesh
import Env;

// .env file:  APP_NAME=AdeshLang / APP_ENV=development
let data = Env.fromFile(".env");
for k in data {
    print(k + " = " + str(data[k]));
}

let n = Env.runtimeLoad({
    "MY_APP_HOST": "127.0.0.1",
    "MY_APP_PORT": "8080"
});
print("Loaded " + str(n) + " variable(s)");

print(Env.runtimeGet("MY_APP_HOST"));  // 127.0.0.1
print(Env.runtimeHas("MY_APP_PORT"));  // true
```

---

## Standard Directories

All directory methods return a **`Path` instance**, so they chain with `Path` and `FS`.

| Method | Returns the… | Returns |
| :--- | :--- | :--- |
| `currentDirectory()` | Current working directory | `Path` |
| `setCurrentDirectory(path)` | — (changes the working directory) | `void` |
| `home()` | User home directory | `Path` |
| `desktop()` / `documents()` / `downloads()` | Desktop / Documents / Downloads | `Path` |
| `pictures()` / `music()` / `videos()` | Pictures / Music / Videos | `Path` |
| `public()` | Public shared directory | `Path` |
| `tempDirectory()` | System temp directory | `Path` |
| `userCacheDirectory()` | User cache dir (e.g. `AppData/Local`) | `Path` |
| `userConfigDirectory()` | User config dir (e.g. `AppData/Roaming`) | `Path` |

```adesh
import Env;
import FS;

let config = Env.home()
    .join(".adesh")
    .join("config.toml");

print("Config Path: " + config.toString());
print("Config Parent: " + config.parent().toString());
print("FS Exists Check: " + str(FS.exists(config)));
```

---

## Executable

| Method | Returns |
| :--- | :--- |
| `executable()` | Absolute path to the running script/binary as `Path` |
| `executableDirectory()` | Parent directory of the running script/binary as `Path` |
| `executableName()` | File name of the running script/binary |

```adesh
import Env;

let exePath = Env.executable();
print("Executable Path: " + exePath.toString());

let exeDir = Env.executableDirectory();
print("Executable Parent Directory: " + exeDir.toString());
```

---

## Platform & System Info

| Method | Description |
| :--- | :--- |
| `os()` / `platform()` | OS identifier: `"windows"`, `"linux"`, `"macos"`, `"wasm"` |
| `architecture()` / `arch()` | CPU architecture: `"x86_64"`, `"aarch64"`, `"x86"`, `"wasm32"` |
| `hostname()` / `username()` / `userId()` / `shell()` | System identity |
| `processId()` / `parentProcessId()` / `processTitle()` | Process metadata |
| `osType()` / `osVersion()` / `osFamily()` / `osRelease()` / `osDescription()` | OS name, version, family, release, and description |
| `cpuCount()` / `pagesize()` / `endianness()` / `machineId()` | Hardware metadata |
| `totalMemory()` / `freeMemory()` / `usedMemory()` | Memory in bytes |
| `memoryUsage()` | `{ total, free, used, percent }` |
| `uptime()` / `systemUptime()` | Process / system uptime in seconds |
| `loadAverage()` | Load averages `[1m, 5m, 15m]` |
| `userInfo()` | `{ username, userId, userGid, home, shell }` |
| `systemInfo()` | One object with all of the above |
| `commandLine()` | Full command line string |

```adesh
import Env;

print("OS: " + Env.os());              // windows
print("Arch: " + Env.architecture());  // x86_64
print("Hostname: " + Env.hostname());
print("PID: " + str(Env.processId()));

let mem = Env.memoryUsage();
print("Total:  " + str(mem.total) + " bytes");
print("Free:   " + str(mem.free) + " bytes");
print("Used:   " + str(mem.used) + " bytes");
print("Used %: " + str(mem.percent));
```

The `systemInfo()` object exposes every field at once — `os`, `osType`, `osVersion`, `osFamily`, `osRelease`, `osDescription`, `arch`, `platform`, `hostname`, `username`, `userId`, `userGid`, `pid`, `ppid`, `shell`, `cpuCount`, `totalMemory`, `freeMemory`, `processUptime`, `systemUptime`, `loadavg`, `endianness`, `pagesize`, `processTitle`, `machineId`, `userHome`, `userCache`, `userConfig`, `tempDir`, `currentDir`, and `currentExe`.

### Platform predicates

| Method | Returns `true` on… |
| :--- | :--- |
| `isWindows()` | Windows |
| `isLinux()` | Linux |
| `isMacOS()` | macOS |
| `isWasm()` | WebAssembly |
| `isUnix()` | Any non-Windows, non-WASM platform (Linux/macOS) |

---

## Runtime & Separators

| Method | Description |
| :--- | :--- |
| `languageVersion()` / `compilerVersion()` / `runtimeVersion()` | Version strings (`"1.0.0"`) |
| `version()` | `{ language, compiler, runtime }` |
| `pathSeparator()` / `pathListSeparator()` | `";"` on Windows, `":"` on Unix |
| `fileSeparator()` | `"\\"` on Windows, `"/"` on Unix |
| `lineSeparator()` / `eol()` | `"\r\n"` on Windows, `"\n"` on Unix |

---

## Command-Line Arguments

| Method | Description | Returns |
| :--- | :--- | :--- |
| `arguments()` / `args()` / `argv()` | Command-line arguments (excluding the executable) | `array` |
| `argumentCount()` / `argc()` / `argsCount()` | Count of arguments | `int` |
| `arg(index)` | 0-based argument; `null` when out of bounds | `string \| null` |
| `argsSlice(start)` | Arguments from `start` onward | `array` |
| `argsJoin(sep = " ")` | Join all arguments with `sep` | `string` |
| `argsIndexOf(value)` | Index of first argument equal to `value`, or `-1` | `int` |
| `execName()` | Executable name | `string` |
| `parseArgs()` | Parse into `{ flags, positionals }` | `object` |
| `argGet(name, default = null)` | Value of parsed flag `name` | `string \| null` |
| `argHas(name)` | Whether parsed flag `name` is present | `boolean` |

```adesh
import Env;

print("Executable name: " + Env.executableName());
print("Argument count:  " + str(Env.argumentCount()));
print("Arguments:       " + str(Env.arguments()));

// adeshlang run app.adesh --name=Adesh file.txt
print(Env.argsSlice(1));           // ["--name=Adesh", "file.txt"]
print(Env.argsJoin("|"));          // "--name=Adesh|file.txt"
print(Env.argsIndexOf("file.txt"));// 1

let parsed = Env.parseArgs();
print(str(parsed));
// {positionals: ["file.txt"], flags: {name: "Adesh"}}

print(Env.argGet("name"));         // Adesh
print(Env.argHas("name"));         // true
```

Flags support `--key=value`, `--key`, `-k`, and grouped short flags (`-abc`). Values are strings; flag-only entries come back as `true`.

---

## Bare builtin parity

The `Env` class also exposes `env(key, default)`, `envFromFile(path)`, `envFileGet(key, default, path)`, `envRuntimeLoad(objectOrPath, overwrite)`, `envRuntimeGet(key)`, `envRuntimeHas(key)`, and `envRuntimeAll()` — names that mirror the global bare builtins. `Env.get` consults runtime-loaded values first, then the OS environment.

---

## Complete example

A config-path builder that combines `Env` with `Path`/`FS`, and a system-info report.

```adesh
import Env;
import FS;

print("--- Config path ---");

let config = Env.home().join(".adesh").join("config.toml");
print("Config: " + config.toString());
print("Exists: " + str(FS.exists(config)));

print("--- System info ---");

let info = Env.systemInfo();
print("OS: " + info.os + " (" + info.arch + ")");
print("Host: " + info.hostname + " / " + info.username);
print("PID:  " + str(info.pid) + ", uptime " + str(info.processUptime) + "s");
print("Mem:  " + str(info.totalMemory) + " bytes total");

print("--- Env variables ---");

Env.set("MY_MODE", "debug");
print("MY_MODE = " + str(Env.get("MY_MODE")));
print("Count:  " + str(Env.count()));
Env.remove("MY_MODE");
```

---

## Notes & edge cases

- **Static-only**: every `Env` method is static; there is no instance to construct.
- **Runtime env precedence**: variables loaded via `Env.load`/`Env.runtimeLoad` shadow the OS environment in `Env.get`.
- **Path integration**: directory/executable methods return `Path` objects — chain `.join()`, `.parent()`, etc., and pass them straight to `FS`.
- **`setCurrentDirectory`** accepts a `Path` or a string and changes the process working directory.
- **`parseArgs`** returns `{ positionals, flags }`; flag values are strings and bare flags are `true`. Note: flags consumed by the CLI itself (e.g. `--run`, `--jit`) never reach the script.
- **Aliases**: many methods have multiple names for parity with the global bare builtins (`unset`, `has`, `exists`, `environ`, `toObject`, `argv`, `argc`, …) — they are interchangeable.
- **Separators** are platform-dependent: `";"` vs `":"`, `"\\"` vs `"/"`, `"\r\n"` vs `"\n"`.

## Source & examples

- Implementation: `src/stdlib/Env.adesh` (backed by `src/runtime/stdlib_src/system/args.rs`)
- Runnable examples: `examples/Libraries/env/` (`get_variable.adesh`, `set_variable.adesh`, `bulk_variables.adesh`, `env_file.adesh`, `user_directories.adesh`, `platform.adesh`, `system_info.adesh`, `arguments.adesh`, `arguments_advanced.adesh`, `executable.adesh`, `current_directory.adesh`, `home_directory.adesh`, `path_integration.adesh`)

## Related

- [Builtin Libraries Overview](overview)
- [Standard Library Overview](../stdlib/overview)
- [Built-in Functions](../stdlib/builtins)
- [FS Library](fs) — filesystem operations and `Path` integration
