---
id: testing
title: Testing Framework (adesh test)
sidebar_label: Testing
description: Built-in unit testing, integration testing, assertions, and test runner in AdeshLang.
---

# Testing Framework (`adesh test`)

AdeshLang comes with a first-class, built-in testing framework and test runner. No third-party test libraries are required.

---

## 1. Writing Tests

Tests are declared using the `@test` decorator or `test` blocks:

```adesh
import { add, multiply, divide } from "./math.adesh";

@test
fn test_addition() {
    assert_eq(add(2, 3), 5);
    assert_eq(add(-1, 1), 0);
}

@test
fn test_multiplication() {
    assert_eq(multiply(4, 5), 20);
    assert_eq(multiply(0, 100), 0);
}

@test
fn test_division_by_zero_fails() {
    let result = divide(10, 0);
    assert(result.is_err(), "Expected divide(10, 0) to return Error");
}
```

---

## 2. Assertion Library

AdeshLang includes built-in assertion functions in the standard prelude:

| Assertion | Syntax | Description |
|-----------|--------|-------------|
| `assert` | `assert(condition, [msg])` | Asserts that `condition` evaluates to `true`. |
| `assert_eq` | `assert_eq(actual, expected, [msg])` | Asserts that `actual == expected`. Prints both values on mismatch. |
| `assert_ne` | `assert_ne(a, b, [msg])` | Asserts that `a != b`. |
| `assert_null` | `assert_null(val, [msg])` | Asserts that `val == null`. |
| `assert_not_null` | `assert_not_null(val, [msg])` | Asserts that `val != null`. |
| `assert_throws` | `assert_throws(fn_closure)` | Asserts that executing the closure triggers a panic or exception. |

### Rich Failure Messages

When `assert_eq` fails, the test runner displays a colored diff of the mismatch:

```
test test_addition ... FAILED

Assertion Error at tests/math_test.adesh:6:5
    assert_eq(add(2, 3), 5)
    Left:  6
    Right: 5
```

---

## 3. Running Tests with CLI

Execute tests using the `adesh test` command:

```bash
# Run all tests in the current project
adesh test

# Run tests matching a specific name filter
adesh test --filter="addition"

# Run tests with detailed verbose output
adesh test --verbose

# Stop test execution immediately on the first failure
adesh test --fail-fast

# Run tests across multiple worker threads
adesh test --threads=8
```

---

## 4. Test Fixtures & Setup / Teardown

For integration tests requiring setup and teardown of database connections, temp files, or mock servers:

```adesh
@test_suite("Database Operations")
struct DatabaseTestSuite {
    db: DatabaseConnection,

    before_each(self) {
        self.db = DatabaseConnection::open_in_memory();
        self.db.migrate();
    }

    after_each(self) {
        self.db.close();
    }

    @test
    fn test_insert_and_query(self) {
        self.db.execute("INSERT INTO users (name) VALUES ('Alice')");
        let count = self.db.query_scalar("SELECT COUNT(*) FROM users");
        assert_eq(count, 1);
    }
}
```

---

## 5. Integration Tests vs Unit Tests

- **Unit Tests**: Placed in the same source file alongside the implementation or in a sibling `_test.adesh` file.
- **Integration Tests**: Placed in the dedicated `tests/` directory at the project root. The test runner compiles each file in `tests/` as a separate executable to test public API contracts.

```
my_project/
├── src/
│   ├── math.adesh
│   └── user.adesh
└── tests/
    ├── api_integration_test.adesh
    └── auth_flow_test.adesh
```

---

## 6. Code Coverage

Generate line and branch test coverage reports:

```bash
# Generate terminal coverage summary
adesh test --coverage

# Generate HTML coverage report
adesh test --coverage --coverage-html=coverage/
```
