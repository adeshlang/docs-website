---
id: process
title: Process Library
sidebar_label: Process
---

# Process Library

The **Process** builtin library is AdeshLang's API for spawning and controlling child operating-system processes. It can run a command and capture its output, start long-running background processes, wire stdout to stdin (`pipeline`), set the working directory and environment, enforce timeouts, redirect output to files, and even build process dependency graphs — all from a single `Process` namespace.

The high-level API is written in AdeshLang itself (`src/stdlib/Process.adesh`) and sits on top of native process primitives, so it behaves identically on the Interpreter, Bytecode VM, JIT, Native JIT, and AOT backends.

## Namespaces

| Namespace | What it provides |
| :--- | :--- |
| `Process` | Static entry points: `run`, `spawn`, `shell`, `pipeline`, `info`, … |
| `ProcessBuilder` | Fluent builder for configuring a single process. |
| `ChildProcess` | A running process: wait, kill, streams, info. |
| `ProcessStream` | Interactive stdin/stdout/stderr access for a child. |
| `ExitStatus` | Exit code, success flag, and termination signal. |
| `CommandResult` | A finished command: status plus captured stdout/stderr. |
| `Signal` | Well-known termination signals (`SIGKILL`, `SIGTERM`, …). |
| `Stdio` | Describes how a stream is wired (inherit / pipe / null / file). |
| `ProcessInfo` | PID, parent, executable, CPU/memory/start-time metrics. |
| `ProcessGraph` / `ProcessGroup` / `ProcessPool` | Orchestrating several processes. |

## Importing the library

`Process` is **globally available**, but importing it is the idiomatic way to make it explicit. The import is case-insensitive:

```adesh
import Process;   // or import process; or import "std:Process";
```

:::note
`import Process;` binds the whole namespace, so you call `Process.run(...)` etc. Selective imports (`import { run, pipeline } from "Process";`) also work.
:::

---

## Methods: Run & Capture

The quickest way to run a command and get its result.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Process.run(cmd, args?)` | Run `cmd` to completion, capturing stdout and stderr | `cmd: string`, `args: array<string>` | `CommandResult` |
| `Process.exec(cmd, args?)` | Alias of `Process.run` | `cmd: string`, `args: array<string>` | `CommandResult` |
| `Process.spawn(cmd, args?)` | Start `cmd` and return immediately without waiting | `cmd: string`, `args: array<string>` | `ChildProcess` |
| `Process.shell(cmdString)` | Run a command string through the platform shell (`cmd.exe /C` on Windows, `sh -c` elsewhere) | `cmdString: string` | `CommandResult` |

```adesh
import Process;

// Capture output:
let result = Process.run("git", ["status"]);
print(result.success());         // true/false
print(result.code());            // exit code (0 on success)
print(result.stdoutText());      // captured stdout

// Run through the shell (pipes/globals work):
let shell = Process.shell("echo hello | tr a-z A-Z");
print(shell.stdoutText());       // HELLO
```

:::tip
`Process.run` inherits the console by default; to capture output you can also use a builder and call `.stdoutPipe()` explicitly (see below). Shell commands are convenient but slower and a quoting/escaping risk — prefer `Process.run` with a `cmd` + `args` list for untrusted input.
:::

---

## `ProcessBuilder` — configure a process

Use `Process.builder(cmd)` to chain configuration options, then finish with `.spawn()` (non-blocking → `ChildProcess`) or `.run()` (blocking → `CommandResult`). All configuration methods return the builder, so calls can be chained.

| Method | Description |
| :--- | :--- |
| `.arg(a)` | Append one argument |
| `.args([...])` | Append a list of arguments |
| `.clearArgs()` | Remove all arguments |
| `.workingDirectory(path)` | Set the child's working directory |
| `.environment(key, value)` | Set one environment variable |
| `.removeEnvironment(key)` | Remove one environment variable |
| `.clearEnvironment()` | Start with an empty environment (do not inherit) |
| `.inheritEnvironment()` | Inherit the parent's environment (default) |
| `.stdinPipe()` / `.stdoutPipe()` / `.stderrPipe()` | Capture the stream (so it can be read) |
| `.inheritStdin()` / `.inheritStdout()` / `.inheritStderr()` | Inherit the parent's console for a stream |
| `.redirectToFile(path)` | Redirect **stdout** to a file |
| `.redirectStdout(path)` | Alias of `redirectToFile` |
| `.redirectStderr(path)` | Redirect **stderr** to a file |
| `.redirectFromFile(path)` | Feed **stdin** from a file |
| `.mergeStdoutStderr()` | Send stderr wherever stdout goes |
| `.discardOutput()` | Discard both stdout and stderr (`null` stream) |
| `.runTimeout(duration)` | Abort the process after `duration` (a `Duration` or millisecond number) |
| `.interactive()` | All streams pipe (useful for interactive/PTY sessions) |
| `.detach()` / `.newSession()` | Run in a new process group / session |
| `.daemon()` | Detached + no waiting (daemon-style) |
| `.memoryLimit(bytes)` | Cap the child's memory usage |
| `.cpuLimit(duration)` | Cap the child's CPU time |
| `.pipe(cmd, args?)` | Append a command to a chained pipeline (see `Process.pipeline`) |
| `.run()` | Block and return `CommandResult` |
| `.spawn()` | Start and return `ChildProcess` immediately |

```adesh
import Process;
import Env;
import Time;

