# Documentation audit

Run on 2026-10-19 against branch `dev-satyam` at commit `e8f740c`, plus the documentation commits and the uncommitted admin-redirect change in `src/` (see [repo-inventory](../docs/repo-inventory.md#working-tree-note)).

Checks 2 to 8 and 10 were re-run on 2026-10-19 on branch `feat/homepage-studio`, after the homepage studio, products redesign, rate limits, catalog cache and the move to Cloudflare Workers. The counts below are from that re-run.

The master spec `prompts/project-generator.md` does not exist in the repository (ASSUMPTION-014). The file tree, phase model, test case format and these audit checks were therefore inferred from the documentation brief. Each check below says how it was run, so it can be repeated.

## Summary

| # | Check | Result |
| --- | --- | --- |
| 1 | Every path in the documentation tree exists or is marked Not Applicable | Pass |
| 2 | Every internal markdown link and anchor resolves | Pass (0 broken across 45 files) |
| 3 | No placeholder text | Pass (5 hits, all justified) |
| 4 | IDs are unique and each is referenced at least once outside its definition | Pass |
| 5 | Traceability chain complete: requirement → feature → story → AC → test → phase | Pass |
| 6 | Every test case uses the required format | Pass (89 of 89) |
| 7 | Docs match the code; discrepancies recorded as ADRs | Pass (12 discrepancies recorded) |
| 8 | Unverifiable facts labelled as assumptions | Pass (24 assumptions, 1 retired) |
| 9 | No invented metrics | Pass |
| 10 | Lint, unit tests and build pass | Pass (the original documentation pass changed no application code; later feature work did, see §10) |
| 11 | No secret files read | Pass |

## 1. Documentation tree

| Path | Status |
| --- | --- |
| `CLAUDE.md` | Present |
| `PROJECT_BRIEF.md` | Present |
| `README.md` | Present (rewritten; tooling notes kept) |
| `docs/repo-inventory.md` | Present |
| `docs/authentication.md`, `docs/homepage.md`, `docs/design/` | Present (pre-existing, unchanged) |
| `product/requirements.md`, `features.md`, `user-stories.md`, `traceability-matrix.md` | Present |
| `architecture/system-overview.md`, `architecture-decisions.md`, `data-model.md`, `api-contracts.md`, `security.md`, `frontend.md` | Present |
| `ai/ai-features.md` | Present. **Not Applicable**: no AI code and none planned (ADR-008) |
| `testing/test-strategy.md`, `test-cases.md` | Present |
| `implementation/phase-plan.md`, `phase-test-matrix.md`, `documentation-audit.md` | Present |
| `project-management/risk-register.md` | Present |
| `operations/deployment.md` | Present |
| `diagrams/README.md`, `system-context.md`, `data-model.md`, `auth-flow.md`, `checkout-sequence.md`, `homepage-publish-sequence.md`, `phase-status.md` | Present |
| `.claude/CLAUDE.md` | Present |
| `.claude/rules/code-style.md`, `security.md`, `testing.md`, `documentation.md` | Present |
| `.claude/commands/verify.md`, `update-docs.md`, `add-test-case.md` | Present |
| `.claude/skills/supabase-change/SKILL.md`, `traceability/SKILL.md` | Present |
| `.claude/agents/doc-auditor.md`, `security-reviewer.md` | Present |

## 2. Links

A script parsed every inline markdown link target outside code blocks in all tracked and new `*.md` files. It resolved each target relative to the containing file, and checked each `#anchor` against GitHub-style heading slugs in the target file.

- First run: 2 broken links, both pointing at this file before it existed.
- Final run: 0 broken.

## 3. Placeholder scan

Searched for `TBD|TODO|lorem|\[insert|\.\.\.` in every markdown file outside `docs/design/`.

| Hit | Justification |
| --- | --- |
| `.claude/agents/doc-auditor.md:12` | The instruction to search for these words |
| `.claude/commands/update-docs.md:17` | The same instruction |
| `.claude/rules/documentation.md:13` | The rule forbidding them |
| `diagrams/auth-flow.md` `open /admin/...` | **Fixed**: reworded to "open any /admin route" |
| `implementation/documentation-audit.md`, two lines | This file quoting the search pattern and the fixed hit above |

No placeholder sections and no "to be added" content remain.

## 4. ID uniqueness and references

| Prefix | Defined | Duplicates | Referenced outside definition |
| --- | --- | --- | --- |
| FR | 35 | 0 | All |
| NFR | 8 | 0 | All |
| FEAT | 8 | 0 | All |
| US | 43 | 0 | All |
| AC | 89 | 0 | All |
| TC | 89 | 0 | All |
| PH | 8 | 0 | All |
| ADR | 16 | 0 | All |
| R | 21 | 0 | All |
| ASSUMPTION | 24 | 0 | All |

The first run found ADR-004, ADR-005, ADR-006, ADR-007, R-05, R-06, R-15, R-17, R-18 and ASSUMPTION-017 referenced only at their definitions. It also found a stray `PH-9` mention. Each one got a reference in the document it governs, and the `PH-9` wording was removed.

## 5. Traceability

- Every FR and NFR appears in exactly one story heading (`**US-###** (FR-###)`).
- Every `AC-###.#` line ends with a `[TC-###]` reference. The command `grep -E '^- AC-' product/user-stories.md | grep -v '\[TC-'` prints nothing.
- Each test case's `Traces` line was compared programmatically with its row in [traceability-matrix.md](../product/traceability-matrix.md) and [phase-test-matrix.md](phase-test-matrix.md). There were 0 mismatches.
- The phase counts in the matrix (89 total, 30 passing, 56 not run, 3 not implemented) match the test case statuses.

## 6. Test case format

A script checked that each of the 89 `### TC-` blocks has exactly these fields in order: Traces, Type, Priority, Preconditions, Test data, Steps, Expected result, Automation, Status. It also checked that Traces has the form `<req> · US · AC · PH`. Result: 0 failures. Quoted UI strings were spot-checked against the source (Codex, Episodes, InfoPage, Checkout, ResetPassword, AdminOrders, AdminEpisodes, AdminHomepage, Home).

## 7. Discrepancies between the code and the docs or assumptions

These are recorded, not fixed.

| Discrepancy | Recorded in |
| --- | --- |
| The repo is Vite + React SPA, not the default Next.js App Router | ADR-001 |
| The code is JavaScript, not TypeScript; the root `.txt` describes TypeScript, Tailwind and framer-motion | ADR-002, ADR-014, R-18 |
| Most of the schema and both Edge Functions are not in the repo | ADR-010, R-02, R-03, R-04 |
| Order statuses `paid` and `failed` exist with no payment integration | ADR-011, R-01 |
| No `test` script; `node --test tests/` fails on Node 26 | ADR-012, R-05 |
| `.env.example` lists server-only R2 variables and omits the required `VITE_*` variables | ADR-013, R-06 |
| The catch-all `/:casteId` route hides 404s; `replace('the-', '')` is not anchored | ADR-015, R-10 |
| `README.md` was Vite template boilerplate | Rewritten; tooling notes kept |
| The frontend deploys as a Cloudflare Worker with static assets, not on Vercel; `vercel.json` has no effect | ADR-016, ASSUMPTION-023 (retired) |
| `orders` has Razorpay payment columns although no payment integration is documented | R-21 |
| FR-035 said orders referring to a garment block its deletion; the live schema sets `order_items.product_id` to null, so the garment is deleted and order lines keep their own name and price | FR-035, AC-041.1 and TC-074 corrected |
| [docs/authentication.md](../docs/authentication.md) says direct admin sign-ins open `/admin`. With the working-tree change, admins also go to `/admin` when the redirect is a non-admin page. | FR-016, ASSUMPTION-020. The guide is still accurate for direct sign-ins. Update it when the change is committed. |

### Bugs and inconsistencies found in code (logged, not fixed)

| Finding | Location | Risk |
| --- | --- | --- |
| The account order history query has no user filter, so admins may see every order | `src/pages/Account.jsx` | R-15 |
| Checkout collects an address, but admin orders never display one; admin shows `phone`, which checkout never collects | `Checkout.jsx`, `AdminOrders.jsx` | R-12 |
| Errors ignored: profile save always shows "Saved ✓", and order status, size stock and caste hero updates do not check `error` | `Account.jsx`, `AdminOrders.jsx`, `AdminProducts.jsx`, `AdminCastes.jsx` | R-14 |
| Product images always get `sort_order: 0`, and `alt` is set to the product ID | `AdminProducts.jsx` | R-11 |
| `window.alert` / `window.confirm` used instead of the studio's `useConfirm` / `useToast` | `AdminCastes.jsx`, `AdminHomepage.jsx` | R-13 |
| Signup inputs have no labels, and the signup error has no `role="alert"` | `Signup.jsx` | R-13 |
| Delivery copy conflicts ("Delivered in 14–21 days" vs "Expected dispatch: 14–21 days") | Product data, `Checkout.jsx` | R-17 |

## 8. Assumptions

All 24 assumptions (one retired) are in the table at the end of [PROJECT_BRIEF.md](../PROJECT_BRIEF.md#7-assumptions). Every statement about an object not visible in the repo cites an assumption, an ADR or a risk. Examples: Edge Function behaviour cites ASSUMPTION-007, RLS cites ASSUMPTION-008, and `top_products` cites ASSUMPTION-009.

## 9. Metrics

No performance, traffic or capacity numbers were invented. Every number in the docs comes from the code (30 s cache TTL, 10 or 12 items per page, the 256 KB document cap, 15 MB / 100 MB upload limits from [docs/homepage.md](../docs/homepage.md), the 30-day entry bypass, the 300 ms search debounce) or from configuration (one-year asset cache). NFR-004 explicitly sets no page-load target (ASSUMPTION-010).

## 10. Code and quality gates

- The original documentation pass created or edited only documentation and `.claude/` files. The five modified `src/` files predate it: they are the admin-redirect change, left uncommitted at the owner's request. They were never staged in a docs commit.
- Later feature work in the working tree did change application code: the homepage studio, the products redesign (FR-029 to FR-035), rate limits (NFR-007) and the catalog cache (NFR-008).

| Command | Original pass | Re-run (2026-10-19) |
| --- | --- | --- |
| `npm run lint` | Pass, no findings | Pass, no findings |
| `node --test tests/*.test.js` | 7 pass, 0 fail | 24 pass, 0 fail |
| `npm run build` | Pass | Pass |

- `tests/homepage-permissions.sql` and `tests/rate-limits-permissions.sql` were not run, because there was no database URL. TC-045 and TC-078 to TC-081 are "Not run".

## 11. Secrets

`.env.local` exists. It was not opened. Environment variable names were taken from `import.meta.env` references in `src/` and from `.env.example`.

## Open items needing an owner decision

1. Which payment provider to integrate (FR-011, ADR-011, R-01).
2. Confirm ASSUMPTION-020: should admins signing in from `/checkout` still land on `/admin`?
3. Approve PH-7: pulling the live schema and Edge Function sources into the repo (requires project access).
4. Choose the source of truth for delivery and returns copy (R-17).
5. Whether to delete or relocate the root `.txt` file (R-18).
6. Whether to approve code fixes for R-12, R-14 and R-15. These are outside documentation scope.
