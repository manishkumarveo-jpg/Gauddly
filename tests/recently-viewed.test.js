import test from 'node:test';
import assert from 'node:assert/strict';
import { addView, readViews, recordView } from '../src/lib/recently-viewed.js';

const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
};

test('a viewed garment moves to the front without duplicates, and the list keeps 8', () => {
  let list = [];
  for (let i = 1; i <= 10; i++) list = addView(list, { id: `p${i}` });
  assert.equal(list.length, 8);
  assert.equal(list[0].id, 'p10');
  list = addView(list, { id: 'p5' });
  assert.deepEqual(list.slice(0, 2).map((i) => i.id), ['p5', 'p10']);
  assert.equal(list.filter((i) => i.id === 'p5').length, 1);
});

test('stored views survive a round trip, and broken storage reads as empty', () => {
  const storage = memoryStorage();
  recordView({ id: 'a', name: 'Rust Hand-Dyed Jeans' }, storage);
  assert.deepEqual(readViews(storage), [{ id: 'a', name: 'Rust Hand-Dyed Jeans' }]);
  assert.deepEqual(readViews(memoryStorage({ gauddly_recently_viewed: 'not json' })), []);
  assert.deepEqual(readViews({ getItem: () => { throw new Error('blocked'); } }), []);
});
