# Risk register

Severity = impact × likelihood, each on a 1–3 scale: 9 Critical, 6 High, 3–4 Medium, 1–2 Low. Risks are ranked by severity. Bugs and inconsistencies found in the code are logged here and in [implementation/documentation-audit.md](../implementation/documentation-audit.md). None were fixed, because this was documentation-only work.

| ID | Risk | Impact | Likelihood | Severity | Evidence | Mitigation | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-02 | RLS policies for orders, profiles and catalog tables are not in the repo and cannot be reviewed. A permissive policy would let customers read other customers' orders, mark their own order `paid`, edit the catalog, or set their own `profiles.is_admin = true`. | 3 | 3 | **9 Critical** | `Account.jsx` selects `orders` with no user filter and updates `profiles`; admin screens write tables directly; no migrations for these tables | Pull and review the policies; add SQL permission tests (TC-050) | PH-7 |
| R-01 | No payment integration, but orders use `paid` and `failed` statuses and the dashboard reports "Paid revenue". Garments could be made for unpaid orders, and revenue figures depend on manual status edits. | 3 | 3 | **9 Critical** | No payment SDK, redirect or webhook; `AdminOrders.jsx` sets any status | Implement FR-011 with webhook-only `paid` transitions (TC-021) | PH-4 |
| R-03 | Order totals may be trusted from the client. The cart stores prices in `localStorage`, and whether `create-order` recomputes them is unverifiable. | 3 | 2 | **6 High** | `Checkout.jsx` total computed client-side; function source missing (ASSUMPTION-007) | Commit and review the `create-order` source; add a server-side price test | PH-7 |
| R-04 | The `admin-upload-url` source is missing. If it does not check `is_admin` or restrict key prefixes, anyone with an account could write to or delete from the R2 bucket. | 3 | 2 | **6 High** | `uploadToR2.js` comment says it checks `is_admin` server-side; source not in repo | Commit the source; verify with TC-047 | PH-7 |
| R-12 | Fulfilment data gap: checkout sends a shipping address, but the admin order view never shows one. It shows `phone`, which checkout never collects. | 3 | 2 | **6 High** | `Checkout.jsx` form fields vs `AdminOrders.jsx` select list | Confirm where the address is stored; show it in admin (code change) | PH-6 |
| R-15 | An administrator's `/account` page may list every customer's orders as "Order History" if admin RLS grants select on all orders, because the query has no user filter. | 2 | 3 | **6 High** | `Account.jsx` orders query; admins read all orders in `AdminOrders.jsx` | Filter by the current user ID in code (a code change, needs approval) | PH-7 |
| R-11 | Product images uploaded in admin all get `sort_order: 0` and `alt` equal to the product ID, so gallery order is ambiguous and alt text is not descriptive. | 2 | 3 | **6 High** | `AdminProducts.jsx` upload handler; [design plan](../docs/design/dust-robe/design-plan.md) | Add ordering and alt editing in admin (code change) | PH-6 |
| R-05 | No CI and no `test` script, so regressions merge unnoticed. `node --test tests/` fails on Node 26. | 2 | 3 | **6 High** | No `.github/`; `package.json` scripts; ADR-012 | PH-8 tasks 1–2 (TC-057) | PH-8 |
| R-06 | `.env.example` omits the variables the app needs to start (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_R2_PUBLIC_URL`), slowing onboarding and risking misconfigured deployments. | 2 | 3 | **6 High** | ADR-013 | Use [operations/deployment.md](../operations/deployment.md); fix the file in PH-7 | PH-7 |
| R-14 | Silent failures: the account "Save" shows "Saved ✓" even if the update fails, and admin order status changes, size toggles and caste hero updates ignore errors. | 2 | 2 | **4 Medium** | `Account.jsx` `handleSave`; `AdminOrders.jsx` `updateStatus`; `AdminProducts.jsx` `toggleSizeStock`; `AdminCastes.jsx` `handleUpload` | Check `error` and surface it (code change) | PH-8 |
| R-16 | The admin-redirect feature exists only as uncommitted changes in five files and could be lost or shipped unreviewed. | 2 | 2 | **4 Medium** | `git status` at documentation time | Review and commit separately from the docs | PH-2 |
| R-07 | No type checking, so column-name drift between the code and the database fails only at runtime. | 2 | 2 | **4 Medium** | ADR-002 | Generate Supabase types once the schema is versioned; adopt JSDoc or TypeScript later | PH-8 |
| R-09 | Client-side meta tags are not seen by crawlers or link-preview bots that do not run JavaScript, which weakens SEO and social previews. | 2 | 2 | **4 Medium** | ADR-001; `Seo.jsx` | Prerender key routes, or add an edge middleware for meta tags, if SEO matters | PH-8 |
| R-17 | Customer-facing copy conflicts: product text says "Delivered in 14–21 days" while checkout says "Expected dispatch: 14–21 days", and product craft text contradicts the returns page exceptions. | 2 | 2 | **4 Medium** | [design plan evidence](../docs/design/dust-robe/design-plan.md#evidence-and-limitations); `Checkout.jsx` | The owner approves one source of truth | — |
| R-13 | Inconsistent UX and accessibility: caste deletion uses `window.alert`, the homepage editor uses `window.confirm`, signup inputs lack labels, and the signup error lacks `role="alert"`. | 1 | 3 | **3 Medium** | `AdminCastes.jsx`, `AdminHomepage.jsx`, `Signup.jsx` | Use `useConfirm` / `useToast` and labelled fields (code change) | PH-8 |
| R-08 | The store loads and filters every published product in the browser. This becomes slow if the catalog grows well past boutique scale. | 2 | 1 | **2 Low** | `Store.jsx`; ASSUMPTION-010 | Move filtering to the query if the catalog grows | — |
| R-10 | The catch-all `/:casteId` route turns mistyped URLs into "Caste room not found". A caste ID containing `the-` would never resolve. | 1 | 2 | **2 Low** | ADR-015 | Replace only a leading `the-` and render `NotFound` when no caste matches (code change) | PH-3 |
| R-18 | The stray root `.txt` describes a different stack (TypeScript, Tailwind, framer-motion) and could mislead contributors or AI agents. | 1 | 2 | **2 Low** | `.txt` | Delete or move it into `docs/design/` (owner decision) | PH-8 |

## Top five by severity

1. **R-02** — Unverifiable RLS on orders, profiles and catalog (Critical)
2. **R-01** — No payment integration behind "paid" orders and revenue (Critical)
3. **R-03** — Possible client-trusted order totals (High)
4. **R-04** — Unverifiable admin upload authorization (High)
5. **R-12** — Shipping address not visible for fulfilment (High)

Tie-break among the 6-severity risks: direct financial or security exposure ranks above operational friction.
