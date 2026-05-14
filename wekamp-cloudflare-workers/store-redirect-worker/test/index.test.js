import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import worker, {
  buildResearchIdempotencyKey,
  buildResearchTickPayload,
  broadcastChannelId,
  deterministicBroadcastChannel,
  deterministicDmCall,
  deterministicDmChannel,
  deterministicGroupCall,
  deterministicGroupChannel,
  extractUserId,
  normalizeUserId,
  parseBackendProfile,
  signStreamServerToken,
  signStreamToken,
  streamUserFromBackendProfile,
  triggerResearchAgent,
} from "../src/index.js";

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
  });
}

const env = {
  STREAM_API_KEY: "stream-key",
  STREAM_API_SECRET: "stream-secret",
  AUTH_VERIFY_URL: "https://api.kampd.com/user/v1/profile",
  USER_PROFILE_URL: "https://api.kampd.com/user/v1/profile",
  CHAT_CORS_ORIGIN: "https://rbx-labs.io",
  RESEARCH_AGENT_TICK_URL: "https://api.kampd.com/ampy/agent/research/tick",
  RESEARCH_AGENT_KAMP_ID: "68da010a706dfc75b410fa37",
  RESEARCH_AGENT_PERSONA_ID: "ecosystm_research_persona_v1",
  RESEARCH_AGENT_SHARED_SECRET: "worker-secret",
};

const callerId = "68da010a706dfc75b410fa37";
const targetId = "68958d4340ec8662569c641f";
const groupMemberId = "67f30c04dcfb927c52fba1f4";
const groupId = "681112223333444455556666";

afterEach(() => {
  globalThis.fetch = undefined;
});

