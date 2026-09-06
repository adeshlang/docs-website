import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function BlogListPage(): JSX.Element {
  return (
    <Layout
      title="Blog"
      description="The AdeshLang engineering blog is coming soon."
    >
      <main className="blog-coming-soon">
        <div className="blog-coming-soon-orb blog-coming-soon-orb-left" />
        <div className="blog-coming-soon-orb blog-coming-soon-orb-right" />

        <section className="blog-coming-soon-card">
          <div className="blog-coming-soon-icon" aria-hidden="true">✦</div>
          <span className="blog-coming-soon-eyebrow">AdeshLang Blog</span>
          <h1>Coming Soon</h1>
          <p>
            We are preparing deep dives into language design, compiler engineering,
            performance, and the future of AdeshLang.
          </p>
          <Link className="btn-filled" to="/docs">
            Explore the Documentation
          </Link>
        </section>
      </main>
    </Layout>
  );
}
