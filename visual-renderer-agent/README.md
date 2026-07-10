# Visual Renderer Agent

This repo includes an automated visual validation flow for the site.

## Setup

This renderer setup is currently macOS-only because screenshot generation depends on `qlmanage` (Quick Look).

To use this flow locally:

1. Make sure the scripts are executable:

```sh
chmod +x visual-renderer-agent/scripts/visual-render-validate.sh
chmod +x visual-renderer-agent/scripts/render-and-eval.sh
chmod +x .githooks/pre-commit
```

2. Make sure the local tools exist:

- `qlmanage` for screenshot generation on macOS
- `codex` CLI for the non-interactive agent review step. The script uses `CODEX_BIN` when set, otherwise it resolves `codex` from `PATH`.

3. Point Git at the repo hook directory if it is not already configured:

```sh
git config core.hooksPath .githooks
```

4. Run the flow manually if you want to test it before commit:

```sh
visual-renderer-agent/scripts/render-and-eval.sh
```

If you only want screenshots without agent review, run:

```sh
visual-renderer-agent/scripts/visual-render-validate.sh
```

To export a reusable PNG mockup artifact for Network Guardian after rendering:

```sh
visual-renderer-agent/scripts/export-ng-mockup.sh
```

`export-ng-mockup.sh` uses headless Chrome for the full-length mockup export, because macOS `qlmanage` thumbnails are capped and can cut off lower sections/footer.

To capture animated SVG assets into raw WebM clips for branding/video prep:

```sh
node visual-renderer-agent/scripts/capture-svg-webm.cjs
```

This writes raw clips to:

```sh
/private/tmp/ng_hero_light_raw.webm
/private/tmp/ng_tel_raw.webm
/private/tmp/ng_tel_light_raw.webm
```

## What It Does

The visual renderer agent runs in two stages:

1. `visual-renderer-agent/scripts/visual-render-validate.sh`
   - discovers every repo-root `.html` page automatically
   - renders each page at:
     - phone portrait `390x844`
     - phone landscape `844x390`
     - flip portrait `320x720`
     - fold portrait `673x841`
     - tablet portrait `768x1024`
     - tablet landscape `1024x768`
     - desktop `1440x1100`
   - emits two PNG variants per breakpoint:
     - viewport capture: `page-breakpoint-theme.html.png`
     - full-length capture: `page-breakpoint-theme-full.html.png`
   - captures both theme variants explicitly using `qa_theme=dark` and `qa_theme=light`
   - writes screenshots to `${TMPDIR:-/tmp}/rbx-responsive`
   - writes a screenshot manifest to `${TMPDIR:-/tmp}/rbx-responsive/manifest.txt`

2. `visual-renderer-agent/scripts/render-and-eval.sh`
   - runs the renderer
   - reads the manifest
   - builds the evaluation payload
   - invokes the local `codex` CLI non-interactively
   - attaches every generated screenshot to the evaluation request
   - attaches concept-board and icon-system reference images when present
  - requires a human-readable QA report with one `PASS` or `FAIL` line per HTML file plus a concise comments line

Additional always-on audits run as part of stage 1:

- `visual-renderer-agent/scripts/network-perf-audit.sh`
  - compares paired SVG/PNG branding assets
  - reports low-network vs fast-network transfer estimates
  - writes `${TMPDIR:-/tmp}/rbx-responsive/network-performance-report.txt`

- `visual-renderer-agent/scripts/runtime-resilience-audit.sh`
  - validates local asset references resolve on disk
  - verifies reveal fail-safe guardrails exist in JS and CSS
  - verifies theme icon exclusivity rules exist (prevents dark+light overlap)
  - writes `${TMPDIR:-/tmp}/rbx-responsive/runtime-resilience-report.txt`
  - must report `Overall: PASS` or `render-and-eval.sh` exits early

- `visual-renderer-agent/scripts/concept-parity-audit.sh`
  - enforces section-level concept checks for Network Guardian:
    - hero line structure and clipping guard
    - metric-row target parity (`78/100`)
    - How We Operate icon sizing floor
    - Live System Overview right-column icon-source and sizing checks
    - trust-row typography scale/tracking checks
  - writes `${TMPDIR:-/tmp}/rbx-responsive/concept-parity-report.txt`
  - must report `Overall: PASS` or `render-and-eval.sh` exits early

