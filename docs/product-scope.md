# Creator review preview

NextHook helps a creator turn past content performance into a reasoned next experiment. This preview adapts Data Formulator rather than replacing its analysis engine.

## First user and task

A creator who has published multiple pieces of content, can supply a per-content table, and wants to compare their own series. The first question is: which series has stronger typical performance for my chosen objective, and does that observation survive removing the largest result?

Inputs are one account, one platform, and one declared measurement window per dataset. Titles and a view-count field are required. Series, publication dates, saves, and content-attributed new follows are optional; the user can edit series. Views are not reach or impressions, and total account followers are not content-attributed follows.

## Complete flow

1. Open a labeled synthetic film-creator sample or import CSV, TSV or XLSX.
2. Confirm column mapping, account, platform, measurement basis and window. Select the desired Excel sheet when applicable.
3. Choose views, saves or new follows. Compare per-post medians and effective sample counts; optionally remove exactly one highest observation per series.
4. Inspect the underlying content and edit series labels.
5. Read a rule-generated next-experiment card, write a plan, and export the review.
6. Enter NextHook's own exploration page. Compare series, inspect post distributions, or compare views with saves/follows in a scatter plot. Filter series, exclude one maximum per series, and click chart marks to inspect source records.
7. Append the current finding and its scope to the shared plan. Optional model questions interpret this comparison through NextHook's own question panel. Changing comparison context starts a fresh conversation. No original workbench handoff remains.

The sample is synthetic, not evidence of real creator outcomes. Its outlier intentionally demonstrates why mean and median rankings can differ. No model call is needed for the initial review.

## What the preview does not claim

The advice is descriptive and rule-based. It is not a numeric forecast or causal explanation. Recommendations require the user to confirm equal post-age windows and at least two series with three usable records each. This sample-count rule avoids ranking extremely small groups; it is not a significance test. Calendar-window and lifetime-snapshot datasets show descriptive comparisons only, because content has unequal opportunities to accumulate activity.

Platform-specific export schemas have not been validated against private creator accounts. Generic file mapping is functional, but it is not a claim that every platform export works unchanged. Missing metrics remain missing. No fake zero fill, auto-login, scraping, OAuth connectors, cross-account ranking, or comment ingestion is included.

## Differentiation hypothesis

Data Formulator already supports natural-language exploration. YouTube itself supports groups and comparisons. NextHook's hypothesis is that creator-specific objectives, explicit metric/window confirmation, inspectable comparisons and a next-experiment handoff reduce the effort of turning analytics into a creative decision. This remains a product hypothesis, not validated demand or demonstrated growth.
