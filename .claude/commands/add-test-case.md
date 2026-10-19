---
description: Add a test case for an acceptance criterion in the required format
argument-hint: <AC-###.#>
---

Add a test case for acceptance criterion $ARGUMENTS.

1. Find $ARGUMENTS in `product/user-stories.md`. Note its story, requirement and phase (from `product/traceability-matrix.md`).
2. Read the code that implements it, and copy exact UI strings from the source.
3. Take the next unused `TC-###` number. Run `grep -o 'TC-[0-9]*' testing/test-cases.md | sort -u | tail -1` and add 1. Never reuse a number.
4. Write the case under its phase heading in `testing/test-cases.md`, using exactly this structure:

```markdown
### TC-### — <behaviour under test>

- **Traces:** <FR/NFR-###> · <US-###> · <AC-###.#> · <PH-#>
- **Type:** Automated unit | Automated SQL | Manual browser | Manual inspection
- **Priority:** P1 | P2 | P3
- **Preconditions:** <state>
- **Test data:** <exact inputs>
- **Steps:**
  1. <action>
- **Expected result:** <observable outcome with exact text>
- **Automation:** <file › test name> | None
- **Status:** Passing (<date>) | Not run | Not implemented (expected to fail until <PH-#>)
```

5. Append `[TC-###]` to the acceptance criterion. Add a row to `product/traceability-matrix.md`. Add the case to `implementation/phase-test-matrix.md` and update its counts.
6. If the case is automated, write the test following `.claude/rules/testing.md`, run it, and set its status from the real result.
