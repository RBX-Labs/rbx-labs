const IOS_URL = "https://testflight.apple.com/join/fhduvPKr";
const ANDROID_URL =
  "https://play.google.com/store/apps/details?id=com.ecosystm.wekamp&hl=en-US&ah=W4rRfhkBJkUQummODFzAOlKDZgw";
const WEKAMP_LOGO_DATA_URI =
  "data:image/png;base64,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"
const SHARE_ROUTE_TYPES = new Set(["u", "c", "k"]);
const STREAM_TOKEN_TTL_SECONDS = 60 * 60;
const AUTH_VERIFY_FORWARD_HEADERS = [
  "authorization",
  "idtoken",
  "user-identity",
  "device-identity",
  "device",
  "device-model",
  "system",
  "system-version",
  "device-screen",
  "deviceip",
];

function pickRedirect(userAgent) {
  const ua = (userAgent || "").toLowerCase();
  if (ua.includes("android")) return { kind: "android", url: ANDROID_URL };
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    return { kind: "ios", url: IOS_URL };
  }
  return null;
}

function shareRoute(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return null;

  const [type, token] = parts;
  if (!SHARE_ROUTE_TYPES.has(type) || !token) return null;

  return { type, token };
}

function storeRedirect(request) {
  const target = pickRedirect(request.headers.get("user-agent"));
  if (target) return Response.redirect(target.url, 302);

  return storeChoicePage();
}

async function streamToken(request, env) {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }), env);
  }

  if (request.method !== "POST") {
    return withCors(json({ error: "Method not allowed" }, 405), env);
  }

  if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET || !env.AUTH_VERIFY_URL) {
    return withCors(json({ error: "Service not configured" }, 500), env);
  }

  try {
    const userId = await verifyAppAuth(request, env);
    if (!userId) {
      return withCors(json({ error: "Invalid auth token" }, 401), env);
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = now + STREAM_TOKEN_TTL_SECONDS;
    const token = await signStreamToken(userId, env.STREAM_API_SECRET, now, exp);

    return withCors(
      json({
        token,
        apiKey: env.STREAM_API_KEY,
        userId,
        expiresAt: exp,
      }),
      env,
    );
  } catch {
    return withCors(json({ error: "Internal error" }, 500), env);
  }
}

async function ensureStreamUser(request, env) {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }), env);
  }

  if (request.method !== "POST") {
    return withCors(json({ error: "Method not allowed" }, 405), env);
  }

  if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET || !env.AUTH_VERIFY_URL) {
    return withCors(json({ error: "Service not configured" }, 500), env);
  }

  try {
    const authenticatedUserId = await verifyAppAuth(request, env);
    if (!authenticatedUserId) {
      return withCors(json({ error: "Invalid auth token" }, 401), env);
    }

    const body = await readJson(request);
    if (body instanceof Response) return withCors(body, env);

    const userId = normalizeUserId(body.userId);
    if (!userId) {
      return withCors(json({ error: "Missing userId" }, 400), env);
    }

    const user = { id: userId };
    const streamRes = await upsertStreamUser(user, env);
    if (!streamRes.ok) {
      return withCors(json({ error: "Stream user upsert failed" }, 502), env);
    }

    return withCors(json({}), env);
  } catch {
    return withCors(json({ error: "Internal error" }, 500), env);
  }
}

async function dmChannelId(request, env) {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }), env);
  }

  if (request.method !== "POST") {
    return withCors(json({ error: "Method not allowed" }, 405), env);
  }

  if (!env.AUTH_VERIFY_URL) {
    return withCors(json({ error: "Service not configured" }, 500), env);
  }

  try {
    const authenticatedUserId = await verifyAppAuth(request, env);
    if (!authenticatedUserId) {
      return withCors(json({ error: "Invalid auth token" }, 401), env);
    }

    const body = await readJson(request);
    if (body instanceof Response) return withCors(body, env);

    const otherUserId = normalizeUserId(body?.otherUserId);
    if (!otherUserId) {
      return withCors(json({ error: "Missing otherUserId" }, 400), env);
    }

    const result = deterministicDmChannel(authenticatedUserId, otherUserId);
    if (!result) {
      return withCors(json({ error: "Invalid member ids" }, 400), env);
    }

    return withCors(json(result), env);
  } catch {
    return withCors(json({ error: "Internal error" }, 500), env);
  }
}

async function syncStreamProfile(request, env) {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }), env);
  }

  if (request.method !== "POST") {
    return withCors(json({ error: "Method not allowed" }, 405), env);
  }

  if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET || !env.AUTH_VERIFY_URL) {
    return withCors(json({ error: "Service not configured" }, 500), env);
  }

  try {
    const authenticatedUserId = await verifyAppAuth(request, env);
    if (!authenticatedUserId) {
      return withCors(json({ error: "Invalid auth token" }, 401), env);
    }

    const body = await readJson(request);
    if (body instanceof Response) return withCors(body, env);

    const user = streamUserFromBody({
      userId: authenticatedUserId,
      name: body?.name,
      image: body?.image,
    });
    if (!user) {
      return withCors(json({ error: "Missing user id" }, 401), env);
    }

    const streamRes = await upsertStreamUser(user, env);
    if (!streamRes.ok) {
      return withCors(json({ error: "Stream profile sync failed" }, 502), env);
    }

    return withCors(json({}), env);
  } catch {
    return withCors(json({ error: "Internal error" }, 500), env);
  }
}

