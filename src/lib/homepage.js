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

// Editor metadata: plain names for each section and the editor tabs it uses, in display order.
export const SECTION_INFO = {
  hero: { name: 'Hero', about: 'The first screen visitors see: a full-screen film or image with one button.', tabs: ['words', 'media', 'button'] },
  manifesto: { name: 'Manifesto', about: 'A short centred statement under the hero.', tabs: ['words', 'button'] },
  featured: { name: 'Featured garments', about: 'A large slider of chosen garments.', tabs: ['garments', 'words', 'media', 'button'] },
  castes: { name: 'Castes', about: 'One card for each caste room.', tabs: ['words', 'rooms'] },
  craft: { name: 'Craft', about: 'How the garments are made, with a short list of facts.', tabs: ['words', 'media', 'button'] },
  film: { name: 'Film', about: 'One released episode, played in the page.', tabs: ['film', 'words', 'button'] },
  quote: { name: 'Quote', about: 'A single line from the Codex.', tabs: ['words', 'media', 'button'] },
  archive: { name: 'Archive', about: 'A grid of pieces from the Old World collection.', tabs: ['garments', 'words', 'button'] },
  waitlist: { name: 'Waitlist', about: 'Email sign-up for news of new garments and films.', tabs: ['words', 'media', 'button'] },
};
export const FIELD_NAMES = {
  label: 'Small line', title: 'Headline', body: 'Supporting text', cta: 'Button text', href: 'Button link', alt: 'Image description',
  image: 'Image', mobileImage: 'Phone image', video: 'Film', mobileVideo: 'Phone film', poster: 'Still image',
  productIds: 'Garments', facts: 'Craft facts', cards: 'Caste cards', episodeId: 'Episode',
};
const FIELD_TABS = {
  label: 'words', title: 'words', body: 'words', facts: 'words', cta: 'button', href: 'button', productIds: 'garments', cards: 'rooms', episodeId: 'film',
  image: 'media', mobileImage: 'media', video: 'media', mobileVideo: 'media', poster: 'media', alt: 'media',
};
// The tab that holds a field, so a click in the preview opens the right place.
export function tabForField(sectionId, field) {
  const tabs = SECTION_INFO[sectionId]?.tabs || [];
  const tab = sectionId === 'film' && FIELD_TABS[field] === 'media' ? 'film' : FIELD_TABS[field];
  return tabs.includes(tab) ? tab : tabs[0];
}
// Editorial guidance shown as counters, not hard limits.
const SUGGESTED_LENGTH = { label: 40, title: 60, body: 240, cta: 28 };
export function suggestedLength(sectionId, field) {
  if (field === 'title' && ['hero', 'manifesto'].includes(sectionId)) return 40;
  return SUGGESTED_LENGTH[field];
}

