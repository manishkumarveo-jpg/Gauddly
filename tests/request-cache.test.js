import test from 'node:test';
import assert from 'node:assert/strict';
import { cachedRequest } from '../src/lib/request-cache.js';

test('coalesces concurrent requests and caches successful results', async () => {
  let calls = 0;
  const load = cachedRequest(async () => ++calls);
  assert.deepEqual(await Promise.all([load(), load()]), [1, 1]);
  assert.equal(await load(), 1);
  assert.equal(calls, 1);
});
test('does not cache partial failures or rejected requests', async () => {
  let calls = 0;
  const load = cachedRequest(async () => {
    calls++;
    if (calls === 1) throw new Error('offline');
    return { failed: calls === 2 };
  });
  await assert.rejects(load());
  assert.equal((await load()).failed, true);
  assert.equal((await load()).failed, false);
  assert.equal(calls, 3);
});
test('expired results are fetched again', async () => {
  let calls = 0;
  const load = cachedRequest(async () => ++calls, 0);
  await load();
  assert.equal(await load(), 2);
});
