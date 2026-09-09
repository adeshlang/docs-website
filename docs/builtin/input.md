---
id: input
title: Interactive Input & TUI Widgets
sidebar_label: Input & TUI
---

# Interactive Input & TUI Widgets

AdeshLang includes a comprehensive, terminal-native **Interactive Input and TUI (Text User Interface)** subsystem. It provides everything from standard prompt reading and regex-validated forms to rich interactive terminal widgets such as calendar datepickers, datetime pickers, side-by-side visual diff editors, multi-column table selectors with property access, PIN/OTP pads, RGB color pickers, hotkey listeners, and collapsible trees.

All widgets are cross-platform (Windows PowerShell/CMD, Linux, macOS terminal), render in-place using ANSI escape codes and raw terminal mode, wait cleanly for user keyboard events, and automatically advance the cursor to the next line upon completion.

---

## Overview of Input Builtins

| Method / Builtin | Description | Return Type |
| :--- | :--- | :--- |
| `input(prompt?, options?)` | Text prompt with optional validation, masking, suggestions, and hooks | `string` |
| `input.confirm(prompt)` | Interactive boolean prompt (`(y/N)` or `(Y/n)`) | `boolean` |
| `input.password(prompt)` | Masked password input (characters hidden with `*`) | `string` |
| `input.select(prompt, options)` | Interactive single-choice selection list with arrow navigation | `string` |
| `input.checkbox(prompt, options)` | Interactive multi-choice selection list (Space to toggle) | `array<string>` |
| `input.radio(prompt, options)` | Interactive radio button selection | `string` |
| `input.form(fields)` | Multi-field structured form editor | `object` |
| `input.fuzzy(prompt, options)` | Fuzzy-searchable filtered selection list | `string` |
| `input.slider(prompt, options)` | Interactive visual numeric slider / gauge | `number` |
| `input.color(prompt)` | Interactive RGB color component selector with preview | `string` (`#RRGGBB`) |
| `input.hotkey(prompt)` | Hotkey & keyboard shortcut listener (captures Ctrl/Alt/Shift + Key) | `string` (`"Ctrl+S"`) |
| `input.datepicker(prompt)` | Interactive calendar date picker with Year, Month, and Day navigation | `string` (`YYYY-MM-DD`) |
| `input.datetime(prompt)` / `.datetimepicker(prompt)` | Interactive 6-field Date-Time picker (`YEAR`, `MONTH`, `DAY`, `HOUR`, `MIN`, `SEC`) | `string` (`YYYY-MM-DD HH:MM:SS`) |
| `input.diff(orig, mod)` | Visual side-by-side interactive split-pane diff editor | `string` (modified content) |
| `input.table(headers, data)` | 2D spreadsheet / data grid cell selector with rich metadata properties | `object` (Table Selection) |
| `input.tree(prompt, root)` | Interactive collapsible hierarchical tree explorer | `string` (selected node) |
| `input.pin(prompt, length?)` | PIN / OTP verification pad with discrete visual digit boxes | `string` (digits) |
| `input.mock(values)` | Queue automated mock inputs for headless CI/CD & unit testing | `void` |

---

## 1. Basic Text Input & Options

The core `input(prompt, options)` function reads user input from stdin. It supports rich validation and configuration options.

```adesh
// Simple prompt
let name = input("Enter your name: ");
print(`Hello, ${name}!`);

// Validated input with options
let username = input("Choose a username: ", {
    regex: "^[a-z0-9_]{3,16}$",
    notEmpty: true,
    min: 3,
    max: 16,
    errorMessage: "Username must be 3-16 lowercase alphanumeric characters",
    onSubmit: fn(val) {
        print("Valid username entered: " + val);
    }
});
```

### Options Object Schema

