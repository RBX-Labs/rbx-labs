# Visual Renderer Agent

This repo includes an automated visual validation flow for the site.

## Setup

This renderer setup is currently macOS-only because screenshot generation depends on `qlmanage` (Quick Look).

To use this flow locally:

1. Make sure the scripts are executable:

```sh
chmod +x visual-renderer-agent/scripts/visual-render-validate.sh
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
visual-renderer-agent/scripts/visual-render-validate.sh
```

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

## Evaluation Standard

The visual review is expected to check for:

- concept fidelity first, not only runtime breakage
- approved logo lockup usage and the absence of unofficial/fallback shields
- icon-system fidelity, including icon size and emphasis relative to the concept
- blocking issues first
- layout overlap
- broken stacking
- spacing regressions
- unreadable text
- obvious alignment failures
- not the fact that a fixed-height viewport snapshot naturally ends mid-section or mid-card

Automated render review is necessary but not sufficient. Like the stronger WeKamp mobile flow, this renderer must be treated as a smoke-and-fidelity aid, and significant presentation changes still require explicit human comparison against the approved concept board.

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

The hook can run:

```sh
visual-renderer-agent/scripts/visual-render-validate.sh
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
