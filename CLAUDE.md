# NextHook

NextHook adapts Microsoft Data Formulator for individual content creators. The initial task is to compare a creator's content series and choose an evidence-backed next experiment. The user authorized independent implementation on 2026-10-04; ask only about substantial product uncertainty, missing indispensable access, or new spending.

## Boundaries

- Start with user-supplied files and a clearly labeled synthetic demo. Do not scrape platforms or promise native export compatibility without a tested sample.
- Keep observation windows, account boundaries, metric definitions, missing values, and original evidence visible. No causal claims, guaranteed viral content, or numerical forecasts without a defined and validated method.
- The deterministic review works without model credentials. Open-ended analysis uses the upstream backend and a user-configured model. Never simulate a model response as if it were live.
- Personal job-planning notes live outside this code repository, in the existing local Chinese discussion folder. Do not copy personal background or research data into this repository.

## Layout

- `src/nexthook/`: creator UI, file normalization, deterministic comparison, and bridge to the existing workbench.
- `src/app/`, `src/views/`, `src/data/`, `py-src/data_formulator/`: reused upstream workbench, parsing, state and Python analysis services. Preserve upstream copyrights and keep adaptations small.
- `docs/upstream.json`: authoritative upstream snapshot provenance. `docs/upstream-readme.md`: original upstream documentation.
- `docs/`: product scope, platform-source evidence, decisions and verification notes.
- `tests/frontend/nexthook.test.ts`, `tests/e2e/`: NextHook checks alongside retained upstream tests.
- `.nexthook/`: ignored runtime data, sessions, model settings and logs. Never commit.

## Run and verify

Read README.md for exact commands. Use the checked-in Yarn and uv locks. Serve the local preview on loopback; do not publish the development server. Check calculations and complete browser flows, not just screenshots. Any model-backed test needs an explicitly available model configuration; record skipped live inference accurately.

## Git

Use a feature branch, PR, then merge. All NextHook commits must use Baixue Wu <baixuewu0@gmail.com> as both author and committer, with no assistant attribution trailers. This project-specific requirement overrides inherited authorship defaults. The origin uses the existing `github-baixue` SSH identity for Baixue-Wu/NextHook. Push committed code and open a PR in the same turn when possible. Do not rewrite published history. Keep significant implementation decisions in docs/design-decisions.md and tentative discussion separate.