- `visual-renderer-agent/scripts/lighthouse-style-audit.sh`
  - runs a local Lighthouse performance audit for `network-guardian.html` (mobile + desktop) when the `lighthouse` CLI is available
  - always writes `${TMPDIR:-/tmp}/rbx-responsive/lighthouse-style-report.txt`
  - when Lighthouse CLI is unavailable, falls back to static Lighthouse-style checks:
    - reduced-motion guard presence
    - hidden-tab animation pause lifecycle guard
    - fallback PNG payload size check
    - head-blocking script check

- `visual-renderer-agent/scripts/media-fidelity-audit.sh`
  - validates critical hero/telemetry `.webm` assets for:
    - expected resolution
    - first-frame luminance range (catches near-blank dark exports)
  - writes `${TMPDIR:-/tmp}/rbx-responsive/media-fidelity-report.txt`
  - must report `Overall: PASS` or `render-and-eval.sh` exits early

## Evaluation Standard

The agent review is expected to check for:

- concept fidelity first, not only runtime breakage
- approved logo lockup usage and the absence of unofficial/fallback shields
- icon-system fidelity, including icon size and emphasis relative to the concept
- connectivity impact awareness (via generated low/fast transfer report)
- runtime resilience to single-JS-failure states and stale cache outcomes
- blocking issues first
- layout overlap
- broken stacking
- spacing regressions
- unreadable text
- obvious alignment failures
- not the fact that a fixed-height viewport snapshot naturally ends mid-section or mid-card

Automated render review is necessary but not sufficient. Like the stronger WeKamp mobile flow, this renderer must be treated as a smoke-and-fidelity aid, and significant presentation changes still require explicit human comparison against the approved concept board.

Current Network Guardian references:

- Concept board image: `assets/ng-ui-revamp-concepts-dark-light.png`
- Icon system: `assets/branding/reference/ng_icon_system.png`
- Concept HTML companion: `network-guardian-concept-v2.html`

The expected report shape is:

- `Visual QA Summary`
- `Blocking issues: <number>`
- `Overall result: PASS or FAIL`
- one line per HTML file in the form `file.html: PASS or FAIL`
- one `Comments:` line under each file

## Hook Integration

The git hook at `.githooks/pre-commit` triggers this flow automatically when relevant frontend files change, including:

- `.html`
- `.css`
- `.js`
- common image asset formats

The hook intentionally ignores changes that are only inside:

- `wekamp-cloudflare-workers/**`

The hook runs:

```sh
visual-renderer-agent/scripts/render-and-eval.sh
```

This is a Git `pre-commit` hook. It runs for normal terminal commits and for commits started from VS Code's Source Control UI, as long as this repo has `core.hooksPath` set to `.githooks`. It is skipped only when the commit is created with `--no-verify` or an equivalent "no verify" option.

Check hook activation with:

```sh
git config --get core.hooksPath
```

Expected output:

```sh
.githooks
```

## Output

Generated screenshots are written to:

```sh
${TMPDIR:-/tmp}/rbx-responsive
```

The manifest is written to:

```sh
${TMPDIR:-/tmp}/rbx-responsive/manifest.txt
```

Reusable mockup exports are written to:

```sh
assets/mockups/network-guardian-mockup-desktop.png
assets/mockups/network-guardian-mockup-desktop-YYYY-MM-DD.png
assets/mockups/network-guardian-mockup-desktop-full.png
assets/mockups/network-guardian-mockup-desktop-full-YYYY-MM-DD.png
```

Typical files look like:

- `index-phone-portrait.html.png`
- `index-phone-portrait-dark.html.png`
- `index-phone-portrait-light.html.png`
- `index-phone-landscape-dark-full.html.png`
- `index-tablet-landscape-light-full.html.png`
- `ai-training-desktop-dark.html.png`

## Why This Exists

Source inspection is not enough for layout work. This flow exists to catch visual regressions in rendered output before commit, rather than assuming HTML/CSS changes are correct by inspection.

## Notes

- Page discovery is dynamic; there is no hard-coded page allowlist.
- The renderer covers top-level site pages only, meaning repo-root `.html` files.
- If lower-page sections or interactive states need deeper validation, the screenshots should be supplemented with targeted inspection.