async function verifyAppAuth(request, env) {
  const auth = request.headers.get("authorization") || "";
  if (!auth) return null;

  const verifyHeaders = authVerifyHeaders(request);

  const verifyRes = await fetch(env.AUTH_VERIFY_URL, {
    method: "GET",
    headers: verifyHeaders,
  });

  if (!verifyRes.ok) return null;

  const profile = await verifyRes.json();
  return extractUserId(profile);
}

async function readJson(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return json({ error: "Malformed JSON" }, 400);
  }
}

function streamUserFromBody(body) {
  if (!body || typeof body !== "object") return null;

  const userId = normalizeUserId(body.userId);
  if (!userId) return null;

  const user = { id: userId };
  if (typeof body.name === "string" && body.name.trim()) {
    user.name = body.name.trim();
  }
  if (typeof body.image === "string" && body.image.trim()) {
    user.image = body.image.trim();
  }
  return user;
}

function normalizeUserId(value) {
  if (typeof value !== "string") return "";
  const userId = value.trim();
  if (!userId || userId.length > 255 || userId.includes(":")) return "";
  return userId;
}

function deterministicDmChannel(userIdA, userIdB) {
  const first = normalizeUserId(userIdA);
  const second = normalizeUserId(userIdB);
  if (!first || !second || first === second) return null;

  const memberIds = [first, second].sort();
  const channelId = `dm_${memberIds[0]}_${memberIds[1]}`;
  return {
    channelType: "messaging",
    channelId,
    cid: `messaging:${channelId}`,
    memberIds,
  };
}

async function upsertStreamUser(user, env) {
  const token = await signStreamServerToken(env.STREAM_API_SECRET);
  const baseUrl = (env.STREAM_CHAT_BASE_URL || "https://chat.stream-io-api.com").replace(/\/+$/, "");
  const url = `${baseUrl}/users?api_key=${encodeURIComponent(env.STREAM_API_KEY)}`;

  return fetch(url, {
    method: "POST",
    headers: {
      "authorization": token,
      "content-type": "application/json",
      "stream-auth-type": "jwt",
    },
    body: JSON.stringify({
      users: {
        [user.id]: user,
      },
    }),
  });
}

