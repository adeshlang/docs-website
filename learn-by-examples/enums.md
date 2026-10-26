---
id: enums
title: Enums & Pattern Matching
sidebar_label: Enums & Pattern Matching
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Enums & Pattern Matching

<FeatureStatus status="STABLE" details="Algebraic enum data types, payload variants, and structural pattern matching expressions" />

Adesh enums are algebraic data types that can represent simple discrete options or carry associated payload data per variant. Pattern matching (`match`) safely destructures enum values at compile time.

---

## 1. Algebraic Enums & Structural Pattern Matching

Variants within an `enum` can be unit variants (no payload) or tuple-like payload variants containing data values.

### Code Example

```adesh
// Enum definition with payload variants
enum ConnectionState {
    Disconnected,
    Connecting(string),
    Connected(string, i32), // host, port
    Failed(i32, string)     // error_code, reason
}

fn describeState(state) {
    match state {
        ConnectionState.Disconnected => {
            print("State: Disconnected");
        },
        ConnectionState.Connecting(url) => {
            print("State: Connecting to URL:", url);
        },
        ConnectionState.Connected(host, port) => {
            print("State: Connected to", host, "on port", port);
        },
        ConnectionState.Failed(code, msg) => {
            print("State: Connection failed [", code, "]:", msg);
        }
    }
}

let s1 = ConnectionState.Connecting("https://api.adeshlang.org");
let s2 = ConnectionState.Connected("192.168.1.100", 443);
let s3 = ConnectionState.Failed(404, "Server Endpoint Not Found");

describeState(s1);
describeState(s2);
describeState(s3);
```

### Terminal Output

```text
State: Connecting to URL: https://api.adeshlang.org
State: Connected to 192.168.1.100 on port 443
State: Connection failed [ 404 ]: Server Endpoint Not Found
```

### Breakdown

* **`enum Name { Variant1, Variant2(Type) }`**: Defines algebraic type variants.
* **`match target { Variant(bindings) => body }`**: Structural pattern matching that automatically binds variables to payload arguments.
