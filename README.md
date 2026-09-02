# RBX Labs

RBX Labs is a founder-led applied AI studio focused on AI product judgment,
trustworthy systems, research, and practical adoption.

Live site: [rbx-labs.io](https://rbx-labs.io/)

## Site structure

- `index.html` — RBX Labs home
- `about.html` — studio and founder context
- `approach.html` — working method
- `research.html` and `research/` — research and practice work
- `ai-training.html` and `GAIL/` — training and study materials
- `network-guardian*` and `network-guardian/` — Network Guardian product pages
- `wekamp/` — WeKamp product and community operating pages
- `fossy-runtime-trust-kit/` — runtime trust research kit
- `wfpst-workshop.html` — Trustworthy Agentic AI workshop

## Shared site behavior

The static pages use the shared theme layer:

- `site-theme-toggle.js` — system-aware Light/Dark selection with local persistence
- `site-theme-toggle.css` — shared toggle styling and standalone-page theme tokens
- `styles.css` — core RBX Labs layout, typography, surfaces, and responsive rules

Pages with their own visual systems retain their local styles while using the
same theme preference (`rbx-theme`) where supported. The default follows the
visitor's operating-system preference until they make a selection.

## Publishing

The site is a static GitHub Pages deployment from the `main` branch of the
`RBX-Labs/rbx-labs` repository. No build step is required for the core HTML
pages.

Before publishing a change:

1. Check the changed HTML and CSS with `git diff --check`.
2. Verify representative live routes return HTTP 200.
3. Visually check both Light and Dark states for shared pages and any page with
   a custom visual system.

## Related internal notes

`rbx-labs.md` contains working brand, research, product, and QA notes. It is
maintained separately from this public-facing project overview.