// Builder with arguments, cwd, environment, and capture:
let result = Process.builder("git")
    .args(["log", "--oneline", "-5"])
    .workingDirectory(Env.currentDirectory())
    .environment("GIT_PAGER", "cat")
    .stdoutPipe()
    .stderrPipe()
    .run();

print(result.stdoutText());

// Timeout:
let slow = Process.builder("git")
    .args(["status"])
    .stdoutPipe()
    .runTimeout(Duration.seconds(5))
    .run();
print(slow.success());   // false if the timeout was hit
```

:::note
When you call `.run()` on a builder that was given an explicit `.runTimeout(duration)`, the timeout is enforced. If the child is still running when the timeout elapses it is killed and `ExitStatus.timedOut()` returns `true`.
:::

---

## `ChildProcess` — control a running process

Obtained from `Process.spawn(...)`, `Process.builder(...).spawn()`, or `Process.pty(...)`.

| Method | Description | Returns |
| :--- | :--- | :--- |
| `.processId()` | Operating-system PID | `int` |
| `.handle()` | The `ProcessHandle` (id + pid) | `ProcessHandle` |
| `.wait()` | Block until exit | `ExitStatus` |
| `.waitTimeout(duration)` | Wait up to `duration`; kills the child if it times out | `ExitStatus` |
| `.isRunning()` | `true` if the child has not exited yet | `boolean` |
| `.hasExited()` | Inverse of `isRunning()` | `boolean` |
| `.exitStatus()` | Block and return the final `ExitStatus` | `ExitStatus` |
| `.kill(sig?)` | Send a signal (default `SIGKILL`); pass an `int` code or a `Signal` | `boolean` |
| `.terminate()` | Send `SIGTERM` (graceful) | `boolean` |
| `.forceKill()` | Send `SIGKILL` | `boolean` |
| `.stdoutText()` | Read all captured stdout | `string` |
| `.stderrText()` | Read all captured stderr | `string` |
| `.writeStdin(data)` | Write to the child's stdin | `boolean` |
| `.stdin()` / `.stdout()` / `.stderr()` | Interactive `ProcessStream` handles | `ProcessStream` |
| `.info()` | Metrics for this child | `ProcessInfo` |
| `.tree()` / `.children()` | Descendant PIDs | `array<int>` |
| `.onExit(fn)` | Block until exit, then call `fn(status)` | `ChildProcess` |
| `.onStdout(fn)` | Read stdout and call `fn(text)` | `ChildProcess` |
| `.onStderr(fn)` | Read stderr and call `fn(text)` | `ChildProcess` |

```adesh
import Process;
import Time;

// Start a long-running process without blocking:
let child = Process.builder("ping")
    .args(["localhost", "-c", "3"])   // 3 pings on unix; use -n on Windows
    .stdoutPipe()
    .spawn();

print("PID:", child.processId());

// Poll until it finishes (or use child.wait() to block):
while child.isRunning() {
    Time.sleep(50);
}

let status = child.wait();
print("Exit code:", status.code(), "Success:", status.success());
print(child.stdoutText());

