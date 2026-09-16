// @ts-check
import 'dotenv/config';
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import buildRedirects from './redirects';

function pluginAdeshPrism() {
  return {
    name: 'plugin-adesh-prism',
    getClientModules() {
      return ['./src/prism/registerAdesh.js'];
    },
  };
}

// ---------------------------------------------------------------------------
// SEO & GEO — Central site metadata
// ---------------------------------------------------------------------------
const SITE_URL = 'https://www.adeshlang.org';
const SITE_TITLE = 'AdeshLang';
const SITE_TAGLINE =
  'आदेश (Adesh) — Command. Code. Create. | High-Performance, Memory-Safe Programming Language';
const SITE_DESCRIPTION =
  'AdeshLang (आदेश) — a Rust-inspired, high-performance programming language with Cranelift native JIT (10–230× speedup), memory safety, SIMD, and networking.';
const SITE_KEYWORDS = [
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
].join(', ');
const SITE_AUTHOR = 'Ajay Tainwala';
const SOCIAL_IMAGE = 'img/social-card.jpg';

const config: Config = {
  title: SITE_TITLE,
  tagline: SITE_TAGLINE,
  favicon: 'img/favicon.ico',

  url: SITE_URL,
  baseUrl: '/',

  organizationName: 'adeshlang',
  projectName: 'adeshlang',

  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenAnchors: 'warn',
  onDuplicateRoutes: 'warn',

  // SEO & GEO: Ideal head hygiene — canonical, hreflang handled by Docusaurus core
  headTags: [
    // Primary SEO
    {
      tagName: 'meta',
      attributes: { name: 'keywords', content: SITE_KEYWORDS },
    },
    {
      tagName: 'meta',
      attributes: { name: 'author', content: SITE_AUTHOR },
    },
    {
      tagName: 'meta',
      attributes: { name: 'creator', content: SITE_AUTHOR },
    },
    {
      tagName: 'meta',
      attributes: { name: 'publisher', content: 'AdeshLang Project' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'googlebot', content: 'index, follow' },
    },
    // GEO: Geographic Coordinates & Location Targeting (Bengaluru, Karnataka, India)
    {
      tagName: 'meta',
      attributes: { name: 'geo.region', content: 'IN-KA' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'geo.placename', content: 'Bengaluru' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'geo.position', content: '12.9716;77.5946' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'ICBM', content: '12.9716, 77.5946' },
    },
    // Dublin Core Metadata
    {
      tagName: 'meta',
      attributes: { name: 'DC.title', content: SITE_TAGLINE },
    },
    {
      tagName: 'meta',
      attributes: { name: 'DC.creator', content: SITE_AUTHOR },
    },
    {
      tagName: 'meta',
      attributes: { name: 'DC.subject', content: 'Programming Languages, Systems Programming, Cranelift JIT, Rust, Compilers' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'DC.description', content: SITE_DESCRIPTION },
    },
    {
      tagName: 'meta',
      attributes: { name: 'DC.publisher', content: 'AdeshLang Project' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'DC.language', content: 'en' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'DC.coverage', content: 'Worldwide' },
    },
    // GEO: Explicit permissions for AI crawlers / LLM training discoverability
    {
      tagName: 'meta',
      attributes: { name: 'ai-content-declaration', content: 'ai-crawl-allowed' },
    },
    // Theme
    {
      tagName: 'meta',
      attributes: { name: 'theme-color', content: '#10b981' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'color-scheme', content: 'dark light' },
    },
    // Open Graph extras
    {
      tagName: 'meta',
      attributes: { property: 'og:type', content: 'website' },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:site_name', content: SITE_TITLE },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:locale', content: 'en_IN' },
    },
    // Twitter
    {
      tagName: 'meta',
      attributes: { name: 'twitter:creator', content: '@adeshlang' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'twitter:site', content: '@adeshlang' },
    },
    // Performance: DNS Prefetch & Preconnect for Google Fonts
    {
      tagName: 'link',
      attributes: { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
    },
    {
      tagName: 'link',
      attributes: { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
    },
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    },
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    },
    // Performance: Non-blocking asynchronous Google Fonts stylesheet
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        as: 'style',
        href: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap',
        media: 'print',
        onload: "this.media='all'",
      },
    },
    // Icons / Manifest
    {
      tagName: 'link',
      attributes: { rel: 'apple-touch-icon', href: '/img/logo.png' },
    },
    {
      tagName: 'link',
      attributes: { rel: 'manifest', href: '/manifest.json' },
    },
    // GEO: Discoverability for LLMs — llms.txt & ai.txt
    {
      tagName: 'link',
      attributes: { rel: 'alternate', type: 'text/plain', title: 'LLMs.txt — AdeshLang for AI', href: '/llms.txt' },
    },
    {
      tagName: 'link',
      attributes: { rel: 'alternate', type: 'text/plain', title: 'AI.txt — AdeshLang Agentic Web', href: '/ai.txt' },
    },
    // Verification placeholders — set via env or replace with real tokens
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? [
          {
            tagName: 'meta' as const,
            attributes: { name: 'google-site-verification', content: process.env.GOOGLE_SITE_VERIFICATION },
          },
        ]
      : []),
    ...(process.env.BING_SITE_VERIFICATION
      ? [
          {
            tagName: 'meta' as const,
            attributes: { name: 'msvalidate.01', content: process.env.BING_SITE_VERIFICATION },
          },
        ]
      : []),
  ],

  customFields: {
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    author: SITE_AUTHOR,
    // GEO manifest
    geo: {
      llmsTxt: '/llms.txt',
      llmsFullTxt: '/llms-full.txt',
      aiTxt: '/ai.txt',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    pluginAdeshPrism,
    // -----------------------------------------------------------------------
    // Separate documentation spaces
    //   /docs             – reference documentation (default docs instance)
    //   /learn            – guided tutorial path
    //   /learn-by-examples – example-driven learning
    // -----------------------------------------------------------------------
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'learn',
        path: 'learn',
        routeBasePath: 'learn',
        sidebarPath: './sidebars-learn.ts',
        editUrl: 'https://github.com/adeshlang/docs-website/tree/main/',
        showLastUpdateTime: true,
        showLastUpdateAuthor: false,
        breadcrumbs: true,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'examples',
        path: 'learn-by-examples',
        routeBasePath: 'learn-by-examples',
        sidebarPath: './sidebars-examples.ts',
        editUrl: 'https://github.com/adeshlang/docs-website/tree/main/',
        showLastUpdateTime: true,
        showLastUpdateAuthor: false,
        breadcrumbs: true,
      },
    ],
    // Seamless redirects from the pre-restructure URLs so nothing 404s
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: buildRedirects(),
      },
    ],
  ],
  // FLEXI SEARCH: offline local search indexes all docs/blog/pages.
  // Searches on any key (title, content, headings, keywords, description) via Lunr-like tokenization.
  // Falls back to Algolia when ALGOLIA_APP_ID is present; otherwise local is primary.
  themes: [
    '@docusaurus/theme-mermaid',
    // Only inject local search when Algolia is NOT configured to avoid dual search bars.
    // Set ALGOLIA_APP_ID env to prefer Algolia cloud; otherwise flexi local search auto-activates.
    ...(process.env.ALGOLIA_APP_ID
      ? []
      : [
          [
            require.resolve('@easyops-cn/docusaurus-search-local'),
            {
              hashed: true,
              language: ['en'],
              highlightSearchTermsOnTargetPage: true,
              explicitSearchResultPath: true,
              searchResultLimits: 10,
              searchResultContextMaxLength: 60,
              searchBarShortcut: true,
              searchBarShortcutHint: true,
              searchBarPosition: 'right',
              docsRouteBasePath: ['/docs', '/learn', '/learn-by-examples'],
              blogRouteBasePath: '/blog',
              indexDocs: true,
              indexBlog: true,
              indexPages: true,
              docsDir: ['docs', 'learn', 'learn-by-examples'],
              blogDir: ['blog'],
              ignoreFiles: [],
              // Expanded searchable content for true flexi search
              useAllContextsWithNoSearchContext: true,
            },
          ] as const,
        ]),
  ],

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/adeshlang/docs-website/tree/main/',
          routeBasePath: 'docs',
          showLastUpdateTime: true,
          showLastUpdateAuthor: false,
          // SEO: breadcrumbs + meta
          breadcrumbs: true,
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/adeshlang/docs-website/tree/main/',
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'AdeshLang Blog',
            description: 'Engineering deep-dives on AdeshLang language design, compiler, and tooling.',
            language: 'en',
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly' as const,
          priority: 0.7,
          ignorePatterns: [
            '/tags/**',
            '/search',
            '/intro',
            '/stdlib/**',
            '/getting-started/**',
            '/learn/learn-programming',
            '/learn/learn-by-examples',
            '/examples',
            '/arrays/**',
            '/backends/**',
            '/builtin/**',
            '/compiler/**',
            '/contributing',
            '/faq',
            '/language-guide/**',
            '/networking/**',
            '/performance/**',
            '/simd/**',
            '/syntax-highlighting-test',
            '/tools/**',
          ],
          filename: 'sitemap.xml',
          createSitemapItems: async (params: any) => {
            const { defaultCreateSitemapItems, ...rest } = params;
            let items = await defaultCreateSitemapItems(rest);
            const now = new Date().toISOString();
            items = items.map((item: any) => {
              const url = item.url;
              let priority = 0.7;
              let changefreq = 'weekly';

              if (url === SITE_URL || url === `${SITE_URL}/` || url === `${SITE_URL}/docs`) {
                priority = 1.0;
                changefreq = 'daily';
              } else if (
                url.includes('/learn') ||
                url.includes('/learn-by-examples') ||
                url.includes('/docs/language-guide')
              ) {
                priority = 0.8;
                changefreq = 'weekly';
              } else if (url.includes('/blog')) {
                priority = 0.7;
                changefreq = 'weekly';
              } else if (url.includes('/about')) {
                priority = 0.6;
                changefreq = 'monthly';
              }

              return {
                ...item,
                changefreq,
                priority,
                lastmod: item.lastmod || now,
              };
            });
            return items;
          },
        },
        gtag: (process.env.GOOGLE_ANALYTICS_ID || process.env.GTAG_ID)
          ? {
              trackingID: process.env.GOOGLE_ANALYTICS_ID || process.env.GTAG_ID || '',
              anonymizeIP: true,
            }
          : undefined,
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: SOCIAL_IMAGE,
    metadata: [
      { name: 'keywords', content: SITE_KEYWORDS },
      { name: 'author', content: SITE_AUTHOR },
      { name: 'description', content: SITE_DESCRIPTION },
      // GEO: hint for generative engines
      { name: 'ai-content-declaration', content: 'ai-crawl-allowed' },
    ],
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'AdeshLang',
      logo: {
        alt: 'AdeshLang Logo',
        src: 'img/logo.svg',
        width: 32,
        height: 32,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'learnSidebar',
          docsPluginId: 'learn',
          position: 'left',
          label: 'Learn',
        },
        {
          type: 'docSidebar',
          sidebarId: 'examplesSidebar',
          docsPluginId: 'examples',
          position: 'left',
          label: 'Learn by Examples',
        },
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/install',
          label: 'Install',
          position: 'left',
        },
        { to: '/about', label: 'About', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://editor.adeshlang.org',
          label: 'Web Editor',
          position: 'right',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          href: 'https://github.com/adeshlang/adeshlang',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'Learning Roadmap',
              to: '/learn',
            },
            {
              label: 'Quick Start',
              to: '/learn/getting-started/quick-start',
            },
            {
              label: 'Learn by Examples',
              to: '/learn-by-examples',
            },
            {
              label: 'Web Editor (Playground)',
              href: 'https://editor.adeshlang.org',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/adeshlang/adeshlang',
            },
            {
              label: 'Creator Portfolio',
              href: 'https://ajaytainwala.vercel.app',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Documentation',
              to: '/docs',
            },
            {
              label: 'Language Guide',
              to: '/docs/language-guide/basics',
            },
            {
              label: 'Online Web Editor',
              href: 'https://editor.adeshlang.org',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            {
              label: 'About Project',
              to: '/about',
            },
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'Examples Repository',
              href: 'https://github.com/adeshlang/adeshlang/tree/main/examples',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AdeshLang Project. Built with Docusaurus.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['rust', 'bash', 'powershell'],
    },
    ...(process.env.ALGOLIA_APP_ID
      ? {
          algolia: {
            appId: process.env.ALGOLIA_APP_ID,
            apiKey: process.env.ALGOLIA_API_KEY || '',
            indexName: process.env.ALGOLIA_INDEX_NAME || 'adeshlang',
            contextualSearch: true,
          },
        }
      : {}),
  } satisfies Preset.ThemeConfig,
};

export default config;
