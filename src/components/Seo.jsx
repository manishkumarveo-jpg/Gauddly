import { useEffect } from 'react';

const DEFAULT_DESCRIPTION = 'Gauddly is a house of garments. Every piece belongs to a world called the Sanctum. Hand-dyed and made to order in Delhi.';

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
}

export default function Seo({ title, description = DEFAULT_DESCRIPTION, image, noIndex = false }) {
  useEffect(() => {
    const fullTitle = title ? `${title} — GAUDDLY` : 'GAUDDLY — THE SANCTUM';
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;

    document.title = fullTitle;
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' });
    setMeta('meta[name="robots"]', { name: 'robots', content: noIndex ? 'noindex, nofollow' : 'index, follow' });

    if (image) {
      setMeta('meta[property="og:image"]', { property: 'og:image', content: image });
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
    }

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [title, description, image, noIndex]);

  return null;
}

