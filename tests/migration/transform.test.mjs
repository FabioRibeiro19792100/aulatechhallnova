import { describe, expect, it } from "vitest";
import {
  splitEventIntoRows,
  extractExecutions,
  extractTokenLogs,
  extractHelpRequests,
  extractPresence,
} from "../../scripts/migration/transform.mjs";

const fixture = {
  id: "evt_1",
  name: "Q.A BIg Nico",
  status: "open",
  mode: "missions",
  teams: [
    { name: "Time 1", runs: 0, members: ["Anitta"] },
    { name: "Time 2", runs: 0, members: ["Bia", "Carla"] },
  ],
  missions: [{ id: "m_analise", unlocked: true }],
  anuncios: [{ id: "a1", text: "Bem-vindas" }],
  sessionTimer: { startedAt: null },
  sessionTimerNotice: null,
  screenShare: { active: false },
  helpDisabledMap: { 0: { disabled: false } },
  facilitatorPin: null,
  execucoes: {
    "0__m_analise": [
      { id: "ex_1", ts: "2026-05-28T10:00:00Z", output: "olá" },
      { id: "ex_2", ts: "2026-05-28T10:05:00Z", output: "tchau" },
    ],
  },
  trainingRuns: {
    "1": [{ id: "tr_1", ts: "2026-05-28T10:10:00Z", output: "treino" }],
  },
  reflexoes: { "0__m_analise": { likert: [3, 4, 5] } },
  conclusoes: { "0__m_analise": { closedAt: "2026-05-28T10:06:00Z" } },
  questionariosPendentes: {},
  anamnesisResponses: {
    0: { submittedAt: "2026-05-28T09:55:00Z", answers: {} },
  },
  missionGlossaries: { "0__m_analise": [] },
  preservedMissionUsage: { "0__m_analise": { tokens: 200 } },
  helpRequests: [
    { id: "h1", teamIdx: 0, missionId: "m_analise", status: "open", createdAt: "2026-05-28T10:02:00Z" },
  ],
  tokenOperationalLogs: [
    { teamIdx: 0, missionId: "m_analise", ts: "2026-05-28T10:01:00Z", delta: -100 },
  ],
  presenceMap: {
    0: { memberName: "Anitta", lastSeenAt: "2026-05-28T10:09:00Z" },
  },
};

describe("splitEventIntoRows", () => {
  it("places event-wide fields in the event row", () => {
    const { eventRow } = splitEventIntoRows(fixture);
    expect(eventRow.event_id).toBe("evt_1");
    expect(eventRow.payload.name).toBe("Q.A BIg Nico");
    expect(eventRow.payload.teams).toHaveLength(2);
    expect(eventRow.payload.missions).toHaveLength(1);
    expect(eventRow.payload.anuncios).toHaveLength(1);
    expect(eventRow.payload.helpDisabledMap).toEqual({ 0: { disabled: false } });
  });

  it("excludes team-scoped slots from the event payload", () => {
    const { eventRow } = splitEventIntoRows(fixture);
    expect(eventRow.payload.execucoes).toBeUndefined();
    expect(eventRow.payload.reflexoes).toBeUndefined();
    expect(eventRow.payload.helpRequests).toBeUndefined();
    expect(eventRow.payload.presenceMap).toBeUndefined();
  });

  it("emits one team_state row per team with mission-keyed slots", () => {
    const { teamRows } = splitEventIntoRows(fixture);
    expect(teamRows).toHaveLength(2);
    const t0 = teamRows.find((r) => r.team_idx === 0);
    expect(t0.payload.reflexoes).toEqual({ m_analise: { likert: [3, 4, 5] } });
    expect(t0.payload.conclusoes).toEqual({ m_analise: { closedAt: "2026-05-28T10:06:00Z" } });
    expect(t0.payload.anamnese).toEqual({ submittedAt: "2026-05-28T09:55:00Z", answers: {} });
    expect(t0.payload.preservedMissionUsage).toEqual({ m_analise: { tokens: 200 } });
  });
});

describe("extractExecutions", () => {
  it("flattens execucoes and trainingRuns into rows", () => {
    const rows = extractExecutions(fixture);
    expect(rows).toHaveLength(3);
    const chat = rows.filter((r) => r.kind === "chat");
    expect(chat).toHaveLength(2);
    expect(chat[0].mission_id).toBe("m_analise");
    expect(chat[0].team_idx).toBe(0);
    const training = rows.filter((r) => r.kind === "training");
    expect(training).toHaveLength(1);
    expect(training[0].team_idx).toBe(1);
  });

  it("preserves execution id and timestamp", () => {
    const rows = extractExecutions(fixture);
    const ex1 = rows.find((r) => r.id === "ex_1");
    expect(ex1.created_at).toBe("2026-05-28T10:00:00Z");
  });
});

describe("extractTokenLogs", () => {
  it("maps each log to a row", () => {
    const rows = extractTokenLogs(fixture);
    expect(rows).toHaveLength(1);
    expect(rows[0].event_id).toBe("evt_1");
    expect(rows[0].team_idx).toBe(0);
    expect(rows[0].mission_id).toBe("m_analise");
  });
});

describe("extractHelpRequests", () => {
  it("maps each help request to a row preserving id and status", () => {
    const rows = extractHelpRequests(fixture);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("h1");
    expect(rows[0].status).toBe("open");
    expect(rows[0].team_idx).toBe(0);
  });
});

describe("extractPresence", () => {
  it("emits one presence row per occupied team slot", () => {
    const rows = extractPresence(fixture);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      event_id: "evt_1",
      team_idx: 0,
      member_name: "Anitta",
    });
  });
});
