---
id: websocket
title: WebSocket Standard Library Module
sidebar_label: WebSocket
slug: /builtin/websocket
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# `WebSocket` Module Reference

<FeatureStatus status="STABLE" details="Full-duplex WebSocket client, server, framing, and TLS WSS support" />

The `WebSocket` standard library module enables full-duplex communication over single TCP connections for real-time applications, chat protocols, financial telemetry, and live status feeds. It implements RFC 6455 framing, the HTTP Upgrade handshake, and optional TLS (`wss://`) via the TLS layer.

```
┌──────────────────────────────────────────────────────────────┐
│                    WebSocket Module                         │
├──────────────────────────────────────────────────────────────┤
│  Client          → WebSocket.connect(url, config) → Client  │
│  Server          → WebSocket.server(opts) → Server          │
│  Handshake       → HTTP Upgrade + Sec-WebSocket-Key/Accept  │
│  Framing         → text / binary / ping / pong / close      │
│  TLS             → wss:// via TLS module integration         │
└──────────────────────────────────────────────────────────────┘
```

---

## 1. Importing the Module

```adesh
import WebSocket;
import { WebSocket } from "std:WebSocket";
```

All WebSocket handles are RAII — dropping a client/server closes the underlying TCP socket deterministically.

---

## 2. Architecture — Handshake & Framing

### Handshake Flow (RFC 6455)

```
Client                          Server
  │  GET /chat HTTP/1.1           │
  │  Upgrade: websocket           │
  │  Connection: Upgrade          │
  │  Sec-WebSocket-Key: dGhlIHNh..│
  │  Sec-WebSocket-Version: 13    │
  ├──────────────────────────────►│
  │                               │  validate key
  │                               │  compute Accept = base64(sha1(key + GUID))
  │  HTTP/1.1 101 Switching       │
  │  Upgrade: websocket           │
  │  Connection: Upgrade          │
  │  Sec-WebSocket-Accept: s3pPL..│
  │◄──────────────────────────────┤
  │                               │
  │  ◄══════ WebSocket frames ══════►  (full-duplex)
```

The client generates a random 16-byte `Sec-WebSocket-Key` (base64); the server replies with `Sec-WebSocket-Accept = base64(SHA1(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))`.

### Frame Format

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length  |
|I|S|S|S|  (4)  |A|   (7)       |           (16/64)           |
|N|V|V|V|       |S|             | (if payload len==126/127)   |
| |1|2|3|       |K|             |                             |
+-+-+-+-+-------+-+-------------+-------------------------------+
|                    Masking-key (if MASK set)                |
+-------------------------------+-------------------------------+
|                     Payload Data (masked if client→server)  |
+-------------------------------------------------------------+
```

| Field | Width | Meaning |
|---|---|---|
| FIN | 1 bit | `1` = final fragment, `0` = more fragments follow |
| RSV1-3 | 3 bits | reserved (extensions); must be `0` if no extension |
| Opcode | 4 bits | `0x0` cont, `0x1` text, `0x2` binary, `0x8` close, `0x9` ping, `0xA` pong |
| MASK | 1 bit | `1` = payload masked (client→server must mask) |
| Payload len | 7/23/71 bits | `0-125` inline, `126` → next 16 bits, `127` → next 64 bits |
| Masking key | 0/32 bits | present iff MASK=1 |
| Payload | variable | masked with `payload[i] ^= mask[i%4]` if masked |

---

## 3. Basic Client Connection

Connecting to a remote WebSocket server:

```adesh
let config = WebSocket.ClientConfig({
    connect_timeout: 5000,   // ms to establish TCP + handshake
    idle_timeout: 30000,     // ms before idle close
    max_message_size: 1_000_000, // bytes
    headers: { "Authorization": "Bearer token123" }
});

let client = WebSocket.connect("ws://127.0.0.1:8099", config);

