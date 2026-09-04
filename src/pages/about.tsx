import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function About(): JSX.Element {
  return (
    <Layout
      title="About AdeshLang & Creator Ajay Tainwala"
      description="Learn about AdeshLang programming language design and its creator, Ajay Tainwala — Full Stack Developer & Software Engineer."
    >
      <main style={{ padding: '4rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="hero-badge" style={{ marginBottom: '1rem' }}>
            <span>🚀 About the Project & Creator</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>
            About <span className="gradient-text">AdeshLang</span>
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.85, maxWidth: '720px', margin: '0 auto' }}>
            Building a modern, high-performance, memory-safe programming language with Cranelift native compilation and zero-cost safety abstractions.
          </p>
        </div>

        {/* Section 1: About AdeshLang */}
        <section className="glass-card" style={{ marginBottom: '3rem', padding: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#34d399', marginBottom: '1.5rem' }}>
            What is AdeshLang?
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', opacity: 0.9 }}>
            <strong>AdeshLang (आदेश)</strong> — meaning <em>"Command"</em> — is an <strong>experimental programming language</strong> built to explore language design, compiler architectures, and zero-cost safety abstractions.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', opacity: 0.9 }}>
            The <strong>Tree-Walk Interpreter</strong> is currently the <strong>main reflection and primary source of truth</strong> for AdeshLang execution and standard library behavior. Other backends — including Cranelift Native JIT, AOT compilation, Bytecode VM, WASM, and GPU MLIR lowering — are under active experimental development.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', opacity: 0.9 }}>
            🦀 <strong>Made with Rust</strong>: The entire AdeshLang toolchain (lexer, parser, AST, IR lowerings, CLI harness) is built in <strong>Rust</strong>. We give a massive shoutout to the <strong>Rust Core Team</strong>, the <strong>Rust Foundation</strong>, and the global <strong>Rust Community</strong> for empowering developers with the world's finest systems programming platform.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '2rem' }}>
            <div style={{ background: 'var(--btn-glass-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🛡️</div>
              <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--card-heading)' }}>Zero-Cost Safety</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--card-text)' }}>Compile-time reference & borrow checking without GC pauses.</span>
            </div>

            <div style={{ background: 'var(--btn-glass-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>⚡</div>
              <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--card-heading)' }}>Cranelift Native JIT</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--card-text)' }}>Runtime native codegen via function pointers (10-230x faster).</span>
            </div>

            <div style={{ background: 'var(--btn-glass-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🌐</div>
              <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--card-heading)' }}>Builtin Networking</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--card-text)' }}>Native TCP, UDP, HTTP, WebSockets, DNS, and TLS modules.</span>
            </div>
          </div>
        </section>

        {/* Section 2: Creator Ajay Tainwala */}
        <section className="glass-card" style={{ padding: '2.5rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
            <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
              <img
                src="https://ajaytainwala.vercel.app/Profile/AjayTainwala.jpg"
                alt="Ajay Tainwala"
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #38bdf8',
                  boxShadow: '0 0 25px rgba(56, 189, 248, 0.4)',
                }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  // Fallback avatar if image fails to load externally
                  e.currentTarget.src = '/img/logo.svg';
                }}
              />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '1rem', marginBottom: '0.25rem' }}>
                Ajay Tainwala
              </h3>
              <p style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.95rem' }}>
                Creator & Lead Architect of AdeshLang
              </p>
            </div>

            <div style={{ flex: '2 1 400px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '1rem' }}>
                Meet the Creator
              </h2>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.7', opacity: 0.9 }}>
                <strong>Ajay Tainwala</strong> is a passionate Software Engineer, Full Stack Developer, and compiler enthusiast based in Bengaluru, India.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.7', opacity: 0.9 }}>
                Ajay's deep interest in language design, memory architecture, compiler optimizations, and web technologies led him to design and build AdeshLang from scratch — spanning parser design, AST lowering, LIR IR representation, Cranelift JIT integration, and a comprehensive standard library.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                <a
                  className="btn-primary-glow"
                  href="https://ajaytainwala.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)' }}
                >
                  🌐 Visit Portfolio (ajaytainwala.vercel.app) ↗
                </a>

                <a
                  className="btn-secondary-glass"
                  href="https://github.com/ajaytainwala-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub @ajaytainwala-dev ↗
                </a>

                <a
                  className="btn-secondary-glass"
                  href="https://in.linkedin.com/in/ajay-tainwala"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Contact & Collab */}
        <section style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Interested in Collaborating or Contributing?</h3>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
            Reach out via email at <a href="mailto:ajaytainwala@outlook.com" style={{ color: '#34d399', fontWeight: 600 }}>ajaytainwala@outlook.com</a> or visit the <a href="https://github.com/adeshlang/adeshlang" style={{ color: '#38bdf8', fontWeight: 600 }}>GitHub repository</a>.
          </p>
          <Link className="btn-primary-glow" to="/getting-started/quick-start">
            Explore Quick Start Guide →
          </Link>
        </section>
      </main>
    </Layout>
  );
}
