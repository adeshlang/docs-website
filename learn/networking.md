---
id: networking
title: Networking - TCP, UDP, DNS, URL, TLS & WebSockets
sidebar_label: 25. Networking Deep Dive
---

# Networking — TCP, UDP, DNS, URL, TLS & WebSockets

The [Standard Library Tour](/learn/stdlib-tour) showed you a 15-line HTTP
server. Beneath HTTP lies the full networking stack, and AdeshLang provides
real, ergonomic APIs for every layer — TCP, UDP, DNS, URL, TLS, and
WebSockets — with hundreds of examples under
[`examples/Libraries/net/`](https://github.com/adeshlang/adeshlang/tree/main/examples/Libraries/net),
`dns/`, `url/`, `tls/`, and `websocket/`.

## TCP: a chat server

From [`examples/Libraries/net/10_tcp_chat_server.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/Libraries/net/10_tcp_chat_server.adesh):

```adesh
import Net;

let server = Net.tcpListen("127.0.0.1", 9093);
print("TCP Server listening on:", server.localAddress());

let client1 = server.accept();
let stream1 = client1.stream;
print("Client 1 connected from:", client1.remoteAddress);

let payload = stream1.read(1024);
print("Received payload (bytes):", payload.len());

stream1.writeText("Hello Client!");
stream1.close();
server.close();
```

**Output:**
```
=== 10. Multi-Client TCP Server Endpoint ===
TCP Server listening on: 127.0.0.1:9093
Client 1 connected from: 127.0.0.1:XXXX
Received payload (bytes): 12
Sent HTTP response to Client 1
=== 10. TCP Chat Server Completed ===
```

## TCP echo client with timeout

```adesh
import Net;

let socket = Net.tcpConnect("127.0.0.1", 9093, { timeout_ms: 3000 });
socket.writeText("ping");

let reply = socket.read(1024);
print("Server replied:", reply.text());
socket.close();
```

**Output:**
```
Server replied: pong
```

## UDP: fire-and-forget

```adesh
import Net;

// 05_udp_broadcasting_multicast.adesh style
let socket = Net.udpSocket();
socket.sendTo("127.0.0.1", 9094, "broadcast message");
socket.close();
print("UDP message sent (no acknowledgment needed)");
```

**Output:**
```
UDP message sent (no acknowledgment needed)
```

## DNS resolution

From [`examples/Libraries/dns/simple_resolve.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/Libraries/dns/simple_resolve.adesh):

```adesh
import DNS;

let addresses = DNS.resolve("google.com");
print("Resolved addresses:", addresses);

let records = DNS.query("google.com", DNS.Type.A);
print("A records:", records);
```

**Output (addresses vary):**
```
Resolved addresses: [142.250.190.78, 142.250.190.100]
A records: [142.250.190.78]
```

## URL parsing

```adesh
import URL;

let url = URL.parse("https://example.com:8443/users?page=2&limit=50#results");

print(url.scheme);   // https
print(url.host);     // example.com
print(url.port);     // 8443
print(url.path);     // /users
print(url.query);    // page=2&limit=50
```

**Output:**
```
https
example.com
8443
/users
page=2&limit=50
```

## TLS: secure connections

From [`examples/Libraries/tls/simple_tls_client.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/Libraries/tls/simple_tls_client.adesh):

```adesh
import TLS;

let handle = TLS.connect("1.1.1.1", 443);

let request = "GET / HTTP/1.1\r\nHost: 1.1.1.1\r\nConnection: close\r\n\r\n";
TLS.write(handle, request);

print("Negotiated Protocol:", TLS.version(handle));
print("Negotiated ALPN:", TLS.alpn(handle));

let response = TLS.read(handle, 4096);
print(response);

TLS.close(handle);
```

**Output (headers vary):**
```
Negotiated Protocol: TLSv1.3
Negotiated ALPN: http/1.1
HTTP/1.1 400 Bad Request
...
```

## WebSockets: full-duplex chat

From [`examples/Libraries/websocket/01_basic_client.adesh`](https://github.com/adeshlang/adeshlang/blob/main/examples/Libraries/websocket/01_basic_client.adesh):

```adesh
import WebSocket;

let server = WebSocket.server({ port: 8099, bind_address: "127.0.0.1" });
server.startEcho();

let client = WebSocket.connect("ws://127.0.0.1:8099");
print("Connected:", client.getState().toString());

client.sendText("Hello from AdeshLang!");
print("Sent text: 'Hello from AdeshLang!'");

let msg = client.receive();
print("Received:", msg.payload);

client.close(1000, "Client shutting down");
server.close();
```

**Output:**
```
Connected: Open
Sent text: 'Hello from AdeshLang!'
Received: Hello from AdeshLang!
```

## Choosing the right protocol

| You want to… | Use |
|--------------|-----|
| Low-level two-way stream | TCP (`Net.tcpListen`, `tcpConnect`) |
| Fast one-way messages, broadcast | UDP (`udpSocket`, `sendTo`) |
| Look up a name → IP | DNS (`DNS.resolve`, `DNS.query`) |
| Parse or build URLs | URL (`URL.parse`, builders) |
| Encrypted transport | TLS (`TLS.connect`, `TLS.write/read`) |
| Realtime two-way, browser-friendly | WebSocket (`WebSocket.connect`) |
| REST APIs | HTTP (`HTTP.Server` + `Router`) |

## Practice

Write a tiny **health-check** tool: resolve a hostname, open a TLS
connection, and report the negotiated protocol:

```adesh
import DNS;
import TLS;

let host = "example.com";
let addrs = DNS.resolve(host);
print("Resolved", host, "→", addrs);

let tls = TLS.connect(host, 443);
print("TLS version:", TLS.version(tls));
print("TLS ok for", host);

TLS.close(tls);
```

**Output (addresses vary):**
```
Resolved example.com → [93.184.216.34]
TLS version: TLSv1.3
TLS ok for example.com
```

## Summary

✅ **You learned:**
- TCP servers (`tcpListen`, `accept`, `writeText`) and clients
- UDP sockets for fast, connectionless messages
- `DNS.resolve` / `DNS.query` for name resolution
- `URL.parse` gives scheme, host, port, path, query
- TLS 1.3 clients with ALPN negotiation
- WebSocket echo clients and servers
- When to use each protocol

## Next Step

Let's make programs **fast** — execution backends, JIT, and benchmarking.
Continue to **[Performance & Execution Backends](/learn/performance)** →
