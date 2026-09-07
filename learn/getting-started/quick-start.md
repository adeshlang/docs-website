---
id: quick-start
title: Quick Start Guide — Your First 5 Minutes
sidebar_label: Quick Start
slug: /getting-started/quick-start
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# AdeshLang Quick Start

<FeatureStatus status="STABLE" details="CLI toolchain, REPL, test harness, and build pipeline" />

This guide gets you up and running with AdeshLang in under 5 minutes. You will install the toolchain, verify your environment, create a project, write your first script, and run tests.

---

## 1. Verify Your Installation & Toolchain Health

Once AdeshLang is installed, test your environment using the built-in diagnostic utilities:

```bash
# Check compiler version
adesh --version

# Run system health diagnostics
adesh doctor

# Inspect active environment paths
adesh env
```

If `adesh doctor` detects missing dependencies or environment configuration issues, repair them automatically:

```bash
adesh repair
```

---

## 2. Initialize a New Project

Create a new AdeshLang project directory using `adesh init`:

```bash
adesh init my_first_app
cd my_first_app
```

`adesh init` scaffolds a clean project structure:

```text
my_first_app/
├── main.adesh       # Project entry point
└── utils.adesh      # Module export example
```

---

## 3. Write Your First Program

Open `main.adesh` and inspect the starter code:

```adesh
import "./utils.adesh" as u;

// 1. Constants and Variables
export let PI = 3.14159;

// 2. Class Definition
class Counter {
  Counter(n) {
    this.n = n;
  }

  fn inc() {
    this.n = this.n + 1;
  }

  fn value() {
    return this.n;
  }
}

// 3. Main Logic Execution
let counter = new Counter(10);
counter.inc();
print("Counter value:", counter.value()); // Output: Counter value: 11

// 4. Higher-Order Array Operations
let numbers = [1, 2, 3, 4];
let doubled = map(numbers, fn(x) { return x * 2; });
print("Doubled numbers:", doubled);      // Output: Doubled numbers: [2, 4, 6, 8]

// 5. Error Handling
try {
  throw Error("Sample error handled safely");
} catch(e) {
  print("Caught expected exception:", e);
}

print("Sum via module helper:", u.utilAdd(15, 27)); // Output: 42
```

---

## 4. Run Your Program

Run your script instantly using the default interpreter:

```bash
adesh run main.adesh
```

### Try Ultra-Fast Native JIT Compilation

To execute with native machine-code performance (10-230x faster for compute workloads), pass the `--jit-native` flag:

```bash
adesh run --jit-native main.adesh
```

---

## 5. Compile to Standalone Native Executable

Build a production-ready binary executable directly with `adesh build`:

```bash
adesh build main.adesh -o my_app.exe
./my_app.exe
```

---

## 6. Run Unit Tests

AdeshLang includes a built-in test runner. To execute embedded tests:

```bash
adesh run --test main.adesh
```

### Useful Testing Flags

```bash
# Run a specific test by name
adesh run --test --test-name test_counter main.adesh

# Stop execution on the first failure
adesh run --test --fail-fast main.adesh

# Benchmark across backends (Interpreter vs JIT vs Native JIT)
adesh run --test --backend-check main.adesh
```

---

## What's Next?

- Explore [Learn Programming](/learn) for a step-by-step introduction to programming concepts.
- Read [Execution Backends](/docs/backends/overview) to understand the Interpreter, JIT, and AOT compilation targets.
- Browse the [Standard Library Reference](/docs/builtin/overview) to see built-in networking, file system, and cryptography modules.
