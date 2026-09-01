import React, { useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

const snippets = [
  {
    id: 'hello',
    label: 'Hello World',
    title: 'Functional Basics & Higher-Order Functions',
    code: `// 1. Array declaration
let numbers = [10, 20, 30, 40];

// 2. Higher-order map operation
let doubled = map(numbers, fn(x) {
    return x * 2;
});

print("Original:", numbers);
print("Doubled:", doubled);`,
    output: `Original: [10, 20, 30, 40]
Doubled: [20, 40, 60, 80]
[Execution time: 0.8ms | Memory: 1.2 MB]`
  },
  {
    id: 'oop',
    label: 'OOP & Safety',
    title: 'Encapsulation & Exception Safety',
    code: `class Counter {
  fn init(initial_count) {
    this.count = initial_count;
  }

  fn increment() {
    this.count = this.count + 1;
    return this.count;
  }
}

let c = new Counter(10);
print("Counter incremented:", c.increment());`,
    output: `Counter incremented: 11
[Class instantiation: stack/heap layout verified]
[Execution time: 1.1ms]`
  },
  {
    id: 'http',
    label: 'HTTP Client',
    title: 'Built-in Asynchronous HTTP Networking',
    code: `import HTTP;

let res = HTTP.get("https://httpbin.org/get");
print("Status:", res.status);
print("Success:", HTTP.Status.isSuccess(res.status));
print("Body:", res.text());`,
    output: `Status: 200
Success: true
Body: { "url": "https://httpbin.org/get" }
[TLS 1.3 connection established cleanly]`
  },
  {
    id: 'simd',
    label: 'SIMD Vectorization',
    title: 'Explicit Parallel Hardware Acceleration',
    code: `let v1 = [1.0, 2.0, 3.0, 4.0];
let v2 = [10.0, 20.0, 30.0, 40.0];

// Vector addition using hardware intrinsics
let result = v1.vadd(v2);
print("Vector Sum:", result);`,
    output: `Vector Sum: [11.0, 22.0, 33.0, 44.0]
[AVX2 / ARM Neon vector lane pass active]`
  },
  {
    id: 'njit',
    label: 'Native JIT',
    title: 'Cranelift Native Machine Code Execution',
    code: `// Execute with: adesh run --jit-native main.adesh

fn fibonacci(n) {
    if (n <= 1) { return n; }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

print("Fibonacci(35):", fibonacci(35));`,
    output: `Fibonacci(35): 9227465
[Compiled LIR -> Native Machine Code via Cranelift]
[Execution speedup: 184x vs standard interpreter]`
  }
];

export default function Home(): JSX.Element {
  const [activeTab, setActiveTab] = useState(snippets[0]);
  const [copied, setCopied] = useState(false);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('curl -fsSL https://adeshlang.org/install.sh | sh');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout
      title="AdeshLang — High-Performance Memory-Safe Language"
      description="आदेश (Adesh) — Command. Code. Create. A Rust-inspired, high-performance programming language with Cranelift native JIT, zero-cost memory safety, and multi-backend support."
    >
      {/* Hero Section */}
      <header className="landing-hero">
        <div className="hero-glow-bg" />
        <div className="hero-content">
          <div className="hero-badge">
            <span>✨ AdeshLang v0.3.0 Released</span>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <img
              src="/img/logo.svg"
              alt="AdeshLang Logo"
              className="floating-logo"
              style={{ width: '220px', height: '220px', filter: 'drop-shadow(0 0 35px rgba(16, 185, 129, 0.5))' }}
            />
          </div>

          <h1 className="hero-title">
            Command. Code. Create.<br />
            <span className="gradient-text">High-Performance Programming</span>
          </h1>

          <p className="hero-subtitle">
            A modern, Rust-inspired language combining zero-cost compile-time memory safety, native Cranelift JIT compilation (10-230x speedups), explicit SIMD vectorization, and rich built-in networking libraries.
          </p>

          <div style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            maxWidth: '780px',
            margin: '1.5rem auto 2rem',
            textAlign: 'center'
          }}>
            <strong style={{ color: '#facc15', fontSize: '1.05rem', display: 'block', marginBottom: '0.4rem' }}>
              🧪 Experimental Language & Backend Status Notice
            </strong>
            <span style={{ fontSize: '0.95rem', opacity: 0.9, lineHeight: 1.5, display: 'block' }}>
              AdeshLang is an <strong>experimental programming language</strong> under active research and development. The <strong>Tree-Walk Interpreter</strong> (<code>adesh run file.adesh</code>) is the primary face of development and source of truth for execution logic and standard features. Other backends (Native Cranelift JIT, AOT, Bytecode VM, WASM, GPU/MLIR) are under active development and are not yet fully completed across all feature sets.
            </span>
          </div>

          <div className="hero-ctas">
            <Link className="btn-primary-glow" to="/getting-started/quick-start">
              Get Started →
            </Link>
            <Link className="btn-secondary-glass" to="/intro">
              Read Documentation
            </Link>
            <a
              className="btn-secondary-glass"
              href="https://github.com/adeshlang/adeshlang"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Repository ↗
            </a>
          </div>

          {/* Quick Install Bar */}
          <div className="install-widget">
            <span className="install-prompt">$</span>
            <code className="install-code">curl -fsSL https://adeshlang.org/install.sh | sh</code>
            <button
              onClick={handleCopyCmd}
              className={`copy-btn ${copied ? 'copied' : ''}`}
              title="Copy install command"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>
      </header>

      {/* Feature Cards Grid */}
      <section style={{ padding: '4rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Designed for Modern Systems & Applications</h2>
          <p style={{ opacity: 0.8, maxWidth: '600px', margin: '0.5rem auto 0' }}>
            From low-level memory control to high-level async web servers, AdeshLang gives you power without complexity.
          </p>
        </div>

        <div className="landing-grid">
          <div className="glass-card">
            <div className="glass-card-icon">⚡</div>
            <h3>Native Cranelift JIT</h3>
            <p>
              Executes LIR directly as native x86_64/ARM machine code at runtime via function pointers, reaching 10x to 230x execution speedups over standard interpretation.
            </p>
          </div>

          <div className="glass-card">
            <div className="glass-card-icon">🛡️</div>
            <h3>Compile-Time Memory Safety</h3>
            <p>
              Strict single-ownership and move semantics verified by the borrow checker prior to codegen — eliminating data races, double-frees, and GC pause spikes.
            </p>
          </div>

          <div className="glass-card">
            <div className="glass-card-icon">🏎️</div>
            <h3>Hardware SIMD Acceleration</h3>
            <p>
              First-class vector operations (`vadd`, `vmul_add`, broadcasting) and auto-vectorization passes leveraging AVX2 and ARM Neon vector instructions.
            </p>
          </div>

          <div className="glass-card">
            <div className="glass-card-icon">🌐</div>
            <h3>Batteries-Included Networking</h3>
            <p>
              Standard library support for TCP, UDP, HTTP/1.1-REST, full-duplex WebSockets, DNS resolution, TLS encryption, and JSON parsing.
            </p>
          </div>

          <div className="glass-card">
            <div className="glass-card-icon">🔀</div>
            <h3>Multi-Backend Execution</h3>
            <p>
              The <strong>Tree-Walk Interpreter</strong> is the primary face of development and source of truth for language features. Other backends (Cranelift Native JIT, AOT, Bytecode VM, WASM, GPU MLIR) are under active development and are not yet fully completed.
            </p>
          </div>

          <div className="glass-card">
            <div className="glass-card-icon">🛠️</div>
            <h3>Integrated Developer Tooling</h3>
            <p>
              Integrated toolchain includes source code formatter (`adesh fmt`), package manager (`adesh pkg`), unit test harness (`adesh run --test`), and LSP server (`als`).
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Code Sandbox */}
      <section className="code-sandbox-section">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Explore AdeshLang Syntax in Action</h2>
          <p style={{ opacity: 0.8 }}>Click tabs to view real examples and corresponding execution output.</p>
        </div>

        <div className="sandbox-container">
          <div className="sandbox-header">
            <div className="window-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>

            <div className="sandbox-tabs">
              {snippets.map((snip) => (
                <button
                  key={snip.id}
                  className={`sandbox-tab ${activeTab.id === snip.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(snip)}
                >
                  {snip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sandbox-content">
            <div className="sandbox-code-pane">
              <div className="output-label">{activeTab.title}</div>
              <pre style={{ margin: 0, padding: 0, background: 'transparent' }}>
                <code>{activeTab.code}</code>
              </pre>
            </div>

            <div className="sandbox-output-pane">
              <div className="output-label">Terminal Evaluation Output</div>
              <pre style={{ margin: 0, padding: 0, background: 'transparent', color: '#38bdf8' }}>
                <code>{activeTab.output}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Benchmark Visualization */}
        <div className="benchmark-card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Backend Execution Speed Benchmark (Compute-Heavy Workloads)
          </h3>
          <p style={{ opacity: 0.75, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Relative execution time (lower is faster)
          </p>

          <div className="bench-row">
            <div className="bench-info">
              <span>Standard Interpreter</span>
              <span>1.0x (Baseline)</span>
            </div>
            <div className="bench-bar-bg">
              <div className="bench-bar-fill fill-interpreter" />
            </div>
          </div>

          <div className="bench-row">
            <div className="bench-info">
              <span>LIR JIT</span>
              <span>1.2x Execution Time</span>
            </div>
            <div className="bench-bar-bg">
              <div className="bench-bar-fill fill-jit" />
            </div>
          </div>

          <div className="bench-row">
            <div className="bench-info">
              <span>Native Cranelift JIT (--njit)</span>
              <span style={{ color: '#34d399' }}>⚡ 10x - 230x Faster!</span>
            </div>
            <div className="bench-bar-bg">
              <div className="bench-bar-fill fill-njit" />
            </div>
          </div>

          <div className="bench-row">
            <div className="bench-info">
              <span>AOT Native Compilation (adesh build)</span>
              <span style={{ color: '#a855f7' }}>⚡ 15x - 240x Faster!</span>
            </div>
            <div className="bench-bar-bg">
              <div className="bench-bar-fill fill-aot" />
            </div>
          </div>
        </div>
      </section>

      {/* Built with Rust & Community Shoutout Section */}
      <section style={{ maxWidth: '1100px', margin: '4rem auto 2rem', padding: '0 1.5rem' }}>
        <div
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            borderRadius: '20px',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🦀</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--card-heading)' }}>
            Built with <span style={{ color: '#f97316' }}>Rust</span> & Powered by Community
          </h2>
          <p style={{ fontSize: '1.15rem', lineHeight: '1.7', opacity: 0.9, maxWidth: '800px', margin: '0 auto 1.5rem' }}>
            AdeshLang is an <strong>experimental programming language</strong> crafted with <strong>Rust</strong>.
            We extend our deepest gratitude and a massive shoutout to the <strong>Rust Core Team</strong>, the <strong>Rust Foundation</strong>, and the incredible <strong>Rust Community & Ecosystem</strong>.
          </p>
          <p style={{ fontSize: '1rem', opacity: 0.85, maxWidth: '750px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
            Rust's zero-cost abstractions, relentless memory safety guarantees, fearless concurrency, and rich compiler libraries enabled us to design and build AdeshLang from lexer and parser to IR lowerings and JIT codegen.
          </p>
          <div style={{ display: 'inline-flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a
              className="btn-secondary-glass"
              href="https://www.rust-lang.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ borderColor: 'rgba(249, 115, 22, 0.4)' }}
            >
              Explore Rust (rust-lang.org) ↗
            </a>
            <a
              className="btn-secondary-glass"
              href="https://github.com/adeshlang/adeshlang"
              target="_blank"
              rel="noopener noreferrer"
            >
              View AdeshLang Rust Source Code ↗
            </a>
          </div>
        </div>
      </section>

      {/* Footer CTA Banner */}
      <section style={{ background: 'rgba(16, 185, 129, 0.05)', borderTop: '1px solid rgba(16, 185, 129, 0.2)', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to Start Coding in AdeshLang?</h2>
        <p style={{ opacity: 0.85, maxWidth: '600px', margin: '0 auto 2rem', fontSize: '1.1rem' }}>
          Follow our 5-minute Quick Start guide or explore the progressive learning path.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Link className="btn-primary-glow" to="/getting-started/quick-start">
            Start Learning Now →
          </Link>
          <Link className="btn-secondary-glass" to="/intro">
            Read Language Specs
          </Link>
        </div>
      </section>
    </Layout>
  );
}
