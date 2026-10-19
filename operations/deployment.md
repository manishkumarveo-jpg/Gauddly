# Deployment and environments

## Environment variables

This list is authoritative until `.env.example` is corrected (R-06) ([ADR-013](../architecture/architecture-decisions.md#adr-013--envexample-lists-server-variables-and-omits-client-variables)).

### Frontend (Vite, set locally in `.env.local` and in the Vercel project settings)

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `VITE_R2_PUBLIC_URL` | Yes, for media | Public base URL of the R2 bucket. A bare media key is resolved as `<VITE_R2_PUBLIC_URL>/<key>`. |
| `VITE_AUTH_IMAGE_URL` | No | Overrides the sign-in page photograph ([docs/authentication.md](../docs/authentication.md)) |

`VITE_*` values are embedded in the public bundle. Never put a secret in one.

### Server (Supabase Edge Function secrets)

| Variable | Used by |
| --- | --- |
| `R2_ACCOUNT_ID` | `admin-upload-url` |
| `R2_ACCESS_KEY_ID` | `admin-upload-url` |
| `R2_SECRET_ACCESS_KEY` | `admin-upload-url` |
| `R2_BUCKET_NAME` | `admin-upload-url` |

Set them with `supabase secrets set NAME=value`. They are listed in `.env.example` for reference only.

## Local development

```sh
npm ci
# create .env.local with the frontend variables above
npm run dev          # http://localhost:5173
```

## Release checklist

1. Run `npm run lint`, `node --test tests/*.test.js` and `npm run build`. All must pass (TC-056).
2. Apply any new migration in `supabase/migrations/` to the target project before deploying frontend code that depends on it. Database changes go out before frontend changes.
3. Deploy any changed Edge Function (`supabase functions deploy <name>`).
4. Push to the branch Vercel deploys from. Vercel runs `vite build` and serves `dist/` with the rewrites and headers in `vercel.json` (ADR-005).
5. Smoke-test `/home`, `/store`, a product page, sign-in and `/admin` on the deployment.
6. Homepage content is published from `/admin/homepage`, separately from code deploys ([docs/homepage.md](../docs/homepage.md)).

## Supabase Auth configuration

For each deployment origin, allow `<origin>/reset-password**` in Authentication → URL Configuration, and keep the Site URL set to the production origin (ASSUMPTION-018). Email delivery needs a working SMTP provider (ASSUMPTION-011).

## Rollback

| Layer | How |
| --- | --- |
| Frontend | Promote the previous deployment in Vercel |
| Homepage content | Publish the previous content from the editor. There is no version history beyond the current draft and published document. |
| Database | Write a forward migration that reverses the change. Migrations are not automatically reversible. |
| Edge Functions | Redeploy the previous source, once it is versioned (PH-7) |
