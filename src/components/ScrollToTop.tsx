import React, { useEffect, useState } from 'react';

const SHOW_AFTER_PROGRESS = 0.35;

export default function ScrollToTop(): JSX.Element {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      const footer = document.querySelector('footer');
      const footerInView = footer
        ? footer.getBoundingClientRect().top < window.innerHeight
        : false;

      setVisible(progress >= SHOW_AFTER_PROGRESS && !footerInView);
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  const handleClick = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      className={`scroll-top-btn${visible ? ' scroll-top-btn--visible' : ''}`}
      onClick={handleClick}
      aria-label="Scroll back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <span className="material-symbols-rounded" aria-hidden="true">
        arrow_upward
      </span>
    </button>
  );
}
