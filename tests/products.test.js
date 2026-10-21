import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCraft, joinCraft, slugify, publishChecks, canPublish, productIssues, shapeProduct, formatMeasure } from '../src/lib/products.js';

test('craft text splits into labelled lines and joins back the way the product page reads it', () => {
  const text = 'Hand-finished in Delhi. Details: Bone appliqué Fit: Relaxed through the leg Color: White wash Care: gentle';
  const lines = parseCraft(text);
  // Headings are matched case-insensitively, exactly as the product page splits them ("wash Care:" starts a line).
  assert.deepEqual(lines.map(l => l.label), ['', 'Details', 'Fit', 'Colour', 'Wash Care']);
  assert.equal(lines[3].text, 'White');
  assert.equal(joinCraft(lines), 'Hand-finished in Delhi. Details: Bone appliqué Fit: Relaxed through the leg Colour: White Wash Care: gentle');
  assert.equal(joinCraft([{ label: 'Fit', text: '  ' }, { label: 'Material', text: 'Denim' }]), 'Material: Denim');
  assert.deepEqual(parseCraft(''), []);
});
test('page addresses are lower-case words joined by hyphens', () => {
  assert.equal(slugify('Boner Flared Denim'), 'boner-flared-denim');
  assert.equal(slugify('  Café — Robe №2 '), 'cafe-robe-no2');
});
test('publishing needs a working photo, a price, a caste and a size; stock and story only warn', () => {
  const product = { name: 'Rust', caste_id: 'fallen', price: 15000, passage: '' };
  const sizes = [{ size: 'M', in_stock: false }];
  assert.equal(canPublish(publishChecks(product, sizes, [{ broken: true }])), false);
  const checks = publishChecks(product, sizes, [{ broken: false }]);
  assert.equal(canPublish(checks), true);
  assert.deepEqual(checks.filter(c => !c.ok).map(c => c.id), ['stock', 'story']);
  assert.equal(canPublish(publishChecks({ ...product, price: 0 }, sizes, [{}])), false);
});
test('list flags missing photos, prices and stock', () => {
  const product = { id: 'rust', price: 0, product_images: [{ r2_key: '/rust.png' }], product_sizes: [{ size: 'S', in_stock: false }] };
  assert.deepEqual(productIssues(product, new Set(['rust'])), ['Photo missing', 'No price', 'Nothing in stock']);
  assert.deepEqual(productIssues({ ...product, product_images: [] }), ['No photo', 'No price', 'Nothing in stock']);
});
test('product page data orders photos and sizes and resolves media', () => {
  const view = shapeProduct({ name: 'Rot', caste_id: 'old-world', video_r2_key: null, product_images: [{ r2_key: 'b', sort_order: 1 }, { r2_key: 'a', sort_order: 0, alt: 'Front' }], product_sizes: [{ size: 'XL' }, { size: 'S' }] }, key => (key ? `cdn/${key}` : null));
  assert.deepEqual(view.images, [{ src: 'cdn/a', alt: 'Front' }, { src: 'cdn/b', alt: 'Rot' }]);
  assert.deepEqual(view.sizes.map(s => s.size), ['S', 'XL']);
  assert.equal(view.castePath, '/old-world');
  assert.equal(view.video, null);
});

test('size chart measurements show in cm, in half inches, or a dash until supplied', () => {
  assert.equal(formatMeasure(96, 'cm'), '96');
  assert.equal(formatMeasure(96, 'in'), '38');
  assert.equal(formatMeasure(80, 'in'), '31.5');
  assert.equal(formatMeasure(null, 'cm'), '—');
});
