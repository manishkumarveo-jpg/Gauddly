---
name: traceability
description: Use when adding, changing or retiring any Gauddly documentation ID (FR, NFR, FEAT, US, AC, TC, PH, ADR, R, ASSUMPTION), or when checking that the requirement → feature → story → acceptance criterion → test → phase chain is complete.
---

# Keeping the traceability chain intact

## ID rules

| Prefix | File | Next ID |
| --- | --- | --- |
| `FR-###`, `NFR-###` | product/requirements.md | Highest existing + 1 |
| `FEAT-##` | product/features.md | Highest existing + 1 |
| `US-###` | product/user-stories.md | Highest existing + 1 |
| `AC-<US>.<n>` | product/user-stories.md | Next `n` within the story |
| `TC-###` | testing/test-cases.md | Highest existing + 1 |
| `PH-#` | implementation/phase-plan.md | Fixed at PH-1 to PH-8; add a new phase only with owner approval |
| `ADR-###` | architecture/architecture-decisions.md | Highest existing + 1 |
| `R-##` | project-management/risk-register.md | Highest existing + 1 |
| `ASSUMPTION-###` | PROJECT_BRIEF.md §7 | Highest existing + 1 |

Find the highest ID with, for example, `grep -oh 'TC-[0-9]*' testing/test-cases.md | sort -u | tail -1`.

Never renumber or reuse an ID. To retire one, keep its row and set its status to "Retired (<date>, reason)".

## The chain

Every requirement must have:
1. A feature (`Feature` column in requirements.md, listed in features.md).
2. Exactly one user story that names it in brackets: `**US-###** (FR-###)`.
3. At least one acceptance criterion under that story.
4. At least one test case per acceptance criterion: `[TC-###]` after the AC, and `**Traces:**` in the test case.
5. A phase, matching the requirement's row in phase-plan.md.
6. A row in product/traceability-matrix.md for every AC, and a row in implementation/phase-test-matrix.md for every TC.

## Completeness check

Run from the repo root:

```sh
# IDs defined vs referenced
for p in FR NFR FEAT US TC PH ADR R ASSUMPTION; do
  echo "$p: $(grep -rhoE "\b$p-[0-9]+" --include=*.md . | sort -u | wc -l) unique"
done
# Acceptance criteria without a test case
grep -E '^- AC-[0-9.]+:' product/user-stories.md | grep -v '\[TC-'
# Test cases missing from the phase matrix
comm -23 <(grep -oE '^### TC-[0-9]+' testing/test-cases.md | grep -oE 'TC-[0-9]+' | sort) \
         <(grep -oE '^\| TC-[0-9]+' implementation/phase-test-matrix.md | grep -oE 'TC-[0-9]+' | sort)
```

Both of the last two commands must print nothing.
