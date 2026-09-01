---
id: dns
title: DNS Library
sidebar_label: DNS
---

# DNS Library

The **DNS** builtin library is AdeshLang's production-grade, high-performance, secure DNS resolution and protocol subsystem. Designed cleanly on top of `Net`, it provides hostname resolution, record querying, service discovery, thread-safe LRU caching, and SSRF security policy sandboxing.

All binary wire encoders and decoders operate under strict safety bounds — enforcing maximum domain label lengths (≤ 63 octets), full domain lengths (≤ 255 octets), and compression pointer loop protection with a maximum recursion depth of 16.

## Namespace

| Name | What it provides |
| :--- | :--- |
| `DNS` | The primary DNS namespace: resolve, query, reverseLookup, discover, Resolver, and Policy |

## Importing the library

```adesh
import DNS;              // or import "std:DNS" as DNS;
```

Selective imports work too:

```adesh
import { resolve, query, reverseLookup, discover } from DNS;
```

---

## High-Level Resolution (`DNS.resolve`)

Resolves a domain name into an array of IPv4 and IPv6 address strings.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `resolve(hostname)` | Resolve domain hostname to array of IP address strings | `hostname: string` | `Array<String>` |

```adesh
import DNS;

let ips = DNS.resolve("google.com");

for (ip in ips) {
    print("Resolved IP:", ip);
}
```

---

## Record Querying (`DNS.query`)

Queries specific DNS record types (`A`, `AAAA`, `MX`, `TXT`, `CNAME`, `NS`, `PTR`, `SOA`, `SRV`, `CAA`).

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `query(hostname, rtype)` | Query specific DNS record type | `hostname: string`, `rtype: string` | `Array<Object>` |

Each returned record object contains:
- `rec.name`: Canonical domain name string.
- `rec.type`: Record type string (e.g. `"A"`, `"MX"`).
- `rec.ttl`: Authoritative time-to-live seconds integer.
- `rec.data`: Strongly typed record data (IP string, target string, or schema object).

### Record Schemas (`rec.data`)

- `A` / `AAAA`: IP address string (e.g. `"172.217.24.142"`).
- `CNAME` / `NS` / `PTR`: Canonical hostname string.
- `MX`: `{ exchange: String, priority: Number }`.
- `TXT`: `Array<String>` array of text strings.
- `SOA`: `{ primaryNs, respMailbox, serial, refresh, retry, expire, minimumTtl }`.
- `SRV`: `{ host, port, priority, weight }`.
- `CAA`: `{ flags, tag, value }`.

```adesh
import DNS;

// Mail Exchange Query
let mxRecords = DNS.query("gmail.com", DNS.Type.MX);
for (rec in mxRecords) {
    print("Exchange:", rec.data.exchange, "| Priority:", rec.data.priority);
}

// Start of Authority Query
let soaRecords = DNS.query("cloudflare.com", DNS.Type.SOA);
for (rec in soaRecords) {
    print("Primary NS:", rec.data.primaryNs, "| Serial:", rec.data.serial);
}
```

---

## Reverse DNS Lookup (`DNS.reverseLookup`)

Performs reverse DNS lookup over `in-addr.arpa` or `ip6.arpa`.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `reverseLookup(ipString)` | Reverse lookup IP address to host | `ipString: string` | `String` |

```adesh
import DNS;

let host = DNS.reverseLookup("8.8.8.8");
print("8.8.8.8 Hostname:", host); // "dns.google"
```

---

## Service Discovery (`DNS.discover`)

Performs RFC 2782 service discovery over SRV records, returning ordered service endpoints sorted by priority and weight.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `discover(serviceName)` | Discover service endpoints over SRV | `serviceName: string` | `Array<Object>` |

```adesh
import DNS;

let services = DNS.discover("_xmpp-client._tcp.jabber.org");

for (s in services) {
    print("Discovered Endpoint:", s.host, "| Port:", s.port, "| Priority:", s.priority);
}
```

---

## Custom Resolver & Caching (`DNS.Resolver()`)

Construct custom resolvers with upstream server selection and explicit in-memory caching.

```adesh
import DNS;

let resolver = DNS.Resolver().cache(true);

// 1. First query populates in-memory cache
let r1 = resolver.query("cloudflare.com", DNS.Type.A);
print("Initial Lookup IP:", r1[0].data);

// 2. Second query served directly from cache
let r2 = resolver.query("cloudflare.com", DNS.Type.A);
print("Cached Lookup IP:", r2[0].data);
```

---

## Security Policy Sandboxing (`DNS.Policy()`)

Sandboxes DNS resolution to prevent SSRF (Server-Side Request Forgery) attacks and DNS rebinding to internal subnets.

```adesh
import DNS;

let policy = DNS.Policy()
    .denyLoopback()
    .denyPrivateNetworks();

print("Configured Security Policy:", policy);
```
