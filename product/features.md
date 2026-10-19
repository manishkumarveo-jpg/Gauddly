# Features

Features group requirements into the product's real surface areas. Status is derived from the requirements each feature contains.

| ID | Feature | Requirements | Phase | Status |
|---|---|---|---|---|
| FEAT-01 | Entry sequence | FR-001, FR-002 | PH-1 | Built |
| FEAT-02 | Editorial homepage | FR-003, FR-004 | PH-5 | Built |
| FEAT-03 | Catalog and storefront | FR-005, FR-006, FR-007, FR-008 | PH-3 | Built |
| FEAT-04 | Cart, checkout and payments | FR-009, FR-010, FR-011 | PH-4 | Partial (payments planned) |
| FEAT-05 | Accounts and authentication | FR-012, FR-013, FR-014, FR-015, FR-016 | PH-2 | Built |
| FEAT-06 | Story and engagement content | FR-017, FR-018, FR-019, FR-020 | PH-5 | Built |
| FEAT-07 | Admin studio | FR-021 to FR-028 | PH-6 | Built |
| FEAT-08 | Platform quality | NFR-001 to NFR-006 | PH-1, PH-7, PH-8 | Partial |

## FEAT-01 — Entry sequence

A cinematic first-visit gate at `/`, with a falling-silver background video and an optional Web Audio drone. Entering or skipping stores `gauddly_entered_at`, and for 30 days afterwards `/` goes straight to `/home`. Header and footer are hidden on this route.

## FEAT-02 — Editorial homepage

`/home` is built from nine section types: hero, manifesto, featured, castes, craft, film, quote, archive and waitlist. Each is configured by the published `homepage_content` document. Product cards, caste cards and the featured film come from the live catalog. Defaults keep the page complete before the first publication. Editing is part of FEAT-07 (FR-027).

## FEAT-03 — Catalog and storefront

There are four ways to browse: the full store grid, caste rooms, the Old World archive, and product detail pages. Product media resolves through `mediaUrl()`, so rows can point at `/public` assets, absolute URLs or R2 keys.

## FEAT-04 — Cart, checkout and payments

The cart is client-side. Checkout is gated on a session and creates the order through the `create-order` Edge Function. Online payment is not implemented: orders have payment-related statuses that admins set by hand (ASSUMPTION-006).

## FEAT-05 — Accounts and authentication

Supabase email/password auth covers signup, sign-in, password recovery and account self-service. Administrators are routed to the studio and get studio entry points across the site.

## FEAT-06 — Story and engagement content

The Codex chapters, the Episodes film library, the Sanctum brand page, waitlist capture and customer-care pages.

## FEAT-07 — Admin studio

A separate layout at `/admin`, with sidebar sections for Overview, Commerce and Content. It covers the metrics dashboard, product, caste, episode and order management, the homepage editor and direct-to-R2 media uploads.

## FEAT-08 — Platform quality

The cross-cutting concerns: SEO metadata, security boundaries, accessibility, performance, backend reproducibility and quality gates.
