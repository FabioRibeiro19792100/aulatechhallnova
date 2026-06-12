import "dotenv/config";
import { AGENT_MISSION_ID } from "../src/data/agentMission.js";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL e SUPABASE_ANON_KEY precisam estar configurados.");
  }
  return {
    url: url.replace(/\/+$/, ""),
    anonKey,
  };
}

async function db(pathname, { method = "GET", body, headers = {}, timeoutMs = 20000 } = {}) {
  const { url, anonKey } = getSupabaseConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`${url}${pathname}`, {
      method,
      signal: controller.signal,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } finally {
    clearTimeout(timer);
  }
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Falha ao consultar ${pathname}`);
  }
  return text ? JSON.parse(text) : null;
}

function removeMissionScopedKeys(map, missionId) {
  if (!map || typeof map !== "object") return {};
  return Object.fromEntries(
    Object.entries(map).filter(([key]) => !key.endsWith(`__${missionId}`)),
  );
}

function removeMissionFromLegacyArchive(archive, missionId) {
  if (!archive || typeof archive !== "object") return archive;
  return {
    ...archive,
    missions: Array.isArray(archive.missions) ? archive.missions.filter((mission) => mission?.id !== missionId) : archive.missions,
    execucoes: removeMissionScopedKeys(archive.execucoes, missionId),
    reflexoes: removeMissionScopedKeys(archive.reflexoes, missionId),
    questionariosPendentes: removeMissionScopedKeys(archive.questionariosPendentes, missionId),
    conclusoes: removeMissionScopedKeys(archive.conclusoes, missionId),
    preservedMissionUsage: removeMissionScopedKeys(archive.preservedMissionUsage, missionId),
    helpRequests: Array.isArray(archive.helpRequests)
      ? archive.helpRequests.filter((item) => item?.missionId !== missionId && item?.mission_id !== missionId)
      : archive.helpRequests,
  };
}

function sanitizeEventPayload(payload, missionId) {
  const nextPayload = { ...(payload || {}) };
  if (Array.isArray(nextPayload.missions)) {
    nextPayload.missions = nextPayload.missions.filter((mission) => mission?.id !== missionId);
  }
  nextPayload.execucoes = removeMissionScopedKeys(nextPayload.execucoes, missionId);
  nextPayload.reflexoes = removeMissionScopedKeys(nextPayload.reflexoes, missionId);
  nextPayload.questionariosPendentes = removeMissionScopedKeys(nextPayload.questionariosPendentes, missionId);
  nextPayload.conclusoes = removeMissionScopedKeys(nextPayload.conclusoes, missionId);
  nextPayload.preservedMissionUsage = removeMissionScopedKeys(nextPayload.preservedMissionUsage, missionId);
  nextPayload.missionGlossaries = removeMissionScopedKeys(nextPayload.missionGlossaries, missionId);
  nextPayload.missionResets = removeMissionScopedKeys(nextPayload.missionResets, missionId);
  nextPayload.missionTokenPolicies = nextPayload.missionTokenPolicies && typeof nextPayload.missionTokenPolicies === "object"
    ? Object.fromEntries(Object.entries(nextPayload.missionTokenPolicies).filter(([key]) => key !== missionId))
    : {};
  nextPayload.helpRequests = Array.isArray(nextPayload.helpRequests)
    ? nextPayload.helpRequests.filter((item) => item?.missionId !== missionId && item?.mission_id !== missionId)
    : [];
  nextPayload.tokenOperationalLogs = Array.isArray(nextPayload.tokenOperationalLogs)
    ? nextPayload.tokenOperationalLogs.filter((item) => item?.missionId !== missionId && item?.mission_id !== missionId)
    : [];
  nextPayload.agentMissionParticipants = {};
  nextPayload.legacyMissionArchive = removeMissionFromLegacyArchive(nextPayload.legacyMissionArchive, missionId);
  return nextPayload;
}

function sanitizeTeamPayload(payload, missionId) {
  const nextPayload = { ...(payload || {}) };
  nextPayload.execucoes = removeMissionScopedKeys(nextPayload.execucoes, missionId);
  nextPayload.reflexoes = removeMissionScopedKeys(nextPayload.reflexoes, missionId);
  nextPayload.questionariosPendentes = removeMissionScopedKeys(nextPayload.questionariosPendentes, missionId);
  nextPayload.conclusoes = removeMissionScopedKeys(nextPayload.conclusoes, missionId);
  nextPayload.preservedMissionUsage = removeMissionScopedKeys(nextPayload.preservedMissionUsage, missionId);
  nextPayload.missionGlossaries = removeMissionScopedKeys(nextPayload.missionGlossaries, missionId);
  nextPayload.missionResets = removeMissionScopedKeys(nextPayload.missionResets, missionId);
  nextPayload.agentMissionParticipants = {};
  return nextPayload;
}

async function updateEventStateRows(missionId) {
  const rows = await db("/rest/v1/event_state?select=event_id,payload,version,updated_at");
  let updated = 0;
  for (const row of rows || []) {
    const nextPayload = sanitizeEventPayload(row.payload || {}, missionId);
    const changed = JSON.stringify(nextPayload) !== JSON.stringify(row.payload || {});
    if (!changed) continue;
    const updatedAt = new Date().toISOString();
    const nextVersion = (row.version || 0) + 1;
    await db(
      `/rest/v1/event_state?event_id=eq.${encodeURIComponent(row.event_id)}&version=eq.${row.version}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: {
          payload: nextPayload,
          version: nextVersion,
          updated_at: updatedAt,
        },
      },
    );
    updated += 1;
  }
  return updated;
}

