// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

function pluginAdeshPrism() {
  return {
    name: 'plugin-adesh-prism',
    getClientModules() {
      return ['./src/prism/registerAdesh.js'];
    },
  };
}

const config: Config = {
  title: 'AdeshLang',
  tagline: 'आदेश (Adesh) — Command. Code. Create. | High-Performance, Memory-Safe Programming Language',
  favicon: 'img/favicon.ico',

  url: 'https://adeshlang.github.io',
  baseUrl: '/',

  organizationName: 'adeshlang',
  projectName: 'adeshlang',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [pluginAdeshPrism],
  themes: ['@docusaurus/theme-mermaid'],

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
          editUrl: 'https://github.com/adeshlang/adeshlang/tree/main/docs-website/',
          routeBasePath: '/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/adeshlang/adeshlang/tree/main/docs-website/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
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
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        { to: '/about', label: 'About', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
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
          title: 'Docs',
          items: [
            {
              label: 'Quick Start',
              to: '/getting-started/quick-start',
            },
            {
              label: 'Language Guide',
              to: '/language-guide/basics',
            },
            {
              label: 'Backends',
              to: '/backends/overview',
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
              label: 'About Project',
              to: '/about',
            },
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'Examples',
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
