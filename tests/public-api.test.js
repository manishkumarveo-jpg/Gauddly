import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePublicRead } from '../src/lib/public-api.js';

const env = { VITE_SUPABASE_URL: 'https://db', VITE_SUPABASE_ANON_KEY: 'anon', UPSTASH_REDIS_REST_URL: 'https://redis', UPSTASH_REDIS_REST_TOKEN: 't' };

// Fake Redis (a Map) and a fake Supabase that returns `rows` for every query.
function fakes({ rows = [{ id: 'dust-robe' }], redisDown = false } = {}) {
  const redis = new Map();
  const db = [];
  const fetchImpl = async (url, init) => {
    if (url === env.UPSTASH_REDIS_REST_URL) {
      if (redisDown) throw new Error('down');
      const [cmd, key, value] = JSON.parse(init.body);
      if (cmd === 'SET') redis.set(key, value);
      if (cmd === 'INCR') redis.set(key, String(Number(redis.get(key) || 0) + 1));
      return Response.json({ result: redis.get(key) ?? null });
    }
    db.push(url);
    return Response.json(rows);
  };
  return { redis, db, fetchImpl };
}

test('caches a miss and serves the next read from Redis', async () => {
  const { db, fetchImpl } = fakes();
  const first = await handlePublicRead('store', env, fetchImpl);
  assert.equal(first.headers.get('X-Cache'), 'MISS');
  assert.equal(db.length, 2);
  const second = await handlePublicRead('store', env, fetchImpl);
  assert.equal(second.headers.get('X-Cache'), 'HIT');
  assert.deepEqual(await second.json(), [[{ id: 'dust-robe' }], [{ id: 'dust-robe' }]]);
  assert.equal(db.length, 2);
});

test('a catalog version bump retires cached entries', async () => {
  const { db, fetchImpl } = fakes();
  await handlePublicRead('episodes', env, fetchImpl);
  await fetchImpl(env.UPSTASH_REDIS_REST_URL, { body: '["INCR","catalog:version"]' });
  assert.equal((await handlePublicRead('episodes', env, fetchImpl)).headers.get('X-Cache'), 'MISS');
  assert.equal(db.length, 2);
});

test('unknown ids are not cached and ids are encoded into the filter', async () => {
  const { redis, db, fetchImpl } = fakes({ rows: [] });
  await handlePublicRead('piece/a%26b', env, fetchImpl);
  assert.match(db[0], /&id=eq\.a%26b&/);
  assert.equal([...redis.keys()].some(key => key.includes('piece')), false);
});

test('rejects unknown routes, bad ids and missing ids', async () => {
  const { db, fetchImpl } = fakes();
  for (const path of ['orders', 'constructor', 'piece', 'store/x', 'piece/a/b', 'piece/%E0%A4', `piece/${'x'.repeat(101)}`]) {
    assert.equal((await handlePublicRead(path, env, fetchImpl)).status, 404, path);
  }
  assert.equal(db.length, 0);
});

test('reads Supabase directly when Redis is down or not configured', async () => {
  const down = fakes({ redisDown: true });
  assert.equal((await handlePublicRead('archive', env, down.fetchImpl)).status, 200);
  const plain = fakes();
  const res = await handlePublicRead('archive', { VITE_SUPABASE_URL: 'https://db', VITE_SUPABASE_ANON_KEY: 'anon' }, plain.fetchImpl);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('X-Cache'), null);
});

test('a Supabase failure is a 502 and is not cached', async () => {
  const { redis, fetchImpl } = fakes();
  const failing = (url, init) => url === env.UPSTASH_REDIS_REST_URL ? fetchImpl(url, init) : new Response('{}', { status: 500 });
  assert.equal((await handlePublicRead('store', env, failing)).status, 502);
  const rejecting = (url, init) => url === env.UPSTASH_REDIS_REST_URL ? fetchImpl(url, init) : Promise.reject(new Error('timeout'));
  assert.equal((await handlePublicRead('store', env, rejecting)).status, 502);
  assert.equal(redis.size, 0);
});
