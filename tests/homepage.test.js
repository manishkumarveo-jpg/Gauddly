import test from 'node:test';
import assert from 'node:assert/strict';
import { freshHome, normalizeHome, assetKey, homeLink, chooseProducts } from '../src/lib/homepage.js';

test('missing configuration preserves all nine visible default sections', () => {
  assert.equal(normalizeHome(null).sections.length, 9);
  const a = freshHome(); a.sections[0].title = 'Changed';
  assert.equal(freshHome().sections[0].title, 'The Old World');
});
test('saved order and hidden sections survive normalization without duplicate sections', () => {
  const result = normalizeHome({ sections: [{ id: 'craft', enabled: false }, { id: 'hero', title: 'New' }, { id: 'craft' }, { id: 'unknown' }] });
  assert.equal(result.sections.length, 9);
  assert.equal(result.sections[0].id, 'craft');
  assert.equal(result.sections[0].enabled, false);
  assert.equal(result.sections[1].title, 'New');
});
test('media keys and CTA destinations reject unsafe protocols', () => {
  for (const key of ['javascript:alert(1)', 'data:text/html,test', '//outside.test/a', 'http://outside.test/a']) assert.equal(assetKey(key), '');
  assert.equal(assetKey('homepage/a.webp'), 'homepage/a.webp');
  assert.equal(assetKey('https://cdn.example/a.webp'), 'https://cdn.example/a.webp');
  assert.equal(homeLink('//outside.test'), '/store');
  assert.equal(homeLink('/episodes'), '/episodes');
});
test('product selection preserves editorial order and excludes missing products', () => {
  const products = [{ id: 'a', caste_id: 'nimbus' }, { id: 'b', caste_id: 'old-world' }];
  assert.deepEqual(chooseProducts(products, ['b', 'missing', 'a']).map(p => p.id), ['b', 'a']);
  assert.deepEqual(chooseProducts(products, [], true).map(p => p.id), ['b']);
});

import { moveSection, sectionWarnings, diffHome, coverWindow, tabForField, sectionSummary } from '../src/lib/homepage.js';

test('moving a section reorders without mutating, and ignores out-of-range moves', () => {
  const home = freshHome();
  const moved = moveSection(home, 0, 2);
  assert.deepEqual(moved.sections.slice(0, 3).map(s => s.id), ['manifesto', 'featured', 'hero']);
  assert.equal(home.sections[0].id, 'hero');
  assert.equal(moveSection(home, 0, 99), home);
});
test('warnings block unsafe links and media, and skip catalog checks until the catalog loads', () => {
  const hero = { ...freshHome().sections[0], href: '//outside.test', poster: 'javascript:alert(1)' };
  const blocking = sectionWarnings(hero).filter(w => w.blocking).map(w => w.field).sort();
  assert.deepEqual(blocking, ['href', 'poster']);
  const featured = { ...freshHome().sections[2], productIds: ['gone'] };
  assert.equal(sectionWarnings(featured).some(w => w.field === 'productIds'), false);
  assert.equal(sectionWarnings(featured, { loaded: true, products: [{ id: 'kept' }] }).some(w => w.field === 'productIds'), true);
  assert.deepEqual(sectionWarnings({ ...hero, href: '/store', poster: '', enabled: false }), []);
});
test('diff lists hidden sections, text edits, media and order changes', () => {
  const before = normalizeHome(freshHome());
  const after = moveSection(normalizeHome(freshHome()), 1, 0);
  after.sections.find(s => s.id === 'hero').title = 'Chapter two';
  after.sections.find(s => s.id === 'waitlist').enabled = false;
  after.sections.find(s => s.id === 'craft').image = 'homepage/craft/a.webp';
  const diff = diffHome(before, after);
  assert.equal(diff[0].id, 'order');
  assert.deepEqual(diff.find(d => d.id === 'hero').changes, ['Headline: “The Old World” → “Chapter two”']);
  assert.deepEqual(diff.find(d => d.id === 'waitlist').changes, ['Hidden']);
  assert.deepEqual(diff.find(d => d.id === 'craft').changes, ['Image added']);
  assert.deepEqual(diffHome(before, normalizeHome(freshHome())), []);
  assert.equal(diffHome(null, before)[0].id, 'all');
});
test('cover window shows the slice a phone crops to, following the focal point', () => {
  assert.deepEqual(coverWindow(2000, 1000, 500, 1000, 50, 50), { x: 37.5, y: 0, w: 25, h: 100 });
  assert.deepEqual(coverWindow(2000, 1000, 500, 1000, 0, 50), { x: 0, y: 0, w: 25, h: 100 });
  assert.equal(coverWindow(0, 1000, 500, 1000), null);
});
test('fields open the tab that holds them, falling back to the first tab', () => {
  assert.equal(tabForField('hero', 'poster'), 'media');
  assert.equal(tabForField('film', 'poster'), 'film');
  assert.equal(tabForField('featured', 'productIds'), 'garments');
  assert.equal(tabForField('castes', 'cta'), 'words');
  assert.equal(sectionSummary({ id: 'archive', productIds: [] }), 'Chosen automatically');
});