// Kill a process that won't exit:
let stuck = Process.spawn("sleep", ["600"]);
stuck.kill();                        // default SIGKILL — the child is reaped
```

:::tip
`child.kill()` accepts an integer signal number or a `Signal` object. Prefer `kill(Signal.TERM())` when you want a graceful shutdown and `forceKill()` when you need immediate termination.
:::

---

## `ProcessStream` — interactive I/O

`ChildProcess.stdin()`, `.stdout()`, and `.stderr()` return `ProcessStream` objects for interactive programs (REPLs, prompts, progress bars).

| Method | Description |
| :--- | :--- |
| `.writeLine(text)` | Write a line to the stream (e.g. stdin) |
| `.readLine()` | Read the next line (e.g. from stdout) |
| `.readBytes(count?)` | Read up to `count` bytes (default 4096) as a byte array |
| `.readAll()` | Read everything remaining |
| `.lines()` | Read all remaining lines into an array |

```adesh
import Process;

let child = Process.builder("python3").stdinPipe().stdoutPipe().spawn();
child.stdin().writeLine("print(21 * 2)");
child.stdin().writeLine("exit()");

print(child.stdout().readLine());   // 42
child.wait();
```

---

## `ExitStatus` — interpreting results

Returned by `ChildProcess.wait()`, `.waitTimeout()`, `.exitStatus()`, and available as `CommandResult.exitStatus()`.

| Method | Description |
| :--- | :--- |
| `.code()` | Exit code as an `int` |
| `.success()` / `.isSuccess()` | `true` if the process exited successfully |
| `.signal()` | Signal number that killed it (0 if none) |
| `.exitedNormally()` | `true` when the code is `>= 0` and no signal was used |
| `.killed()` | `true` if terminated by a signal |
| `.timedOut()` | `true` if the run was aborted by a timeout (code `-2`) |
| `.crashed()` | `true` if it failed abnormally (not a timeout) |

## `CommandResult` — finished command

Returned by `Process.run`, `Process.exec`, `Process.shell`, `Process.pipeline`, and `ProcessBuilder.run()`.

| Method | Description |
| :--- | :--- |
| `.exitStatus()` | The underlying `ExitStatus` |
| `.success()` / `.isSuccess()` | `true` on success (exit code 0) |
| `.code()` | Exit code |
| `.stdoutText()` / `.stderrText()` | Captured output as strings |
| `.stdoutBytes()` / `.stderrBytes()` | Captured output as byte arrays |

---

## `Signal` & `Stdio`

**`Signal`** represents a POSIX-style signal and carries its numeric code and name.

| Static factory | Code | Name |
| :--- | :--- | :--- |
| `Signal.TERM()` | 15 | `SIGTERM` |
| `Signal.KILL()` | 9 | `SIGKILL` |
| `Signal.INT()` | 2 | `SIGINT` |
| `Signal.HUP()` | 1 | `SIGHUP` |
| `Signal.QUIT()` | 3 | `SIGQUIT` |
| `Signal.USR1()` / `Signal.USR2()` | 10 / 12 | `SIGUSR1` / `SIGUSR2` |
| `Signal.STOP()` / `Signal.CONT()` | 19 / 18 | `SIGSTOP` / `SIGCONT` |

Each instance has `.code()`, `.name()`, and `.toString()`.

**`Stdio`** describes how a stream should be wired. Its mode constants are `Stdio.INHERIT()` (0), `Stdio.PIPE()` (1), `Stdio.NULL()` (2), and `Stdio.FILE()` (3), with the constructors `.inherit()`, `.pipe()`, `.nullStream()`, and `.file(path)`.

```adesh
import Process;

// Kill the child with a named signal:
let child = Process.spawn("sleep", ["600"]);
child.kill(Signal.TERM());   // graceful termination
```

---

## Advanced: Pipeline, Graph, Group & Pool

### `Process.pipeline(specs, timeout?)` — chained commands

Run a list of commands in sequence, feeding each one's stdout into the next command's stdin (like a shell pipe). Returns a `CommandResult`.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Process.pipeline(specs, timeout?)` | Run `[{cmd, args}, ...]`, wiring stdout → stdin | `specs: array<object>`, `timeout?: Duration` | `CommandResult` |

```adesh
import Process;

let result = Process.pipeline([
    { cmd: "echo", args: ["hello world"] },
    { cmd: "tr",   args: ["a-z", "A-Z"] },
    { cmd: "sed",  args: ["s/ /_/g"] },
]);
print(result.stdoutText());   // HELLO_WORLD
```

You can also build the same chain with a builder: `Process.builder("echo").args(["hello"]).pipe("tr", ["a-z", "A-Z"]).pipe("sed", ["s/ /_/g"]).run()`.

### `Process.pty(cmd, args?)` — interactive terminal

Spawn a command with all three streams piped (interactive mode), e.g. for REPLs or password prompts. Returns a `ChildProcess`.

