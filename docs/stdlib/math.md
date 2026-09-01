---
id: math
title: Math Standard Module (stdlib/math)
sidebar_label: Math
description: Complete mathematical functions, trigonometry, logarithms, complex numbers, and constants in AdeshLang.
---

# Math Standard Module (`stdlib/math`)

The `math` module delivers hardware-accelerated numeric computing functions, transcendental math, exponential/logarithmic routines, and mathematical constants with IEEE 754 precision.

:::info
A comprehensive reference with the `cmath` complex-number namespace and extended tables is also available in the [**Builtin Libraries → Math**](../builtin/math) section.
:::

```adesh
import { math } from "stdlib/math";
```

---

## 1. Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `math::PI` | `3.141592653589793` | Ratio of a circle's circumference to its diameter ($\pi$). |
| `math::E` | `2.718281828459045` | Euler's number ($e$). |
| `math::TAU` | `6.283185307179586` | Circle constant ($2\pi$). |
| `math::LN_2` | `0.6931471805599453` | Natural logarithm of 2. |
| `math::LN_10` | `2.302585092994046` | Natural logarithm of 10. |
| `math::INFINITY` | `+inf` | Positive infinity ($+\infty$). |
| `math::NAN` | `NaN` | Not a Number. |

---

## 2. Common Functions

### Arithmetic & Power
```adesh
let root = math::sqrt(256.0);         // 16.0
let cube = math::cbrt(27.0);          // 3.0
let power = math::pow(2.0, 10.0);     // 1024.0
let hyp = math::hypot(3.0, 4.0);      // 5.0 (sqrt(x^2 + y^2))
let abs_val = math::abs(-42.5);       // 42.5
```

### Trigonometry & Angles
```adesh
let s = math::sin(math::PI / 2.0);    // 1.0
let c = math::cos(0.0);               // 1.0
let t = math::tan(math::PI / 4.0);    // 1.0
let angle = math::atan2(1.0, 1.0);    // 0.785398 rad (PI / 4)

let deg = math::to_degrees(math::PI); // 180.0
let rad = math::to_radians(180.0);    // 3.14159...
```

### Logarithms & Exponentials
```adesh
let natural_log = math::ln(math::E);  // 1.0
let log10_val = math::log10(1000.0);  // 3.0
let log2_val = math::log2(64.0);      // 6.0
let exp_val = math::exp(1.0);         // 2.71828...
```

### Rounding & Truncation
```adesh
let c = math::ceil(4.1);              // 5.0
let f = math::floor(4.9);             // 4.0
let r = math::round(4.5);             // 5.0
let t = math::trunc(-4.9);            // -4.0
let clamped = math::clamp(120.0, 0.0, 100.0); // 100.0
```
