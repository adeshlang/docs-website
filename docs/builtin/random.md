---
id: random
title: Random Library
sidebar_label: Random
---

# Random Library

The **Random** builtin library is a complete, production-grade randomness ecosystem for Adesh. It provides unbiased bounded integers (zero modulo bias via rejection sampling), full-range `u8`–`i128` generators, floats, booleans, bytes, strings/UUIDs/tokens, Fisher–Yates shuffling, sampling (with and without replacement), weighted and reservoir sampling, seeded deterministic `Rng` streams, statistical distributions, and OS-entropy-secure bytes — all backed by a high-speed **Xoshiro256++** PRNG.

## Namespace

| Name | What it provides |
| :--- | :--- |
| `Random` | The namespace: integers, floats, bytes, strings, sampling, distributions, UUIDs, tokens, secure bytes |
| `Random.Rng` | Namespace with `seed(s)` / `new()` constructors for stateful generators |
| Rng instance | Seeded deterministic generator: `int`, `float`, `bool`, `string`, `choice`, `shuffle`, `sample`, `clone`, `fork`, `state`, `restore` |
| Distribution object | `Random.Normal(mean, sd)` / `Uniform(min, max)` / `Exponential(lambda)` with `.sample()` |

## Importing the library

```adesh
import Random;                // or import Random as R;
```

You can also import individual members:

```adesh
from Random import int, float, choice, seed;
```

## Basic usage

```adesh
import Random;

let n = Random.int(1, 100);        // 1 <= n < 100
let f = Random.float();            // 0.0 <= f < 1.0
let b = Random.bool();             // true or false (50/50)
let byteVal = Random.byte();       // 0..255
let bytesArr = Random.bytes(16);   // Array of 16 random bytes
let uid = Random.uuid();           // RFC 4122 v4 UUID string
```

---

## Integer Randomness

All bounded integer generation uses **rejection sampling** to guarantee zero modulo bias.

| Function | Range |
| :--- | :--- |
| `int()` | Full `i64` range |
| `int(max)` | `[0, max)` |
| `int(min, max)` | `[min, max)` (half-open) |
| `intInclusive(min, max)` | `[min, max]` (inclusive) |
| `intExclusive(min, max)` | `(min, max)` (exclusive) |

```adesh
import Random;

Random.int(1, 100);          // 1 <= val < 100
Random.intInclusive(1, 100); // 1 <= val <= 100
Random.intExclusive(1, 100); // 1 < val < 100
```

Full representable-width generators (no arguments):

```adesh
Random.u8(); Random.u16(); Random.u32(); Random.u64(); Random.u128();
Random.i8(); Random.i16(); Random.i32(); Random.i64(); Random.i128();
```

---

## Floating-Point Randomness

| Function | Range |
| :--- | :--- |
| `float()` | `[0.0, 1.0)` |
| `float(min, max)` / `floatRange(min, max)` | `[min, max)` |
| `floatInclusive(min, max)` | `[min, max]` |
| `f32()` / `f64()` | Uniform float in `[0.0, 1.0)` |

```adesh
import Random;

Random.float();                   // 0.0 <= val < 1.0
Random.floatRange(10.0, 50.0);    // 10.0 <= val < 50.0
Random.floatInclusive(0.0, 1.0);  // 0.0 <= val <= 1.0
```

---

## Booleans & Bytes

| Function | Description |
| :--- | :--- |
| `bool()` | `true`/`false` with 50% probability |
| `bool(p)` / `bernoulli(p)` | `true` with probability `p` (`0.0 <= p <= 1.0`) |
| `byte()` | Single random byte `[0..255]` |
| `bytes(count)` | Array of `count` random bytes |
| `fillBytes(array)` | Array of random bytes the same length as the input |
| `fillInts(count, min?, max?)` | Array of `count` random integers |
| `fillFloats(count, min?, max?)` | Array of `count` random floats |

```adesh
import Random;

print(Random.bool());                // true / false
print(Random.bernoulli(0.9));        // true ~90% of the time

let b = Random.byte();               // 0..255
let buf = Random.fillBytes([0, 0, 0, 0]);  // 4 random bytes
let ints = Random.fillInts(5, 1, 10);      // 5 integers in [1, 10)
```

---

## Strings, Chars & IDs

| Function | Description |
| :--- | :--- |
| `string(len)` / `alphanumeric(len)` | Alphanumeric string `[a-zA-Z0-9]` of length `len` |
| `ascii(len)` | Printable ASCII string (code points `32..126`) |
| `hex(len)` | Hexadecimal string `[0-9a-f]` |
| `stringFrom(charset, len)` | String of length `len` sampled from a custom charset |
| `char()` | Random valid Unicode scalar character |
| `charFrom(charset)` | Random character from a charset string |
| `uuid()` / `uuid4()` / `uuidString()` | RFC 4122 v4 UUID string |
| `token(len = 32)` | URL-safe token (alphanumeric) |
| `hexToken(len = 32)` | Hex token |
| `base64Token(len = 32)` | URL-safe Base64 token |

