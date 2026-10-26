/**
 * SEO & GEO — Central configuration & JSON-LD schema generators
 * Used by theme Root, SEO components, and Docusaurus Head.
 */

// ---------------------------------------------------------------------------
// Site constants — keep in sync with docusaurus.config.ts
// ---------------------------------------------------------------------------
export const SITE_URL = 'https://www.adeshlang.org';
export const SITE_NAME = 'Adesh Lang';
export const SITE_TITLE = 'Adesh Lang — Native-Speed, Memory-Safe Language';
export const SITE_TAGLINE =
  'Adesh — Command. Code. Create. | Native-Speed, Memory-Safe Programming';
export const SITE_DESCRIPTION =
  'Adesh is a Rust-inspired programming language with a native compiler and linker, Cranelift JIT, compile-time memory safety, SIMD, type aliases, FFI, and batteries-included networking.';
export const SITE_AUTHOR = 'Ajay Tainwala';
export const SITE_AUTHOR_URL = 'https://www.ajaytainwala.dev';
export const SITE_AUTHOR_GITHUB = 'https://github.com/ajaytainwala-dev';
export const SITE_AUTHOR_LINKEDIN = 'https://in.linkedin.com/in/ajay-tainwala';
export const SITE_AUTHOR_IMAGE = `${SITE_URL}/img/ajay-tainwala.jpg`;
export const SITE_AUTHOR_SAME_AS = [
  SITE_AUTHOR_URL,
  SITE_AUTHOR_GITHUB,
  SITE_AUTHOR_LINKEDIN,
];
export const GITHUB_URL = 'https://github.com/adeshlang/adeshlang';
export const EDITOR_URL = 'https://editor.adeshlang.org';
export const SOCIAL_IMAGE = `${SITE_URL}/img/social-card.jpg`;
export const LOGO_URL = `${SITE_URL}/img/logo.svg`;
export const FAVICON_URL = `${SITE_URL}/img/favicon.ico`;

export const SITE_KEYWORDS = [
  'Adesh',
  'Adesh programming language',
  'Adesh Lang',
  'Rust-inspired language',
  'Cranelift JIT',
  'Cranelift Native JIT',
  'native compiler',
  'native linker',
  'ADOB object format',
  'adeshlink',
  'FFI',
  'type aliases',
  'memory-safe language',
  'systems programming',
  'zero-cost abstractions',
  'SIMD',
  'AVX2',
  'ARM Neon',
  'AOT compilation',
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
  'Bengaluru',
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

/** Canonical author entity shared by every schema for stronger name association. */
function authorRef() {
  return {
    '@type': 'Person',
    name: SITE_AUTHOR,
    url: SITE_AUTHOR_URL,
    image: SITE_AUTHOR_IMAGE,
    sameAs: SITE_AUTHOR_SAME_AS,
  };
}

/** Organization — GEO: who maintains the project */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Adesh Project',
    url: SITE_URL,
    logo: LOGO_URL,
    image: SOCIAL_IMAGE,
    description: SITE_DESCRIPTION,
    foundingLocation: { '@type': 'Place', name: 'Bengaluru, India' },
    founder: {
      ...authorRef(),
      jobTitle: 'Creator & Lead Architect of Adesh',
    },
    sameAs: [GITHUB_URL, SITE_AUTHOR_URL],
  };
}

/** SiteNavigationElement ItemList — triggers prominent Google Sitelinks for website sub-links */
export function siteNavigationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Adesh Navigation & Core Sections',
    itemListElement: [
      {
        '@type': 'SiteNavigationElement',
        position: 1,
        name: 'Learn Adesh',
        description: 'Guided progressive roadmap for learning Adesh programming from basics to advanced systems.',
        url: `${SITE_URL}/learn`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 2,
        name: 'Quick Start Guide',
        description: 'Install Adesh and run your first program in under 5 minutes.',
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
        description: 'High-performance native JIT execution backend for compute-heavy workloads.',
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
        description: 'Interactive online playground to write and run Adesh code in the browser.',
        url: EDITOR_URL,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 11,
        name: 'About Creator & Project',
        description: 'Meet creator Ajay Tainwala and learn about the design philosophy of Adesh.',
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
    publisher: { '@type': 'Organization', name: 'Adesh Project', logo: { '@type': 'ImageObject', url: LOGO_URL } },
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
        name: 'Learn Adesh',
        description: 'Guided progressive roadmap for learning Adesh programming.',
        url: `${SITE_URL}/learn`,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/learn/getting-started/quick-start`,
        name: 'Quick Start',
        description: '5-minute quick start tutorial for Adesh.',
        url: `${SITE_URL}/learn/getting-started/quick-start`,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/docs/install`,
        name: 'Install Adesh',
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
        name: 'About Adesh',
        description: 'About the Adesh project mission and creator Ajay Tainwala.',
        url: `${SITE_URL}/about`,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/blog`,
        name: 'Adesh Blog',
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
    alternateName: 'Adesh Programming Language',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    image: SOCIAL_IMAGE,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Windows, macOS, Linux',
    programmingLanguage: 'Rust',
    author: authorRef(),
    maintainer: {
      '@type': 'Organization',
      name: 'Adesh Project',
      url: SITE_URL,
    },
    license: 'https://github.com/adeshlang/adeshlang/blob/main/LICENSE',
    codeRepository: GITHUB_URL,
    softwareVersion: '0.4.0-preview',
    isAccessibleForFree: true,
    keywords: SITE_KEYWORDS.join(', '),
    featureList: [
      'Native compiler pipeline: HIR → Machine IR → ADOB v3 → adeshlink',
      'Cranelift native JIT',
      'Zero-cost compile-time memory safety',
      'Type aliases, record types, and the `type` keyword',
      'Foreign Function Interface with C ABI calling conventions',
      'Hardware SIMD (AVX2, ARM Neon)',
      'Multi-target execution (Interpreter, Native JIT, AOT, WASM, GPU planned)',
      'Batteries-included networking (TCP, UDP, HTTP, WebSocket, TLS, DNS)',
      'Integrated formatter, package manager ADL, LSP (ALS), and test harness',
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
    author: authorRef(),
    publisher: {
      '@type': 'Organization',
      name: 'Adesh Project',
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
    '@id': `${SITE_URL}/about#ajay-tainwala`,
    name: SITE_AUTHOR,
    url: SITE_AUTHOR_URL,
    image: SITE_AUTHOR_IMAGE,
    description:
      'Ajay Tainwala is a software engineer, full-stack developer, and compiler enthusiast in Bengaluru, India. He is the creator of Adesh.',
    jobTitle: 'Creator & Lead Architect of Adesh',
    worksFor: { '@type': 'Organization', name: 'Adesh Project', url: SITE_URL },
    mainEntityOfPage: { '@type': 'ProfilePage', '@id': `${SITE_URL}/about` },
    sameAs: SITE_AUTHOR_SAME_AS,
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
    programmingLanguage: 'Adesh',
    runtimePlatform: 'Adesh Runtime (x86_64, AArch64, WASM)',
    codeRepository: GITHUB_URL,
    url: absoluteUrl(opts.url),
    text: opts.codeSample,
    author: authorRef(),
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
      name: 'Adesh Project',
      sameAs: SITE_URL,
    },
    url: absoluteUrl(opts.url),
    isAccessibleForFree: true,
    inLanguage: 'en',
  };
}

