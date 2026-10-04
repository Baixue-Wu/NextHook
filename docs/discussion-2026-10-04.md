# Creator exploration discussion

## Feedback

The user observes that the data exploration page still looks like Data Formulator and asks for a NextHook interface suited to the creator scenario, while reusing upstream code. The first preview established a working backend handoff but has not completed product-specific exploration.

## Proposed interaction design

Keep the creator's dataset, objective, series labels and measurement context across review and exploration. Users should investigate a content decision without reconstructing the question in a separate general-purpose workbench.

- A question area offers concrete entry points: compare series, inspect the influence of a high-performing post, or inspect the relationship between views and saves. Free-text follow-ups remain available once a model is configured.
- A central chart area links selection to evidence: click a series or an individual post to filter or highlight its source records; metric changes and highest-value exclusion update the current comparison. Reuse upstream chart specification/rendering and analysis modules where their contracts fit.
- An evidence panel shows the selected content, metric definitions, missingness, sample counts and observation window. Findings can be saved with their supporting comparison into the next-experiment plan. Avoid unsupported causal or numerical forecasting claims.

Candidate visualizations: series comparison, per-post distribution, and views-versus-saves scatter plot. Availability depends on actual fields. Publication-date plots must label whether measurements are lifetime snapshots or equal-age observations; they do not establish a performance trend by themselves.

These controls and layout are a design proposal, not yet implemented or validated. The accepted direction is ownership of the creator experience while retaining upstream analysis capabilities. The next implementation should trace the reusable chart and agent interfaces, replace the visible handoff, and test one complete question-to-chart-to-evidence-to-plan flow.

## Implementation outcome

The proposed creator-owned exploration is now implemented: series bars, post distributions and paired-metric scatter plots; chart-to-record selection; series filtering; maximum exclusion; plan export; and optional questions about the current evidence. The original handoff adapter and banner were removed. Both `/explore` and the old `/app` URL enter NextHook. This is a bounded first exploration interface; it does not yet let arbitrary natural-language requests generate new chart types or run new transformations.
