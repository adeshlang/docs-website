import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';
import { GITHUB_URL } from '../../utils/seo';

const RELEASES_URL = 'https://github.com/adeshlang/adeshlang/releases/latest';
const PORTFOLIO_URL = 'https://www.ajaytainwala.dev';

const footerLinks = [
  {
    title: 'Learn',
    items: [
      { label: 'Learning roadmap', to: '/learn' },
      { label: 'Quick start', to: '/learn/getting-started/quick-start' },
      { label: 'Language guide', to: '/docs/language-guide/basics' },
      { label: 'Examples', to: '/learn-by-examples' },
    ],
  },
  {
    title: 'Toolchain',
    items: [
      { label: 'Native compiler', to: '/docs/compiler/native-toolchain' },
      { label: 'ADOB v3 objects', to: '/docs/compiler/adob' },
      { label: 'adeshlink', to: '/docs/compiler/linker' },
      { label: 'Type aliases', to: '/docs/language-guide/type-aliases' },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'GitHub repository', href: GITHUB_URL },
      { label: 'Ajay Tainwala — Creator', href: PORTFOLIO_URL },
      { label: 'About the project', to: '/about' },
      { label: 'Blog', to: '/blog' },
    ],
  },
];

const socials = [
  { label: 'GitHub', icon: 'code', href: GITHUB_URL },
  { label: 'Ajay Tainwala — creator portfolio', icon: 'language', href: PORTFOLIO_URL },
  { label: 'Email', icon: 'mail', href: 'mailto:ajay@adeshlang.org' },
];

export default function Footer(): JSX.Element | null {
  const { siteConfig } = useDocusaurusContext();
  const { pathname } = useLocation();
  const copyright = `Copyright © ${new Date().getFullYear()} Adesh Project. Built in Bengaluru, India.`;
  const showFooter =
    pathname === '/' || pathname === '/about' || pathname === '/about/' || pathname.startsWith('/blog');

  if (!showFooter) {
    return null;
  }

  return (
    <footer className="landing-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo-row">
            <img
              src="/img/logo.svg"
              alt="Adesh Lang"
              className="footer-logo"
              width={40}
              height={40}
              loading="lazy"
              decoding="async"
            />
            <span className="footer-brand-name">{siteConfig.title}</span>
          </div>
          <p className="footer-tagline">
            Command. Code. Create.
            <br />
            A native-speed, memory-safe language built in Rust.
          </p>
          <p className="footer-credit">
            Created by{' '}
            <a href={PORTFOLIO_URL} target="_blank" rel="me noopener noreferrer">
              Ajay Tainwala
            </a>
          </p>
          <a
            className="footer-version-chip"
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              release_alert
            </span>
            v0.4.0 · Coming soon
          </a>
          <div className="footer-socials">
            {socials.map((social) => (
              <a
                key={social.label}
                className="m3-icon-btn"
                href={social.href}
                target="_blank"
                rel={social.href === PORTFOLIO_URL ? 'me noopener noreferrer' : 'noopener noreferrer'}
                aria-label={social.label}
                title={social.label}
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  {social.icon}
                </span>
              </a>
            ))}
          </div>
        </div>

        {footerLinks.map((col) => (
          <nav className="footer-col" key={col.title} aria-label={col.title}>
            <p className="footer-col-title">{col.title}</p>
            <ul className="footer-col-list">
              {col.items.map((item) =>
                'to' in item ? (
                  <li key={item.label}>
                    <Link to={item.to} className="footer-link">
                      {item.label}
                    </Link>
                  </li>
                ) : (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel={item.href === PORTFOLIO_URL ? 'me noopener noreferrer' : 'noopener noreferrer'}
                      className="footer-link"
                    >
                      {item.label}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </nav>
        ))}
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span className="footer-copyright">{copyright}</span>
          <div className="footer-bottom-links">
            <Link to="/docs">Documentation</Link>
            <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
              Releases
            </a>
            <Link to="/docs/compiler/native-toolchain">Native toolchain</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
