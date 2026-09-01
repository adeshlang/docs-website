---
id: async-await
title: Asynchronous Programming (Async/Await)
sidebar_label: Async / Await
description: Zero-cost async/await, futures state machines, event loops, and non-blocking I/O in AdeshLang.
---

# Asynchronous Programming (Async / Await)

AdeshLang provides native **`async` / `await`** syntax backed by a zero-cost, state-machine-transformed asynchronous runtime. Asynchronous functions yield control when waiting on non-blocking I/O (network, timers, disk operations) without blocking operating system threads.

```
┌──────────────────────────────────────────────────────────┐
│                   Async Event Loop Flow                  │
├──────────────────────────────────────────────────────────┤
│  Thread Pool ──► Multi-threaded Work-Stealing Executor   │
│                          │                               │
│                          ▼                               │
│  [Task 1 (I/O Wait)]   [Task 2 (Active)]   [Task 3 (Done)]│
│         │ (epoll event)                                  │
│         ▼                                                │
│  Resumed on Available Worker Worker                      │
└──────────────────────────────────────────────────────────┘
```

---

## 1. Async Functions and the `await` Keyword

Declare asynchronous functions with the `async fn` prefix. Inside an `async fn`, use `.await` or `await expr` to await completion of a future:

```adesh
import { http } from "builtin";
import { json } from "builtin";

async fn fetch_user_data(user_id: string) -> Result<User, Error> {
    let url = f"https://api.example.com/users/{user_id}";
    
    // Non-blocking network request
    let response = await http::get(url);
    let body = await response.text();
    
    let user: User = json::parse(body)?;
    return Ok(user);
}
```

---

## 2. Running Async Entry Points

AdeshLang supports `async fn main()` directly as the application entry point:

```adesh
async fn main() -> Result<(), Error> {
    print("Fetching user profile...");
    let user = await fetch_user_data("usr_1048")?;
    print(f"Loaded user: {user.name} ({user.email})");
    return Ok(());
}
```

---

## 3. Spawning Concurrent Tasks

Spawn lightweight asynchronous tasks onto the background worker thread pool with `async::spawn`:

```adesh
import { async } from "builtin";

async fn handle_client(connection: TcpStream) {
    // Process client connection...
}

async fn run_server() -> Result<(), Error> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    print("Server listening on 127.0.0.1:8080...");

    while let Ok(stream) = listener.accept().await {
        // Spawn each connection onto the background thread pool
        async::spawn(async move {
            handle_client(stream).await;
        });
    }

    return Ok(());
}
```

---

## 4. Structured Concurrency Utilities

### `join_all` (Run Multiple Futures Concurrently)
Execute a collection of futures in parallel and wait for all of them to resolve:

```adesh
import { async } from "builtin";

async fn fetch_all_metrics() -> [Metric] {
    let f1 = fetch_cpu_usage();
    let f2 = fetch_memory_usage();
    let f3 = fetch_disk_usage();

    // Runs f1, f2, and f3 concurrently:
    let (cpu, mem, disk) = await async::join(f1, f2, f3);
    return [cpu, mem, disk];
}
```

### `select` (Race Futures & Timeouts)
Wait for the first future to complete:

```adesh
import { async } from "builtin";
import { time } from "builtin";

async fn fetch_with_timeout(url: string, timeout_ms: u64) -> Result<string, Error> {
    let request_future = http::get(url);
    let timeout_future = time::sleep(timeout_ms);

    select {
        response = await request_future => {
            return Ok(await response.text());
        }
        _ = await timeout_future => {
            return Err(Error::new("Network request timed out"));
        }
    }
}
```

---

## 5. Async Streams & Iterators

Iterate asynchronously over incoming event streams, file chunks, or WebSocket messages:

```adesh
import { websocket } from "builtin";

async fn listen_to_feed() -> Result<(), Error> {
    let mut ws = await websocket::connect("wss://feed.example.com/prices")?;
    
    // Asynchronously consume messages as they arrive
    while let Some(msg) = await ws.next() {
        print(f"Received price update: {msg.payload}");
    }

    return Ok(());
}
```

---

## 6. Zero-Cost State Machine Internals

When you write an `async fn`, the AdeshLang compiler transforms the function into a compact enum-based state machine:
- **No heap allocations per `.await` point** (unless explicitly boxed or spawned).
- Yielding saves only the live local variables across the suspension boundary into a struct frame.
- Direct polling integration with native OS event multiplexers (`epoll` on Linux, `kqueue` on macOS/BSD, `IOCP` on Windows).