describe("extractUserId", () => {
  it("reads user id from common backend response shapes", () => {
    assert.equal(extractUserId({ userId: callerId }), callerId);
    assert.equal(extractUserId({ payload: { user: { id: targetId } } }), targetId);
    assert.equal(extractUserId({ data: { user_id: callerId.toUpperCase() } }), callerId);
  });

  it("returns null when no valid Mongo ObjectId is present", () => {
    assert.equal(extractUserId({ userId: "u1" }), null);
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

describe("backend profile mapping", () => {
  it("maps backend profile responses into Stream users", () => {
    const profile = parseBackendProfile({
      payload: {
        user: {
          id: targetId,
          fullName: " Target User ",
          avatar: "https://static.kampd.com/user/avatar.png",
        },
        canMessage: true,
      },
      status: { error: false },
    });

    assert.deepEqual(profile, {
      id: targetId,
      fullName: "Target User",
      avatar: "https://static.kampd.com/user/avatar.png",
      canMessage: true,
      isBlocked: false,
      isBlockedBy: false,
      isDeactivated: false,
    });
    assert.deepEqual(streamUserFromBackendProfile(profile), {
      id: targetId,
      name: "Target User",
      image: "https://static.kampd.com/user/avatar.png",
    });
  });

  it("rejects invalid profile users and unsafe avatars", () => {
    assert.equal(parseBackendProfile({ payload: { user: { id: "user-123" } } }), null);
    assert.deepEqual(
      streamUserFromBackendProfile({
        id: targetId,
        fullName: "Target User",
        avatar: "http://static.kampd.com/user/avatar.png",
        canMessage: true,
        isBlocked: false,
        isBlockedBy: false,
        isDeactivated: false,
      }),
      {
        id: targetId,
        name: "Target User",
      },
    );
    assert.equal(
      streamUserFromBackendProfile({
        id: targetId,
        fullName: "Target User",
        avatar: "https://static.kampd.com/user/avatar.png",
        canMessage: true,
        isBlocked: true,
        isBlockedBy: false,
        isDeactivated: false,
      }),
      null,
    );
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
    assert.equal(normalizeUserId(` ${callerId.toUpperCase()} `), callerId);
    assert.equal(normalizeUserId(" messaging:bad "), "");
    assert.equal(normalizeUserId("user-123"), "");
    assert.equal(deterministicDmChannel("same", "same"), null);
  });
});

describe("deterministic group channel ids", () => {
  it("uses a server-owned group id and sorts member ids into a stable group channel", () => {
    const result = deterministicGroupChannel([callerId, targetId, groupMemberId], groupId);
    const reversed = deterministicGroupChannel([groupMemberId, callerId, targetId], groupId);

    assert.deepEqual(result, {
      channelType: "messaging",
      channelId: "group_681112223333444455556666",
      cid: "messaging:group_681112223333444455556666",
      memberIds: [groupMemberId, targetId, callerId],
    });
    assert.equal(result.channelId, reversed.channelId);
  });

  it("allows different groups with the same exact members", () => {
    assert.notEqual(
      deterministicGroupChannel([callerId, targetId, groupMemberId], groupId).channelId,
      deterministicGroupChannel([callerId, targetId, groupMemberId], "681112223333444455556667").channelId,
    );
  });

  it("rejects missing group ids or groups with fewer than three unique valid members", () => {
    assert.equal(deterministicGroupChannel([callerId, targetId, groupMemberId], ""), null);
    assert.equal(deterministicGroupChannel([callerId, targetId], groupId), null);
    assert.equal(deterministicGroupChannel([callerId, targetId, "not-a-mongo-id"], groupId), null);
  });
});

describe("deterministic broadcast channel ids", () => {
  it("uses a server-owned broadcast id and returns creator/member role hints", () => {
    const result = deterministicBroadcastChannel([callerId, targetId], groupId, {
      createdById: callerId,
      allowMemberPosting: false,
      allowReplies: true,
    });

    assert.deepEqual(result, {
      channelType: "broadcast",
      channelId: "broadcast_681112223333444455556666",
      cid: "broadcast:broadcast_681112223333444455556666",
      memberIds: [targetId, callerId],
      createdById: callerId,
      memberRoles: [
        { userId: targetId, channelRole: "channel_member" },
        { userId: callerId, channelRole: "channel_moderator" },
      ],
      broadcast: {
        allowMemberPosting: false,
        allowReplies: true,
        publisherIds: [callerId],
      },
    });
  });

  it("rejects missing ids or broadcasts with fewer than two unique valid members", () => {
    assert.equal(deterministicBroadcastChannel([callerId], "", {}), null);
    assert.equal(deterministicBroadcastChannel([callerId], groupId, {}), null);
    assert.equal(deterministicBroadcastChannel(["not-a-mongo-id", callerId], groupId, {}), null);
  });
});

describe("deterministic call ids", () => {
  it("uses the DM member pair for stable 1:1 call ids", () => {
    const originalRandomUUID = globalThis.crypto.randomUUID;
    globalThis.crypto.randomUUID = () => "123e4567-e89b-12d3-a456-426614174000";
    try {
      assert.deepEqual(deterministicDmCall(callerId, targetId), {
        callType: "default",
        conversationId: "dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37",
        callId: "dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37_123e4567e89b12d3a456426614174000",
        callCid:
          "default:dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37_123e4567e89b12d3a456426614174000",
        memberIds: [targetId, callerId],
      });
    } finally {
      globalThis.crypto.randomUUID = originalRandomUUID;
    }
  });

  it("uses the server-owned group id for group call ids", () => {
    const originalRandomUUID = globalThis.crypto.randomUUID;
    globalThis.crypto.randomUUID = () => "123e4567-e89b-12d3-a456-426614174000";
    try {
      assert.deepEqual(deterministicGroupCall([callerId, targetId, groupMemberId], groupId), {
        callType: "default",
        conversationId: "group_681112223333444455556666",
        callId: "group_681112223333444455556666_123e4567e89b12d3a456426614174000",
        callCid: "default:group_681112223333444455556666_123e4567e89b12d3a456426614174000",
        memberIds: [groupMemberId, targetId, callerId],
      });
    } finally {
      globalThis.crypto.randomUUID = originalRandomUUID;
    }
  });
});

describe("research agent scheduler", () => {
  it("builds a stable scheduled payload", () => {
    const scheduledTime = Date.UTC(2026, 4, 7, 10, 0, 0);
    const payload = buildResearchTickPayload(
      {
        ...env,
        RESEARCH_AGENT_KEY: "ecosystm_research_agent",
        RESEARCH_AGENT_MAX_THEMES: "7",
        RESEARCH_AGENT_DRY_RUN: "true",
        RESEARCH_AGENT_AUTO_PUBLISH: "false",
      },
      scheduledTime,
    );

    assert.equal(payload.agentKey, "ecosystm_research_agent");
    assert.equal(payload.kampId, callerId);
    assert.equal(payload.personaId, "ecosystm_research_persona_v1");
    assert.equal(payload.runType, "scheduled");
    assert.equal(payload.maxThemes, 7);
    assert.equal(payload.dryRun, true);
    assert.equal(payload.autoPublish, false);
    assert.equal(payload.scheduledFor, "2026-05-07T10:00:00.000Z");
    assert.equal(
      payload.idempotencyKey,
      buildResearchIdempotencyKey("ecosystm_research_agent", "2026-05-07T10:00:00.000Z"),
    );
    assert.match(payload.traceId, /^ecosystm_research_agent:2026-05-07T10:00:00\.000Z:/);
  });

  it("fails closed when research scheduler config is missing", async () => {
    const result = await triggerResearchAgent({}, Date.UTC(2026, 4, 7, 10, 0, 0));

    assert.equal(result.ok, false);
    assert.equal(result.status, 500);
    assert.equal(result.error, "Research scheduler not configured");
  });

  it("posts the bounded research tick contract to the backend", async () => {
    let requestUrl = "";
    let requestInit = null;
    globalThis.fetch = async (url, init) => {
      requestUrl = url;
      requestInit = init;
      return Response.json({ status: "accepted", runId: "run-123" }, { status: 202 });
    };

    const result = await triggerResearchAgent(
      {
        ...env,
        RESEARCH_AGENT_MAX_THEMES: "5",
        RESEARCH_AGENT_DRY_RUN: "false",
        RESEARCH_AGENT_AUTO_PUBLISH: "true",
      },
      Date.UTC(2026, 4, 7, 10, 30, 0),
      globalThis.fetch,
    );

    assert.equal(requestUrl, env.RESEARCH_AGENT_TICK_URL);
    assert.equal(requestInit.method, "POST");
    assert.equal(requestInit.headers.authorization, "Bearer worker-secret");
    assert.equal(requestInit.headers["content-type"], "application/json");

    const body = JSON.parse(requestInit.body);
    assert.equal(body.kampId, callerId);
    assert.equal(body.personaId, "ecosystm_research_persona_v1");
    assert.equal(body.maxThemes, 5);
    assert.equal(body.autoPublish, true);
    assert.equal(body.scheduledFor, "2026-05-07T10:30:00.000Z");

    assert.equal(result.ok, true);
    assert.equal(result.status, 202);
    assert.deepEqual(result.body, { status: "accepted", runId: "run-123" });
  });

  it("registers the scheduled trigger through waitUntil", async () => {
    let awaited = false;
    let requestSeen = false;
    globalThis.fetch = async () => {
      requestSeen = true;
      return Response.json({ status: "accepted" }, { status: 202 });
    };

    await worker.scheduled(
      { scheduledTime: Date.UTC(2026, 4, 7, 11, 0, 0) },
      env,
      {
        waitUntil(promise) {
          awaited = true;
          return promise;
        },
      },
    );

    assert.equal(awaited, true);
    assert.equal(requestSeen, true);
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
      return Response.json({ payload: { user: { id: callerId } } });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/token", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          idtoken: "id-token",
          "user-identity": callerId,
          "device-identity": "device-123",
          system: "ios",
        },
      }),
      env,
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.apiKey, "stream-key");
    assert.equal(body.userId, callerId);
    assert.equal(typeof body.token, "string");
    assert.equal(typeof body.expiresAt, "number");
    assert.equal(verifyRequest.url, env.AUTH_VERIFY_URL);
    assert.equal(verifyRequest.init.headers.get("authorization"), "Bearer app-token");
    assert.equal(verifyRequest.init.headers.get("idtoken"), "id-token");
    assert.equal(verifyRequest.init.headers.get("user-identity"), callerId);
    assert.equal(verifyRequest.init.headers.get("device-identity"), "device-123");
    assert.equal(verifyRequest.init.headers.get("system"), "ios");
  });
});

