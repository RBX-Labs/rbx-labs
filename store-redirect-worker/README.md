# Store Redirect Worker (`rbx-labs.io/open`)

This Worker serves platform-aware store redirects for WeKamp email CTAs.

## Behavior

- `GET /open`
  - Android user-agent -> Google Play URL
  - iOS user-agent -> TestFlight/App Store URL
  - Any other user-agent -> iOS fallback
- `GET /healthz`
  - Returns `200` JSON health response.

No query-based redirect targets are accepted (prevents open-redirect abuse).

## Deploy (Cloudflare)

From this folder:

```bash
nvm install 20
nvm use 20
npx -y wrangler@latest login
npx -y wrangler@latest deploy
```

Notes:
- Homebrew `wrangler` is disabled and should not be used.
- Avoid Node 25+ for this flow; use Node 20 LTS.

## Route Binding (important)

In Cloudflare Workers routes, bind:

- `rbx-labs.io/open*` -> `store-redirect-worker`
- `rbx-labs.io/healthz*` -> `store-redirect-worker`

This is HTTP route matching at Cloudflare edge, not DNS path routing.

## Smoke Tests

```bash
curl -i -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)" https://rbx-labs.io/open
```

```bash
curl -i -A "Mozilla/5.0 (Linux; Android 14; Pixel 8)" https://rbx-labs.io/open
```

```bash
curl -i https://rbx-labs.io/healthz
```

Expected:
- `/open` returns `302` with correct `Location`
- `/healthz` returns `200` JSON
