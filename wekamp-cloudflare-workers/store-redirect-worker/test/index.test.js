import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import worker, {
  deterministicDmChannel,
  extractUserId,
  normalizeUserId,
  signStreamServerToken,
  signStreamToken,
  streamUserFromBody,
} from "../src/index.js";

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
  });
}

const env = {
  STREAM_API_KEY: "stream-key",
  STREAM_API_SECRET: "stream-secret",
  AUTH_VERIFY_URL: "https://api.kampd.com/auth/v1/me",
  CHAT_CORS_ORIGIN: "https://rbx-labs.io",
};

afterEach(() => {
  globalThis.fetch = undefined;
});

describe("extractUserId", () => {
  it("reads user id from common backend response shapes", () => {
    assert.equal(extractUserId({ userId: "u1" }), "u1");
    assert.equal(extractUserId({ payload: { user: { id: "u2" } } }), "u2");
    assert.equal(extractUserId({ data: { user_id: "u3" } }), "u3");
  });

  it("returns null when no user id is present", () => {
    assert.equal(extractUserId({ payload: { user: {} } }), null);
    assert.equal(extractUserId(null), null);
  });
});

describe("Stream token signing", () => {
  it("creates an HS256 JWT with Stream's user_id claim", async () => {
    const token = await signStreamToken("user-123", "secret", 100, 200);
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    assert.ok(encodedHeader);
    assert.ok(encodedPayload);
    assert.ok(signature);
    assert.deepEqual(decodeJwtPart(encodedHeader), { alg: "HS256", typ: "JWT" });
    assert.deepEqual(decodeJwtPart(encodedPayload), {
      user_id: "user-123",
      iat: 100,
      exp: 200,
    });
  });

  it("creates a server JWT for Stream REST calls", async () => {
    const token = await signStreamServerToken("secret");
    const [, encodedPayload, signature] = token.split(".");

    assert.ok(signature);
    const payload = decodeJwtPart(encodedPayload);
    assert.equal(payload.server, true);
    assert.equal(typeof payload.iat, "number");
    assert.equal(typeof payload.exp, "number");
  });
});

describe("streamUserFromBody", () => {
  it("builds a Stream user payload with optional profile fields", () => {
    assert.deepEqual(
      streamUserFromBody({
        userId: " user-123 ",
        name: " Test User ",
        image: " https://example.com/avatar.png ",
      }),
      {
        id: "user-123",
        name: "Test User",
        image: "https://example.com/avatar.png",
      },
    );
  });

  it("rejects missing or invalid user ids", () => {
    assert.equal(streamUserFromBody({}), null);
    assert.equal(streamUserFromBody({ userId: "" }), null);
    assert.equal(streamUserFromBody({ userId: "x".repeat(256) }), null);
  });
});

describe("deterministic DM channel ids", () => {
  it("sorts member ids into a stable messaging channel id", () => {
    assert.deepEqual(
      deterministicDmChannel("68da010a706dfc75b410fa37", "68958d4340ec8662569c641f"),
      {
        channelType: "messaging",
        channelId: "dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37",
        cid: "messaging:dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37",
        memberIds: ["68958d4340ec8662569c641f", "68da010a706dfc75b410fa37"],
      },
    );

    assert.equal(
      deterministicDmChannel("68da010a706dfc75b410fa37", "68958d4340ec8662569c641f").channelId,
      deterministicDmChannel("68958d4340ec8662569c641f", "68da010a706dfc75b410fa37").channelId,
    );
  });

  it("rejects invalid member ids", () => {
    assert.equal(normalizeUserId(" messaging:bad "), "");
    assert.equal(deterministicDmChannel("same", "same"), null);
  });
});