export function moveItem(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
export function moveSection(content, from, to) {
  const sections = moveItem(content.sections, from, to);
  return sections === content.sections ? content : { ...content, sections };
}

export function sectionSummary(section) {
  if (section.enabled === false) return 'Hidden from visitors';
  if (['featured', 'archive'].includes(section.id)) {
    const count = section.productIds?.length || 0;
    return count ? `${count} chosen ${count === 1 ? 'piece' : 'pieces'}` : 'Chosen automatically';
  }
  if (section.id === 'hero') return [section.title, section.video && 'film'].filter(Boolean).join(' · ');
  return section.title || section.body || '';
}

// Problems an editor should see before publishing. `blocking` ones stop a save.
// Checks that need the catalog are skipped until it has loaded.
export function sectionWarnings(section, catalog = {}) {
  const warnings = [];
  const add = (field, message, blocking = false) => warnings.push({ field, message, blocking });
  for (const field of MEDIA_FIELDS) if (section[field] && !assetKey(section[field])) add(field, `${FIELD_NAMES[field]} must be an https:// address or a storage key`, true);
  if (section.href && homeLink(section.href, '') !== section.href) add('href', 'Button link must be a page address starting with /', true);
  if (section.enabled === false) return warnings;
  if (!section.title?.trim() && section.id !== 'featured') add('title', 'Headline is empty');
  for (const field of ['label', 'title', 'body', 'cta']) {
    const limit = suggestedLength(section.id, field);
    if ((section[field] || '').length > limit) add(field, `${FIELD_NAMES[field]} is longer than the suggested ${limit} characters`);
  }
  if (['image', 'mobileImage', 'poster'].some(field => section[field]) && !section.alt?.trim()) add('alt', 'Image has no description for screen readers');
  if (section.id === 'craft' && !section.image) add('image', 'Uses a catalog photo instead of workshop photography');
  if (section.id === 'waitlist' && !section.image) add('image', 'Shows a placeholder instead of a background image');
  if (catalog.loaded && ['featured', 'archive'].includes(section.id)) {
    const missing = (section.productIds || []).filter(id => !catalog.products?.some(p => p.id === id)).length;
    if (missing) add('productIds', `${missing} chosen ${missing === 1 ? 'piece is' : 'pieces are'} no longer published`);
  }
  if (catalog.loaded && section.id === 'film' && !section.video) {
    const episodes = catalog.episodes || [];
    if (section.episodeId && !episodes.some(e => e.id === section.episodeId)) add('episodeId', 'The chosen episode is not released');
    else if (!episodes.length) add('episodeId', 'No released film to show');
  }
  return warnings;
}

const quoted = value => {
  const text = String(value ?? '').trim();
  return text ? `“${text.length > 48 ? `${text.slice(0, 47)}…` : text}”` : 'empty';
};
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
// Human-readable list of what differs between two homepage documents, grouped by section.
export function diffHome(before, after) {
  if (!before) return [{ id: 'all', name: 'Whole page', changes: ['First publication of the homepage'] }];
  const result = [];
  if (!same(before.sections.map(s => s.id), after.sections.map(s => s.id))) {
    result.push({ id: 'order', name: 'Section order', changes: [after.sections.map(s => SECTION_INFO[s.id]?.name || s.id).join(' → ')] });
  }
  for (const next of after.sections) {
    const prev = before.sections.find(s => s.id === next.id);
    if (!prev) continue;
    const lines = [];
    if ((prev.enabled !== false) !== (next.enabled !== false)) lines.push(next.enabled === false ? 'Hidden' : 'Shown again');
    for (const field of ['label', 'title', 'body', 'cta', 'href', 'alt']) {
      if ((prev[field] || '') !== (next[field] || '')) lines.push(`${FIELD_NAMES[field]}: ${quoted(prev[field])} → ${quoted(next[field])}`);
    }
    for (const field of MEDIA_FIELDS) {
      if ((prev[field] || '') !== (next[field] || '')) lines.push(`${FIELD_NAMES[field]} ${!prev[field] ? 'added' : !next[field] ? 'removed' : 'replaced'}`);
    }
    if (prev.focalX !== next.focalX || prev.focalY !== next.focalY) lines.push('Crop adjusted');
    if (!same(prev.productIds, next.productIds)) lines.push(next.productIds?.length ? `Garments changed (${next.productIds.length} chosen)` : 'Garments now chosen automatically');
    if (!same(prev.facts, next.facts)) lines.push('Craft facts changed');
    if (!same(prev.cards, next.cards)) lines.push('Caste cards changed');
    if ((prev.episodeId || '') !== (next.episodeId || '')) lines.push('Episode changed');
    if (lines.length) result.push({ id: next.id, name: SECTION_INFO[next.id]?.name || next.id, changes: lines });
  }
  return result;
}

// The part of an image (as percentages) that `object-fit: cover` shows in a box, given the focal point.
export function coverWindow(imageW, imageH, boxW, boxH, focalX = 50, focalY = 50) {
  if (!(imageW > 0 && imageH > 0 && boxW > 0 && boxH > 0)) return null;
  const scale = Math.max(boxW / imageW, boxH / imageH);
  const w = Math.min(1, boxW / scale / imageW);
  const h = Math.min(1, boxH / scale / imageH);
  return { x: (1 - w) * focalX, y: (1 - h) * focalY, w: w * 100, h: h * 100 };
}
