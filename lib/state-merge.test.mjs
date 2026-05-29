import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeAppEvents, mergeObjects } from "./state-merge.mjs";

const E = (over = {}) => ({ id: "ev1", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", ...over });

test("identified arrays union without loss (concurrent appends)", () => {
  const remote = [E({ stressEntries: [{ id: "a" }, { id: "b" }] })];
  const incoming = [E({ stressEntries: [{ id: "a" }, { id: "c" }] })];
  const [ev] = mergeAppEvents(remote, incoming);
  const ids = ev.stressEntries.map((x) => x.id).sort();
  assert.deepEqual(ids, ["a", "b", "c"]);
});

test("help request status update wins by newer timestamp", () => {
  const remote = [E({ helpRequests: [{ id: "h1", status: "open", updatedAt: "2026-01-01T00:00:01.000Z" }] })];
  const incoming = [E({ helpRequests: [{ id: "h1", status: "resolved", resolvedAt: "2026-01-01T00:00:05.000Z", updatedAt: "2026-01-01T00:00:05.000Z" }] })];
  const [ev] = mergeAppEvents(remote, incoming);
  assert.equal(ev.helpRequests.length, 1);
  assert.equal(ev.helpRequests[0].status, "resolved");
});

test("reflexoes map: both keys survive, newest value wins per key", () => {
  const remote = [E({ reflexoes: { "0__m1": { submittedAt: "2026-01-01T00:00:01.000Z", score: 1 } } })];
  const incoming = [E({ reflexoes: { "1__m1": { submittedAt: "2026-01-01T00:00:02.000Z", score: 2 } } })];
  const [ev] = mergeAppEvents(remote, incoming);
  assert.deepEqual(Object.keys(ev.reflexoes).sort(), ["0__m1", "1__m1"]);
});

test("execucoes nested map union + sorted by ts", () => {
  const remote = [E({ execucoes: { "0__m1": [{ id: "r1", ts: "2026-01-01T00:00:01.000Z" }] } })];
  const incoming = [E({ execucoes: { "0__m1": [{ id: "r2", ts: "2026-01-01T00:00:02.000Z" }] } })];
  const [ev] = mergeAppEvents(remote, incoming);
  assert.deepEqual(ev.execucoes["0__m1"].map((x) => x.id), ["r1", "r2"]);
});

test("id-less array (teams) takes whole array from event with newer updatedAt", () => {
  const remote = [E({ updatedAt: "2026-01-01T00:00:01.000Z", teams: [{ name: "T1" }] })];
  const incoming = [E({ updatedAt: "2026-01-01T00:00:09.000Z", teams: [{ name: "T1" }, { name: "T2" }] })];
  const [ev] = mergeAppEvents(remote, incoming);
  assert.deepEqual(ev.teams.map((t) => t.name), ["T1", "T2"]);
});

test("announcement dismissedBy maps are unioned, not replaced", () => {
  const remote = [E({ announcements: [{ id: "an1", createdAt: "2026-01-01T00:00:01.000Z", dismissedBy: { "0": true } }] })];
  const incoming = [E({ announcements: [{ id: "an1", createdAt: "2026-01-01T00:00:01.000Z", dismissedBy: { "1": true } }] })];
  const [ev] = mergeAppEvents(remote, incoming);
  assert.deepEqual(ev.announcements[0].dismissedBy, { "0": true, "1": true });
});

test("disjoint events both survive", () => {
  const merged = mergeAppEvents([E({ id: "evA" })], [E({ id: "evB" })]);
  assert.deepEqual(merged.map((e) => e.id).sort(), ["evA", "evB"]);
});

test("merge is idempotent on identical input", () => {
  const a = [E({ stressEntries: [{ id: "a" }, { id: "b" }] })];
  const once = mergeAppEvents(a, a);
  assert.deepEqual(once[0].stressEntries.map((x) => x.id).sort(), ["a", "b"]);
});

test("mergeObjects prefers newer side for scalar conflicts", () => {
  const older = { updatedAt: "2026-01-01T00:00:01.000Z", label: "old" };
  const newer = { updatedAt: "2026-01-01T00:00:09.000Z", label: "new" };
  assert.equal(mergeObjects(older, newer).label, "new");
  assert.equal(mergeObjects(newer, older).label, "new");
});
