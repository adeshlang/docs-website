---
id: tls
title: TLS Library
sidebar_label: TLS
---

# TLS Library

The **TLS** builtin library gives Adesh secure encrypted transport using the Rust `rustls` engine. It is the foundation for private HTTP, STARTTLS upgrades, service-to-service mTLS, and secure sockets without exposing low-level crypto concerns to application code.

At a high level, the TLS library is designed around three principles:

- **Secure by default**: certificate verification, hostname checks, and modern protocol enforcement are enabled unless you intentionally opt out.
- **Minimal surface area**: the library exposes a small, predictable API around connections, policies, and secure streams.
- **Runtime integration**: it plugs directly into Adesh's networking layer (`Net`), so it can wrap raw sockets, accept TLS listeners, and support server/client flows cleanly.

This library is not just a wrapper around a raw socket. It owns the handshake state, negotiated protocol version, ALPN selection, certificate inspection, and connection lifecycle—all while keeping the user-facing API simple and object-oriented.

## Meaning and role

TLS stands for Transport Layer Security. It protects data in transit between two endpoints, preventing eavesdropping, tampering, and impersonation. In Adesh, the `TLS` namespace is the standard library entry point for:

- HTTPS-style client connections
- server-side TLS listeners
- STARTTLS upgrades over existing TCP sockets
- certificate inspection and verification
- ALPN negotiation and protocol version reporting
- secure text and binary data transfer

This makes it especially useful for:

- REST and gRPC clients
- internal service communication
- authenticated API access
- secure custom protocols
- encrypted message exchange over plaintext transport upgrades

## Namespace

| Name | What it provides |
| :--- | :--- |
| `TLS` | The top-level namespace for secure client and server TLS connections |
| `TLS.SecurityPolicy()` | Security preference builder for certificate validation, protocol ranges, and ALPN |
| `TLS.TrustStore()` | Builder for system trust and custom CA roots |
| `TLS.connect(...)` | Create a TLS client connection to `host:port` |
| `TLS.connectWithOptions(...)` | Create a TLS client connection with custom security and handshake configuration |
| `TLS.wrap(...)` | Upgrade an established TCP socket into TLS (STARTTLS-like behavior) |
| `TLS.bindServer(...)` | Wrap a server-side socket with TLS |
| `TLS.Server(...)` | Create a server listener wrapper over a `Net` listener |

## Importing the library

```adesh
import TLS;

let conn = TLS.connect("example.com", 443);
print(conn.version());
conn.close();
```

You can also import symbolic members directly:

```adesh
import { connectWithOptions, SecurityPolicy, TrustStore } from TLS;

let policy = SecurityPolicy().strict();
let trustStore = TrustStore().systemAndWebpki();

let tls = connectWithOptions("api.example.com", 443, {
    verifyCertificates: true,
    verifyHostname: true,
    minVersion: "TLS1.2",
    maxVersion: "TLS1.3",
    alpn: ["h2", "http/1.1"],
    customCaPem: trustStore.customCaPems
});
```

:::tip
The namespace is case-insensitive at the import boundary, so `import TLS;` and `import tls;` both resolve the same builtin module.
:::

---

## Security model

The TLS library uses a fail-closed design. It does not silently downgrade to insecure settings. By default, it enforces:

- minimum protocol: `TLS1.2`
- maximum protocol: `TLS1.3`
- certificate validation: enabled
- hostname verification: enabled
- system trust root usage: enabled
- ALPN negotiation: optional if provided
- resumption: enabled for TLS 1.3 session caching

The default policy is designed for production use, but it can be tightened or relaxed for controlled environments such as local development, private intranets, or test infrastructure.

```adesh
import TLS;

let defaultPolicy = TLS.SecurityPolicy();
print(defaultPolicy.minVersion); // TLS1.2
print(defaultPolicy.maxVersion); // TLS1.3
print(defaultPolicy.verifyCertificates); // true
```

### Security policy builder

```adesh
let strict = TLS.SecurityPolicy().strict();
let dev = TLS.SecurityPolicy().insecureDev();
```

The library exposes a policy object with fields such as:

- `verifyCertificates`
- `verifyHostname`
- `minVersion`
- `maxVersion`
- `alpn`
- `strict()`

This is intentionally simple to use while still matching the native `rustls` protections underneath.

---

## Client connections

### `TLS.connect(host, port)`

Creates a new TLS client connection to a remote host and port.

```adesh
import TLS;

let tls = TLS.connect("example.com", 443);
print(tls.version());
print(tls.alpn());

let response = tls.readText(4096);
print(response);

tls.close();
```

### `TLS.connectWithOptions(host, port, options)`

This is the advanced client constructor. It accepts a configuration object with details like ALPN, CA trust, minimum and maximum protocol versions, and optional client certificate material for mutual TLS.

