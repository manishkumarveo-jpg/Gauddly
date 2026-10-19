---
description: Update requirements, stories, test cases and matrices after a behaviour change
argument-hint: <short description of what changed>
---

A behaviour change was made: $ARGUMENTS

Follow the [traceability skill](../skills/traceability/SKILL.md) and the [documentation rules](../rules/documentation.md).

1. Read the changed code with `git diff`, including unstaged changes. Identify every requirement it affects in `product/requirements.md`.
2. For each affected requirement, update the requirement text and status, then the matching user story and acceptance criteria in `product/user-stories.md`.
3. Update or add test cases in `testing/test-cases.md`, using the exact format in `testing/test-strategy.md` §4. Quote UI text exactly as it appears in the code.
4. Update `product/traceability-matrix.md` and `implementation/phase-test-matrix.md`, including the phase counts table.
5. If the change contradicts an assumption or a documented design, add an ADR to `architecture/architecture-decisions.md` and update `PROJECT_BRIEF.md`'s assumptions table.
6. If the change adds or changes a route, table, RPC, Edge Function or environment variable, update `docs/repo-inventory.md` and the relevant architecture or operations file.
7. If the change fixes or creates a risk, update `project-management/risk-register.md`.
8. Grep the changed docs for `TBD`, `TODO` and `[insert`, and confirm every new link resolves.

Summarize the IDs you added or changed.