```adesh
import Random;

print(Random.string(16));                 // e.g. "aX9pQ2mN..."  (alphanumeric)
print(Random.ascii(20));                  // printable ASCII, incl. symbols
print(Random.hex(64));                    // e.g. "3f9a1c..."
print(Random.stringFrom("ABCDEF012345", 10));

print(Random.char());                     // a random Unicode character
print(Random.charFrom("xyz!"));           // one of x, y, z, !

print(Random.uuid());                     // e.g. "f47ac10b-58cc-4372-a567-0e02b2c3d479"
print(Random.token(32));                  // URL-safe token
print(Random.hexToken(16));               // hex token
print(Random.base64Token(24));            // URL-safe Base64 token
```

---

## Collection Shuffling & Sampling

| Function | Description |
| :--- | :--- |
| `choice(collection)` | Uniform random element |
| `shuffle(collection)` | In-place Fisher–Yates shuffle (returns the shuffled array) |
| `shuffled(collection)` | New shuffled copy (non-mutating) |
| `sample(collection, k)` | `k` elements **without** replacement |
| `sampleWithReplacement(collection, k)` | `k` elements **with** replacement |
| `weightedChoice([item, weight]...)` | Weighted choice from a pair list |
| `weightedChoice(items, weights)` | Weighted choice from separate arrays |
| `reservoirSample(collection, k)` | Streaming sample of `k` items in `O(k)` memory |

```adesh
import Random;

let colors = ["red", "green", "blue", "yellow", "purple"];

let color = Random.choice(colors);            // one color
Random.shuffle(colors);                       // in-place Fisher-Yates
let shuffledCopy = Random.shuffled(colors);   // non-mutating

let sampleList = Random.sample(colors, 3);          // without replacement
let repeated = Random.sampleWithReplacement(colors, 10);  // with replacement

let loot = Random.weightedChoice([
    ["common", 90],
    ["rare", 9],
    ["legendary", 1]
]);

let loot2 = Random.weightedChoice(["A", "B", "C"], [1.0, 3.0, 6.0]);
```

`sample`/`shuffle`/`choice` also accept tuples, sets, raw arrays, and dynamic arrays.

---

## Seeded RNG & Deterministic Reproducibility

For simulations, procedural generation, and reproducible unit tests, create a stateful generator with `Random.seed(s)`:

```adesh
import Random;

let rng = Random.seed(12345);

let a = rng.int(1, 100);
let b = rng.float();
let c = rng.bool();
let d = rng.string(10);
```

Two generators with the same seed produce identical sequences:

```adesh
import Random;

let rng1 = Random.seed(42);
let val1 = [rng1.int(1, 100), rng1.float()];

let rng2 = Random.seed(42);
let val2 = [rng2.int(1, 100), rng2.float()];

print(val1 == val2);   // true — fully reproducible
```

`Random.Rng.seed(s)` is the same as `Random.seed(s)`; `Random.Rng.new()` creates an auto-seeded generator.

### Rng instance methods

| Method | Description |
| :--- | :--- |
| `int(min, max)` / `int()` | Integer in `[min, max)` or full range |
| `intInclusive(min, max)` | Integer in `[min, max]` |
| `float()` / `float(min, max)` | Float in `[0, 1)` or `[min, max)` |
| `bool()` / `bool(p)` | Random boolean, optionally with probability `p` |
| `byte()` / `bytes(count)` / `string(len)` | Byte(s) and alphanumeric strings |
| `choice(collection)` / `shuffle(collection)` / `sample(collection, k)` | Collection helpers (deterministic) |
| `clone()` | Independent copy with identical state |
| `fork()` | New deterministic child generator |
| `state()` | Serialized internal state as `[u64; 4]` array |
| `restore(stateArr)` | Restore state from a `[u64; 4]` array; returns `true` |

```adesh
import Random;

let rng = Random.seed(7);

let st = rng.state();          // capture state
let a = rng.int(1, 100);
rng.restore(st);               // rewind to captured state
let b = rng.int(1, 100);
print(a == b);                 // true — same value again

let twin = rng.clone();        // independent copy, same position
let child = rng.fork();        // deterministic child stream
```

---

## Statistical Distributions

Convenience functions (one-shot samples from the global PRNG):

