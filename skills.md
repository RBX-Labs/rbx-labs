# Visual Render Test Skill

## Trigger
Run this workflow after any HTML, CSS, JS, image, copy, layout, spacing, or interaction change in this repo.

This repo also includes an executable render script and pre-commit hook:
- script: `visual-renderer-agent/scripts/visual-render-validate.sh`
- wrapper: `visual-renderer-agent/scripts/render-and-eval.sh`
- hook: `.githooks/pre-commit`

The hook skips pure changes under:
- `wekamp-cloudflare-workers/**`

For a stronger browser-backed validation layer, use an MCP-backed browser tool next:
- `Playwright MCP` for browser validation
- `Chrome DevTools MCP` for page inspection

This is a required validation routine, not an optional cleanup step.

## Goal
Validate the rendered site visually across:
- mobile
- tablet
- desktop

Do not rely on source inspection alone when a change affects presentation.

## Required Pages
Always validate every repo-root `.html` page that the site serves.

At the moment that includes pages such as:
- `index.html`
- `ai-training.html`
- `approach.html`
- `about.html`
- `code-in-place.html`
- `removed product.html`

If a change is isolated to one page, validate that page first, then validate any obviously related page.

## Required Viewports
Use these sizes:
- mobile: `390x844`
- tablet: `768x1024`
- desktop: `1440x1100`

## Required Validation Standard
For every relevant page:
1. Render the page at the required viewport sizes.
2. Inspect the actual rendered output, not just the source.
3. Check hero, nav, CTA stack, cards, spacing, and alignment.
4. If the change affects lower-page sections, render that section directly.
5. If the change affects hover or expandable UI, force the relevant state visible and render it directly.

## Lower-Section Rule
Top-of-page validation is not enough when the change is below the fold.

For case studies, long sections, legends, diagrams, card states, or footer CTA work:
- isolate the affected section
- render that section directly
- expand hidden states when needed

## Must Catch
Look specifically for:
- clipped legends
- overflow
- dead space
- misaligned pills
- mismatched card widths
- cropped images
- broken wrapping
- off-center panels
- hover/focus content that breaks when opened
- mobile CTA stacking issues

## Reporting Rule
When reporting validation:
- say what was visually validated
- say what was only source-checked
- say what could not be rendered if anything failed

Do not claim a visual fix is verified unless the rendered output was actually inspected.

## Working Rule
If a render reveals a layout issue:
- fix it
- rerender
- recheck

Do not stop at “source looks correct.”
