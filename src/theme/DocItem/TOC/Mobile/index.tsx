import React, { useState, useEffect, useRef, useCallback } from 'react';
import DocItemTOCMobileOriginal from '@theme-original/DocItem/TOC/Mobile';
import useIsBrowser from '@docusaurus/useIsBrowser';

export default function DocItemTOCMobile(props: any): JSX.Element {
  const isBrowser = useIsBrowser();
  const [showFloatingButton, setShowFloatingButton] = useState<boolean>(false);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isBrowser) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      setShowFloatingButton(scrollY > 160);
      setIsAtBottom(windowHeight + scrollY >= scrollHeight - 140);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isBrowser]);

  const handleFloatingClick = useCallback(() => {
    if (!containerRef.current) return;
    
    // Scroll to the sticky TOC container so it is in view
    containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Check if the collapse button is collapsed; if so, trigger click to expand
    const btn = containerRef.current.querySelector('button') as HTMLButtonElement | null;
    if (btn) {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true' || 
                         btn.classList.contains('tocCollapsibleExpanded') ||
                         btn.parentElement?.classList.contains('tocCollapsibleExpanded');
      if (!isExpanded) {
        btn.click();
      }
    }
  }, []);

  return (
    <>
      {/* ── Sticky Mobile TOC Subheader (Sticks directly beneath navbar) ── */}
      <div ref={containerRef} className="adesh-mobile-toc-sticky-bar">
        <DocItemTOCMobileOriginal {...props} />
      </div>

      {/* ── Floating Right-Side TOC Menu Icon (Disappears at page bottom) ── */}
      {showFloatingButton && (
        <div className={`adesh-mobile-floating-toc-container${isAtBottom ? ' at-bottom' : ''}`}>
          <button
            type="button"
            className="adesh-mobile-floating-toc-btn"
            onClick={handleFloatingClick}
            aria-label="Table of contents overview"
            title="Page Outline & Navigation"
          >
            <svg
              className="adesh-floating-toc-icon"
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
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span>Outline</span>
          </button>
        </div>
      )}
    </>
  );
}