describe("POST /call/token", () => {
  it("returns the Stream Video token contract", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/call/token", {
        method: "POST",
        headers: { authorization: "Bearer app-token" },
      }),
      env,
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.apiKey, "stream-key");
    assert.equal(body.userId, callerId);
    assert.equal(typeof body.token, "string");
    assert.equal(typeof body.expiresAt, "number");
  });
});

describe("POST /chat/dm-channel-id", () => {
  it("authenticates, upserts chat users, materializes the channel, and returns a deterministic channel id", async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${callerId}`) {
        return profileResponse(callerId, "Caller Name", "https://static.kampd.com/user/caller.png");
      }
      if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
        return profileResponse(targetId, "Target User", "https://static.kampd.com/user/target.png");
      }
      return Response.json({});
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/dm-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ otherUserId: targetId }),
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
    assert.equal(calls.length, 5);
    assert.equal(calls[0].url, env.AUTH_VERIFY_URL);
    assert.equal(calls[1].url, `${env.USER_PROFILE_URL}/${targetId}`);
    assert.equal(calls[2].url, `${env.USER_PROFILE_URL}/${callerId}`);
    assert.equal(
      calls[3].url,
      `https://chat.stream-io-api.com/users?api_key=${env.STREAM_API_KEY}`,
    );
    assert.deepEqual(JSON.parse(calls[3].init.body), {
      users: {
        [targetId]: {
          id: targetId,
          name: "Target User",
          image: "https://static.kampd.com/user/target.png",
        },
        [callerId]: {
          id: callerId,
          name: "Caller Name",
          image: "https://static.kampd.com/user/caller.png",
        },
      },
    });
    assert.equal(
      calls[4].url,
      `https://chat.stream-io-api.com/channels/messaging/dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37?api_key=${env.STREAM_API_KEY}`,
    );
    assert.deepEqual(JSON.parse(calls[4].init.body), {
      data: {
        created_by_id: callerId,
        members: [
          { user_id: targetId },
          { user_id: callerId },
        ],
      },
    });
  });

  it("requires the other member id", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

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
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

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

describe("POST /call/dm-id", () => {
  it("authenticates, validates both members, upserts Stream Video users, and returns a call contract", async () => {
    const originalRandomUUID = globalThis.crypto.randomUUID;
    globalThis.crypto.randomUUID = () => "123e4567-e89b-12d3-a456-426614174000";
    const calls = [];
    try {
      globalThis.fetch = async (url, init) => {
        calls.push({ url, init });
        if (url === env.AUTH_VERIFY_URL) {
          return Response.json({ payload: { user: { id: callerId } } });
        }
        if (url === `${env.USER_PROFILE_URL}/${callerId}`) {
          return profileResponse(callerId, "Caller Name", "https://static.kampd.com/user/caller.png");
        }
        if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
          return profileResponse(targetId, "Target User", "https://static.kampd.com/user/target.png");
        }
        return Response.json({ users: {} });
      };

      const response = await worker.fetch(
        new Request("https://rbx-labs.io/call/dm-id", {
          method: "POST",
          headers: {
            authorization: "Bearer app-token",
            "content-type": "application/json",
          },
          body: JSON.stringify({ otherUserId: targetId }),
        }),
        env,
      );

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        callType: "default",
        conversationId: "dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37",
        callId: "dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37_123e4567e89b12d3a456426614174000",
        callCid:
          "default:dm_68958d4340ec8662569c641f_68da010a706dfc75b410fa37_123e4567e89b12d3a456426614174000",
        memberIds: [targetId, callerId],
      });
      assert.equal(calls[0].url, env.AUTH_VERIFY_URL);
      assert.equal(calls[1].url, `${env.USER_PROFILE_URL}/${targetId}`);
      assert.equal(calls[2].url, `${env.USER_PROFILE_URL}/${callerId}`);
      assert.equal(
        calls[3].url,
        `https://video.stream-io-api.com/api/v2/users?api_key=${env.STREAM_API_KEY}`,
      );
      assert.deepEqual(JSON.parse(calls[3].init.body), {
        users: {
          [targetId]: {
            id: targetId,
            name: "Target User",
            image: "https://static.kampd.com/user/target.png",
          },
          [callerId]: {
            id: callerId,
            name: "Caller Name",
            image: "https://static.kampd.com/user/caller.png",
          },
        },
      });
    } finally {
      globalThis.crypto.randomUUID = originalRandomUUID;
    }
  });

  it("rejects malformed JSON", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/call/dm-id", {
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

describe("POST /chat/group-channel-id", () => {
  it("authenticates, validates every member, upserts users, and returns a deterministic group channel", async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${callerId}`) {
        return profileResponse(callerId, "Caller Name", "https://static.kampd.com/user/caller.png");
      }
      if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
        return profileResponse(targetId, "Target User", "https://static.kampd.com/user/target.png");
      }
      if (url === `${env.USER_PROFILE_URL}/${groupMemberId}`) {
        return profileResponse(groupMemberId, "Group Member", "");
      }
      return Response.json({ users: {} });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/group-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          idtoken: "id-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ groupId, memberIds: [targetId, groupMemberId] }),
      }),
      env,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      channelType: "messaging",
      channelId: "group_681112223333444455556666",
      cid: "messaging:group_681112223333444455556666",
      memberIds: [groupMemberId, targetId, callerId],
    });
    assert.equal(calls.length, 6);
    assert.equal(calls[0].url, env.AUTH_VERIFY_URL);
    assert.equal(calls[1].url, `${env.USER_PROFILE_URL}/${callerId}`);
    assert.equal(calls[2].url, `${env.USER_PROFILE_URL}/${targetId}`);
    assert.equal(calls[3].url, `${env.USER_PROFILE_URL}/${groupMemberId}`);
    assert.equal(
      calls[4].url,
      `https://chat.stream-io-api.com/users?api_key=${env.STREAM_API_KEY}`,
    );
    assert.deepEqual(JSON.parse(calls[4].init.body), {
      users: {
        [callerId]: {
          id: callerId,
          name: "Caller Name",
          image: "https://static.kampd.com/user/caller.png",
        },
        [targetId]: {
          id: targetId,
          name: "Target User",
          image: "https://static.kampd.com/user/target.png",
        },
        [groupMemberId]: {
          id: groupMemberId,
          name: "Group Member",
        },
      },
    });
    assert.equal(
      calls[5].url,
      `https://chat.stream-io-api.com/channels/messaging/group_${groupId}?api_key=${env.STREAM_API_KEY}`,
    );
    assert.deepEqual(JSON.parse(calls[5].init.body), {
      data: {
        created_by_id: callerId,
        members: [
          { user_id: groupMemberId },
          { user_id: targetId },
          { user_id: callerId },
        ],
      },
    });
  });

  it("requires at least two other member ids", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/group-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ groupId, memberIds: [targetId] }),
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "At least two other memberIds are required" });
  });

  it("requires a server-owned group id", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/group-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ memberIds: [targetId, groupMemberId] }),
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Missing groupId" });
  });

  it("rejects invalid or duplicate member ids before backend lookups", async () => {
    const calls = [];
    globalThis.fetch = async (url) => {
      calls.push(url);
      return Response.json({ payload: { user: { id: callerId } } });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/group-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ groupId, memberIds: [targetId, "not-a-mongo-id"] }),
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid memberIds" });
    assert.deepEqual(calls, [env.AUTH_VERIFY_URL]);
  });

  it("returns a specific error when memberIds includes the caller", async () => {
    const calls = [];
    globalThis.fetch = async (url) => {
      calls.push(url);
      return Response.json({ payload: { user: { id: callerId } } });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/group-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ groupId, memberIds: [callerId, targetId] }),
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Caller must not be included in memberIds" });
    assert.deepEqual(calls, [env.AUTH_VERIFY_URL]);
  });

  it("rejects groups above the configured member cap before backend lookups", async () => {
    const calls = [];
    globalThis.fetch = async (url) => {
      calls.push(url);
      return Response.json({ payload: { user: { id: callerId } } });
    };
    const memberIds = Array.from({ length: 50 }, (_, index) =>
      `${(index + 1).toString(16).padStart(24, "0")}`,
    );

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/group-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ groupId, memberIds }),
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Too many memberIds" });
    assert.deepEqual(calls, [env.AUTH_VERIFY_URL]);
  });

  it("returns not found when any member does not exist", async () => {
    globalThis.fetch = async (url) => {
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${callerId}`) {
        return profileResponse(callerId, "Caller Name", "");
      }
      if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
        return Response.json({ error: "not found" }, { status: 404 });
      }
      throw new Error(`unexpected fetch ${url}`);
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/group-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ groupId, memberIds: [targetId, groupMemberId] }),
      }),
      env,
    );

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Member user not found", userId: targetId });
  });

  it("rejects blocked members", async () => {
    globalThis.fetch = async (url) => {
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${callerId}`) {
        return profileResponse(callerId, "Caller Name", "");
      }
      if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
        return profileResponse(targetId, "Target User", "", { isBlocked: true });
      }
      throw new Error(`unexpected fetch ${url}`);
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/group-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ groupId, memberIds: [targetId, groupMemberId] }),
      }),
      env,
    );

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: "Messaging member is not allowed",
      userId: targetId,
    });
  });

  it("returns a bad request for malformed JSON", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/group-channel-id", {
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

describe("POST /chat/broadcast-channel-id", () => {
  it("authenticates, validates members, upserts users, and returns canonical broadcast metadata", async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${callerId}`) {
        return profileResponse(callerId, "Caller Name", "https://static.kampd.com/user/caller.png");
      }
      if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
        return profileResponse(targetId, "Target User", "https://static.kampd.com/user/target.png");
      }
      return Response.json({ users: {} });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/broadcast-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          idtoken: "id-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          broadcastId: groupId,
          memberIds: [targetId],
          allowMemberPosting: false,
          allowReplies: true,
        }),
      }),
      env,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      channelType: "broadcast",
      channelId: "broadcast_681112223333444455556666",
      cid: "broadcast:broadcast_681112223333444455556666",
      memberIds: [targetId, callerId],
      createdById: callerId,
      memberRoles: [
        { userId: targetId, channelRole: "channel_member" },
        { userId: callerId, channelRole: "channel_moderator" },
      ],
      broadcast: {
        allowMemberPosting: false,
        allowReplies: true,
        publisherIds: [callerId],
      },
    });
    assert.equal(calls.length, 5);
    assert.equal(calls[0].url, env.AUTH_VERIFY_URL);
    assert.equal(calls[1].url, `${env.USER_PROFILE_URL}/${callerId}`);
    assert.equal(calls[2].url, `${env.USER_PROFILE_URL}/${targetId}`);
    assert.equal(
      calls[3].url,
      `https://chat.stream-io-api.com/users?api_key=${env.STREAM_API_KEY}`,
    );
    assert.equal(
      calls[4].url,
      `https://chat.stream-io-api.com/channels/broadcast/broadcast_${groupId}?api_key=${env.STREAM_API_KEY}`,
    );
    assert.deepEqual(JSON.parse(calls[4].init.body), {
      data: {
        created_by_id: callerId,
        members: [
          { user_id: targetId, channel_role: "channel_member" },
          { user_id: callerId, channel_role: "channel_moderator" },
        ],
        wekamp_broadcast: {
          allowMemberPosting: false,
          allowReplies: true,
          publisherIds: [callerId],
        },
      },
    });
  });

  it("requires at least one other member id", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/broadcast-channel-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ broadcastId: groupId, memberIds: [] }),
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "At least one other memberId is required" });
  });
});

