import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import worker, { extractUserId, signStreamToken } from "../src/index.js";

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

function decodeJwtPart(value) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const json = Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(json);
}
