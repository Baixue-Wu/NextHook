# NextHook

**Learn from past content. Shape what's next.**

NextHook adapts [Microsoft Data Formulator](https://github.com/microsoft/data-formulator) into a creator-focused review workflow. Import your own per-content table, compare content series, inspect the evidence and plan your next experiment. The current preview has a Chinese interface and a synthetic film-creator sample.

## Try locally

Requirements: Node 22+, Python 3.11+, uv, and Yarn Classic (available through Corepack).

```bash
corepack yarn install --frozen-lockfile
uv sync --frozen
corepack yarn build
uv run data_formulator --host 127.0.0.1 --port 5571 --data-dir .nexthook --disable-data-connectors --no-browser
```

Open **http://127.0.0.1:5571/**. On a remote machine, forward port 5571 through SSH or your editor. Keep this development preview on loopback.

Choose **体验影视创作者样例** to explore without an API key. The sample is deliberately synthetic and includes an outlier. Alternatively, upload CSV, TSV or XLSX and confirm the column mapping and observation window. XLSX parsing reuses Data Formulator's parser.

### What works

- Explicit account, platform, metric and observation-window confirmation.
- Views, saves or content-attributed new-follow comparisons by series.
- Per-post median, effective counts, missingness and optional exclusion of one maximum per group.
- Inspectable content records and editable series labels.
- Rule-generated next-experiment suggestions, saved plan and Markdown review export.
- **进入可视化探索**: open NextHook's own `/explore` page with series comparisons, individual-post distributions and paired-metric scatter plots. The previous `/app` URL also opens this creator interface.
- Click a chart mark to inspect the corresponding series or post, filter series, and save a finding with its evidence into the shared creation plan.
- Ask follow-up questions about the current comparison without leaving NextHook. Model configuration is optional; deterministic exploration works without it.

### Model-backed analysis

The creator review does not call a model. The exploration page offers optional, comparison-scoped questions using the reused model-settings component and model client. Configure a supported model there to ask questions. No credential is bundled. No live inference is claimed merely because the interface loads. Model responses interpret the supplied evidence; they do not execute arbitrary analysis or change the chart. Upstream model configuration and backend behavior are documented in [the retained upstream README](docs/upstream-readme.md).

Files are parsed and explored in your browser and stored there. Entering exploration does not upload the dataset. Sending an AI question sends the current comparison summaries, up to 50 plotted records, the selected record and the latest three conversation turns to the backend and selected model provider. The interface discloses this before sending. Runtime server data is under the explicit `--data-dir` and ignored by Git. Clearing the creator review does not remove server sessions created by earlier versions.

See [verification results and the actual UI screenshot](docs/verification.md) for tested behavior and remaining limits.

## Data compatibility

Start with one row per content item from one account and one platform. Title and view count are required; series, publication date, saves and content-attributed follows are optional. Remove summary/total rows. Confirm that views are not impressions or reach. Files up to 10 MB / 10,000 rows are accepted by the initial importer.

Platform-specific automatic adapters are **not yet verified**. YouTube's official manual export is documented; the other platforms have varying evidence/access limitations. See [the official-source audit](docs/platform-data-sources.md).

The preview describes past data and suggests another experiment. It does not predict viral content, prove causes, or estimate future view counts. See [scope and comparison rules](docs/product-scope.md).

## Development and checks

```bash
corepack yarn test:creator
corepack yarn typecheck
corepack yarn build
# With the local server running:
corepack yarn test:e2e
```

Browser tests require Chromium: `corepack yarn playwright install chromium` on a new machine. If your shell's `TMPDIR` points to an unavailable directory, run tests with `TMPDIR=/tmp`.

The upstream frontend dev command is `corepack yarn start` (its default API proxy targets port 5567). The single-server built preview above avoids a separate proxy configuration.

## Upstream and project structure

The upstream MIT license and Microsoft copyright are retained. The exact imported revision is in [upstream.json](docs/upstream.json); original project documentation is in [upstream-readme.md](docs/upstream-readme.md). NextHook is an independent adaptation, not a Microsoft product.

`src/nexthook/` contains creator-specific changes. The upstream modules and Python server remain in their original paths. The visible exploration interface belongs to NextHook: chart compilation reuses `assembleVegaChart` and Flint/Vega, and scoped questions reuse the upstream model client and error protocol. Product and technical decisions live in [docs/design-decisions.md](docs/design-decisions.md). Tests include new creator checks alongside the retained upstream suites.
