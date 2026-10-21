# Frontend structure

The route table is in [docs/repo-inventory.md](../docs/repo-inventory.md#3-routes).

## Shell

`src/App.jsx` wraps everything in `AppProvider` and `BrowserRouter`. Every page is `React.lazy` loaded inside a single `Suspense` with the fallback "Opening the chamber…", and pages are wrapped in `PageTransition`.

| Element | Shown on |
| --- | --- |
| `Navigation` | All routes except `/`, `/await` and `/admin/*` |
| `Footer` | Same as Navigation, minus `/login`, `/forgot-password` and `/reset-password` |
| `CartDrawer` | All non-admin routes |
| `RouteSeo`, `ScrollToTop` | All routes |

## Directories

| Path | Contents |
| --- | --- |
| `src/context/` | `app-context.js` (the context object) and `AppContext.jsx` (the provider and all global state) |
| `src/lib/` | `supabase.js` (client, `mediaUrl`, `publicRead`, error helper), `public-api.js` (the `/api/*` handler, unit-tested), `homepage.js` (pure model, unit-tested), `homepage-api.js` (cached loaders), `request-cache.js`, `navigation.js` (`safeInternalPath`), `useScrollReveal.js` |
| `src/components/` | Site chrome, `HomeExperience` (renders all nine sections, also used for admin preview), auth layout, gallery, effects |
| `src/pages/` | One file per public route |
| `src/pages/admin/` | Studio layout, one page per section, and shared hooks: `useConfirm`, `useToast`, `Pagination`, `ProgressBar`, `RevenueChart`, `uploadToR2`, `adminStyles`, `Icons` |

## Conventions observed in the code

- Plain JavaScript and JSX, function components and hooks. No TypeScript (ADR-002).
- Styling uses the CSS custom properties defined in `src/index.css` (`--void-black`, `--bone-white`, `--ash-grey`, `--cold-silver`, `--font-display`, `--font-body`), plus inline style objects (ADR-014).
- Public catalog pages (Home, Store, caste rooms, product pages, Archive, Episodes) read through `publicRead()` and `/api/*` (NFR-008). Every other screen, including all admin screens, calls Supabase directly. `src/lib/homepage-api.js` wraps the homepage loaders.
- Pure logic that can be tested in Node lives in `src/lib/` with no React or browser imports (`homepage.js`, `request-cache.js`, `public-api.js`).
- Admin destructive actions use `useConfirm`, except caste deletion, which uses `window.alert` for the "has products" message (R-13).
- User-facing errors use `role="alert"`, and progress or status messages use `role="status"`.

## Accessibility features present

- The mobile menu has `aria-expanded` and `aria-controls`, closes on Escape, locks body scroll and focuses the first link.
- The cart drawer traps focus, closes on Escape and restores focus.
- Checkout inputs have visually hidden labels (`sr-only`).
- Signup inputs have placeholders but no `<label>` elements, and the signup error has no `role="alert"` (R-13).