function authVerifyHeaders(request) {
  const headers = new Headers();
  for (const name of AUTH_VERIFY_FORWARD_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

function extractUserId(profile) {
  if (!profile || typeof profile !== "object") return null;

  const candidates = [
    profile.userId,
    profile.id,
    profile._id,
    profile.user_id,
    profile.payload?.userId,
    profile.payload?.id,
    profile.payload?._id,
    profile.payload?.user_id,
    profile.payload?.user?.id,
    profile.payload?.user?._id,
    profile.payload?.user?.userId,
    profile.payload?.user?.user_id,
    profile.data?.userId,
    profile.data?.id,
    profile.data?._id,
    profile.data?.user_id,
    profile.data?.user?.id,
    profile.data?.user?._id,
    profile.data?.user?.userId,
    profile.data?.user?.user_id,
  ];

  const userId = candidates.find((value) => typeof value === "string" && value);
  return userId || null;
}

async function signStreamToken(userId, secret, issuedAt, expiresAt) {
  return signJwt({ user_id: userId, iat: issuedAt, exp: expiresAt }, secret);
}

async function signStreamServerToken(secret) {
  const now = Math.floor(Date.now() / 1000);
  return signJwt({ server: true, iat: now, exp: now + STREAM_TOKEN_TTL_SECONDS }, secret);
}

async function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function base64UrlEncode(value) {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function withCors(response, env) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", env.CHAT_CORS_ORIGIN || "https://rbx-labs.io");
  headers.set("access-control-allow-methods", "POST, OPTIONS");
  headers.set(
    "access-control-allow-headers",
    "authorization, content-type, idtoken, user-identity, device-identity, device, device-model, system, system-version, device-screen, deviceip",
  );
  headers.set("vary", "Origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function storeChoicePage() {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>WeKamp Early Access</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #18362b;
      --muted: #4d685d;
      --line: #d8e6dd;
      --leaf: #204b38;
      --mint: #7ec8a4;
      --wash: #f3f8f5;
      --paper: #ffffff;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        linear-gradient(180deg, rgba(126, 200, 164, 0.18), rgba(243, 248, 245, 0) 34%),
        var(--wash);
      color: var(--ink);
    }

    main {
      min-height: 100vh;
      width: min(100%, 760px);
      margin: 0 auto;
      padding: 40px 20px;
      display: grid;
      align-content: center;
      gap: 28px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 750;
    }

    .mark {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: block;
      object-fit: cover;
      box-shadow: 0 8px 18px rgba(24, 54, 43, 0.14);
    }

    .panel {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--paper);
      padding: clamp(24px, 6vw, 44px);
      box-shadow: 0 18px 42px rgba(24, 54, 43, 0.08);
    }

    h1 {
      margin: 0;
      max-width: 12ch;
      font-size: clamp(36px, 7vw, 56px);
      line-height: 1;
      letter-spacing: 0;
    }

    p {
      margin: 18px 0 0;
      max-width: 58ch;
      color: var(--muted);
      font-size: 17px;
      line-height: 1.55;
    }

    .actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 28px;
    }

    .store-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 54px;
      min-width: 178px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 14px;
      background: #f8fcfa;
      color: var(--ink);
      text-decoration: none;
      line-height: 1;
      width: fit-content;
      box-shadow: 0 8px 18px rgba(24, 54, 43, 0.06);
    }

    .store-badge:focus-visible {
      outline: 3px solid rgba(126, 200, 164, 0.75);
      outline-offset: 3px;
    }

    .store-badge:hover {
      border-color: rgba(6, 79, 34, 0.32);
      background: #eef8f2;
    }

    .platform-icon {
      width: 24px;
      height: 24px;
      flex: 0 0 24px;
      color: #064f22;
    }

    .platform-copy {
      display: block;
      text-align: left;
    }

    .platform-eyebrow {
      display: block;
      color: var(--muted);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .platform-name {
      display: block;
      margin-top: 3px;
      color: var(--ink);
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0;
    }

    @media (max-width: 560px) {
      main { padding: 28px 16px; }
      .actions { grid-template-columns: 1fr; }
      .panel { padding: 24px; }
      .store-badge { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <main>
    <div class="brand" aria-label="WeKamp">
      <img class="mark" src="${WEKAMP_LOGO_DATA_URI}" alt="" width="44" height="44">
      <span>WeKamp</span>
    </div>

    <section class="panel" aria-labelledby="title">
      <h1 id="title">You're in!!!</h1>
      <p>WeKamp Early Access</p>
      <div class="actions">
        <a class="store-badge app-store" href="${IOS_URL}" aria-label="Download WeKamp on the App Store">
          <svg class="platform-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M16.6 13.1c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 6.9 1.1 9.1.8 1.1 1.7 2.3 2.9 2.3s1.6-.7 3-.7 1.8.7 3 .7 2.1-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.2-2.6 0 0-2.7-1-2.7-3.7ZM14.4 6.5c.6-.8 1.1-1.8.9-2.9-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.7-.9 2.7 1 .1 2-.5 2.6-1.1Z"/>
          </svg>
          <span class="platform-copy">
            <span class="platform-eyebrow">Download on the</span>
            <span class="platform-name">App Store</span>
          </span>
        </a>
        <a class="store-badge google-play" href="${ANDROID_URL}" aria-label="Get WeKamp on Google Play">
          <svg class="platform-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#34a853" d="M4.4 3.3c-.2.2-.4.5-.4.9v15.6c0 .4.1.7.4.9l8.8-8.7v-.1L4.4 3.3Z"/>
            <path fill="#4285f4" d="m13.2 11.9 2.8-2.8-10.6-6 7.8 8.8Z"/>
            <path fill="#fbbc04" d="m13.2 12.1-7.8 8.8 10.6-6-2.8-2.8Z"/>
            <path fill="#ea4335" d="m16 9.1-2.8 2.8v.2l2.8 2.8 3.5-2c1-.6 1-1.4 0-2L16 9.1Z"/>
          </svg>
          <span class="platform-copy">
            <span class="platform-eyebrow">Get it on</span>
            <span class="platform-name">Google Play</span>
          </span>
        </a>
      </div>
    </section>
  </main>
</body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    },
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return Response.json({
        ok: true,
        service: "store-redirect-worker",
        routes: [
          "/open",
          "/chat/token",
          "/chat/ensure-user",
          "/chat/dm-channel-id",
          "/chat/sync-profile",
          "/u/:token",
          "/c/:token",
          "/k/:token",
          "/healthz",
        ],
      });
    }

    if (url.pathname === "/chat/token") {
      return streamToken(request, env);
    }

    if (url.pathname === "/chat/ensure-user") {
      return ensureStreamUser(request, env);
    }

    if (url.pathname === "/chat/dm-channel-id") {
      return dmChannelId(request, env);
    }

    if (url.pathname === "/chat/sync-profile") {
      return syncStreamProfile(request, env);
    }

    if (url.pathname === "/open") {
      return storeRedirect(request);
    }

    if (shareRoute(url.pathname)) {
      return storeRedirect(request);
    }

    return new Response("Not found", { status: 404 });
  },
};

export {
  deterministicDmChannel,
  dmChannelId,
  ensureStreamUser,
  extractUserId,
  normalizeUserId,
  signStreamServerToken,
  signStreamToken,
  syncStreamProfile,
  streamToken,
  streamUserFromBody,
  upsertStreamUser,
};
