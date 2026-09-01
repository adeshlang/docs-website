---
id: json
title: JSON Serialization & Parsing (stdlib/json)
sidebar_label: JSON
description: High-speed JSON serialization, deserialization, querying, and streaming in AdeshLang.
---

# JSON Serialization & Parsing (`stdlib/json`)

The `json` module provides ultra-fast JSON parsing and serialization routines with direct AST mapping, typed decoding, and zero-allocation string views.

:::info
A comprehensive reference with the full builtin API table is also available in the [**Builtin Libraries → JSON**](../builtin/json) section.
:::

```adesh
import { parse, stringify, JsonValue } from "stdlib/json";
```

---

## 1. Parsing JSON Strings

Parse standard JSON text into dynamic `JsonValue` structures:

```adesh
import { json } from "stdlib/json";

fn main() -> Result<(), Error> {
    let json_text = "{\"name\": \"Alice\", \"age\": 30, \"skills\": [\"Adesh\", \"Rust\"]}";
    
    let doc = json::parse(json_text)?;

    let name = doc.get("name")?.as_string()?;
    let age = doc.get("age")?.as_int()?;
    let skills = doc.get("skills")?.as_array()?;

    print(f"Name: {name}, Age: {age}");
    for skill in skills {
        print(f"- {skill.as_string()?}");
    }

    return Ok(());
}
```

---

## 2. Serializing Objects to JSON

Convert AdeshLang values and dictionaries into compact or pretty-printed JSON:

```adesh
import { json } from "stdlib/json";

fn main() {
    let user_data = {
        "id": 101,
        "username": "coder42",
        "verified": true,
        "tags": ["developer", "systems"]
    };

    // Compact single-line string
    let compact_json = json::stringify(user_data);
    print(compact_json);

    // Pretty-printed formatted string (indent = 2 spaces)
    let formatted_json = json::pretty(user_data, indent = 2);
    print(formatted_json);
}
```

---

## 3. Strongly-Typed Struct Serialization (`#[derive(Serialize, Deserialize)]`)

AdeshLang can derive compile-time type-safe JSON serialization:

```adesh
#[derive(Serialize, Deserialize)]
struct ServerConfig {
    host: string,
    port: u16,
    workers: usize,
    enable_tls: bool,
}

fn main() -> Result<(), Error> {
    let config = ServerConfig {
        host: "127.0.0.1",
        port: 8080,
        workers: 8,
        enable_tls: true,
    };

    // Direct struct to JSON serialization
    let json_str = json::encode(&config)?;
    print(json_str);

    // Direct JSON to struct deserialization
    let decoded: ServerConfig = json::decode(json_str)?;
    print(f"Loaded config for host: {decoded.host}:{decoded.port}");

    return Ok(());
}
```