describe("POST /call/group-id", () => {
  it("authenticates, validates group members, upserts Stream Video users, and returns a call contract", async () => {
    const originalRandomUUID = globalThis.crypto.randomUUID;
    globalThis.crypto.randomUUID = () => "123e4567-e89b-12d3-a456-426614174000";
    const calls = [];
    try {
      globalThis.fetch = async (url, init) => {
        calls.push({ url, init });
        if (url === env.AUTH_VERIFY_URL) {
          return Response.json({ payload: { user: { id: callerId } } });
        }
        if (url === `${env.USER_PROFILE_URL}/${callerId}`) {
          return profileResponse(callerId, "Caller Name", "https://static.kampd.com/user/caller.png");
        }
        if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
          return profileResponse(targetId, "Target User", "");
        }
        if (url === `${env.USER_PROFILE_URL}/${groupMemberId}`) {
          return profileResponse(groupMemberId, "Group Member", "");
        }
        return Response.json({ users: {} });
      };

      const response = await worker.fetch(
        new Request("https://rbx-labs.io/call/group-id", {
          method: "POST",
          headers: {
            authorization: "Bearer app-token",
            "content-type": "application/json",
          },
          body: JSON.stringify({ groupId, memberIds: [targetId, groupMemberId] }),
        }),
        env,
      );

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        callType: "default",
        conversationId: "group_681112223333444455556666",
        callId: "group_681112223333444455556666_123e4567e89b12d3a456426614174000",
        callCid: "default:group_681112223333444455556666_123e4567e89b12d3a456426614174000",
        memberIds: [groupMemberId, targetId, callerId],
      });
      assert.equal(calls[0].url, env.AUTH_VERIFY_URL);
      assert.equal(calls[1].url, `${env.USER_PROFILE_URL}/${callerId}`);
      assert.equal(calls[2].url, `${env.USER_PROFILE_URL}/${targetId}`);
      assert.equal(calls[3].url, `${env.USER_PROFILE_URL}/${groupMemberId}`);
      assert.equal(
        calls[4].url,
        `https://video.stream-io-api.com/api/v2/users?api_key=${env.STREAM_API_KEY}`,
      );
    } finally {
      globalThis.crypto.randomUUID = originalRandomUUID;
    }
  });

  it("returns a specific error when memberIds includes the caller", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/call/group-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ groupId, memberIds: [callerId, targetId] }),
      }),
      env,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Caller must not be included in memberIds" });
  });

  it("returns bad gateway when Stream Video rejects the user upsert", async () => {
    globalThis.fetch = async (url) => {
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${callerId}`) {
        return profileResponse(callerId, "Caller Name", "");
      }
      if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
        return profileResponse(targetId, "Target User", "");
      }
      if (url === `${env.USER_PROFILE_URL}/${groupMemberId}`) {
        return profileResponse(groupMemberId, "Group Member", "");
      }
      return new Response("stream failed", { status: 500 });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/call/group-id", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ groupId, memberIds: [targetId, groupMemberId] }),
      }),
      env,
    );

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "Stream video user upsert failed" });
  });
});

describe("POST /chat/ensure-user", () => {
  it("requires a target user id", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

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

  it("rejects non-Mongo target ids before backend lookup", async () => {
    const calls = [];
    globalThis.fetch = async (url) => {
      calls.push(url);
      return Response.json({ payload: { user: { id: callerId } } });
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

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Missing userId" });
    assert.deepEqual(calls, [env.AUTH_VERIFY_URL]);
  });

  it("fails closed when target profile lookup configuration is missing", async () => {
    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/ensure-user", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ userId: targetId }),
      }),
      { ...env, USER_PROFILE_URL: "" },
    );

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "Service not configured" });
  });

  it("authenticates, validates target profile, then upserts backend-owned Stream user data", async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
        return Response.json({
          payload: {
            user: {
              id: targetId,
              fullName: "Target User",
              avatar: "https://static.kampd.com/user/avatar.png",
            },
            canMessage: true,
            isBlocked: false,
            isBlockedBy: false,
            isDeactivated: false,
          },
          status: { error: false },
        });
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
          userId: targetId,
          name: "Caller supplied name should be ignored",
          image: "https://example.com/ignored.png",
        }),
      }),
      env,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {});
    assert.equal(calls.length, 3);
    assert.equal(calls[0].url, env.AUTH_VERIFY_URL);
    assert.equal(calls[1].url, `${env.USER_PROFILE_URL}/${targetId}`);
    assert.equal(calls[1].init.headers.get("authorization"), "Bearer app-token");
    assert.equal(calls[1].init.headers.get("idtoken"), "id-token");
    assert.equal(
      calls[2].url,
      `https://chat.stream-io-api.com/users?api_key=${env.STREAM_API_KEY}`,
    );
    assert.equal(calls[2].init.method, "POST");
    assert.equal(calls[2].init.headers["stream-auth-type"], "jwt");
    assert.equal(typeof calls[2].init.headers.authorization, "string");
    assert.deepEqual(JSON.parse(calls[2].init.body), {
      users: {
        [targetId]: {
          id: targetId,
          name: "Target User",
          image: "https://static.kampd.com/user/avatar.png",
        },
      },
    });
  });

  it("returns a bad request for malformed JSON", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

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
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
        return Response.json({
          payload: {
            user: { id: targetId, fullName: "Target User", avatar: "" },
            canMessage: true,
          },
        });
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
        body: JSON.stringify({ userId: targetId }),
      }),
      env,
    );

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "Stream user upsert failed" });
  });

  it("returns not found when the backend target profile does not exist", async () => {
    globalThis.fetch = async (url) => {
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      return Response.json({ error: "not found" }, { status: 404 });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/ensure-user", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ userId: targetId }),
      }),
      env,
    );

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Target user not found" });
  });

  it("rejects target users that backend says cannot be messaged", async () => {
    globalThis.fetch = async (url) => {
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
        return Response.json({
          payload: {
            user: { id: targetId, fullName: "Target User", avatar: "" },
            canMessage: false,
            isBlocked: false,
            isBlockedBy: false,
            isDeactivated: false,
          },
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/ensure-user", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ userId: targetId }),
      }),
      env,
    );

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "Messaging target is not allowed" });
  });

  it("rejects blocked or deactivated target users even with a truthy canMessage field", async () => {
    globalThis.fetch = async (url) => {
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${targetId}`) {
        return Response.json({
          payload: {
            user: { id: targetId, fullName: "Target User", avatar: "" },
            canMessage: true,
            isBlocked: true,
            isBlockedBy: false,
            isDeactivated: false,
          },
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/ensure-user", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ userId: targetId }),
      }),
      env,
    );

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "Messaging target is not allowed" });
  });

  it("returns bad gateway when target profile payload is malformed", async () => {
    globalThis.fetch = async (url) => {
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      return Response.json({ payload: { user: { id: "not-a-mongo-id" }, canMessage: true } });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/ensure-user", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ userId: targetId }),
      }),
      env,
    );

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "Target user lookup failed" });
  });
});

describe("POST /chat/sync-profile", () => {
  it("syncs the authenticated user's Stream profile", async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${callerId}`) {
        return Response.json({
          payload: {
            user: {
              id: callerId,
              fullName: "Caller Name",
              avatar: "https://static.kampd.com/user/caller.png",
            },
            canMessage: true,
            isBlocked: false,
            isBlockedBy: false,
            isDeactivated: false,
          },
        });
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
          name: "Caller supplied name should be ignored",
          image: "https://example.com/ignored.png",
        }),
      }),
      env,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {});
    assert.equal(calls.length, 3);
    assert.equal(calls[0].url, env.AUTH_VERIFY_URL);
    assert.equal(calls[1].url, `${env.USER_PROFILE_URL}/${callerId}`);
    assert.deepEqual(JSON.parse(calls[2].init.body), {
      users: {
        [callerId]: {
          id: callerId,
          name: "Caller Name",
          image: "https://static.kampd.com/user/caller.png",
        },
      },
    });
  });

  it("returns a bad request for malformed JSON", async () => {
    globalThis.fetch = async () => Response.json({ payload: { user: { id: callerId } } });

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
        return Response.json({ payload: { user: { id: callerId } } });
      }
      if (url === `${env.USER_PROFILE_URL}/${callerId}`) {
        return Response.json({
          payload: {
            user: { id: callerId, fullName: "Caller Name", avatar: "" },
            canMessage: true,
          },
        });
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

  it("returns bad gateway when current profile lookup is malformed", async () => {
    globalThis.fetch = async (url) => {
      if (url === env.AUTH_VERIFY_URL) {
        return Response.json({ payload: { user: { id: callerId } } });
      }
      return Response.json({ payload: { user: { id: "not-a-mongo-id" } } });
    };

    const response = await worker.fetch(
      new Request("https://rbx-labs.io/chat/sync-profile", {
        method: "POST",
        headers: {
          authorization: "Bearer app-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      }),
      env,
    );

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "Profile lookup failed" });
  });
});

function decodeJwtPart(value) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const json = Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(json);
}

function profileResponse(id, fullName, avatar, flags = {}) {
  return Response.json({
    payload: {
      user: { id, fullName, avatar },
      canMessage: flags.canMessage ?? true,
      isBlocked: flags.isBlocked ?? false,
      isBlockedBy: flags.isBlockedBy ?? false,
      isDeactivated: flags.isDeactivated ?? false,
    },
  });
}
