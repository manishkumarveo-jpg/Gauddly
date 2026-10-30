# Architecture decision records

Each ADR records a decision, or a discrepancy between an assumed design and the code. The code wins: where they differ, the ADR documents what the code does.

Status values:
- **Accepted**: the current design.
- **Accepted (discrepancy)**: the code differs from a default or assumption, and that is recorded rather than changed.
- **Proposed**: a recommended future change awaiting an owner decision.

---

## ADR-001 — Keep Vite + React SPA instead of Next.js App Router

- **Status:** Accepted (discrepancy)
- **Context:** The documentation brief defaults to Next.js (App Router) wherever the repo has not decided. This repo has decided: it is a Vite 8 + React 19 SPA with React Router 7 (`package.json`, `src/App.jsx`).
- **Decision:** Keep Vite + React Router. Do not propose a migration.
- **Justification:** The whole UI, routing, lazy loading and hosting config are built around a static SPA. A migration would rewrite every page without any open requirement that needs server rendering.
- **Consequences:** No server-side rendering. SEO depends on client-set meta tags (NFR-001), which some crawlers and link-preview bots do not execute (R-09). All server logic must live in Supabase (ADR-003).

## ADR-002 — JavaScript, not TypeScript

- **Status:** Accepted (discrepancy)
- **Context:** The default stack names TypeScript. All source files are `.jsx` or `.js`. `@types/react` is installed but unused. The stray root file `.txt` describes a TypeScript + Tailwind + framer-motion landing page that does not match the code.
- **Decision:** Document the code as JavaScript, and treat `.txt` as an unused design prompt.
- **Justification:** Converting to TypeScript is a code change, which is outside documentation scope. The lint configuration has no type-aware rules.
- **Consequences:** No compile-time checks on Supabase row shapes. Column-name drift between the code and the database shows up only at runtime (R-07).

## ADR-003 — Supabase as the whole backend

- **Status:** Accepted
- **Context:** This matches the default stack. Supabase provides Auth, Postgres with RLS, RPC and Edge Functions.
- **Decision:** All persistence and authorization go through Supabase. The browser uses only the anon key.
- **Consequences:** Security depends on RLS policies and on the security-definer functions (see [security.md](security.md)).

## ADR-004 — Cloudflare R2 for media, uploaded through presigned URLs

- **Status:** Accepted
- **Context:** Media is large (video uploads of up to 100 MB on the homepage). Routing it through Supabase would add cost and latency.
- **Decision:** The `admin-upload-url` Edge Function checks `is_admin` and returns a presigned PUT or DELETE URL. The browser talks to R2 directly. Keys are sanitized by `safeFileName` so signing and upload match.
- **Consequences:** R2 credentials stay server-side (NFR-002). The Edge Function source is not in the repo (ADR-010).

## ADR-005 — Static hosting on Vercel with SPA rewrites

- **Status:** Superseded by ADR-016 (2026-10-19, the frontend is deployed as a Cloudflare Worker)
- **Decision:** `vercel.json` rewrites every path to `/index.html` and marks `/assets/*` immutable for one year.
- **Consequences:** Unknown paths return HTTP 200 and render `NotFound` client-side. Hashed asset names make the long cache safe.

## ADR-006 — Homepage stored as one JSONB document with optimistic locking

- **Status:** Accepted
- **Context:** Documented in [docs/homepage.md](../docs/homepage.md).
- **Decision:** A single `homepage_content` row holds `draft`, `published` and `revision`. `save_homepage` checks admin status and `expected_revision` atomically. `get_homepage` exposes only `published`.
- **Consequences:** Copy, ordering and media publish together. Concurrent editors get a clear "reload" error instead of silently overwriting each other. The document is capped at 256 KB (`pg_column_size`).

## ADR-007 — Client-side cart, server-side order creation

- **Status:** Accepted
- **Decision:** The cart lives in `localStorage` and does not require an account. Checkout requires a session and sends only IDs, sizes and quantities to `create-order`.
- **Consequences:** The price shown in the cart is whatever was cached when the item was added, so it can be stale. The authoritative total depends on the server recomputing prices (ASSUMPTION-007, R-03).

## ADR-008 — No AI features; Groq not adopted

- **Status:** Accepted
- **Context:** The default stack lists the Groq API for AI features. The code has no AI features and none are planned (owner confirmed, 2026-10-19).
- **Decision:** Do not add an AI provider. [ai/ai-features.md](../ai/ai-features.md) is marked Not Applicable.

## ADR-009 — Admin flag is loaded once in AppContext

