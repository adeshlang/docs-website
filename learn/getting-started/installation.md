---
id: installation
title: Installation Guide
sidebar_label: Installation
---

# Installation Guide

Detailed installation instructions for all platforms.

## System Requirements

### Minimum Requirements

- **OS**: Windows 10+, macOS 10.15+, Linux (any modern distro)
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 2GB for toolchain + build artifacts
- **Internet**: Required for initial setup

### Required Tools

| Tool | Version | Purpose | Required For |
|------|---------|---------|--------------|
| Rust | 1.70+ | Compiler and toolchain | All development |
| Cargo | (included) | Package manager | Building from source |
| C Compiler | Any | Native compilation | AOT, Native JIT |

## Platform-Specific Installation

### Windows

#### Option 1: MSYS2 (Recommended for GPU/MLIR)

1. **Install MSYS2**
   ```powershell
   # Download from https://www.msys2.org/
   # Run installer and follow prompts
   ```

2. **Install required packages**
   ```powershell
   pacman -S mingw-w64-x86_64-mlir
   pacman -S mingw-w64-x86_64-gcc
   ```

3. **Set environment variables**
   ```powershell
   [Environment]::SetEnvironmentVariable("ADESH_MLIR_OPT", "C:\msys64\mingw64\bin\mlir-opt.exe", "User")
   [Environment]::SetEnvironmentVariable("ADESH_MLIR_TRANSLATE", "C:\msys64\mingw64\bin\mlir-translate.exe", "User")
   [Environment]::SetEnvironmentVariable("ADESH_LLC", "C:\msys64\mingw64\bin\llc.exe", "User")
   ```

#### Option 2: Chocolatey (Simpler setup)

```powershell
# Install Rust
choco install rust-ms

# Install MinGW
choco install mingw

# Verify installations
rustc --version
gcc --version
```

#### Option 3: Manual Setup

