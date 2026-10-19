import { createClient } from '@supabase/supabase-js';
import { publicRead as readPublic } from './public-api';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Resolves a stored media key to a full URL: absolute URLs (http/https) and
// local /public paths pass through unchanged; bare R2 object keys get the
// R2 public base URL prefixed. Lets the catalog seed with /public assets now
// and swap individual rows to R2 keys later with no frontend code change.
export function mediaUrl(key) {
  if (!key) return null;
  if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('/')) {
    return key;
  }
  return `${import.meta.env.VITE_R2_PUBLIC_URL}/${key}`;
}

// Public catalog reads: the Redis-cached /api route, or Supabase directly as a fallback (src/lib/public-api.js).
export const publicRead = path => readPublic(path, import.meta.env);

// supabase-js only gives a generic "non-2xx status code" message on FunctionsHttpError -
// the actual { error: "..." } body our edge functions return lives on error.context (the raw Response).
export async function edgeFunctionErrorMessage(error) {
  try {
    const body = await error.context?.json();
    return body?.error || error.message;
  } catch {
    return error.message;
  }
}
