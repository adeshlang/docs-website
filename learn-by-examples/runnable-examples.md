---
id: runnable-examples
title: Runnable Code Examples Catalog
sidebar_label: Runnable Examples
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Adesh Runnable Code Examples Catalog

<FeatureStatus status="STABLE" details="100+ verified runnable examples across all language features & standard libraries" />

The Adesh repository contains an extensive suite of verified runnable examples in the [`examples/`](https://github.com/adeshlang/adeshlang/tree/main/examples) directory.

---

## How to Execute Examples

Run any example directly using the `adesh` CLI tool:

```bash
# Execute using default interpreter
adesh run examples/Libraries/http/client.adesh

# Execute using Native Cranelift JIT
adesh run --jit-native examples/Libraries/math/all.adesh

# Execute using WebAssembly
adesh run --wasm examples/01_Basics/main.adesh

# Execute embedded unit tests
adesh run --test examples/01_Basics/test.adesh
```

---

## 1. Fundamentals & Syntax Basics

| Category | Example Command | Concepts Covered |
|---|---|---|
| **Basics** | `adesh run examples/01_Basics/variable.adesh` | Variable declaration, scope, types |
| **Strings** | `adesh run examples/01_Basics/string.adesh` | Interpolation, concatenation, methods |
| **Conditionals** | `adesh run examples/conditionals/elif.adesh` | `if`, `elif`, `else` branch evaluation |
| **Loops** | `adesh run examples/loops/for_loop.adesh` | `for`, `while`, `do-while` iteration |
| **Functions** | `adesh run examples/functions/01_basic_functions.adesh` | Parameters, return values, recursion |
| **Closures** | `adesh run examples/functions/02_higher_order.adesh` | Anonymous functions, higher-order maps |

---

## 2. Standard Libraries Catalog (`examples/Libraries/`)

| Standard Library | Main Example File | Key APIs Demonstrated |
|---|---|---|
| **Collections** | `adesh run examples/Libraries/collections/hashmap_examples.adesh` | `HashMap`, `HashSet`, `BTreeMap`, `VecDeque`, `PriorityQueue` |
| **Compression** | `adesh run examples/Libraries/compression/gzip.adesh` | Gzip compression and decompression buffers |
| **Concurrency** | `adesh run examples/Libraries/concurrency/threads.adesh` | Thread spawning, mutexes, channels, message passing |
| **Parallel** | `adesh run examples/Libraries/concurrency/parallel_ops.adesh` | Work-stealing `Parallel.map`, `Parallel.reduce`, `Parallel.sum`, `Parallel.sort` |
| **Crypto** | `adesh run examples/Libraries/crypto/sha256.adesh` | SHA-256, AES-256-GCM, HMAC, RSA key pairs |
| **DNS** | `adesh run examples/Libraries/dns/resolve.adesh` | Async domain name resolution (`A`, `AAAA`, `MX`) |
| **Encoding** | `adesh run examples/Libraries/encoding/base64.adesh` | Base64 and Hex encoding/decoding |
| **Environment** | `adesh run examples/Libraries/env/args.adesh` | Reading process args (`env.args()`) and env vars |
| **File System** | `adesh run examples/Libraries/fs/read_write.adesh` | File reading, writing, path verification |
| **HTTP** | `adesh run examples/Libraries/http/client.adesh` | REST client (`HTTP.get`, `HTTP.post`, `HTTP.Client`) |
| **HTTP Server** | `adesh run examples/Libraries/http/server.adesh` | High-concurrency HTTP request server |
| **JSON** | `adesh run examples/Libraries/json/parse.adesh` | JSON parsing, serialization (`json.parse`, `json.stringify`) |
| **Math** | `adesh run examples/Libraries/math/all.adesh` | Trigonometry, exponentiation, random seeds |
| **Networking** | `adesh run examples/Libraries/net/tcp_connect.adesh` | Raw TCP socket connections and UDP datagrams |
| **Regex** | `adesh run examples/Libraries/regex/match.adesh` | Pattern matching, search, text replacement |
| **Time** | `adesh run examples/Libraries/time/now.adesh` | Epoch timestamps, formatting, sleep timers |
| **TLS / SSL** | `adesh run examples/Libraries/tls/tls_connect.adesh` | Secure TLS socket encryption wrapper |
| **WebSockets** | `adesh run examples/Libraries/websocket/01_basic_client.adesh` | Full-duplex WebSocket client and echo server |

---

## 3. Data Structures & Algorithms (DSA)

| Algorithm | Example File | Description |
|---|---|---|
| **Two Sum** | `examples/DSA/two_sum.adesh` | $O(N)$ hash-map lookups for pair summation |
| **BFS / DFS** | `examples/Libraries/collections/graph_traversal.adesh` | Breadth-First and Depth-First graph traversals |
| **LRU Cache** | `examples/Libraries/collections/lru_cache_example.adesh` | Least Recently Used cache implementation |

---

## Related Documentation

- [Learn by Examples Catalog](/learn-by-examples) — complete programs with terminal output and breakdowns
- [Getting Started Guide](/learn/getting-started/quick-start) — install and run your first program
- [Learn Programming Roadmaps](/learn) — the beginner path
- [Standard Library Overview](/docs/builtin/overview) — builtin libraries reference
