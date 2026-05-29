import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSupabaseFetcherForTests,
  resetSupabaseFetcherForTests,
  getEventState,
  putEventStateOCC,
  putTeamStateOCC,
  updateHelpRequestStatus,
  insertExecution,
  upsertPresence,
} from "../../lib/per-team-backend.mjs";

describe("OCC put", () => {
  beforeEach(() => {
    resetSupabaseFetcherForTests();
  });
  afterEach(() => {
    resetSupabaseFetcherForTests();
  });

  it("returns the new version on a matching PATCH", async () => {
    const calls = [];
    setSupabaseFetcherForTests(async (pathname, options) => {
      calls.push({ pathname, options });
      if (pathname.startsWith("/rest/v1/event_state?event_id=eq.evt_1&version=eq.3")) {
        return [{ event_id: "evt_1", payload: { name: "x" }, version: 4, updated_at: "2026-05-29T00:00:00Z" }];
      }
      throw new Error(`unexpected ${pathname}`);
    });
    const result = await putEventStateOCC("evt_1", { payload: { name: "x" }, expected_version: 3 });
    expect(result.version).toBe(4);
    expect(calls[0].options.method).toBe("PATCH");
  });

  it("throws 409 with current row when version does not match", async () => {
    setSupabaseFetcherForTests(async (pathname) => {
      if (pathname.startsWith("/rest/v1/event_state?event_id=eq.evt_1&version=eq.3")) return [];
      if (pathname.startsWith("/rest/v1/event_state?event_id=eq.evt_1&select=")) {
        return [{ event_id: "evt_1", payload: { name: "y" }, version: 5, updated_at: "2026-05-29T00:00:01Z" }];
      }
      throw new Error(`unexpected ${pathname}`);
    });
    let err;
    try {
      await putEventStateOCC("evt_1", { payload: { name: "x" }, expected_version: 3 });
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(409);
    expect(err.body.current_version).toBe(5);
    expect(err.body.current_payload).toEqual({ name: "y" });
  });
});

describe("getEventState", () => {
  it("returns payload + version + serverNow", async () => {
    setSupabaseFetcherForTests(async () => [
      { event_id: "evt_1", payload: { name: "ok" }, version: 7, updated_at: "2026-05-29T00:00:00Z" },
    ]);
    const result = await getEventState("evt_1");
    expect(result.payload).toEqual({ name: "ok" });
    expect(result.version).toBe(7);
    expect(typeof result.serverNow).toBe("string");
  });

  it("throws 404 when no row", async () => {
    setSupabaseFetcherForTests(async () => []);
    let err;
    try {
      await getEventState("missing");
    } catch (e) {
      err = e;
    }
    expect(err.statusCode).toBe(404);
  });
});

describe("insertExecution", () => {
  it("posts a single row to /rest/v1/executions", async () => {
    let captured;
    setSupabaseFetcherForTests(async (pathname, options) => {
      captured = { pathname, options };
      return [{ id: "ex_x" }];
    });
    await insertExecution({
      id: "ex_x",
      event_id: "evt_1",
      team_idx: 0,
      mission_id: "m_a",
      payload: { output: "ok" },
    });
    expect(captured.pathname).toBe("/rest/v1/executions");
    expect(captured.options.method).toBe("POST");
    expect(Array.isArray(captured.options.body)).toBe(true);
    expect(captured.options.body[0].id).toBe("ex_x");
  });
});

describe("upsertPresence", () => {
  it("uses Prefer merge-duplicates", async () => {
    let captured;
    setSupabaseFetcherForTests(async (pathname, options) => {
      captured = { pathname, options };
      return null;
    });
    await upsertPresence({ event_id: "evt_1", team_idx: 0, member_name: "Anitta" });
    expect(captured.pathname).toBe("/rest/v1/team_presence");
    expect(captured.options.headers.Prefer).toMatch(/merge-duplicates/);
  });
});

describe("putTeamStateOCC first-write semantics", () => {
  beforeEach(() => {
    resetSupabaseFetcherForTests();
  });
  afterEach(() => {
    resetSupabaseFetcherForTests();
  });

  it("rejects expected_version > 0 when no row exists (404 not silent INSERT)", async () => {
    setSupabaseFetcherForTests(async (pathname) => {
      if (pathname.startsWith("/rest/v1/team_state?event_id=eq.evt_x&team_idx=eq.0&version=eq.5")) return [];
      if (pathname.includes("&select=payload,version,updated_at&limit=1")) return [];
      throw new Error(`unexpected ${pathname}`);
    });
    let err;
    try {
      await putTeamStateOCC("evt_x", 0, { payload: { a: 1 }, expected_version: 5 });
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(404);
  });

  it("inserts at version 1 when expected_version is 0 and no row exists", async () => {
    let inserted = false;
    setSupabaseFetcherForTests(async (pathname, options) => {
      if (pathname.startsWith("/rest/v1/team_state?event_id=eq.evt_y&team_idx=eq.1&version=eq.0")) return [];
      if (pathname.startsWith("/rest/v1/team_state?event_id=eq.evt_y&team_idx=eq.1&select=")) return [];
      if (pathname === "/rest/v1/team_state" && options.method === "POST") {
        inserted = true;
        return [{ event_id: "evt_y", team_idx: 1, payload: options.body[0].payload, version: 1, updated_at: "2026-05-29T00:00:00Z" }];
      }
      throw new Error(`unexpected ${pathname}`);
    });
    const result = await putTeamStateOCC("evt_y", 1, { payload: { hello: "world" }, expected_version: 0 });
    expect(inserted).toBe(true);
    expect(result.version).toBe(1);
    expect(result.payload).toEqual({ hello: "world" });
  });

  it("returns 409 when the first-write INSERT is rejected by a concurrent writer", async () => {
    let phase = "patch";
    setSupabaseFetcherForTests(async (pathname, options) => {
      if (pathname.startsWith("/rest/v1/team_state?event_id=eq.evt_z&team_idx=eq.2&version=eq.0")) return [];
      if (pathname.startsWith("/rest/v1/team_state?event_id=eq.evt_z&team_idx=eq.2&select=")) {
        if (phase === "patch") {
          phase = "reread";
          return [];
        }
        return [{ event_id: "evt_z", team_idx: 2, payload: { winner: true }, version: 1, updated_at: "2026-05-29T00:00:01Z" }];
      }
      if (pathname === "/rest/v1/team_state" && options.method === "POST") return [];
      throw new Error(`unexpected ${pathname}`);
    });
    let err;
    try {
      await putTeamStateOCC("evt_z", 2, { payload: { loser: true }, expected_version: 0 });
    } catch (e) {
      err = e;
    }
    expect(err.statusCode).toBe(409);
    expect(err.body.current_payload).toEqual({ winner: true });
    expect(err.body.current_version).toBe(1);
  });
});

describe("updateHelpRequestStatus payload safety", () => {
  beforeEach(() => {
    resetSupabaseFetcherForTests();
  });
  afterEach(() => {
    resetSupabaseFetcherForTests();
  });

  it("does not touch payload column when payloadPatch is omitted", async () => {
    let captured;
    setSupabaseFetcherForTests(async (pathname, options) => {
      captured = { pathname, options };
      return null;
    });
    await updateHelpRequestStatus("h_1", { status: "cancelled" });
    expect(captured.pathname).toBe("/rest/v1/help_requests?id=eq.h_1");
    expect(captured.options.method).toBe("PATCH");
    expect(captured.options.body.status).toBe("cancelled");
    expect("payload" in captured.options.body).toBe(false);
  });

  it("writes payload column when payloadPatch is provided", async () => {
    let captured;
    setSupabaseFetcherForTests(async (pathname, options) => {
      captured = { pathname, options };
      return null;
    });
    await updateHelpRequestStatus("h_2", { status: "resolved", payloadPatch: { resolution: "done" } });
    expect(captured.options.body.payload).toEqual({ resolution: "done" });
  });
});