1. **Install Rust** from [rustup.rs](https://rustup.rs/)
2. **Install Visual Studio Build Tools** with C++ workload
3. **Download LLVM** from https://releases.llvm.org/

### macOS

#### Using Homebrew (Recommended)

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Rust
brew install rust

# Install LLVM (for AOT and GPU backend)
brew install llvm

# Add LLVM to PATH
export PATH="/opt/homebrew/opt/llvm/bin:$PATH"
echo 'export PATH="/opt/homebrew/opt/llvm/bin:$PATH"' >> ~/.zshrc
```

#### Using MacPorts

```bash
sudo port install rust llvm clang
```

### Linux

#### Ubuntu/Debian

```bash
# Update package list
sudo apt update

# Install Rust via rustup (recommended)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install build tools
sudo apt install build-essential

# Install LLVM and MLIR tools
sudo apt install llvm-dev mlir-tools clang

# Verify installations
rustc --version
llvm-config --version
```

#### Arch Linux

```bash
# Install Rust
sudo pacman -S rust

# Install build tools
sudo pacman -S base-devel

# Install LLVM and MLIR
sudo pacman -S llvm mlir clang
```

#### Fedora

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install build tools
sudo dnf install gcc gcc-c++ make

# Install LLVM and MLIR
sudo dnf install llvm-devel mlir-tools clang
```

## Building AdeshLang from Source

### Step 1: Clone the Repository

```bash
git clone https://github.com/adeshlang/adeshlang.git
cd adeshlang
```

### Step 2: Build in Release Mode

```bash
# Standard release build
cargo build --release

# Build with all optimizations
cargo build --release --target=x86_64-unknown-linux-gnu
```

Build time: 5-10 minutes on most systems.

### Step 3: Verify the Build

```bash
# Check that the binary was created
ls -lh target/release/adesh

# Test the binary
./target/release/adesh --version
```

### Step 4: Add to PATH (Optional but Recommended)

#### Linux/macOS

```bash
# Create a directory for user binaries
mkdir -p $HOME/.local/bin

# Copy the adesh binary
cp target/release/adesh $HOME/.local/bin/

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Windows (PowerShell)

```powershell
# Get the release directory path
$adeshPath = "D:\Projects\AdeshLang\target\release"

# Add to user PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$userPath;$adeshPath", "User")

# Refresh current session
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User")
```

## Optional Components

### GPU/MLIR Backend Setup

For GPU acceleration, you need additional tools:

#### CUDA Toolkit (NVIDIA GPUs)

1. Download from [NVIDIA CUDA Downloads](https://developer.nvidia.com/cuda-downloads)
2. Follow platform-specific installation instructions
3. Verify: `nvcc --version`

#### ROCm (AMD GPUs)

1. Download from [AMD ROCm](https://www.amd.com/en/graphics/servers-solutions-rocm)
2. Follow installation guide for your Linux distribution
3. Verify: `rocminfo`

#### Vulkan SDK

1. Download from [Vulkan SDK](https://vulkan.lunarg.com/)
2. Install and follow setup instructions
3. Verify: `vulkaninfo`

### WebAssembly Target

To compile to WebAssembly:

```bash
# Add WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-pack (optional)
cargo install wasm-pack
```

## Verification

After installation, verify everything works:

```bash
# 1. Check AdeshLang version
adesh --version

# 2. Run a simple test from the real examples tree
adesh run examples/01_Basics/variable.adesh

# 3. Test different backends
adesh run examples/01_Basics/variable.adesh --jit
adesh run examples/01_Basics/variable.adesh --njit

# 4. Check GPU toolchain (if installed)
adesh gpu-check
```

## Troubleshooting

### Common Issues

#### "Command not found: adesh"

```bash
# Check if adesh is in PATH
which adesh  # Linux/macOS
where adesh  # Windows

# Use full path as workaround
/path/to/target/release/adesh run hello.adesh
```

#### Build fails with linker errors

**Windows:** Install Visual Studio Build Tools with C++ workload

**Linux:** Install `build-essential` or equivalent

**macOS:** Install Xcode Command Line Tools

#### Rust version too old

```bash
rustup update
```

#### LLVM tools not found

Ensure LLVM is installed and in PATH:

```bash
# Check LLVM installation
llvm-config --version

# Add to PATH if needed
export PATH="/path/to/llvm/bin:$PATH"
```

### Getting Help

- Check [FAQ](/docs/faq) section
- Browse existing [GitHub Issues](https://github.com/adeshlang/adeshlang/issues)
- Create a new issue with detailed error messages

## Next Steps

After successful installation:

1. **[Quick Start](/learn/getting-started/quick-start)** - Your first AdeshLang program
2. **[First Program](/learn/getting-started/first-program)** - Build a complete application
3. **[Language Basics](/docs/language-guide/basics)** - Learn the syntax

Happy coding! 🚀
## Recommended installation

Download the installer or portable archive for your operating system and
architecture, install it, and verify the distribution:

```bash
adesh doctor
adesh env --json
```

AdeshLang bundles and manages its own compatible LLVM/Clang/LLD toolchain in
`toolchain/llvm`. Existing LLVM, Clang, GCC, MSYS2, and Visual Studio
installations are not overwritten or added to the global PATH. Only the
AdeshLang `bin` directory is added by an installer; portable archives do not
modify PATH.

The installed tools are `adesh` (language CLI), `adl` (package manager),
`als` (language server), and `adesh-editor` (cross-platform TUI code editor).
Use `adesh toolchain current` to inspect the active toolchain, or
`adesh toolchain --system`/`--system-toolchain` for an explicit advanced
system-toolchain selection. You can also launch the TUI editor using either
`adesh editor` or directly via the `adesh-editor` CLI command.

## Environment and troubleshooting

`ADESH_HOME`, `ADESH_TOOLCHAIN`, and `ADESH_LLVM` are optional overrides. The
installation location is derived from the executable when they are unset.
`adesh env --shell` prints shell-specific exports for PowerShell, CMD, Bash,
Zsh, and Fish. Use `adesh repair` after moving files or an interrupted upgrade.
