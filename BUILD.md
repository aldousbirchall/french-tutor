# Build Manifest: french-tutor

## Overview
Browser-only SPA for Swiss Fide French exam preparation. Four modes: vocabulary drill (FSRS), conversation practice (Claude API), exam simulation, progress dashboard. Voice I/O via Web Speech API.

## Classification
- **Project type**: web-frontend
- **Attributes**: none
- **Technology**: React 18 + Vite + TypeScript, CSS Modules
- **Factory version**: 0.15.0

## Build Phases

| Phase | Status | Started | Completed |
|---|---|---|---|
| 1. Initiation | complete | 2026-02-28 | 2026-02-28 |
| 2. Specification | complete | 2026-02-28 | 2026-02-28 |
| 3. Test Generation | complete | 2026-03-01 | 2026-03-01 |
| 4. Implementation | complete | 2026-03-01 | 2026-03-01 |
| 5. Verification | complete | 2026-03-01 | 2026-03-01 |
| 6. Review & Security | complete | 2026-03-01 | 2026-03-01 |
| 7. Delivery | complete | 2026-03-01 | 2026-03-01 |

## Scores
- **Holdout tests**: 139/143 (47 Vitest + 92 Playwright, 4 skipped)
- **Review**: 88/100 (ACCEPT WITH ISSUES)
- **Security**: PASS WITH FINDINGS

## Verification Summary
- Iteration 1: 59 failures (43 implementation + 16 test-side)
- Iteration 2: 6 failures (3 implementation + 3 test-side)
- Iteration 3: 0 failures
- Test-side fixes applied by orchestrator (do not count against iteration limit)

## Implementation Stats
- 99 source files in src/
- 12 task commits + 15 fix commits + 4 review fix commits
- Dependencies: react, react-dom, react-router-dom, ts-fsrs, @anthropic-ai/sdk, vite, typescript
