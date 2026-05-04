# Store Redirect Worker

Cloudflare Worker for platform-aware app-store redirects, browser fallback choices, Stream Chat token minting, and Stream user provisioning.

## Routes

- `GET /open` -> platform redirect or store choice page
- `GET /u/:token` -> platform redirect or store choice page
- `GET /c/:token` -> platform redirect or store choice page
- `GET /k/:token` -> platform redirect or store choice page
- `POST /chat/token` -> validates the app auth token and returns a Stream Chat user token
- `POST /chat/ensure-user` -> validates the app auth token and upserts a Stream Chat user
- `POST /chat/dm-channel-id` -> returns the canonical deterministic 1:1 DM channel id
- `POST /chat/sync-profile` -> syncs the authenticated user's Stream profile fields
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

## Stream Chat Ensure User

`POST /chat/ensure-user`

Request:

```http
Authorization: <access-token>
idToken: <id-token>
User-Identity: <caller-user-id>
Device-Identity: <device-id>
System: ios
Content-Type: application/json
```

```json
{
  "userId": "target-mongo-style-user-id"
}
```

Response:

```json
{}
```

The route authenticates the caller through the same `AUTH_VERIFY_URL` flow as `/chat/token`, then upserts only the requested `userId` into Stream using a server-side Stream REST call signed with `STREAM_API_SECRET`. The `userId` must be the same Mongo-style id used in DM channel `members`. This route intentionally ignores `name` and `image`; profile fields should be changed only through `/chat/sync-profile` for the authenticated user.

## Stream Chat DM Channel ID

`POST /chat/dm-channel-id`

Request:

```http
Authorization: <access-token>
idToken: <id-token>
Content-Type: application/json
```

```json
{
  "otherUserId": "target-mongo-style-user-id"
}
```

Response:

```json
{
  "channelType": "messaging",
  "channelId": "dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37",
  "cid": "messaging:dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37",
  "memberIds": ["68958d4340ec8662569c641f", "68da010a706dfc75b410fa37"]
}
```

The route derives the caller id from verified auth, accepts only the other user id, sorts the two ids, and returns `dm_<lowerId>_<higherId>`. Frontend should use this `channelId` when opening 1:1 DMs to prevent duplicate channels for the same pair.

## Stream Chat Sync Profile

`POST /chat/sync-profile`

Request:

```http
Authorization: <access-token>
idToken: <id-token>
Content-Type: application/json
```

```json
{
  "name": "Optional display name",
  "image": "https://optional.example/avatar.png"
}
```

Response:

```json
{}
```

The route derives the current user id from verified auth and upserts that user into Stream with the latest `name` and/or `image`. The request body cannot override the user id.

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
3. Add custom domain route `rbx-labs.io/chat/ensure-user`
4. Add custom domain route `rbx-labs.io/chat/dm-channel-id`
5. Add custom domain route `rbx-labs.io/chat/sync-profile`
6. Add custom domain routes `rbx-labs.io/u/*`, `rbx-labs.io/c/*`, and `rbx-labs.io/k/*`
7. Add custom domain route `rbx-labs.io/healthz`

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

```bash
curl -i -X POST https://rbx-labs.io/chat/ensure-user \
  -H "Authorization: <access-token>" \
  -H "idToken: <id-token>" \
  -H "User-Identity: <caller-user-id>" \
  -H "Device-Identity: test-device" \
  -H "System: ios" \
  -H "Content-Type: application/json" \
  --data '{"userId":"<target-user-id>"}'
```

```bash
curl -i -X POST https://rbx-labs.io/chat/dm-channel-id \
  -H "Authorization: <access-token>" \
  -H "idToken: <id-token>" \
  -H "Content-Type: application/json" \
  --data '{"otherUserId":"<target-user-id>"}'
```

```bash
curl -i -X POST https://rbx-labs.io/chat/sync-profile \
  -H "Authorization: <access-token>" \
  -H "idToken: <id-token>" \
  -H "Content-Type: application/json" \
  --data '{"name":"Optional Name","image":"https://example.com/avatar.png"}'
```

For live Stream REST verification after deploy:

1. Call `/chat/ensure-user` with a real target user id and expect `200 {}`.
2. Call `/chat/sync-profile` for the logged-in user and expect `200 {}`.
3. Confirm both users appear in the Stream dashboard or can be queried by the Stream client.
