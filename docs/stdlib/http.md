---
id: http
title: HTTP Standard Module (stdlib/http)
sidebar_label: HTTP
description: Comprehensive HTTP client and server API reference for AdeshLang.
---

# HTTP Standard Module (`stdlib/http`)

The `http` module provides high-throughput HTTP/1.1 and HTTP/2 client and server capabilities with connection pooling, streaming request/response bodies, header manipulation, and SSL/TLS support.

```adesh
import { get, post, Client, Server } from "stdlib/http";
```

---

## 1. HTTP Client Requests

### Simple GET Request
```adesh
import { http } from "stdlib/http";

async fn main() -> Result<(), Error> {
    let response = await http::get("https://httpbin.org/get");
    print(f"Status Code: {response.status}");
    print(f"Response Body: {await response.text()}");
    return Ok(());
}
```

### POST Request with JSON Body and Custom Headers
```adesh
import { http } from "stdlib/http";
import { json } from "stdlib/json";

async fn create_user() -> Result<(), Error> {
    let payload = json::stringify({
        "username": "adesh_coder",
        "role": "engineer"
    });

    let client = http::Client::new();
    let response = await client.post("https://api.example.com/users")
        .header("Content-Type", "application/json")
        .header("Authorization", "Bearer my_secret_token")
        .body(payload)
        .send();

    if response.status == 201 {
        print("User created successfully!");
    }
    return Ok(());
}
```

---

## 2. HTTP Web Server

Build fast, lightweight HTTP microservices:

```adesh
import { http } from "stdlib/http";
import { json } from "stdlib/json";

async fn main() -> Result<(), Error> {
    let server = http::Server::bind("0.0.0.0:3000")?;
    print("HTTP server running at http://0.0.0.0:3000");

    await server.listen(async fn(req: http::Request) -> http::Response {
        match (req.method, req.path) {
            ("GET", "/") => {
                return http::Response::ok().text("Welcome to AdeshLang HTTP Server!");
            }
            ("GET", "/health") => {
                return http::Response::ok().json({ "status": "healthy", "uptime_ms": 120000 });
            }
            ("POST", "/api/echo") => {
                let body = await req.text();
                return http::Response::ok().text(body);
            }
            _ => {
                return http::Response::status(404).text("404 Not Found");
            }
        }
    });

    return Ok(());
}
```

---

## 3. API Reference

| Function / Method | Signature | Description |
|-------------------|-----------|-------------|
| `http::get(url)` | `async fn get(url: string) -> Result<Response, Error>` | Performs a simple HTTP GET request. |
| `http::post(url, body)` | `async fn post(url: string, body: [u8]) -> Result<Response, Error>` | Performs a simple HTTP POST request. |
| `Client::new()` | `fn new() -> Client` | Creates a reusable HTTP client with connection pooling. |
| `Response::status` | `status: u16` | HTTP status code (e.g. 200, 404, 500). |
| `Response::text()` | `async fn text(&self) -> Result<string, Error>` | Consumes response body as a UTF-8 string. |
| `Response::json()` | `async fn json(&self) -> Result<JsonValue, Error>` | Parses response body as JSON. |
| `Response::bytes()`| `async fn bytes(&self) -> Result<[u8], Error>` | Consumes response body as raw bytes. |