if (WebSocket.isError(client)) {
    print("Connection failed:", client.message);
} else {
    print("Connected! State:", client.getState().toString());

    // Send text frame
    client.sendText("Hello from AdeshLang!");

    // Send binary frame
    client.sendBinary([0x01, 0x02, 0x03]);

    // Receive message (blocks until frame arrives or timeout)
    let msg = client.receive();
    if (msg.type == "text") {
        print("Received payload:", msg.payload);
    } else if (msg.type == "binary") {
        print("Binary bytes:", msg.payload.len());
    } else if (msg.type == "close") {
        print("Server closed:", msg.code, msg.reason);
    }

    // Clean close handshake (code 1000 = normal closure)
    client.close(1000, "Client shutdown");
}
```

### Client API

| Method / Function | Signature | Description |
|---|---|---|
| `WebSocket.connect(url, config?)` | `fn connect(url: string, config?: ClientConfig): Client \| Error` | Connect to `ws://` or `wss://` URL; performs TCP connect + handshake. |
| `WebSocket.isError(val)` | `fn isError(val: any): bool` | Check if connect returned an error. |
| `client.getState()` | `fn getState(): State` | `Connecting`, `Open`, `Closing`, `Closed`. |
| `client.sendText(text)` | `fn sendText(text: string): Result<void, WSError>` | Send UTF-8 text frame (FIN=1). |
| `client.sendBinary(bytes)` | `fn sendBinary(bytes: u8[]): Result<void, WSError>` | Send binary frame. |
| `client.sendPing(data?)` | `fn sendPing(data?: u8[]): Result<void, WSError>` | Send ping control frame (keepalive). |
| `client.sendPong(data)` | `fn sendPong(data: u8[]): Result<void, WSError>` | Respond to ping. |
| `client.receive()` | `fn receive(): Message` | Block until next message frame arrives. |
| `client.receiveTimeout(ms)` | `fn receiveTimeout(ms: u64): Message \| null` | Receive with timeout; `null` on timeout. |
| `client.close(code?, reason?)` | `fn close(code?: u16, reason?: string)` | Send close frame and await peer close. |
| `client.isConnected()` | `fn isConnected(): bool` | `true` if state is `Open`. |

### ClientConfig

| Field | Type | Default | Description |
|---|---|---|---|
| `connect_timeout` | `u64` (ms) | `5000` | TCP + handshake deadline. |
| `idle_timeout` | `u64` (ms) | `30000` | Close if no frames for this long. |
| `max_message_size` | `usize` | `1_000_000` | Maximum reassembled message bytes. |
| `headers` | `Map<string,string>` | `{}` | Extra HTTP headers for handshake (auth, etc.). |
| `tls_config` | `TLS.Config` | — | TLS options for `wss://` (cert verification, ALPN). |

---

## 4. WebSocket Server Implementation

### Basic Echo Server

```adesh
let server = WebSocket.server({ port: 8099, bind_address: "127.0.0.1" });

// Enable automatic echo protocol for incoming frames
server.startEcho();

print("WebSocket Echo Server listening on ws://127.0.0.1:8099");
```

### Custom Handler Server

```adesh
let server = WebSocket.server({
    port: 8099,
    bind_address: "127.0.0.1",
    max_connections: 100,
    max_message_size: 2_000_000
});

server.onConnection(fn(conn) {
    print("New client:", conn.remoteAddr);

    // Per-connection message loop
    while (conn.isConnected()) {
        let msg = conn.receive();
        if (msg.type == "text") {
            print("Text:", msg.payload);
            conn.sendText(f"Echo: {msg.payload}");
        } else if (msg.type == "binary") {
            conn.sendBinary(msg.payload);
        } else if (msg.type == "ping") {
            conn.sendPong(msg.payload);
        } else if (msg.type == "close") {
            print("Client requested close:", msg.code);
            break;
        }
    }
    conn.close(1000, "Bye");
});

server.listen(); // blocks — accept loop
```

### Room / Broadcast Server

