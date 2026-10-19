# System overview

Gauddly is a client-rendered single-page application. Vercel serves it as static files. All data and authorization live in Supabase, and media is stored in Cloudflare R2. There is no application server in this repository. Server-side logic runs as Postgres functions and Supabase Edge Functions.

Diagram: [diagrams/system-context.md](../diagrams/system-context.md).

## Components

| Component | Responsibility | Where it runs | In this repo? |
|---|---|---|---|
| SPA (`src/`) | All UI, routing, client state (cart, session, preferences), calls to Supabase | Visitor's browser | Yes |
| Vercel | Serves `dist/`, rewrites every path to `index.html`, long-cache headers for `/assets/*` | Vercel edge | Config only (`vercel.json`) |
| Supabase Auth | Email/password accounts, sessions, recovery email | Supabase | No (managed service) |
| Supabase Postgres | Catalog, orders, profiles, waitlist and homepage tables, with RLS | Supabase | Homepage migration only |
| `get_homepage`, `save_homepage` | Published-homepage read, and admin save/publish with revision check | Postgres (security definer) | Yes |
| `create-order` Edge Function | Validates the cart and creates `orders` / `order_items` | Supabase Edge (Deno) | No |
| `admin-upload-url` Edge Function | Checks `is_admin`, signs R2 PUT/DELETE URLs | Supabase Edge (Deno) | No |
| Cloudflare R2 | Product, caste, episode and homepage media; public read via `VITE_R2_PUBLIC_URL` | Cloudflare | No |
| Google Fonts | Cormorant Garamond, EB Garamond | Google | Referenced in `index.html` |

## Request flows

1. **Public browsing.** The browser loads the SPA from Vercel. Pages query Supabase directly with the anon key, and RLS limits results to public rows (ASSUMPTION-008). Media URLs are built by `mediaUrl()` from R2 keys.
2. **Homepage.** `Home.jsx` loads `get_homepage()` and three catalog queries in parallel through `cachedRequest` (30 s in-memory cache). It renders `HomeExperience` once the content request settles. See [diagrams/homepage-publish-sequence.md](../diagrams/homepage-publish-sequence.md).
3. **Checkout.** The cart sits in `localStorage`. `Checkout.jsx` invokes `create-order` with item IDs, sizes, quantities and shipping details. See [diagrams/checkout-sequence.md](../diagrams/checkout-sequence.md).
4. **Authentication.** Supabase Auth issues the session. `AppContext` subscribes to auth changes and loads `profiles.is_admin` once per user. See [diagrams/auth-flow.md](../diagrams/auth-flow.md).
5. **Admin media.** The studio asks `admin-upload-url` for a presigned URL, then uploads or deletes directly against R2, so files never pass through Supabase.

## Client state

| State | Storage | Owner |
|---|---|---|
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
