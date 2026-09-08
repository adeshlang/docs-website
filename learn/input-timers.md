---
id: input-timers
title: Interactive Input & Timers
sidebar_label: 20. Interactive Input & Timers
---

# Interactive Input & Timers

So far our programs only *print*. Real programs also **read input** and
**schedule work over time**. AdeshLang's input system handles everything
from simple prompts to masked passwords, and its timers work like
JavaScript's `setTimeout`/`setInterval`. The full menu of examples lives in
[`examples/input/`](https://github.com/adeshlang/adeshlang/tree/main/examples/input)
and [`examples/timers/`](https://github.com/adeshlang/adeshlang/tree/main/examples/timers).

## Reading a line of input

```adesh
// Run this interactively and type your name
let name = input("Name:");
print("Hello " + name);
```

Running it:

```text
Name: Ajay
Hello Ajay
```

(`input("Prompt:")` prints the prompt, waits for the user to type a line, and
returns it as a string. Use `input.mock([...])` for non-interactive tests.)

## Input options: validate as you type

[`examples/input/simple_input.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/input/simple_input.adesh)
shows the option object — `regex`, `notEmpty`, `min`/`max`, `allowed`
choices, and even an `onSubmit` callback:

```adesh
let username = input("Username:", { regex: "[a-zA-Z0-9_]{3,16}", notEmpty: true, min: 3, max: 16 });
print("Username:", username);

let score = input("Score:", { type: int, allowed: [10, 20, 30], onSubmit: fn(s) {
    print("Score submitted:", s);
} });
print("Score:", score);
```

**Output (interactive):**
```
Username: adesh_dev
Username: adesh_dev
Score: 20
Score submitted: 20
Score: 20
```

## Masked password input

[`examples/input/password_input.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/input/password_input.adesh)
masks every character typed:

```adesh
let password = input("Password:", { masked: "*" });
print("Length: " + len(password));
print(`Password is ${password}`);
```

**Output (interactive):**
```
Password: *********
Length: 9
Password is adeshlang
```

## Pick from a list

[`examples/input/select_input.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/input/select_input.adesh):

```adesh
let city = input("City:", { suggestions: [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad"
] });
print("Chosen city:", city);
```

**Output (interactive):**
```
City: Delhi
Chosen city: Delhi
```

## Interactive TUI Widgets

AdeshLang includes terminal widgets that render interactive UI in raw mode:

### 1. 2D Table & Grid Selector (`input.table`)

Navigate rows and columns with arrow keys (`↑` `↓` `←` `→`) and press `Enter` to select a cell:

```adesh
let headers = ["Service", "Port", "Status"];
let rows = [
    ["Auth Gateway", "8080", "Healthy"],
    ["Billing API",  "9000", "Degraded"],
    ["Worker Queue", "5672", "Healthy"]
];

let sel = input.table("Select Service Record:", headers, rows);

print("Cell value :", sel.value);          // or sel.cell
print("Coordinates:", sel.row, sel.col);   // row & col index
print("Column Name:", sel.header);         // or sel.colName
print("Row Data   :", sel.rowData);        // ["Auth Gateway", "8080", "Healthy"]
print("Column Data:", sel.colData);        // ["Auth Gateway", "Billing API", "Worker Queue"]
print("Row Object :", sel.rowObject);      // { Service: "Auth Gateway", Port: "8080", Status: "Healthy" }
```

### 2. Calendar Datepicker & DateTime Picker

```adesh
// 3-field datepicker: Tab cycles YEAR, MONTH, DAY; arrows adjust
let date = input.datepicker("Release Date:");
print("Picked date:", date); // e.g. "2026-04-14"

// 6-field datetime picker: YEAR, MONTH, DAY, HOUR, MIN, SEC
let stamp = input.datetime("Deployment Timestamp:");
print("Picked timestamp:", stamp); // e.g. "2026-04-14 15:30:00"
```

### 3. PIN & OTP Verification Pad

Discrete security digit boxes `[ ● ] [ ● ] [ ● ] [ ● ]` that auto-confirm when filled:

```adesh
let pin = input.pin("Enter 4-Digit Security PIN:", 4);
if pin == "9876" {
    print("✓ Access authorized");
}
```

### 4. Split-Pane Visual Diff Editor

Interactive side-by-side terminal code/patch editor:

```adesh
let patched = input.diff("let x = 10;", "let x = 20;");
print("Saved patch:\n" + patched);
```

### 5. Automated Testing with `input.mock`

Queue predetermined mock values so interactive scripts run headlessly in CI/CD or unit tests:

```adesh
input.mock(["Alice", "2026-04-14", "9876"]);

let name = input("Name:");
let date = input.datepicker("Date:");
let pin  = input.pin("PIN:", 4);
print("Automated test passed:", name, date, pin);
```

## Multiline and piped input

`examples/input/multiline_input.adesh` reads several lines; `piped_input.adesh`
reads from a pipe (`echo "data" | adesh run piped_input.adesh`):

```adesh
// piped_input.adesh
let data = input();
print("Got from pipe:", data);
```

**Output (with pipe):**
```
Got from pipe: hello
```

## Timers: `setTimeout` and `setInterval`

```adesh
setTimeout(fn() { print("timeout fired"); }, 30);

let count = 0;
let iid = setInterval(fn() {
    count = count + 1;
    print("interval tick", count);
}, 10);

// stop the interval after a while
setTimeout(fn() {
    clearInterval(iid);
    print("interval stopped at", count);
}, 80);
```

**Output:**
```
interval tick 1
interval tick 2
interval tick 3
interval tick 4
interval tick 5
interval tick 6
timeout fired
interval stopped at 7
```

(Exact ordering and tick counts vary slightly with timing; the pattern is what
matters. From
[`examples/timers/timers_combined.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/timers/timers_combined.adesh).)

## Clearing a timeout before it fires

```adesh
let timeout_id = setTimeout(fn() {
    print("This should not print");
}, 50);

setTimeout(fn() {
    clearTimeout(timeout_id);
    print("Cleared timeout");
}, 20);
```

**Output:**
```
Cleared timeout
```

## Timers + promises: waiting for async work

Because timers run concurrently, a top-level script keeps alive by awaiting a
Promise that resolves after the timers finish:

```adesh
let done = Promise(fn(res) {
    setTimeout(fn() { res(true); }, 160);
});

await done;
print("All timers done");
```

**Output:**
```
All timers done
```

## Practice

Build a **quiz** that times the user:

```adesh
print("Answer in 5 seconds: 7 * 6 = ?");
let answered = false;

let timer = setTimeout(fn() {
    if !answered {
        print("⏰ Time's up!");
    }
}, 5000);

let answer = input("Your answer:");
answered = true;
clearTimeout(timer);

if (str(answer) == "42") {
    print("✅ Correct!");
} else {
    print("❌ That's", answer, "- the answer is 42");
}
```

**Output (interactive):**
```
Answer in 5 seconds: 7 * 6 = ?
Your answer: 42
✅ Correct!
```

## Summary

✅ **You learned:**
- `input("Prompt:")` reads a line from the user
- Option objects: `regex`, `notEmpty`, `min`/`max`, `allowed`, `masked`
- `onSubmit` callbacks and suggestions
- Piped input via `input()` reading stdin
- `setTimeout` / `clearTimeout` for one-shot delays
- `setInterval` / `clearInterval` for repeated work
- Promises + `await` to keep a script alive while timers run

## Next Step

Now let's make programs that do many things at once — **async, concurrency,
and parallelism**. Continue to **[Async & Concurrency](/learn/async-concurrency)** →
