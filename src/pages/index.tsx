import React, { useLayoutEffect, useRef, useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import BundledTools from '../components/BundledTools';
import Head from '@docusaurus/Head';
import { Highlight } from 'prism-react-renderer';
import { adeshCodeTheme } from '../theme/adeshCodeTheme';
import {
  SITE_URL,
  GITHUB_URL,
  EDITOR_URL,
  faqSchema,
  howToSchema,
  breadcrumbSchema,
  websiteSchema,
  siteNavigationSchema,
  organizationSchema,
  softwareApplicationSchema,
} from '../utils/seo';

/* ──────────────────────────────────────────────
   Icons
   ────────────────────────────────────────────── */

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-rounded ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

/* ──────────────────────────────────────────────
   Data
   ────────────────────────────────────────────── */

const RELEASES_URL = 'https://github.com/adeshlang/adeshlang/releases/latest';

const heroCode = `type Port = u16;

type Service = {
  name: string,
  port: Port,
}

let api: Service = {
  name: "edge-api",
  port: 8080,
};

print("service:", api.name, "→", api.port);`;

const heroOutput = [
  { text: '$ adesh build run main.adesh', kind: 'prompt' },
  { text: 'service: edge-api → 8080', kind: 'value' },
  { text: '[type aliases erased at compile time — zero runtime cost]', kind: 'meta' },
  { text: '[native pipeline ready: HIR → MIR → ADOB v3 → adeshlink]', kind: 'meta' },
];

const pipelineStages = [
  { icon: 'description', title: 'Frontend + HIR', detail: 'Parse, resolve, and type-check', tag: 'Ready', tone: 'verified' },
  { icon: 'account_tree', title: 'Machine IR', detail: 'Platform-aware lowering', tag: 'Ready', tone: 'verified' },
  { icon: 'inventory_2', title: 'ADOB v3', detail: 'Validated native object', tag: 'Ready', tone: 'verified' },
  { icon: 'link', title: 'adeshlink', detail: 'GC · ICF · relocations', tag: 'Preview', tone: 'preview' },
  { icon: 'deployed_code', title: 'PE · ELF · Mach-O', detail: 'Native executable output', tag: 'Preview', tone: 'preview' },
];

interface Snippet {
  id: string;
  label: string;
  title: string;
  code: string;
  output: string[];
}

const snippets: Snippet[] = [
  {
    id: 'type',
    label: 'Type aliases',
    title: 'Zero-cost type aliases & structural records',
    code: `type Port = u16;

type Endpoint = {
  host: string,
  port: Port,
}

let api: Endpoint = {
  host: "localhost",
  port: 8080,
};

print("endpoint:", api.host, ":", api.port);`,
    output: [
      'endpoint: localhost : 8080',
      '[type aliases expanded during semantic analysis]',
      '[no runtime wrapper or vtable introduced]',
    ],
  },
  {
    id: 'functions',
    label: 'Functions',
    title: 'Higher-order functions & array pipelines',
    code: `let numbers = [10, 20, 30, 40];

let doubled = numbers.map(fn(x) {
  return x * 2;
});

print("original:", numbers);
print("doubled:", doubled);`,
    output: [
      'original: [10, 20, 30, 40]',
      'doubled: [20, 40, 60, 80]',
      '[execution time: 0.8 ms]',
    ],
  },
  {
    id: 'oop',
    label: 'OOP',
    title: 'Classes, encapsulation & ARC',
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
print("counter:", c.increment());`,
    output: [
      'counter: 11',
      '[class instance allocated on the managed heap]',
      '[ARC + borrow checker verified before codegen]',
    ],
  },
  {
    id: 'http',
    label: 'HTTP',
    title: 'Batteries-included async networking',
    code: `import HTTP;

let res = HTTP.get("https://httpbin.org/get");

print("status:", res.status);
print("success:", HTTP.Status.isSuccess(res.status));
print("body:", res.text());`,
    output: [
      'status: 200',
      'success: true',
      'body: { "url": "https://httpbin.org/get" }',
      '[TLS 1.3 connection established]',
    ],
  },
  {
    id: 'simd',
    label: 'SIMD',
    title: 'Explicit hardware vector acceleration',
    code: `let v1 = [1.0, 2.0, 3.0, 4.0];
let v2 = [10.0, 20.0, 30.0, 40.0];

// Element-wise vector addition
let result = v1 + v2;

print("vector sum:", result);`,
    output: [
      'vector sum: [11, 22, 33, 44]',
      '[AVX2 / ARM Neon vector lanes active]',
      '[no manual intrinsics required]',
    ],
  },
  {
    id: 'njit',
    label: 'JIT Compiler',
    title: 'JIT Compiler: native machine-code execution',
    code: `// adesh run --njit main.adesh

fn fibonacci(n) {
  if (n <= 1) { return n; }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

print("fibonacci(35):", fibonacci(35));`,
    output: [
      'fibonacci(35): 9227465',
      '[LIR compiled to native x86-64 / ARM64]',
      '[native machine code emitted at runtime]',
    ],
  },
];

const features = [
  {
    icon: 'deployed_code',
    title: 'Native compiler pipeline',
    body: 'HIR lowers to Machine IR, then validated <code>ADOB v3</code> objects are linked by <code>adeshlink</code> into PE, ELF, and Mach-O targets without LLVM or external dependencies.',
    badge: 'v0.4.0',
  },
  {
    icon: 'bolt',
    title: 'JIT Compiler',
    body: 'Executes LIR as native x86-64 / ARM64 machine code at runtime for compute-heavy workloads.',
  },
  {
    icon: 'verified_user',
    title: 'Memory safety, zero GC',
    body: 'Ownership, moves, and atomic reference counting are verified before codegen — no GC pauses, double frees, or data races.',
  },
  {
    icon: 'grid_view',
    title: 'Hardware SIMD',
    body: 'Element-wise vector operators, the <code>Simd</code> namespace, and AVX2 / ARM Neon auto-vectorization passes.',
  },
  {
    icon: 'lan',
    title: 'Batteries-included networking',
    body: 'TCP, UDP, HTTP/1.1, full-duplex WebSockets, DNS, TLS, and JSON parsing ship in the standard library.',
  },
  {
    icon: 'build_circle',
    title: 'One complete toolchain',
    body: '<code>adesh fmt</code>, ADL packages, a built-in test harness, FFI, and the ALS language server — one CLI end to end.',
  },
];

const stats = [
  { value: '4', label: 'Execution targets' },
  { value: '23', label: 'Platform builds' },
  { value: '0', label: 'GC pauses' },
  { value: '100%', label: 'Open source' },
];

const roadmap = [
  {
    icon: 'inventory_2',
    title: 'ADOB v3 object format',
    detail: 'Validated binary container with explicit section sizes and distinct TLS section kinds.',
    status: 'verified',
    label: 'Implemented',
    progress: 100,
  },
  {
    icon: 'link',
    title: 'adeshlink native linker',
    detail: 'Parse → GC → ICF → resolve → relocate, with PE, ELF, and Mach-O writers without external dependencies.',
    status: 'preview',
    label: 'Preview',
    progress: 82,
  },
  {
    icon: 'memory',
    title: 'x86-64 native codegen',
    detail: 'Integer and SSE2 lowering, Win64 / SysV calls, TLS access, and locked atomics.',
    status: 'preview',
    label: 'Maturing',
    progress: 74,
  },
  {
    icon: 'developer_board',
    title: 'AArch64 & RISC-V',
    detail: 'AAPCS64 and RV64GC backends exist; execution verification is still in progress.',
    status: 'progress',
    label: 'In progress',
    progress: 46,
  },
  {
    icon: 'cable',
    title: 'FFI & C ABI',
    detail: 'extern "C" declarations, C type mapping, and zero-overhead native calls.',
    status: 'verified',
    label: 'Available',
    progress: 90,
  },
  {
    icon: 'category',
    title: 'Type aliases & records',
    detail: 'The type keyword brings zero-cost aliases, structural records, optionals, and defaults.',
    status: 'verified',
    label: 'Available',
    progress: 100,
  },
];

type BackendStatus = 'full' | 'partial' | 'planned';

const backends: Array<{
  name: string;
  status: BackendStatus;
  tag: string;
  progress: number;
  meta: string;
}> = [
  { name: 'Interpreter', status: 'full', tag: 'Reference', progress: 100, meta: 'Full language semantics & source of truth' },
  { name: 'JIT Compiler', status: 'partial', tag: 'Maturing', progress: 75, meta: 'Native machine code at runtime' },
  { name: 'AOT (Native)', status: 'partial', tag: 'Maturing', progress: 80, meta: 'Native compilation without LLVM or external dependencies' },
  { name: 'WebAssembly', status: 'partial', tag: 'In progress', progress: 50, meta: 'Browser + WASI runtime' },
];

const tools = [
  {
    icon: 'terminal',
    title: 'adesh CLI',
    description: 'doctor, init, run, build, test, and fmt in a single command surface.',
    command: 'adesh doctor',
    href: '/docs/tools/cli',
  },
  {
    icon: 'package_2',
    title: 'ADL packages',
    description: 'Deterministic manifests, lockfiles, local packages, and secret-safe fields.',
    command: 'adesh pkg add HTTP',
    href: '/docs/tools/adl/adl-overview',
  },
  {
    icon: 'extension',
    title: 'ALS language server',
    description: 'Completion, diagnostics, hover, and go-to-definition for editors.',
    command: 'als --stdio',
    href: '/docs/tools/als',
  },
  {
    icon: 'format_align_left',
    title: 'Formatter',
    description: 'Opinionated, deterministic formatting that keeps diffs small.',
    command: 'adesh fmt main.adesh',
    href: '/docs/tools/formatting',
  },
  {
    icon: 'science',
    title: 'Test harness',
    description: 'Embedded tests, name filters, fail-fast runs, and backend checks.',
    command: 'adesh test',
    href: '/docs/tools/testing',
  },
  {
    icon: 'cable',
    title: 'FFI & C interop',
    description: 'Call native C libraries and export Adesh functions with C ABIs.',
    command: 'extern "C" { ... }',
    href: '/docs/tools/ffi',
  },
];

const platformChips = [
  { icon: 'desktop_windows', label: 'Windows' },
  { icon: 'laptop_mac', label: 'macOS' },
  { icon: 'terminal', label: 'Linux' },
  { icon: 'phone_android', label: 'Android' },
];

/* ──────────────────────────────────────────────
   Scroll reveal
   ────────────────────────────────────────────── */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const revealAll = () => {
      el.querySelectorAll('.reveal').forEach((node) => node.classList.add('revealed'));
    };

    if (!('IntersectionObserver' in window)) {
      revealAll();
      return;
    }

    el.classList.add('reveal-ready');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    el.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      el.classList.remove('reveal-ready');
    };
  }, []);

  return ref;
}

/* ──────────────────────────────────────────────
   Code rendering
   ────────────────────────────────────────────── */

function CodeBlock({ code, language = 'adesh' }: { code: string; language?: string }) {
  return (
    <Highlight theme={adeshCodeTheme} code={code} language={language}>
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

function OutputLines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, i) => {
        const meta = line.trim().startsWith('[');
        return (
          <span key={i} className={`output-line ${meta ? 'output-line--meta' : ''}`}>
            {line}
            {'\n'}
          </span>
        );
      })}
    </>
  );
}

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */

export default function Home(): JSX.Element {
  const [activeSnippet, setActiveSnippet] = useState<Snippet>(snippets[0]!);
  const [activeTab, setActiveTab] = useState<'code' | 'pipeline'>('code');
  const [heroCopied, setHeroCopied] = useState(false);
  const [snippetCopied, setSnippetCopied] = useState(false);
  const pageRef = useReveal<HTMLDivElement>();

  const copy = async (text: string, setCopied: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const faqJsonLd = faqSchema([
    {
      question: 'What is Adesh?',
      answer:
        'Adesh (Command) is a Rust-inspired, high-performance programming language with self-contained native compilation, JIT compiler, zero-cost compile-time memory safety, hardware SIMD, FFI, type aliases, and batteries-included networking. It is experimental and built with Rust in Bengaluru, India by Ajay Tainwala.',
    },
    {
      question: 'Is Adesh production-ready?',
      answer:
        'No. Adesh is experimental. The Tree-Walk Interpreter is the primary face of development and source of truth. The self-contained native compiler, ADOB v3 object format, adeshlink, and the other execution backends are under active development and are not all production-ready yet.',
    },
    {
      question: 'What is coming in Adesh v0.4.0?',
      answer:
        'Adesh v0.4.0 is focused on native features: the native compiler pipeline (HIR to Machine IR), the ADOB v3 object format, the adeshlink native linker (producing binaries without LLVM or external toolchains), and continued work on AArch64, RISC-V, WebAssembly, and macOS targets. Preview documentation is available today.',
    },
    {
      question: 'What makes Adesh fast?',
      answer:
        'The JIT compiler compiles code to native x86-64 and ARM64 machine code at runtime, AOT builds generate native binaries via ADOB and adeshlink without LLVM or other dependencies, and explicit SIMD vectorization uses AVX2 and ARM Neon.',
    },
    {
      question: 'How do I install Adesh?',
      answer:
        'Download the latest release from GitHub Releases for Windows, macOS, Linux, or Android, or follow the installation guide on adeshlang.org.',
    },
    {
      question: 'Is Adesh memory-safe without garbage collection?',
      answer:
        'Yes. Adesh enforces compile-time ownership and move semantics with a borrow checker prior to codegen, eliminating data races, double frees, and GC pause spikes with zero-cost abstractions.',
    },
    {
      question: 'Where can I learn Adesh?',
      answer:
        'Start at https://www.adeshlang.org/learn/getting-started/quick-start for a 5-minute guide, then follow the Learn roadmap, Language Guide, and examples catalog.',
    },
  ]);

  const howToJsonLd = howToSchema({
    name: 'How to install and run Adesh in 5 minutes',
    description: 'Install Adesh and run your first program using the interpreter.',
    url: `${SITE_URL}/learn/getting-started/quick-start`,
    steps: [
      {
        name: 'Install Adesh',
        text: 'Download the latest release for your OS from GitHub Releases or follow the installation guide.',
      },
      {
        name: 'Create main.adesh',
        text: 'Create a file with fn main() { print("Hello, Adesh!"); }',
      },
      {
        name: 'Run with the interpreter',
        text: 'Execute adesh run main.adesh to see the output.',
      },
      {
        name: 'Try native execution',
        text: 'Execute adesh run --njit main.adesh to run on the JIT compiler, or adesh build for zero-dependency AOT native compilation.',
      },
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

  return (
    <Layout
      title="Adesh Lang — Native-Speed, Memory-Safe Language"
      description="Adesh is a Rust-inspired language with type aliases, JIT compiler, SIMD, FFI, and zero-dependency native compilation."
    >
      <Head>
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta
          name="keywords"
          content="Adesh Lang, Adesh, programming language, Rust-inspired, native compiler, ADOB, adeshlink, JIT compiler, type aliases, FFI, memory-safe, SIMD, AOT, WASM, systems programming"
        />
        <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(navJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(appJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(howToJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Head>

      <main className="landing-page" id="main-content" ref={pageRef}>
        {/* ═══════════════ HERO ═══════════════ */}
        <header className="hero-m3">
          <div className="hero-m3__inner">
            <div className="hero-m3__copy">
              <div className="hero-brand">
                <img
                  src="/img/logo.svg"
                  alt="Adesh Lang logo"
                  className="hero-brand__logo"
                  width={44}
                  height={44}
                  loading="eager"
                  decoding="async"
                />
                <span className="hero-brand__name">Adesh Lang</span>
              </div>

              <div className="hero-chips">
                <span className="m3-chip m3-chip--primary">
                  <Icon name="science" />
                  Experimental
                </span>
                <span className="m3-chip m3-chip--assist">
                  <Icon name="memory" />
                  Built in Rust
                </span>
                <span className="m3-chip m3-chip--assist">
                  <Icon name="public" />
                  Made in India
                </span>
              </div>

              <h1 className="hero-h1">
                <span className="hero-h1__line">Command. Code.</span>
                <span className="hero-h1__accent">Create at native speed.</span>
              </h1>

              <p className="hero-lead">
                A Rust-inspired systems language with compile-time memory safety, JIT compiler,
                SIMD, type aliases, FFI, and batteries-included networking — with zero-dependency
                native AOT compilation.
              </p>

              <div className="hero-actions">
                <Link className="m3-btn m3-btn--filled" to="/learn/getting-started/quick-start">
                  Get started
                  <Icon name="arrow_forward" />
                </Link>
                <a
                  className="m3-btn m3-btn--tonal"
                  href={EDITOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open web editor
                  <Icon name="open_in_new" />
                </a>
                <a
                  className="m3-btn m3-btn--text"
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                  <Icon name="north_east" />
                </a>
              </div>

              <ul className="hero-facts">
                <li>
                  <Icon name="check_circle" />
                  Runs on 23 platform builds
                </li>
                <li>
                  <Icon name="check_circle" />
                  Zero-cost safety
                </li>
                <li>
                  <Icon name="check_circle" />
                  Free &amp; open source
                </li>
              </ul>
            </div>

            <div className="hero-visual">
              <div className="demo-card">
                <div className="demo-card__bar">
                  <div className="demo-card__file">
                    <Icon name="description" />
                    main.adesh
                  </div>
                  <div className="demo-tabs" role="tablist" aria-label="Hero demo views">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'code'}
                      className="demo-tab"
                      onClick={() => setActiveTab('code')}
                    >
                      code
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'pipeline'}
                      className="demo-tab"
                      onClick={() => setActiveTab('pipeline')}
                    >
                      pipeline
                    </button>
                  </div>
                </div>

                {activeTab === 'code' ? (
                  <div className="demo-code-wrap">
                    <button
                      type="button"
                      className="m3-icon-btn demo-code-copy"
                      aria-label={heroCopied ? 'Copied' : 'Copy code'}
                      title={heroCopied ? 'Copied' : 'Copy code'}
                      onClick={() => copy(heroCode, setHeroCopied)}
                    >
                      <Icon name={heroCopied ? 'check' : 'content_copy'} />
                    </button>
                    <CodeBlock code={heroCode} />
                  </div>
                ) : (
                  <div className="demo-pipeline">
                    {pipelineStages.map((stage) => (
                      <div className="pipeline-stage" key={stage.title}>
                        <span className="pipeline-stage__icon">
                          <Icon name={stage.icon} />
                        </span>
                        <span className="pipeline-stage__copy">
                          <strong>{stage.title}</strong>
                          <span>{stage.detail}</span>
                        </span>
                        <span className={`status-chip status-chip--${stage.tone}`}>{stage.tag}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="demo-output" aria-live="polite">
                  {activeTab === 'code' ? (
                    heroOutput.map((line) => (
                      <span
                        key={line.text}
                        className={`demo-output__line ${
                          line.kind === 'prompt'
                            ? 'demo-output__prompt'
                            : line.kind === 'meta'
                              ? 'demo-output__meta'
                              : 'demo-output__accent'
                        }`}
                      >
                        {line.text}
                      </span>
                    ))
                  ) : (
                    <>
                      <span className="demo-output__line demo-output__prompt">$ adesh build main.adesh</span>
                      <span className="demo-output__line demo-output__meta">
                        [native pipeline: HIR → Machine IR → ADOB v3]
                      </span>
                      <span className="demo-output__line demo-output__accent">
                        built main.exe · 4,096 bytes · PE32+
                      </span>
                      <span className="demo-output__line demo-output__meta">
                        [x86-64 · adeshlink · v0.4.0 preview]
                      </span>
                    </>
                  )}
                </div>

                <div className="demo-card__footer">
                  <span className="m3-chip">
                    <Icon name={activeTab === 'code' ? 'check_circle' : 'construction'} />
                    {activeTab === 'code' ? 'Type-checked' : 'Preview'}
                  </span>
                  <span>HIR → Machine IR → ADOB v3 → adeshlink</span>
                </div>
              </div>

              <div className="hero-float" aria-label="Adesh Lang v0.4.0 native toolchain coming soon">
                <span className="hero-float__icon">
                  <Icon name="auto_awesome" />
                </span>
                <span className="hero-float__copy">
                  <strong>v0.4.0</strong>
                  <span>native toolchain coming soon</span>
                </span>
              </div>
            </div>
          </div>

          {/* Install / download */}
          <div className="install-card">
            <div className="install-card__label">
              <Icon name="download" />
              Get the toolchain
            </div>
            <div className="install-card__platforms">
              {platformChips.map((platform) => (
                <span className="platform-chip" key={platform.label}>
                  <Icon name={platform.icon} />
                  {platform.label}
                </span>
              ))}
            </div>
            <div className="install-card__actions">
              <a
                className="m3-btn m3-btn--filled m3-btn--small"
                href={RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download latest release
                <Icon name="download" />
              </a>
              <Link className="m3-btn m3-btn--outlined m3-btn--small" to="/docs/install">
                Install guide
              </Link>
            </div>
            <p className="install-card__note">
              <Icon name="info" />
              <span>
                <strong>v0.4.0 native builds are coming soon.</strong> Watch releases on GitHub to get
                notified when the native compiler and adeshlink ship.
              </span>
            </p>
          </div>
        </header>

        {/* ═══════════════ STATS ═══════════════ */}
        <section className="stats-band" aria-label="Adesh at a glance">
          <div className="stats-band__inner">
            {stats.map((stat) => (
              <div className="stat" key={stat.label}>
                <div className="stat__value">{stat.value}</div>
                <div className="stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ FEATURES ═══════════════ */}
        <section className="landing-section" id="features">
          <div className="landing-container">
            <div className="section-head reveal">
              <span className="section-eyebrow">
                <Icon name="auto_awesome" />
                Capabilities
              </span>
              <h2 className="section-title">Designed for systems and applications</h2>
              <p className="section-desc">
                Low-level control when you need it, high-level ergonomics when you don&#39;t. One
                language from scripts to native binaries.
              </p>
            </div>

            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card reveal" key={feature.title}>
                  {feature.badge && (
                    <span className="status-chip status-chip--preview feature-badge">
                      {feature.badge}
                    </span>
                  )}
                  <span className="feature-card__icon">
                    <Icon name={feature.icon} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p dangerouslySetInnerHTML={{ __html: feature.body }} />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ v0.4.0 ROADMAP ═══════════════ */}
        <section className="landing-section landing-section--tinted" id="roadmap">
          <div className="landing-container">
            <div className="roadmap-layout">
              <div className="roadmap-intro reveal">
                <span className="section-eyebrow">
                  <Icon name="rocket_launch" />
                  Road to v0.4.0
                </span>
                <h2 className="section-title">The native release is taking shape.</h2>
                <p>
                  v0.4.0 is where Adesh grows its own native toolchain: a real object format, a
                  linker, and machine-code backends. Some pieces are already in the tree and
                  execution-tested; others are still landing.
                </p>

                <div className="version-card">
                  <span className="version-card__label">
                    <Icon name="new_releases" />
                    Next release
                  </span>
                  <div className="version-card__version">v0.4.0</div>
                  <p className="version-card__meta">
                    <strong>Native by design.</strong> The native compiler, ADOB v3, and adeshlink
                    land in the next release. Preview the architecture today.
                  </p>
                  <Link
                    className="m3-btn m3-btn--filled m3-btn--small"
                    to="/docs/compiler/native-toolchain"
                    style={{ marginTop: '1rem' }}
                  >
                    Read the native toolchain docs
                    <Icon name="arrow_forward" />
                  </Link>
                </div>
              </div>

              <ul className="roadmap-list">
                {roadmap.map((item) => (
                  <li className="roadmap-item reveal" key={item.title}>
                    <span className="roadmap-item__icon">
                      <Icon name={item.icon} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.detail}</p>
                    </div>
                    <span className={`status-chip status-chip--${item.status}`}>{item.label}</span>
                    <div className="roadmap-item__bar" aria-hidden="true">
                      <span style={{ width: `${item.progress}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ═══════════════ PLAYGROUND ═══════════════ */}
        <section className="landing-section" id="playground">
          <div className="landing-container">
            <div className="section-head reveal">
              <span className="section-eyebrow">
                <Icon name="code" />
                Live examples
              </span>
              <h2 className="section-title">Explore the syntax, see the output</h2>
              <p className="section-desc">
                Real Adesh programs with syntax highlighting and the output they produce. Switch
                tabs, copy the code, or open it in the browser editor.
              </p>
            </div>

            <div className="playground-shell reveal">
              <div className="playground-bar">
                <div className="playground-bar__file">
                  <Icon name="description" />
                  {activeSnippet.id}.adesh
                </div>
                <div className="playground-tabs" role="tablist" aria-label="Example programs">
                  {snippets.map((snippet) => (
                    <button
                      key={snippet.id}
                      type="button"
                      role="tab"
                      aria-selected={activeSnippet.id === snippet.id}
                      className="playground-tab"
                      onClick={() => setActiveSnippet(snippet)}
                    >
                      {snippet.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="m3-icon-btn"
                  aria-label={snippetCopied ? 'Copied' : 'Copy example'}
                  title={snippetCopied ? 'Copied' : 'Copy example'}
                  onClick={() => copy(activeSnippet.code, setSnippetCopied)}
                  style={{ color: 'var(--code-muted)' }}
                >
                  <Icon name={snippetCopied ? 'check' : 'content_copy'} />
                </button>
              </div>

              <div className="playground-body">
                <div className="playground-pane playground-pane--code">
                  <div className="pane-label">
                    <Icon name="terminal" />
                    {activeSnippet.title}
                  </div>
                  <CodeBlock code={activeSnippet.code} />
                </div>
                <div className="playground-pane playground-pane--output">
                  <div className="pane-label">
                    <Icon name="check_circle" />
                    Output
                  </div>
                  <OutputLines lines={activeSnippet.output} />
                </div>
              </div>

              <div className="playground-footer">
                <span className="playground-footer__hint">
                  <Icon name="info" />
                  6 runnable examples · full syntax highlighting
                </span>
                <a
                  className="m3-btn m3-btn--outlined m3-btn--small"
                  href={EDITOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Try it in the web editor
                  <Icon name="open_in_new" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ BACKENDS ═══════════════ */}
        <section className="landing-section landing-section--tinted" id="backends">
          <div className="landing-container">
            <div className="section-head reveal">
              <span className="section-eyebrow">
                <Icon name="layers" />
                Execution backends
              </span>
              <h2 className="section-title">One language, many execution targets</h2>
              <p className="section-desc">
                The interpreter is the reference implementation. Native JIT, WebAssembly, and AOT
                compilation are maturing on their own schedules, with GPU acceleration planned for a
                future release.
              </p>
            </div>

            <div className="backend-grid">
              {backends.map((backend) => {
                const dotModifier =
                  backend.status === 'full'
                    ? 'full'
                    : backend.status === 'partial'
                      ? 'partial'
                      : 'planned';
                return (
                  <article className="backend-card reveal" key={backend.name}>
                    <div className="backend-card__top">
                      <span className="backend-card__name">{backend.name}</span>
                      <span className={`backend-card__dot backend-card__dot--${dotModifier}`} />
                    </div>
                    <div className={`backend-card__progress backend-card__progress--${dotModifier}`}>
                      <span style={{ width: `${backend.progress}%` }} />
                    </div>
                    <div className="backend-card__meta">
                      {backend.tag} · {backend.meta}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="backend-legend">
              <span className="legend-item">
                <span className="legend-dot legend-dot--full" />
                Reference / full support
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-dot--partial" />
                Partial / in progress
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-dot--planned" />
                Planned
              </span>
            </div>
          </div>
        </section>

        {/* ═══════════════ TOOLING ═══════════════ */}
        <section className="landing-section" id="tooling">
          <div className="landing-container">
            <div className="section-head reveal">
              <span className="section-eyebrow">
                <Icon name="build" />
                Tooling
              </span>
              <h2 className="section-title">Everything ships in one CLI</h2>
              <p className="section-desc">
                Diagnostics, packages, formatting, tests, editor support, and C interop — designed to
                work together without a pile of plugins.
              </p>
            </div>

            <div className="tooling-grid">
              {tools.map((tool) => (
                <article className="tool-card reveal" key={tool.title}>
                  <div className="tool-card__head">
                    <span className="tool-card__icon">
                      <Icon name={tool.icon} />
                    </span>
                    <h3>{tool.title}</h3>
                  </div>
                  <p>{tool.description}</p>
                  <code>{tool.command}</code>
                  <Link className="tool-card__link" to={tool.href}>
                    Read the docs
                    <Icon name="arrow_forward" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ BATTERIES INCLUDED ═══════════════ */}
        <BundledTools />

        {/* ═══════════════ COMMUNITY ═══════════════ */}
        <section className="landing-section landing-section--tinted">
          <div className="landing-container">
            <div className="community-card reveal">
              <div className="community-card__mark" aria-hidden="true">
                <Icon name="code" />
              </div>
              <div>
                <h2>Built in Rust, shaped by community</h2>
                <p>
                  The lexer, parser, type system, IR, native codegen, linker, and runtime are all
                  implemented in Rust. Thank you to the Rust Core Team, the Rust Foundation, and every
                  contributor who makes this ecosystem possible.
                </p>
                <div className="community-actions">
                  <a
                    className="m3-btn m3-btn--tonal m3-btn--small"
                    href="https://www.rust-lang.org"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Explore Rust
                    <Icon name="north_east" />
                  </a>
                  <a
                    className="m3-btn m3-btn--outlined m3-btn--small"
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View source
                    <Icon name="code" />
                  </a>
                  <Link className="m3-btn m3-btn--text m3-btn--small" to="/about">
                    About the project
                    <Icon name="arrow_forward" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ CTA ═══════════════ */}
        <section className="cta-m3">
          <div className="cta-card reveal">
            <div>
              <h2>Start building with Adesh.</h2>
              <p>
                Run your first program in the browser, then install the toolchain and try the native
                pipeline as v0.4.0 lands.
              </p>
            </div>
            <div className="cta-card__actions">
              <Link className="m3-btn m3-btn--filled" to="/learn/getting-started/quick-start">
                Get started
                <Icon name="arrow_forward" />
              </Link>
              <a
                className="m3-btn m3-btn--outlined"
                href={EDITOR_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open web editor
                <Icon name="open_in_new" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
