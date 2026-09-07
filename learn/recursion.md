---
id: recursion
title: Recursion & Multiple Returns
sidebar_label: 8. Recursion & Multiple Returns
---

# Recursion & Multiple Returns

Recursion is the art of a function calling **itself** to solve a smaller
version of the same problem. Combined with AdeshLang's **multiple return
values**, it unlocks elegant solutions to classic algorithms. The real
benchmarks live in [`examples/recursion/`](https://github.com/adeshlang/adeshlang/tree/main/examples/recursion).

## Multiple returns: functions that return several values

AdeshLang functions can return a parenthesized list of values in one shot,
and callers destructure them directly (from
[`examples/real_world/02_test_multiple_returns.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/real_world/02_test_multiple_returns.adesh)):

```adesh
fn get_user(): (string, int, bool) {
    return "Ajay", 25, true;
}

let (name, age, is_admin) = get_user();

print("Name: " + name);
print("Age: " + str(age));
print("Admin: " + str(is_admin));
```

**Output:**
```
Name: Ajay
Age: 25
Admin: true
```

One call, three values — no object wrapper needed.

## Recursion: factorial

The classic example, both plain and **tail-recursive** (from
[`examples/recursion/factorial.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/recursion/factorial.adesh)):

```adesh
// Plain recursion: n * factorial(n-1)
fn factorial(n) {
    if n <= 1 {
        return 1;
    }
    return n * factorial(n - 1);
}

// Tail recursion: the recursive call is the LAST thing evaluated,
// so the compiler can reuse the stack frame (TCO)
fn factorial_tail(n, acc) {
    if n <= 1 {
        return acc;
    }
    return factorial_tail(n - 1, n * acc);
}

fn fact(n) {
    return factorial_tail(n, 1);
}

for i in range(1, 8) {
    print(`${i}! = ${factorial(i)}`);
}
print("Tail: 10! =", fact(10));
```

**Output:**
```
1! = 1
2! = 2
3! = 6
4! = 24
5! = 120
6! = 720
7! = 5040
Tail: 10! = 3628800
```

## The three flavors of Fibonacci

[`examples/fib/`](https://github.com/adeshlang/adeshlang/tree/main/examples/fib) is
entirely about Fibonacci, because it teaches the performance lesson of the
decade:

**1. Naive recursion — exponentially slow**

```adesh
fn fib_naive(n) {
    if (n <= 1) { return n; }
    return fib_naive(n - 1) + fib_naive(n - 2);
}

print(fib_naive(10));   // fast
print(fib_naive(30));   // ~1.3 million calls — slow!
```

**Output:**
```
55
832040
```

**2. Tail recursion with accumulator — linear**

```adesh
fn fib_tail(n, a, b) {
    if n == 0 { return a; }
    return fib_tail(n - 1, b, a + b);
}

print(fib_tail(10, 0, 1));
print(fib_tail(30, 0, 1));
```

**Output:**
```
55
832040
```

**3. Iterative DP — the fastest (from `fib_dp_simple.adesh`)**

```adesh
fn fib_dp(n) {
    if n <= 1 { return n; }
    let prev = 0;
    let curr = 1;
    let i = 2;
    while (i <= n) {
        let next = prev + curr;
        prev = curr;
        curr = next;
        i = i + 1;
    }
    return curr;
}

print(fib_dp(10));
print(fib_dp(30));
```

**Output:**
```
55
832040
```

Same answers, wildly different costs: naive is `O(2^n)`, DP is `O(n)`. This
is why the docs brag about 10–230× speedups in
[`fib_benchmark.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/fib/fib_benchmark.adesh) when you give the compiler the *better algorithm*
first.

## GCD — Euclid's algorithm

```adesh
fn gcd(a, b) {
    if b == 0 {
        return a;
    }
    return gcd(b, a % b);
}

print(gcd(24, 36));   // 12
print(gcd(17, 31));   // 1  (coprime)
print(gcd(1071, 462)); // 21
```

**Output:**
```
12
1
21
```

## Towers of Hanoi — a puzzle that is pure recursion

```adesh
fn hanoi(n, from, to, via) {
    if n == 0 { return; }
    hanoi(n - 1, from, via, to);
    print(`Move disk ${n} from ${from} to ${to}`);
    hanoi(n - 1, via, to, from);
}

hanoi(3, "A", "C", "B");
```

**Output:**
```
Move disk 1 from A to C
Move disk 2 from A to B
Move disk 1 from C to B
Move disk 3 from A to C
Move disk 1 from B to A
Move disk 2 from B to C
Move disk 1 from A to C
```

## Practical recursion: directory walk

Recursion shines on nested data of unknown depth:

```adesh
fn walk(folder, depth) {
    for item in folder {
        if item.isDir {
            print(" ".repeat(depth) + "📁 " + item.name);
            walk(item.children, depth + 1);
        } else {
            print(" ".repeat(depth) + "📄 " + item.name);
        }
    }
}

let root = {
    name: "src",
    isDir: true,
    children: [
        { name: "main.adesh", isDir: false },
        { name: "lib", isDir: true, children: [
            { name: "utils.adesh", isDir: false }
        ]}
    ]
};
walk(root, 0);
```

**Output:**
```
📁 src
  📄 main.adesh
  📁 lib
    📄 utils.adesh
```

## Choosing recursion vs iteration

| Situation | Prefer |
|-----------|--------|
| Nested data of unknown depth (trees, filesystems) | recursion |
| Simple repeated count (sums, loops) | iteration |
| Mathematical definitions (factorial, fibonacci, gcd) | recursion or iteration |
| Hot inner loop, maximum speed | iteration (+ `--fast-recursion` for TCO) |

## Practice

Write `countdown.adesh`:

```adesh
fn countdown(n) {
    if n <= 0 {
        print("Liftoff! 🚀");
        return;
    }
    print(n);
    countdown(n - 1);
}

countdown(3);
```

**Output:**
```
3
2
1
Liftoff! 🚀
```

## Summary

✅ **You learned:**
- Functions return multiple values: `return a, b, c;` destructured as
  `let (x, y, z) = fn();`
- Recursion: a function solving a smaller version of itself
- Base case + recursive step structure
- Tail recursion (TCO) vs naive recursion
- The naive-fibonacci vs DP performance lesson
- GCD and Towers of Hanoi as classic recursive problems

## Next Step

Now let's bundle values into **collections** — arrays, objects, and how to
`map`/`filter`/`reduce` them. Continue to **[Collections](/learn/collections)** →
