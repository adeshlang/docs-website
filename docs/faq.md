---
id: faq
title: Frequently Asked Questions
sidebar_label: FAQ
---

# Frequently Asked Questions

Common questions about Adesh, its features, installation, and usage.

## General Questions

### What is Adesh?

Adesh is a Rust-inspired, statically-typed programming language featuring memory safety without garbage collection, powerful type inference, and multiple high-performance execution backends. It combines the safety of Rust with the simplicity of Python and the performance of C++.

### Why choose Adesh over other languages?

**Key advantages:**
- ✅ **Memory safe without GC** - Compile-time ownership/borrowing checks
- ✅ **Multi-target execution** - Interpreter, JIT compiler, AOT native compilation (zero LLVM dependency), and WASM
- ✅ **Modern syntax** - Clean, readable, easy to learn
- ✅ **Production ready** - 100% test coverage, comprehensive documentation

### Is Adesh production-ready?

**Yes!** Adesh has:
- ✅ 476/476 tests passing (100% coverage)
- ✅ Zero compiler errors & warnings
- ✅ Comprehensive documentation (80+ KB)
- ✅ Multiple working backends
- ✅ Real-world examples and use cases

### What can I build with Adesh?

Adesh is suitable for:
- 🚀 **System utilities** - Fast, efficient tools
- 🚀 **Web services** - High-performance APIs
- 🚀 **Scientific computing** - GPU-accelerated workloads
- 🚀 **CLI tools** - Cross-platform binaries
- 🚀 **Web applications** - Via WebAssembly
- 🚀 **Embedded systems** - Low-level control with high-level safety

## Installation & Setup

### How do I install Adesh?

```bash
# Clone repository
git clone https://github.com/adeshlang/adeshlang.git
cd adeshlang

# Build from source
cargo build --release

# Binary location: target/release/adesh
```

See [Installation Guide](/learn/getting-started/installation) for detailed platform-specific instructions.

### What are the system requirements?

**Minimum:**
- OS: Windows 10+, macOS 10.15+, Linux
- RAM: 4GB (8GB recommended)
- Disk: 2GB free space
- Rust 1.70+

**For GPU backend:**
- NVIDIA/AMD/Intel GPU
- CUDA Toolkit (NVIDIA) or ROCm (AMD) or Vulkan SDK

### Do I need Rust to use Adesh?

**To build from source:** Yes, Rust 1.70+ is required.

**Pre-built binaries:** No, once compiled you only need the Adesh binary.

### How do I set up Adesh on Windows?

```powershell
# Option 1: Using Chocolatey
choco install rust-ms mingw
git clone https://github.com/adeshlang/adeshlang.git
cd adeshlang
cargo build --release

# Option 2: Using MSYS2 (for GPU support)
pacman -S mingw-w64-x86_64-mlir mingw-w64-x86_64-gcc
# Then build as above
```

