# Store Redirect Worker

Cloudflare Worker for platform-aware app-store redirects, browser fallback choices, and Stream Chat token minting.

## Routes

- `GET /open` -> platform redirect or store choice page
- `GET /u/:token` -> platform redirect or store choice page
- `GET /c/:token` -> platform redirect or store choice page
- `GET /k/:token` -> platform redirect or store choice page
- `POST /chat/token` -> validates the app auth token and returns a Stream Chat user token
- `GET /healthz` -> JSON health response

## Redirect Policy

- Android -> Google Play URL
- iOS (`iPhone`/`iPad`/`iPod`) -> TestFlight/App Store URL
- Other user agents -> HTML choice page with App Store and Google Play buttons

No query-param based redirect is supported (prevents open-redirect abuse). Share-link routes preserve the original resource type and token in the request path for app-link handling before the browser fallback reaches this worker.

## Stream Chat Token

`POST /chat/token`

Request:

```http
Authorization: Bearer <app-token>
idToken: <optional-id-token>
```

Response:

```json
{
  "token": "stream-user-jwt",
  "apiKey": "stream-public-api-key",
  "userId": "app-user-id",
  "expiresAt": 1714555555
}
```

The Worker validates the incoming app token through `AUTH_VERIFY_URL`, derives `userId` only from that verified response, and signs a one-hour Stream token with `STREAM_API_SECRET`.

The known public API base URL is:

```text
https://api.kampd.com
```

That base URL is not enough by itself. `AUTH_VERIFY_URL` must be a specific endpoint that validates the caller's `Authorization`/`idToken` and returns the authenticated user's canonical Mongo user id. A suitable endpoint would be:

```text
https://api.kampd.com/user/v1/profile
```

This endpoint has been checked publicly: it returns `401 {"error":"Missing Token"}` without auth and `401 {"error":"Invalid token"}` for fake auth, so it is behind the existing auth proxy. The Kubernetes deployment also runs `auth-proxy` in front of `user-service` with `ACCESS_VERIFICATION=enabled` and `IDENTITY_VERIFICATION=enabled`.

Use the existing Flutter API client headers when calling this Worker. The Worker forwards the auth/device headers needed by `/user/v1/profile`:

- `Authorization`
- `idToken`
- `User-Identity`
- `Device-Identity`
- `Device`
- `Device-Model`
- `System`
- `System-Version`
- `Device-Screen`
- `deviceIp`

Accepted verification response shapes include:

```json
{ "userId": "68958d4340ec8662569c641f" }
```

```json
{ "payload": { "user": { "id": "68958d4340ec8662569c641f" } } }
```

Required Worker settings:

- `STREAM_API_KEY` env var in `wrangler.toml`; fill in the Stream public key before deploy
- `AUTH_VERIFY_URL` env var in `wrangler.toml`
- `CHAT_CORS_ORIGIN` env var in `wrangler.toml`
- `STREAM_API_SECRET` secret

Set the secret with:

```bash
npm run secret:stream
```

Do not commit `STREAM_API_SECRET` to `wrangler.toml` or any env file.

## Deploy

From this directory:

```bash
npm run wrangler:login
npm run secret:stream
npm run deploy
```

These commands use `npx wrangler`, so a global `wrangler` install is not required.

## Test

From this directory:

```bash
npm test
```

Then in Cloudflare Worker settings:

1. Add custom domain route `rbx-labs.io/open`
2. Add custom domain route `rbx-labs.io/chat/token`
3. Add custom domain routes `rbx-labs.io/u/*`, `rbx-labs.io/c/*`, and `rbx-labs.io/k/*`
4. Add custom domain route `rbx-labs.io/healthz`

## Smoke Checks

```bash
curl -i -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)" https://rbx-labs.io/open
```

```bash
curl -i -A "Mozilla/5.0 (Linux; Android 14; Pixel 8)" https://rbx-labs.io/open
```

```bash
curl -i -A "Mozilla/5.0 (Linux; Android 14; Pixel 8)" https://rbx-labs.io/c/example-token
```

```bash
curl -i -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4)" https://rbx-labs.io/open
```

```bash
curl -i https://rbx-labs.io/healthz
```

```bash
curl -i -X POST https://rbx-labs.io/chat/token \
  -H "Authorization: <access-token>" \
  -H "idToken: <id-token>" \
  -H "User-Identity: <user-id>" \
  -H "Device-Identity: test-device" \
  -H "System: ios"
```
