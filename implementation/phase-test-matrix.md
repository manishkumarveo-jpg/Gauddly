# Phase test matrix

Status as of 2026-10-19. Phase definitions: [phase-plan.md](phase-plan.md). Test definitions: [testing/test-cases.md](../testing/test-cases.md).

## Phase status

| Phase | Status | Evidence | Tests | Passing | Not run | Not implemented |
|---|---|---|---|---|---|---|
| PH-1 | Complete | Code present for every requirement; TC-052 and TC-053 automated | 8 | 2 | 6 | 0 |
| PH-2 | Complete | Code present; FR-016 in the uncommitted working tree | 9 | 0 | 9 | 0 |
| PH-3 | Complete | Code present | 7 | 0 | 7 | 0 |
| PH-4 | Partial | Cart and checkout present; payment absent | 5 | 0 | 4 | 1 |
| PH-5 | Complete | Code present; TC-004 to TC-008 automated | 10 | 5 | 5 | 0 |
| PH-6 | Complete | Code present | 13 | 0 | 13 | 0 |
| PH-7 | Partial | Homepage migration only | 3 | 0 | 2 | 1 |
| PH-8 | Partial | Lint, unit tests and build pass; no CI | 2 | 1 | 0 | 1 |
| **Total** | | | **57** | **8** | **46** | **3** |

"Complete" means every requirement in the phase is implemented in code. The manual verification cases still need to be run and signed off, as defined in [test-strategy.md §6](../testing/test-strategy.md#6-entry-and-exit-criteria-per-phase).

## Test case detail

| Test | Phase | Requirement | Type | Priority | Status |
|---|---|---|---|---|---|
| TC-001 | PH-1 | FR-001 | Manual browser | P2 | Not run |
| TC-002 | PH-1 | FR-001 | Manual browser | P3 | Not run |
| TC-003 | PH-1 | FR-002 | Manual browser | P3 | Not run |
| TC-048 | PH-1 | NFR-001 | Manual browser | P2 | Not run |
| TC-051 | PH-1 | NFR-003 | Manual browser | P2 | Not run |
| TC-052 | PH-1 | NFR-004 | Automated unit | P2 | Passing |
| TC-053 | PH-1 | NFR-004 | Automated unit | P3 | Passing |
| TC-054 | PH-1 | NFR-004 | Manual inspection | P3 | Not run |
| TC-022 | PH-2 | FR-012 | Manual browser | P1 | Not run |
| TC-023 | PH-2 | FR-013 | Manual browser | P1 | Not run |
| TC-024 | PH-2 | FR-013 | Manual browser | P1 | Not run |
| TC-025 | PH-2 | FR-014 | Manual browser | P2 | Not run |
| TC-026 | PH-2 | FR-015 | Manual browser | P1 | Not run |
| TC-027 | PH-2 | FR-015 | Manual browser | P2 | Not run |
| TC-028 | PH-2 | FR-016 | Manual browser | P1 | Not run |
| TC-029 | PH-2 | FR-016 | Manual browser | P2 | Not run |
| TC-030 | PH-2 | FR-016 | Manual browser | P2 | Not run |
| TC-010 | PH-3 | FR-005 | Manual browser | P1 | Not run |
| TC-011 | PH-3 | FR-005 | Manual browser | P2 | Not run |
| TC-012 | PH-3 | FR-006 | Manual browser | P2 | Not run |
| TC-013 | PH-3 | FR-006 | Manual browser | P3 | Not run |
| TC-014 | PH-3 | FR-007 | Manual browser | P1 | Not run |
| TC-015 | PH-3 | FR-007 | Manual browser | P1 | Not run |
| TC-016 | PH-3 | FR-008 | Manual browser | P2 | Not run |
| TC-017 | PH-4 | FR-009 | Manual browser | P1 | Not run |
| TC-018 | PH-4 | FR-009 | Manual browser | P2 | Not run |
| TC-019 | PH-4 | FR-010 | Manual browser | P1 | Not run |
| TC-020 | PH-4 | FR-010 | Manual browser | P1 | Not run |
| TC-021 | PH-4 | FR-011 | Manual browser | P1 | Not implemented |
| TC-004 | PH-5 | FR-003 | Automated unit | P1 | Passing |
| TC-005 | PH-5 | FR-003 | Automated unit | P1 | Passing |
| TC-006 | PH-5 | FR-003 | Automated unit | P1 | Passing |
| TC-007 | PH-5 | FR-003 | Automated unit | P2 | Passing |
| TC-008 | PH-5 | FR-004 | Automated unit | P1 | Passing |
| TC-009 | PH-5 | FR-004 | Manual browser | P2 | Not run |
| TC-031 | PH-5 | FR-017 | Manual browser | P3 | Not run |
| TC-032 | PH-5 | FR-018 | Manual browser | P2 | Not run |
| TC-033 | PH-5 | FR-019 | Manual browser | P2 | Not run |
| TC-034 | PH-5 | FR-020 | Manual browser | P3 | Not run |
| TC-035 | PH-6 | FR-021 | Manual browser | P1 | Not run |
| TC-036 | PH-6 | FR-021 | Manual browser | P1 | Not run |
| TC-037 | PH-6 | FR-022 | Manual browser | P2 | Not run |
| TC-038 | PH-6 | FR-022 | Manual browser | P3 | Not run |
| TC-039 | PH-6 | FR-023 | Manual browser | P1 | Not run |
| TC-040 | PH-6 | FR-023 | Manual browser | P2 | Not run |
| TC-041 | PH-6 | FR-024 | Manual browser | P2 | Not run |
| TC-042 | PH-6 | FR-025 | Manual browser | P2 | Not run |
| TC-043 | PH-6 | FR-026 | Manual browser | P2 | Not run |
| TC-044 | PH-6 | FR-026 | Manual browser | P1 | Not run |
| TC-045 | PH-6 | FR-027 | Automated SQL | P1 | Not run |
| TC-046 | PH-6 | FR-027 | Manual browser | P2 | Not run |
| TC-047 | PH-6 | FR-028 | Manual browser | P1 | Not run |
| TC-049 | PH-7 | NFR-002 | Manual inspection | P1 | Not run |
| TC-050 | PH-7 | NFR-002 | Manual browser | P1 | Not run |
| TC-055 | PH-7 | NFR-005 | Manual inspection | P1 | Not implemented |
| TC-056 | PH-8 | NFR-006 | Automated unit | P1 | Passing |
| TC-057 | PH-8 | NFR-006 | Manual inspection | P2 | Not implemented |
