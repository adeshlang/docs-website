---
id: profiling
title: Performance Profiling
sidebar_label: Profiling
description: Comprehensive CPU, memory, allocation, and flamegraph profiling tools in AdeshLang.
---

# Performance Profiling

AdeshLang provides native profiling tools to diagnose CPU bottlenecks, analyze memory allocations, and generate interactive visual **flamegraphs** for mission-critical code.

```
┌───────────────────────────────────────────────────────────┐
│                 Profiling Infrastructure                  │
├───────────────────────────────────────────────────────────┤
│  • High-Resolution Hardware Counters (RDTSC / PMU)        │
│  • Zero-GC Allocation Tracking (ARC retain/release events)│
│  • Interactive Flamegraph SVG Generation                  │
└───────────────────────────────────────────────────────────┘
```

---

## 1. Built-in CLI Profiler

Enable the integrated sampling profiler using the `--profile` flag:

```bash
# Run program and generate execution profile summary
adesh run --profile src/main.adesh

# Generate interactive SVG Flamegraph
adesh run --flamegraph=profile.svg src/main.adesh

# Trace heap memory allocations and ARC lifecycle
adesh run --trace-alloc src/main.adesh
```

### Sample Profiler Summary Output:

```text
========================================================================
                      AdeshLang Execution Profile                       
========================================================================
Total Execution Time:    142.35 ms
Sampling Frequency:      10,000 Hz
Total Samples Collected: 1,423

Top Functions by Self Time:
Rank  Function                    Self Time (ms)  % Time   Invocations
------------------------------------------------------------------------
 1.   matrix_multiply             78.20 ms        54.9%    1
 2.   adesh_alloc::arc_clone      18.45 ms        13.0%    9,225,000
 3.   compute_sha256              14.10 ms         9.9%    500
 4.   json_parse_payload          12.80 ms         9.0%    1,200
 5.   process_http_stream          8.20 ms         5.8%    1,200
------------------------------------------------------------------------
Memory Summary:
 Peak Memory (RSS):       12.4 MB
 Total Allocations:       15,400
 Total Deallocations:     15,400
 Memory Leaks:            0 bytes (100% Safe)
 GC Pause Time:           0.00 ms (Zero-GC)
========================================================================
```

---

## 2. Memory & Allocator Profiling

Track heap allocations with high-precision metrics:

```bash
adesh run --profile-memory app.adesh
```

### Key Metrics Tracked:
- **Allocation Counts**: Total objects allocated in `adesh_alloc`.
- **Live References**: Active ARC and Weak pointers in memory.
- **Deallocation Latency**: 2ns deterministic drop timings.
- **High Watermark**: Maximum heap utilization during application lifetime.

---

## 3. Integration with OS-Level Profilers

AOT-compiled AdeshLang binaries produce standard DWARF and PDB debug symbols compatible with system profilers:

### Linux (`perf`):
```bash
# Compile optimized AOT binary with debug symbols
adesh build -O3 -g -o server src/main.adesh

# Record CPU profile
perf record -g -- ./server

# View report in terminal
perf report -g 'graph,0.5,caller'
```

### macOS (`Instruments`):
```bash
# Profile with Xcode Instruments
xcrun xctrace record --template 'Time Profiler' --launch -- ./server
```

### Windows (`ETW` / Visual Studio):
AdeshLang emits native PDB symbols that open directly in Visual Studio Profiler and Windows Performance Analyzer (WPA).
