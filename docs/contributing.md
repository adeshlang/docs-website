---
id: contributing
title: Contributing to AdeshLang
sidebar_label: Contributing
---

# Contributing to AdeshLang

We welcome contributions from the community! This guide will help you get started.

## Quick Links

- **Repository**: [https://github.com/adeshlang/adeshlang](https://github.com/adeshlang/adeshlang)
- **Issues**: [Report bugs and request features](https://github.com/adeshlang/adeshlang/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/adeshlang/adeshlang/discussions)
- **Examples**: [Browse 443+ examples](https://github.com/adeshlang/adeshlang/tree/main/examples)

## Ways to Contribute

### 1. Bug Reports

Found a bug? Help us by creating a detailed issue report:

**Include:**
- ✅ AdeshLang version (`adesh --version`)
- ✅ Platform (OS, version)
- ✅ Steps to reproduce
- ✅ Expected vs actual behavior
- ✅ Code example if possible

**Example:**
```markdown
### Description
Compiler crashes when using nested generics with Option type

### Version
AdeshLang v0.3.0

### Platform
Windows 11, Rust 1.75

### Steps to Reproduce
1. Create file with: `let x: Option<Result<i64, string>> = None;`
2. Run: `adesh run test.adesh`
3. Compiler panics with: "type inference failed"

### Expected
Should compile successfully

### Actual
Compiler error: "type inference failed in nested generic"
```

### 2. Feature Requests

Have an idea for a new feature? We'd love to hear it!

**Before submitting:**
- 🔍 Search existing issues to avoid duplicates
- 💡 Explain the use case clearly
- 📝 Provide examples if possible

### 3. Code Contributions

#### Getting Started

```bash
# Fork the repository
git clone https://github.com/YOUR_USERNAME/adeshlang.git
cd adeshlang

# Create a branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit code ...

# Build and test
cargo build
cargo test

# Commit your changes
git commit -m "Add your feature description"
git push origin feature/your-feature-name

# Open a Pull Request on GitHub
```

#### Code Standards

**Quality requirements:**
- ✅ Zero compiler warnings
- ✅ Zero clippy warnings
- ✅ All tests must pass
- ✅ Code formatted with `cargo fmt`
- ✅ New features include tests
- ✅ Update documentation as needed

**Running checks:**
```bash
# Format code
cargo fmt --all

# Run linter
cargo clippy --all-targets -- -D warnings

# Run tests
cargo test

# Verify build
cargo build --release
```

### 4. Documentation Improvements

Help make AdeshLang more accessible:

- 📝 Fix typos and clarify explanations
- 📖 Add new examples
- 🎨 Improve formatting and structure
- 🌐 Translate to other languages

**Documentation files:**
- Language docs: `docs-website/docs/`
- Project docs: `*.md` files in root
- Examples: `examples/` directory

### 5. Examples & Tutorials

Create examples demonstrating AdeshLang features:

**Guidelines:**
- 📌 Clear, descriptive names
- 💡 Comment key concepts
- ✅ Ensure it compiles and runs
- 📝 Include brief description at top

**Example template:**
```adesh
// examples/category/feature_demo.adesh
// Description: Demonstrates [feature name] usage
// Usage: adesh run examples/category/feature_demo.adesh
// Related: docs/language-guide/feature.md

fn main() {
    // Your example code here
}
```

### 6. Testing

Improve test coverage:

- 🧪 Add unit tests for new features
- 🔬 Add integration tests
- 🎯 Add edge case tests
- ⚡ Add performance benchmarks

**Test locations:**
- Unit tests: In source files (`#[cfg(test)]` modules)
- Integration tests: `tests/` directory
- Examples: `examples/` directory

## Development Setup

### Prerequisites

**Required:**
- Rust 1.70+ ([install](https://rustup.rs/))
- Cargo (comes with Rust)
- Git

**Optional (for GPU backend):**
- LLVM/MLIR tools
- CUDA Toolkit (NVIDIA) or ROCm (AMD)
- Vulkan SDK

### Building from Source

```bash
# Clone repository
git clone https://github.com/adeshlang/adeshlang.git
cd adeshlang

# Debug build (faster compilation, slower runtime)
cargo build

# Release build (slower compilation, faster runtime)
cargo build --release

# Run tests
cargo test

# Run specific test
cargo test test_name

# Run with output
cargo test -- --nocapture
```

### IDE Setup

**VS Code:**
1. Install Rust Analyzer extension
2. Install AdeshLang extension (if available)
3. Open project folder

**Other editors:**
- See [Tools Guide](tools/cli) for LSP setup

## Contribution Areas

### Priority Areas (High Impact)

🔥 **Urgent needs:**
- Performance optimizations
- Bug fixes in core compiler
- GPU backend improvements
- Documentation enhancements
- Real-world examples

### Medium Priority

📋 **Important but not urgent:**
- New language features
- Standard library additions
- Tooling improvements
- CI/CD automation

### Nice to Have

✨ **Bonus contributions:**
- Additional examples
- Blog posts and tutorials
- Community outreach
- Logo/branding improvements

## Pull Request Process

### Before Submitting

**Checklist:**
- ✅ Code compiles without warnings
- ✅ All tests pass
- ✅ Code is formatted (`cargo fmt`)
- ✅ Clippy checks pass (`cargo clippy`)
- ✅ Tests added for new features
- ✅ Documentation updated
- ✅ Commit message is clear

### Submitting PR

1. **Fork** the repository
2. **Create branch** from `main`
3. **Make changes** and test thoroughly
4. **Commit** with clear messages
5. **Push** to your fork
6. **Open PR** on GitHub
7. **Describe** changes in detail

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Testing
Describe testing performed:
- [ ] Added/updated tests
- [ ] All existing tests pass
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published
```

### Review Process

1. **Automated checks** - CI runs tests and linters
2. **Maintainer review** - Code review by project maintainers
3. **Feedback** - Address any comments or requested changes
4. **Approval** - PR is approved and merged

**Typical timeline:** 1-2 weeks for review and merge

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

**Expected behavior:**
- ✅ Be respectful and inclusive
- ✅ Welcome newcomers and help them learn
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what's best for the community

**Unacceptable behavior:**
- ❌ Harassment or discrimination
- ❌ Offensive comments
- ❌ Personal attacks
- ❌ Trolling or disruptive behavior

### Enforcement

Violations should be reported to project maintainers. All complaints will be reviewed and investigated promptly and fairly.

## Recognition

Contributors are recognized in:

- 📜 **CONTRIBUTORS.md** - List of all contributors
- 🏆 **Release notes** - Major contributors mentioned
- ⭐ **Hall of fame** - Top contributors highlighted

## Questions?

Need help or have questions?

- 💬 **GitHub Discussions** - Ask questions, get help
- 📧 **Email maintainers** - For private inquiries
- 🐦 **Twitter** - Follow @AdeshLang for updates

## Thank You!

Every contribution matters, no matter how small. Together we're building a better programming language!

**Happy coding! 🚀**
