---
paths:
  - "src/**"
  - "supabase/**"
  - "tests/**/*.sql"
  - "functions/**"
  - "public/_headers"
  - ".env.example"
---

# Security rules

Background: [architecture/security.md](../../architecture/security.md).

- **Secrets:** never read `.env`, `.env.local` or `*.local`. Never add a secret to `src/`, to `.env.example` values, or to any `VITE_*` variable. The browser holds only the anon key.
- **Authorization:** never rely on `isAdmin`, `AdminLayout` or hidden UI for protection. Every table a browser can write to needs an RLS policy that restricts the write. Admin-only operations check `exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)`.
- **Security-definer functions** set `search_path = ''`, use schema-qualified names, `revoke all … from public`, and grant `execute` only to the roles that need it. Follow `supabase/migrations/202610150001_homepage.sql`.
- **Profiles:** `profiles.is_admin` must never be writable by the profile's owner. Any change to profile policies must keep it that way (R-02).
- **Orders:** customers may read only their own orders. Only the server (Edge Function or webhook) may set `paid` or `failed`. Never trust a price from the client (R-01, R-03).
- **Uploads:** R2 access goes only through presigned URLs from `admin-upload-url`. Sanitize keys with `safeFileName`. Restrict prefixes server-side.
- **Navigation input:** run every user-controlled redirect through `safeInternalPath`, and every CMS-controlled link or media key through `homeLink` / `assetKey`.
- **PostgREST filters:** strip `,` and `%` (and anything else meaningful to `or()`) from user search terms before interpolating them into a filter, as `AdminOrders.jsx` does.
- **Rendering:** do not use `dangerouslySetInnerHTML` with data from the database or the user. Existing uses inject static CSS only.
- **Review:** changes touching auth, RLS, Edge Functions, uploads or checkout go through the `security-reviewer` agent before they are called done.
