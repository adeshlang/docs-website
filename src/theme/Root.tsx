import React from 'react';
import Head from '@docusaurus/Head';
import {
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
} from '../utils/seo';

/**
 * Global Root — injects site-wide JSON-LD for SEO + GEO on every page.
 * Swizzled theme component: Docusaurus automatically wraps the app with this.
 *
 * Schemas injected:
 *  - Organization (with founder Ajay Tainwala, logo, location)
 *  - WebSite (with SearchAction → sitelinks searchbox)
 *  - SoftwareApplication (AdeshLang as a programming language / developer tool)
 *
 * Page-specific schemas (TechArticle, Breadcrumb, FAQ, HowTo, Person) are
 * injected per-page via JsonLd / SEO components.
 */
export default function Root({ children }: { children: React.ReactNode }) {
  const org = organizationSchema();
  const website = websiteSchema();
  const app = softwareApplicationSchema();

  return (
    <>
      <Head>
        {/* Site-wide structured data */}
        <script type="application/ld+json">{JSON.stringify(org)}</script>
        <script type="application/ld+json">{JSON.stringify(website)}</script>
        <script type="application/ld+json">{JSON.stringify(app)}</script>
      </Head>
      {children}
    </>
  );
}
