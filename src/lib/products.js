// Product helpers shared by the store and the admin. No browser or Supabase imports, so they run under `node --test`.

export const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', 'ONE SIZE'];
// Sizes the admin offers; the store sorts any size, these are the ones it knows the order of.
export const OFFERED_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'ONE SIZE'];
export const DEFAULT_SIZES = ['S', 'M', 'L', 'XL'];
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const PHOTO_MAX_MB = 15;
export const FILM_TYPES = ['video/mp4', 'video/webm'];
export const FILM_MAX_MB = 100;

export function sortSizes(first, second) {
  const firstRank = SIZE_ORDER.indexOf(first.size.toUpperCase());
  const secondRank = SIZE_ORDER.indexOf(second.size.toUpperCase());
  if (firstRank === -1 && secondRank === -1) return first.size.localeCompare(second.size, undefined, { numeric: true });
  return (firstRank === -1 ? SIZE_ORDER.length : firstRank) - (secondRank === -1 ? SIZE_ORDER.length : secondRank);
}

// Turns a products row (with castes, product_images and product_sizes) into what the product page draws.
// `media` resolves a stored key to a URL; the app passes `mediaUrl`.
export function shapeProduct(data, media) {
  return {
    ...data,
    images: [...(data.product_images || [])].filter(image => image.r2_key).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(image => ({ src: media(image.r2_key), alt: image.alt || data.name })),
    sizes: [...(data.product_sizes || [])].sort(sortSizes),
    video: media(data.video_r2_key),
    caste: data.castes?.name || 'The Sanctum',
    castePath: data.caste_id === 'old-world' ? '/old-world' : `/the-${data.caste_id}`,
  };
}

// Craft text is stored as one string; the product page splits it before these headings.
export const CRAFT_LABELS = ['Details', 'Fit', 'Colour', 'Material', 'Branding', 'Wash Care', 'Ironing', 'Returns'];
const CRAFT_SPLIT = /\s+(?=(?:Details|Fit|Colour|Color|Material|Branding|Wash Care|Ironing|Returns):?\s)/i;
const CRAFT_LINE = /^(Details|Fit|Colour|Color|Material|Branding|Wash Care|Ironing|Returns):?\s+([\s\S]*)$/i;

export function parseCraft(text) {
  return (text || '').trim().split(CRAFT_SPLIT).filter(Boolean).map(part => {
    const match = part.match(CRAFT_LINE);
    if (!match) return { label: '', text: part.trim() };
    const label = match[1].toLowerCase() === 'color' ? 'Colour' : CRAFT_LABELS.find(l => l.toLowerCase() === match[1].toLowerCase());
    return { label, text: match[2].trim() };
  });
}
export function joinCraft(lines) {
  return lines.filter(line => line.text?.trim()).map(line => (line.label ? `${line.label}: ${line.text.trim()}` : line.text.trim())).join(' ');
}

export function slugify(name) {
  return (name || '').normalize('NFKD').toLowerCase().replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

// What a garment needs before it can be published. `required` items block publishing.
export function publishChecks({ name, caste_id, price, passage }, sizes, images) {
  const usable = images.filter(image => !image.broken);
  return [
    { id: 'basics', ok: Boolean(name?.trim() && caste_id), required: true, text: 'Name and caste' },
    { id: 'price', ok: Number(price) > 0, required: true, text: 'Price above ₹0' },
    { id: 'photo', ok: usable.length > 0, required: true, text: 'At least one photo that loads', hint: images.length && !usable.length ? 'Every photo is missing' : '' },
    { id: 'sizes', ok: sizes.length > 0, required: true, text: 'At least one size offered' },
    { id: 'stock', ok: sizes.some(s => s.in_stock), required: false, text: 'At least one size in stock', hint: 'Otherwise the store shows "Currently unavailable"' },
    { id: 'story', ok: Boolean(passage?.trim()), required: false, text: 'Description' },
  ];
}
export const canPublish = checks => checks.every(check => check.ok || !check.required);

// Problems shown in the product list. `brokenIds` holds products whose photo failed to load in the browser.
export function productIssues(product, brokenIds = new Set()) {
  const issues = [];
  if (!product.product_images?.length) issues.push('No photo');
  else if (brokenIds.has(product.id)) issues.push('Photo missing');
  if (!(Number(product.price) > 0)) issues.push('No price');
  if (!product.product_sizes?.some(s => s.in_stock)) issues.push('Nothing in stock');
  return issues;
}

// Body measurements for the Size & Care chart, in cm: [chest, waist, seat]. null until the studio supplies them.
// Body measurements in cm: [size, chest, waist, seat]. Standard unisex grading in 6 cm steps.
export const SIZE_CHART = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((size, i) => [size, 78 + i * 6, 64 + i * 6, 82 + i * 6]);

// Inches are rounded to the nearest half inch, the precision a tape measure shows.
export function formatMeasure(cm, unit) {
  if (cm == null) return '—';
  return unit === 'in' ? String(Math.round((cm / 2.54) * 2) / 2) : String(cm);
}
