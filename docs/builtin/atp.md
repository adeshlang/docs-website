---
id: atp
title: ATP — Adesh Transport Protocol
sidebar_label: ATP
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# ATP — Adesh Transport Protocol (`atp`)

<FeatureStatus status="STABLE" details="Reliable, ordered, multiplexed transport over UDP with Ed25519 identity, retry tokens, and stream-level framing" />

ATP (**Adesh Transport Protocol**) is AdeshLang's custom reliable transport built on UDP — a QUIC-inspired, encrypted, multiplexed, stream-oriented protocol for game state sync, real-time collaboration, and high-throughput message buses. It provides **message framing, fragmentation/reassembly, ordered delivery, stream multiplexing, datagrams, acks, congestion control, and optional Ed25519 peer authentication** in a single `atp` module.

```
┌─────────────────────────────────────────────────────────┐
│                  ATP (Adesh Transport)                  │
├─────────────────────────────────────────────────────────┤
│  Listen / Connect  → atp.listen(host,port,config)       │
│                      atp.connect(host,port,config)      │
│  Streams           → connection.openStream(), stream.send() │
│  Messages          → conn.send(data, reliable, ordered) │
│  Datagrams         → conn.datagram(data)  (unreliable)  │
│  Identity          → atp.generateIdentityKey()          │
│  Framing           → frames: Data, Ack, StreamOpen/Close│
│  Wire              → UDP packets: LongHeader / ShortHeader│
└─────────────────────────────────────────────────────────┘
```

Implementation: `src/runtime/stdlib_src/atp/` — 26 modules (`api.rs`, `engine.rs`, `wire.rs`, `message.rs`, `connection.rs`, `stream.rs`, `config.rs`, `congestion.rs`, `reliability.rs`, `security.rs`, `identity.rs`, `handshake.rs`, `token.rs`, `scheduler.rs`, `router.rs`, `ack.rs`, `flow.rs`, `path.rs`, `timer.rs`, `loss_sim.rs`, `memory.rs`, `errors.rs`, `id.rs`, etc.).

---

## Architecture Diagram — Stack & Packet Flow

```
 Adesh Code
   │
   │  atp.listen / atp.connect
   ▼
┌─────────────────────────────────────────────┐
│           AtpEngine (engine.rs)             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │Handshake │  │ Scheduler│  │  Timer    │ │
│  │(handshake)│  │(scheduler)│  │ (timer)   │ │
│  └────┬─────┘  └────┬─────┘  └────┬──────┘ │
│       │             │             │        │
│  ┌────▼─────────────▼─────────────▼─────┐  │
│  │         Connection (connection.rs)    │  │
│  │  streams, messages, flow, congestion │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────┐ │  │
│  │  │Stream   │  │Message   │  │Flow  │ │  │
│  │  │(stream) │  │(message) │  │(flow)│ │  │
│  │  └─────────┘  └──────────┘  └──────┘ │  │
│  └────────────────┬────────────────────┘  │
│                   │                       │
│  ┌────────────────▼────────────────────┐  │
│  │        Wire (wire.rs)               │  │
│  │ LongHeader / ShortHeader + Frames   │  │
│  │ Data, Ack, Handshake, Retry, Ping…  │  │
│  └────────────────┬────────────────────┘  │
└───────────────────┼───────────────────────┘
                    │ UDP socket
                    ▼
              Network (IP/UDP)
```

### Message Lifecycle

```
send(data) ──► fragment_payload(data, max_fragment_size)
                │
                ├──► chunks: Vec<Vec<u8>> (max 64 per AtpConfig)
                │
                ▼
         SendMessage { message_id, stream_id, total_fragments, fragments }
                │
                ▼
         Wire: Frame::Data per fragment { stream_id, message_id,
                fragment_num, total_fragments, flags (RELIABLE|ORDERED|FIRST|FIN),
                payload }
                │
                ▼
         Packet: ShortHeader { dst_conn_id[8], packet_number(varint), payload: frames }
                │
                ▼
         UDP ──► receive ──► Frame::decode ──► MessageReassembly
                                                    │
                                                    ├──► add_fragment (validate flags, bounds, memory)
                                                    ├──► OrderedDelivery (per-stream ordering)
                                                    └──► Delivery::Message { connection_id, stream_id, message_id, data }
                                                            │
                                                            ▼
                                                     conn.receive() → Value { type:"message", streamId, messageId, data, text? }
```