```adesh
import TLS;

let options = {
    verifyCertificates: true,
    verifyHostname: true,
    minVersion: "TLS1.2",
    maxVersion: "TLS1.3",
    alpn: ["h2", "http/1.1"],
    clientCertPem: "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    clientKeyPem: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
};

let conn = TLS.connectWithOptions("secure.internal", 8443, options);
let reply = conn.readText(2048);
print(reply);
conn.close();
```

### Supported option keys

| Option key | Type | Meaning |
| :--- | :--- | :--- |
| `verifyCertificates` | `bool` | Validate peer certificate chain |
| `verifyHostname` | `bool` | Validate hostname or IP SAN matches |
| `minVersion` | `string` | Minimum allowed protocol, e.g. `"TLS1.2"` |
| `maxVersion` | `string` | Maximum allowed protocol, e.g. `"TLS1.3"` |
| `alpn` | `array<string>` | Preferred application protocols |
| `customCaPem` | `string` | PEM CA bundle to trust in addition to system roots |
| `customCaPath` | `string` | Path to PEM CA bundle |
| `clientCertPem` | `string` | Client certificate PEM |
| `clientKeyPem` | `string` | Client private key PEM |
| `clientCertPath` | `string` | Client certificate path |
| `clientKeyPath` | `string` | Client private key path |

---

## Server-side TLS

TLS server support is intended for applications that already have a raw TCP listener, then upgrade accepted sockets into encrypted streams.

### `TLS.bindServer(tcpSocket, certPem, keyPem)`

Wraps a single raw socket into a server-side TLS connection.

```adesh
import Net;
import TLS;

let socket = Net.tcpConnect("127.0.0.1", 8443);
let tls = TLS.bindServer(socket, certPem, keyPem);
```

### `TLS.Server(tcpListener, certPem, keyPem)`

Creates a secure server wrapper around a `Net.tcpListen` listener so accepted clients are automatically turned into TLS connections.

```adesh
import Net;
import TLS;

let listener = Net.tcpListen("127.0.0.1", 8443);
let server = TLS.Server(listener, certPem, keyPem);

let peer = server.accept();
let hello = peer.readText(1024);
print("Received:", hello);

peer.writeText("hello from server\n");
peer.close();
```

The server wrapper is intentionally aligned with the runtime `Net` API so you can build secure application handles without custom socket plumbing.

---

## STARTTLS and socket wrapping

### `TLS.wrap(tcpSocket, hostname)`

Use this when a connection is already established in plain TCP and you need to upgrade it to TLS in-place, such as for STARTTLS services.

```adesh
import Net;
import TLS;

let raw = Net.tcpConnect("mail.example.com", 587);
let smtpTls = TLS.wrap(raw, "mail.example.com");

smtpTls.writeText("EHLO mail.example.com\r\n");
let banner = smtpTls.readText(2048);
print(banner);

smtpTls.close();
```

This operation is common for protocols that begin in cleartext and negotiate encryption after an initial greeting.

---

## TLS connection object API

Once a connection is created, the result is an object with methods that match the secure stream behavior.

### Core methods

| Method | Description | Returns |
| :--- | :--- | :--- |
| `read(maxBytes?)` | Read decrypted data as UTF-8 text | `string` |
| `readText(maxBytes?)` | Alias for text read | `string` |
| `readBytes(maxBytes?)` | Read decrypted raw bytes | `array<number>` |
| `write(data)` | Write text or byte array over TLS | `int` |
| `writeText(text)` | Write UTF-8 string securely | `int` |
| `writeBytes(bytes)` | Write raw byte array securely | `int` |
| `version()` | Returns negotiated protocol version | `string` |
| `alpn()` | Returns negotiated ALPN protocol | `string` |
| `peerCertificates()` | Returns peer certificate chain DER bytes | `array<array<number>>` |
| `trace()` | Returns handshake diagnostic events | `array<string>` |
| `close()` | Send close notify and release resources | `bool` |

### Example object usage

```adesh
import TLS;

let tls = TLS.connect("example.com", 443);

let sent = tls.writeText("GET / HTTP/1.1\r\nHost: example.com\r\nConnection: close\r\n\r\n");
print("sent bytes:", sent);

let body = tls.readText(8192);
print(body);

print("version:", tls.version());
print("alpn:", tls.alpn());
print("trace:", tls.trace());

let certs = tls.peerCertificates();
print("certificate count:", certs.length);

tls.close();
```

---

## Certificate inspection

The `TLS` library exposes the peer certificate chain as raw certificate DER bytes. This is useful for:

- custom certificate pinning
- trust checks
- metadata inspection
- debugging certificates and SANs

```adesh
import TLS;

let tls = TLS.connect("example.com", 443);
let certs = tls.peerCertificates();

for (cert in certs) {
    print("Certificate length:", cert.length);
}

print(tls.version());
print(tls.alpn());
tls.close();
```

This returns the raw DER for each certificate in the chain, which can be passed to Crypto or a certificate parsing utility if you build additional validation around it.

