import React from 'react';
import Head from '@docusaurus/Head';

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
  id?: string;
}

/**
 * Injects one or more JSON-LD <script> blocks into <head>.
 * Safe for SSR — Docusaurus Head is react-helmet backed.
 */
export default function JsonLd({ data, id }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((datum, idx) => (
        <Head key={id ? `${id}-${idx}` : `jsonld-${idx}`}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(datum) }}
          />
        </Head>
      ))}
    </>
  );
}
