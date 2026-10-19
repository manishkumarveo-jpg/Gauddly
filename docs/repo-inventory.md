# Repository inventory

Snapshot date: 2026-10-19. Branch: `dev-satyam`. Base commit: `e8f740c`.

This file records what the repository actually contains. All other documentation is derived from it. When the code and this file disagree, the code wins and this file must be updated.

## Working-tree note

Five source files carry uncommitted changes at the time of writing. They make admin sign-in redirect to the dashboard and add dashboard entry points: `src/components/Navigation.jsx`, `src/context/AppContext.jsx`, `src/pages/Account.jsx`, `src/pages/Login.jsx`, `src/pages/admin/AdminLayout.jsx`. The documentation describes the working tree, including these changes. See [ADR-009](../architecture/architecture-decisions.md#adr-009--admin-flag-is-loaded-once-in-appcontext).

## 1. Stack (as built)

| Layer | Technology | Evidence |
| --- | --- | --- |
| Build tool | Vite 8 | `package.json`, `vite.config.js` |
| UI | React 19, JavaScript (JSX), no TypeScript | `package.json`, `src/**/*.jsx` |
| Routing | React Router 7 (`BrowserRouter`, lazy routes) | `src/App.jsx` |
| Styling | Hand-written global CSS and inline styles; no Tailwind | `src/index.css`, `src/components/*.css` |
| Backend | Supabase: Postgres, Auth, Row Level Security, RPC, Edge Functions | `src/lib/supabase.js`, `supabase/migrations/` |
| Media storage | Cloudflare R2, via presigned URLs from a Supabase Edge Function | `src/pages/admin/uploadToR2.js` |
| Hosting | Cloudflare Pages (static `dist/`, immutable cache on `/assets/*`, one Pages Function for `/api/*`); `vercel.json` is left over and unused (ADR-016) | `public/_headers`, `functions/api/[[path]].js` |
| Cache | Upstash Redis over its REST API, for public catalog reads (NFR-008) | `src/lib/public-api.js` |
| Lint | oxlint (react, oxc plugins) | `.oxlintrc.json` |
| Unit tests | Node built-in test runner (`node:test`) | `tests/*.test.js` |
| SQL tests | psql scripts in a rolled-back transaction | `tests/homepage-permissions.sql`, `tests/rate-limits-permissions.sql` |
| AI | None. No Groq or other model calls exist. | Code search: no AI SDK or API calls |

Runtime dependencies are limited to `@supabase/supabase-js`, `react`, `react-dom`, `react-router-dom`.

## 2. Directory structure

```
.
├── index.html                 SPA shell, fonts, base meta tags
├── vite.config.js             React plugin, plus dev middleware serving /api/* with the Pages Function handler
├── vercel.json                Unused since the move to Cloudflare Pages (ADR-016)
├── functions/api/[[path]].js  Cloudflare Pages Function: Redis-cached public catalog reads
├── .oxlintrc.json             Lint rules
├── .env.example               R2 server-side variable names only (see gaps)
├── .txt                       Stray design prompt for an unrelated TS/Tailwind landing page
├── README.md                  Project README (was Vite template boilerplate)
├── public/                    LOGO BLACK.png, wordmark.png, icons.svg, _headers (asset cache header)
├── docs/                      authentication.md, homepage.md, design/dust-robe/*
├── supabase/migrations/       202610150001_homepage.sql, 202610190001_rate_limits_and_catalog_cache.sql
├── tests/                     homepage, products, public-api and request-cache unit tests; homepage and rate-limit SQL permission scripts
└── src/
    ├── main.jsx, App.jsx      Entry point and route table
    ├── context/               AppContext (cart, session, isAdmin, sound, entry, codex)
    ├── lib/                   supabase client, public read API, homepage model, request cache, safe redirects
    ├── components/            Navigation, Footer, CartDrawer, HomeExperience, SEO, cursor, effects
    └── pages/                 Public pages and admin/ studio
```

## 3. Routes

| Path | Component | Access |
| --- | --- | --- |
| `/` | Landing | Public. Redirects to `/home` if entered within 30 days |
| `/home` | Home → HomeExperience | Public |
| `/store` | Store | Public |
| `/codex` | Codex | Public |
| `/the-sanctum` | Sanctum | Public |
| `/old-world` | Archive | Public |
| `/the-old-world/:pieceId` | PieceDetail | Public |
| `/:casteId` | CastePage | Public (catch-all for caste slugs) |
| `/:casteId/:pieceId` | PieceDetail | Public |
| `/episodes` | Episodes | Public |
| `/await` | Await (waitlist) | Public |
| `/api/*` | Not an SPA route: the Pages Function for cached catalog reads (`home`, `home-catalog`, `store`, `archive`, `episodes`, `caste/:id`, `piece/:id`) | Public |
| `/checkout` | Checkout | Signed-in users |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Auth pages | Public |
| `/account` | Account | Signed-in users |
| `/shipping`, `/returns`, `/privacy`, `/terms`, `/size-care` | InfoPage | Public |
| `/admin`, `/admin/products`, `/admin/castes`, `/admin/episodes`, `/admin/orders`, `/admin/homepage` | Admin studio | Signed-in users with `profiles.is_admin = true` |
| `/admin/homepage/preview` | HomepagePreview (the editor's live preview, with real site chrome) | Shows only content sent by the editor window that opened it; empty otherwise |
| `/admin/products/new`, `/admin/products/:productId` | AdminProductEditor | Admins, as the rest of `/admin` |
| `/admin/products/preview` | ProductPreview (the garment editor's live preview) | Shows only content sent by the editor window that opened it; empty otherwise |
| `*` | NotFound | Public |

## 4. Data access used by the frontend

Supabase objects referenced in `src/`:

| Object | Kind | Operations from the client | Defined in repo? |
| --- | --- | --- | --- |
| `profiles` | table | select `is_admin`, `full_name`, `default_address`; update own profile | No |
| `products` | table | public select through `/api/*`; admin select/insert/update/delete | No (cache-clearing trigger: Yes) |
| `product_images` | table | public select through `/api/*`; admin insert/delete | No (cache-clearing trigger: Yes) |
| `product_sizes` | table | public select through `/api/*`; admin insert/update `in_stock` | No (cache-clearing trigger: Yes) |
| `castes` | table | public select through `/api/*`; admin insert/update/delete | No (cache-clearing trigger: Yes) |
| `episodes` | table | public select through `/api/*`; admin insert/update/delete | No (cache-clearing trigger: Yes) |
| `orders` | table | select (customer history, admin lists); admin update `status` | No (rate-limit trigger and index: Yes) |
| `order_items` | table | select (embedded) | No |
| `waitlist_signups` | table | insert `email` (unique; `23505` treated as success) | No (rate-limit trigger and email check: Yes) |
| `waitlist_attempts` | table | none; written by the waitlist trigger only | **Yes**, `202610190001_rate_limits_and_catalog_cache.sql` |
| `top_products` | view or table | admin select | No |
| `homepage_content` | table | admin select `draft, published, revision, updated_at` | **Yes**, `202610150001_homepage.sql` |
| `get_homepage()` | RPC | public select of published homepage, through `/api/home` | **Yes** |
| `save_homepage(content, expected_revision, publish)` | RPC | admin save/publish with revision check | **Yes** |
| `create-order` | Edge Function | checkout order creation | **No** |
| `admin-upload-url` | Edge Function | presigned R2 PUT/DELETE URLs for admins | **No** |

## 5. Environment variables

| Variable | Used by | In `.env.example`? |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `src/lib/supabase.js` | No |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.js` | No |
| `VITE_R2_PUBLIC_URL` | `src/lib/supabase.js` (`mediaUrl`) | No |
| `VITE_AUTH_IMAGE_URL` | `src/components/AuthLayout.jsx` (optional) | No |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Not used by `src/`; presumably by the `admin-upload-url` Edge Function | Yes |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | `src/lib/public-api.js` at runtime in the Pages Function and `vite.config.js`; never in the bundle | Yes |

Real `.env` / `.env.local` files were not read.

## 6. Tests and quality gates

| Check | Command | Baseline result (2026-10-19, Node 26.5.0) |
| --- | --- | --- |
| Lint | `npm run lint` | Pass, no findings |
| Unit tests | `node --test tests/*.test.js` | Pass, 23 of 23 |
| Unit tests (directory form) | `node --test tests/` | Fails on Node 26: the directory is treated as a module path |
| Build | `npm run build` | Pass |
| SQL permissions | `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/homepage-permissions.sql` | Not run (needs a database URL; out of scope for documentation work) |

There is no `test` script in `package.json`, no CI configuration (`.github/` absent), and no end-to-end tests.

## 7. Existing documentation

| File | Content | Status |
| --- | --- | --- |
| `README.md` | Vite template boilerplate | Rewritten; tooling notes kept |
| `docs/authentication.md` | Sign-in, redirects, password recovery setup | Accurate. Kept, linked |
| `docs/homepage.md` | Homepage content studio, migration, verification | Accurate. Kept, linked |
| `docs/design/dust-robe/*` | Product-detail redesign proposal (not implemented) | Kept as design input |
| `.claude/` | Absent | Created |

## 8. Implemented vs missing

**Implemented**
- Entry sequence with 30-day bypass and optional sound drone.
- Editorial homepage driven by a published CMS document with safe defaults.
- Storefront: store grid with caste, size and sort filters; caste rooms; product detail; archive.
- Cart in `localStorage`; checkout through the `create-order` Edge Function.
- Supabase email/password auth: signup, sign-in, recovery, account profile and order history.
- Admin redirect after sign-in plus dashboard links in the navigation and on the account page (working tree).
- Story content: Codex chapters with local unlocks, Episodes films, Sanctum page, waitlist, legal/info pages.
- Admin studio: dashboard metrics and CSV export, products, castes, episodes, orders, homepage editor, R2 uploads.
- Per-route SEO meta tags; noindex on auth and admin.
- Rate limits on waitlist signups and pending orders; Redis-cached public catalog reads (working tree).

**Missing or not in version control**
- SQL schema and RLS policies for every table except `homepage_content` and `waitlist_attempts`.
- Source for the `create-order` and `admin-upload-url` Edge Functions.
- Online payment collection. Orders have a `paid` status but no payment provider is integrated; status is changed manually by admins.
- `VITE_*` variables in `.env.example`.
- `test` npm script, CI pipeline, end-to-end tests, error monitoring.

## 9. Phase status summary

Phase definitions are in [implementation/phase-plan.md](../implementation/phase-plan.md); evidence is in [implementation/phase-test-matrix.md](../implementation/phase-test-matrix.md).

| Phase | Name | Status |
| --- | --- | --- |
| PH-1 | Foundation and design system | Complete |
| PH-2 | Accounts and authentication | Complete |
| PH-3 | Catalog and storefront | Complete |
| PH-4 | Cart, checkout and payments | Partial: checkout done, payments not built |
| PH-5 | Story and engagement content | Complete |
| PH-6 | Admin studio | Complete |
| PH-7 | Data layer reproducibility and security hardening | Partial: homepage and rate limits only |
| PH-8 | Quality gates, CI and launch readiness | Partial: unit tests, lint and catalog cache only |
