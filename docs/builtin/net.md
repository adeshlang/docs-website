---
id: net
title: Net Library
sidebar_label: Net
---

# Net Library

The **Net** builtin library is Adesh's production-grade networking foundation. It provides cross-platform, zero-GC, RAII-safe networking primitives for TCP client and server streams, UDP datagram sockets, IP addressing, socket address formatting, network interface enumeration, and capability-based security policy sandboxing for SSRF defense.

All socket handles follow Adesh's zero-GC ownership and borrowing semantics — streams are closed deterministically upon scope exit or object drops, preventing resource leaks.

## Namespace

| Name | What it provides |
| :--- | :--- |
| `Net` | The primary networking namespace: TCP, UDP, IPAddress, SocketAddress, network interfaces, and NetworkPolicy |

## Importing the library

```adesh
import Net;              // or import "std:Net" as Net;
```

Selective imports work too:

```adesh
import { tcpConnect, tcpListen, udpBind, IPAddress, NetworkPolicy } from Net;
```

:::tip
All `Net` network operations execute non-blocking, capability-aware system calls with explicit error returns using Adesh's `Result` / `Option` primitives.
:::

---

## TCP Networking (`Net.tcpConnect` & `Net.tcpListen`)

High-performance, buffered TCP stream connections and TCP server listeners.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `tcpConnect(host, port)` | Connect to a remote TCP endpoint (`host:port`) | `host: string`, `port: int` | `TcpStream` |
| `tcpListen(host, port)` | Bind a TCP server listener to `host:port` | `host: string`, `port: int` | `TcpListener` |

### `TcpStream` Object Methods

- `stream.read(bytesCount?)`: Reads bytes from the socket into a string.
- `stream.write(data)`: Writes string or byte array payload to the socket.
- `stream.close()`: Explicitly closes the socket connection.
- `stream.setReadTimeout(ms)`: Configures socket read timeout in milliseconds.
- `stream.setWriteTimeout(ms)`: Configures socket write timeout in milliseconds.

### `TcpListener` Object Methods

- `server.accept()`: Blocks until a new incoming client connects, returning a `{ stream: TcpStream, remoteAddr: String }` connection object.
- `server.close()`: Shuts down the TCP listener socket.

```adesh
import Net;

// 1. Start a TCP Echo Server
let server = Net.tcpListen("127.0.0.1", 8080);
print("TCP Server listening on 127.0.0.1:8080...");

// 2. Client Connection
let client = Net.tcpConnect("127.0.0.1", 8080);
client.write("PING");

// 3. Server Accept & Echo
let conn = server.accept();
let msg = conn.stream.read();
print("Server received:", msg);
conn.stream.write("PONG");

// 4. Client Read Response
let response = client.read();
print("Client received response:", response);

client.close();
server.close();
```

---

## UDP Networking (`Net.udpBind`)

Low-latency UDP datagram socket communication.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `udpBind(host, port)` | Bind a UDP socket to local address `host:port` | `host: string`, `port: int` | `UdpSocket` |

### `UdpSocket` Object Methods

- `socket.sendTo(data, targetHost, targetPort)`: Sends a datagram to `targetHost:targetPort`.
- `socket.recvFrom()`: Blocks receiving a datagram, returning `{ data: String, remoteHost: String, remotePort: Int }`.
- `socket.close()`: Closes the UDP socket.

```adesh
import Net;

let socket = Net.udpBind("127.0.0.1", 9090);

// Send datagram payload
socket.sendTo("Hello UDP Server", "127.0.0.1", 9090);

// Receive datagram payload
let pkt = socket.recvFrom();
print("Received UDP datagram from", pkt.remoteHost, ":", pkt.data);

socket.close();
```

---

## IP Address Representation (`Net.IPAddress`)

The `Net.IPAddress` class provides parsing, scope zone index handling, IPv4/IPv6 classification, and validation.

| Function / Property | Description | Returns |
| :--- | :--- | :--- |
| `Net.IPAddress.parse(ipString)` | Parse IPv4 (`"192.168.1.1"`) or IPv6 (`"fe80::1%eth0"`) string | `IPAddress` |
| `ip.version` | IP version string (`"v4"` or `"v6"`) | `string` |
| `ip.address` | Canonical string representation of the IP address | `string` |
| `ip.isLoopback` | True if `127.0.0.0/8` or `::1` | `bool` |
| `ip.isPrivate` | True if RFC 1918 private network (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) or Unique Local IPv6 | `bool` |
| `ip.isLinkLocal` | True if `169.254.0.0/16` or `fe80::/10` | `bool` |
| `ip.isMulticast` | True if multicast destination | `bool` |
| `ip.isGlobal` | True if public globally routable IP address | `bool` |

```adesh
import Net;

let ip = Net.IPAddress.parse("192.168.1.50");

print("Address:", ip.address);
print("Version:", ip.version);
print("Is Private Network:", ip.isPrivate);
print("Is Loopback:", ip.isLoopback);
```

---

## Socket Address Formatting (`Net.SocketAddress`)

Parse formatted network socket pairs (`"host:port"` or `"[ipv6]:port"`).

| Function / Property | Description | Returns |
| :--- | :--- | :--- |
| `Net.SocketAddress.parse(addrString)` | Parse host & port formatted string | `SocketAddress` |
| `addr.host` | Hostname or IP string component | `string` |
| `addr.port` | Numeric port component | `int` |

```adesh
import Net;

let addr = Net.SocketAddress.parse("127.0.0.1:8080");
print("Host:", addr.host); // "127.0.0.1"
print("Port:", addr.port); // 8080
```

---

## Network Interfaces (`Net.interfaces()`)

Enumerate physical and virtual network interface controllers (NICs) on the host machine.

```adesh
import Net;

let nics = Net.interfaces();

for (nic in nics) {
    print("Interface:", nic.name, "| IP:", nic.ip, "| MAC:", nic.mac, "| Up:", nic.isUp);
}
```

---

## Security Policy Sandboxing (`Net.NetworkPolicy()`)

Prevent SSRF (Server-Side Request Forgery) attacks and restrict unauthorized network access.

```adesh
import Net;

let policy = Net.NetworkPolicy()
    .denyPrivateNetworks()
    .denyLoopback();

print("Policy configured:", policy);
```
