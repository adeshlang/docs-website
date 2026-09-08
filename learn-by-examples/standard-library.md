---
id: standard-library
title: Standard Library Ecosystem
sidebar_label: Standard Library
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Standard Library Ecosystem

<FeatureStatus status="STABLE" details="Native Rust standard library modules: Math, Crypto, JSON, and File System (FS)" />

AdeshLang includes built-in standard libraries written natively in Rust for performance, covering mathematics (`Math`), cryptography (`Crypto`), serialization (`JSON`), file operations (`FS`), and HTTP networking.

---

## 1. Math Library (`import Math;`)

High-speed trigonometry, logarithmic functions, roots, and constants.

### Code Example

```adesh
import Math;

let radius = 5.0;
let area = Math.PI * Math.pow(radius, 2.0);
let hypotenuse = Math.sqrt(Math.pow(3.0, 2.0) + Math.pow(4.0, 2.0));

print("Circle area (r=5.0):", area);
print("Hypotenuse (3, 4):", hypotenuse);
print("Sin(PI / 2):", Math.sin(Math.PI / 2.0));
```

### Terminal Output

```text
Circle area (r=5.0): 78.53981633974483
Hypotenuse (3, 4): 5
Sin(PI / 2): 1
```

### Breakdown

* **`Math.PI`**: High-precision constant $\pi$.
* **`Math.pow(base, exp)` / `Math.sqrt(val)`**: Trigonometric and mathematical primitive methods.

---

## 2. Cryptographic Hashing (`import Crypto;`)

Native Rust implementations of SHA-256, SHA-3, BLAKE3, AES-GCM, and key pair generation.

### Code Example

```adesh
import Crypto;

let payload = "AdeshLang Standard Library 2026";

// SHA-256 Hash
let sha256Digest = Crypto.sha256(payload);
print("SHA-256 Digest:", sha256Digest);

// BLAKE3 Hash
let blake3Digest = Crypto.blake3(payload);
print("BLAKE3 Digest:", blake3Digest);
```

### Terminal Output

```text
SHA-256 Digest: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
BLAKE3 Digest: af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262
```

### Breakdown

* **`Crypto.sha256(data)`**: Computes the 256-bit hash of string inputs.
* **`Crypto.blake3(data)`**: High-throughput cryptographic hash function.

---

## 3. JSON Serialization & Parsing (`import JSON;`)

Fast JSON parsing and stringification natively integrated into runtime objects.

### Code Example

```adesh
import JSON;

let userObj = {
    id: 1001,
    username: "adesh_developer",
    roles: ["admin", "developer"],
    active: true
};

// Stringify object to JSON string
let jsonString = JSON.stringify(userObj);
print("Serialized JSON:", jsonString);

// Parse JSON string back into object
let parsedObj = JSON.parse(jsonString);
print("Parsed User ID:", parsedObj.id);
print("Parsed First Role:", parsedObj.roles[0]);
```

### Terminal Output

```text
Serialized JSON: {"active":true,"id":1001,"roles":["admin","developer"],"username":"adesh_developer"}
Parsed User ID: 1001
Parsed First Role: admin
```

### Breakdown

* **`JSON.stringify(obj)`**: Converts native maps/structs/objects into JSON string representation.
* **`JSON.parse(str)`**: Decodes JSON strings back into dynamic AdeshLang value structures.
