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

## What It Does

The visual renderer agent runs in two stages:

1. `visual-renderer-agent/scripts/visual-render-validate.sh`
   - discovers every repo-root `.html` page automatically
   - renders each page at:
     - mobile `390x844`
     - tablet `768x1024`
     - desktop `1440x1100`
   - writes screenshots to `${TMPDIR:-/tmp}/rbx-responsive`
   - writes a screenshot manifest to `${TMPDIR:-/tmp}/rbx-responsive/manifest.txt`

2. `visual-renderer-agent/scripts/render-and-eval.sh`
   - runs the renderer
   - reads the manifest
   - builds the evaluation payload
   - invokes the local `codex` CLI non-interactively
   - attaches every generated screenshot to the evaluation request
   - requires a human-readable QA report with one `PASS` or `FAIL` line per HTML file plus a concise comments line

## Evaluation Standard

The agent review is expected to check for:

- blocking issues first
- layout overlap
- broken stacking
- spacing regressions
- unreadable text
- obvious alignment failures
- not the fact that a fixed-height viewport snapshot naturally ends mid-section or mid-card

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

Typical files look like:

- `index-mobile.html.png`
- `index-tablet.html.png`
- `index-desktop.html.png`
- `ai-training-mobile.html.png`

## Why This Exists

Source inspection is not enough for layout work. This flow exists to catch visual regressions in rendered output before commit, rather than assuming HTML/CSS changes are correct by inspection.

## Notes

- Page discovery is dynamic; there is no hard-coded page allowlist.
- The renderer covers top-level site pages only, meaning repo-root `.html` files.
- If lower-page sections or interactive states need deeper validation, the screenshots should be supplemented with targeted inspection.
