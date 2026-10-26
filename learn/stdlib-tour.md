---
id: stdlib-tour
title: The Standard Library Tour
sidebar_label: 23. Standard Library Tour
---

# The Standard Library Tour

Adesh ships a **batteries-included standard library**: real math, real
filesystem access, real JSON, real regex, real time, real randomness, and real
crypto — all compiled into the runtime, no downloads. This tour walks through
each area using the actual example files from
[`examples/Libraries/`](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries)
(394 files).

## How importing works

```adesh
import Math;          // full namespace
import JSON;          // case-insensitive: import json also works
import { pow } from "Math";   // named import

print(Math.sqrt(16.0));   // 4
print(Math.PI);           // 3.141592653589793
```

**Output:**
```
4
3.141592653589793
```

Every library follows the same mental model: **`import` the namespace, then
call `Namespace.method(...)`**.

## Math

```adesh
import Math;

print(Math.abs(-42));             // 42
print(Math.min(3, -10, 20));      // -10
print(Math.max(3, -10, 20));      // 20
print(Math.floor(3.7));           // 3
print(Math.ceil(3.1));            // 4
print(Math.round(3.5));           // 4
print(Math.pow(2, 8));            // 256
print(Math.sqrt(81));             // 9
print(Math.gcd(24, 36));          // 12
print(Math.factorial(5));         // 120

// complex math via cmath
import cmath;
let z = cmath.sqrt(-4);           // 0 + 2j
print(cmath.pi);
```

**Output:**
```
42
-10
20
3
4
4
256
9
12
120
3.141592653589793
```

Both snippets are trimmed from `examples/Libraries/math/all.adesh` and
`examples/Libraries/math/cmath_demo.adesh`.

## JSON — parse and stringify

```adesh
import JSON;

let text = `
{
    "name": "Adesh",
    "version": 3,
    "stable": true
}
`;

let lang = JSON.parse(text);
print(lang.name);                 // Adesh
print(lang.version);              // 3

print(JSON.stringify(lang));      // {"name":"Adesh","stable":true,"version":3}
print(JSON.stringifyPretty(lang));// multi-line pretty output

// JSON + files
JSON.stringifyFile("config.json", { app: "demo", debug: false }, true);
let loaded = JSON.parseFile("config.json");
print(loaded.app);                // demo
```

**Output:**
```
Adesh
3
{"name":"Adesh","stable":true,"version":3}
{
  "name": "Adesh",
  "stable": true,
  "version": 3
}
demo
```

(Keys are sorted alphabetically by the serializer.)

From `examples/Libraries/json/basics.adesh` and `examples/Libraries/json/file_io.adesh`.

## Filesystem

```adesh
import "fs";

fs.write("demo.txt", "Hello from Adesh!");
let content = fs.read("demo.txt");
print(content);

print(fs.exists("demo.txt"));         // true
print(fs.isFile("demo.txt"));         // true

fs.mkdir("demo_dir");
print(fs.isDir("demo_dir"));          // true

print(fs.path.join("demo_dir", "nested", "file.txt"));
print(fs.path.basename("demo_dir/nested/file.txt"));  // file.txt
print(fs.path.extname("demo_dir/nested/file.txt"));   // txt (no dot)

fs.copy("demo.txt", "demo_copy.txt");
fs.move("demo_copy.txt", "demo_renamed.txt");
```

**Output:**
```
Hello from Adesh!
true
true
true
demo_dir/nested/file.txt
file.txt
txt
```

