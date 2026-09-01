---
id: url
title: URL Library
sidebar_label: URL
---

# URL Library

The **URL** builtin library provides zero-allocation URL parsing, protocol/hostname/port extraction, normalization, WHATWG URL standard compliance, and query parameter search manipulation via `URLSearchParams`.

It allows AdeshLang applications to inspect and construct URLs safely without regular expression hacking or unsafe string splitting.

## Namespace

| Name | What it provides |
| :--- | :--- |
| `URL` | The primary URL namespace for parsing and constructing URL objects and search parameters |

## Importing the library

```adesh
import URL;              // or import "std:URL" as URL;
```

---

## URL Parsing (`URL.parse`)

Parses a full URL string into a structured component object.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `URL.parse(urlString)` | Parse URL string into component properties | `urlString: string` | `URL` |

### `URL` Object Properties

- `url.href`: Full normalized URL string.
- `url.protocol`: URL scheme prefix including trailing colon (e.g. `"https:"`).
- `url.username`: Extracted authentication username string.
- `url.password`: Extracted authentication password string.
- `url.hostname`: Host domain name or IP string (e.g. `"example.com"`).
- `url.port`: Explicit port string or empty string if default port.
- `url.host`: Combined `hostname:port` string.
- `url.pathname`: Resource path string starting with `/` (e.g. `"/api/v1/users"`).
- `url.search`: Query string including leading `?` (e.g. `"?sort=desc&page=1"`).
- `url.hash`: Anchor fragment string including leading `#` (e.g. `"#overview"`).
- `url.origin`: Protocol and host origin string (e.g. `"https://example.com:8080"`).
- `url.searchParams`: `URLSearchParams` object for inspecting and setting query key-values.

```adesh
import URL;

let u = URL.parse("https://user:secret@api.example.com:8080/v1/products?category=tech&page=2#top");

print("Protocol:", u.protocol); // "https:"
print("Host:", u.host);         // "api.example.com:8080"
print("Hostname:", u.hostname); // "api.example.com"
print("Port:", u.port);         // "8080"
print("Path:", u.pathname);     // "/v1/products"
print("Query:", u.search);      // "?category=tech&page=2"
print("Fragment:", u.hash);     // "#top"
print("Origin:", u.origin);     // "https://api.example.com:8080"
```

---

## Query Parameters (`URLSearchParams`)

`URLSearchParams` provides methods to read, insert, update, and delete query parameters.

| Method | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `searchParams.get(key)` | Fetch parameter value string by key | `key: string` | `String` |
| `searchParams.has(key)` | Check if parameter key exists | `key: string` | `bool` |
| `searchParams.set(key, val)` | Set or replace query parameter key value | `key: string`, `val: string` | `void` |
| `searchParams.append(key, val)`| Append query parameter key value | `key: string`, `val: string` | `void` |
| `searchParams.delete(key)` | Delete parameter key and all associated values | `key: string` | `void` |
| `searchParams.toString()` | Format search parameters into query string (e.g. `"key=val&a=b"`) | — | `String` |

```adesh
import URL;

let u = URL.parse("https://example.com/search?q=adeshlang&lang=en");

// Read parameters
print("Query parameter 'q':", u.searchParams.get("q"));

// Mutate parameters
u.searchParams.set("page", "1");
u.searchParams.append("filter", "active");

print("Updated URL:", u.toString());
// "https://example.com/search?q=adeshlang&lang=en&page=1&filter=active"
```
