import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSupabaseFetcherForTests,
  resetSupabaseFetcherForTests,
  getEventState,
  putEventStateOCC,
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
