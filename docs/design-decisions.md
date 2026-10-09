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

## Implemented creator exploration

- Replace the public workbench handoff with `/explore`, and map the previous `/app` entry to the same NextHook interface. Remove the obsolete handoff adapter and banner. Preserve upstream source, license and attribution.
- Reuse `assembleVegaChart` and the existing Flint/Vega rendering stack for series bars, post distributions and paired-metric scatter plots. Creator controls, mark selection, record inspection and plan export are owned by NextHook.
- Keep all deterministic exploration in the browser. Only an explicit AI question transmits the comparison context, up to 50 plotted records, the selected record and recent conversation to the model backend. No automatic model calls on page entry.
- Add a bounded creator-question endpoint that reuses upstream identity, provider validation, model client and error handling. Responses explain the provided evidence; they do not run arbitrary data transformations or modify charts. Live provider quality remains unverified until credentials are available.
- Preserve missingness and exclusion in evidence: scatter plots need both metrics, while per-series summaries use the chosen metric's valid values. Export these different sample bases and flag any selected record excluded from the chart.
- Use the same browser plan across review and exploration, appending findings rather than replacing existing writing. Empty filter selections remain empty instead of silently restoring all content.

## Conversational visualization (2026-10-04)

- Make a persistent chat and visual canvas the main exploration interaction. User approval supersedes the text-only question endpoint; remove that obsolete path. Rationale: creator exploration must allow new calculations and charts, not just commentary on fixed plots.
- Reuse the upstream AnalystAgent streaming protocol, workspace upload/storage, Python execution and chart compilation. Keep NextHook responsible for the creator interface and context, avoiding a duplicate agent engine.
- Upload the complete normalized table only after the first explicit model question and disclose provider access. Reuse that workspace for subsequent turns; key browser history by the full dataset hash to avoid mixing edited datasets.
- Preserve prior chart results, carry selected chart/data into follow-ups, support upstream clarification trajectories, and export actual transformation code with findings. This makes changed comparisons inspectable and keeps evidence attached to plans.
- Keep deterministic manual exploration usable without credentials. Protocol fixtures and real sandbox computation are separate checks; do not describe fixture responses as live model verification.

- The public portfolio demo runs review and manual exploration entirely in the browser. A separate build entry omits model setup and conversation, and query-string navigation works on GitHub Pages subpaths.
