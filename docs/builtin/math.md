---
id: math
title: Math Library
sidebar_label: Math
---

# Math Library

The **Math** builtin library provides everything you need for numeric work in AdeshLang: mathematical constants, arithmetic, rounding, exponentiation and logarithms, trigonometry, hyperbolic functions, random number generation, number-theory helpers (GCD, LCM, factorials, combinations), floating-point utilities, and special functions.

It exposes **two namespaces**:

| Namespace | What it provides |
| :--- | :--- |
| `Math` | Functions and constants for **real** (floating-point) numbers. |
| `cmath` | Functions for **complex** numbers (`a + b·j`), plus convenience conversions. |

## Importing the library

```adesh
import Math;     // real math — recommended for most programs
import cmath;    // complex math

import { sqrt, pow } from "Math";   // selective import also works
```

:::note
Both `import Math` and `import math` bind the same namespace. The `cmath` namespace is imported with its exact lowercase name.
:::

## When to use which namespace

- Use `Math` for everyday numeric calculations — geometry, statistics, simulations, financial math, rounding, and randomness.
- Use `cmath` when you need complex numbers — for example, electrical engineering, signal processing, quantum mechanics, or math where negative square roots must be representable.
- `cmath` functions accept plain numbers too; a real number is treated as a complex value with an imaginary part of `0`.

---

## Constants

### `Math` constants

| Constant | Approximate value | Description |
| :--- | :--- | :--- |
| `Math.PI` / `Math.pi` | `3.141592653589793` | π, the ratio of a circle's circumference to its diameter. |
| `Math.E` / `Math.e` | `2.718281828459045` | Euler's number, base of natural logarithms. |
| `Math.TAU` / `Math.tau` | `6.283185307179586` | 2π, a full turn in radians. |
| `Math.SQRT2` | `1.4142135623730951` | Square root of 2. |
| `Math.SQRT1_2` | `0.7071067811865476` | 1/√2 (square root of one-half). |
| `Math.LN2` | `0.6931471805599453` | Natural logarithm of 2. |
| `Math.LN10` | `2.302585092994046` | Natural logarithm of 10. |
| `Math.inf` | `Infinity` | Positive infinity. |
| `Math.nan` | `NaN` | Not-a-Number. |

```adesh
import Math;
print(Math.PI);      // 3.141592653589793
print(Math.E);       // 2.718281828459045
print(Math.SQRT1_2); // 0.7071067811865476
```

### `cmath` constants

| Constant | Value | Description |
| :--- | :--- | :--- |
| `cmath.pi` | `3.141592653589793` | π. |
| `cmath.e` | `2.718281828459045` | Euler's number. |
| `cmath.tau` | `6.283185307179586` | 2π. |
| `cmath.inf` | `Infinity` | Real infinity. |
| `cmath.nan` | `NaN` | Real not-a-number. |
| `cmath.infj` | `0 + ∞j` | Complex infinity. |
| `cmath.nanj` | `0 + NaN·j` | Complex not-a-number. |

---

## Methods: Random Number Generation

For simulations, games, sampling, and testing. All functions can be made **deterministic** by calling `Math.seed` first.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.random()` | Random float in `[0, 1)` | — | `number` |
| `Math.seed(seed)` | Seed the global RNG so later random calls are reproducible | `seed: number` | `null` |
| `Math.randomInt(min, max)` | Random **integer** in `[min, max]` (inclusive on both ends) | `min: number`, `max: number` | `number` |
| `Math.randomRange(min, max)` | Random float in `[min, max)` (max excluded) | `min: number`, `max: number` | `number` |

```adesh
import Math;

Math.seed(42);                        // deterministic from now on
print(Math.random());                 // 0.3745...  (some float in [0, 1))

