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
- `POST /chat/group-channel-id` -> validates group members, upserts Stream users, and returns the canonical group channel id
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
  "userId": "68958d4340ec8662569c641f"
}
```

Response:

```json
{}
```

The route authenticates the caller through the same `AUTH_VERIFY_URL` flow as `/chat/token`, validates `userId` as a Mongo ObjectId (`/^[a-fA-F0-9]{24}$/`), then calls `GET ${USER_PROFILE_URL}/${userId}` with the same auth headers. It upserts the Stream user only when the backend confirms the target exists and `canMessage` is allowed. Stream profile fields come from backend-owned `payload.user.fullName` and `payload.user.avatar`; caller-supplied `name` and `image` are ignored.

Failure responses:

- `400 {"error":"Missing userId"}` for missing or invalid target ids
- `401 {"error":"Invalid auth token"}` for failed caller auth
- `403 {"error":"Messaging target is not allowed"}` when backend profile rules disallow messaging
- `404 {"error":"Target user not found"}` when the target user does not exist
- `502 {"error":"Target user lookup failed"}` when the backend profile response is unavailable or malformed

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
  "otherUserId": "68958d4340ec8662569c641f"
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

The route derives the caller id from verified auth, accepts only the other user id, validates both as Mongo ObjectIds (`/^[a-fA-F0-9]{24}$/`), lowercases them, sorts the two ids, and returns `dm_<lowerId>_<higherId>`. Frontend should use this `channelId` when opening 1:1 DMs to prevent duplicate channels for the same pair.

## Stream Chat Group Channel ID

`POST /chat/group-channel-id`

Request:

```http
Authorization: <access-token>
idToken: <id-token>
Content-Type: application/json
```

```json
{
  "groupId": "681112223333444455556666",
  "memberIds": [
    "68958d4340ec8662569c641f",
    "67f30c04dcfb927c52fba1f4"
  ]
}
```

Response:

```json
{
  "channelType": "messaging",
  "channelId": "group_681112223333444455556666",
  "cid": "messaging:group_681112223333444455556666",
  "memberIds": [
    "67f30c04dcfb927c52fba1f4",
    "68958d4340ec8662569c641f",
    "68da010a706dfc75b410fa37"
  ]
}
```

The route derives the caller id from verified auth and includes it automatically. `memberIds` must contain the other users only; including the caller returns `400 {"error":"Caller must not be included in memberIds"}`. `groupId` and all `memberIds` must be Mongo ObjectIds. The route requires at least 3 total members, caps groups at 50 total members, validates each member through `GET ${USER_PROFILE_URL}/${memberId}`, and upserts all valid Stream users with backend-owned profile fields before returning the channel contract.

The `channelId` is derived from the server-owned group id: `group_<groupId>`. This allows multiple separate groups with the same exact members, as long as each group has a different backend-owned `groupId`. Frontend should not invent `groupId`; it should come from the backend object for the chat room, Kamp, event, project, or team.

Current limitation: group creation currently validates each member's profile and `canMessage` flags independently. It does not enforce group-level authorization such as "same Kamp", "same org", or "caller can invite this exact set". Reconsider this later with a backend endpoint such as `POST /chat/v1/group/validate-members` if group membership needs stronger business rules.

After deploy, run one live smoke test with real auth against Cloudflare + Go profile + Stream for this route. Unit tests cover the Worker behavior, but they do not prove the deployed route, auth proxy headers, backend profile response, and Stream REST call all work together.

## Stream Chat Sync Profile

`POST /chat/sync-profile`

Request:

```http
Authorization: <access-token>
idToken: <id-token>
Content-Type: application/json
```

```json
{}
```

Response:

```json
{}
```

The route derives the current user id from verified auth, looks up `GET ${USER_PROFILE_URL}/${currentUserId}`, and upserts Stream with backend-owned `payload.user.fullName` and `payload.user.avatar`. Caller-supplied `name`, `image`, or `userId` values are ignored.

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
- `USER_PROFILE_URL` env var in `wrangler.toml`
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
5. Add custom domain route `rbx-labs.io/chat/group-channel-id`
6. Add custom domain route `rbx-labs.io/chat/sync-profile`
7. Add custom domain routes `rbx-labs.io/u/*`, `rbx-labs.io/c/*`, and `rbx-labs.io/k/*`
8. Add custom domain route `rbx-labs.io/healthz`

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
  --data '{"userId":"68958d4340ec8662569c641f"}'
```

Expected Stream upsert behavior: the Worker looks up `https://api.kampd.com/user/v1/profile/68958d4340ec8662569c641f` and upserts Stream with backend-owned `id`, `fullName`, and `avatar`. A target blocked by profile rules should return `403`; a non-existent target should return `404`.

```bash
curl -i -X POST https://rbx-labs.io/chat/dm-channel-id \
  -H "Authorization: <access-token>" \
  -H "idToken: <id-token>" \
  -H "Content-Type: application/json" \
  --data '{"otherUserId":"68958d4340ec8662569c641f"}'
```

```bash
curl -i -X POST https://rbx-labs.io/chat/sync-profile \
  -H "Authorization: <access-token>" \
  -H "idToken: <id-token>" \
  -H "Content-Type: application/json" \
  --data '{}'
```

For live Stream REST verification after deploy:

1. Call `/chat/ensure-user` with a real target user id and expect `200 {}`.
2. Call `/chat/sync-profile` for the logged-in user and expect `200 {}`.
3. Confirm both users appear in the Stream dashboard or can be queried by the Stream client.