---

## 1. Importing & Setup

```adesh
import atp;

// Or via module object
let atp = atp; // global atp namespace (registered as "atp" builtins)
```

The ATP builtins are registered via `atp_listen`, `atp_connect`, `atp_generate_identity_key`, `atp_get_public_key`, `atp_default_config` — exposed as the `Atp` module object:

```adesh
import atp;
let keypair = atp.generateIdentityKey(); // { privateKey, publicKey, privateKeyHex, publicKeyHex }
print(keypair.publicKeyHex);
```

---

## 2. Listening & Connecting

### Server — `atp.listen`

```adesh
import atp;

// Minimal echo server
let server = atp.listen("127.0.0.1", 9000);
print("ATP server listening on 127.0.0.1:9000");

// Non-blocking poll for new connections
let conn = server.accept();
if (conn != null) {
    print("New connection:", conn.connectionId);
    let msg = conn.receive();
    if (msg != null && msg.type == "message") {
        print("Received:", msg.text);
        conn.send("echo: " + msg.text);
    }
}
// server.close();
// server.metrics() → { connections, established, streams, bytesSent, bytesReceived, ... }
```

### Client — `atp.connect`

```adesh
import atp;

let conn = atp.connect("127.0.0.1", 9000);
print("Connected:", conn.connectionId);

// Send reliable ordered message on default stream
conn.send("Hello ATP!", true, true);

// Receive (non-blocking poll — returns null if no delivery yet)
let delivery = conn.receive();
if (delivery != null) {
    print("Delivery type:", delivery.type);
    if (delivery.type == "message") {
        print("Stream:", delivery.streamId, "Msg:", delivery.messageId);
        print("Text:", delivery.text);
        print("Bytes:", delivery.data);
    }
}

// Other operations
conn.datagram("unreliable ping");
conn.ping();
conn.metrics(); // { bytesSent, packetsSent, messagesSent, ... }
conn.close();
```

### `AtpConfig` — Tuning the Engine

```adesh
let keypair = atp.generateIdentityKey();

let server = atp.listen("0.0.0.0", 9000, {
    identityKey: keypair.privateKey,           // 32-byte Ed25519 seed (hex or u8[32])
    trustedPeers: [otherPubkey32],              // allowlist of peer public keys
    requireIdentity: true,                      // reject handshakes without valid proof
    maxPacketSize: 1200,                        // UDP payload ceiling (default 1200)
    maxMessageSize: 64 * 1024 * 1024,           // 64 MiB
    maxStreams: 256,
    idleTimeout: 30,                            // seconds
    handshakeTimeout: 10,                       // seconds
    retryTokenTtl: 30,                          // seconds (stateless retry HMAC TTL)
    handshakeRateLimit: 10                      // attempts per window (DDoS guard)
});

// Inspect defaults
print(atp.defaultConfig());
// { maxPacketSize:1200, maxMessageSize:..., maxStreams:256, idleTimeout:30, ... }
```

| Config Field | Type | Default | Description |
|---|---|---|---|
| `identityKey` / `localIdentity` | `u8[32]` hex or array | none | Local Ed25519 seed (private). |
| `trustedPeers` / `trustedPeerKeys` | `u8[32][]` | `[]` (accept any valid proof) | Peer allowlist. |
| `requireIdentity` / `requirePeerIdentity` | `bool` | `false` | Reject handshakes without proof. |
| `maxPacketSize` | `usize` | `1200` | Max UDP payload (no IP frag). |
| `maxMessageSize` | `u64` | `64 MiB` | Largest reassembled message. |
| `maxStreams` | `u64` | `256` | Concurrent streams per connection. |
| `idleTimeout` | `u64` (sec) | `30` | Close idle connections. |
| `handshakeTimeout` | `u64` (sec) | `10` | Handshake deadline. |
| `retryTokenTtl` | `u64` (sec) | `30` | Retry token HMAC validity. |
| `handshakeRateLimit` | `u32` | `10` | Per-window handshake cap. |

