# Preview verification

Checked locally on 2026-10-04 with Node 22.22.3, Python 3.13.12 and Chromium through Playwright. The final browser run used the built application and real Python backend at 127.0.0.1:5571, with debug mode off and project-local runtime storage.

## Initial preview checks

- TypeScript: `node_modules/.bin/tsc --noEmit`.
- Production build: `TMPDIR=/tmp corepack yarn build`.
- 74 frontend tests across the creator calculations/import, workspace service, table-loading thunk, Excel cell conversion and type inference.
- 5 retained backend tests for Flask session configuration.
- 5 browser tests: synthetic comparison and sensitivity, series editing and plan persistence; CSV mapping and window restrictions; guide and mobile overflow; actual table upload into the upstream workbench with row content restored after refresh; Excel import with a blank cell and an explicit zero preserved separately.

Reproduce the focused frontend suite:

```bash
TMPDIR=/tmp node_modules/.bin/vitest run tests/frontend/nexthook.test.ts tests/frontend/unit/app/workspaceService.test.ts tests/frontend/unit/app/tableThunks.test.ts tests/frontend/unit/data/resolveExcelCellValue.test.ts tests/frontend/unit/data/typeInference.test.ts
TMPDIR=/tmp .venv/bin/python -m pytest tests/backend/auth/test_flask_session_config.py -q
```

Run `corepack yarn test:e2e` with the server running and Playwright Chromium installed. See README.md for startup commands. Browser checks use generated test files and simulated creator content, not private account records.

## Practical limits

- No live model credentials or inference were exercised. Optional model settings now sit inside the NextHook exploration page; deterministic exploration stays usable without a configured model. Provider response quality remains unverified.
- No native platform export was authenticated or imported. Generic CSV and Excel behavior was tested, not platform-specific schemas. Consult platform-data-sources.md before promising compatibility.
- This is a local preview, not a deployed multi-user service. No full upstream regression suite, load test or accessibility audit was run.
- The retained upstream bundle is large; Vite reports chunk-size and dependency warnings. Build succeeds, but initial-load optimization remains future work.
- Existing upstream README whitespace is retained as part of the original document. New creator files passed the staged whitespace check.

![NextHook creator review using synthetic data](screenshots/creator-review.png)

## Earlier creator exploration update (superseded below)

The public `/explore` page and previous `/app` entry now render NextHook's creator interface. The original workbench handoff was removed. The chart uses the upstream `assembleVegaChart` function, Flint compiler and Vega renderer. The question endpoint uses upstream identity verification, model-client/provider validation and error handling.

- Creator frontend checks: 15 tests passed, including missing-versus-zero behavior, paired-metric filtering, selected-series maximum exclusion and evidence export.
- Creator question backend: 9 tests passed with a mocked model client. They cover evidence and conversation forwarding, identity requirements, input bounds and empty responses. These are integration-contract checks, not live model evaluation.
- Final TypeScript check and production build passed. All 8 browser flows passed, including the original review/import flows and chart selection, evidence/plan persistence, scatter filters, empty selection, mobile exploration, the legacy URL, and scoped AI request/history handling with a mocked endpoint. The in-page model-settings dialog was also opened successfully. No paid model was called.

![NextHook creator exploration](screenshots/creator-exploration.png)

## Conversation and canvas update

The main exploration interface now uses the actual upstream `/api/agent/analyst-streaming` endpoint. The previous text-only NextHook endpoint and its tests were removed. The chart compiler, source upload, workspace persistence and Python sandbox remain upstream implementations.

- TypeScript and production build passed.
- 24 frontend tests passed: creator calculations/import, manual exploration, streamed-result validation/context/export and the reused table-loading thunk.
- 6 backend tests passed: existing Flask session checks plus a real sandbox two-step comparison. The sandbox test computes medians, excludes one maximum per series, verifies changed medians, and confirms both result tables and the source survive. It does not call a model. Python emits a retained fork-in-multithreaded-process deprecation warning.
- 10 browser flows passed: review/import/manual exploration plus real upload with a mocked analyst stream, selected-row follow-up, two-chart comparison, plan export, history/workspace restoration after refresh, clarification/resume, premature stream termination and fatal errors. Mocked responses validate protocol and UI behavior; they are not live inference.
- No provider credentials were configured or used. End-to-end model reasoning, generated-code reliability and model cost remain unverified.

Reproduce the added checks:

```bash
TMPDIR=/tmp node_modules/.bin/vitest run tests/frontend/nexthook.test.ts tests/frontend/exploration.test.ts tests/frontend/conversation.test.ts tests/frontend/unit/app/tableThunks.test.ts
TMPDIR=/tmp .venv/bin/python -m pytest tests/backend/agents/test_nexthook_visualization.py tests/backend/auth/test_flask_session_config.py -q
TMPDIR=/tmp node_modules/.bin/playwright test
```

The screenshot below shows the real UI with **test-fixture model responses and synthetic creator data**, not output from a live model.

![NextHook conversation and comparison, simulated model responses](screenshots/conversation-fixture.png)
