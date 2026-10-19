// Public catalog reads, cached in Upstash Redis. Served by the Worker (worker/index.js) in production
// and by the Vite dev server locally. Supabase is always read with the anon key, so the cache can
// only ever hold rows RLS shows to everyone. Postgres bumps catalog:version on every catalog edit
// (migration 202610190001), which retires all cached entries at once.
const CACHE_SECONDS = 600;
const REDIS_TIMEOUT_MS = 1000; // a slow cache must not hold up the Supabase fallback
const SUPABASE_TIMEOUT_MS = 5000;
const productCard = 'id,num,name,price,passage,product_images(r2_key,sort_order)';
const filter = value => `eq.${encodeURIComponent(value)}`;

const ROUTES = {
  home: () => ['rpc/get_homepage'],
  'home-catalog': () => [
    'products?select=id,name,price,caste_id,passage,product_images(r2_key,sort_order)&is_published=eq.true&order=sort_order',
    'castes?select=id,name,hero_r2_key,passage&id=neq.old-world&order=sort_order',
    'episodes?select=id,title,status,still_r2_key,video_r2_key&status=eq.released&order=sort_order',
  ],
  store: () => [
    'castes?select=id,name,sort_order&order=sort_order',
    'products?select=id,name,price,caste_id,sort_order,product_images(r2_key,sort_order),product_sizes(size,in_stock)&is_published=eq.true&order=sort_order',
  ],
  archive: () => [`products?select=${productCard}&caste_id=eq.old-world&is_published=eq.true&order=sort_order`],
  episodes: () => ['episodes?select=id,num,title,status,still_r2_key,video_r2_key,description,director_note&order=sort_order'],
  caste: id => [
    `castes?select=id,name,hero_r2_key,passage&id=${filter(id)}`,
    `products?select=${productCard}&caste_id=${filter(id)}&is_published=eq.true&order=sort_order`,
  ],
  piece: id => [
    `products?select=id,name,num,price,passage,craft,caste_id,video_r2_key,castes(name),product_images(r2_key,sort_order,alt),product_sizes(size,in_stock)&id=${filter(id)}&is_published=eq.true&product_images.order=sort_order.asc`,
  ],
};

const json = (body, status, cache) => new Response(body, {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...(cache && { 'X-Cache': cache }) },
});

// path is what follows /api/, e.g. "store" or "piece/dust-robe".
export async function handlePublicRead(path, env, fetchImpl = fetch) {
  const [name, rawId, extra] = path.split('/');
  const route = Object.hasOwn(ROUTES, name) ? ROUTES[name] : null;
  let id;
  try { id = rawId === undefined ? undefined : decodeURIComponent(rawId); } catch { id = null; }
  const keyed = route?.length === 1;
  if (!route || id === null || extra !== undefined || keyed !== (id !== undefined) || id?.length > 100) {
    return json(JSON.stringify({ error: 'Not found' }), 404);
  }

  const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? command => fetchImpl(env.UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
    }).then(res => res.json()).then(reply => reply.result)
    : null;
  // Redis is an optimisation: if it is missing or down, read Supabase directly.
  const version = redis && await redis(['GET', 'catalog:version']).catch(() => null);
  const key = redis && `catalog:${version || 0}:${name}${keyed ? `/${id}` : ''}`;
  const hit = key && await redis(['GET', key]).catch(() => null);
  if (hit) return json(hit, 200, 'HIT');

  const headers = { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` };
  const unavailable = () => json(JSON.stringify({ error: 'The catalog could not be loaded.' }), 502);
  let body;
  try {
    const responses = await Promise.all(route(id).map(query => fetchImpl(`${env.VITE_SUPABASE_URL}/rest/v1/${query}`, { headers, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) })));
    if (responses.some(res => !res.ok)) return unavailable();
    body = JSON.stringify(await Promise.all(responses.map(res => res.json())));
  } catch {
    return unavailable(); // network error, timeout or a body that is not JSON
  }
  // Unknown ids are not cached, so random ids cannot fill Redis.
  const found = !keyed || JSON.parse(body)[0].length > 0;
  if (key && found) await redis(['SET', key, body, 'EX', CACHE_SECONDS]).catch(() => null);
  return json(body, 200, key ? 'MISS' : undefined);
}

// Browser entry point. Uses the cached /api route, and reads Supabase directly (uncached) when /api is
// missing or failing, for example on a static-only deploy or a Worker without its variables.
// Resolves to one result array per query in the route, in order.
export async function publicRead(path, env, fetchImpl = fetch) {
  const api = await fetchImpl(`/api/${path}`).catch(() => null);
  const served = api?.ok && api.headers.get('content-type')?.startsWith('application/json');
  const res = served ? api : await handlePublicRead(path, env, fetchImpl);
  if (!res.ok) throw new Error(`Catalog request failed (${res.status})`);
  return res.json();
}
