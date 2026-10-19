# Requirements

Each requirement describes behaviour the code implements today, unless its status says otherwise. Status values:
- **Built**: implemented and verifiable in the working tree.
- **Partial**: some of the behaviour exists.
- **Planned**: not built.

Traceability to features, stories, tests and phases is in [traceability-matrix.md](traceability-matrix.md).

## Functional requirements

| ID | Requirement | Feature | Status | Source of truth |
|---|---|---|---|---|
| FR-001 | A first-time visitor to `/` sees the entry sequence. Entering or skipping records an entry timestamp in `localStorage` and opens `/home`. A visitor who entered within the last 30 days is redirected from `/` to `/home`. | FEAT-01 | Built | `src/pages/Landing.jsx`, `src/context/AppContext.jsx` |
| FR-002 | The visitor can toggle an ambient sound drone on the entry sequence. The preference persists across visits. | FEAT-01 | Built | `Landing.jsx`, `gauddly_sound_enabled` key |
| FR-003 | `/home` renders the published homepage document from `get_homepage()`. Without one, it renders nine default sections. Saved sections are normalized: unknown and duplicate sections are dropped, missing defaults are appended, unsafe media keys and links are rejected, and focal points are clamped to 0–100. | FEAT-02 | Built | `src/lib/homepage.js`, `src/pages/Home.jsx` |
| FR-004 | If any homepage catalog query fails, the homepage shows an alert with a "Try again" action. Failed results are not cached. | FEAT-02 | Built | `Home.jsx`, `src/lib/request-cache.js` |
| FR-005 | `/store` lists published products. They can be filtered by caste and by in-stock size, and sorted by featured order, price ascending, price descending or name. The list is paginated, and changing a filter returns to page 1. | FEAT-03 | Built | `src/pages/Store.jsx` |
| FR-006 | A caste room at `/:casteId` (an optional `the-` prefix is stripped) shows the caste's hero image, passage and published products. An unknown caste shows "Caste room not found in the Sanctum." | FEAT-03 | Built | `src/pages/CastePage.jsx` |
| FR-007 | A product detail page lists sizes in garment order. Claiming without an in-stock size selected shows "Choose your size to continue." and focuses the size selector. A valid claim adds the item to the cart and opens the cart drawer. A product with no sizes in stock shows "Currently unavailable". | FEAT-03 | Built | `src/pages/PieceDetail.jsx` |
| FR-008 | `/old-world` lists the archive (`caste_id = 'old-world'`) and links each piece to `/the-old-world/:pieceId`. | FEAT-03 | Built | `src/pages/Archive.jsx` |
| FR-009 | The cart persists in `localStorage`. Adding the same product and size increments its quantity; a different size adds a new line. Items can be removed. The cart drawer closes on Escape, traps focus while open and restores focus on close. | FEAT-04 | Built | `AppContext.jsx`, `src/components/CartDrawer.jsx` |
| FR-010 | Checkout requires a session. It sends product id, size and quantity, plus shipping fields, to the `create-order` Edge Function. Success shows a claim number and clears the cart. Failure shows the server's error message and keeps the cart. | FEAT-04 | Built (client); server not in repo | `src/pages/Checkout.jsx` |
| FR-011 | An order moves to `paid` only after the payment provider confirms payment, and a failed payment moves it to `failed`. | FEAT-04 | Planned (ASSUMPTION-006) | None |
| FR-012 | A visitor can create an account with full name, email and a password of at least 6 characters. If Supabase returns a session, the visitor goes to the safe redirect target. Otherwise they are told to confirm their email. | FEAT-05 | Built | `src/pages/Signup.jsx` |
| FR-013 | A user can sign in with email and password. Invalid credentials show "The email or password is incorrect. Please try again." Redirect targets are restricted to same-origin internal paths, with `/home` as the fallback. | FEAT-05 | Built | `src/pages/Login.jsx`, `src/lib/navigation.js` |
| FR-014 | A user can request a password-reset email and set a new password from the emailed link. An invalid or expired link offers a new request. | FEAT-05 | Built | `ForgotPassword.jsx`, `ResetPassword.jsx`, [docs/authentication.md](../docs/authentication.md) |
| FR-015 | A signed-in customer can edit their full name and default address, view their order history newest first, and sign out. Signed-out access to `/account` redirects to sign-in. | FEAT-05 | Built | `src/pages/Account.jsx` |
| FR-016 | An administrator who signs in lands on `/admin`, unless the sign-in was requested by an `/admin…` page, in which case they return to that page. Signed-in administrators see an "Admin" link in the site navigation (desktop and mobile) and an "Admin dashboard →" link on `/account`. | FEAT-05 | Built (working tree) | `Login.jsx`, `Navigation.jsx`, `Account.jsx` |
| FR-017 | The Codex shows seven chapters. Chapter 1 is unlocked by default. Chapters 2 and 3 unlock through interaction, with an unlock animation, and stay unlocked in that browser. | FEAT-06 | Built | `src/pages/Codex.jsx` |
| FR-018 | `/episodes` lists episodes. Released episodes with a video open an in-page player with play/pause and mute controls. Other episodes do not open a player. | FEAT-06 | Built | `src/pages/Episodes.jsx` |
| FR-019 | Visitors can join the waitlist from `/await` or the homepage waitlist section. Emails are trimmed and lowercased, and a duplicate email counts as success. `/await` returns to `/home` 3 seconds after success. | FEAT-06 | Built | `src/pages/Await.jsx`, `src/components/HomeExperience.jsx` |
| FR-020 | `/shipping`, `/returns`, `/privacy`, `/terms` and `/size-care` each render their own customer-care content. | FEAT-06 | Built | `src/pages/InfoPage.jsx` |
| FR-021 | Every `/admin` route needs a session and `profiles.is_admin = true`. Signed-out users are sent to sign-in with the current path as the redirect. Signed-in non-admins see "Not authorized." Nothing renders while the check is pending. | FEAT-07 | Built | `src/pages/admin/AdminLayout.jsx` |
| FR-022 | The dashboard shows paid revenue, order count and average order value over a 7-, 30- or 90-day range (paid means `paid` or `fulfilled`). It also shows a revenue chart, recent orders, a count of paid orders awaiting dispatch, and top products with CSV export. | FEAT-07 | Built | `AdminDashboard.jsx` |
| FR-023 | Admins can create, edit and delete products. A new product gets sizes S, M, L and XL in stock. Admins can toggle stock per size, upload and remove product images and video in R2, and publish or unpublish. Only published products appear on the storefront. | FEAT-07 | Built | `AdminProducts.jsx` |
| FR-024 | Admins can create, edit and delete castes and upload a hero image. Deleting a caste that still has products is refused with a message. | FEAT-07 | Built | `AdminCastes.jsx` |
| FR-025 | Admins can create, edit and delete episodes (default status `awaiting`), change release status after confirmation, and upload or clear still and video media, with upload progress shown. | FEAT-07 | Built | `AdminEpisodes.jsx` |
| FR-026 | Admins can list orders 10 per page, filter by status (`pending`, `paid`, `failed`, `cancelled`, `fulfilled`), search with a debounced input, and change an order's status after confirmation. | FEAT-07 | Built | `AdminOrders.jsx` |
| FR-027 | Admins can edit the homepage as a draft, preview it, and publish it atomically. Saves carry the expected revision, and a stale revision is rejected. Visitors see only published content. | FEAT-07 | Built | `AdminHomepage.jsx`, `supabase/migrations/202610150001_homepage.sql`, [docs/homepage.md](../docs/homepage.md) |
| FR-028 | Admin media uploads and deletes go directly to R2 through presigned URLs issued by the `admin-upload-url` Edge Function. Object keys are sanitized to `[a-zA-Z0-9._-]` characters. | FEAT-07 | Built (client); function not in repo | `src/pages/admin/uploadToR2.js` |

