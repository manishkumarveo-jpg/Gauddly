# Deployment and environments

## Environment variables

This list is authoritative until `.env.example` is corrected (R-06) ([ADR-013](../architecture/architecture-decisions.md#adr-013--envexample-lists-server-variables-and-omits-client-variables)).

### Frontend (Vite, set locally in `.env.local` and in the Cloudflare Pages project settings)

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `VITE_R2_PUBLIC_URL` | Yes, for media | Public base URL of the R2 bucket. A bare media key is resolved as `<VITE_R2_PUBLIC_URL>/<key>`. |
| `VITE_AUTH_IMAGE_URL` | No | Overrides the sign-in page photograph ([docs/authentication.md](../docs/authentication.md)) |

`VITE_*` values are embedded in the public bundle. Never put a secret in one. The Pages Function also reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at runtime (ASSUMPTION-023).

### Cloudflare Pages Function (encrypted variables in the Cloudflare Pages project; `.env.local` for `npm run dev`)

| Variable | Used by |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | `functions/api/[[path]].js` through `src/lib/public-api.js` |
| `UPSTASH_REDIS_REST_TOKEN` | Same. Server-only: never give it a `VITE_` prefix. |

Without them, `/api/*` still works and reads Supabase on every request.

### Server (Supabase Edge Function secrets)

| Variable | Used by |
| --- | --- |
| `R2_ACCOUNT_ID` | `admin-upload-url` |
| `R2_ACCESS_KEY_ID` | `admin-upload-url` |
| `R2_SECRET_ACCESS_KEY` | `admin-upload-url` |
| `R2_BUCKET_NAME` | `admin-upload-url` |

Set them with `supabase secrets set NAME=value`. They are listed in `.env.example` for reference only.

### Database (Supabase Vault)

| Secret name | Used by |
| --- | --- |
| `upstash_redis_rest_url` | `clear_catalog_cache()` trigger |
| `upstash_redis_rest_token` | Same |

Create them in the SQL editor with `select vault.create_secret('<value>', '<name>');`. Without them the trigger does nothing, and cached entries expire after 10 minutes (R-20).

## Local development

```sh
npm ci
# create .env.local with the frontend variables above
npm run dev          # http://localhost:5173, also serves /api/* through the same handler as production
```

## Release checklist

1. Run `npm run lint`, `node --test tests/*.test.js` and `npm run build`. All must pass (TC-056).
2. Apply any new migration in `supabase/migrations/` to the target project before deploying frontend code that depends on it. Database changes go out before frontend changes.
3. Deploy any changed Edge Function (`supabase functions deploy <name>`).
4. Push to the branch Cloudflare Pages deploys from. Pages runs `vite build`, serves `dist/` with the headers in `public/_headers`, falls back to `index.html` for unknown paths, and deploys `functions/` as the `/api/*` Pages Function (ADR-016).
5. Smoke-test `/home`, `/store`, a product page, sign-in and `/admin` on the deployment. Check that a second request to `/api/store` returns `X-Cache: HIT`.
6. Homepage content is published from `/admin/homepage`, separately from code deploys ([docs/homepage.md](../docs/homepage.md)).

## Supabase Auth configuration

For each deployment origin, allow `<origin>/reset-password**` in Authentication → URL Configuration, and keep the Site URL set to the production origin (ASSUMPTION-018). Email delivery needs a working SMTP provider (ASSUMPTION-011).

Rate limits (Authentication → Rate Limits) protect sign-in, sign-up and recovery email, which the browser calls directly (NFR-007, ASSUMPTION-022). Values chosen on 2026-10-19, to be confirmed by the owner (TC-082):

| Limit | Value |
| --- | --- |
| Sign-ups and sign-ins | 10 per 5 minutes per IP |
| Token verifications | 10 per 5 minutes per IP |
| Token refreshes | Supabase default |
| Emails sent | The SMTP provider's hourly allowance. Supabase's built-in SMTP is for testing only. |

## Catalog cache (Upstash Redis)

One-time setup for NFR-008 (ADR-016):

1. Create an Upstash Redis database and copy its REST URL and token.
2. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as encrypted variables in the Cloudflare Pages project, for production and preview.
3. In Upstash, create an ACL user whose token may only run `INCR` on `catalog:version`. Store the REST URL and that restricted token in Supabase Vault as `upstash_redis_rest_url` and `upstash_redis_rest_token`. The token also sits in `net.http_request_queue` until `pg_net` sends it, so it must not be the full-access token. Set the Vault secrets before step 2 is live, or admin edits will not clear the cache.
4. Apply migration `202610190001_rate_limits_and_catalog_cache.sql`, which enables `pg_net`. Then confirm that `select has_table_privilege('anon', 'net.http_request_queue', 'select'), has_function_privilege('anon', 'net.http_post(text,jsonb,jsonb,jsonb,integer)', 'execute');` returns `false, false`, and that `net` is not in the API's exposed schemas.
5. Run TC-085. Failed invalidation calls are recorded in `net._http_response`.

To empty the cache by hand, send `INCR catalog:version` from the Upstash console.

## Rollback

| Layer | How |
| --- | --- |
| Frontend | Roll back to the previous deployment in Cloudflare Pages |
| Catalog cache | Unset the Upstash variables in Cloudflare Pages to bypass Redis, or send `INCR catalog:version` to discard every entry |
| Homepage content | Publish the previous content from the editor. There is no version history beyond the current draft and published document. |
| Database | Write a forward migration that reverses the change. Migrations are not automatically reversible. |
| Edge Functions | Redeploy the previous source, once it is versioned (PH-7) |
