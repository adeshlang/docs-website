import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useHistory } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';

interface SearchDoc {
  i: number; // id
  t: string; // title / text
  u: string; // url
  h?: string; // hash
  p?: number; // parent doc id
  b?: string[]; // breadcrumbs
  s?: string; // section
}

interface WrappedIndex {
  documents: SearchDoc[];
  index: any;
  type: number;
}

interface FormattedSearchResult {
  id: string;
  title: string;
  url: string;
  hash?: string;
  breadcrumb?: string;
  section?: string;
  snippet?: string;
  type?: string;
}

const POPULAR_QUICK_LINKS = [
  {
    title: 'Learn AdeshLang',
    path: '/learn',
    description: 'The guided roadmap — install, first program, and core concepts',
    category: 'Learn',
    icon: '🚀',
  },
  {
    title: 'Quick Start',
    path: '/learn/getting-started/quick-start',
    description: 'Get started with AdeshLang CLI, compiler, and tools in 5 minutes',
    category: 'Learn',
    icon: '⚡',
  },
  {
    title: 'Installation Guide',
    path: '/docs/install',
    description: 'Install prebuilt binaries or compile from source on Windows, macOS, and Linux',
    category: 'Install',
    icon: '📦',
  },
  {
    title: 'Language Basics',
    path: '/docs/language-guide/basics',
    description: 'Variables, types, control flow, functions, and pattern matching',
    category: 'Docs',
    icon: '📖',
  },
  {
    title: 'Learn by Examples',
    path: '/learn-by-examples',
    description: 'Complete runnable programs with terminal output for every feature',
    category: 'Examples',
    icon: '🧩',
  },
  {
    title: 'Cranelift Native JIT',
    path: '/docs/backends/native-jit',
    description: 'High-performance native JIT backend with 10–230× speedups',
    category: 'Backends',
    icon: '⚙️',
  },
  {
    title: 'Hardware SIMD',
    path: '/docs/simd/simd-overview',
    description: 'Parallel vector arithmetic with AVX2 and ARM Neon acceleration',
    category: 'Docs',
    icon: '🏎️',
  },
  {
    title: 'Memory Safety Model',
    path: '/docs/advanced/memory-safety',
    description: 'Zero-cost compile-time memory safety without garbage collector',
    category: 'Docs',
    icon: '🛡️',
  },
  {
    title: 'WebAssembly (WASM)',
    path: '/docs/backends/webassembly',
    description: 'Compile and run AdeshLang directly in web browsers and WASI runtimes',
    category: 'Backends',
    icon: '🌐',
  },
  {
    title: 'Bytecode VM & Opcodes',
    path: '/docs/backends/bytecode-vm',
    description: 'Stack-based virtual machine execution engine architecture',
    category: 'Backends',
    icon: '💻',
  },
  {
    title: 'Networking & HTTP',
    path: '/docs/builtin/http',
    description: 'Builtin TCP, UDP, async HTTP client, and WebSocket libraries',
    category: 'Stdlib',
    icon: '🔌',
  },
  {
    title: 'Standard Library Overview',
    path: '/docs/builtin/overview',
    description: 'Builtin libraries: math, JSON, FS, HTTP, crypto, regex, and more',
    category: 'Stdlib',
    icon: '📚',
  },
  {
    title: 'TUI Code Editor',
    path: '/docs/tools/tui-editor',
    description: 'Fast, native cross-platform terminal editor with LSP, runner, and file tree',
    category: 'Tools',
    icon: '🖥️',
  },
  {
    title: 'About AdeshLang',
    path: '/about',
    description: 'Project mission, architectural pillars, creator story, and roadmap',
    category: 'Overview',
    icon: 'ℹ️',
  },
];