## Non-functional requirements

| ID | Requirement | Feature | Status | Source of truth |
|---|---|---|---|---|
| NFR-001 | Every route sets its title as `<Page> — GAUDDLY`, along with description, Open Graph and canonical tags. `/login`, `/forgot-password`, `/reset-password` and all `/admin` routes are `noindex, nofollow`. | FEAT-08 | Built | `src/components/RouteSeo.jsx`, `Seo.jsx` |
| NFR-002 | No server secret (R2 keys, Supabase service role) appears in frontend code or the built bundle. Authorization is enforced in the database or Edge Functions, never only in the UI. Redirects accept internal paths only. | FEAT-08 | Partial: client is compliant, but RLS for most tables is unverifiable from the repo | [architecture/security.md](../architecture/security.md) |
| NFR-003 | Interactive elements are keyboard reachable. The mobile menu and cart drawer close on Escape, and the cart traps and restores focus. Form fields have labels. The custom cursor and motion effects are disabled for reduced-motion and coarse-pointer users. | FEAT-08 | Built | `Navigation.jsx`, `CartDrawer.jsx`, `App.jsx` |
| NFR-004 | Routes are code-split. Hashed assets are served with a one-year immutable cache. Public homepage requests are coalesced and cached in memory for 30 seconds, and failures are never cached. No numeric page-load target is set (ASSUMPTION-010). | FEAT-08 | Built | `App.jsx`, `vercel.json`, `request-cache.js` |
| NFR-005 | The full database schema, RLS policies, views and Edge Function source are in version control, so a new environment can be built from the repository. | FEAT-08 | Partial: homepage objects only | `supabase/` |
| NFR-006 | Lint, unit tests and production build pass before merge, and CI enforces this on every push and pull request. | FEAT-08 | Partial: local commands pass; no CI and no `test` script | `package.json` |