- **Status:** Accepted (working tree, uncommitted at time of writing)
- **Context:** Before this change, `Login.jsx` and `AdminLayout.jsx` each queried `profiles.is_admin`, and nothing outside `/admin` knew whether the user was an administrator.
- **Decision:** `AppContext` fetches `is_admin` once per user ID and exposes `isAdmin` as `true`, `false`, or `null` while checking. The flag is tied to the user ID it was fetched for, so a stale value never carries over between sign-ins. `Login.jsx` still queries directly, because it navigates before the context updates.
- **Consequences:** Navigation and Account can show admin entry points. `AdminLayout` renders nothing while `isAdmin === null`, which avoids a "Not authorized" flash.

## ADR-010 — Most of the schema and both Edge Functions live outside the repository

- **Status:** Accepted (discrepancy); remediation is in PH-7
- **Context:** The frontend uses ten tables or views and two Edge Functions that have no definition in `supabase/`. Only `homepage_content` and its two functions are versioned.
- **Decision:** Document the schema as the code reads and writes it ([data-model.md](data-model.md)) and mark every column as inferred. Do not invent DDL.
- **Consequences:** A new environment cannot be built from the repository, and RLS cannot be reviewed (R-02, R-04). PH-7 imports the live schema with `supabase db pull` and the function sources.

## ADR-011 — Payment statuses exist without a payment integration

- **Status:** Accepted (discrepancy); remediation is in PH-4
- **Context:** `orders.status` uses `pending`, `paid`, `failed`, `cancelled` and `fulfilled`, and the dashboard counts revenue from `paid` and `fulfilled`. No payment provider, redirect or webhook exists. Admins change status by hand in `/admin/orders`.
- **Decision:** Document checkout as "order placement without online payment". Track payment as FR-011 (Planned).
- **Consequences:** Revenue figures reflect manual status changes, not verified payments (R-01). Choosing a payment provider needs an owner decision.

## ADR-012 — Node test runner with no `test` script

- **Status:** Accepted (discrepancy)
- **Context:** Unit tests use `node:test`. `package.json` has no `test` script. `docs/homepage.md` documents `node --test tests/homepage.test.js`. On Node 26, `node --test tests/` fails because the directory is resolved as a module, while `node --test tests/*.test.js` passes.
- **Decision:** All documentation uses `node --test tests/*.test.js`. Adding a `test` script is a code change, deferred to PH-8.

## ADR-013 — `.env.example` lists server variables and omits client variables

- **Status:** Accepted (discrepancy); remediation is in PH-7
- **Context:** `.env.example` lists the four `R2_*` variables, which `src/` never reads; presumably the Edge Function does. It omits `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_R2_PUBLIC_URL`, which the app needs in order to start, and the optional `VITE_AUTH_IMAGE_URL`.
- **Decision:** [operations/deployment.md](../operations/deployment.md) is the authoritative variable list until `.env.example` is corrected.

## ADR-014 — Global CSS and inline styles, no CSS framework

- **Status:** Accepted
- **Context:** Styling uses `src/index.css`, per-area CSS files and inline style objects, with CSS custom properties for tokens such as `--void-black`, `--bone-white` and `--cold-silver`. Tailwind is not installed, despite the `.txt` prompt.
- **Decision:** New UI reuses the existing tokens and class names.

## ADR-015 — Caste rooms use a catch-all top-level route

- **Status:** Accepted
- **Context:** `/:casteId` matches any single-segment path not claimed by an earlier route, and strips a `the-` prefix to find the caste ID.
- **Consequences:** A mistyped path such as `/stor` shows "Caste room not found in the Sanctum." instead of the generic 404 page. Because `replace('the-', '')` removes the first occurrence anywhere in the slug, a caste ID containing `the-` would not resolve (R-10).

## ADR-016 — Cloudflare Workers hosting with a Redis-cached read API