---

## 3. Identity & Security

ATP can authenticate every handshake with **Ed25519** identity proofs.

```adesh
import atp;

// Generate a keypair (private seed + public key, both 32 bytes)
let alice = atp.generateIdentityKey();
print(alice.privateKeyHex); // hex-encoded 32-byte seed
print(alice.publicKeyHex);  // hex-encoded 32-byte pubkey

// Derive public from private (deterministic)
let pub2 = atp.getPublicKey(alice.privateKey);
print(pub2.publicKeyHex == alice.publicKeyHex); // true

// Start a server that requires peer identity
let server = atp.listen("127.0.0.1", 9000, {
    identityKey: alice.privateKey,
    requireIdentity: true,
    trustedPeers: [] // any valid proof accepted
});

// Client authenticates with its own key
let bob = atp.generateIdentityKey();
let conn = atp.connect("127.0.0.1", 9000, {
    identityKey: bob.privateKey
});
```

| Module | Role |
|---|---|
| `identity.rs` | `IdentityKeyPair::generate()` via `ed25519-dalek`, `from_seed(32 bytes)`, `public_bytes()`, `proof` signing |
| `security.rs` | AEAD (ChaCha20-Poly1305, tag 16), key derivation, epoch `KeyUpdate` |
| `handshake.rs` | `ConnectionInit` / `ConnectionInitAck` / `Handshake(Finished)` with identity proof |
| `token.rs` | Stateless retry token HMAC (`retry_token_secret`, TTL) |

Wire identity proof is carried inside `ConnectionInit` / `ConnectionInitAck` as the `identity_proof` field (varint-prefixed, max `IDENTITY_PROOF_LEN`).

---

## 4. Message Framing & Streams

### Reliability Modes (`message.rs`)

| Mode | `flags` bits | Meaning | Retransmitted | Ordered |
|---|---|---|---|---|
| `Unreliable` | `00` | Best-effort, no ack | no | no |
| `Reliable` | `01` | Acked, may reorder | yes | — |
| `ReliableUnordered` | `01` | Acked, unordered | yes | no |
| `ReliableOrdered` | `11` | Acked, in-order per stream | yes | yes |
| `OrderedBestEffort` | `10` | Ordered but not acked | no | yes |

Flags: `DATA_FLAG_RELIABLE=0x01`, `DATA_FLAG_ORDERED=0x02`, `DATA_FLAG_FIN=0x04`, `DATA_FLAG_FIRST=0x08`.

```adesh
// Reliable ordered (default) — retransmitted, delivered in send order
conn.send("critical state", true, true);

// Reliable unordered — retransmitted but delivered as soon as ready
conn.send("telemetry", true, false);

// Unreliable — fire-and-forget (no retransmit)
conn.send("particle effect", false, false);

// Explicit stream selection
conn.send("chat message", true, true, 5); // stream 5
```

### Fragmentation & Reassembly

Large messages are split by `fragment_payload(payload, max_fragment_size)`:

```
payload 10 KiB, max_fragment_size 1072 → ~10 fragments
each fragment: Frame::Data { stream_id, message_id, fragment_num, total_fragments, flags, payload }
  flags: FIRST on fragment 0, FIN on last fragment, RELIABLE/ORDERED per mode
```

Reassembly (`MessageReassembly`) validates:

| Check | Error |
|---|---|
| `fragment_num >= total_fragments` | `protocol: invalid fragment bounds` |
| `total_fragments != expected` | `protocol: inconsistent total_fragments` |
| fragment 0 without FIRST | `protocol: fragment 0 missing FIRST` |
| last fragment without FIN | `protocol: last fragment missing FIN` |
| duplicate `fragment_num` | deduplicated (returns `false`) |
| reassembly memory > `max_message_size` | `memory: reassembly exceeds max message size` |
| `total_fragments > MAX_FRAGMENT_COUNT (65536)` | fragmentation fails |

