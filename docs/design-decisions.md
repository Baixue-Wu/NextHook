# Design decisions

## 2026-10-04

- Adapt the Data Formulator snapshot identified in `upstream.json` in place. Preserve its workbench, server, parsing and analysis modules rather than rebuilding the engine. The repository initially contained only the NextHook README.
- Isolate the creator layer under `src/nexthook`. The root route offers the review; `/app` retains the upstream free-form analysis interface with a NextHook return path.
- Reuse the upstream Excel parser, table construction, workspace/state lifecycle, upload thunk and analysis workbench. The bridge persists the old workspace before creating a new one, sends measurement context with the rows, and saves the new workspace before navigation.
- Start with one-account file uploads and explicit mapping. Platform export access and metric semantics are not uniformly verified, so do not hard-code unsupported native integrations.
- Make the comparison and experiment-planning flow work without model credentials. Label rule-generated advice; use the real upstream service for open-ended analysis, with model configuration visible to the user.
- Use per-post medians with an optional one-maximum-per-group sensitivity check. Missing values stay missing. Keep the original records visible after exclusion.
- Gate direction suggestions on equal post-age observation windows and at least two groups with three valid records. This is a conservative preview rule, not a statistical validity claim, and must be revisited with real tasks.
- The creator UI stores data and plans in the current browser. Entering the analysis workbench sends the normalized data to the local backend; subsequent model use follows the configured provider. Explain this distinction in the import flow and README.
- Initialize upstream server-session storage only after explicit CLI data-directory resolution, so a configured project directory also owns the sessions. Avoid writing to the user's home directory merely on import.
- Fix the upstream recursive `TextTurn` inference with an explicit type annotation so the imported snapshot passes TypeScript checking. No behavior change is intended.

- Fetch server-backed grid rows on initial mount and table changes. The upstream grid restored metadata after navigation but left its body empty until an interaction; the browser handoff test now checks actual content after navigation and refresh.

- Preserve every Excel header even if the first data row has an empty cell. The upstream parser inferred columns from that first row and silently lost later values; the Excel regression test checks null versus zero.
- Do not request upstream starter questions until a model is configured. A model-free review should not trigger a failing background inference request.

The user authorized autonomous implementation of routine decisions. Target-account validation, real platform adapters, statistical forecasting, model choice/budget and public deployment remain open.

## Creator-owned exploration interface

- The user rejected exposing the original Data Formulator workbench as NextHook's exploration experience. Build a NextHook exploration interface around creator tasks, reusing the upstream analysis and visualization implementation behind explicit interfaces. Rationale: moving from the creator review into a generic tool breaks the task flow and leaves the scene-specific product adaptation incomplete. This supersedes the earlier decision to make `/app` the user-facing exploration destination.
- Preserve the upstream license, copyright and provenance. Product-specific interface design does not remove attribution.
- The currently running preview still contains the original workbench handoff. This decision records the next implementation direction, not a completed UI replacement.

## Project authorship

- All final NextHook presentation and project-authored material use Baixue's name. All new commits use Baixue Wu <baixuewu0@gmail.com> for both author and committer and are pushed with the existing `github-baixue` identity. Rationale: the user explicitly designated Baixue as this project's owner and author.
- Retain third-party copyright, license and provenance for reused open-source code. Project authorship does not replace upstream attribution.
