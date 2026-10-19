# Test strategy

## 1. Purpose

Most of the product is already built. Testing therefore has two jobs:
- **Verification tests** prove that existing behaviour matches the requirements.
- **Acceptance tests** for unbuilt requirements (FR-011, NFR-005, NFR-006) define when a phase is done. They are expected to fail until then.

## 2. Test levels

| Level | Tool | Location | Runs where | Current coverage |
|---|---|---|---|---|
| Unit | Node test runner (`node:test`, `node:assert/strict`) | `tests/*.test.js` | Any machine with Node 20+ (ASSUMPTION-019) | `src/lib/homepage.js`, `src/lib/request-cache.js` |
| Database | `psql` script in a rolled-back transaction | `tests/*.sql` | Against a Supabase database with at least one admin profile | Homepage RLS and RPC |
| Manual browser | Scripted steps in [test-cases.md](test-cases.md) | — | `npm run dev` or a preview deployment | Every UI requirement |
| Static | oxlint | `.oxlintrc.json` | Any machine | All `src/` |
| Build | Vite | — | Any machine | Compile errors, missing imports |

No end-to-end framework is installed. Manual cases are written step by step, so that they can be automated directly once one is added in PH-8.

## 3. Commands

```sh
npm run lint                         # static checks
node --test tests/*.test.js          # unit tests (the directory form fails on Node 26, see ADR-012)
npm run build                        # production build
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/homepage-permissions.sql   # database permissions, needs a DB URL
```

## 4. Test case format

Every test case in [test-cases.md](test-cases.md) uses exactly this structure (ASSUMPTION-016):

```markdown
### TC-### — <behaviour under test>

- **Traces:** <FR/NFR-###> · <US-###> · <AC-###.#> · <PH-#>
- **Type:** Automated unit | Automated SQL | Manual browser | Manual inspection
- **Priority:** P1 (blocks release) | P2 (degrades a core flow) | P3 (cosmetic or edge)
- **Preconditions:** <state that must hold before step 1>
- **Test data:** <exact inputs>
- **Steps:**
  1. <action>
- **Expected result:** <observable outcome, with exact text where the UI shows text>
- **Automation:** <file › test name> | None
- **Status:** Passing (<date>) | Not run | Not implemented (expected to fail until <PH-#>)
```

Rules:
- One test case verifies one acceptance criterion. An acceptance criterion may have more than one test case.
- Expected results quote the UI text exactly as it appears in the code.
- "Passing" is used only when the case was run and passed on the stated date. Manual cases not executed during documentation are "Not run".

## 5. Test environments and data

| Need | Source |
|---|---|
| Customer account | A dedicated test user in the target Supabase project |
| Administrator account | A test user with `profiles.is_admin = true` |
| Catalog | At least one published product per caste, one unpublished product, one product with every size out of stock, and one `old-world` product |
| Episodes | At least one `released` episode with a video and one `awaiting` episode |
| Waitlist | One email already registered |

Use a non-production Supabase project, or a Supabase branch, for any case that writes data (TC-020, TC-027, TC-033, TC-039 to TC-045). Do not run write tests against production.

## 6. Entry and exit criteria per phase

A phase is **complete** when every P1 and P2 test case traced to it has status Passing, or is Not run with a recorded manual sign-off in [implementation/phase-test-matrix.md](../implementation/phase-test-matrix.md). A phase with any "Not implemented" P1 case is **Partial**.

## 7. Gaps this strategy accepts for now

- `safeInternalPath` has no unit test. TC-024 covers it manually. Adding a unit test is a code change, scheduled for PH-8.
- No automated accessibility or visual regression checks.
- The Edge Functions cannot be tested from this repository until PH-7 brings their source in.