let die = Math.randomInt(1, 6);       // dice roll: an integer from 1 to 6
let temp = Math.randomRange(20.0, 30.0); // temperature in [20, 30)
```

:::tip
Call `Math.seed(value)` before a batch of random calls to get the exact same sequence on every run — useful for reproducible tests and simulations.
:::

---

## Methods: Rounding, Sign & Integer Helpers

Use these to convert floats to whole numbers or to describe the sign of a value.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.floor(x)` | Round **down** to the nearest integer | `x: number` | `number` |
| `Math.ceil(x)` | Round **up** to the nearest integer | `x: number` | `number` |
| `Math.round(x)` | Round to the nearest integer (half rounds away from zero) | `x: number` | `number` |
| `Math.trunc(x)` | Remove the fractional part (round toward zero) | `x: number` | `number` |
| `Math.sign(x)` | Sign of a value: `1` for positive, `-1` for negative, `0` for zero | `x: number` | `number` |
| `Math.isqrt(n)` | Integer square root: largest integer `k` with `k² ≤ n` | `n: number` | `number` |

```adesh
import Math;
print(Math.floor(3.7));   // 3
print(Math.ceil(3.1));    // 4
print(Math.round(3.5));   // 4
print(Math.trunc(-3.9));  // -3
print(Math.sign(-10));    // -1
print(Math.sign(0));      // 0
print(Math.sign(10));     // 1
print(Math.isqrt(26));    // 5
```

:::note
`Math.isqrt(n)` returns `0` for negative input. `Math.trunc` differs from `Math.floor`: `trunc(-3.9)` → `-3`, while `floor(-3.9)` → `-4`.
:::

---

## Methods: Basic Arithmetic

Core operations on one or more numbers.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.abs(x)` | Absolute value of `x` | `x: number` | `number` |
| `Math.fabs(x)` | Alias of `Math.abs` (float absolute value) | `x: number` | `number` |
| `Math.min(...values)` | Smallest of the given values (at least one required) | `...values: number[]` | `number` |
| `Math.max(...values)` | Largest of the given values (at least one required) | `...values: number[]` | `number` |
| `Math.pow(x, y)` | `x` raised to the power `y` | `x: number`, `y: number` | `number` |
| `Math.sqrt(x)` | Square root of `x` | `x: number` | `number` |
| `Math.cbrt(x)` | Cube root of `x` | `x: number` | `number` |
| `Math.hypot(...coords)` | Euclidean length of a vector; `√(a² + b² + …)`. Returns `0` with no arguments | `...coords: number[]` | `number` |
| `Math.clamp(val, min, max)` | Restrict `val` to the range `[min, max]` | `val: number`, `min: number`, `max: number` | `number` |
| `Math.lerp(a, b, t)` | Linear interpolation: `a + (b - a) * t` | `a: number`, `b: number`, `t: number` | `number` |

```adesh
import Math;
print(Math.abs(-42));       // 42
print(Math.min(3, -10, 20)); // -10
print(Math.max(3, -10, 20)); // 20
print(Math.pow(2, 8));      // 256
print(Math.sqrt(81));       // 9
print(Math.cbrt(27));       // 3
print(Math.hypot(3, 4));    // 5
print(Math.clamp(45, 0, 10)); // 10
print(Math.lerp(10, 20, 0.5)); // 15
```

---

## Methods: Exponentials, Roots & Logarithms

For growth/decay models, sound levels (dB), information theory, and any log-scale math.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.exp(x)` | Euler's number raised to `x` (`eˣ`) | `x: number` | `number` |
| `Math.exp2(x)` | `2` raised to the power `x` (`2ˣ`) | `x: number` | `number` |
| `Math.expm1(x)` | `eˣ - 1` (accurate for very small `x`) | `x: number` | `number` |
| `Math.log(x)` | Natural logarithm of `x` (base `e`) | `x: number` | `number` |
| `Math.log(x, base)` | Logarithm of `x` in the given `base` | `x: number`, `base: number` | `number` |
| `Math.log2(x)` | Base-2 logarithm | `x: number` | `number` |
| `Math.log10(x)` | Base-10 logarithm | `x: number` | `number` |
| `Math.log1p(x)` | `ln(1 + x)` (accurate for very small `x`) | `x: number` | `number` |

```adesh
import Math;
print(Math.exp(1));      // 2.718281828459045
print(Math.log(Math.E)); // 1
print(Math.log(8, 2));   // 3
print(Math.log10(100));  // 2
print(Math.log2(32));    // 5
print(Math.expm1(1));    // 1.718281828459045
print(Math.log1p(1));    // 0.6931471805599453
```