`OrderedDelivery` per stream buffers completed messages until `next_expected_message_id` is contiguous, then delivers in order.

### Streams (`stream.rs`)

```
Connection
 ├── Stream 1 (client-initiated, default)
 ├── Stream 2 (server-initiated, default)
 ├── Stream 3, 4, ... (opened via openStream)
 └── Datagrams (outside streams, connection-level)
```

```adesh
// Open a new stream with priority
let stream = conn.openStream("high"); // Priority: "critical"|"high"|"medium"|"low" (default medium)
stream.send("stream data");
stream.receive(); // same Delivery polling, scoped to connection
stream.close();
stream.cancel(messageId);

// Priority enum
print(atp.Priority.Critical); // "critical"
print(atp.Priority.High);     // "high"
```

Stream priorities feed the scheduler's weighted fair queuing (`scheduler.rs`).

---

## 5. Wire Format (`wire.rs`)

### Packet Headers

```
Long Header (handshake, establishment):              Short Header (established):

 0                   1                   2           0                   1
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1         0 1 2 3 4 5 6 7 8 9 0 1 ...
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+  +-+-+-+-+-+-+-+-+-+-+-+-+-+
|1|1|  version (4B) | dst_cid_len | dst_cid   |  |0|1| dst_conn_id (8B)  | pn
| FLAG_LONG|FIXED  |  (1B)       | (var)     |  |  FIXED |              |varint
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+  +-+-+-+-+-+-+-+-+-+-+-+-+-+
| src_cid_len | src_cid | packet_number(varint)|  | payload (frames...)       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+  +-+-+-+-+-+-+-+-+-+-+-+-+-+
| payload (frames...)                           |
+-----------------------------------------------+
```

| Header | Flag | CID Len | When |
|---|---|---|---|
| Long | `0x80 \| 0x40` | `dst_cid_len` + `src_cid_len` variable (≤20) | `ConnectionInit`, handshake |
| Short | `0x40` | fixed `CONNECTION_ID_LEN=8` | established (data path) |

Packet numbers are QUIC-style varints (canonical encoding).

### Varint Codec (QUIC-style, 1/2/4/8 bytes)

| Value Range | Encoded Length | Tag Bits |
|---|---|---|
| `0–63` | 1 byte | `00xxxxxx` |
| `64–16383` | 2 bytes | `01xxxxxx` |
| `16384–1_073_741_823` | 4 bytes | `10xxxxxx` |
| up to `2^62-1` | 8 bytes | `11xxxxxx` |

Non-canonical encodings are **rejected** (must use shortest length).

### Frame Types (19 kinds)

| # | Frame | Fields | Purpose |
|---|---|---|---|
| `0x01` | `ConnectionInit` | `version, src_cid, eph_pubkey(32), transport_params, retry_token, identity_proof` | Client hello |
| `0x02` | `ConnectionInitAck` | `version, src_cid, dst_cid, eph_pubkey(32), transport_params, identity_proof` | Server hello |
| `0x03` | `Handshake` | `confirm[32]` (Finished) | Handshake confirmation |
| `0x04` | `Data` | `stream_id, message_id, fragment_num, total_fragments, flags, payload` | Fragmented message |
| `0x05` | `Ack` | `largest_acked, ack_delay, ranges: Vec<(gap, range_len)>` | Ack with ranges (max 64) |
| `0x06` | `StreamOpen` | `stream_id` | Open stream |
| `0x07` | `StreamClose` | `stream_id` | Graceful stream close |
| `0x08` | `StreamReset` | `stream_id, reason` | Abrupt stream reset |
| `0x09` | `MaxData` | `max_data` | Connection flow-control window |
| `0x0A` | `MaxStreamData` | `stream_id, max_data` | Per-stream flow window |
| `0x0B` | `Ping` | — | Keepalive |
| `0x0C` | `Pong` | — | Ping response |
| `0x0D` | `PathChallenge` | `data[8]` | Connection migration challenge |
| `0x0E` | `PathResponse` | `data[8]` | Challenge response |
| `0x0F` | `ConnectionClose` | `error_code, reason` | Close connection |
| `0x10` | `KeyUpdate` | `epoch` | Rekey AEAD epoch |
| `0x11` | `Cancel` | `stream_id, message_id` | Cancel in-flight message |
| `0x12` | `Datagram` | `payload` | Unreliable datagram |
| `0x13` | `Retry` | `token` | Stateless retry request |