| Function | Distribution |
| :--- | :--- |
| `normal(mean, stdDev)` | Gaussian `Normal(mean, sd)` |
| `uniform(min, max)` | Continuous `Uniform(min, max)` |
| `binomial(trials, p)` | `Binomial(n, p)` (count of successes) |
| `exponential(lambda)` | `Exponential(lambda)` |
| `poisson(lambda)` | `Poisson(lambda)` |
| `geometric(p)` | `Geometric(p)` (trials until success) |
| `gamma(alpha, beta)` | `Gamma(alpha, beta)` |
| `logNormal(mean, stdDev)` | `LogNormal(mean, sd)` |

```adesh
import Random;

let norm = Random.normal(0.0, 1.0);        // standard normal
let unif = Random.uniform(-10.0, 10.0);    // uniform
let exp  = Random.exponential(1.5);        // exponential
let binom = Random.binomial(20, 0.5);      // ~10 on average
let pois = Random.poisson(4.0);            // Poisson
let geom = Random.geometric(0.3);          // geometric
let gam = Random.gamma(2.0, 2.0);          // gamma
let logN = Random.logNormal(0.0, 0.25);    // log-normal
```

### Distribution objects

Reusable sampling configurations (`Normal`, `Uniform`, `Exponential`), each with a `.sample()` method:

```adesh
import Random;

let iq = Random.Normal(100.0, 15.0);
let iq1 = iq.sample();
let iq2 = iq.sample();

let u = Random.Uniform(0.0, 1.0);
let e = Random.Exponential(2.0);
```

---

## Secure Entropy Boundary

Standard `Random` functions use high-speed **Xoshiro256++** pseudo-randomness, suitable for simulations, games, and algorithms.

For security-sensitive operations (cryptographic keys, passwords, session tokens), use OS entropy directly:

```adesh
import Random;

let secureKey = Random.secureBytes(32);   // 32 bytes from OS entropy
```

`Random.secureBytes(count = 32)` draws from the operating system's CSPRNG (`OsRng`). It is also exposed as `Crypto.secureRandomBytes`.

:::warning
Never use the standard PRNG for cryptographic keys, passwords, or session tokens — use `Random.secureBytes` (or the `Crypto` library).
:::

---

## Complete example

A reproducible simulation, then a weighted-loot table:

```adesh
import Random;

print("--- Reproducible simulation ---");

fn runSimulation(seedVal) {
    let rng = Random.seed(seedVal);
    let totalScore = 0;
    for i in 0..5 {
        let _step = i;
        let roll = rng.int(1, 7);
        totalScore = totalScore + roll;
    }
    return totalScore;
}

print("Run 1 (seed 999): " + runSimulation(999));
print("Run 2 (seed 999): " + runSimulation(999));   // identical

print("--- Weighted loot table ---");

let loot = Random.weightedChoice([
    ["Silver Coin", 70.0],
    ["Gold Coin", 25.0],
    ["Diamond", 5.0]
]);
print("Sampled loot: " + loot);

print("--- Secure entropy ---");

let key = Random.secureBytes(32);
print("Key length: " + str(len(key)) + " bytes");
```

---

## Notes & edge cases

- **PRNG**: standard functions use **Xoshiro256++**; `secureBytes` uses the OS CSPRNG (`OsRng`).
- **Unbiased ranges**: bounded integers use rejection sampling (Lemire's algorithm) — no modulo bias.
- **`int` overloads**: `int()` = full `i64` range; `int(max)` = `[0, max)`; `int(min, max)` = `[min, max)`.
- **`intExclusive(min, max)`** errors when no integer exists between `min` and `max` (e.g. `intExclusive(1, 2)`).
- **Weighted choice** accepts either a list of `[item, weight]` pairs or separate `(items, weights)` arrays.
- **Determinism**: seeds reproduce exact sequences within the same language version; `state()`/`restore()` capture the precise generator position.
- **Distribution objects** available: `Random.Normal`, `Random.Uniform`, `Random.Exponential` (with `.sample()`); the other distributions are convenience functions only.

## Source & examples

- Implementation: `src/runtime/stdlib_src/random/` (`api.rs`, `bounded.rs`, `collections.rs`, `distributions.rs`, `prng.rs`, `rng_object.rs`, `strings.rs`)
- Runnable examples: `examples/Libraries/random/` (`basic_random.adesh`, `integers.adesh`, `floats.adesh`, `booleans.adesh`, `bytes.adesh`, `bulk_generation.adesh`, `strings.adesh`, `uuid.adesh`, `choice.adesh`, `collection_random.adesh`, `shuffle.adesh`, `sample.adesh`, `weighted_choice.adesh`, `reservoir_sampling.adesh`, `seeded_rng.adesh`, `reproducible_simulation.adesh`, `distributions.adesh`, `normal_distribution.adesh`, `monte_carlo.adesh`, `random_walk.adesh`)

## Related

- [Builtin Libraries Overview](overview)
- [Math Library](math) — `Math.random()`, `Math.randomInt()`, `Math.randomRange()`
- [Standard Library Overview](overview)
- [Built-in Functions](builtins)
