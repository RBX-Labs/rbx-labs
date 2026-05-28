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
- phone portrait
- phone landscape
- flip portrait
- fold portrait
- tablet portrait
- tablet landscape
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
- `network-guardian.html`

If a change is isolated to one page, validate that page first, then validate any obviously related page.

## Required Viewports
Use these sizes:
- phone portrait: `390x844`
- phone landscape: `844x390`
- flip portrait: `320x720`
- fold portrait: `673x841`
- tablet portrait: `768x1024`
- tablet landscape: `1024x768`
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

## Design Compare/Assess Workflow
When asked to compare or assess designs:
1. Produce a visual comparison board, not text-only feedback.
2. Default board format:
- six panels in a 3x2 matrix
- top row: before desktop, before tablet, before phone
- bottom row: after desktop, after tablet, after phone
3. Add concise callouts on the board for key changes (for example section rhythm, style variants, CTA hierarchy, mobile spacing).
4. Keep the assessment tied to rendered output across breakpoints, not source inspection.
5. If asked to "only show visually", return visual artifacts first and avoid code changes in that step.
6. Screenshot rule for design assessments:
- always use full-screen or full-section captures, not cropped snippets
- include dynamic UI/data states in captures when relevant (for example tables, telemetry graphs, expanded panels, active tabs)
- if a critical data surface is missing from a capture, re-render and include it before reporting

## Resume PDF Naming Rule
When generating or exporting any resume PDF, always name the output file exactly:
- `RishabhBanga_Resume.pdf`

Apply this naming consistently across all role-specific resume generation workflows.

## Resume Rejection Learnings
- Record every rejection with: company, role, country, date, stage reached, source artifact (email/screenshot/ATS status), and applied resume variant path.
- Geography triage rule:
  - US role: visa/work authorization can be treated as a potential primary filter.
  - Canada role: do not assume visa. Open a content/process investigation (JD-match gaps, missing keywords, seniority mismatch, location mismatch, application quality, timing, or recruiter availability) and document findings.
- Verified role-location checks tied to current rejection discussion:
  - Acumatica `Senior Product Manager - Reporting & Analytics`: external listings captured as `Montreal, Quebec, Canada` (Canada-based signal present).
  - CADchat `Product Manager/Head of Product`: external listing captured as `fully remote` with no clear Canada-only constraint in the captured artifact; treat as location-unconfirmed until official posting artifact is stored.
- Evidence-based resume-gap learning for Acumatica-style Reporting/Analytics roles:
  - When JD scope emphasizes ERP-native reporting ownership (for example GI/Reports/ARM/Dashboards/Pivots, reporting architecture modernization, and self-serve analytics), the resume must show explicit, named ownership of reporting/BI platform surfaces and large-scale analytics UX/performance outcomes.
  - If those explicit ERP/reporting markers are missing or only implicit, classify as probable content-positioning miss (not visa) for Canada-based outcomes.
- Time-investment protection rule:
  - If repeated PM applications are not converting, require a rejection-cause entry before generating the next broad resume wave.