```adesh
let server = WebSocket.server({ port: 8099, bind_address: "127.0.0.1" });
let rooms = Arc::new(Mutex::new(HashMap::new()));

server.onConnection(fn(conn) {
    let roomId = conn.path; // e.g., "/room/lobby" from ws://host/room/lobby
    {
        let mut r = rooms.lock().unwrap();
        r.get(roomId).unwrapOrInsert(Vec::new()).push(conn.id);
    }
    // broadcast to room
    server.broadcast(roomId, f"User {conn.id} joined");
});

server.listen();
```

### Server API

| Method | Signature | Description |
|---|---|---|
| `WebSocket.server(opts)` | `fn server(opts: ServerOpts): Server` | Create server (does not bind until `listen`/`startEcho`). |
| `server.startEcho()` | `fn startEcho()` | Start server that echoes every frame back to sender. |
| `server.onConnection(handler)` | `fn onConnection(fn(conn: ServerConn))` | Register per-connection handler. |
| `server.listen()` | `fn listen()` | Bind and run accept loop (blocks). |
| `server.broadcast(room, msg)` | `fn broadcast(room: string, msg: string)` | Send `msg` to all conns in `room`. |
| `server.connections()` | `fn connections(): ServerConn[]` | Snapshot of active connections. |
| `server.close()` | `fn close()` | Stop accepting; close all connections. |
| `conn.sendText(text)` | — | Send text frame to this client. |
| `conn.sendBinary(bytes)` | — | Send binary frame. |
| `conn.receive()` | — | Receive next frame from this client. |
| `conn.close(code, reason)` | — | Close this connection. |
| `conn.remoteAddr` | `string` | Peer `ip:port`. |
| `conn.path` | `string` | Request path from handshake (`/chat`). |
| `conn.headers` | `Map` | Handshake request headers. |
| `conn.id` | `u64` | Unique connection identifier. |

### ServerOpts

| Field | Type | Default | Description |
|---|---|---|---|
| `port` | `u16` | required | Listen port. |
| `bind_address` | `string` | `"127.0.0.1"` | Bind host/IP. |
| `max_connections` | `usize` | `128` | Maximum concurrent clients. |
| `max_message_size` | `usize` | `1_000_000` | Max reassembled message size. |
| `idle_timeout` | `u64` (ms) | `30000` | Per-connection idle timeout. |
| `tls` | `TLS.Config` | — | TLS termination for `wss://`. |

---

## 5. Frame Types & Event Handling

WebSocket messages contain a `type` property corresponding to RFC 6455 frame opcodes:

| Frame Type | Opcode | Description | Payload |
|---|---|---|---|
| `"text"` | `0x1` | UTF-8 text payload | `string` (validated UTF-8) |
| `"binary"` | `0x2` | Raw binary buffer | `u8[]` |
| `"ping"` | `0x9` | Control frame for keepalive heartbeat | `u8[]` (≤125 bytes) |
| `"pong"` | `0xA` | Response to ping | `u8[]` (≤125 bytes) |
| `"close"` | `0x8` | Initiates connection termination | `{ code: u16, reason: string }` |
| `"continuation"` | `0x0` | Continuation of fragmented message | internal — reassembled before delivery |

Data frames (`text`/`binary`) may be **fragmented** across multiple frames (`FIN=0` + `continuation`). The library reassembles fragments transparently; `receive()` always returns a complete message.

### Close Codes

| Code | Name | Meaning |
|---|---|---|
| `1000` | Normal Closure | Successful completion. |
| `1001` | Going Away | Server/client going away. |
| `1002` | Protocol Error | Protocol violation. |
| `1003` | Unsupported Data | Endpoint can't handle data type. |
| `1006` | Abnormal Closure | No close frame (network drop). |
| `1007` | Invalid Payload | Non-UTF-8 in text frame. |
| `1008` | Policy Violation | Generic policy violation. |
| `1009` | Message Too Big | Message exceeds `max_message_size`. |
| `1011` | Internal Error | Server error. |
| `1012` | Service Restart | Server restarting. |
| `1013` | Try Again Later | Temporary overload. |

---

## 6. TLS / Secure WebSocket (`wss://`)

`scheme` determines TLS:

| URL Scheme | Transport | Port Default | TLS |
|---|---|---|---|
| `ws://` | plain TCP | `80` | none |
| `wss://` | TLS over TCP | `443` | via `TLS` module |

```adesh
// wss:// client — TLS verification enabled
let client = WebSocket.connect("wss://echo.example.com:443", {
    tls: { verifyPeer: true, alpn: ["http/1.1"] }
});

// wss:// server — TLS termination
let server = WebSocket.server({
    port: 8443,
    tls: { cert: "/path/cert.pem", key: "/path/key.pem" }
});
server.startEcho();
```

TLS handshake precedes the WebSocket Upgrade — the `TLS` module handles cert verification, ALPN (`http/1.1`), and `STARTTLS`-style wrapping diagnostics.

---

## 7. Error Handling

| Error | When | Recovery |
|---|---|---|
| `HandshakeFailed` | key mismatch, bad status, missing `Upgrade` header | Check server is WS-capable; inspect `error.message` |
| `ConnectionRefused` | TCP connect failed | Retry with backoff; verify host/port |
| `Timeout` | `connect_timeout` or `idle_timeout` exceeded | Increase timeout; check network |
| `MessageTooBig` | payload > `max_message_size` | Raise limit or fragment application payload |
| `ProtocolError` | invalid opcode, unmasked client frame, bad close code | Indicates bug — report |
| `TlsError` | cert verify failed, handshake failed | Check cert chain; see `TLS` diagnostics |
| `Closed` | operation after `close()` | Guard with `isConnected()` |

```adesh
let client = WebSocket.connect("ws://127.0.0.1:8099", { connect_timeout: 2000 });
if (WebSocket.isError(client)) {
    print("Connect error:", client.kind, client.message);
    if (client.kind == "Timeout") {
        print("Retrying...");
    }
}
```

---

## 8. Complete Example — Chat Client + Server

```adesh
// === server.adesh ===
import WebSocket;

let server = WebSocket.server({ port: 8099, bind_address: "127.0.0.1" });
server.onConnection(fn(conn) {
    print(f"Client {conn.id} connected from {conn.remoteAddr}");
    conn.sendText("Welcome to AdeshLang chat!");
    while (conn.isConnected()) {
        let msg = conn.receive();
        if (msg.type == "text") {
            print(f"[{conn.id}] {msg.payload}");
            // broadcast to all
            for c in server.connections() {
                if (c.id != conn.id) { c.sendText(f"[{conn.id}]: {msg.payload}"); }
            }
        } else if (msg.type == "close") { break; }
    }
    print(f"Client {conn.id} disconnected");
});
server.listen();

// === client.adesh ===
import WebSocket;

let client = WebSocket.connect("ws://127.0.0.1:8099", { connect_timeout: 5000 });
if (!WebSocket.isError(client)) {
    client.sendText("Hello, chat!");
    let reply = client.receive();
    print("Server:", reply.payload);
    // heartbeat
    client.sendPing([0x01]);
    let pong = client.receive();
    print("Pong:", pong.type);
    client.close(1000, "Done");
}
```

---

## 9. Project Examples

- [examples/Libraries/websocket/01_basic_client.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/websocket/01_basic_client.adesh)
- [examples/Libraries/websocket/02_basic_server.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/websocket/02_basic_server.adesh)
- [examples/Libraries/websocket/03_chat_client.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/websocket/03_chat_client.adesh)
- [examples/Libraries/websocket/04_chat_server.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/websocket/04_chat_server.adesh)
- [examples/Libraries/websocket/05_room_broadcast_server.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/websocket/05_room_broadcast_server.adesh)
- [examples/Libraries/websocket/06_tls_server.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/websocket/06_tls_server.adesh)

## Related

- [Net Library](/docs/builtin/net) — raw TCP/UDP primitives under WebSocket
- [TLS Library](/docs/builtin/tls) — certificate verification and `wss://`
- [HTTP Library](/docs/builtin/http) — the Upgrade is an HTTP request
- Source: `src/runtime/stdlib_src/websocket/` and `src/runtime/stdlib_src/tls/`