- **Status:** Accepted
- **Context:** The frontend is deployed by Cloudflare Workers Builds (`npm run build`, then `npx wrangler deploy`), not by Vercel as ADR-005 recorded, so `vercel.json` has no effect in production. A first version of this decision assumed Cloudflare Pages and a Pages Function; the deploy failed because, with no wrangler config, `wrangler deploy` tried to auto-configure the project and could not parse `vite.config.js`, and Workers do not serve a `functions/` folder (ASSUMPTION-023, retired). The owner asked for Redis caching of public reads, with admin edits visible immediately. Redis cannot be reached from the browser without exposing its token, and the repo had no server layer (ADR-001, ADR-003).
- **Decision:** `wrangler.jsonc` deploys `dist/` as static assets with single-page-application fallback, and runs the Worker `worker/index.js` only for `/api/*`. The Worker serves an allow-list of public catalog reads through `src/lib/public-api.js`. It reads Supabase with the anon key and caches responses in Upstash Redis under `catalog:<version>:<route>` for 10 minutes. Statement triggers on the catalog tables call Upstash through `pg_net` to increment `catalog:version`, using credentials from Supabase Vault. `public/_headers` replaces `vercel.json` for the `/assets/*` cache header. If `/api/*` is missing or failing, the browser reads Supabase directly, uncached, so the storefront never depends on the Worker being configured.
- **Justification:** Versioned keys make invalidation a single `INCR` with no race: a response read before an edit is written under the old version and never served again. Only anon-key reads are cached, so the cache cannot hold anything RLS hides from the public. Cloudflare KV was rejected because it propagates in up to about a minute, which fails the immediate-update requirement.
- **Consequences:** The repo now has a thin, read-only server layer. All writes and authorization still go through Supabase (ADR-003). `vercel.json` is unused but kept until the owner removes it. Cache invalidation depends on `pg_net`, the Vault secrets and Upstash being available; if any fails, entries expire within 10 minutes (R-20). `npm run dev` serves `/api/*` through Vite middleware with the same handler. The Worker name in `wrangler.jsonc` must match the dashboard, and its runtime variables must be kept across deploys (`keep_vars`, ASSUMPTION-024).

## ADR-017 — GSAP motion layer with a measured performance budget

- **Status:** Accepted (2026-10-28)
- **Context:** The owner asked for distinctive animation built with GSAP, on the condition that the site must not lag. Until then the runtime dependencies were only Supabase, React, React DOM and React Router (docs/repo-inventory.md), and the code-style rule says not to add a dependency when a few lines will do. NFR-003 also said motion was disabled for coarse-pointer users, but nothing in `src/` checked the pointer type any more: that sentence was already stale.
- **Decision:** Add `gsap` 3.15 as a runtime dependency, with its bundled ScrollTrigger and SplitText plugins (free under GSAP's standard license). Only `src/lib/motion.js` imports it, and only lazy page chunks import that module. Its `useMotion` hook runs each page's setup inside `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` and reverts everything on unmount. The effects are letter-by-letter page titles (`fogTitle`), a black veil lifting off image frames once (`veilReveal`), the home hero's parallax drift and the Sanctum's descent. The film grain is a still CSS texture. Motion runs on touch devices too; only the reduced-motion preference turns it off.
- **Justification:** Scrolling was measured on the production build before and after (2026-10-28), alternating builds on the development Mac. The first version cost up to 18 frames over 50 ms per `/store` scroll. Long-frame attribution traced this to rendering, not script: scaling photo layers from script, a resting filter on every store photo, a jittering full-screen grain, and loading second photos for cards that slid under a still cursor. Those were removed. Afterwards, no long frame contained script time from motion code. Warm `/store` scrolls had 2 and 9 frames over 50 ms, against 0 to 16 on the build without motion, and `/home` had none on either build. The entry chunk stayed at 468.85 kB, against 468.58 kB before; GSAP ships in a separate 47.7 kB (gzip) chunk. CSS-only scroll-driven animation was the alternative, but the owner asked for GSAP.
- **Consequences:** `src/lib/motion.js` records the rules a later edit must keep:
  - Move only `transform` and `opacity` on anything holding a photo.
  - Scale only flat-colour layers.
  - Never tween an element that has its own CSS transition on the same property.
  - Reveal once.
  - Attach scroll triggers to non-sticky elements.

  Breaking these rules is how lag returns (R-25), and TC-109 is the check. The measurement covers only the development Mac (ASSUMPTION-025). The largest remaining cause of scroll stalls is image weight, which motion does not affect (R-24).

## ADR-018 — Codex chapters 2 and 3 stay sealed; the unlock simulator is development-only

- **Status:** Accepted (2026-10-28)
- **Context:** FR-017 and ASSUMPTION-017 said visitors unlock chapters 2 and 3 through interaction. In the code, the only interaction that unlocked them was a fixed "Unlock Animation Simulator" panel, visible to every visitor of `/codex` in production. The UI/UX review of 2026-10-28 flagged it as debug UI. Asked how chapters should unlock, the owner chose to keep them sealed for now.
- **Decision:** The panel renders only when `import.meta.env.DEV` is true, so Vite removes it from production builds. Chapters 2 to 7 show "This chamber of the Codex remains sealed." The unlock animation and the `unlockChapter` state stay in the code for a future unlock rule.
- **Justification:** Hiding the panel only in development builds keeps the animation testable (TC-031) without exposing debug controls to visitors. Deleting the animation code would have to be undone once an unlock rule is chosen.
- **Consequences:** ASSUMPTION-017 is retired. FR-017 now describes sealed chapters in production. Choosing the visitor unlock rule is an open item in PH-5.
