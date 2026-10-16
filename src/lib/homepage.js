export const SECTION_TYPES = ['hero', 'manifesto', 'featured', 'castes', 'craft', 'film', 'quote', 'archive', 'waitlist'];
export const MEDIA_FIELDS = ['image', 'mobileImage', 'video', 'mobileVideo', 'poster'];
export const DEFAULT_HOME = { sections: [
  { id: 'hero', label: 'Chapter one', title: 'The Old World', body: 'Garments from a world that remains.', cta: 'Enter the store', href: '/store', video: 'https://pub-5d519c8dedf642f59a07d4b6cbc2b766.r2.dev/silver-rain/Initial_Scene_-_2026-07-28_202607281856.mp4' },
  { id: 'manifesto', title: 'A house of garments', body: 'Every piece belongs to a world called the Sanctum. Hand-dyed. Made to order. Founded in Delhi.', cta: 'Our world', href: '/the-sanctum' },
  { id: 'featured', label: 'Featured release', title: 'Wear the world.', body: 'A closer look at the garments of the Sanctum.', cta: 'Claim the piece', productIds: [] },
  { id: 'castes', label: 'Four identities. One world.', title: 'Choose your room', cards: [] },
  { id: 'craft', label: 'Craft / Structure', title: 'Made in Delhi', body: 'Garments constructed by hand, coloured with intention, and made to order.', cta: 'Discover the Sanctum', href: '/the-sanctum', facts: ['Hand-dyed textiles', 'Made to order', 'Founded in Delhi'] },
  { id: 'film', label: 'A Gauddly film', title: 'Watch the chronicle', body: 'The world behind the garments.', cta: 'Explore the films', href: '/episodes', episodeId: '' },
  { id: 'quote', label: 'From the Codex', title: 'Wear the world.', body: 'We enter now the age where we remember.', cta: 'Read the Codex', href: '/codex' },
  { id: 'archive', label: 'Collection 01', title: 'From the archive', cta: 'Explore all', href: '/old-world', productIds: [] },
  { id: 'waitlist', label: 'The next chapter', title: 'Join the chamber', body: 'Be told when new garments and films arrive.', cta: 'Join the list' },
].map(section => ({ enabled: true, image: '', mobileImage: '', poster: '', alt: '', focalX: 50, focalY: 50, ...section })) };

export function freshHome() { return structuredClone(DEFAULT_HOME); }
export function homeLink(value, fallback = '/store') {
  return typeof value === 'string' && /^\/(?!\/)/.test(value) && !/[\\\s]/.test(value) ? value : fallback;
}
export function assetKey(value) {
  if (typeof value !== 'string') return '';
  const key = value.trim();
  if (!key || key.startsWith('//') || /[<>\\]/.test(key)) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(key) && !/^https:\/\//i.test(key)) return '';
  return key;
}
export function normalizeHome(value) {
  if (!Array.isArray(value?.sections)) return freshHome();
  const seen = new Set();
  const sections = value.sections.filter(s => s && SECTION_TYPES.includes(s.id) && !seen.has(s.id) && seen.add(s.id)).map(s => {
    const base = DEFAULT_HOME.sections.find(b => b.id === s.id);
    const next = { ...base, ...s };
    for (const field of MEDIA_FIELDS) next[field] = assetKey(next[field]);
    next.href = homeLink(next.href);
    next.focalX = Math.max(0, Math.min(100, Number(next.focalX) || 0));
    next.focalY = Math.max(0, Math.min(100, Number(next.focalY) || 0));
    next.productIds = Array.isArray(next.productIds) ? next.productIds.filter(id => typeof id === 'string') : [];
    next.facts = Array.isArray(next.facts) ? next.facts : [];
    next.cards = Array.isArray(next.cards) ? next.cards : [];
    return next;
  });
  return { sections: [...sections, ...DEFAULT_HOME.sections.filter(s => !seen.has(s.id)).map(s => ({ ...s }))] };
}
export function chooseProducts(products, ids, archive = false) {
  if (ids?.length) return ids.map(id => products.find(p => p.id === id)).filter(Boolean);
  return products.filter(p => archive ? p.caste_id === 'old-world' : p.caste_id !== 'old-world').slice(0, archive ? 4 : 3);
}