All frames are varint-length-prefixed and can be coalesced inside one packet (`Frame::encode_all` / `decode_all`). Datagrams are capped at `MAX_DATAGRAM_SIZE = 1200−128 = 1072`. Frame fields are size-limited (`MAX_FRAME_PAYLOAD`, `MAX_HANDSHAKE_SIZE=4096`).

---

## 6. Connection & Delivery Types

### Server Object (`build_server_object`)

| Method | Signature | Returns | Notes |
|---|---|---|---|
| `server.accept()` | `fn accept() -> AtpConnection \| null` | non-blocking poll; `null` if no pending handshake |
| `server.close()` | `fn close() -> bool` | stops engine |
| `server.metrics()` | `fn metrics() -> EngineMetrics` | `{ connections, established, streams, memoryUsed, bytesSent, bytesReceived }` |

### Connection Object (`build_connection_object`)

| Method | Signature | Description |
|---|---|---|
| `conn.send(data, reliable?, ordered?, streamId?)` | `fn send(data: string\|u8[], reliable?: bool, ordered?: bool, streamId?: u64) -> bool` | Enqueue message; `reliable` default `true`, `ordered` default `true`, `streamId` default `1` (client) / `2` (server). |
| `conn.receive()` | `fn receive() -> Delivery \| null` | Non-blocking poll for next delivery. |
| `conn.openStream(priority?)` | `fn openStream(priority?: "low"\|"medium"\|"high"\|"critical") -> AtpStream` | Open stream handle. |
| `conn.datagram(data)` | `fn datagram(data: string\|u8[]) -> bool` | Unreliable datagram (no ordering, no retransmit). |
| `conn.ping()` | `fn ping() -> bool` | Send Ping frame. |
| `conn.close()` | `fn close() -> bool` | Graceful connection close. |
| `conn.cancel(streamId, messageId)` | `fn cancel(streamId: u64, messageId: u64) -> bool` | Cancel message. |
| `conn.metrics()` | `fn metrics() -> ConnMetrics` | `{ bytesSent, bytesReceived, packetsSent, packetsReceived, messagesSent, messagesReceived }` |
| `conn.migrate(host, port)` | `fn migrate(host: string, port: u16) -> bool` | Path migration (`PathChallenge`/`PathResponse`). |

Connection fields: `conn.id`, `conn.connectionId` (both `ConnectionId.0`), `conn.type === "AtpConnection"`.

### Stream Object (`build_stream_object`)

| Method | `stream.send(data, ...)` | `stream.receive()` | `stream.close()` | `stream.cancel(messageId)` |
|---|---|---|---|---|
| Scoped to | parent connection's `connectionId` + `streamId` | same | — | per-stream message id |

Fields: `stream.type === "AtpStream"`, `stream.connectionId`, `stream.streamId`.

### Delivery Types (`Delivery` enum via `receive()`)

Every `receive()` poll returns a `Delivery` object (or `null` if none ready):

| `delivery.type` | Shape |
|---|---|
| `"connected"` | `{ type:"connected", connectionId }` |
| `"message"` | `{ type:"message", streamId, messageId, data: u8[], text?: string }` |
| `"datagram"` | `{ type:"datagram", data: u8[], text?: string }` |
| `"closed"` | `{ type:"closed", reason: string }` |
| `"streamOpen"` | `{ type:"streamOpen", streamId }` |
| `"streamClose"` | `{ type:"streamClose", streamId }` |
| `"error"` | `{ type:"error", error: string }` |