describe("POST /chat/token", () => {
  it("handles CORS preflight", async () => {
    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/token", { method: "OPTIONS" }),
      env,
    );

    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://rbx-labs.io");
    assert.equal(response.headers.get("access-control-allow-methods"), "POST, OPTIONS");
  });

  it("fails closed when configuration is missing", async () => {
    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/token", {
        method: "POST",
        headers: { authorization: "Bearer app-token" },
      }),
      {},
    );

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "Service not configured" });
  });

  it("rejects invalid app auth tokens", async () => {
    globalThis.fetch = async () => new Response("unauthorized", { status: 401 });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/token", {
        method: "POST",
        headers: { authorization: "Bearer app-token" },
      }),
      env,
    );

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Invalid auth token" });
  });

  it("returns the frontend Stream token contract", async () => {
    let verifyRequest;
    globalThis.fetch = async (url, init) => {
      verifyRequest = { url, init };
      return Response.json({ payload: { user: { id: "user-123" } } });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/token", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          idtoken: "id-token",
          "user-identity": "user-123",
          "device-identity": "device-123",
          system: "ios",
        },
      }),
      env,
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.apiKey, "stream-key");
    assert.equal(body.userId, "user-123");
    assert.equal(typeof body.token, "string");
    assert.equal(typeof body.expiresAt, "number");
    assert.equal(verifyRequest.url, env.AUTH_VERIFY_URL);
    assert.equal(verifyRequest.init.headers.get("authorization"), "Bearer app-token");
    assert.equal(verifyRequest.init.headers.get("idtoken"), "id-token");
    assert.equal(verifyRequest.init.headers.get("user-identity"), "user-123");
    assert.equal(verifyRequest.init.headers.get("device-identity"), "device-123");
    assert.equal(verifyRequest.init.headers.get("system"), "ios");
  });
});

describe("POST /chat/dm-channel-id", () => {
  it("authenticates and returns a deterministic channel id", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: "68da010a706dfc75b410fa37" } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/dm-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ otherUserId: "68958d4340ec8662569c641f" }),
      }),
      env,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      channelType: "messaging",
      channelId: "dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37",
      cid: "messaging:dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37",
      memberIds: ["68958d4340ec8662569c641f", "68da010a706dfc75b410fa37"],
    });
  });

  it("requires the other member id", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: "caller-123" } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/dm-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Missing otherUserId" });
  });

  it("returns a bad request for malformed JSON", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: "caller-123" } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/dm-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: "{",
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Malformed JSON" });
  });
});

describe("POST /chat/ensure-user", () => {
  it("requires a target user id", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: "caller-123" } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/ensure-user", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Missing userId" });
  });

  it("authenticates then upserts only the Stream user id", async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: "caller-123" } } });
      }
      return Response.json({ users: {} });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/ensure-user", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          idtoken: "id-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          userId: "target-456",
          name: "Target User",
          image: "https://example.com/target.png",
        }),
      }),
      env,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {});
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, env.AUTH_VERIFY_URL);
    assert.equal(
      calls[1].url,
      `https://chat.stream-io-api.com/users?api_key=${env.STREAM_API_KEY}`,
    );
    assert.equal(calls[1].init.method, "POST");
    assert.equal(calls[1].init.headers["stream-auth-type"], "jwt");
    assert.equal(typeof calls[1].init.headers.authorization, "string");
    assert.deepEqual(JSON.parse(calls[1].init.body), {
      users: {
        "target-456": {
          id: "target-456",
        },
      },
    });
  });

  it("returns a bad request for malformed JSON", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: "caller-123" } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/ensure-user", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: "{",
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Malformed JSON" });
  });

  it("returns a bad gateway response when Stream rejects the upsert", async () => {
    globalThis.fetch = async (url) => {
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: "caller-123" } } });
      }
      return new Response("stream failed", { status: 500 });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/ensure-user", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ userId: "target-456" }),
      }),
      env,
    );

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "Stream user upsert failed" });
  });
});

describe("POST /chat/sync-profile", () => {
  it("syncs the authenticated user's Stream profile", async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: "caller-123" } } });
      }
      return Response.json({ users: {} });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/sync-profile", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Caller Name",
          image: "https://example.com/caller.png",
        }),
      }),
      env,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {});
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, env.AUTH_VERIFY_URL);
    assert.deepEqual(JSON.parse(calls[1].init.body), {
      users: {
        "caller-123": {
          id: "caller-123",
          name: "Caller Name",
          image: "https://example.com/caller.png",
        },
      },
    });
  });

  it("returns a bad request for malformed JSON", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: "caller-123" } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/sync-profile", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: "{",
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Malformed JSON" });
  });

  it("returns a bad gateway response when Stream rejects profile sync", async () => {
    globalThis.fetch = async (url) => {
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: "caller-123" } } });
      }
      return new Response("stream failed", { status: 500 });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/sync-profile", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ name: "Caller Name" }),
      }),
      env,
    );

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "Stream profile sync failed" });
  });
});

function decodeJwtPart(value) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const json = Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(json);
}
