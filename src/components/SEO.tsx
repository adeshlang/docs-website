import React from 'react';
import Head from '@docusaurus/Head';
import { SITE_URL, SITE_NAME, absoluteUrl } from '../utils/seo';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  canonical?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  locale?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Reusable SEO + GEO head component.
 * - Sets title/description/canonical/OG/Twitter
 * - Allows noindex for private pages
 * - Injects optional JSON-LD
 * Use alongside Docusaurus <Layout> or standalone.
 */
export default function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noIndex = false,
  canonical,
  author,
  publishedTime,
  modifiedTime,
  locale = 'en_IN',
  jsonLd,
}: SEOProps) {
  const pageUrl = canonical ?? (url ? absoluteUrl(url) : undefined);
  const ogImage = image ? absoluteUrl(image) : `${SITE_URL}/img/social-card.jpg`;
  const pageTitle = title ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`) : undefined;

  return (
    <Head>
      {pageTitle && <title>{pageTitle}</title>}
      {description && <meta name="description" content={description} />}
      {keywords && keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}

      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      )}

      {/* Canonical */}
      {pageUrl && <link rel="canonical" href={pageUrl} />}

      {/* Open Graph */}
      {pageTitle && <meta property="og:title" content={pageTitle} />}
      {description && <meta property="og:description" content={description} />}
      {pageUrl && <meta property="og:url" content={pageUrl} />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={title ?? SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@adeshlang" />
      <meta name="twitter:creator" content="@adeshlang" />
      {pageTitle && <meta name="twitter:title" content={pageTitle} />}
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {/* Article specific */}
      {type === 'article' && publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {type === 'article' && modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {type === 'article' && author && <meta property="article:author" content={author} />}

      {/* GEO: llms.txt discovery */}
      <link rel="alternate" type="text/plain" title="LLMs.txt" href="/llms.txt" />

      {/* JSON-LD */}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd])}</script>}
    </Head>
  );
}
