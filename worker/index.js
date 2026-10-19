// Cloudflare Worker: /api/* serves cached public catalog reads (src/lib/public-api.js);
// every other path is the static SPA in dist/.
import { handlePublicRead } from '../src/lib/public-api.js';

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    return handlePublicRead(pathname.slice('/api/'.length), env);
  },
};
