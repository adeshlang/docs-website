---
id: websocket
title: WebSocket Standard Library Module
sidebar_label: WebSocket
slug: /builtin/websocket
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# `WebSocket` Module Reference

<FeatureStatus status="STABLE" details="Full-duplex WebSocket client, server, framing, and TLS WSS support" />

The `WebSocket` standard library module enables full-duplex communication over single TCP connections for real-time applications, chat protocols, financial telemetry, and live status feeds.

---

## 1. Importing the Module

```adesh
import WebSocket;
```

---

## 2. Basic Client Connection

Connecting to a remote WebSocket server:

```adesh
let config = WebSocket.ClientConfig({
    connect_timeout: 5000,
    idle_timeout: 30000
});

let client = WebSocket.connect("ws://127.0.0.1:8099", config);

if (WebSocket.isError(client)) {
    print("Connection failed");
} else {
    print("Connected! State:", client.getState().toString());
    
    // Send text frame
    client.sendText("Hello from AdeshLang!");

    // Receive message
    let msg = client.receive();
    if (msg.type == "text") {
        print("Received payload:", msg.payload);
    }

    // Clean close handshake
    client.close(1000, "Client shutdown");
}
```

---

## 3. WebSocket Server Implementation

To host a WebSocket broadcast server:

```adesh
let server = WebSocket.server({ port: 8099, bind_address: "127.0.0.1" });

// Enable automatic echo protocol for incoming frames
server.startEcho();

print("WebSocket Echo Server listening on ws://127.0.0.1:8099");
```

---

## 4. Frame Types & Event Handling

WebSocket messages contain a `type` property corresponding to RFC 6455 frame specs:

| Frame Type | Description |
|---|---|
| `"text"` | UTF-8 text payload |
| `"binary"` | Raw binary buffer payload |
| `"ping"` | Control frame for keepalive heartbeat |
| `"pong"` | Response frame for keepalive ping |
| `"close"` | Control frame initiating connection termination |

---

## 5. Project Examples

- [examples/Libraries/websocket/01_basic_client.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/websocket/01_basic_client.adesh)
- [examples/Libraries/websocket/02_basic_server.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/websocket/02_basic_server.adesh)
- [examples/Libraries/websocket/05_room_broadcast_server.adesh](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/websocket/05_room_broadcast_server.adesh)
