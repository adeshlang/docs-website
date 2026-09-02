import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const footerLinks = [
  {
    title: 'Docs',
    items: [
      { label: 'Quick Start', to: '/getting-started/quick-start' },
      { label: 'Language Guide', to: '/language-guide/basics' },
      { label: 'Backends', to: '/backends/overview' },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'GitHub', href: 'https://github.com/adeshlang/adeshlang' },
      { label: 'Creator Portfolio', href: 'https://ajaytainwala.vercel.app' },
    ],
  },
  {
    title: 'More',
    items: [
      { label: 'About Project', to: '/about' },
      { label: 'Blog', to: '/blog' },
      {
        label: 'Examples',
        href: 'https://github.com/adeshlang/adeshlang/tree/main/examples',
      },
    ],
  },
];

export default function Footer(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const copyright = `Copyright © ${new Date().getFullYear()} AdeshLang Project. Built with Docusaurus.`;

  return (
    <footer className="landing-footer">
      {/* Top gradient accent */}
      <div className="footer-accent-line" />

      {/* Dot pattern overlay */}
      <div className="footer-pattern" />

      <div className="footer-inner">
        {/* Brand column */}
        <div className="footer-brand">
          <div className="footer-logo-row">
            <img src="/img/logo.svg" alt="AdeshLang" className="footer-logo" />
            <span className="footer-brand-name">{siteConfig.title}</span>
          </div>
          <p className="footer-tagline">
            आदेश — Command. Code. Create.
            <br />
            A high-performance, memory-safe programming language.
          </p>
          <div className="footer-socials">
            <a
              href="https://github.com/adeshlang/adeshlang"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-btn"
              aria-label="GitHub"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.485-.135-.765-.72-1.005-1.275-1.005-.57 0-1.5.705-1.5 1.515 0 .855.885 1.605 2.385 1.605 1.275 0 1.965-.855 2.385-1.605.015 1.275.015 2.505.015 2.505s.21 1.605-.36 1.605c-.57 0-1.23-.855-1.23-.855s-.705-.855-1.605-.855c-.885 0-1.605.855-1.605.855s-.855.855-1.605.855c-.57 0-.36-1.605-.36-1.605s.015-1.23.015-2.505c.42.75 1.11 1.605 2.385 1.605 1.5 0 2.385-.75 2.385-1.605 0-.81-.93-1.515-1.5-1.515-.555 0-1.14.24-1.275 1.005-.24 1.29-1.02 2.295-4.035 1.735 4.77 1.59 8.205-6.075 8.205-11.385C24 5.37 18.63 0 12 0z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Link columns */}
        {footerLinks.map((col) => (
          <div className="footer-col" key={col.title}>
            <h4 className="footer-col-title">{col.title}</h4>
            <ul className="footer-col-list">
              {col.items.map((item) => (
                <li key={item.label}>
                  {'to' in item && item.to ? (
                    <Link to={item.to} className="footer-link">
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-link"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span className="footer-copyright">{copyright}</span>
          <div className="footer-tech-badges">
            <span className="footer-badge">Rust</span>
            <span className="footer-badge">Cranelift</span>
            <span className="footer-badge">MLIR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
