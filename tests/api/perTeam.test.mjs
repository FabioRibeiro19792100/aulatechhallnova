import { describe, expect, it, vi } from "vitest";

describe("perTeam API client", () => {
  it("retries OCC 409 up to 3 times then surfaces conflict", async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 409, text: async () => JSON.stringify({ current_version: 5, current_payload: { name: "y" } }) })
      .mockResolvedValueOnce({ ok: false, status: 409, text: async () => JSON.stringify({ current_version: 6, current_payload: { name: "z" } }) })
      .mockResolvedValueOnce({ ok: false, status: 409, text: async () => JSON.stringify({ current_version: 7, current_payload: { name: "w" } }) });
    globalThis.fetch = fetchMock;

    const { putEventStateOCC } = await import("../../src/api/perTeam.js");
    const merge = vi.fn((current) => ({ ...current, name: `${current.name}-edit` }));

    const result = await putEventStateOCC({ eventId: "evt", initial: { payload: { name: "x" }, version: 4 }, merge });
    expect(result.ok).toBe(false);
    expect(result.conflict.current_version).toBe(7);
    expect(merge).toHaveBeenCalledTimes(3);
  });

  it("succeeds when PUT returns 200", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ payload: { name: "x" }, version: 5, updated_at: "t", serverNow: "t2" }),
    });
    globalThis.fetch = fetchMock;
    const { putEventStateOCC } = await import("../../src/api/perTeam.js");
    const result = await putEventStateOCC({
      eventId: "evt",
      initial: { payload: { name: "x" }, version: 4 },
      merge: (c) => c,
    });
    expect(result.ok).toBe(true);
    expect(result.version).toBe(5);
  });
});
