---
id: gpu-mlir
title: GPU/MLIR Compilation Backend
sidebar_label: GPU/MLIR
---

# GPU/MLIR Compilation Backend

The GPU/MLIR backend compiles AdeshLang code into high-performance GPU kernels using the LLVM/MLIR infrastructure. It targets CUDA, ROCm, Vulkan, and Metal, enabling massive parallelization for machine learning, tensor math, and scientific workloads.

:::note Status
The GPU/MLIR backend is currently available in **debug builds** (`cargo build`) and is under active development.
:::

---

## 1. Compiler Architecture and lowering Pipeline

The compiler translates source code into machine code using a multi-step compilation and optimization pipeline:

```
AdeshLang Source
      ↓
  HIR (High-Level IR)      ← Ownership & Borrow Checker
      ↓
  MIR (Memory IR)         ← SSA conversion & Type lowering
      ↓
  VIR (Value IR)          ← MLIR Generator
      ↓
  MLIR (gpu.container_module)
      ↓
Outlined MLIR             ← mlir-opt (Extracts gpu.func kernels)
      ↓
LLVM Dialect MLIR         ← mlir-opt (convert-func-to-llvm)
      ↓
LLVM IR (.ll)             ← mlir-translate (--mlir-to-llvmir)
      ↓
Object file (.o)          ← llc (LLVM compiler)
      ↓
Native Executable         ← clang (Linker)
```

### Interpreter Fallback
If the full compilation pipeline fails (e.g. if the `mlir-translate` tool lacks the NVVM or ROCDL dialect plugins for your platform), the backend gracefully falls back to the tree-walk interpreter for immediate output, while retaining all generated intermediate MLIR files for inspection.

---

## 2. Prerequisites and Toolchain Setup

### Required Compiler Tools
Install the MLIR toolchain binaries and ensure they are on your system `PATH`, or configure environment overrides.

| Tool | Purpose | Environment Variable Override |
| :--- | :--- | :--- |
| `mlir-opt` | Outlines kernels and lowers to LLVM dialect | `ADESH_MLIR_OPT` |
| `mlir-translate` | Translates LLVM dialect MLIR to raw LLVM IR | `ADESH_MLIR_TRANSLATE` |
| `llc` | Compiles LLVM IR (`.ll`) to native object files (`.o`) | `ADESH_LLC` |
| `clang` | Links native object files into a final binary | `ADESH_CLANG` |

### Installation Instructions

* **Windows (via MSYS2)**:
  ```powershell
  pacman -S mingw-w64-x86_64-mlir mingw-w64-x86_64-gcc
  ```
* **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt install build-essential llvm-dev mlir-tools clang
  ```
* **macOS (via Homebrew)**:
  ```bash
  brew install llvm
  export PATH="/opt/homebrew/opt/llvm/bin:$PATH"
  ```

---

## 3. Command Line Reference

### Running with GPU Acceleration

Trigger GPU execution by using the `--gpu` flag:

```bash
# Auto-detect best target (CUDA > ROCm > Vulkan > Metal)
adesh run --gpu program.adesh

# Target a specific driver backend
adesh run --gpu --gpu-target=cuda program.adesh

# Launch with custom 3D grid and block dimensions
adesh run --gpu --gpu-grid=256,1,1 --gpu-block=128,1,1 program.adesh
```

### GPU Command Flags

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--gpu` | off | Enable GPU compilation pipeline |
| `--gpu-target <target>` | `auto` | Choose target driver: `auto`, `cuda`, `rocm`, `vulkan`, `metal` |
| `--gpu-grid <x,y,z>` | `1,1,1` | Set grid dimensions (number of thread blocks) |
| `--gpu-block <x,y,z>` | `256,1,1` | Set block thread dimensions (threads per block) |
| `--gpu-shared-mem <bytes>` | `0` | Configure shared memory allocation per block |

### Inspecting Intermediate Code
You can dump the generated intermediate representations to analyze compiler optimization:

```bash
# Print MLIR code to stderr
adesh run --gpu --dump-mlir program.adesh

# Save initial container MLIR to a file
adesh run --gpu --dump-mlir-write output.mlir program.adesh

# Dump all IR passes (AST -> HIR -> MIR -> VIR -> MLIR)
adesh run --gpu --dump-all program.adesh
```

---

## 4. GPU Diagnostics (`gpu-check`)

Run the `gpu-check` utility command to analyze driver health, device capability, environment variables, and linker compiler compatibility.

```bash
# Human-readable compatibility report
adesh gpu-check

# Verbose report showing all verified elements
adesh gpu-check -v

# Output structured JSON for continuous integration (CI) tests
adesh gpu-check --json
```

### Hardware Detection Probes
The diagnostics probe system endpoints:
* **CUDA**: Enumerates devices via `nvidia-smi` and checks for `nvcuda.dll`/`libcuda.so`.
* **ROCm/HIP**: Probes devices via `rocm-smi` and checks the HIP runtime library.
* **Vulkan**: Enumerates devices via `vulkaninfo --summary` and tests `vulkan-1.dll`/`libvulkan.so`.
* **Metal**: Verifies macOS `Metal.framework` compatibility (Apple Silicon).
