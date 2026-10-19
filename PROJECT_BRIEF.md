# Gauddly — Project brief

## 1. Summary

| Item | Value |
| --- | --- |
| Project name | Gauddly (ASSUMPTION-001) |
| One-line description | A storefront and story world for a house of hand-dyed, made-to-order garments from Delhi. (ASSUMPTION-002) |
| Problem it solves | A small fashion label needs to sell made-to-order garments online while presenting them inside a narrative world (the Sanctum: castes, a Codex, films). It also needs to run catalog, content and orders without a developer for each change. (ASSUMPTION-004) |
| Target users | Customers shopping for premium garments, priced in INR and shipped within India (ASSUMPTION-003, ASSUMPTION-005). Store administrators who manage catalog, content and orders (ASSUMPTION-013). |
| Features already built | Inferred from code; see [docs/repo-inventory.md](docs/repo-inventory.md#8-implemented-vs-missing) |
| Planned, not built | Online payment collection (FR-011). Schema and Edge Functions under version control (NFR-005). CI and end-to-end tests (NFR-006). |
| Constraints | No deadline, budget or hackathon scope was given (ASSUMPTION-012). Hosting is already fixed: Cloudflare Pages, Supabase, Cloudflare R2 and Upstash Redis (ADR-016). |
| Tech stack | Vite 8, React 19 (JavaScript), React Router 7, Supabase, Cloudflare R2, Cloudflare Pages (with one Pages Function), Upstash Redis. This is the stack the repo already uses, and it is not proposed for replacement. See [ADR-001](architecture/architecture-decisions.md#adr-001--keep-vite--react-spa-instead-of-nextjs-app-router). |

## 2. Goals

1. Let customers browse the collection, choose a size and place an order for a made-to-order garment (PH-3, PH-4).
2. Present the brand world (entry sequence, editorial homepage, Codex, films) as part of the shopping journey (PH-1, PH-5).
3. Let administrators manage products, castes, films, homepage content and orders through a browser studio (PH-6).
4. Make the backend reproducible and verifiable from the repository alone (PH-7, PH-8).

## 3. Non-goals

- Server-side rendering. The site is a client-rendered SPA. See [ADR-001](architecture/architecture-decisions.md#adr-001--keep-vite--react-spa-instead-of-nextjs-app-router).
- AI features. None exist or are planned; see [ai/ai-features.md](ai/ai-features.md).
- Multi-currency or international shipping (ASSUMPTION-005).
- Granular admin roles beyond a single `is_admin` flag (ASSUMPTION-013).

## 4. Users and roles

| Role | How identified | Can do |
| --- | --- | --- |
| Visitor | No session | Browse all public pages, use the cart, join the waitlist |
| Customer | Supabase Auth session | Everything a visitor can, plus check out, edit their profile and view their order history |
| Administrator | Session plus `profiles.is_admin = true` | Everything a customer can, plus the `/admin` studio |

## 5. Documentation map and reading order

The documents were generated in this order. Read them in the same order.

1. [docs/repo-inventory.md](docs/repo-inventory.md) — what exists
2. [PROJECT_BRIEF.md](PROJECT_BRIEF.md) — this file
3. [product/requirements.md](product/requirements.md) — FR and NFR IDs
4. [product/features.md](product/features.md) — FEAT IDs
5. [product/user-stories.md](product/user-stories.md) — US and AC IDs
6. [architecture/system-overview.md](architecture/system-overview.md)
7. [architecture/architecture-decisions.md](architecture/architecture-decisions.md) — ADRs
8. [architecture/data-model.md](architecture/data-model.md)
9. [architecture/api-contracts.md](architecture/api-contracts.md)
10. [architecture/security.md](architecture/security.md)
11. [architecture/frontend.md](architecture/frontend.md)
12. [ai/ai-features.md](ai/ai-features.md) — Not Applicable
13. [testing/test-strategy.md](testing/test-strategy.md) — includes the test case format
14. [testing/test-cases.md](testing/test-cases.md) — TC IDs
15. [implementation/phase-plan.md](implementation/phase-plan.md) — PH IDs
16. [implementation/phase-test-matrix.md](implementation/phase-test-matrix.md)
17. [product/traceability-matrix.md](product/traceability-matrix.md)
18. [project-management/risk-register.md](project-management/risk-register.md)
19. [operations/deployment.md](operations/deployment.md)
20. [README.md](README.md)
21. [diagrams/](diagrams/README.md) — Mermaid diagrams
22. [implementation/documentation-audit.md](implementation/documentation-audit.md)

Existing topic guides stay authoritative for their areas: [docs/authentication.md](docs/authentication.md) and [docs/homepage.md](docs/homepage.md).

## 6. ID conventions

| Prefix | Meaning | Defined in |
| --- | --- | --- |
| `FR-###` | Functional requirement | product/requirements.md |
| `NFR-###` | Non-functional requirement | product/requirements.md |
| `FEAT-##` | Feature | product/features.md |
| `US-###` | User story | product/user-stories.md |
| `AC-###.#` | Acceptance criterion (story number, criterion number) | product/user-stories.md |
| `TC-###` | Test case | testing/test-cases.md |
| `PH-#` | Implementation phase | implementation/phase-plan.md |
| `ADR-###` | Architecture decision | architecture/architecture-decisions.md |
| `R-##` | Risk | project-management/risk-register.md |
| `ASSUMPTION-###` | Assumption | this file, section 7 |

## 7. Assumptions

Every assumption the documentation relies on is listed here. An assumption stays in force until the owner confirms or replaces it. Then the dependent documents must be updated.

| ID | Assumption | Basis | Affects |
| --- | --- | --- | --- |
| ASSUMPTION-001 | The project name is "Gauddly". | `package.json` name, page titles, logo | All docs |
| ASSUMPTION-002 | The one-line description is "a storefront and story world for a house of hand-dyed, made-to-order garments from Delhi". | `index.html` meta description, manifesto copy in `src/lib/homepage.js` | README, brief |
| ASSUMPTION-003 | Customers are shoppers for premium garments, primarily in India. | INR formatting, "city, state, pin" fields, "Founded in Delhi" copy | Requirements, NFRs |
| ASSUMPTION-004 | The problem statement is selling made-to-order garments inside a narrative brand world, with self-service content management. | Route structure (Codex, Episodes, Sanctum), admin studio | Brief, features |
| ASSUMPTION-005 | Prices are INR only and shipping is domestic only. | `Intl.NumberFormat('en-IN', { currency: 'INR' })` everywhere; no currency or country field | FR-005, FR-010 |
| ASSUMPTION-006 | No payment provider has been chosen. Online payment is planned but not built. | Order statuses include `paid` and `failed`, but no payment SDK, redirect or webhook exists | FR-011, PH-4, R-01 |
| ASSUMPTION-007 | The `create-order` Edge Function recomputes prices and validates stock server-side, and creates orders in `pending` status. | The client sends only product id, size and quantity, not prices. The function source is not in the repo. | FR-010, R-03 |
| ASSUMPTION-008 | The live Supabase project has RLS policies that let customers read only their own `orders` and `profiles`, give the public read access to published catalog rows, and give writes to admins only. | The client queries `orders` without a user filter, and `products` admin writes rely on the database rejecting non-admins. Policies are not in the repo. | NFR-002, R-02 |
| ASSUMPTION-009 | `top_products` is a view aggregating `order_items` of paid and fulfilled orders, with columns `product_id, product_name, sku, units_sold, revenue`. | Columns read in `AdminDashboard.jsx` | FR-022 |
| ASSUMPTION-010 | Expected workload is boutique scale: a catalog of at most a few hundred products and low concurrent admin usage. No measured traffic figures exist. | Store filters, sorts and paginates the full product list in the browser; there is a single homepage document | NFR-004, R-08 |
| ASSUMPTION-011 | Supabase Auth email (SMTP) and redirect URLs are configured for each deployment. | `docs/authentication.md` | FR-012, FR-014 |
| ASSUMPTION-012 | There is no fixed deadline, budget cap or hackathon scope. | No constraint was supplied | Phase plan |
| ASSUMPTION-013 | A single administrator role (`profiles.is_admin`) is sufficient. | Only `is_admin` is checked anywhere | FR-021, NFR-002 |
| ASSUMPTION-014 | The documentation layout (folders and files) is inferred, because the master spec `prompts/project-generator.md` does not exist in the repository. | File search found no spec | All docs, audit |
| ASSUMPTION-015 | The eight-phase model PH-1 to PH-8 is inferred from the code's natural layers, not taken from the missing spec. | Same as ASSUMPTION-014 | Phase plan, matrix |
| ASSUMPTION-016 | The test case format in [testing/test-strategy.md](testing/test-strategy.md#4-test-case-format) stands in for the missing spec's section 17 format. | Same as ASSUMPTION-014 | Test cases |
| ASSUMPTION-017 | Codex chapters 2 and 3 are meant to be unlockable by any visitor through interaction. Chapters 4 to 7 stay sealed until a future release. Unlock state is per-browser and not security-sensitive. | `Codex.jsx` wires unlock handlers only for chapters 2 and 3; state lives in `localStorage` | FR-017 |
| ASSUMPTION-018 | The production domain is gauddly.com. | `<title>GAUDDLY.COM</title>`, `contact@gauddly.com` in checkout | Deployment, auth redirects |
| ASSUMPTION-019 | Node.js 20 or newer is used for local tests. The baseline was recorded on Node 26.5.0. | `node:test`, `structuredClone` | NFR-006, TC-056 |
| ASSUMPTION-020 | Admins who sign in from a non-admin page (for example `/checkout`) should still land on `/admin`. Only an explicit `/admin…` redirect is preserved. | Behaviour of the working-tree change; owner confirmation is pending | FR-016, TC-028 |
| ASSUMPTION-021 | Supabase's API gateway puts the real client IP first in `x-forwarded-for`, so the waitlist limit is per visitor. | Not verified; the global 200-per-hour cap is the backstop | NFR-007, TC-078, R-19 |
| ASSUMPTION-022 | The Supabase Auth rate limits are set in the dashboard to the values in operations/deployment.md. | The settings live outside the repo and cannot be read from it | NFR-007, TC-082 |
| ASSUMPTION-023 | The frontend is deployed by Cloudflare Pages' Git integration, which builds with `vite build`, serves `dist/` and exposes the project's environment variables to Pages Functions at runtime. | Owner states the frontend is on Cloudflare; no `wrangler` config in the repo | NFR-008, ADR-016 |