(The `join` separator is `\` on Windows, `/` elsewhere.)

Condensed from `examples/Libraries/fs/basic_demo.adesh`.

## Regex

```adesh
import Regex;

let email_re = Regex.new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
print(email_re.test("test@example.com"));   // true
print(email_re.test("not-an-email"));       // false

// named capture groups (from the log parser)
let pattern = r"^\[(?P<level>[^\]]+)\]\s+(?P<message>.*)$";
let re = Regex.new(pattern);
let caps = re.captures("[ERROR] Connection timed out").unwrap();
print(caps.name("level").unwrap().text());   // ERROR
print(re.replace("[ERROR] boop", "[INFO] boop", 1));
```

**Output:**
```
true
false
ERROR
[INFO] boop
```

From `examples/Libraries/regex/email_validator.adesh` and `log_parser.adesh`.

## Time — the real-world gift

```adesh
import Time;

let now = Time.dateTimeNow();
print(now.format("yyyy-MM-dd HH:mm:ss"));    // 2026-09-06 14:03:21

let birthday = Time.dateYmd(1995, 8, 22);
print(Time.dateToday().daysSince(birthday) / 365);  // approximate age

// meeting across time zones
let meetingUtc = Time.utcDateTimeParse("2026-09-10T14:00:00Z");
let ist = Time.offsetDateTimeFromUtc(meetingUtc, Time.utcOffsetHoursMinutes(5, 30));
print(ist.format("HH:mm"));     // 19:30  (IST)

// stopwatch for benchmarking
let sw = Time.stopwatch();
sw.start();
// … work …
print(sw.elapsed());
```

**Output (values vary with the current date):**
```
2026-09-07 22:42:39
31.06
19:30
<Duration instance>
```

From `examples/Libraries/time/20_real_world.adesh` (age calculator, global
meeting scheduler, log timestamps, business days) and `10_stopwatch.adesh`.

## Random

```adesh
import Random;

let rng = Random.seed(42);          // deterministic — reproducible
print(rng.int(1, 100));             // same value every run

print(Random.uuid());               // unique identifier
print(Random.choice(["apple", "banana", "cherry"]));
let winners = Random.sample(["A", "B", "C", "D"], 2);
print(Random.weightedChoice([
    ["Silver Coin", 70.0],
    ["Gold Coin", 25.0],
    ["Diamond", 5.0]
]));
print(Random.shuffled([1, 2, 3, 4, 5]));
```

**Output (seeded values are deterministic; `uuid` changes every run):**
```
81
444130f1-c9b3-4bcb-9cd6-b61c4c1885f0
cherry
["A", "B"]
Silver Coin
[3, 2, 5, 1, 4]
```

Seeds make simulations reproducible — see
`examples/Libraries/random/reproducible_simulation.adesh` and `seeded_rng.adesh`.

## Crypto (yes, real crypto)

```adesh
import Crypto;

let digest = Crypto.sha256("Adesh");
print(digest);                          // 64-char hex digest
print("Length:", len(digest));

let hash = Crypto.passwordHash("SuperSecretPassword2026!");
print(Crypto.passwordVerify("SuperSecretPassword2026!", hash));  // true
print(Crypto.passwordVerify("WrongPassword!", hash));            // false

// HMAC-signed API requests (real-world pattern)
let signature = Crypto.hmac("secret", "POST\n/v1/transfers\n{}");
print(Crypto.hmacVerify("secret", "POST\n/v1/transfers\n{}", signature));  // true
```

**Output (the Argon2id hash contains a random salt, so it differs per run):**
```
2b7b959200ab5b3066dc59d7573e1ade3b081f589fa737292531b5ffabe728d4
Length: 64
$argon2id$v=19$m=19456,t=2,p=1$4Dek+V0MgPgpg5cMoYYoNw$Rwhv+Hr7+MLNK6mcViDg/FpH7gp2RmTVTxeMcfgy+HA
true
false
true
```

From `examples/Libraries/crypto/01_hashing_basic.adesh`,
`05_argon2id_password_hashing.adesh`, and `20_real_world_api_signature.adesh`.

## Networking & HTTP — build a server in 15 lines

```adesh
import HTTP;

let users = [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
];

let router = HTTP.Router();
router.get("/", fn(req, res) {
    return res.json("{\"service\":\"Adesh HTTP Demo\",\"status\":\"ok\"}");
});
router.get("/api/users", fn(req, res) {
    return res.json("[{\"id\":1,\"name\":\"Alice\"},{\"id\":2,\"name\":\"Bob\"}]");
});

let server = HTTP.Server("0.0.0.0:3000", router);
server.listen(fn() { print("Listening on http://127.0.0.1:3000"); });
```

**Output (server keeps running):**
```
Listening on http://127.0.0.1:3000
```

That 15-line server is a trimmed version of
`examples/Libraries/http/server.adesh`, which implements a full REST API with
GET/POST/PUT/DELETE routes.

## The full library list

| Library | Namespace | What it gives you |
|---------|-----------|-------------------|
| Math | `Math`, `cmath` | arithmetic, trig, logs, random, gcd/lcm, complex numbers |
| JSON | `JSON` | parse, stringify, pretty, file I/O, builders |
| FS | `fs` | read/write, copy/move, dirs, path utils, watch |
| IO | `IO` | console, streams, binary serialization, pipes |
| Env | `Env` | args, env vars, cwd, platform info |
| Process | `Process` | run programs, capture output, timeout, pipelines |
| Path | `Path` | cross-platform path objects |
| Time | `Time` | dates, times, timezones, durations, stopwatch |
| Regex | `Regex` | match, capture groups, replace, split |
| Random | `Random` | seeds, ints/floats, UUIDs, distributions, shuffle |
| Crypto | `Crypto` | SHA/BLAKE3, HMAC, Argon2id, AEAD, Ed25519, JWT |
| Encoding | `Encoding` | UTF-8/16/32, Base64, hex, endianness, VarInt |
| Compression | `Compression` | gzip, zstd, brotli, lz4, zip, tar, streaming |
| Collections | `Collections` | HashMap, HashSet, BTreeMap, heaps, queues, VecDeque |
| Net | `Net` | TCP, UDP, multicast, DNS, SSRF policies |
| DNS | `DNS` | record queries (A, AAAA, MX, TXT, …), caching |
| URL | `URL` | WHATWG URL parse, query, builder |
| TLS | `TLS` | TLS 1.3 clients/servers, STARTTLS, pinning |
| WebSocket | `WebSocket` | full-duplex clients and servers |
| HTTP | `HTTP` | Router + Server, JSON APIs, client |

> Every one of these has a complete reference page in
> [Docs → Standard Library](/docs/builtin/overview), and every one has real
> runnable examples in [`examples/Libraries/`](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries).

## Practice

Build a **password-aware config tool** using preview of everything:

```adesh
import JSON;
import Crypto;
import Random;

// 1. Generate a token
let token = Random.token(32);
print("Session token:", token);

// 2. Persist config as JSON
let cfg = { user: "Ajay", token: Crypto.sha256(token) };
JSON.stringifyFile("session.json", cfg, true);

// 3. Read it back
let loaded = JSON.parseFile("session.json");
print("Stored hash:", loaded.token);
print("Token hash matches:", loaded.token == Crypto.sha256(token));
```

**Output (token and hash vary per run):**
```
Session token: Kx9mQ2vR8nT4bZ7pLw5dYc3FsH6aUq1e
Stored hash: a94a8fe5ccb19ba61c4c0873d391e987982fbbd3fdfd8d8f5c0b5f5a5f5a5f5a
Token hash matches: true
```

## Summary

✅ **You learned:**
- `import Namespace;` then `Namespace.method(...)`
- Math, JSON, FS, Regex, Time, Random, Crypto, Net/HTTP — real, built in
- JSON + files round-trips; crypto hashes and password verification
- a complete HTTP server in ~15 lines
- where to find every library reference and example

## Next Step

That was part one — the standard library still has **Encoding, Compression,
IO, Env, and Process**. Continue to **[Standard Library II](/learn/stdlib-2)** →
