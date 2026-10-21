import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined; }
    // Deep links such as /size-care#chart land on their section once the lazy page has rendered.
    let id = hash.slice(1);
    try { id = decodeURIComponent(id); } catch { /* malformed escape: look up the raw id */ }
    let tries = 0;
    const timer = setInterval(() => {
      const target = document.getElementById(id);
      if (!target && ++tries < 20) return;
      clearInterval(timer);
      if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
    }, 50);
    return () => clearInterval(timer);
  }, [pathname, hash]);

  return null;
}
