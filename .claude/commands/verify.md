---
description: Run lint, unit tests and production build, and report the results honestly
allowed-tools: Bash(npm run lint), Bash(node --test tests/*.test.js), Bash(npm run build), Bash(git status:*)
---

Run the project's quality gates (TC-056) and report the results.

1. Run `git status --short` and list any modified files outside the task's scope.
2. Run `npm run lint`.
3. Run `node --test tests/*.test.js`. Do not use `node --test tests/`, which fails on Node 26.
4. Run `npm run build`.

Report one line per step: the command, pass or fail, and for unit tests the pass/fail counts. If any step fails, quote the relevant error output and stop. Do not claim the change is done.

If the change touched `supabase/migrations/` or `tests/*.sql`, add that the SQL tests need `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f <file>` against a non-production database. Do not run them unless the user provides a database URL.