| Option | Type | Description |
| :--- | :--- | :--- |
| `regex` | `string` | Regular expression string the input must match before submission |
| `notEmpty` | `boolean` | Requires at least 1 non-whitespace character |
| `min` | `number` | Minimum character length |
| `max` | `number` | Maximum character length |
| `allowed` | `array` | Whitelist of permissible values |
| `masked` | `string` | Mask character for secrets (e.g. `"*"` or `"●"`) |
| `suggestions`| `array<string>`| Autocomplete suggestion list |
| `onSubmit` | `function` | Callback executed immediately when valid input is confirmed |

---

## 2. Interactive Selection Widgets

### Single Select (`input.select`)
Presents an interactive menu navigated with `↑` and `↓` arrows (or numeric keys). Press `Enter` to select.

```adesh
let framework = input.select("Select target web framework:", [
    "Axum (Rust)",
    "Actix-Web (Rust)",
    "Express (Node.js)",
    "FastAPI (Python)"
]);
print("Selected:", framework);
```

### Multi Checkbox (`input.checkbox`)
Allows selecting zero, one, or multiple items. Use `Space` to toggle an option and `Enter` to submit the chosen array.

```adesh
let tools = input.checkbox("Select development toolchain extensions:", [
    "Linter (clippy / eslint)",
    "Code Formatter (prettier / rustfmt)",
    "Git Pre-commit Hook",
    "Docker Containerization"
]);
print("Selected tools count:", len(tools));
for tool in tools {
    print("  - " + tool);
}
```

### Fuzzy Search (`input.fuzzy`)
Filters a large list in real-time as the user types search query characters.

```adesh
let targetBranch = input.fuzzy("Search and checkout git branch:", [
    "main",
    "feature/auth-oauth2",
    "feature/tui-widgets",
    "bugfix/issue-104-parser",
    "hotfix/v1.0.4-patch"
]);
print("Checking out:", targetBranch);
```

---

## 3. Interactive Table & Grid Selector (`input.table`)

`input.table` renders a 2D data grid in the terminal. The user navigates rows and columns with `↑`, `↓`, `←`, `→` arrow keys. Pressing `Enter` returns a rich selection object exposing full cell and coordinate metadata.

### Method Signature
```adesh
let selection = input.table(headers, data);
// or with custom prompt
let selection = input.table("Select Database Record:", headers, data);
```

### Selection Object Sub-Properties

When a cell is selected, the returned object contains the following properties:

| Property | Type | Description |
| :--- | :--- | :--- |
| `selection.row` | `number` | Selected row index (0-based) |
| `selection.col` | `number` | Selected column index (0-based) |
| `selection.value` / `selection.cell` | `string` | The string content of the selected cell |
| `selection.header` / `selection.colName` | `string` | The header title of the selected column |
| `selection.rowData` | `array<string>` | An array containing all cell values in the selected row |
| `selection.colData` | `array<string>` | An array containing all cell values in the selected column |
| `selection.rowObject` | `object` | A key-value dictionary mapping `{ [Header]: CellValue }` for the selected row |
| `selection.headers` | `array<string>` | Array of all table column headers |
| `selection.data` / `selection.grid` | `array<array<string>>` | The complete 2D data matrix |

### Complete Example
```adesh
let headers = ["ID", "Service", "Port", "Status", "Cluster"];
let rows = [
    ["srv-101", "Auth Gateway",   "8080", "Healthy",  "us-east-1"],
    ["srv-102", "Billing Engine", "9000", "Degraded", "us-east-1"],
    ["srv-103", "Worker Queue",   "5672", "Healthy",  "eu-west-1"],
    ["srv-104", "Analytics DB",   "5432", "Healthy",  "ap-south-1"]
];

let sel = input.table("Select Cluster Resource to Inspect:", headers, rows);

print("Selected Cell Value :", sel.value);
print("Coordinate          :", `Row ${sel.row}, Col ${sel.col}`);
print("Column Name         :", sel.header);
print("Full Row Data       :", sel.rowData);
print("Full Column Data    :", sel.colData);
print("Associated Service  :", sel.rowObject["Service"]);
print("Service Status      :", sel.rowObject["Status"]);
```

