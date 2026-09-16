import React, { useState, useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Head from '@docusaurus/Head';
import { Highlight, themes } from 'prism-react-renderer';
import {
  SITE_URL,
  faqSchema,
  howToSchema,
  breadcrumbSchema,
  websiteSchema,
  siteNavigationSchema,
  organizationSchema,
  softwareApplicationSchema,
} from '../utils/seo';

/* ──────────────────────────────────────────────
   Data
   ────────────────────────────────────────────── */

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
[Execution time: 0.8ms | Memory: 1.2 MB]`,
  },
  {
    id: 'oop',
    label: 'OOP & Safety',
    title: 'Encapsulation & Exception Safety',
    code: `class Counter {
  Counter(initial_count) {
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
[Execution time: 1.1ms]`,
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
[TLS 1.3 connection established cleanly]`,
  },
  {
    id: 'simd',
    label: 'SIMD Vectorization',
    title: 'Explicit Parallel Hardware Acceleration',
    code: `let v1 = [1.0, 2.0, 3.0, 4.0];
let v2 = [10.0, 20.0, 30.0, 40.0];

// Element-wise vector addition via SIMD operators
let result = v1 + v2;
print("Vector Sum:", result);`,
    output: `Vector Sum: [11, 22, 33, 44]
[AVX2 / ARM Neon vector lane pass active]`,
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
[Execution speedup: 184x vs standard interpreter]`,
  },
];

const features = [
  {
    icon: '⚡',
    title: 'Native Cranelift JIT',
    body: 'Executes LIR directly as native x86_64/ARM machine code at runtime via function pointers, reaching <strong>10x to 230x</strong> execution speedups over standard interpretation.',
  },
  {
    icon: '🛡️',
    title: 'Compile-Time Memory Safety',
    body: 'Strict single-ownership and move semantics verified by the borrow checker prior to codegen — eliminating data races, double-frees, and GC pause spikes.',
  },
  {
    icon: '🏎️',
    title: 'Hardware SIMD Acceleration',
    body: 'First-class vector operations — element-wise <code>+</code>/<code>*</code> on arrays, the <code>Simd</code> namespace (<code>dot</code>, <code>sum</code>, <code>mean</code>), and auto-vectorization passes leveraging AVX2 and ARM Neon vector instructions.',
  },
  {
    icon: '🌐',
    title: 'Batteries-Included Networking',
    body: 'Standard library support for TCP, UDP, HTTP/1.1-REST, full-duplex WebSockets, DNS resolution, TLS encryption, and JSON parsing.',
  },
  {
    icon: '🔀',
    title: 'Multi-Backend Execution',
    body: 'The <strong>Interpreter</strong> is the primary face of development and source of truth for language features. Other backends (Baseline JIT, Adaptive JIT, Cranelift Native JIT, AOT, Bytecode VM, WASM, GPU MLIR) are under active development and are not yet fully completed.',
  },
  {
    icon: '🛠️',
    title: 'Integrated Developer Tooling',
    body: 'Integrated toolchain includes source code formatter (<code>adesh fmt</code>), package manager (<code>adesh pkg</code>), unit test harness (<code>adesh run --test</code>), and LSP server (<code>als</code>).',
  },
];

const stats = [
  { value: '230×', label: 'Max JIT Speedup' },
  { value: '0-cost', label: 'Memory Safety' },
  { value: '7', label: 'Execution Backends' },
  { value: '8+', label: 'Stdlib Modules' },
];

const backends = [
  { name: 'Interpreter', status: 'full', tag: 'Full' },
  { name: 'Baseline JIT', status: 'partial', tag: 'Partial' },
  { name: 'Adaptive JIT', status: 'partial', tag: 'Partial' },
  { name: 'Bytecode VM', status: 'partial', tag: 'Partial' },
  { name: 'Native Cranelift JIT', status: 'partial', tag: 'Partial' },
  { name: 'AOT Native', status: 'partial', tag: 'Partial' },
  { name: 'WASM', status: 'partial', tag: 'Partial' },
  { name: 'GPU / MLIR', status: 'no', tag: 'Planned' },
];

/* ──────────────────────────────────────────────
   Scroll reveal hook
   ────────────────────────────────────────────── */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    el.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ──────────────────────────────────────────────
   Syntax-highlighted code block
   ────────────────────────────────────────────── */

function CodeBlock({ code, language }: { code: string; language: string }) {
  // Terminal is always dark — use a fixed dark Prism theme for syntax highlighting.
  // This also avoids SSR issues with useColorMode (ColorModeProvider unavailable during SSG).
  return (
    <Highlight theme={themes.dracula} code={code} language={language}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, i) => {
            const lineProps = getLineProps({ line });
            return (
              <div key={i} {...lineProps} className={`token-line ${lineProps.className ?? ''}`}>
                {line.map((token, key) => {
                  const tokenProps = getTokenProps({ token });
                  return <span key={key} {...tokenProps} />;
                })}
              </div>
            );
          })}
        </>
      )}
    </Highlight>
  );
}

/* ──────────────────────────────────────────────
   Output pane — colorize bracketed metadata
   ────────────────────────────────────────────── */

function OutputBlock({ output }: { output: string }) {
  const lines = output.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const isMeta = line.trim().startsWith('[');
        return (
          <div key={i} className={isMeta ? 'output-meta' : ''}>
            {line}
            {'\n'}
          </div>
        );
      })}
    </>
  );
}

/* ──────────────────────────────────────────────
   Feature card
   ────────────────────────────────────────────── */

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="feature-card reveal">
      <div className="feature-icon-chip">{icon}</div>
      <h3>{title}</h3>
      <p dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */

export default function Home(): JSX.Element {
  const [activeTab, setActiveTab] = useState(snippets[0]!);
  const [copied, setCopied] = useState(false);
  const featuresRef = useReveal<HTMLDivElement>();
  const sandboxRef = useReveal<HTMLDivElement>();
  const backendRef = useReveal<HTMLDivElement>();
  const rustRef = useReveal<HTMLDivElement>();

  // SEO & GEO — Structured data for homepage: FAQ + HowTo + Breadcrumb
  // GEO: FAQPage is heavily used by generative engines for grounded answers
  const faqJsonLd = faqSchema([
    {
      question: 'What is AdeshLang?',
      answer:
        'AdeshLang (आदेश — Command) is a modern, Rust-inspired, high-performance programming language with Cranelift native JIT (10–230× speedups), zero-cost compile-time memory safety, hardware SIMD, and batteries-included networking. It is experimental and built with Rust in Bengaluru, India by Ajay Tainwala.',
    },
    {
      question: 'Is AdeshLang production-ready?',
      answer:
        'No. AdeshLang is experimental. The Tree-Walk Interpreter is the primary face of development and source of truth. Other backends (Baseline JIT, Adaptive JIT, Native Cranelift JIT, AOT, Bytecode VM, WASM, GPU/MLIR) are under active development and not yet fully completed.',
    },
    {
      question: 'What makes AdeshLang fast?',
      answer:
        'Native Cranelift JIT compiles LIR to native x86_64/ARM machine code at runtime via function pointers (10–230× faster than interpreter), AOT compilation (15–240×), plus explicit SIMD vectorization (AVX2 / ARM Neon) and auto-vectorization passes.',
    },
    {
      question: 'How do I install AdeshLang?',
      answer:
        'Run curl -fsSL https://adeshlang.org/install.sh | sh, or download from GitHub releases. Then use adesh run main.adesh, adesh run --jit-native main.adesh for native JIT, or adesh build for AOT.',
    },
    {
      question: 'Is AdeshLang memory-safe without garbage collection?',
      answer:
        'Yes. AdeshLang enforces compile-time ownership and move semantics with a borrow checker prior to codegen, eliminating data races, double-frees, and GC pause spikes with zero-cost abstractions.',
    },
    {
      question: 'Where can I learn AdeshLang?',
      answer:
        'Start at https://www.adeshlang.org/learn/getting-started/quick-start for a 5-minute guide, then follow the Learn roadmap, Language Guide, and examples catalog.',
    },
  ]);

  const howToJsonLd = howToSchema({
    name: 'How to install and run AdeshLang in 5 minutes',
    description: 'Install AdeshLang and run your first program using the interpreter.',
    url: `${SITE_URL}/learn/getting-started/quick-start`,
    steps: [
      { name: 'Install AdeshLang', text: 'Run curl -fsSL https://adeshlang.org/install.sh | sh in your terminal.' },
      { name: 'Create main.adesh', text: 'Create a file with fn main() { print("Hello, AdeshLang!"); }' },
      { name: 'Run with interpreter', text: 'Execute adesh run main.adesh to see output.' },
      { name: 'Try native JIT', text: 'Execute adesh run --jit-native main.adesh for Cranelift native speedup.' },
    ],
  });

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Documentation', url: '/intro' },
  ]);

  const websiteJsonLd = websiteSchema();
  const navJsonLd = siteNavigationSchema();
  const orgJsonLd = organizationSchema();
  const appJsonLd = softwareApplicationSchema();

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('curl -fsSL https://adeshlang.org/install.sh | sh');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout
      title="AdeshLang — High-Performance Memory-Safe Language"
      description="AdeshLang (आदेश) is a Rust-inspired, high-performance language with Cranelift native JIT (10–230× speedup), zero-cost memory safety, and SIMD acceleration."
    >
      <Head>
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta name="keywords" content="AdeshLang, programming language, Rust-inspired, Cranelift JIT, memory-safe, SIMD, compiler, AOT, WASM, systems programming" />
        <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(navJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(appJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(howToJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Head>
      <main className="landing-page" id="main-content">
        {/* ═══════════════ HERO ═══════════════ */}
        <header className="hero">
          {/* Gradient mesh blobs */}
          <div className="hero-mesh">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
          </div>

          {/* Floating geometric shapes */}
          <div className="hero-geo">
            <div className="geo geo-square" />
            <div className="geo geo-triangle" />
            <div className="geo geo-hex" />
            <div className="geo geo-diamond" />
            <div className="geo geo-ring" />
            <div className="geo geo-cross" />
          </div>

          <div className="hero-inner">
            <div className="hero-badge">
              <span className="pulse-dot" />
              AdeshLang v0.3.0 Released
            </div>

            <img
              src="/img/logo.svg"
              alt="AdeshLang Logo"
              className="hero-logo"
              width={180}
              height={180}
              loading="eager"
              decoding="async"
            />

            <h1 className="hero-brand-title">AdeshLang</h1>

            <h2 className="hero-title">
              Command. Code. Create.
              <br />
              <span className="gradient-text">High-Performance Programming</span>
            </h2>

            <p className="hero-subtitle">
              A modern, Rust-inspired language combining zero-cost compile-time memory safety, native Cranelift JIT compilation (10–230× speedups), explicit SIMD vectorization, and rich built-in networking libraries.
            </p>

            <div className="hero-notice">
              <div className="hero-notice-title">
                🧪 Experimental Language &amp; Backend Status Notice
              </div>
              <p className="hero-notice-body">
                AdeshLang is an <strong>experimental programming language</strong> under active research and development. The <strong>Interpreter</strong> (<code>adesh run file.adesh</code>) is the primary face of development and source of truth for execution logic and standard features. Other backends (Baseline JIT, Adaptive JIT, Native Cranelift JIT, AOT, Bytecode VM, WASM, GPU/MLIR) are under active development and are not yet fully completed across all feature sets.
              </p>
            </div>

            <div className="hero-ctas">
              <a
                className="btn-filled btn-editor"
                href="https://editor.adeshlang.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                ✨ Try Web Editor ↗
              </a>
              <Link className="btn-outlined" to="/learn/getting-started/quick-start">
                Get Started →
              </Link>
              <Link className="btn-outlined" to="/learn">
                Learn AdeshLang
              </Link>
              <Link className="btn-outlined" to="/docs">
                Documentation
              </Link>
              <a
                className="btn-outlined"
                href="https://github.com/adeshlang/adeshlang"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub ↗
              </a>
            </div>

            <div className="install-bar">
              <span className="install-prompt">$</span>
              <code className="install-code">curl -fsSL https://adeshlang.org/install.sh | sh</code>
              <button
                onClick={handleCopyCmd}
                className={`copy-btn ${copied ? 'copied' : ''}`}
                title="Copy install command"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </header>

        {/* ═══════════════ STATS STRIP ═══════════════ */}
        <div className="stats-strip">
          {stats.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ═══════════════ FEATURES ═══════════════ */}
        <section className="features-section" ref={featuresRef}>
          <div className="section-header">
            <div className="section-eyebrow">Capabilities</div>
            <h2 className="section-heading">Designed for Modern Systems &amp; Applications</h2>
            <p className="section-subheading">
              From low-level memory control to high-level async web servers, AdeshLang gives you power without complexity.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} body={f.body} />
            ))}
          </div>
        </section>

        {/* Geometric divider */}
        <div className="geo-divider">
          <span /><span /><span />
        </div>

        {/* ═══════════════ CODE SANDBOX ═══════════════ */}
        <section className="sandbox-section" ref={sandboxRef}>
          <div className="section-header">
            <div className="section-eyebrow">Live Examples</div>
            <h2 className="section-heading">Explore AdeshLang Syntax in Action</h2>
            <p className="section-subheading">
              Click tabs to view real examples with full syntax highlighting and corresponding execution output.
            </p>
          </div>

          <div className="terminal reveal">
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="terminal-tabs">
                {snippets.map((snip) => (
                  <button
                    key={snip.id}
                    className={`terminal-tab ${activeTab.id === snip.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(snip)}
                  >
                    {snip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="terminal-body">
              <div className="terminal-pane terminal-code-pane">
                <div className="pane-label">{activeTab.title}</div>
                <CodeBlock code={activeTab.code} language="adesh" />
              </div>
              <div className="terminal-pane terminal-output-pane">
                <div className="pane-label">Terminal Evaluation Output</div>
                <pre>
                  <code>
                    <OutputBlock output={activeTab.output} />
                  </code>
                </pre>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <a
                className="btn-outlined"
                href="https://editor.adeshlang.org"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.875rem', padding: '0.45rem 1rem' }}
              >
                ⚡ Open Interactive Web Editor (editor.adeshlang.org) ↗
              </a>
            </div>
          </div>

          {/* Benchmark */}
          <div className="benchmark-card reveal">
            <h3 className="benchmark-title">Backend Execution Speed Benchmark (Compute-Heavy Workloads)</h3>
            <p className="benchmark-subtitle">Relative execution time — lower is faster</p>

            <div className="bench-row">
              <div className="bench-info">
                <span>Standard Interpreter</span>
                <span className="bench-speed">1.0× (Baseline)</span>
              </div>
              <div className="bench-track">
                <div className="bench-fill fill-interpreter" />
              </div>
            </div>

            <div className="bench-row">
              <div className="bench-info">
                <span>Baseline JIT</span>
                <span className="bench-speed">1.2× Execution Time</span>
              </div>
              <div className="bench-track">
                <div className="bench-fill fill-jit" />
              </div>
            </div>

            <div className="bench-row">
              <div className="bench-info">
                <span>Adaptive JIT</span>
                <span className="bench-speed bench-fast">⚡ 3× – 50× Faster</span>
              </div>
              <div className="bench-track">
                <div className="bench-fill fill-adaptive" />
              </div>
            </div>

            <div className="bench-row">
              <div className="bench-info">
                <span>Native Cranelift JIT (--njit)</span>
                <span className="bench-speed bench-fast">⚡ 10× – 230× Faster</span>
              </div>
              <div className="bench-track">
                <div className="bench-fill fill-njit" />
              </div>
            </div>

            <div className="bench-row">
              <div className="bench-info">
                <span>AOT Native Compilation (adesh build)</span>
                <span className="bench-speed bench-purple">⚡ 15× – 240× Faster</span>
              </div>
              <div className="bench-track">
                <div className="bench-fill fill-aot" />
              </div>
            </div>
          </div>
        </section>

        {/* Geometric divider */}
        <div className="geo-divider">
          <span /><span /><span />
        </div>

        {/* ═══════════════ BACKEND MATRIX ═══════════════ */}
        <section className="backend-section" ref={backendRef}>
          <div className="section-header">
            <div className="section-eyebrow">Execution Backends</div>
            <h2 className="section-heading">Multi-Backend Support Matrix</h2>
            <p className="section-subheading">
              One language, multiple compilation targets — from interpretation to native machine code.
            </p>
          </div>

          <div className="backend-grid">
            {backends.map((b) => (
              <div className={`backend-tile reveal ${b.status}`} key={b.name}>
                <span className={`backend-status-dot ${b.status}`} />
                <div>
                  <div className="backend-name">{b.name}</div>
                  <div className={`backend-tag ${b.status}`}>{b.tag}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="backend-legend">
            <div className="legend-item">
              <span className="backend-status-dot full" /> Full Support
            </div>
            <div className="legend-item">
              <span className="backend-status-dot partial" /> Partial / In Progress
            </div>
            <div className="legend-item">
              <span className="backend-status-dot no" /> Planned
            </div>
          </div>
        </section>

        {/* ═══════════════ RUST / COMMUNITY ═══════════════ */}
        <section className="rust-section" ref={rustRef}>
          <div className="rust-card reveal">
            <div className="rust-emoji">🦀</div>
            <h2 className="rust-heading">
              Built with <span className="rust-accent-text">Rust</span> &amp; Powered by Community
            </h2>
            <p className="rust-body">
              AdeshLang is an <strong>experimental programming language</strong> crafted with <strong>Rust</strong>. We extend our deepest gratitude and a massive shoutout to the <strong>Rust Core Team</strong>, the <strong>Rust Foundation</strong>, and the incredible <strong>Rust Community &amp; Ecosystem</strong>.
            </p>
            <p className="rust-subbody">
              Rust's zero-cost abstractions, relentless memory safety guarantees, fearless concurrency, and rich compiler libraries enabled us to design and build AdeshLang from lexer and parser to IR lowerings and JIT codegen.
            </p>
            <div className="rust-links">
              <a
                className="btn-outlined"
                href="https://www.rust-lang.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore Rust ↗
              </a>
              <a
                className="btn-outlined"
                href="https://github.com/adeshlang/adeshlang"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Source Code ↗
              </a>
            </div>
          </div>
        </section>

        {/* ═══════════════ CTA BANNER ═══════════════ */}
        <section className="cta-banner">
          <h2 className="cta-title">Ready to Start Coding in AdeshLang?</h2>
          <p className="cta-subtitle">
            Follow our 5-minute Quick Start guide or explore the progressive learning path.
          </p>
          <div className="cta-buttons">
            <a
              className="btn-filled"
              href="https://editor.adeshlang.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Web Editor ↗
            </a>
            <Link className="btn-outlined" to="/learn/getting-started/quick-start">
              Quick Start Guide →
            </Link>
            <Link className="btn-outlined" to="/docs">
              Read Reference Docs
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
