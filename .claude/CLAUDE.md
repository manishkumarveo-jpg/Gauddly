# Claude Code instructions for Gauddly

## What this project is

Gauddly is a storefront and story world for made-to-order garments. It is a Vite 8 + React 19 **JavaScript** SPA with React Router 7. The backend is Supabase (Auth, Postgres with RLS, RPC, Edge Functions), media is on Cloudflare R2, and hosting is on Cloudflare Pages, with one read-only Pages Function (`/api/*`) that caches public catalog reads in Upstash Redis (ADR-016). Apart from that function, there is no application server in this repo, and no AI features.

Do not propose replacing the stack (Next.js, TypeScript, Tailwind and so on) unless the user asks. See ADR-001, ADR-002 and ADR-014 in [architecture/architecture-decisions.md](../architecture/architecture-decisions.md). The root `.txt` file describes a different stack and is not a spec (R-18).

## Where things are

| Need | Look at |
| --- | --- |
| What exists and its status | [docs/repo-inventory.md](../docs/repo-inventory.md) |
| Requirements (FR/NFR) and stories (US/AC) | [product/](../product/requirements.md) |
| Routes, components, conventions | [architecture/frontend.md](../architecture/frontend.md) |
| Tables, RPCs, Edge Functions | [architecture/data-model.md](../architecture/data-model.md), [architecture/api-contracts.md](../architecture/api-contracts.md) |
| Security boundaries | [architecture/security.md](../architecture/security.md) |
| Test cases and format | [testing/](../testing/test-strategy.md) |
| Phase status and remaining work | [implementation/phase-plan.md](../implementation/phase-plan.md) |
| Known bugs and risks | [project-management/risk-register.md](../project-management/risk-register.md) |
| Env vars and release steps | [operations/deployment.md](../operations/deployment.md) |

## Commands

```sh
npm run dev                    # dev server, port 5173
npm run lint                   # oxlint, must pass
node --test tests/*.test.js    # unit tests, must pass (do NOT use `node --test tests/`; it fails on Node 26)
npm run build                  # must pass
```

There is no `npm test` script yet (ADR-012).

## Hard rules

1. **Never read `.env`, `.env.local` or any `*.local` file**, and never print secret values. Variable names are in `operations/deployment.md`.
2. **Never put a secret in a `VITE_*` variable or in `src/`.** R2 keys and the Supabase service-role key are server-only.
3. **Authorization lives in the database or Edge Functions.** UI checks such as `isAdmin` and `AdminLayout` only decide what is displayed. Any new write path needs an RLS policy or a security-definer check.
4. **Redirects must go through `safeInternalPath`** (`src/lib/navigation.js`). Homepage media and links must go through `assetKey` / `homeLink` (`src/lib/homepage.js`).
5. **Schema changes are migrations** in `supabase/migrations/` (timestamped `YYYYMMDDHHMM_name.sql`), wrapped in `begin; … commit;`, with RLS enabled on every new table.
6. **Do not commit, push or deploy unless asked.** Stage only the files the task touched.
7. **Keep docs in sync.** A behaviour change updates the matching FR, the US/AC, the TC and the phase matrix. Use `/update-docs`.

Detailed rules are in [rules/](rules/):
- [code-style.md](rules/code-style.md)
- [security.md](rules/security.md)
- [testing.md](rules/testing.md)
- [documentation.md](rules/documentation.md)

## Workflows

| Slash command | Use when |
| --- | --- |
| `/verify` | Before saying a change is done. Runs lint, unit tests and build. |
| `/update-docs <what changed>` | After changing behaviour. Updates requirements, stories, tests and matrices. |
| `/add-test-case <AC id>` | Adding a test case in the required format |

| Skill | Use when |
| --- | --- |
| [supabase-change](skills/supabase-change/SKILL.md) | Adding or changing tables, policies, RPCs or Edge Functions |
| [traceability](skills/traceability/SKILL.md) | Adding or renumbering any FR/NFR/US/AC/TC/PH ID |

| Agent | Use when |
| --- | --- |
| [doc-auditor](agents/doc-auditor.md) | Checking that docs match the code and that every ID and link resolves |
| [security-reviewer](agents/security-reviewer.md) | Reviewing any change touching auth, RLS, Edge Functions, uploads or checkout |

## Known gaps to keep in mind

- Most of the schema and both Edge Functions (`create-order`, `admin-upload-url`) are **not in the repo** (ADR-010). Do not invent their contents. Ask, or mark the point as an assumption.
- There is no payment integration, even though orders have `paid` and `failed` statuses (ADR-011, R-01).
- The admin-redirect change in five `src/` files may still be uncommitted (R-16). Check `git status` before assuming.
