---
id: capstone
title: Capstone Project - Build a Task Manager CLI
sidebar_label: 27. Capstone Project
---

# Capstone — Build a Task Manager CLI

Congratulations — you have reached the end of the course. Now you build
something **real**: a full command-line task manager, exactly like the one in
[`examples/real_world/01_task_manager.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/real_world/01_task_manager.adesh).
It uses **everything** you have learned so far and runs as a polished,
interactive CLI with a demo harness.

> This is a build-along lesson. Type every block into `task_manager.adesh`
> (or run the original file) and run it after each section.

## What we are building

```text
╔══════════════════════════════════════════╗
║     AdeshLang Task Manager v1.0           ║
╚══════════════════════════════════════════╝

📖 Available Commands:
  add <title> [desc] [priority]  - Add a new task
  list [filter]                  - List tasks (all/completed/pending)
  complete <id>                  - Mark task as completed
  delete <id>                    - Delete a task
  show <id>                      - Show task details
  stats                          - Show statistics
```

## Step 1 — Model the data (types, struct-like objects, enums of priority)

First we define what a **Task** is: an object type with typed fields,
including an optional `completedAt`:

```adesh
type Task = {
    id: i32,
    title: string,
    description: string,
    completed: bool,
    priority: string,  // "low", "medium", "high"
    createdAt: f64,
    completedAt: f64?
};
```

- `type Task = { ... }` declares an **object type** (from [Lesson 13](/learn/structs-enums)).
- `completedAt: f64?` is a **nullable field** — `null` until the task is done
  (from [Lesson 12](/learn/types)).

## Step 2 — The manager class (encapsulation, helpers, methods)

The `TaskManager` class owns the task array and every operation:

```adesh
class TaskManager {
    fn init() {
        this.tasks = [];
        this.nextId = 1;
    }

    fn addTask(title: string, description: string, priority: string): Task {
        let task: Task = {
            id: this.nextId,
            title: title,
            description: description,
            completed: false,
            priority: priority,
            createdAt: clock(),
            completedAt: null
        };

        this.tasks.push(task);
        this.nextId = this.nextId + 1;
        return task;
    }

    fn listTasks(filter: string?) {
        if (len(this.tasks) == 0) {
            print("  No tasks found. Add one with: add <title>");
            return;
        }

        print("  ID  | Status | Priority | Title");
        print("  ────┼────────┼──────────┼─────────────────────");

        for task in this.tasks {
            if (filter != null) {
                if (filter == "completed" && !task.completed) { continue; }
                if (filter == "pending" && task.completed) { continue; }
            }

            print("  " + this._padNumber(task.id, 4) + " | "
                + (task.completed ? "✓ Done" : "○ Todo") + " | "
                + this._formatPriority(task.priority) + " | "
                + task.title);
        }
    }
    // ... completeTask, deleteTask, getTask, showStats, helpers ...
}
```

Notice the **helper methods** prefixed `_`: `_formatPriority` and `_padNumber`.
Keeping formatting logic in private methods keeps `listTasks` readable (from
[Lesson 14](/learn/oop)).

## Step 3 — CLI handlers (functions, guard clauses, validation)

Each command is a function that validates its arguments and dispatches to the
manager (from [Lesson 15](/learn/error-handling) and
[Lesson 6](/learn/functions)):

```adesh
fn handleAdd(manager: TaskManager, args: [string]) {
    if (len(args) < 1) {                       // ← guard clause
        print("❌ Error: Task title required");
        print("   Usage: add <title> [description] [priority]");
        return;
    }

    let title = args[0];
    let description = len(args) > 1 ? args[1] : "";
    let priority = len(args) > 2 ? args[2] : "medium";

    if (priority != "low" && priority != "medium" && priority != "high") {
        print("❌ Error: Priority must be 'low', 'medium', or 'high'");
        return;
    }

    let task = manager.addTask(title, description, priority);
    print("✅ Task added successfully!");
    print("   ID: " + str(task.id));
    print("   Title: " + task.title);
}
```

Every command follows the same rhythm:

```
validate input → bail early on bad input → do the work → print a friendly result
```

## Step 4 — The main program (orchestration)

`main` wires everything together: create the manager, seed demo data, run an
"interactive demo" that simulates user commands:

```adesh
fn main() {
    let manager = new TaskManager();

    print("📚 Demo Mode: Adding sample tasks...");
    print("");

    manager.addTask("Write documentation", "Complete the API docs", "high");
    manager.addTask("Fix bug #42", "Memory leak in parser", "high");
    manager.addTask("Code review", "Review PR #123", "medium");

    manager.completeTask(1);                 // mark first task done

    print("✅ Sample tasks added!");
    print("");

    handleHelp();
    print("");

    handleList(manager, []);                 // list all
    print("");

    // Simulated user session
    print("➜ Command: add 'Deploy to production' 'Version 2.0 release' high");
    handleAdd(manager, ["Deploy to production", "Version 2.0 release", "high"]);
    print("");

    print("➜ Command: list pending");
    handleList(manager, ["pending"]);
    print("");

    print("➜ Command: stats");
    handleStats(manager, []);
}
```

Then run it:

```bash
adesh task_manager.adesh
```

You get a magazine-style console output: box-drawing banners, emoji status
markers, padded columns, and clear error messages. This is what "polished
CLI" looks like — and the whole thing is plain functions, types, arrays,
loops, conditionals, string formatting, and a class.

## Step 5 — Extend it (your turn)

Now **modify the program yourself**. Ideas, from easy to harder:

1. **Add an `export` command** — write all tasks to `tasks.json`:
   ```adesh
   fn handleExport(manager: TaskManager, args: [string]) {
       import JSON;
       JSON.stringifyFile("tasks.json", manager.tasks, true);
       print("✅ Exported " + str(len(manager.tasks)) + " tasks to tasks.json");
   }
   ```

2. **Add a `search <text>` command** — find tasks whose title contains text:
   ```adesh
   fn handleSearch(manager: TaskManager, args: [string]) {
       if (len(args) < 1) { print("❌ Usage: search <text>"); return; }
       let q = args[0];
       for task in manager.tasks {
           if (task.title.includes(q) || task.description.includes(q)) {
               print("  #" + str(task.id) + " " + task.title);
           }
       }
   }
   ```

3. **Add a `due` field** — a string date (`"2026-09-10"`) on each task, plus a
   `list overdue` filter comparing against `Time.dateToday()`.

4. **Refactor the demo** — replace the hard-coded "interactive demo" with a
   loop that reads real user input:
   ```adesh
   import IO;
   while (true) {
       print("➜ ", end="");          // prompt
       let line = IO.readLine();
       // parse words, dispatch to your command handlers
   }
   ```

## What your capstone proves

| Concept | Where it appears |
|---------|------------------|
| [Types & nullability](/learn/types) | `type Task`, `completedAt: f64?` |
| [Conditionals & `elif`](/learn/conditionals) | `if/elif/else` in `_formatPriority` |
| [Loops & ranges](/learn/loops) | `for task in this.tasks`, `range(len(...))` |
| [Functions](/learn/functions) | 8 command handlers + helper methods |
| [Collections](/learn/collections) | `this.tasks` array, `push`, filtering |
| [String formatting](/learn/strings) | concatenation, `str()`, padding, box art |
| [Structs, enums & matching](/learn/structs-enums) | object types, ternary status/priority |
| [OOP](/learn/oop) | `TaskManager` class, `_` helpers, `new` |
| [Error handling](/learn/error-handling) | guard clauses + friendly errors |
| [Stdlib](/learn/stdlib-tour) | `clock()`, `parseInt`, `str`, emoji/box output |

## Wrap-up

You did it — the entire course. From `hello world` to a full, typed,
validated CLI application with statistics and polished output. The Task
Manager in `examples/real_world/` proves these skills are used daily by real
AdeshLang programs.

**Where to go next:**

- Browse the rest of the [Learn by Examples](/learn-by-examples) catalog —
  every file in `examples/` is mapped there.
- Use [Docs → Language Guide](/docs) as your reference now that you can
  read it fluently.
- Read the [Compiler & Tooling](/docs/compiler/overview) pages to see how
  your source becomes native machine code.

**👏 Great job. Now go build something real with AdeshLang.**