---

## Methods: Trigonometry

All trigonometric functions work in **radians**. Use `degToRad`/`radians` to convert from degrees when needed.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.sin(x)` | Sine of an angle (radians) | `x: number` | `number` |
| `Math.cos(x)` | Cosine of an angle (radians) | `x: number` | `number` |
| `Math.tan(x)` | Tangent of an angle (radians) | `x: number` | `number` |
| `Math.asin(x)` | Arc sine; inverse of sine | `x: number` | `number` |
| `Math.acos(x)` | Arc cosine; inverse of cosine | `x: number` | `number` |
| `Math.atan(x)` | Arc tangent; inverse of tangent | `x: number` | `number` |
| `Math.atan2(y, x)` | Arc tangent of `y / x`, returning an angle in the correct quadrant | `y: number`, `x: number` | `number` |

```adesh
import Math;
print(Math.sin(Math.PI / 2));  // 1
print(Math.cos(0));            // 1
print(Math.tan(0));            // 0
print(Math.asin(1));           // 1.5707963267948966 (π/2)
print(Math.acos(1));           // 0
print(Math.atan(1));           // 0.7853981633974483 (π/4)
print(Math.atan2(1, 1));       // 0.7853981633974483
```

:::tip
Prefer `Math.atan2(y, x)` over `Math.atan(y / x)` — it handles the case `x = 0` and always picks the correct quadrant, which is essential when computing directions and angles between points.
:::

---

## Methods: Hyperbolic Functions

The hyperbolic functions (`sinh`, `cosh`, `tanh`) describe the shape of a hanging cable and appear in physics, geometry of hyperbolic space, and exponential smoothing. The `a`-prefixed versions are their inverses.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.sinh(x)` | Hyperbolic sine | `x: number` | `number` |
| `Math.cosh(x)` | Hyperbolic cosine | `x: number` | `number` |
| `Math.tanh(x)` | Hyperbolic tangent | `x: number` | `number` |
| `Math.asinh(x)` | Inverse hyperbolic sine | `x: number` | `number` |
| `Math.acosh(x)` | Inverse hyperbolic cosine | `x: number` | `number` |
| `Math.atanh(x)` | Inverse hyperbolic tangent | `x: number` | `number` |

```adesh
import Math;
let v = 1.0;
print(Math.sinh(v));                    // 1.1752011936438014
print(Math.cosh(v));                    // 1.5430806348152437
print(Math.tanh(v));                    // 0.7615941559557649
print(Math.asinh(Math.sinh(v)));        // ~1.0 (round-trip)
print(Math.acosh(Math.cosh(v)));        // ~1.0 (round-trip)
print(Math.atanh(Math.tanh(v)));        // ~1.0 (round-trip)
```

---

## Methods: Angle Conversion

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.degToRad(deg)` | Convert **degrees → radians** | `deg: number` | `number` |
| `Math.radians(deg)` | Alias of `Math.degToRad` | `deg: number` | `number` |
| `Math.radToDeg(rad)` | Convert **radians → degrees** | `rad: number` | `number` |
| `Math.degrees(rad)` | Alias of `Math.radToDeg` | `rad: number` | `number` |

```adesh
import Math;
let rad = Math.degToRad(180);   // 3.141592653589793
print(rad);
print(Math.radToDeg(rad));      // 180
print(Math.degrees(Math.PI));   // 180
```

---

## Methods: Number Theory

Discrete-math helpers useful in combinatorics, cryptography teaching, modular arithmetic, and algorithm problems.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.gcd(...values)` | Greatest common divisor of all values. `gcd()` with no args returns `0` | `...values: number[]` | `number` |
| `Math.lcm(...values)` | Least common multiple of all values. `lcm()` with no args returns `1` | `...values: number[]` | `number` |
| `Math.factorial(n)` | `n! = 1·2·3·…·n`. Returns `0` for negative `n` | `n: number` | `number` |
| `Math.comb(n, k)` | Combinations: number of ways to choose `k` items from `n` (order does not matter). Returns `0` when `k` is invalid | `n: number`, `k: number` | `number` |
| `Math.perm(n, k)` | Permutations: number of ways to arrange `k` items picked from `n` (order matters). Returns `0` when `k` is invalid | `n: number`, `k: number` | `number` |