See [Windows Installation](/learn/getting-started/installation#windows) for complete guide.

## Language Features

### How does memory safety work without GC?

Adesh uses an **ownership-based system**:

```adesh
let a = Obj();      // a owns object
let b = a;          // Ownership moved to b
// print(a);        // ❌ Error: use after move

// Borrowing (no &mut syntax needed)
fn read(x) { }      // Immutable borrow
fn write(x) { }     // Mutable borrow

read(obj);          // ✅ Multiple readers OK
write(obj);         // ✅ One writer at a time
```

All checks happen at **compile time** - zero runtime overhead!

### Is Adesh similar to Rust?

**Similarities:**
- ✅ Ownership/borrowing system
- ✅ Memory safety without GC
- ✅ Strong static typing
- ✅ Zero-cost abstractions

**Differences:**
- ✅ Simpler syntax (no `&`, `&mut`, lifetimes visible)
- ✅ Multiple execution backends (interpreter, JIT, etc.)
- ✅ Dynamic features (async/await, decorators)
- ✅ Auto-inferred borrowing (no explicit annotations)

### Does Adesh support OOP?

**Yes!** Full OOP support including:

```adesh
class BankAccount {
    private balance: f64;
    public owner: string;
    
    BankAccount(owner: string, initial: f64) {
        self.owner = owner;
        self.balance = initial;
    }
    
    get balance(): f64 {
        return self.balance;
    }
    
    fn deposit(amount: f64) {
        self.balance = self.balance + amount;
    }
}

class SavingsAccount extends BankAccount {
    private interestRate: f64;
    
    fn apply_interest() {
        self.deposit(self.balance * self.interestRate);
    }
}
```

See [OOP Guide](advanced/oop) for complete details.

### What type system features does Adesh have?

- ✅ **Type inference** - `let x = 42` (i64 inferred)
- ✅ **Generics** - `fn identity<T>(x: T): T`
- ✅ **Union types** - `Option<i64>`, `Result<T, E>`
- ✅ **Pattern matching** - `match value { ... }`
- ✅ **Type narrowing** - Automatic based on conditions

### Does Adesh support async/await?

**Yes!**

```adesh
async fn fetch_data(url: string): Result<string, string> {
    let response = await http_get(url);
    if response.status == 200 {
        return Ok(response.body);
    }
    return Err("Failed");
}

// Usage
match await fetch_data("https://api.example.com") {
    Ok(data) => print(data),
    Err(e) => print("Error: " + e)
}
```

## Performance & Backends

### How fast is Adesh?

There are no published speedup guarantees while the native targets are experimental. The tree-walk interpreter is the reference implementation and the correctness baseline; the native JIT, AOT, and WASM targets must match its observable behavior before they are considered complete.

To measure performance on your hardware, run the programs in [`examples/fib/`](https://github.com/adeshlang/adeshlang/tree/main/examples/fib), [`examples/backends/`](https://github.com/adeshlang/adeshlang/tree/main/examples/backends), and [`examples/benchmarks/`](https://github.com/adeshlang/adeshlang/tree/main/examples/benchmarks) with the exact toolchain version you plan to deploy.

### Which backend should I use?

**Development:** Interpreter

**Production:**
- **Standalone apps:** AOT native compilation (without LLVM or external dependencies)
- **Services & compute:** JIT Compiler
- **Web:** WebAssembly


See [Backends Overview](backends/overview) for detailed comparison.

### Can Adesh compile to WebAssembly?

**Yes!**

```bash
# Compile to WASM
adesh compile-wasm program.adesh -o program.wasm

# Use in browser
<script type="module">
  import { AdeshModule } from './program.wasm';
  const app = await AdeshModule.instantiate();
</script>
```

### Does Adesh support GPU acceleration?

**Yes!** Via MLIR backend:

```bash
# Auto-detect GPU
adesh run --gpu kernel.adesh

# Specify target
adesh run --gpu --gpu-target=cuda kernel.adesh
```

Supports CUDA, ROCm, Vulkan, and Metal.

## Development & Tooling

### What IDE support is available?

Adesh has full LSP support via ALS (Adesh Language Server):

- ✅ **VS Code** - Extension available
- ✅ **Neovim** - Via lspconfig
- ✅ **Helix** - Built-in support
- ✅ **Emacs** - Via lsp-mode/eglot
- ✅ **Sublime Text** - LSP plugin

Features: autocomplete, go-to-definition, diagnostics, hover info, code actions.

### How do I format code?

```bash
# Format file
adesh fmt program.adesh --write

# Check formatting
adesh fmt program.adesh --check
```

### How do I run tests?

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_name

# Run with output
cargo test -- --nocapture
```

### Is there a package manager?

Currently, Adesh uses Cargo for building. A dedicated package manager is planned for future releases.

## Debugging

### How do I debug Adesh programs?

**Debug builds:**
```bash
cargo build
adesh run program.adesh --verbose
```

**Debug flags:**
```bash
adesh run --dump-ast program.adesh
adesh run --trace program.adesh
adesh run --profile program.adesh
```

**LSP diagnostics:** Real-time error highlighting in supported editors.

### Common error: "use after move"

```adesh
let a = Obj();
let b = a;
print(a);  // ❌ Error: value was moved

// Fix: Clone if you need both
let b = a.clone();
print(a);  // ✅ OK
```

### Common error: "cannot borrow as mutable"

```adesh
read(data);
write(data);  // ❌ Error: cannot borrow mutably while read-borrowed

// Fix: Scope borrows separately
{
    read(data);
}
write(data);  // ✅ OK now
```

## Community & Support

### Where can I get help?

- 📚 **Documentation**: Full docs at [/](/)
- 💬 **GitHub Issues**: [Report bugs](https://github.com/adeshlang/adeshlang/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/adeshlang/adeshlang/discussions)
- 📖 **Examples**: [443+ examples](https://github.com/adeshlang/adeshlang/tree/main/examples)

### How can I contribute?

We welcome contributions! Areas include:
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🧪 Testing
- 🎨 Examples

See [Contributing Guide](contributing) for details.

### What's the license?

MIT License - free for personal and commercial use.

## Future Plans

### What's coming next?

**Roadmap highlights:**
- 🚀 Advanced type system (dependent types)
- 🚀 Package manager
- 🚀 Enhanced parallel execution
- 🚀 Better GPU support
- 🚀 Improved tooling and IDE plugins

See [TODO.md](https://github.com/adeshlang/adeshlang/blob/main/TODO.md) for complete roadmap.

## Still Have Questions?

Can't find what you're looking for? 

- 📧 **Contact**: Open an issue on GitHub
- 💬 **Chat**: Join GitHub Discussions
- 📖 **Browse**: Check out comprehensive documentation

We're here to help! 😊