---

## 4. Date and DateTime Pickers

### Calendar Date Picker (`input.datepicker`)
A visual ASCII calendar widget with 3-field navigation:
- `Tab` / `Shift+Tab`: Cycle active field between **`YEAR`**, **`MONTH`**, and **`DAY`**.
- `←` / `→`: Decrement / increment active field (or navigate days).
- `↑` / `↓`: Decrement / increment active field (or navigate weeks).
- `PageUp` / `PageDown`: Jump decade (-10 / +10 years).
- `Enter`: Confirm selection.
- Supports leap years and exact monthly day bounds (28–31 days).

```adesh
let releaseDate = input.datepicker("Select Production Release Date:");
print("Release scheduled for:", releaseDate); // e.g. "2026-04-14"
```

### Date-Time Picker (`input.datetime` / `input.datetimepicker`)
Expands date selection with precise 24-hour time controls across 6 independent fields:
- `[ YEAR ]` `[ MONTH ]` `[ DAY ]` `[ HOUR ]` `[ MIN ]` `[ SEC ]`
- `Tab` / `Shift+Tab` or `←` / `→`: Cycle through the 6 fields.
- `↑` / `↓`: Adjust value of active field with automatic boundary rollover.
- `Enter`: Submit full timestamp.

```adesh
let eventTimestamp = input.datetime("Schedule Cron Backup Timestamp:");
print("Scheduled Timestamp:", eventTimestamp); // e.g. "2026-05-01 14:30:00"
```

---

## 5. Visual Side-by-Side Diff Editor (`input.diff`)

`input.diff` provides an in-terminal interactive split-pane code/text patch editor. It displays the original read-only text on the left pane and an editable modified buffer on the right pane with real-time cursor tracking.

### Keybindings
- `↑` / `↓` / `←` / `→`: Move active editing cursor.
- `Home` / `End`: Jump to start/end of line.
- `PageUp` / `PageDown`: Scroll through lines.
- `Backspace` / `Delete`: Delete characters or join lines.
- `Enter`: Split line at cursor position.
- Printable characters: Insert text at cursor position.
- `Ctrl+S` or `F2` or `Escape`: Save changes and confirm.

```adesh
let originalCode = "fn compute(x) {\n    return x * 10;\n}";
let draftCode    = "fn compute(x) {\n    return x * 20;\n}";

let finalizedCode = input.diff(originalCode, draftCode);
print("Finalized patch:\n" + finalizedCode);
```

---

## 6. PIN & OTP Verification Pad (`input.pin`)

`input.pin` renders discrete security boxes for authentication PINs and One-Time Passwords (OTP).
- Each typed digit fills a discrete box: `[ ● ] [ ● ] [ ● ] [ ● ]`.
- Only numeric digits (`0-9`) are accepted.
- `Backspace` clears the previous digit box.
- Automatically renders verified state `(Verified)` and submits upon entering the final digit (or via `Enter`).
- Returns the full entered PIN string.

```adesh
let userPin = input.pin("Enter 4-Digit Security Authorization PIN:", 4);

if (userPin == "9876") {
    print("✓ Access Granted. Session authorized.");
} else {
    print("✗ Access Denied. Invalid PIN entered:", userPin);
}
```

---

## 7. Additional Terminal Widgets

### Hotkey & Keybinding Listener (`input.hotkey`)
Listens for keyboard shortcuts and captures modifier combinations.
- Recognizes `Ctrl`, `Alt`, `Shift` combinations and special function keys (`F1`-`F12`, `Esc`, `Tab`, `Enter`).
- Returns standard descriptor string (e.g. `"Ctrl+S"`, `"Alt+F4"`, `"Shift+Tab"`).

```adesh
let saveBinding = input.hotkey("Press Hotkey to Bind to Save Action:");
print("Registered Keybinding:", saveBinding);
```