```adesh
import Math;
print(Math.gcd(24, 36));       // 12
print(Math.gcd(24, 36, 60));   // 12
print(Math.lcm(24, 36));       // 72
print(Math.factorial(5));      // 120
print(Math.comb(5, 2));        // 10
print(Math.perm(5, 2));        // 20
```

---

## Methods: Floating-Point Utilities

Fine-grained control over IEEE-754 floating-point behavior for scientific code and precise numeric algorithms.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.fma(x, y, z)` | Fused multiply-add: computes `x·y + z` with a single rounding | `x: number`, `y: number`, `z: number` | `number` |
| `Math.fmod(x, y)` | Floating-point remainder of `x / y` (truncated division) | `x: number`, `y: number` | `number` |
| `Math.modf(x)` | Split into `(fractional_part, integer_part)` | `x: number` | `tuple` |
| `Math.remainder(x, y)` | IEEE remainder of `x / y` (rounded division) | `x: number`, `y: number` | `number` |
| `Math.copysign(x, y)` | Magnitude of `x` with the sign of `y` | `x: number`, `y: number` | `number` |
| `Math.frexp(x)` | Split into `(mantissa, exponent)` such that `x = mantissa · 2ᵉᵡᵖ` | `x: number` | `tuple` |
| `Math.ldexp(x, i)` | Compute `x · 2ⁱ` (inverse of `frexp`) | `x: number`, `i: number` | `number` |
| `Math.nextafter(x, y)` | Next representable float after `x` toward `y` | `x: number`, `y: number` | `number` |
| `Math.nextafter(x, y, steps)` | `steps` representable floats after `x` toward `y` | `x: number`, `y: number`, `steps: number` | `number` |
| `Math.ulp(x)` | Unit in the last place — size of the gap between `x` and the next float | `x: number` | `number` |

```adesh
import Math;
print(Math.fma(2, 3, 4));        // 10
print(Math.fmod(5.3, 2.0));      // 1.3
print(Math.modf(3.75));          // (0.75, 3.0)
print(Math.copysign(3, -1));     // -3
print(Math.frexp(12.0));         // (0.75, 4)  → 0.75 · 2⁴ = 12
print(Math.ldexp(0.75, 4));      // 12
```

:::note
`Math.modf` and `Math.frexp` return a **tuple**, so destructure or index them like `let (frac, integral) = Math.modf(x);` or `Math.modf(x)[0]`.
:::

---

## Methods: Value Classification

Predicates to safely inspect numbers before using them — the idiomatic way to guard against `NaN`/infinity in AdeshLang.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.isclose(a, b, rel_tol?, abs_tol?)` | Whether `a` and `b` are close within relative tolerance `rel_tol` (default `1e-09`) and/or absolute tolerance `abs_tol` (default `0`) | `a: number`, `b: number`, `rel_tol?: number`, `abs_tol?: number` | `boolean` |
| `Math.isfinite(x)` / `Math.isFinite(x)` | `true` if `x` is a finite number (not `NaN`/infinity) | `x: number` | `boolean` |
| `Math.isinf(x)` / `Math.isInf(x)` | `true` if `x` is `±Infinity` | `x: number` | `boolean` |
| `Math.isnan(x)` / `Math.isNaN(x)` | `true` if `x` is `NaN` (not a number) | `x: number` | `boolean` |

```adesh
import Math;
print(Math.isclose(0.1 + 0.2, 0.3)); // true (handles floating-point error)
print(Math.isfinite(3));             // true
print(Math.isinf(Math.inf));         // true
print(Math.isnan(Math.nan));         // true
```

:::tip
Never compare floats directly with `==`. Use `Math.isclose(a, b)` for approximate comparisons in tests and financial calculations.
:::

---

## Methods: Array / Statistical Helpers

