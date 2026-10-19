# System overview

Gauddly is a client-rendered single-page application. A Cloudflare Worker deployment serves it as static assets, plus one read-only Worker that serves public catalog reads from an Upstash Redis cache (ADR-016). All writes, data and authorization live in Supabase, and media is stored in Cloudflare R2. Other server-side logic runs as Postgres functions and Supabase Edge Functions.

Diagram: [diagrams/system-context.md](../diagrams/system-context.md).

## Components

| Component | Responsibility | Where it runs | In this repo? |
| --- | --- | --- | --- |
| SPA (`src/`) | All UI, routing, client state (cart, session, preferences), calls to Supabase | Visitor's browser | Yes |
| Cloudflare Workers static assets | Serves `dist/`, falls back to `index.html` for unknown paths, long-cache headers for `/assets/*` | Cloudflare edge | Config only (`wrangler.jsonc`, `public/_headers`) |
| `/api/*` Worker | Allow-listed public catalog reads with the anon key, cached in Redis for 10 minutes | Cloudflare edge (Workers runtime) | Yes (`worker/index.js`, `src/lib/public-api.js`) |
| Upstash Redis | Cached `/api/*` responses under `catalog:<version>:<route>` | Upstash | No (managed service) |
| Supabase Auth | Email/password accounts, sessions, recovery email | Supabase | No (managed service) |
| Supabase Postgres | Catalog, orders, profiles, waitlist and homepage tables, with RLS; rate-limit and cache-clearing triggers | Supabase | Homepage and rate-limit migrations only |
| `get_homepage`, `save_homepage` | Published-homepage read, and admin save/publish with revision check | Postgres (security definer) | Yes |
| `create-order` Edge Function | Validates the cart and creates `orders` / `order_items` | Supabase Edge (Deno) | No |
| `admin-upload-url` Edge Function | Checks `is_admin`, signs R2 PUT/DELETE URLs | Supabase Edge (Deno) | No |
| Cloudflare R2 | Product, caste, episode and homepage media; public read via `VITE_R2_PUBLIC_URL` | Cloudflare | No |
| Google Fonts | Cormorant Garamond, EB Garamond | Google | Referenced in `index.html` |

## Request flows

1. **Public browsing.** The browser loads the SPA from Cloudflare. Catalog pages call `publicRead()`, which fetches `/api/<route>`, or reads Supabase directly if `/api` is missing or failing. The Worker returns the Redis entry for the current `catalog:version`, or reads Supabase with the anon key (so RLS limits results to public rows, ASSUMPTION-008) and stores the result. Any write to a catalog table bumps `catalog:version` through `pg_net`, so the next read is fresh (NFR-008). Media URLs are built by `mediaUrl()` from R2 keys.
2. **Homepage.** `Home.jsx` loads `/api/home` (`get_homepage()`) and `/api/home-catalog` (three catalog queries) in parallel through `cachedRequest` (30 s in-memory cache). It renders `HomeExperience` once the content request settles. The single-document design is ADR-006. See [diagrams/homepage-publish-sequence.md](../diagrams/homepage-publish-sequence.md).
3. **Checkout.** The cart sits in `localStorage`. `Checkout.jsx` invokes `create-order` with item IDs, sizes, quantities and shipping details (ADR-007). See [diagrams/checkout-sequence.md](../diagrams/checkout-sequence.md).
4. **Authentication.** Supabase Auth issues the session. `AppContext` subscribes to auth changes and loads `profiles.is_admin` once per user. See [diagrams/auth-flow.md](../diagrams/auth-flow.md).
5. **Admin media.** The studio asks `admin-upload-url` for a presigned URL, then uploads or deletes directly against R2, so files never pass through Supabase (ADR-004).

## Client state

| State | Storage | Owner |
| --- | --- | --- |
| Cart | `localStorage` key `gauddly_cart` | `AppContext` |
| Entry timestamp | `gauddly_entered_at` (30-day bypass) | `AppContext` |
| Sound preference | `gauddly_sound_enabled` | `AppContext` |
| Unlocked Codex chapters | `gauddly_unlocked_chapters` | `AppContext` |
| Auth session | Supabase client (its own storage) | `AppContext` via `onAuthStateChange` |
| Admin flag | Memory, keyed by user ID | `AppContext` |
| Homepage and catalog cache | Memory, 30 s | `src/lib/request-cache.js` |

## Related documents

- Decisions: [architecture-decisions.md](architecture-decisions.md)
- Schema: [data-model.md](data-model.md)
- Interfaces: [api-contracts.md](api-contracts.md)
- Security model: [security.md](security.md)
- Routes and UI structure: [frontend.md](frontend.md)
- Deployment: [operations/deployment.md](../operations/deployment.md)
