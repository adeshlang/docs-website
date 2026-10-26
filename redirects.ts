/**
 * Redirects for the restructured documentation (June 2026).
 *
 * Previously every doc lived at the site root:
 *   /intro, /getting-started/quick-start, /language-guide/basics, /examples, ...
 *
 * The content is now split across three documentation spaces:
 *   /docs             – the reference documentation (what used to be at /<section>)
 *   /learn            – guided tutorial (what used to be at /learn and /getting-started)
 *   /learn-by-examples – example-driven learning (what used to be at /examples
 *                        and /learn/learn-by-examples)
 *
 * This module generates the old → new mapping so bookmarks and search engines
 * keep working after the move.
 */
import fs from 'fs';
import path from 'path';

const SITE_ROOT = __dirname;
const REFERENCE_DIR = path.join(SITE_ROOT, 'docs');

function listMdStems(dir: string, prefix = ''): string[] {
  const stems: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      stems.push(...listMdStems(full, rel));
    } else if (entry.name.endsWith('.md')) {
      // Drafts are not built, so redirecting to them would fail validation
      const source = fs.readFileSync(full, 'utf8');
      if (/^---\r?\n[\s\S]*?^draft:\s*true\s*$/m.test(source)) continue;
      stems.push(rel.replace(/\.md$/, ''));
    }
  }
  return stems;
}

export function buildRedirects(): { from: string; to: string }[] {
  const redirects: { from: string; to: string }[] = [];

  // 1) Reference docs: /<section>/<page> → /docs/<section>/<page>
  //    (intro is special: it is now the home page of /docs)
  for (const stem of listMdStems(REFERENCE_DIR)) {
    const from = stem === 'intro' ? '/intro' : `/${stem}`;
    const to = stem === 'intro' ? '/docs' : `/docs/${stem}`;
    redirects.push({ from, to });
  }

  // 2) Old /stdlib/* pages: the folder was consolidated into /docs/builtin/*
  const stdlibMap: Record<string, string> = {
    overview: 'builtin/overview',
    builtins: 'builtin/builtins',
    print: 'builtin/print',
    concurrency: 'builtin/concurrency',
    math: 'builtin/math',
    json: 'builtin/json',
    fs: 'builtin/fs',
    http: 'builtin/http',
  };
  for (const [oldStem, newStem] of Object.entries(stdlibMap)) {
    redirects.push({ from: `/stdlib/${oldStem}`, to: `/docs/${newStem}` });
  }

  // 3) The getting-started guide moved under /learn
  for (const stem of ['quick-start', 'installation', 'first-program']) {
    redirects.push({ from: `/getting-started/${stem}`, to: `/learn/getting-started/${stem}` });
  }

  // 4) The roadmap hub now lives at /learn itself
  redirects.push({ from: '/learn/learn-programming', to: '/learn' });

  // 5) The examples catalogs moved to the /learn-by-examples space
  redirects.push({ from: '/learn/learn-by-examples', to: '/learn-by-examples' });
  redirects.push({ from: '/examples', to: '/learn-by-examples/runnable-examples' });

  return redirects;
}

export default buildRedirects;
