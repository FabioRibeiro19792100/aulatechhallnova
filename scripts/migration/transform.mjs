const EVENT_WIDE_KEYS = [
  "id",
  "name",
  "status",
  "mode",
  "teams",
  "missions",
  "anuncios",
  "sessionTimer",
  "sessionTimerNotice",
  "screenShare",
  "helpDisabledMap",
  "facilitatorPin",
];

const TEAM_KEYED_BY_MISSION = [
  ["execucoes", null],
  ["reflexoes", "reflexoes"],
  ["conclusoes", "conclusoes"],
  ["questionariosPendentes", "questionariosPendentes"],
  ["missionGlossaries", "missionGlossaries"],
  ["preservedMissionUsage", "preservedMissionUsage"],
];

function pickEventPayload(event) {
  const payload = {};
  for (const key of EVENT_WIDE_KEYS) {
    if (key === "id") continue;
    if (event[key] !== undefined) payload[key] = event[key];
  }
  return payload;
}

function teamSlotKey(rawKey) {
  const [teamIdxRaw, missionId] = `${rawKey}`.split("__");
  return { teamIdx: Number(teamIdxRaw), missionId };
}

function buildTeamPayload(event, teamIdx) {
  const payload = {};
  for (const [sourceKey, targetKey] of TEAM_KEYED_BY_MISSION) {
    if (sourceKey === "execucoes") continue;
    const source = event[sourceKey] || {};
    const slot = {};
    for (const [rawKey, value] of Object.entries(source)) {
      const { teamIdx: ti, missionId } = teamSlotKey(rawKey);
      if (ti !== teamIdx || !missionId) continue;
      slot[missionId] = value;
    }
    payload[targetKey] = slot;
  }

  const anamnese = event.anamnesisResponses?.[teamIdx];
  if (anamnese) payload.anamnese = anamnese;

  const trainingRuns = event.trainingRuns?.[teamIdx];
  if (Array.isArray(trainingRuns)) payload.trainingRuns = trainingRuns;

  return payload;
}

export function splitEventIntoRows(event) {
  const eventRow = {
    event_id: event.id,
    payload: pickEventPayload(event),
  };

  const teams = Array.isArray(event.teams) ? event.teams : [];
  const teamRows = teams.map((_team, teamIdx) => ({
    event_id: event.id,
    team_idx: teamIdx,
    payload: buildTeamPayload(event, teamIdx),
  }));

  return { eventRow, teamRows };
}

export function extractExecutions(event) {
  const rows = [];
  const execMap = event.execucoes || {};
  for (const [rawKey, list] of Object.entries(execMap)) {
    if (!Array.isArray(list)) continue;
    const { teamIdx, missionId } = teamSlotKey(rawKey);
    if (Number.isNaN(teamIdx) || !missionId) continue;
    for (const exec of list) {
      rows.push({
        id: `${exec.id || `${rawKey}_${exec.ts || rows.length}`}`,
        event_id: event.id,
        team_idx: teamIdx,
        mission_id: missionId,
        kind: exec.kind || "chat",
        payload: stripIdAndTs(exec),
        tokens: exec.tokens || {},
        custo: exec.custo ?? null,
        created_at: exec.ts || exec.createdAt || new Date(0).toISOString(),
      });
    }
  }

  const trainingMap = event.trainingRuns || {};
  for (const [teamIdxRaw, list] of Object.entries(trainingMap)) {
    if (!Array.isArray(list)) continue;
    const teamIdx = Number(teamIdxRaw);
    if (Number.isNaN(teamIdx)) continue;
    for (const exec of list) {
      rows.push({
        id: `${exec.id || `training_${teamIdxRaw}_${exec.ts || rows.length}`}`,
        event_id: event.id,
        team_idx: teamIdx,
        mission_id: "__training__",
        kind: "training",
        payload: stripIdAndTs(exec),
        tokens: exec.tokens || {},
        custo: exec.custo ?? null,
        created_at: exec.ts || exec.createdAt || new Date(0).toISOString(),
      });
    }
  }

  return rows;
}

export function extractTokenLogs(event) {
  const list = Array.isArray(event.tokenOperationalLogs) ? event.tokenOperationalLogs : [];
  return list.map((entry) => ({
    event_id: event.id,
    team_idx: entry.teamIdx ?? null,
    mission_id: entry.missionId || null,
    payload: stripIdAndTs(entry),
    created_at: entry.ts || entry.createdAt || new Date(0).toISOString(),
  }));
}

export function extractHelpRequests(event) {
  const list = Array.isArray(event.helpRequests) ? event.helpRequests : [];
  return list.map((entry) => ({
    id: `${entry.id || `${event.id}_${entry.teamIdx}_${entry.createdAt || entry.ts || Math.random()}`}`,
    event_id: event.id,
    team_idx: entry.teamIdx ?? 0,
    mission_id: entry.missionId || null,
    status: entry.status || "open",
    payload: stripIdAndTs(entry),
    created_at: entry.createdAt || entry.ts || new Date(0).toISOString(),
    updated_at: entry.updatedAt || entry.resolvedAt || entry.cancelledAt || entry.createdAt || entry.ts || new Date(0).toISOString(),
  }));
}

export function extractPresence(event) {
  const map = event.presenceMap || {};
  return Object.entries(map)
    .filter(([, value]) => value && value.lastSeenAt)
    .map(([teamIdxRaw, value]) => ({
      event_id: event.id,
      team_idx: Number(teamIdxRaw),
      member_name: value.memberName || "",
      last_seen_at: value.lastSeenAt,
    }));
}

function stripIdAndTs(item) {
  if (!item || typeof item !== "object") return {};
  const { id: _id, ts: _ts, createdAt: _createdAt, ...rest } = item;
  return rest;
}
