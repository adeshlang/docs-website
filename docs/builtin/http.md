---
id: http
title: HTTP Standard Library Module
sidebar_label: HTTP
slug: /builtin/http
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# `HTTP` Module Reference

<FeatureStatus status="STABLE" details="HTTP/1.1, HTTP/2, HTTP/3 REST client and server suite" />

The `HTTP` standard library module provides high-level APIs for making web requests (GET, POST, PUT, DELETE, PATCH, HEAD), configuring custom headers, handling JSON payloads, and hosting high-concurrency web servers.

---

## 1. Importing the Module

```adesh
import HTTP;
```

---

## 2. HTTP Client Functions

### `HTTP.get(url)`
Sends an HTTP GET request to the specified URL.

**Parameters**:
- `url`: `String` — Absolute HTTP or HTTPS target address.

**Returns**:
- `HTTP.Response` object containing status code, headers, and text body helper.

```adesh
let res = HTTP.get("https://httpbin.org/get");
print("Status:", res.status);        // 200
print("OK:", res.ok);                // true
print("Body Preview:", res.text());  // JSON or HTML string
```

---

### `HTTP.post(url, body)`
Sends an HTTP POST request with a text or JSON string body.

```adesh
let payload = "{\"name\":\"AdeshLang\",\"version\":\"0.3\"}";
let res = HTTP.post("https://httpbin.org/post", payload);
print("Status:", res.status, "| Status Text:", res.statusText);
```

---

### `HTTP.put(url, body)`
Sends an HTTP PUT request.

```adesh
let res = HTTP.put("https://httpbin.org/put", "{\"id\":42,\"status\":\"active\"}");
print("Status:", res.status);
```

---

### `HTTP.patch(url, body)`
Sends an HTTP PATCH request.

```adesh
let res = HTTP.patch("https://httpbin.org/patch", "{\"field\":\"email\",\"value\":\"dev@example.com\"}");
print("Status:", res.status);
```

---

### `HTTP.delete(url)`
Sends an HTTP DELETE request.

```adesh
let res = HTTP.delete("https://httpbin.org/delete");
print("Status:", res.status);
```

---

### `HTTP.head(url)`
Sends an HTTP HEAD request to retrieve response headers without a body payload.

```adesh
let res = HTTP.head("https://httpbin.org/get");
print("Status:", res.status);
print("Headers:", res.headers);
```

---

## 3. Persistent Client Instance (`HTTP.Client`)

For applications making multiple requests to shared endpoints, configure a persistent client instance:

```adesh
let client = HTTP.Client();
let res1 = client.get("https://httpbin.org/uuid");
print("UUID 1:", res1.text());

let res2 = client.get("https://httpbin.org/uuid");
print("UUID 2:", res2.text());
```

---

## 4. Status Code Utilities

The module provides helper methods for status code classification:

```adesh
print(HTTP.Status.isSuccess(200));     // true
print(HTTP.Status.isClientError(404)); // true
print(HTTP.Status.isServerError(500)); // true
print(HTTP.Method.isSafe("GET"));      // true
```

---

## 5. HTTP Server Example

To build a high-performance web server:

```adesh
let server = HTTP.server({ port: 8080, host: "127.0.0.1" });

server.listen(fn(req) {
  if (req.path == "/api/health") {
    return HTTP.response(200, "{\"status\":\"ok\"}", { "Content-Type": "application/json" });
  }
  return HTTP.response(404, "Not Found");
});

print("Server running on http://127.0.0.1:8080");
```

---

## 6. Project Examples

- [examples/Libraries/http/client.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/http/client.adesh)
- [examples/Libraries/http/server.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/http/server.adesh)
- [examples/Libraries/http/master_http_showcase.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/http/master_http_showcase.adesh)
