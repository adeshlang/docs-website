import React from 'react';
import DocItem from '@theme-original/DocItem';
import type { WrapperProps } from '@docusaurus/types';
import Head from '@docusaurus/Head';
import { techArticleSchema, breadcrumbSchema, SITE_URL } from '../../utils/seo';

// Wrapper for every doc page — adds TechArticle + Breadcrumb JSON-LD for SEO & GEO.
// LLMs heavily prefer structured TechArticle on doc pages for accurate RAG.
type Props = WrapperProps<typeof DocItem>;

export default function DocItemWrapper(props: Props): JSX.Element {
  // Docusaurus passes `content` inside wrapper props for DocItem:
  // props.content = { frontMatter, metadata } — try to read it without relying on internal hooks
  const content = (props as any)?.content ?? (props as any)?.props?.content ?? {};
  const frontMatter: Record<string, unknown> = content.frontMatter ?? {};
  const metadata: any = content.metadata ?? {};

  const title = (frontMatter.title as string) ?? metadata.title ?? 'Adesh Documentation';
  const description =
    (frontMatter.description as string) ??
    (metadata.description as string) ??
    'Adesh documentation — a Rust-inspired, high-performance language with Cranelift native JIT, zero-cost memory safety, SIMD, and built-in networking.';
  const permalink: string = metadata.permalink ?? '/';
  const url = permalink.startsWith('http') ? permalink : `${SITE_URL}${permalink}`;
  const image = (frontMatter.image as string) ?? 'img/social-card.jpg';

  const techArticle = techArticleSchema({
    headline: String(title),
    description: String(description),
    url,
    image: String(image),
  });

  // Build breadcrumb from permalink segments for GEO navigational understanding
  const segments = permalink.split('/').filter(Boolean);
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Docs', url: '/intro' },
    ...segments.map((seg: string, idx: number) => {
      const href = '/' + segments.slice(0, idx + 1).join('/');
      const label = seg
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      return { name: label, url: href };
    }),
  ];
  // Deduplicate by url
  const deduped = breadcrumbItems.filter(
    (item, idx, arr) => arr.findIndex((x) => x.url === item.url) === idx,
  );
  const breadcrumb = breadcrumbSchema(deduped);

  return (
    <>
      <Head>
        <script type="application/ld+json">{JSON.stringify(techArticle)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Head>
      <DocItem {...props} />
    </>
  );
}
