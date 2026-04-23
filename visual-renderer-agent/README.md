# Visual Renderer Agent

This repo includes an automated visual validation flow for the site.

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

## Evaluation Standard

The agent review is expected to check for:

- blocking issues first
- layout overlap
- broken stacking
- spacing regressions
- unreadable text
- obvious alignment failures

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
