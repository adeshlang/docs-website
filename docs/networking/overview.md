---
id: overview
title: Networking & Internet Protocols Overview
sidebar_label: Networking Overview
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Networking & Internet Protocols in AdeshLang

<FeatureStatus status="STABLE" details="Includes TCP, UDP, HTTP Client/Server, WebSockets, DNS, and TLS" />

AdeshLang provides a high-throughput, low-latency networking stack with first-class support for both low-level socket programming and modern application-layer web protocols. Built on top of non-blocking asynchronous event loops (`epoll`, `kqueue`, `IOCP`), AdeshLang achieves industry-leading concurrent connection handling with **zero garbage collection jitter**.

```
┌──────────────────────────────────────────────────────────┐
│              AdeshLang Networking Architecture           │
├──────────────────────────────────────────────────────────┤
│ Application:  [ HTTP/1.1 & HTTP/2 ]   [ WebSockets (WSS) ]│
│                       │                       │          │
│ Security:     [ TLS 1.3 / SSL Encryption Wrapper ]       │
│                       │                       │          │
│ Transport:    [ TCP Stream / Listener ] [ UDP Datagram ] │
│                       │                       │          │
│ Kernel:       [ OS Async I/O (epoll / kqueue / IOCP) ]   │
└──────────────────────────────────────────────────────────┘
```

---

## 1. TCP Client & Server

### High-Concurrency Async TCP Echo Server
```adesh
import { net } from "builtin";
import { async } from "builtin";

async fn handle_connection(stream: net::TcpStream) {
    defer stream.close();
    let buffer = [0u8; 1024];

    while let Ok(bytes_read) = await stream.read(&buffer) {
        if bytes_read == 0 {
            break; // Connection closed cleanly by client
        }
        // Echo data back to client
        let _ = await stream.write_all(&buffer[0..bytes_read]);
    }
}

async fn main(): Result<(), Error> {
    let listener = await net::TcpListener::bind("0.0.0.0:8080")?;
    print("TCP Server listening on port 8080...");

    while let Ok((stream, client_addr)) = await listener.accept() {
        print(f"Accepted connection from: {client_addr}");
        async::spawn(async move {
            handle_connection(stream).await;
        });
    }

    return Ok(());
}
```

### TCP Client with Timeout
```adesh
import { net } from "builtin";

fn main(): Result<(), Error> {
    let stream = net::TcpStream::connect("127.0.0.1:8080", timeout_ms = 3000)?;
    defer stream.close();

    stream.write("PING\n".as_bytes())?;
    let response = stream.read_to_string()?;
    print(f"Received from server: {response}");

    return Ok(());
}
```

---

## 2. UDP Datagram Sockets

For low-latency, connectionless communication (games, telemetry, voice):

```adesh
import { net } from "builtin";

fn run_udp_server(): Result<(), Error> {
    let socket = net::UdpSocket::bind("0.0.0.0:9000")?;
    let buffer = [0u8; 512];

    while true {
        let (bytes_received, peer_addr) = socket.recv_from(&buffer)?;
        print(f"Received {bytes_received} bytes from {peer_addr}");

        // Send response packet
        socket.send_to("PONG".as_bytes(), peer_addr)?;
    }

    return Ok(());
}
```

---

## 3. Secure Sockets with TLS / SSL

Wrap raw TCP sockets in hardware-accelerated TLS 1.3 encryption:

```adesh
import { tls } from "builtin";
import { net } from "builtin";

fn main(): Result<(), Error> {
    let tcp_stream = net::TcpStream::connect("api.github.com:443")?;
    
    // Perform TLS 1.3 handshake with ALPN negotiation
    let tls_stream = tls::TlsConnector::new()
        .enable_sni(true)
        .connect("api.github.com", tcp_stream)?;

    tls_stream.write("GET /zen HTTP/1.1\r\nHost: api.github.com\r\nConnection: close\r\n\r\n".as_bytes())?;
    let response = tls_stream.read_to_string()?;
    print(f"TLS Response:\n{response}");

    return Ok(());
}
```

---

## 4. HTTP Client & Microservice Server

### HTTP GET & POST Requests
```adesh
import { http } from "builtin";
import { json } from "builtin";

async fn fetch_weather(city: string): Result<f64, Error> {
    let url = f"https://api.weather.com/v1/current?city={city}";
    
    let response = await http::get(url);
    if response.status != 200 {
        return Err(Error::new(f"HTTP error status: {response.status}"));
    }

    let body = await response.json();
    let temp = body.get("temperature")?.as_float()?;
    return Ok(temp);
}
```

---

## 5. WebSockets (Full Duplex Streaming)

```adesh
import { websocket } from "builtin";

async fn connect_realtime_feed(): Result<(), Error> {
    let ws = await websocket::connect("wss://stream.binance.com/ws/btcusdt@trade")?;
    defer ws.close();

    while let Some(message) = await ws.receive() {
        match message {
            websocket::Message::Text(data) => {
                print(f"Trade event: {data}");
            }
            websocket::Message::Binary(bytes) => {
                print(f"Binary packet: {bytes.len()} bytes");
            }
            websocket::Message::Ping(payload) => {
                await ws.send(websocket::Message::Pong(payload));
            }
            websocket::Message::Close => {
                print("Connection closed by peer");
                break;
            }
        }
    }

    return Ok(());
}
```

---

## 6. Standard Networking Modules

Explore detailed API references for each protocol module:

- [**`builtin/net`**](../builtin/net) — Low-level TCP streams, listeners, UDP sockets, and socket options.
- [**`builtin/http`**](../builtin/http) — High-level async HTTP/1.1 & HTTP/2 client and server framework.
- [**`builtin/websocket`**](../builtin/websocket) — RFC 6455 compliant WebSocket client and server.
- [**`builtin/dns`**](../builtin/dns) — High-speed asynchronous DNS resolution and cache.
- [**`builtin/tls`**](../builtin/tls) — Production-grade TLS 1.2/1.3 cryptographic wrapper.
