// Cloudflare Pages Function for /api/*: cached public catalog reads (see src/lib/public-api.js).
import { handlePublicRead } from '../../src/lib/public-api.js';

export const onRequestGet = ({ params, env }) => handlePublicRead((params.path || []).join('/'), env);