### `Process.graph()` / `Process.group()` / `Process.pool()`

- `Process.graph()` → a `ProcessGraph`: add `.node(id, cmd, args?)` and `.connect(fromId, toId)` edges, then `.run()` to execute respecting dependencies. Returns `{ nodeId: { exitCode, success, stdoutText, stderrText } }`.
- `Process.group()` → a `ProcessGroup` for batch lifecycle: `.spawn(builder)`, `.killAll()`, `.waitAll()`.
- `Process.pool(workers?)` → a `ProcessPool` of workers: `.submit(builder)`, `.join()`, `.killAll()`.

```adesh
import Process;

let graph = Process.graph();
graph.node("a", "echo", ["A"]);
graph.node("b", "echo", ["B"]);
graph.node("c", "cat");
graph.connect("a", "c");
graph.connect("b", "c");
let results = graph.run();
print(results["a"].stdoutText);   // A
print(results["c"].stdoutText);   // A\nB (after a and b complete)
```

---

## Process info & metrics

Query the current process or any child without spawning anything.

| Function | Description | Returns |
| :--- | :--- | :--- |
| `Process.processId()` | PID of the current process | `int` |
| `Process.parentId()` | PID of the current process's parent | `int` |
| `Process.executable()` | Path of the current executable | `string` |
| `Process.info()` | Full `ProcessInfo` for the current process | `ProcessInfo` |

`ProcessInfo` exposes `.pid()`, `.parentId()`, `.executable()`, `.commandLine()`, `.cpuTime()`, `.memoryUsage()`, and `.startTime()`.

```adesh
import Process;

print("PID:", Process.processId());
let info = Process.info();
print("Executable:", info.executable());
print("Started:", str(info.startTime()));
```

---

## Complete example

A small utility that runs a command with a custom working directory and environment, enforces a timeout, and reports the outcome.

```adesh
import Process;
import Env;
import Time;

let isWin = Env.isWindows();
let workDir = Env.tempDirectory();

print("--- Process runner ---");

let result = Process.builder(isWin ? "cmd.exe" : "pwd")
    .args(isWin ? ["/C", "cd"] : [])
    .workingDirectory(workDir)
    .environment("ADESH_MODE", "docs")
    .stdoutPipe()
    .runTimeout(Duration.seconds(10))
    .run();

if result.success() {
    print("Output:", result.stdoutText().trim());
} else {
    print("Failed with code", result.code());
    if result.exitStatus().timedOut() {
        print("(timed out)");
    }
}

// Compare with the blocking shorthand:
let quick = Process.run(isWin ? "cmd.exe" : "pwd", isWin ? ["/C", "cd"] : []);
print("Quick run OK:", quick.success());
```

---

## Notes & edge cases

- `Process.run`/`Process.exec`/`Process.shell` are **blocking**; use `Process.spawn` (and `ChildProcess.wait()`) for non-blocking workflows.
- A run that hits `runTimeout` is killed; its `ExitStatus.timedOut()` is `true` and the code is `-2`.
- `child.kill(sig)` takes a numeric code or a `Signal`. `Signal` codes follow POSIX (`SIGTERM`=15, `SIGKILL`=9) and map to `TerminateProcess` semantics on Windows.
- `Process.shell` uses `cmd.exe /C` on Windows and `sh -c` elsewhere — it is convenient for one-liners but avoid it with untrusted input (quoting/escaping).
- Backend parity: fully supported on Interpreter, Bytecode VM, JIT, Native JIT, and LLVM AOT. On WebAssembly, process spawning degrades gracefully.
- The API surfaces low-level builtins such as `processSpawn`, `processWait`, `processKill`, `processReadStdout` — prefer the high-level `Process` classes; the primitives are an implementation detail.
- Always quote/sanitize arguments when the command is built from user input (never pass it through a shell).

## Source & examples

- High-level API: `src/stdlib/Process.adesh`
- Native primitives: `src/runtime/stdlib_src/system/process.rs`
- Runnable examples: `examples/Libraries/process/` (`basic.adesh`, `builder.adesh`, `capture_output.adesh`, `background.adesh`, `pipeline.adesh`, `environment.adesh`, `cwd.adesh`, `redirect.adesh`, `timeout.adesh`, `process_info.adesh`)
- API reference (from the repo): `examples/Libraries/process/process.md`

## Related

- [Builtin Libraries Overview](overview)
- [Standard Library Overview](overview)
- [Built-in Functions](builtins) — quick reference including `process*` primitives
