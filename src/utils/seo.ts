/**
 * SEO & GEO — Central configuration & JSON-LD schema generators
 * Used by theme Root, SEO components, and Docusaurus Head.
 */

// ---------------------------------------------------------------------------
// Site constants — keep in sync with docusaurus.config.ts
// ---------------------------------------------------------------------------
export const SITE_URL = 'https://adeshlang.github.io';
export const SITE_NAME = 'AdeshLang';
export const SITE_TITLE = 'AdeshLang — High-Performance Memory-Safe Language';
export const SITE_TAGLINE =
  'आदेश (Adesh) — Command. Code. Create. | High-Performance, Memory-Safe Programming Language';
export const SITE_DESCRIPTION =
  'AdeshLang (आदेश) — a modern, Rust-inspired, high-performance programming language with Cranelift native JIT (10–230× speedups), zero-cost compile-time memory safety, hardware SIMD, and batteries-included networking. Experimental, open-source, built with Rust.';
export const SITE_AUTHOR = 'Ajay Tainwala';
export const SITE_AUTHOR_URL = 'https://ajaytainwala.vercel.app';
export const GITHUB_URL = 'https://github.com/adeshlang/adeshlang';
export const SOCIAL_IMAGE = `${SITE_URL}/img/social-card.jpg`;
export const LOGO_URL = `${SITE_URL}/img/logo.svg`;
export const FAVICON_URL = `${SITE_URL}/img/favicon.ico`;

export const SITE_KEYWORDS = [
  'AdeshLang',
  'Adesh programming language',
  'Rust-inspired language',
  'Cranelift JIT',
  'memory-safe language',
  'systems programming',
  'zero-cost abstractions',
  'SIMD',
  'AOT compilation',
  'Bytecode VM',
  'WebAssembly',
  'compiler',
  'programming language',
  'high-performance language',
  'India programming language',
  'Bharat',
  'LSP',
  'package manager ADL',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith('http')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

// ---------------------------------------------------------------------------
// JSON-LD Schema factories
// ---------------------------------------------------------------------------

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** Organization — GEO: who maintains the project */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AdeshLang Project',
    url: SITE_URL,
    logo: LOGO_URL,
    image: SOCIAL_IMAGE,
    description: SITE_DESCRIPTION,
    foundingLocation: { '@type': 'Place', name: 'Bengaluru, India' },
    founder: {
      '@type': 'Person',
      name: SITE_AUTHOR,
      url: SITE_AUTHOR_URL,
      jobTitle: 'Creator & Lead Architect of AdeshLang',
      sameAs: [
        'https://github.com/ajaytainwala-dev',
        'https://in.linkedin.com/in/ajay-tainwala',
        SITE_AUTHOR_URL,
        GITHUB_URL,
      ],
    },
    sameAs: [GITHUB_URL, SITE_AUTHOR_URL],
  };
}

/** WebSite — enables Sitelinks SearchBox for SEO */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@type': 'Organization', name: 'AdeshLang Project', logo: { '@type': 'ImageObject', url: LOGO_URL } },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** SoftwareApplication — core GEO entity for programming language discoverability */
export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    alternateName: 'AdeshLang Programming Language',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    image: SOCIAL_IMAGE,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Windows, macOS, Linux',
    programmingLanguage: 'Rust',
    author: {
      '@type': 'Person',
      name: SITE_AUTHOR,
      url: SITE_AUTHOR_URL,
    },
    maintainer: {
      '@type': 'Organization',
      name: 'AdeshLang Project',
      url: SITE_URL,
    },
    license: 'https://github.com/adeshlang/adeshlang/blob/main/LICENSE',
    codeRepository: GITHUB_URL,
    softwareVersion: '0.3.0',
    isAccessibleForFree: true,
    keywords: SITE_KEYWORDS.join(', '),
    featureList: [
      'Cranelift native JIT (10–230× speedup)',
      'Zero-cost compile-time memory safety',
      'Hardware SIMD (AVX2, ARM Neon)',
      'Multi-backend execution (Interpreter, JIT, AOT, WASM, GPU MLIR)',
      'Batteries-included networking (TCP, UDP, HTTP, WebSocket, TLS, DNS)',
      'Integrated formatter, package manager ADL, LSP (ALS), test harness',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

/** TechArticle — for documentation pages, great for GEO */
export function techArticleSchema(opts: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: opts.headline,
    description: opts.description,
    url: absoluteUrl(opts.url),
    image: opts.image ? absoluteUrl(opts.image) : SOCIAL_IMAGE,
    author: { '@type': 'Person', name: SITE_AUTHOR, url: SITE_AUTHOR_URL },
    publisher: {
      '@type': 'Organization',
      name: 'AdeshLang Project',
      logo: { '@type': 'ImageObject', url: LOGO_URL },
    },
    inLanguage: 'en',
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(opts.url) },
    proficiencyLevel: 'Beginner to Advanced',
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
  };
}

/** BreadcrumbList — SEO navigation */
export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

/** FAQPage — GEO gold: Q&A pairs are directly ingested by LLMs */
export function faqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/** HowTo — for quick-start / installation */
export function howToSchema(opts: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: opts.name,
    description: opts.description,
    totalTime: 'PT5M',
    tool: [{ '@type': 'HowToTool', name: 'Terminal' }],
    step: opts.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${absoluteUrl(opts.url)}#step-${i + 1}`,
    })),
  };
}

/** Person — for About page */
export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_AUTHOR,
    url: SITE_AUTHOR_URL,
    image: 'https://ajaytainwala.vercel.app/Profile/AjayTainwala.jpg',
    jobTitle: 'Creator & Lead Architect of AdeshLang',
    worksFor: { '@type': 'Organization', name: 'AdeshLang Project', url: SITE_URL },
    sameAs: [
      'https://github.com/ajaytainwala-dev',
      'https://in.linkedin.com/in/ajay-tainwala',
      GITHUB_URL,
      SITE_AUTHOR_URL,
    ],
    knowsAbout: ['Programming Languages', 'Compilers', 'Rust', 'Systems Programming', 'JIT Compilation'],
  };
}
