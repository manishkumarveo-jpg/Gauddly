// Recently viewed garments, kept per browser in localStorage (a convenience, not account data).
const KEY = 'gauddly_recently_viewed';
const LIMIT = 8;

// Newest first, no duplicates, capped at LIMIT
export function addView(list, item) {
  return [item, ...list.filter((i) => i.id !== item.id)].slice(0, LIMIT);
}

export function readViews(storage = globalThis.localStorage) {
  try {
    const list = JSON.parse(storage.getItem(KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function recordView(item, storage = globalThis.localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(addView(readViews(storage), item)));
  } catch {
    // storage full or blocked: nothing to remember
  }
}