async function updateTeamStateRows(missionId) {
  const rows = await db("/rest/v1/team_state?select=event_id,team_idx,payload,version,updated_at");
  let updated = 0;
  for (const row of rows || []) {
    const nextPayload = sanitizeTeamPayload(row.payload || {}, missionId);
    const changed = JSON.stringify(nextPayload) !== JSON.stringify(row.payload || {});
    if (!changed) continue;
    const updatedAt = new Date().toISOString();
    const nextVersion = (row.version || 0) + 1;
    await db(
      `/rest/v1/team_state?event_id=eq.${encodeURIComponent(row.event_id)}&team_idx=eq.${row.team_idx}&version=eq.${row.version}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: {
          payload: nextPayload,
          version: nextVersion,
          updated_at: updatedAt,
        },
      },
    );
    updated += 1;
  }
  return updated;
}

async function countRows(pathname) {
  const rows = await db(pathname);
  return Array.isArray(rows) ? rows.length : 0;
}

async function deleteRows(pathname) {
  await db(pathname, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

async function main() {
  console.log(`Limpando missão do Agente: ${AGENT_MISSION_ID}`);
  const encodedMissionId = encodeURIComponent(AGENT_MISSION_ID);
  const executionCount = await countRows(`/rest/v1/executions?mission_id=eq.${encodedMissionId}&select=id`);
  const tokenLogCount = await countRows(`/rest/v1/token_operational_logs?mission_id=eq.${encodedMissionId}&select=id`);
  const helpRequestCount = await countRows(`/rest/v1/help_requests?mission_id=eq.${encodedMissionId}&select=id`);

  console.log(
    JSON.stringify(
      {
        missionId: AGENT_MISSION_ID,
        executions: executionCount,
        tokenLogs: tokenLogCount,
        helpRequests: helpRequestCount,
      },
      null,
      2,
    ),
  );

  if (executionCount) {
    await deleteRows(`/rest/v1/executions?mission_id=eq.${encodedMissionId}`);
  }
  if (tokenLogCount) {
    await deleteRows(`/rest/v1/token_operational_logs?mission_id=eq.${encodedMissionId}`);
  }
  if (helpRequestCount) {
    await deleteRows(`/rest/v1/help_requests?mission_id=eq.${encodedMissionId}`);
  }

  const updatedEvents = await updateEventStateRows(AGENT_MISSION_ID);
  const updatedTeams = await updateTeamStateRows(AGENT_MISSION_ID);

  console.log(
    JSON.stringify(
      {
        deleted: {
          executions: executionCount,
          tokenLogs: tokenLogCount,
          helpRequests: helpRequestCount,
        },
        updated: {
          eventStates: updatedEvents,
          teamStates: updatedTeams,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
