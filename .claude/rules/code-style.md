---
paths:
  - "src/**/*.{js,jsx}"
  - "tests/**/*.js"
---

# Code style

Match the code around you. These are the conventions the codebase already follows.

- **Language:** JavaScript and JSX only. No TypeScript, no PropTypes.
- **Components:** function components and hooks. Pages are default exports in `src/pages/`, loaded with `React.lazy` in `src/App.jsx`. A new route needs an entry in `App.jsx` and in `PAGE_META` in `src/components/RouteSeo.jsx`.
- **State:** global state lives only in `AppContext` (`src/context/AppContext.jsx`). Read it with `useContext(AppContext)`, importing from `src/context/app-context.js`. Do not add another context or a state library.
- **Data access:** public catalog reads go through `publicRead()` and a route in `src/lib/public-api.js` (NFR-008); everything else calls `supabase` from `src/lib/supabase.js`. Build media URLs with `mediaUrl(key)`. Read Edge Function errors with `edgeFunctionErrorMessage(error)`. Always check `error` on writes and show it to the user. Some existing code does not (R-14), but don't copy that.
- **Pure logic** that can be unit-tested goes in `src/lib/`, with no React, DOM or Supabase imports (see `homepage.js`, `request-cache.js`).
- **Styling:** reuse the CSS custom properties from `src/index.css` (`--void-black`, `--bone-white`, `--ash-grey`, `--cold-silver`, `--font-display`, `--font-body`) and the existing class names (`underlined-link`, `silver-hover`, `body-s`, `ui-text`, `display-s`). Inline style objects are normal here. No Tailwind or CSS-in-JS library.
- **Admin UI:** use `useConfirm` for destructive confirmations and `useToast` for results, not `window.alert` or `window.confirm`. Use `Pagination`, `ProgressBar` and `adminStyles` from `src/pages/admin/`.
- **Accessibility:** every input has a label (an `sr-only` label is fine). Errors use `role="alert"`, and status messages use `role="status"`. Overlays close on Escape and restore focus.
- **Copy:** user-facing text follows the brand voice ("claim", "Sanctum", "The Crossing"). Prices use `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`.
- **Lint:** `npm run lint` must pass. `react/rules-of-hooks` is an error.
- **Dependencies:** do not add one when a few lines will do. Runtime dependencies are currently only Supabase, React, React DOM and React Router.
