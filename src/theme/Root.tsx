import React from 'react';
import Head from '@docusaurus/Head';
import ScrollToTop from '../components/ScrollToTop';
import {
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  siteNavigationSchema,
} from '../utils/seo';

/**
 * Global Root — injects site-wide JSON-LD for SEO + GEO on every page.
 * Swizzled theme component: Docusaurus automatically wraps the app with this.
 *
 * Schemas injected:
 *  - Organization (with founder Ajay Tainwala, logo, location)
 *  - WebSite (with SearchAction → sitelinks searchbox + hasPart sub-pages)
 *  - SiteNavigationElement ItemList (enables Google Sitelinks & sub-links visibility)
 *  - SoftwareApplication (Adesh Lang as a programming language / developer tool)
 *
 * Page-specific schemas (TechArticle, Breadcrumb, FAQ, HowTo, Person) are
 * injected per-page via JsonLd / SEO components.
 */
export default function Root({ children }: { children: React.ReactNode }) {
  const org = organizationSchema();
  const website = websiteSchema();
  const nav = siteNavigationSchema();
  const app = softwareApplicationSchema();

  return (
    <>
      <Head>
        {/* Site-wide structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(nav) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(app) }}
        />
      </Head>
      {children}
      <ScrollToTop />
    </>
  );
}
