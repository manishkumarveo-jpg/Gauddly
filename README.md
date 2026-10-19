# Gauddly

A storefront and story world for a house of hand-dyed, made-to-order garments from Delhi. Customers browse castes and garments, read the Codex, watch the films and place orders. Administrators run the catalog, content and orders from a browser studio at `/admin`.

## Stack

Vite 8 · React 19 (JavaScript) · React Router 7 · Supabase (Auth, Postgres, RLS, Edge Functions) · Cloudflare R2 (media) · Cloudflare Pages (hosting, one `/api/*` function) · Upstash Redis (catalog cache).

## Quick start

```sh
npm ci
# create .env.local: see operations/deployment.md for the variables
npm run dev
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server on port 5173 |
| `npm run lint` | Run oxlint |
| `node --test tests/*.test.js` | Run the unit tests (there is no `npm test` script yet) |
| `npm run build` | Build the production bundle into `dist/` |
| `npm run preview` | Serve the built bundle locally |

## Documentation

Start with [PROJECT_BRIEF.md](PROJECT_BRIEF.md). It explains the project and lists every document in reading order. Key entry points:

- What exists today: [docs/repo-inventory.md](docs/repo-inventory.md)
- Requirements and traceability: [product/](product/requirements.md)
- Architecture and decisions: [architecture/](architecture/system-overview.md)
- Tests: [testing/test-cases.md](testing/test-cases.md)
- Phase status: [implementation/phase-test-matrix.md](implementation/phase-test-matrix.md)
- Risks: [project-management/risk-register.md](project-management/risk-register.md)
- Deployment: [operations/deployment.md](operations/deployment.md)
- Topic guides: [sign-in and recovery](docs/authentication.md), [homepage content studio](docs/homepage.md)

Claude Code configuration lives in [.claude/CLAUDE.md](.claude/CLAUDE.md).

## Tooling notes

These are kept from the original Vite template README and still apply:

- `@vitejs/plugin-react` uses [Oxc](https://oxc.rs) for transforms.
- The React Compiler is not enabled, because of its impact on dev and build performance. See the [React Compiler installation guide](https://react.dev/learn/react-compiler/installation) to add it.
- Linting uses oxlint with the `react` and `oxc` plugins (`.oxlintrc.json`). Type-aware rules would require TypeScript, which this project does not use ([ADR-002](architecture/architecture-decisions.md#adr-002--javascript-not-typescript)).
