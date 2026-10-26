import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Head from '@docusaurus/Head';
import { SITE_URL, GITHUB_URL, personSchema, breadcrumbSchema } from '../utils/seo';

const RELEASES_URL = 'https://github.com/adeshlang/adeshlang/releases/latest';
const PORTFOLIO_URL = 'https://www.ajaytainwala.dev';

const facts = [
  {
    icon: 'memory',
    title: 'Native toolchain',
    body: 'HIR → Machine IR → ADOB v3 objects → adeshlink → PE, ELF, and Mach-O executables.',
  },
  {
    icon: 'shield',
    title: 'Zero-cost safety',
    body: 'Compile-time reference and borrow checking without a garbage collector or pause.',
  },
  {
    icon: 'bolt',
    title: 'Cranelift JIT',
    body: 'Runtime native code generation for compute-heavy workloads.',
  },
  {
    icon: 'lan',
    title: 'Networking built in',
    body: 'TCP, UDP, HTTP, WebSocket, DNS, TLS, and JSON ship with the standard library.',
  },
];

const previewFeatures = [
  {
    icon: 'account_tree',
    title: 'HIR & Machine IR',
    body: 'Platform-aware lowering from a typed high-level IR down to machine instructions.',
  },
  {
    icon: 'inventory_2',
    title: 'ADOB v3 objects',
    body: 'A validated native object format with symbols, relocations, and section metadata.',
  },
  {
    icon: 'link',
    title: 'adeshlink',
    body: 'A native linker with garbage collection, identical code folding, and relocation support.',
  },
  {
    icon: 'deployed_code',
    title: 'Real executables',
    body: 'x86-64 PE output is execution-tested; AArch64, RISC-V, Mach-O, and WASM are in progress.',
  },
];

export default function About(): JSX.Element {
  const personJsonLd = personSchema();
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
  ]);

  return (
    <Layout
      title="About Adesh Lang & Creator Ajay Tainwala"
      description="Meet Ajay Tainwala, creator of Adesh — a native-speed, memory-safe programming language built with Rust, Cranelift, ADOB v3 objects, and adeshlink."
    >
      <Head>
        <link rel="canonical" href={`${SITE_URL}/about`} />
        <meta
          name="keywords"
          content="Adesh, Ajay Tainwala, native compiler, programming language creator, Bengaluru, Rust, Cranelift, adeshlink"
        />
        <script type="application/ld+json">{JSON.stringify(personJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Head>

      <main className="about-page">
        <header className="about-hero">
          <span className="m3-chip">
            <span className="material-symbols-rounded" aria-hidden="true">
              rocket_launch
            </span>
            About the project &amp; creator
          </span>
          <h1>
            About <span className="gradient-text">Adesh Lang</span>
          </h1>
          <p>
            Building a native-speed, memory-safe programming language with a real compiler,
            a real linker, and zero-cost safety abstractions.
          </p>
        </header>

        <section className="about-section">
          <h2>What is Adesh?</h2>
          <p>
            <strong>Adesh</strong> — meaning <em>&ldquo;Command&rdquo;</em> — is an
            experimental programming language built to explore language design, compiler
            architectures, and zero-cost safety. The <strong>tree-walk interpreter</strong>{' '}
            remains the reference implementation and source of truth for language semantics
            and standard-library behavior.
          </p>
          <p>
            <strong>v0.4.0 is coming soon</strong> and focuses on native execution: a complete
            pipeline from typed HIR through Machine IR to ADOB v3 object files, linked into
            standalone executables by <code>adeshlink</code>. The native JIT, AOT, and WASM
            targets continue to evolve alongside it, with GPU acceleration planned for a future
            release.
          </p>
          <p>
            <strong>Made with Rust:</strong> the entire toolchain — lexer, parser, AST, IR
            lowerings, linker, and CLI harness — is built in Rust. Thanks to the Rust Core
            Team, the Rust Foundation, and the global Rust community for the platform that
            made it possible.
          </p>

          <div className="about-fact-grid">
            {facts.map((fact) => (
              <div className="about-fact" key={fact.title}>
                <span className="material-symbols-rounded" aria-hidden="true">
                  {fact.icon}
                </span>
                <strong>{fact.title}</strong>
                <span>{fact.body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <span className="m3-chip">
            <span className="material-symbols-rounded" aria-hidden="true">
              release_alert
            </span>
            v0.4.0 preview
          </span>
          <h2>Native features on the way</h2>
          <p>
            Adesh is moving from an interpreter-first runtime to a native toolchain you can
            ship. The work is incremental and openly tracked — here is what the v0.4.0 release
            brings.
          </p>

          <div className="about-fact-grid">
            {previewFeatures.map((feature) => (
              <div className="about-fact" key={feature.title}>
                <span className="material-symbols-rounded" aria-hidden="true">
                  {feature.icon}
                </span>
                <strong>{feature.title}</strong>
                <span>{feature.body}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Link className="m3-btn m3-btn--filled" to="/docs/compiler/native-toolchain">
              <span className="material-symbols-rounded" aria-hidden="true">
                developer_board
              </span>
              Explore the native toolchain
            </Link>
            <a
              className="m3-btn m3-btn--outlined"
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                download
              </span>
              Latest release
            </a>
          </div>
        </section>

        <section className="about-section">
          <div className="about-creator">
            <div>
              <img
                className="about-creator__portrait"
                src="/img/ajay-tainwala.jpg"
                alt="Ajay Tainwala"
                width={180}
                height={180}
                loading="lazy"
                decoding="async"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = '/img/logo.svg';
                }}
              />
              <p className="about-creator__name">Ajay Tainwala</p>
              <p className="about-creator__role">Creator &amp; Lead Architect</p>
            </div>

            <div>
              <h2>Meet the creator</h2>
              <p>
                <a href={PORTFOLIO_URL} target="_blank" rel="me noopener noreferrer">
                  <strong>Ajay Tainwala</strong>
                </a>{' '}
                is a software engineer, full-stack developer, and compiler enthusiast based in
                Bengaluru, India.
              </p>
              <p>
                His interest in language design, memory architecture, and compiler
                optimizations led him to build Adesh from scratch — spanning parser
                design, AST lowering, IR representation, Cranelift integration, native code
                generation, and a complete standard library.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
                <a
                  className="m3-btn m3-btn--filled"
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="me noopener noreferrer"
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    language
                  </span>
                  Visit ajaytainwala.dev
                </a>
                <a
                  className="m3-btn m3-btn--outlined"
                  href="https://github.com/ajaytainwala-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    code
                  </span>
                  GitHub
                </a>
                <a
                  className="m3-btn m3-btn--text"
                  href="https://in.linkedin.com/in/ajay-tainwala"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    work
                  </span>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="about-contact">
          <h3>Interested in collaborating?</h3>
          <p>
            Reach out at{' '}
            <a href="mailto:ajay@adeshlang.org">ajay@adeshlang.org</a> or open an
            issue on <a href={GITHUB_URL}>GitHub</a>.
          </p>
          <Link className="m3-btn m3-btn--filled" to="/learn/getting-started/quick-start">
            <span className="material-symbols-rounded" aria-hidden="true">
              rocket_launch
            </span>
            Start building
          </Link>
        </section>
      </main>
    </Layout>
  );
}
