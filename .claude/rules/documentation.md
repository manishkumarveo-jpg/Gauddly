---
paths:
  - "**/*.md"
---

# Documentation rules

- **The code wins.** Document what the code does. If it contradicts a doc or an assumption, update the doc and record the discrepancy as an ADR in [architecture/architecture-decisions.md](../../architecture/architecture-decisions.md).
- **IDs are permanent.** Never renumber or reuse an FR, NFR, FEAT, US, AC, TC, PH, ADR, R or ASSUMPTION ID. Add new IDs at the end of their sequence, and mark retired ones "Retired" instead of deleting them. Follow the [traceability skill](../skills/traceability/SKILL.md).
- **Traceability chain:** requirement → feature → user story → acceptance criterion → test case → phase. A behaviour change updates every link in that chain, plus [product/traceability-matrix.md](../../product/traceability-matrix.md) and [implementation/phase-test-matrix.md](../../implementation/phase-test-matrix.md).
- **Assumptions:** anything not verifiable from the repo is labelled `ASSUMPTION-###` and added to the table at the end of [PROJECT_BRIEF.md](../../PROJECT_BRIEF.md).
- **No invented numbers.** Performance or capacity targets must cite a measurement or be labelled as an assumption.
- **No placeholders.** No TBD, TODO, lorem ipsum, "[insert …]" or trailing "..." in docs. If something is unknown, say so and link the assumption or risk.
- **Links** are relative markdown links that resolve from the file's own directory. Run the `doc-auditor` agent after large edits.
- **Bugs found while documenting** go in [project-management/risk-register.md](../../project-management/risk-register.md) and are not fixed silently.
- **Existing topic guides** ([docs/authentication.md](../../docs/authentication.md), [docs/homepage.md](../../docs/homepage.md)) stay authoritative for their topics. Link to them rather than duplicating them.