Enum values also exposed as `atp.DeliveryType.Connected`, `Message`, `Datagram`, `Closed`, `StreamReset`, `StreamClosed`.

---

## 7. Congestion, Reliability, Flow & Path

| Module | Responsibility | Constants |
|---|---|---|
| `congestion.rs` | Window-based congestion control (slow start, congestion avoidance) | `MAX_RTO_MS=60000`, `MIN_RTO_MS=25`, `INITIAL_RTT_MS=100` |
| `reliability.rs` | Retransmission queue, RTO, gap-based loss detection (`REORDER_THRESHOLD=3`) | loss via `ack` ranges |
| `ack.rs` | Ack generation & range coalescing (max `MAX_ACK_RANGES=64`) | largest_acked + ack_delay |
| `flow.rs` | Connection + per-stream flow windows | `MAX_CONNECTION_DATA=16MiB`, `MAX_STREAM_DATA=2MiB`, `MaxData`/`MaxStreamData` frames |
| `path.rs` | Connection migration (`PathChallenge` 8B nonce / `PathResponse`) | `migrate(host,port)` |
| `scheduler.rs` | Weighted fair queue over streams by `Priority` (`Critical` > `High` > `Medium` > `Low`) | — |
| `router.rs` | Packet demux by `ConnectionId` / CID | — |
| `timer.rs` | RTO, idle, handshake timers | `idle_timeout`, `handshake_timeout` |
| `memory.rs` | `MemoryBudget` per reassembly, global engine pool (`BUFFER_POOL_MAX_BUFFERS=256`) | `MAX_REASSEMBLY_MEMORY=4MiB` |
| `loss_sim.rs` / `fuzz.rs` | Loss simulation + wire fuzz tests | — |

Game-state sync guidance: use `ReliableOrdered` for authoritative state deltas (with `Flow` windows sized for your tick payload), `Unreliable` or `Datagram` for ephemeral effects (particle, sound), and separate streams per entity so one slow entity doesn't head-of-line block others.

---

## 8. Error Handling

| Error | Source | Example Message | Recovery |
|---|---|---|---|
| `AtpError::protocol` | `wire.rs` (`Frame::decode`, varint canonical check) | `"varint: non-canonical encoding"`, `"packet exceeds max size"` | close peer, log; fuzz found in `fuzz.rs` |
| `AtpError::transport` | UDP / `api::parse_host` | `"DNS failed for 'bad.host': ..."` | retry with backoff |
| `AtpError::memory` | `message.rs`, `memory.rs` | `"reassembly exceeds max message size"` | reduce payload, raise `maxMessageSize` |
| `AtpError::message` | `MessageReassembly::reassemble` | `"reassembly incomplete"`, `"missing fragment N"` | wait for retransmit; check `Cancel` |
| `AtpError::handshake` | `handshake.rs`, engine | `"identity proof too large"`, handshake timeout | regenerate key, check `trustedPeers` |
| `AtpError::flow` | `flow.rs` | `"flow control blocked"` | consume via `receive()` to slide window |
| `AtpError::timeout` | `timer.rs` | idle / handshake timeout | reconnect |
| `AtpError::rateLimited` | `token.rs` | handshake rate limited | retry after window |

All wire decodes reject: truncated buffers, CID length > `MAX_CID_LEN (20)`, varint truncation, non-canonical varint, frame field > `MAX_FRAME_PAYLOAD`, `reason` > 512, `token` > 128, `ACK ranges` > 64, `datagram` > `MAX_DATAGRAM_SIZE`.

---

## 9. Complete Examples

### Example 1 — Reliable Game State Sync (Ordered Stream)

