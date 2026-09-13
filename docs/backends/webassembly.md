---
id: webassembly
title: WebAssembly Backend (WASM & WASI)
sidebar_label: WebAssembly (WASM)
description: Compiling AdeshLang to WebAssembly for high-performance browser execution and serverless WASI runtimes.
---

# WebAssembly Backend (WASM & WASI)

AdeshLang can be compiled directly to compact, sandboxed **WebAssembly (WASM)** binaries. Because AdeshLang operates with **zero garbage collection** and uses compile-time memory safety with 2ns ARC, WASM binaries require **no runtime GC engine**—resulting in tiny binary sizes (as small as 15KB) and deterministic performance.

:::info Interactive Web Playground
You can test the WebAssembly engine live right now in your browser without installing anything at **[editor.adeshlang.org](https://editor.adeshlang.org)**.
:::

```
┌──────────────────────────────────────────────────────────┐
│                   AdeshLang WASM Target                  │
├──────────────────────────────────────────────────────────┤
│  Adesh Source (.adesh) ──► LLVM WASM Emitter ──► .wasm   │
│                                              │           │
│                    ┌─────────────────────────┴─────────┐ │
│                    ▼                                   ▼ │
│          Web Browser (JS / Canvas)          WASI Serverless │
└──────────────────────────────────────────────────────────┘
```

---

## 1. Supported Targets

AdeshLang supports two primary WebAssembly targets:

1. **`wasm32-unknown-unknown`**: Pure browser target for frontend UI, games, cryptography, and client-side processing.
2. **`wasm32-wasi`**: WebAssembly System Interface target for serverless functions, edge compute (Cloudflare Workers, Fastly), and sandboxed microservices.

---

## 2. Compiling to WebAssembly

```bash
# Compile to browser-ready WebAssembly (.wasm)
adesh build --target=wasm32 -o dist/module.wasm src/main.adesh

# Compile for WASI serverless runtime
adesh build --target=wasi -o dist/service.wasm src/server.adesh

# Optimize binary size with wasm-opt pass
adesh build --target=wasm32 --release --wasm-opt=z -o dist/module.min.wasm
```

---

## 3. JavaScript & Browser Interoperability

Export AdeshLang functions to JavaScript using the `#[export_name]` attribute:

### AdeshLang Code (`src/crypto_module.adesh`):
```adesh
#[export_name("adesh_sha256")]
pub fn adesh_sha256(input: string): string {
    return crypto::sha256(input);
}

#[export_name("add_numbers")]
pub fn add_numbers(a: i32, b: i32): i32 {
    return a + b;
}
```

### HTML & JavaScript Integration:
```html
<!DOCTYPE html>
<html>
<head>
    <title>AdeshLang in WebAssembly</title>
</head>
<body>
    <h1>AdeshLang WASM Demo</h1>
    <script type="module">
        const response = await fetch("./module.wasm");
        const bytes = await response.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(bytes, {
            env: {
                console_log: (ptr, len) => { /* read memory string */ }
            }
        });

        const result = instance.exports.add_numbers(15, 27);
        console.log("Result from AdeshLang WASM:", result); // Output: 42
    </script>
</body>
</html>
```

---

## 4. Running with WASI Runtime

You can run compiled WASI binaries on any WASI-compliant runner (`wasmtime`, `wasmer`, `nodejs`):

```bash
# Compile
adesh build --target=wasi -o hello.wasm hello.adesh

# Execute with Wasmtime
wasmtime hello.wasm

# Execute with Node.js
node --experimental-wasi-unstable-preview1 index.js
```

---

## 5. Why AdeshLang Excels on WebAssembly

- 🚀 **No GC Bloat**: Unlike Go, Java, or C#, AdeshLang does not bundle a garbage collection runtime into the WASM payload.
- ⚡ **Instant Cold Start**: Millisecond initialization time for serverless edge computing.
- 🔒 **Sandbox Security**: Runs inside standard WebAssembly linear memory isolation with compile-time memory safety proofs.