---

## Trace / diagnostics

The `trace()` method returns handshake events that help you debug TLS negotiation without exposing secret material.

```adesh
import TLS;

let tls = TLS.connect("example.com", 443);
let events = tls.trace();

for (event in events) {
    print(event);
}

tls.close();
```

Typical events include:

- `ClientHelloSent`
- `SNI:example.com`
- `HandshakeCompleted`
- `CloseNotifySent`

These are especially useful for debugging certificate mismatch, SNI config, and ALPN negotiation issues.

---

## API reference

### Namespace-level functions

| Function | Purpose |
| :--- | :--- |
| `TLS.connect(host, port)` | Make a TLS client connection |
| `TLS.connectWithOptions(host, port, options)` | Client connection with custom policy |
| `TLS.wrap(tcpSocket, hostname)` | Upgrade a TCP socket to TLS |
| `TLS.bindServer(tcpSocket, certPem, keyPem)` | Use a raw accepted socket as a TLS server endpoint |
| `TLS.Server(tcpListener, certPem, keyPem)` | TLS listener wrapper over `Net.tcpListen()` |
| `TLS.SecurityPolicy()` | Construct a security policy builder |
| `TLS.TrustStore()` | Construct a trust store builder |

### Connection methods

| Method | Description |
| :--- | :--- |
| `write(data)` | Write raw string/byte data over TLS |
| `writeText(text)` | Write UTF-8 string |
| `writeBytes(bytes)` | Write raw binary bytes |
| `read(maxBytes)` | Read text payload |
| `readText(maxBytes)` | Read text payload |
| `readBytes(maxBytes)` | Read binary payload |
| `version()` | Get negotiated TLS version |
| `alpn()` | Get negotiated ALPN protocol |
| `peerCertificates()` | Get certificate chain |
| `trace()` | Get handshake trace |
| `close()` | End the TLS session gracefully |

### Builder objects

| Builder | Description |
| :--- | :--- |
| `SecurityPolicy()` | Controls verification, versions, ALPN, and other connection checks |
| `TrustStore()` | Controls system trust and custom root CAs |

---

## Common usage patterns

### HTTPS-like client

```adesh
import TLS;

let tls = TLS.connect("www.example.com", 443);
tls.writeText("GET / HTTP/1.1\r\nHost: www.example.com\r\nConnection: close\r\n\r\n");

let page = tls.readText(16384);
print(page);

tls.close();
```

### Strict verification with ALPN

```adesh
import TLS;

let options = {
    verifyCertificates: true,
    verifyHostname: true,
    minVersion: "TLS1.3",
    maxVersion: "TLS1.3",
    alpn: ["h2", "http/1.1"]
};

let tls = TLS.connectWithOptions("api.example.com", 443, options);
print(tls.version());
print(tls.alpn());
tls.close();
```

### Local development with custom CA

```adesh
import TLS;

let options = {
    verifyCertificates: true,
    verifyHostname: true,
    minVersion: "TLS1.2",
    maxVersion: "TLS1.3",
    customCaPem: "-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----"
};

let tls = TLS.connectWithOptions("localhost", 8443, options);
print(tls.version());
tls.close();
```

### TLS listener server

```adesh
import Net;
import TLS;

let listener = Net.tcpListen("127.0.0.1", 8443);
let server = TLS.Server(listener, certPem, keyPem);

let client = server.accept();
client.writeText("hello from secure server\n");
print(client.readText(1024));
client.close();
```

---

## Operational notes

### Error handling

TLS operations fail closed. If the certificate is invalid, the hostname mismatches, the remote does not speak TLS, or the handshake fails, the connection will not silently continue in cleartext. This is deliberate and aligns with secure networking best practices.

### Performance

The TLS library is designed to be lightweight and native. Handshake work is delegated to the Rust `rustls` backend, while the Adesh API remains simple and high-level.

### Integration with other libs

The `TLS` library complements:

- [Net](net) for raw sockets and listener creation
- [Crypto](crypto) for certificate and key material usage, hashing, and secure primitives
- [DNS](dns) for host resolution and name validation
- [IO](io) and [Time](time) for application-level workflows

---

## Source & examples

- Implementation: `src/runtime/stdlib_src/tls/`
- Wrapper module: `src/stdlib/TLS.adesh`
- Runtime registration: `src/runtime/stdlib_src/tls/api.rs`
- Security policy: `src/runtime/stdlib_src/tls/policy.rs`
- Connection flow: `src/runtime/stdlib_src/tls/connection.rs`

Common examples for the TLS library can be found in the repository examples under `examples/Libraries/tls/` and the language docs in the main project reference docs.

## Related

- [Net Library](net) — raw network primitives and socket creation
- [Crypto Library](crypto) — hashing, signatures, and certificate-related cryptography
- [DNS Library](dns) — name resolution and domain validation
- [Standard Library Overview](overview) — the full set of language-builtins