Operate on numeric **arrays** (iterables) for statistics, linear algebra, and signal processing.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.dist(p, q)` | Euclidean distance between two equal-length numeric vectors | `p: array`, `q: array` | `number` |
| `Math.fsum(iterable)` | Accurate floating-point sum (Kahan/Neumaier compensated summation, reduces rounding error) | `iterable: array` | `number` |
| `Math.prod(iterable, start?)` | Product of all elements, optionally starting from `start` (default `1`) | `iterable: array`, `start?: number` | `number` |
| `Math.sumprod(p, q)` | Sum of element-wise products of two arrays (`Σ pᵢ·qᵢ`, the dot product) | `p: array`, `q: array` | `number` |

```adesh
import Math;
let a = [1, 2, 3];
let b = [4, 5, 6];

print(Math.dist([0, 0], [3, 4]));  // 5
print(Math.fsum([0.1, 0.2, 0.3])); // 0.6
print(Math.prod([1, 2, 3, 4]));    // 24
print(Math.sumprod(a, b));         // 32  (1·4 + 2·5 + 3·6)
```

---

## Methods: Special Functions

Advanced mathematical functions for statistics, physics, and engineering.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.erf(x)` | Error function — the CDF of the standard normal distribution | `x: number` | `number` |
| `Math.erfc(x)` | Complementary error function: `1 - erf(x)` | `x: number` | `number` |
| `Math.gamma(x)` | Gamma function — generalization of the factorial to real numbers (`Γ(n) = (n-1)!` for integers) | `x: number` | `number` |
| `Math.lgamma(x)` | Natural logarithm of the absolute value of the gamma function | `x: number` | `number` |

```adesh
import Math;
print(Math.erf(1.0));     // 0.8427007929497149
print(Math.erfc(1.0));    // 0.15729920705028513
print(Math.gamma(5.0));   // 24  (= 4!)
print(Math.lgamma(5.0));  // 3.1780538303479458  (ln(24))
```

---

## Methods: Formatting

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `Math.formatDecimal(n, precision?)` | Format a number as a full decimal string with the given number of digits after the point (default `6`) | `n: number`, `precision?: number` | `string` |

```adesh
import Math;
let huge = 2.43290200817664e18;
print(huge);                           // 2.43290200817664e18 (scientific)
print(Math.formatDecimal(huge, 0));    // "2432902008176640000"
print(Math.formatDecimal(123.456, 1)); // "123.5"
```

---

## The `cmath` namespace (Complex Numbers)

The `cmath` namespace implements complex-number math. Complex values are printed like `real + imag·j` (e.g., `0.0 + 2.0j`), and every function here accepts either a complex value or a plain number.

```adesh
import cmath;
let z = cmath.sqrt(-4);   // 0.0 + 2.0j
print(z);
print(cmath.phase(z));    // 1.5707963267948966 (π/2)
```

### `cmath` methods

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `cmath.sqrt(z)` | Complex square root | `z: complex\|number` | `complex` |
| `cmath.exp(z)` | Complex exponential `eᶻ` | `z: complex\|number` | `complex` |
| `cmath.log(z)` | Complex natural logarithm | `z: complex\|number` | `complex` |
| `cmath.log(z, base)` | Complex logarithm in the given base | `z: complex\|number`, `base: number` | `complex` |
| `cmath.log10(z)` | Complex base-10 logarithm | `z: complex\|number` | `complex` |
| `cmath.sin(z)` | Complex sine | `z: complex\|number` | `complex` |
| `cmath.cos(z)` | Complex cosine | `z: complex\|number` | `complex` |
| `cmath.tan(z)` | Complex tangent | `z: complex\|number` | `complex` |
| `cmath.asin(z)` | Complex arc sine | `z: complex\|number` | `complex` |
| `cmath.acos(z)` | Complex arc cosine | `z: complex\|number` | `complex` |
| `cmath.atan(z)` | Complex arc tangent | `z: complex\|number` | `complex` |
| `cmath.sinh(z)` | Complex hyperbolic sine | `z: complex\|number` | `complex` |
| `cmath.cosh(z)` | Complex hyperbolic cosine | `z: complex\|number` | `complex` |
| `cmath.tanh(z)` | Complex hyperbolic tangent | `z: complex\|number` | `complex` |
| `cmath.asinh(z)` | Complex inverse hyperbolic sine | `z: complex\|number` | `complex` |
| `cmath.acosh(z)` | Complex inverse hyperbolic cosine | `z: complex\|number` | `complex` |
| `cmath.atanh(z)` | Complex inverse hyperbolic tangent | `z: complex\|number` | `complex` |
| `cmath.phase(z)` | Phase (argument, angle) of `z` in radians | `z: complex\|number` | `number` |
| `cmath.polar(z)` | Polar form as `(radius, phase)` tuple | `z: complex\|number` | `tuple` |
| `cmath.rect(r, phi)` | Build a complex number from polar `(radius, phase)` | `r: number`, `phi: number` | `complex` |
| `cmath.isclose(a, b, rel_tol?, abs_tol?)` | Approximate equality for complex numbers | `a`, `b`, `rel_tol?`, `abs_tol?` | `boolean` |
| `cmath.isfinite(z)` / `cmath.isFinite(z)` | `true` if both real and imaginary parts are finite | `z: complex\|number` | `boolean` |
| `cmath.isinf(z)` / `cmath.isInf(z)` | `true` if either part is infinite | `z: complex\|number` | `boolean` |
| `cmath.isnan(z)` / `cmath.isNaN(z)` | `true` if either part is `NaN` | `z: complex\|number` | `boolean` |

