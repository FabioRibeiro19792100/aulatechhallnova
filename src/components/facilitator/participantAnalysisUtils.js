import { TRAINING_THREAD_ID } from "../../utils.js";

const DEFAULT_EVENT_MODE = "missions";

function sortByTimestamp(items = []) {
  return [...items].sort((a, b) => new Date(a.ts || 0) - new Date(b.ts || 0));
}

function isGenericTeamName(name = "") {
  return /^time\s+\d+$/i.test((name || "").trim());
}

export function getParticipantAnalysisStorageKey(teamIdx, participantId) {
  const normalized = `${participantId || ""}`.trim().toLowerCase().replace(/\s+/g, "-") || `team-${teamIdx}`;
  return `${teamIdx}__${normalized}`;
}

export function getParticipantAnalysisMap(evento) {
  return evento?.participantAnalyses || {};
}

export function getTeamExecutionHistory(evento, teamIdx) {
  const missionEntries = Object.entries(evento?.execucoes || {})
    .filter(([key]) => `${key}`.startsWith(`${teamIdx}__`))
    .flatMap(([, execs]) => (Array.isArray(execs) ? execs : []))
    .map((exec) => ({ ...exec, missionId: exec.missionId || null }));

  const trainingEntries = Array.isArray(evento?.trainingRuns?.[`${teamIdx}`])
    ? evento.trainingRuns[`${teamIdx}`].map((exec) => ({ ...exec, missionId: TRAINING_THREAD_ID }))
    : [];

  return sortByTimestamp([...missionEntries, ...trainingEntries]);
}

export function resolveParticipantIdentity(evento, teamIdx, execution = null) {
  const team = evento?.teams?.[teamIdx] || null;
  const explicitName = `${execution?.memberName || ""}`.trim();
  if (explicitName) {
    return {
      participantId: explicitName,
      displayName: explicitName,
      confidence: "high",
      confidenceLabel: "alta",
      source: "execution_member",
      teamIdx,
      teamName: team?.name || `Time ${teamIdx + 1}`,
    };
  }

  const anamnesisName = `${evento?.anamnesisResponses?.[teamIdx]?.memberName || ""}`.trim();
  if (anamnesisName) {
    return {
      participantId: anamnesisName,
      displayName: anamnesisName,
      confidence: "medium",
      confidenceLabel: "media",
      source: "anamnesis_member",
      teamIdx,
      teamName: team?.name || `Time ${teamIdx + 1}`,
    };
  }

  const presenceName = `${evento?.presenceMap?.[teamIdx]?.memberName || ""}`.trim();
  if (presenceName) {
    return {
      participantId: presenceName,
      displayName: presenceName,
      confidence: "medium",
      confidenceLabel: "media",
      source: "presence_member",
      teamIdx,
      teamName: team?.name || `Time ${teamIdx + 1}`,
    };
  }

  const memberList = Array.isArray(team?.members) ? team.members.filter(Boolean) : [];
  if (memberList.length === 1) {
    const soleMember = `${memberList[0] || ""}`.trim();
    return {
      participantId: soleMember,
      displayName: soleMember,
      confidence: "medium",
      confidenceLabel: "media",
      source: "sole_team_member",
      teamIdx,
      teamName: team?.name || `Time ${teamIdx + 1}`,
    };
  }

  const teamName = `${team?.name || ""}`.trim() || `Time ${teamIdx + 1}`;
  return {
    participantId: teamName,
    displayName: teamName,
    confidence: isGenericTeamName(teamName) ? "low" : "medium",
    confidenceLabel: isGenericTeamName(teamName) ? "baixa" : "media",
    source: "team_name_fallback",
    teamIdx,
    teamName,
  };
}

export function isParticipantJourneyClosed(evento, teamIdx) {
  if (!evento) return false;
  const eventMode = evento.eventMode || DEFAULT_EVENT_MODE;
  if (eventMode !== DEFAULT_EVENT_MODE) return false;
  const missions = Array.isArray(evento.missions) ? evento.missions : [];
  if (!missions.length) return false;
  return missions.every((mission) => {
    const entry = evento.conclusoes?.[`${teamIdx}__${mission.id}`] || null;
    if (!entry || typeof entry !== "object") return false;
    return entry.source !== "reopened";
  });
}

export function buildParticipantHistorySignature(evento, teamIdx) {
  const history = getTeamExecutionHistory(evento, teamIdx);
  const closureMarks = (Array.isArray(evento?.missions) ? evento.missions : [])
    .map((mission) => {
      const entry = evento?.conclusoes?.[`${teamIdx}__${mission.id}`] || null;
      if (!entry || typeof entry !== "object") return `${mission.id}:open`;
      return `${mission.id}:${entry.updatedAt || entry.closedAt || entry.source || "closed"}`;
    })
    .join("|");

  return [
    history.length,
    history.map((exec) => `${exec.id || exec.ts || "x"}:${exec.ts || ""}:${exec.input?.length || 0}`).join("|"),
    closureMarks,
  ].join("::");
}

export const MIN_PARTICIPANT_ANALYSIS_PROMPTS = 5;

export function buildParticipantDescriptor(evento, teamIdx) {
  const history = getTeamExecutionHistory(evento, teamIdx);
  const latestExecution = history[history.length - 1] || null;
  const identity = resolveParticipantIdentity(evento, teamIdx, latestExecution);
  const analysisKey = getParticipantAnalysisStorageKey(teamIdx, identity.participantId);
  return {
    ...identity,
    analysisKey,
    history,
    isEligibleForAnalysis: history.length >= MIN_PARTICIPANT_ANALYSIS_PROMPTS,
    historySignature: buildParticipantHistorySignature(evento, teamIdx),
    journeyClosed: isParticipantJourneyClosed(evento, teamIdx),
    lastActivityAt: latestExecution?.ts || null,
    analysisEntry: getParticipantAnalysisMap(evento)[analysisKey] || null,
  };
}

export function getAllParticipantDescriptors(evento) {
  const teamCount = Array.isArray(evento?.teams) ? evento.teams.length : 0;
  const analyses = Object.values(getParticipantAnalysisMap(evento)).filter(Boolean);
  const teamIndexes = new Set([
    ...Array.from({ length: teamCount }, (_, index) => index),
    ...analyses.map((entry) => Number(entry.teamIdx)).filter((value) => Number.isFinite(value)),
  ]);

  return [...teamIndexes]
    .map((teamIdx) => buildParticipantDescriptor(evento, teamIdx))
    .filter((entry) => entry.history.length || entry.analysisEntry)
    .sort((a, b) => {
      const aTime = new Date(a.lastActivityAt || 0).getTime();
      const bTime = new Date(b.lastActivityAt || 0).getTime();
      if (bTime !== aTime) return bTime - aTime;
      return a.displayName.localeCompare(b.displayName, "pt-BR");
    });
}