export default function SearchBar(): JSX.Element {
  const isBrowser = useIsBrowser();
  const history = useHistory();
  const { siteConfig: { baseUrl } } = useDocusaurusContext();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<FormattedSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [indexLoaded, setIndexLoaded] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const cachedIndexes = useRef<WrappedIndex[] | null>(null);

  const isMac = useMemo(() => {
    if (!isBrowser) return false;
    return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent);
  }, [isBrowser]);

  // Lazy load index data
  const loadSearchIndex = useCallback(async () => {
    if (cachedIndexes.current || indexLoaded) return;
    try {
      setLoading(true);
      // Try to fetch generated search index from docusaurus-search-local
      const url = `${baseUrl}search-index.json`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const loaded: WrappedIndex[] = json.map(({ documents }: any, type: number) => ({
          type,
          documents: documents || [],
          index: null,
        }));
        cachedIndexes.current = loaded;
        setIndexLoaded(true);
      }
    } catch (err) {
      console.warn('Could not load local search index directly:', err);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, indexLoaded]);

  // Execute search whenever query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const trimmed = query.trim().toLowerCase();
    const words = trimmed.split(/\s+/).filter(Boolean);

    if (cachedIndexes.current && cachedIndexes.current.length > 0) {
      const hits: Array<FormattedSearchResult & { score: number }> = [];
      const seenUrls = new Set<string>();

      for (const wrapped of cachedIndexes.current) {
        const { documents } = wrapped;
        if (!documents) continue;

        for (const doc of documents) {
          const title = (doc.t || '').toLowerCase();
          const section = (doc.s || '').toLowerCase();
          const breadcrumbs = ((doc.b || []).join(' ')).toLowerCase();
          const combined = `${title} ${section} ${breadcrumbs}`;

          // Check if every search word is present in doc
          const matchesAll = words.every(w => combined.includes(w));
          if (matchesAll) {
            const fullUrl = `${doc.u}${doc.h || ''}`;
            if (!seenUrls.has(fullUrl)) {
              seenUrls.add(fullUrl);
              const parentPage = wrapped.type !== 0 && cachedIndexes.current[0]
                ? cachedIndexes.current[0].documents.find(p => p.i === doc.p)
                : null;

              const breadcrumb = parentPage?.b
                ? [...parentPage.b, parentPage.t].join(' › ')
                : (doc.b ? doc.b.join(' › ') : '');

              // Calculate ranking score
              let score = 0;
              if (title === trimmed) score += 100;
              else if (title.startsWith(trimmed)) score += 60;
              else if (title.includes(trimmed)) score += 40;

              if (section.includes(trimmed)) score += 30;
              if (wrapped.type === 0) score += 20; // page title priority
              if (wrapped.type === 1) score += 15; // heading priority

              hits.push({
                id: String(doc.i),
                title: doc.t || parentPage?.t || 'Documentation',
                url: fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`,
                hash: doc.h,
                breadcrumb: breadcrumb || 'Docs',
                section: doc.s,
                snippet: doc.s && doc.s !== doc.t ? doc.s : undefined,
                type: wrapped.type === 0 ? 'Page' : wrapped.type === 1 ? 'Heading' : 'Content',
                score,
              });
            }
          }
        }
      }

      // Sort by score descending
      hits.sort((a, b) => b.score - a.score);
      setResults(hits.slice(0, 15));
      setSelectedIndex(0);
    } else {
      // If index not loaded yet, search against popular links
      const matched = POPULAR_QUICK_LINKS.filter(
        item =>
          item.title.toLowerCase().includes(trimmed) ||
          item.description.toLowerCase().includes(trimmed) ||
          item.category.toLowerCase().includes(trimmed)
      ).map((item, idx) => ({
        id: `quick-${idx}`,
        title: item.title,
        url: item.path,
        breadcrumb: item.category,
        snippet: item.description,
        type: 'Topic',
      }));
      setResults(matched);
      setSelectedIndex(0);
    }
  }, [query]);

  // Open & Close Handlers
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    loadSearchIndex();
  }, [loadSearchIndex]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
  }, []);

  const handleSelectResult = useCallback((url: string) => {
    handleClose();
    history.push(url);
  }, [handleClose, history]);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K and /
  useEffect(() => {
    if (!isBrowser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          handleOpen();
        }
        return;
      }

      // Check for forward slash '/' when not inside an input/textarea
      if (e.key === '/' && !isOpen) {
        const target = e.target as HTMLElement;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        handleOpen();
        return;
      }

      // Modal navigation shortcuts
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const count = results.length > 0 ? results.length : POPULAR_QUICK_LINKS.length;
          setSelectedIndex(prev => (prev + 1) % count);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const count = results.length > 0 ? results.length : POPULAR_QUICK_LINKS.length;
          setSelectedIndex(prev => (prev - 1 + count) % count);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (results.length > 0 && results[selectedIndex]) {
            handleSelectResult(results[selectedIndex].url);
          } else if (!query.trim() && POPULAR_QUICK_LINKS[selectedIndex]) {
            handleSelectResult(POPULAR_QUICK_LINKS[selectedIndex].path);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBrowser, isOpen, results, selectedIndex, query, handleOpen, handleClose, handleSelectResult]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (!isBrowser) return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isBrowser, isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    const activeEl = resultsContainerRef.current.querySelector('[data-selected="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Highlight matching query text helper
  const renderHighlighted = (text: string, highlightQuery: string) => {
    if (!highlightQuery.trim() || !text) return text;
    const words = highlightQuery.trim().split(/\s+/).filter(Boolean);
    const regex = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      regex.test(part) ? (
        <mark key={idx} className="adesh-search-hit-mark">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <>
      {/* ── Navbar Search Trigger Button ── */}
      <div className="navbar__search adesh-search-nav-wrapper">
        <button
          type="button"
          className="adesh-search-trigger"
          onClick={handleOpen}
          aria-label="Search documentation"
          title={`Search documentation (${isMac ? '⌘K' : 'Ctrl+K'})`}
        >
          <span className="adesh-search-trigger-icon-wrap">
            <svg
              className="adesh-search-svg-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <span className="adesh-search-trigger-text">Search docs...</span>
          <span className="adesh-search-shortcut-badge">
            <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
            <kbd>K</kbd>
          </span>
        </button>
      </div>

      {/* ── Full Sized Search Modal Popup (Portal to Body) ── */}
      {isOpen && isBrowser && typeof document !== 'undefined' && document.body &&
        createPortal(
          <div className="adesh-search-modal-backdrop" onClick={handleClose}>
            <div
              className="adesh-search-modal-dialog"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Search AdeshLang Documentation"
            >
              {/* Modal Header / Search Box */}
              <div className="adesh-search-modal-header">
                <div className="adesh-search-input-wrap">
                  <svg
                    className="adesh-search-modal-icon"
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    className="adesh-search-modal-input"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search docs, backends, syntax, tutorials..."
                    aria-autocomplete="list"
                    aria-controls="adesh-search-results-list"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  {query && (
                    <button
                      type="button"
                      className="adesh-search-clear-btn"
                      onClick={() => {
                        setQuery('');
                        inputRef.current?.focus();
                      }}
                      title="Clear search"
                      aria-label="Clear search input"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    className="adesh-search-esc-btn"
                    onClick={handleClose}
                    aria-label="Close search"
                  >
                    <kbd>ESC</kbd>
                  </button>
                </div>
              </div>

              {/* Modal Body / Results / Suggestions */}
              <div className="adesh-search-modal-body" ref={resultsContainerRef}>
                {loading && (
                  <div className="adesh-search-loading-state">
                    <div className="adesh-search-spinner" />
                    <span>Loading documentation index...</span>
                  </div>
                )}

                {/* If query has results */}
                {query.trim() && results.length > 0 && (
                  <div className="adesh-search-results-section" id="adesh-search-results-list">
                    <div className="adesh-search-section-header">
                      <span>Documentation Results</span>
                      <span className="adesh-search-results-count">{results.length} found</span>
                    </div>
                    <div className="adesh-search-hits-list">
                      {results.map((hit, idx) => {
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={hit.id || idx}
                            className={`adesh-search-hit-item ${isSelected ? 'selected' : ''}`}
                            data-selected={isSelected}
                            onClick={() => handleSelectResult(hit.url)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className="adesh-search-hit-icon-box">
                              {hit.type === 'Heading' ? (
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="4" y1="9" x2="20" y2="9" />
                                  <line x1="4" y1="15" x2="20" y2="15" />
                                  <line x1="10" y1="3" x2="8" y2="21" />
                                  <line x1="16" y1="3" x2="14" y2="21" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <polyline points="10 9 9 9 8 9" />
                                </svg>
                              )}
                            </div>
                            <div className="adesh-search-hit-content">
                              <div className="adesh-search-hit-breadcrumb">{hit.breadcrumb}</div>
                              <div className="adesh-search-hit-title">
                                {renderHighlighted(hit.title, query)}
                              </div>
                              {hit.snippet && (
                                <div className="adesh-search-hit-snippet">
                                  {renderHighlighted(hit.snippet, query)}
                                </div>
                              )}
                            </div>
                            <div className="adesh-search-hit-action">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* If query has NO results */}
                {query.trim() && !loading && results.length === 0 && (
                  <div className="adesh-search-empty-state">
                    <div className="adesh-search-empty-icon">🔍</div>
                    <div className="adesh-search-empty-title">
                      No results for "<strong>{query}</strong>"
                    </div>
                    <p className="adesh-search-empty-desc">
                      Try searching with different keywords like <code>jit</code>, <code>simd</code>, <code>fn</code>, <code>bytecode</code>, or check your spelling.
                    </p>
                  </div>
                )}

                {/* If query is empty -> Show Quick Links & Popular Topics */}
                {!query.trim() && (
                  <div className="adesh-search-quicklinks-section">
                    <div className="adesh-search-section-header">
                      <span>Quick Navigation & Popular Topics</span>
                    </div>
                    <div className="adesh-search-quicklinks-grid">
                      {POPULAR_QUICK_LINKS.map((item, idx) => {
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={item.path}
                            className={`adesh-search-quicklink-card ${isSelected ? 'selected' : ''}`}
                            data-selected={isSelected}
                            onClick={() => handleSelectResult(item.path)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <span className="adesh-search-card-icon">{item.icon}</span>
                            <div className="adesh-search-card-info">
                              <div className="adesh-search-card-title">{item.title}</div>
                              <div className="adesh-search-card-desc">{item.description}</div>
                            </div>
                            <span className="adesh-search-card-category">{item.category}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="adesh-search-modal-footer">
                <div className="adesh-search-footer-shortcuts">
                  <span className="adesh-search-shortcut-item">
                    <kbd>↑</kbd> <kbd>↓</kbd> <span>Navigate</span>
                  </span>
                  <span className="adesh-search-shortcut-item">
                    <kbd>↵</kbd> <span>Select</span>
                  </span>
                  <span className="adesh-search-shortcut-item">
                    <kbd>esc</kbd> <span>Close</span>
                  </span>
                </div>
                <div className="adesh-search-footer-brand">
                  <span>AdeshLang FlexiSearch</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