```adesh
import cmath;

let z = cmath.sqrt(-4);                 // 0.0 + 2.0j
print(cmath.cos(z));                    // -3.35618... + 0.0j  (cos(2j))
print(cmath.polar(z));                  // (2.0, 1.5707963267948966)
print(cmath.rect(2.0, Math.PI / 2));    // 0.0 + 2.0j  (back to rectangular)
print(cmath.isfinite(z));               // true
print(cmath.isinf(cmath.infj));         // true
```

---

## Complete example

A single program using several areas of the library together:

```adesh
import Math;

fn probability_of_at_least_heads(n, k) {
    // P(at least k heads in n fair coin tosses)
    let total = Math.pow(2.0, n);
    let favorable = 0;
    for i in range(k, n + 1) {
        favorable += Math.comb(n, i);
    }
    return favorable / total;
}

print("--- Constants ---");
print("PI:", Math.PI, "E:", Math.E);

print("\n--- Random (seeded, reproducible) ---");
Math.seed(7);
print("dice:", Math.randomInt(1, 6));
print("unit float:", Math.random());

print("\n--- Geometry ---");
print("distance:", Math.hypot(3, 4));
print("angle:", Math.radToDeg(Math.atan2(1, 1)), "deg");

print("\n--- Probability ---");
print("P(at least 3 heads in 5 tosses):", probability_of_at_least_heads(5, 3));

print("\n--- Precision ---");
print("fsum:", Math.fsum([0.1, 0.2, 0.3]));
print("isclose:", Math.isclose(0.1 + 0.2, 0.3));
print("formatted:", Math.formatDecimal(Math.factorial(20), 0));
```

---

## Notes & edge cases

- All `Math` functions return `f64` (`number`) and accept any numeric type; non-numeric arguments raise an error.
- Trigonometric and hyperbolic functions expect/return **radians** unless converted with `degToRad`/`radToDeg`.
- `Math.randomInt(min, max)` includes both `min` and `max`; `Math.randomRange` and `Math.random` exclude the upper bound.
- `Math.factorial` of a negative number, `Math.comb`/`Math.perm` with an invalid `k`, and `Math.isqrt` of a negative number all return `0`.
- `Math.gcd()` with no arguments returns `0`; `Math.lcm()` with no arguments returns `1`; `Math.hypot()` with no arguments returns `0`.
- `Math.modf` and `Math.frexp` return tuples — index them or destructure.
- `Math.log(x)` defaults to the natural logarithm; pass a second argument for another base.
- For reproducible randomness, always call `Math.seed(...)` at the start of the program.

## Source & examples

- Implementation: `src/runtime/stdlib_src/math/mod.rs`
- Runnable examples: `examples/Libraries/math/` (`math_demo.adesh`, `cmath_demo.adesh`, `all.adesh`, `trigonometry.adesh`, `logs_and_powers.adesh`, `min_max_abs_sign.adesh`, `random_and_rounding.adesh`)

## Related

- [Builtin Libraries Overview](overview)
- [Standard Library Overview](overview)
