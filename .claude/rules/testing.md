---
paths:
  - "tests/**"
  - "src/lib/**"
  - "testing/**"
---

# Testing rules

Background: [testing/test-strategy.md](../../testing/test-strategy.md).

- **Unit tests** use `node:test` and `node:assert/strict`. One file per module in `tests/`, named `<module>.test.js`, importing from `../src/lib/<module>.js` with the `.js` extension. No test framework dependency.
- **Run with** `node --test tests/*.test.js`. The directory form `node --test tests/` fails on Node 26.
- **Only test pure modules** in Node. Code that imports React, the DOM or `import.meta.env` cannot run under `node --test`. Extract the logic into `src/lib/` first.
- **Database tests** are `psql` scripts that run inside `begin; … rollback;`, use `-v ON_ERROR_STOP=1`, raise `TEST FAILED: …` on failure and end with a `PASS:` select. Follow `tests/homepage-permissions.sql`. Never run write tests against production.
- **Every new or changed acceptance criterion gets a test case** in [testing/test-cases.md](../../testing/test-cases.md), in the exact format from test-strategy §4. Use `/add-test-case`.
- **Report honestly.** Mark a test "Passing (<date>)" only when it was run and passed. If a command fails, report the output and do not mark it as passing.
- **Before calling a change done,** run `/verify`.
