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
