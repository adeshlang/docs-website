/**
 * SEO & GEO — Central configuration & JSON-LD schema generators
 * Used by theme Root, SEO components, and Docusaurus Head.
 */

// ---------------------------------------------------------------------------
// Site constants — keep in sync with docusaurus.config.ts
// ---------------------------------------------------------------------------
export const SITE_URL = 'https://www.adeshlang.org';
export const SITE_NAME = 'AdeshLang';
export const SITE_TITLE = 'AdeshLang — High-Performance Memory-Safe Language';
export const SITE_TAGLINE =
  'आदेश (Adesh) — Command. Code. Create. | High-Performance, Memory-Safe Programming Language';
export const SITE_DESCRIPTION =
  'AdeshLang (आदेश) — a Rust-inspired, high-performance programming language with Cranelift native JIT (10–230× speedup), memory safety, SIMD, and networking.';
export const SITE_AUTHOR = 'Ajay Tainwala';
export const SITE_AUTHOR_URL = 'https://ajaytainwala.vercel.app';
export const GITHUB_URL = 'https://github.com/adeshlang/adeshlang';
export const EDITOR_URL = 'https://editor.adeshlang.org';
export const SOCIAL_IMAGE = `${SITE_URL}/img/social-card.jpg`;
export const LOGO_URL = `${SITE_URL}/img/logo.svg`;
export const FAVICON_URL = `${SITE_URL}/img/favicon.ico`;

export const SITE_KEYWORDS = [
  'AdeshLang',
  'Adesh programming language',
  'Adesh Lang',
  'आदेश',
  'Rust-inspired language',
  'Cranelift JIT',
  'Cranelift Native JIT',
  'memory-safe language',
  'systems programming',
  'zero-cost abstractions',
  'SIMD',
  'AVX2',
  'ARM Neon',
  'AOT compilation',
  'Bytecode VM',
  'Tree-Walk Interpreter',
  'WebAssembly',
  'WASM compiler',
  'compiler design',
  'programming language',
  'high-performance language',
  'type inference',
  'pattern matching',
  'algebraic data types',
  'borrow checker',
  'ownership model',
  'HTTP client',
  'WebSocket stdlib',
  'ALS LSP',
  'Adesh Language Server',
  'ADL package manager',
  'TUI Code Editor',
  'India programming language',
  'Bharat',
  'Bengaluru software',
  'Ajay Tainwala',
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

/** SiteNavigationElement ItemList — triggers prominent Google Sitelinks for website sub-links */
export function siteNavigationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AdeshLang Navigation & Core Sections',
    itemListElement: [
      {
        '@type': 'SiteNavigationElement',
        position: 1,
        name: 'Learn AdeshLang',
        description: 'Guided progressive roadmap for learning AdeshLang programming from basics to advanced systems.',
        url: `${SITE_URL}/learn`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 2,
        name: 'Quick Start Guide',
        description: 'Install AdeshLang and run your first program in under 5 minutes.',
        url: `${SITE_URL}/learn/getting-started/quick-start`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 3,
        name: 'Installation Guide',
        description: 'Detailed install commands for Windows, macOS, and Linux.',
        url: `${SITE_URL}/docs/install`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 4,
        name: 'Learn by Examples',
        description: 'Complete runnable programs with terminal output for every language feature.',
        url: `${SITE_URL}/learn-by-examples`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 5,
        name: 'Documentation Reference',
        description: 'Comprehensive language reference, compiler backends, and standard library documentation.',
        url: `${SITE_URL}/docs`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 6,
        name: 'Language Guide',
        description: 'Variables, types, control flow, functions, structs, enums, and pattern matching.',
        url: `${SITE_URL}/docs/language-guide/basics`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 7,
        name: 'Cranelift Native JIT',
        description: 'High-performance native JIT execution backend with 10–230× speedups.',
        url: `${SITE_URL}/docs/backends/native-jit`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 8,
        name: 'Memory Safety Model',
        description: 'Compile-time single-ownership and borrow checking with zero-cost abstractions.',
        url: `${SITE_URL}/docs/advanced/memory-safety`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 9,
        name: 'Standard Library',
        description: 'Built-in modules for networking, HTTP, WebSockets, JSON, FS, and cryptography.',
        url: `${SITE_URL}/docs/builtin/overview`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 10,
        name: 'Online Web Editor',
        description: 'Interactive online playground to write and run AdeshLang code in the browser.',
        url: EDITOR_URL,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 11,
        name: 'About Creator & Project',
        description: 'Meet creator Ajay Tainwala and learn about the design philosophy of AdeshLang.',
        url: `${SITE_URL}/about`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 12,
        name: 'Engineering Blog',
        description: 'Compiler deep-dives, release notes, and systems programming articles.',
        url: `${SITE_URL}/blog`,
      },
    ],
  };
}

/** WebSite — enables Sitelinks SearchBox & sub-pages mapping for SEO */
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
    hasPart: [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/learn`,
        name: 'Learn AdeshLang',
        description: 'Guided progressive roadmap for learning AdeshLang programming.',
        url: `${SITE_URL}/learn`,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/learn/getting-started/quick-start`,
        name: 'Quick Start',
        description: '5-minute quick start tutorial for AdeshLang.',
        url: `${SITE_URL}/learn/getting-started/quick-start`,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/docs/install`,
        name: 'Install AdeshLang',
        description: 'Installation instructions for all supported operating systems.',
        url: `${SITE_URL}/docs/install`,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/learn-by-examples`,
        name: 'Learn by Examples',
        description: 'Example catalog with runnable code and terminal evaluation outputs.',
        url: `${SITE_URL}/learn-by-examples`,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/docs`,
        name: 'Documentation Reference',
        description: 'Reference docs for the language, compiler, runtime, and standard library.',
        url: `${SITE_URL}/docs`,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/docs/language-guide/basics`,
        name: 'Language Guide Basics',
        description: 'Comprehensive syntax and language guide.',
        url: `${SITE_URL}/docs/language-guide/basics`,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/about`,
        name: 'About AdeshLang',
        description: 'About the AdeshLang project mission and creator Ajay Tainwala.',
        url: `${SITE_URL}/about`,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/blog`,
        name: 'AdeshLang Blog',
        description: 'Engineering deep-dives and compiler updates.',
        url: `${SITE_URL}/blog`,
      },
    ],
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

/** SoftwareSourceCode — for example & runnable code pages */
export function softwareSourceCodeSchema(opts: {
  name: string;
  description: string;
  codeSample: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: opts.name,
    description: opts.description,
    programmingLanguage: 'AdeshLang',
    runtimePlatform: 'Adesh Runtime (x86_64, AArch64, WASM)',
    codeRepository: GITHUB_URL,
    url: absoluteUrl(opts.url),
    text: opts.codeSample,
    author: { '@type': 'Person', name: SITE_AUTHOR, url: SITE_AUTHOR_URL },
  };
}

/** Course — for guided tutorial paths in /learn */
export function courseSchema(opts: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: opts.name,
    description: opts.description,
    provider: {
      '@type': 'Organization',
      name: 'AdeshLang Project',
      sameAs: SITE_URL,
    },
    url: absoluteUrl(opts.url),
    isAccessibleForFree: true,
    inLanguage: 'en',
  };
}