### Color Picker (`input.color`)
Interactive RGB slider widget allowing live terminal adjustment of Red, Green, and Blue channels (0–255) with color swatch preview.
- Returns hex color string `#RRGGBB`.

```adesh
let themeColor = input.color("Select Terminal Theme Accent Color:");
print("Configured Accent:", themeColor); // e.g. "#4A90E2"
```

### Slider (`input.slider`)
Renders an interactive horizontal gauge bar with increment/decrement controls.
- Parameters: `input.slider(prompt, { min: 0, max: 100, step: 5, default: 50 })`.

```adesh
let volume = input.slider("Set Audio Volume:", { min: 0, max: 100, step: 5, default: 75 });
print("Volume set to:", volume, "%");
```

### Tree Navigator (`input.tree`)
Interactive tree browser with expandable/collapsible nodes (`+`/`-`), arrow navigation, and node selection.

```adesh
let treeData = {
    name: "Project Root",
    children: [
        { name: "src", children: [{ name: "main.adesh" }, { name: "utils.adesh" }] },
        { name: "tests", children: [{ name: "test_suite.adesh" }] },
        { name: "Cargo.toml" }
    ]
};

let chosenNode = input.tree("Browse Project Tree:", treeData);
print("Selected:", chosenNode);
```

### Form Builder (`input.form`)
Structured multi-field terminal form collecting several fields in a single interactive view before submission.

```adesh
let config = input.form([
    { name: "host", label: "Server Host", default: "127.0.0.1" },
    { name: "port", label: "Port Number", default: "8080" },
    { name: "ssl",  label: "Enable TLS (true/false)", default: "true" }
]);

print("Host:", config.host);
print("Port:", config.port);
print("TLS Enabled:", config.ssl);
```

---

## 8. Headless Testing with `input.mock` & Chained `.mock()`

When running automated test suites or CI/CD pipelines where no interactive terminal is present, AdeshLang provides two intuitive mocking paradigms:

### A. Inline Chained `.mock()` (Recommended)
You can directly chain `.mock(...)` next to any `input(...)` or `input.*` function for clear, self-documenting tests:

```adesh
// Direct chained mocking on any input widget
let name     = input("Enter your name:").mock(["Ajay"]);
let city     = input("Enter city:").mock("Bangalore");
let branch   = input.select("Branch:", ["main", "dev"]).mock(["main"]);
let pin      = input.pin("PIN:", 4).mock(["9876"]);
let approved = input.confirm("Proceed?").mock([true]);
let date     = input.datepicker("Release Date:").mock(["2026-04-14"]);
let table    = input.table("Select Service:", headers, rows).mock(["0"]);

print("Tested inputs:", name, branch, pin, date);
```

### B. Global Queue `input.mock`
You can also pre-populate a sequential queue of mock responses prior to execution:

```adesh
// Queue mock responses for automated test suite
input.mock([
    "Alice",         // consumed by input("Name:")
    "main",          // consumed by input.select(...)
    "9876",          // consumed by input.pin(...)
    "2026-04-14"     // consumed by input.datepicker(...)
]);

let name   = input("Name:");
let branch = input.select("Branch:", ["main", "dev"]);
let pin    = input.pin("PIN:", 4);
let date   = input.datepicker("Date:");

print("Test run completed cleanly with mocked values:");
print(name, branch, pin, date);
```

---

## Summary & Best Practices

1. **Terminal Cleanliness**: All AdeshLang TUI widgets automatically manage terminal cursor positioning, clear transient widget frames, and advance cleanly to the next line.
2. **Deterministic Fallbacks**: In headless environments (or non-TTY pipes), widgets gracefully fallback or consume mock queue values.
3. **Parity**: Interactive input methods are supported consistently across AdeshLang interpreters and runtimes.

---

## Related Documentation

- [Print & Formatting Subsystem](print)
- [IO Streams & Buffers](io)
- [Standard Library Overview](overview)
- [Built-in Functions Reference](builtins)
