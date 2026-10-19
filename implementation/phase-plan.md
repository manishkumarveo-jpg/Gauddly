# Phase plan

The phase model is inferred from the code's layers (ASSUMPTION-015). The greenfield phases 1 to 8 map onto what already exists:
- A **Complete** phase is not rebuilt. Its work is to run the verification tests listed in [phase-test-matrix.md](phase-test-matrix.md).
- A **Partial** phase lists only the remaining work.

| Phase | Name | Requirements | Status |
| --- | --- | --- | --- |
| PH-1 | Foundation and design system | FR-001, FR-002, NFR-001, NFR-003, NFR-004 | Complete |
| PH-2 | Accounts and authentication | FR-012, FR-013, FR-014, FR-015, FR-016 | Complete (FR-016 in the working tree, uncommitted) |
| PH-3 | Catalog and storefront | FR-005, FR-006, FR-007, FR-008 | Complete |
| PH-4 | Cart, checkout and payments | FR-009, FR-010, FR-011 | Partial |
| PH-5 | Story and engagement content | FR-003, FR-004, FR-017, FR-018, FR-019, FR-020 | Complete |
| PH-6 | Admin studio | FR-021 to FR-035 | Complete |
| PH-7 | Data layer reproducibility and security hardening | NFR-002, NFR-005, NFR-007 | Partial |
| PH-8 | Quality gates, CI and launch readiness | NFR-006, NFR-008 | Partial |

Dependency order for the remaining work: **PH-7 → PH-4 (payments) → PH-8**. Payments must not go live before order and status RLS has been verified (R-01, R-02).

---

## PH-1 — Foundation and design system

**Status: Complete.** Built: the Vite/React shell, lazy routes, design tokens and global CSS, navigation, footer, page transitions, custom cursor and rain effects, the entry sequence, per-route SEO and the Vercel config.

**Verification work:** run TC-001, TC-002, TC-003, TC-048, TC-051, TC-052, TC-053 and TC-054.

## PH-2 — Accounts and authentication

**Status: Complete.** Built: signup, sign-in with safe redirects, password recovery, the account page, and admin redirect and entry points (working tree).

**Verification work:** run TC-022 to TC-030.

**Open item:** commit the working-tree admin-redirect change once the owner has reviewed it (R-16). The owner should confirm ASSUMPTION-020.

## PH-3 — Catalog and storefront

**Status: Complete.** Built: the store grid with filters, sort and pagination; caste rooms; product detail; the archive.

**Verification work:** run TC-010 to TC-016.

## PH-4 — Cart, checkout and payments

**Status: Partial.** Built: the persistent cart, accessible drawer, session-gated checkout and `create-order` invocation. Not built: online payment (FR-011).

**Remaining work:**
1. The owner chooses a payment provider. This is a decision, recorded as a new ADR.
2. Create the payment intent or order server-side in an Edge Function from the server-computed total (depends on ASSUMPTION-007 being confirmed in PH-7).
3. Add a provider webhook Edge Function that verifies the signature and is the only path that sets `paid` or `failed`.
4. Change checkout to hand off to the provider and show the result.
5. Restrict manual admin status changes to `cancelled` and `fulfilled`, or record an override reason.

**Exit criteria:** TC-017 to TC-020 pass, and TC-021 passes in the provider's sandbox.

## PH-5 — Story and engagement content

**Status: Complete.** Built: the editorial homepage, Codex, Episodes, Sanctum, waitlist and info pages.

**Verification work:** run TC-004 to TC-009 and TC-031 to TC-034. TC-004 to TC-008 are automated and passing.

## PH-6 — Admin studio

**Status: Complete.** Built: the admin guard, dashboard, products, castes, episodes, orders, homepage editor and R2 uploads.

**Verification work:** run TC-035 to TC-047 and TC-058 to TC-077. TC-045 needs a database URL.

## PH-7 — Data layer reproducibility and security hardening

**Status: Partial.** Built: the homepage migration and its SQL permissions test. In the working tree: the rate-limit migration (NFR-007) and `tests/rate-limits-permissions.sql`, not yet applied.

**Remaining work:**
1. Run `supabase db pull` against the live project. Commit the resulting migrations for every table, view, policy and trigger in [data-model.md](../architecture/data-model.md).
2. Commit the `create-order` and `admin-upload-url` sources under `supabase/functions/`.
3. Review the RLS policies against [security.md](../architecture/security.md#controls-that-cannot-be-verified-from-the-repository). Specifically: per-customer `orders` reads, admin-only catalog writes, admin-only `orders.status`, and a non-self-editable `profiles.is_admin`.
4. Extend `tests/` with SQL permission scripts for those policies, following the `homepage-permissions.sql` pattern.
5. Complete `.env.example` with the `VITE_*` variables (ADR-013).
6. Confirm or correct ASSUMPTION-007, ASSUMPTION-008 and ASSUMPTION-009.
7. Apply migration `202610190001_rate_limits_and_catalog_cache.sql`, run `tests/rate-limits-permissions.sql`, and set the Supabase Auth rate limits (TC-078 to TC-082).
8. Confirm which request header carries the real client IP on Supabase's gateway (ASSUMPTION-021, R-19).

**Exit criteria:** TC-049, TC-050, TC-055 and TC-078 to TC-082 pass.

## PH-8 — Quality gates, CI and launch readiness

**Status: Partial.** Built: oxlint, 23 unit tests, a passing build. In the working tree: the Redis catalog cache behind `/api/*` (NFR-008).

**Remaining work:**
1. Add `"test": "node --test tests/*.test.js"` to `package.json` (ADR-012, R-05).
2. Add a CI workflow running `npm ci`, lint, test and build on push and pull request.
3. Add a unit test for `safeInternalPath` (covers TC-024's logic).
4. Pick an end-to-end tool and automate the P1 manual cases.
5. Remove or relocate the stray `.txt` design prompt (R-18).
6. Add client error monitoring (provider to be decided by the owner).
7. Create the Upstash Redis database, store its URL and token in Supabase Vault and in Cloudflare Pages, and run TC-085 ([operations/deployment.md](../operations/deployment.md#catalog-cache-upstash-redis)).

**Exit criteria:** TC-056, TC-057 and TC-083 to TC-087 pass.
