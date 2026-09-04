import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';

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

export default function Footer(): JSX.Element | null {
  const { siteConfig } = useDocusaurusContext();
  const { pathname } = useLocation();
  const copyright = `Copyright © ${new Date().getFullYear()} AdeshLang Project. Built in Namma Bengaluru, India.`;
  const showFooter = pathname === '/' || pathname === '/about' || pathname === '/about/' || pathname.startsWith('/blog');

  if (!showFooter) {
    return null;
  }

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
        </div>
      </div>
    </footer>
  );
}
