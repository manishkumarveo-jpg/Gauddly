# Security model

## Trust boundaries

| Boundary | Trusted side | Enforcement |
| --- | --- | --- |
| Browser → Supabase | Postgres RLS and security-definer functions | Anon key only in the browser. RLS policies decide every row (ASSUMPTION-008). |
| Browser → Edge Functions | Function code | JWT verification. `admin-upload-url` must check `is_admin`. |
| Browser → R2 | Presigned URL scope | URLs are signed per key and method by the Edge Function. |
| UI admin checks | **Not** a security boundary | `AdminLayout` and the `isAdmin` flag only decide what is displayed. |

## Controls verified in the repository

| Control | Where | Test |
| --- | --- | --- |
| Homepage drafts readable only by admins | RLS policy in the homepage migration | TC-045 |
| Homepage saves need admin status and the current revision | `save_homepage` | TC-045 |
| `search_path = ''` on security-definer functions | Homepage migration | Review |
| Redirect targets limited to same-origin internal paths | `safeInternalPath` | TC-024 |
| Unsafe protocols rejected in homepage media and links | `assetKey`, `homeLink` | TC-006 |
| Search input stripped of `,` and `%` before `or()` filter | `AdminOrders.jsx` | TC-043 |
| No R2 secrets referenced from `src/` | Code search | TC-049 |
| Auth pages and admin routes are `noindex` | `RouteSeo` | TC-048 |

## Controls that cannot be verified from the repository

| Control | Why it matters | Risk |
| --- | --- | --- |
| RLS on `orders` / `order_items` restricts customers to their own rows | `Account.jsx` selects orders without a user filter. An admin may see every order there (R-15). | R-02, R-15 |
| Writes to catalog tables (`products`, `castes`, `episodes`, `product_*`) limited to admins | Admin screens write directly from the browser | R-02 |
| `orders.status` updatable only by admins | Otherwise a customer could mark their own order `paid` | R-02 |
| `profiles.is_admin` not updatable by its owner | `Account.jsx` updates `profiles`. A permissive update policy would allow self-promotion to admin. | R-02 |
| `create-order` recomputes prices server-side | The cart price is client-controlled | R-03 |
| `admin-upload-url` checks `is_admin` and restricts key prefixes | Otherwise anyone could write to the bucket | R-04 |

These checks are the first task of PH-7 ([phase-plan.md](../implementation/phase-plan.md#ph-7--data-layer-reproducibility-and-security-hardening)).

## Secrets handling

- Browser-safe values (`VITE_*`) are public by design.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET_NAME` belong only in Supabase Edge Function secrets. They must never get a `VITE_` prefix.
- The Supabase service-role key must never appear in this repository or in Vercel client environment variables.
- `.env`, `.env.local` and every `*.local` file are git-ignored.

## Client-side data

The cart, preferences and Codex progress live in `localStorage`. None of them grants access to anything. The Supabase session is managed by `supabase-js`. The request cache is memory-only and never stores customer data (comment in `request-cache.js`).