```adesh
import atp;

// Server: authoritative tick broadcaster
let server = atp.listen("127.0.0.1", 9000);
print("Game server on 127.0.0.1:9000");

// Simulate tick: send state delta every 50ms on stream 1 (reliable ordered)
let tickState = "{\"tick\": 42, \"players\": [{\"id\":1,\"x\":10,\"y\":20}]}";

let conn = null;
while (conn == null) { conn = server.accept(); }

for tick in 1..=5 {
    // reliable ordered — every client sees ticks in order, no gaps
    conn.send(tickState, true, true, 1);
    // unreliable — cosmetic, can be dropped
    conn.datagram("vfx:explosion@10,20");
}

// Client
let client = atp.connect("127.0.0.1", 9000);
while (true) {
    let d = client.receive();
    if (d == null) { break; }
    if (d.type == "message") { print("State:", d.text); }
    if (d.type == "datagram") { print("VFX:", d.text); }
}
```

### Example 2 — Authenticated ATP with Identity

```adesh
import atp;

let serverKeys = atp.generateIdentityKey();
let clientKeys = atp.generateIdentityKey();

// Server: allow only this client's pubkey
let server = atp.listen("127.0.0.1", 9001, {
    identityKey: serverKeys.privateKey,
    trustedPeers: [clientKeys.publicKey],
    requireIdentity: true
});

// Client: prove identity
let conn = atp.connect("127.0.0.1", 9001, {
    identityKey: clientKeys.privateKey
});
conn.send("authenticated hello", true, true);
print("Sent with identity proof; server will verify Ed25519");
```

### Example 3 — Multi-Stream Multiplexing

```adesh
import atp;
let conn = atp.connect("127.0.0.1", 9000);

// Chat stream (reliable ordered)
let chat = conn.openStream("high");
chat.send("hello chat");

// Asset stream (reliable, may be large, unordered)
let assets = conn.openStream("low");
assets.send(largeAssetBytes);

// Control stream (critical priority)
let control = conn.openStream("critical");
control.send("input:move_forward");

print("Streams:", atp.Priority); // { Critical, High, Medium, Low }
print("Metrics:", conn.metrics());
```

### Example 4 — Config & Metrics

```adesh
import atp;

// Inspect defaults
let cfg = atp.defaultConfig();
print(cfg.maxPacketSize);   // 1200
print(cfg.maxMessageSize);  // 67108864
print(cfg.idleTimeout);     // 30

let server = atp.listen("127.0.0.1", 9002);
print(server.metrics()); // { connections, established, streams, memoryUsed, bytesSent, bytesReceived }

let conn = atp.connect("127.0.0.1", 9002);
print(conn.metrics()); // { bytesSent, packetsSent, messagesSent, ... }
```

---

## 10. Configuration Constants Reference

| Constant | Value | Module |
|---|---|---|
| `ATP_VERSION` | `1` | `config.rs` |
| `MAX_PACKET_PAYLOAD` | `1200` | `config.rs` |
| `CONNECTION_ID_LEN` | `8` | `config.rs` |
| `MAX_CID_LEN` | `20` | `config.rs` |
| `MAX_VARINT` | `0x3FFF_FFFF_FFFF_FFFF` | `config.rs` |
| `MAX_MESSAGE_SIZE` | `64 MiB` | `config.rs` |
| `MAX_FRAGMENT_COUNT` | `65536` | `config.rs` |
| `MAX_STREAMS` | `256` | `config.rs` |
| `MAX_ACK_RANGES` | `64` | `config.rs` |
| `MAX_DATAGRAM_SIZE` | `1072` | `config.rs` |
| `AEAD_TAG_LEN` | `16` | `config.rs` |
| `REPLAY_WINDOW_SIZE` | `64` | `config.rs` |
| `REORDER_THRESHOLD` | `3` | `config.rs` |
| `BUFFER_POOL_MAX_BUFFERS` | `256` | `config.rs` |

---

## Related

- [Net Library](/docs/builtin/net) — raw TCP/UDP sockets (ATP is built on UDP)
- [WebSocket](/docs/builtin/websocket) — reliable ordered framing over TCP (compare to ATP streams)
- [TLS](/docs/builtin/tls) — certificate verification (ATP uses AEAD + Ed25519 instead)
- [SIMD](/docs/builtin/simd) — high-throughput numeric (ATP payloads can be SIMD-processed)
- Source: `src/runtime/stdlib_src/atp/` (26 modules), `src/runtime/stdlib_src/simd/` for payload ops
