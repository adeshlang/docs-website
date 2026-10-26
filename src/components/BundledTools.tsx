import React from 'react';
import Link from '@docusaurus/Link';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-rounded ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

const ARO_URL = 'https://github.com/adeshlang/adeshlang/tree/main/ARO';
const MCP_URL = 'https://github.com/adeshlang/adesh-mcp';

const interfaces = ['Desktop GUI', 'Interactive TUI', 'Scriptable CLI'];

export default function BundledTools(): JSX.Element {
  return (
    <section className="landing-section bundled-section" id="bundled">
      <div className="landing-container">
        <div className="section-head reveal">
          <span className="section-eyebrow">
            <Icon name="inventory_2" />
            Batteries included
          </span>
          <h2 className="section-title">More than a compiler in the box</h2>
          <p className="section-desc">
            Every Adesh download ships with an observability platform, a terminal IDE, and an MCP
            server — so you can see, edit, and automate every run without assembling a separate
            toolchain.
          </p>
        </div>

        <div className="bundled-grid reveal">
          <article className="bundled-card bundled-card--aro">
            <div className="bundled-card__head">
              <span className="bundled-card__icon bundled-card__icon--primary">
                <Icon name="monitoring" />
              </span>
              <span className="bundled-kicker">ARO · Runtime telemetry</span>
            </div>
            <h3>Adesh Runtime Observatory</h3>
            <p>
              Live telemetry for every Adesh session: CPU and memory metrics, compiler and linker
              stage timelines, exit codes, and exportable reports backed by durable SQLite history.
            </p>
            <div className="bundled-interfaces">
              {interfaces.map((label) => (
                <span className="bundled-interface" key={label}>
                  <Icon
                    name={
                      label === 'Desktop GUI'
                        ? 'desktop_windows'
                        : label === 'Interactive TUI'
                          ? 'terminal'
                          : 'data_object'
                    }
                  />
                  {label}
                </span>
              ))}
            </div>
            <div className="bundled-commands">
              <code>
                <span>$</span> adesh monitor
              </code>
              <code>
                <span>$</span> adesh monitor tui
              </code>
            </div>
            <a
              className="bundled-card__link"
              href={ARO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore ARO on GitHub
              <Icon name="north_east" />
            </a>
          </article>

          <article className="bundled-card">
            <div className="bundled-card__head">
              <span className="bundled-card__icon bundled-card__icon--tertiary">
                <Icon name="terminal" />
              </span>
              <span className="bundled-kicker">TUI · Code editor</span>
            </div>
            <h3>TUI Code Editor</h3>
            <p>
              A full IDE inside your terminal: workspace explorer, multi-buffer tabs, LSP
              diagnostics, fuzzy command palette, and a runner wired to the interpreter, Native JIT,
              and AOT.
            </p>
            <div className="bundled-commands">
              <code>
                <span>$</span> adesh editor .
              </code>
            </div>
            <Link className="bundled-card__link" to="/docs/tools/tui-editor">
              Read the editor guide
              <Icon name="arrow_forward" />
            </Link>
          </article>

          <article className="bundled-card bundled-card--mcp">
            <div className="bundled-card__body">
              <div className="bundled-card__head">
                <span className="bundled-card__icon bundled-card__icon--secondary">
                  <Icon name="smart_toy" />
                </span>
                <span className="bundled-kicker">AI · Model Context Protocol</span>
              </div>
              <h3>Adesh MCP Server</h3>
              <p>
                Connect Claude, Cursor, Windsurf, Copilot, or any MCP client to the Adesh toolchain.
                The server exposes the compiler, ARO telemetry, ADOB inspection, adeshlink, the
                runtime, and ADL packages as typed tools.
              </p>
              <div className="bundled-commands">
                <code>
                  <span>$</span> adesh-mcp
                </code>
              </div>
            </div>
            <div className="bundled-card__aside">
              <span className="bundled-repo">
                <Icon name="code" />
                adeshlang/adesh-mcp
              </span>
              <a
                className="m3-btn m3-btn--outlined m3-btn--small"
                href={MCP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
                <Icon name="north_east" />
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
