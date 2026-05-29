import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, BookOpen, CalendarDays, ChevronDown, CircleAlert, Clock3, Code2, Coins, Copy, FileText, FileStack, FolderOpen, LayoutDashboard, LifeBuoy, ListChecks, Map, MessageSquareText, Monitor, Newspaper, Paperclip, SlidersHorizontal, Sparkles, ThumbsDown, ThumbsUp, Users, WandSparkles, Waypoints, X } from "lucide-react";
import { Room, RoomEvent, Track } from "livekit-client";
import { createClient } from "@supabase/supabase-js";
import MarkdownMessage from "./MarkdownMessage.jsx";
import techHallLogoDark from "../tech_hall_branding/tech_hall_preto.png";
import techHallFooterIcon from "../tech_hall_branding/icone_8.png";
import { Topbar, AppFooter, DevQuickSwitch, EmptyState } from "./components/ui/Layout.jsx";
import { Modal, BrandLoaderOverlay } from "./components/ui/Modals.jsx";
import { ModelSelect } from "./components/ui/ModelSelect.jsx";
import { ProcessingPipeline, TransparencyPanel, ReasoningPanel, ThinkingIndicator, LiveRunCard, AttachmentList, LiveAnswer, ComposerResponseInline } from "./components/conversation/ResponseComponents.jsx";
import { HtmlArtifactCard, GeneratedArtifactsPanel } from "./components/conversation/ArtifactComponents.jsx";
import { PromptConversation } from "./components/conversation/PromptConversation.jsx";
import { GuidedSection, LearningSlide, TechnicalReadingList, TechnicalReadingBlock, GuidedReading, MissionReadingPanel, MissionClosurePanel } from "./components/mission/MissionComponents.jsx";
import { OutputCard, HistorySection, MissionTokenRail, ReflectionSummary } from "./components/mission/MissionOutput.jsx";
import { EventCardSectionLabel, FacilitatorTabLabel, FacilitatorScreenShareButton, FacilitatorScreenSharePanel, TeamScreenShareViewer, RoomMapPanel, TokenManagementPanel, FacilitatorToolsDrawer } from "./components/facilitator/FacilitatorComponents.jsx";
import { PromptInsightsPanel } from "./components/facilitator/PromptInsightsPanel.jsx";
import { AnamnesisInsightsPanel } from "./components/facilitator/AnamnesisInsightsPanel.jsx";
import { DashboardPanel } from "./components/facilitator/DashboardPanel.jsx";
import { MissionsPanel } from "./components/facilitator/MissionsPanel.jsx";
import { ANAMNESIS_UNKNOWN_VALUE, ANAMNESIS_QUESTIONS, ANAMNESIS_STOPWORDS, isAnamnesisEnabled, getAnamnesisResponse, hasCompletedAnamnesis, getAnamnesisAnswerChoice, getAnamnesisAnswerNote, isAnamnesisUnknownChoice, isAnamnesisAnswerFilled, countAnsweredAnamnesisQuestions, normalizeAnamnesisText, normalizeAnamnesisAnswer, getAnamnesisQuestionResults, extractAnamnesisKeywords } from "./data/anamnesis.js";
import {
  FREE_ACTION_KEY, FREE_ACTION_LABEL, TRAINING_THREAD_ID, CHAT_AI_MODE, CODING_AI_MODE,
  DEFAULT_MISSION_TOKEN_LIMIT, TOKEN_MISSION_TRAINING_ID, TOKEN_POLICY_MODE_UNLIMITED,
  TOKEN_POLICY_MODE_DEFAULT, TOKEN_POLICY_MODE_CUSTOM, TECHNICAL_FEEDBACK_REASONS,
  PRESENCE_STALE_MS, FACILITATOR_TOOL_VIEWS, PERGUNTAS_REFLEXAO, REFLECTION_TOPIC_LABELS,
  REFLECTION_TOPIC_SHORT_LABELS, ANALYSIS_NOT_APPLICABLE, TECHNICAL_PANEL_BLOCKS,
  MONTH_LABELS_PT, USD_TO_BRL, formatBRL, formatModelLaunch, formatModelPriceHint,
  formatTokenLimitLabel, parseTokenLimitInput, formatTokenLimitInput, formatCountdown,
  formatDateTime, isFreeInstructionAction, getActionLabel, downloadTextArtifact,
  downloadHtmlArtifact, writePreviewWindowDocument, buildPreviewWindowHtmlDocument,
  openHtmlPreviewWindow, normalizeStudentName, getEventStudentOptions, isPresenceLive,
  getScreenShareState, fetchLiveKitToken, getReflectionTopicLabel, getReflectionTopicShortLabel,
  getTokenMissionId, getMissionTokenPolicy, getMissionTokenBaseLimit, getMissionAiMode,
  normalizeMission, buildHistorySignal, isMeaningfulAnalysisText, normalizeAnalysisItemArray,
  normalizeGlossaryEntries, mergeGlossaryEntries, buildTechnicalAnalysisFallbackBlocks,
  normalizeTechnicalAnalysis,
} from "./utils.js";
import { STUDENT_RESOURCE_SECTIONS, getStudentResourcePreviewUrl } from "./data/resources.js";
import { TRAINING_MISSION, AI_MODE_LABELS, SYSTEM_PROMPTS, getSystemPrompt, FIXED_MISSION_TEMPLATE, FIXED_MISSIONS_CATALOG, MOCKS, EXPLICACOES, SIMULATION_STEPS, MISSION_CONCEPTS } from "./data/missions.js";
import { FALLBACK_MODEL_CATALOG, DEFAULT_CHAT_MODEL, DEFAULT_CODING_MODEL, getModelCatalog, getModelsForMode, getCatalogEntries, findModelEntry, getModelPricingMap, getModelLabel, getDefaultModelForMode } from "./data/models.js";

const TRAINING_MODE_EVENT = "training";
const MISSIONS_MODE_EVENT = "missions";
const CODING_AI_REASONING_EFFORT = "medium";
const TECHNICAL_ANALYSIS_MODEL = "gpt-4.1-mini";
const FACILITATOR_PASSWORD = "camila";
const SURVIVAL_PASSWORD = "2805";
const DEFAULT_TOKEN_GRANT_AMOUNT = 15000;
const SURVIVAL_ROUTE = "/survival";
const SURVIVAL_STORE = "techhall:survival:v1";
const SURVIVAL_THEME_DARK = "dark";
const SURVIVAL_THEME_LIGHT = "light";
const BRAND_LOADER_DURATION_MS = 700;
const REMOTE_SYNC_SAVE_DEBOUNCE_MS = 80;
const CONFIG_POLL_MS = 30000;
const STATE_POLL_MS_WITH_REALTIME = 5000;
const STATE_POLL_MS_WITHOUT_REALTIME = 3000;
const TIMER_NOTICE_TTL_MS = 30000;
const TIMER_LOCK_TTL_MS = 15000;
const MAX_ATTACHMENT_COUNT = 3;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENT_TEXT_CHARS = 12000;
const ATTACHMENT_ACCEPT = ".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp";
const SURVIVAL_CHAT_MISSION = {
  id: "survival_chat",
  num: 0,
  aiMode: CHAT_AI_MODE,
  name: "Pílula azul",
  category: "chat",
  desc: "Modo survival com chat livre e persistência local.",
  situacao: "Conversa livre local, sem vínculo com evento, histórico remoto ou facilitador.",
  instrucao: "Use este modo para conversar com a IA em contingência, com tudo salvo só neste navegador.",
  placeholder: "Escreva sua mensagem...",
  acoes: [],
};

const SURVIVAL_CODING_MISSION = {
  id: "survival_coding",
  num: 0,
  aiMode: CODING_AI_MODE,
  name: "Pílula vermelha",
  category: "coding",
  desc: "Modo survival focado em código, debugging e implementação.",
  situacao: "Conversa técnica local, sem vínculo com evento, histórico remoto ou facilitador.",
  instrucao: "Use este modo para pedir código, revisar arquitetura, debugar e gerar protótipos.",
  placeholder: "Descreva o problema técnico, cole código ou peça um protótipo...",
  acoes: [],
};


const STORE = "techhall:v3";
const SHOW_DEV_SWITCH = true;

function buildRunSteps(apiConfigured) {
  if (apiConfigured) {
    return [];
  }
  return SIMULATION_STEPS.map((step, index) => ({
    ...step,
    status: index === 0 ? "active" : "pending",
    label: step.label,
  }));
}
function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "{}");
  } catch {
    return {};
  }
}

function saveStore(data) {
  const current = loadStore();
  localStorage.setItem(STORE, JSON.stringify({
    ...current,
    ...data,
  }));
}

function loadSurvivalStore() {
  try {
    return JSON.parse(localStorage.getItem(SURVIVAL_STORE) || "{}");
  } catch {
    return {};
  }
}

function saveSurvivalStore(data) {
  const current = loadSurvivalStore();
  localStorage.setItem(
    SURVIVAL_STORE,
    JSON.stringify({
      ...current,
      ...data,
    }),
  );
}

function normalizeAppPath(pathname = "/") {
  const normalized = `${pathname || "/"}`.trim();
  if (!normalized || normalized === "//") return "/";
  return normalized.endsWith("/") && normalized !== "/" ? normalized.slice(0, -1) : normalized;
}

function isSurvivalPath(pathname = "") {
  return normalizeAppPath(pathname) === SURVIVAL_ROUTE;
}

function replaceAppPath(pathname = "/") {
  if (typeof window === "undefined") return;
  const nextPath = normalizeAppPath(pathname);
  const currentPath = normalizeAppPath(window.location.pathname);
  if (nextPath === currentPath) return;
  window.history.replaceState({}, "", nextPath);
}

function getSurvivalMission(aiMode) {
  return aiMode === CODING_AI_MODE ? SURVIVAL_CODING_MISSION : SURVIVAL_CHAT_MISSION;
}

async function copyTextToClipboard(text) {
  const normalizedText = `${text || ""}`;
  if (!normalizedText) return false;

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(normalizedText);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = normalizedText;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);
  return successful;
}

async function fetchRemoteState() {
  const response = await fetch(`/api/state?ts=${Date.now()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao carregar estado remoto.");
  }
  const data = await response.json();
  return {
    ...data,
    serverNowMs: data?.serverNow ? new Date(data.serverNow).getTime() : null,
  };
}

async function saveRemoteState(events) {
  const response = await fetch("/api/state", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ events }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao salvar estado remoto.");
  }
  const data = await response.json();
  return {
    ...data,
    serverNowMs: data?.serverNow ? new Date(data.serverNow).getTime() : null,
  };
}

function estimateCost(pricingMap, model, inputTokens, outputTokens) {
  const price = pricingMap?.[model] || pricingMap?.[DEFAULT_CHAT_MODEL] || { input: 0, output: 0 };
  return ((inputTokens / 1_000_000) * price.input) + ((outputTokens / 1_000_000) * price.output);
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function parseStudentList(rawValue) {
  const seen = new Set();
  return rawValue
    .split("\n")
    .map((item) => normalizeStudentName(item))
    .filter(Boolean)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function makeTeam(name, members = []) {
  return {
    name,
    runs: 0,
    members,
  };
}

function shuffleArray(items) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[nextIndex]] = [clone[nextIndex], clone[index]];
  }
  return clone;
}

function buildTeamsFromStudents(students, mode, teamCount = 0) {
  if (mode === "solo") {
    return students.map((student) => makeTeam(student, [student]));
  }

  const totalTeams = Number(teamCount);
  if (!totalTeams || totalTeams < 1 || totalTeams > students.length) return [];
  const shuffled = shuffleArray(students);
  const groups = Array.from({ length: totalTeams }, (_, index) => makeTeam(`Time ${index + 1}`, []));
  shuffled.forEach((student, index) => {
    groups[index % totalTeams].members.push(student);
  });
  return groups;
}

function makeEvent({ name, desc, rawTeams }) {
  const teams = rawTeams
    ? rawTeams
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((team) => makeTeam(team))
    : [];
  const missions = buildFixedMissionList().map((mission, index) => ({
    ...mission,
    unlocked: index === 0,
  }));
  return {
    id: `ev_${Date.now()}`,
    name,
    desc,
    status: "draft",
    eventMode: MISSIONS_MODE_EVENT,
    missionTemplate: FIXED_MISSION_TEMPLATE,
    teams,
    missions,
    execucoes: {},
    reflexoes: {},
    questionariosPendentes: {},
    conclusoes: {},
    preservedMissionUsage: {},
    missionGlossaries: {},
    missionTokenPolicies: {},
    tokenGrants: [],
    tokenOperationalLogs: [],
    helpRequests: [],
    helpDisabledMap: {},
    anamnesisEnabled: false,
    anamnesisResponses: {},
    trainingRuns: {},
    trainingHelpRequests: [],
    announcements: [],
    sessionTimer: {
      active: false,
      startedAt: null,
      endsAt: null,
      durationMs: 0,
    },
    sessionTimerNotice: null,
    presenceMap: {},
    screenShare: {
      active: false,
      roomName: "",
      presenterId: "",
      startedAt: null,
      endedAt: null,
      provider: "livekit",
    },
  };
}

function makeDevLabEvent() {
  const event = makeEvent({
    name: "Lab de teste",
    desc: "Ambiente rápido para validar fluxo local",
    rawTeams: "Time 1",
  });
  return {
    ...event,
    status: "open",
    eventMode: MISSIONS_MODE_EVENT,
    missions: event.missions.map((mission, index) => ({
      ...normalizeMission(mission),
      unlocked: index === 0,
    })),
  };
}

function getEventMode(evento) {
  return evento?.eventMode || MISSIONS_MODE_EVENT;
}


function isEventHidden(evento) {
  return Boolean(evento?.hiddenAt);
}

function getMissionResetAt(evento, teamIdx, missionId) {
  return evento.missionResets?.[`${teamIdx}__${missionId}`] || null;
}

function getExecucoes(evento, teamIdx, missionId) {
  const execs = evento.execucoes?.[`${teamIdx}__${missionId}`] || [];
  const resetAt = getMissionResetAt(evento, teamIdx, missionId);
  if (!resetAt) return execs;
  return execs.filter((exec) => exec.ts && exec.ts >= resetAt);
}

function getTrainingRuns(evento, teamIdx) {
  return evento.trainingRuns?.[`${teamIdx}`] || [];
}

function getReflexao(evento, teamIdx, missionId) {
  const reflexao = evento.reflexoes?.[`${teamIdx}__${missionId}`] || null;
  if (!reflexao) return null;
  const resetAt = getMissionResetAt(evento, teamIdx, missionId);
  if (resetAt && reflexao.submittedAt && reflexao.submittedAt < resetAt) return null;
  return reflexao;
}

function getQuestionarioPendenteEntry(evento, teamIdx, missionId) {
  const entry = evento.questionariosPendentes?.[`${teamIdx}__${missionId}`] || null;
  if (!entry) return null;
  if (typeof entry === "object" && entry.source === "reopened") return null;
  const resetAt = getMissionResetAt(evento, teamIdx, missionId);
  const openedAt = typeof entry === "object" ? entry.openedAt : null;
  if (resetAt && openedAt && openedAt < resetAt) return null;
  return entry;
}

function isQuestionarioPendente(evento, teamIdx, missionId) {
  const pendente = getQuestionarioPendenteEntry(evento, teamIdx, missionId);
  if (!pendente) return false;
  const conclusao = getConclusaoEntry(evento, teamIdx, missionId);
  if (!conclusao) return true;
  const openedAt = toTimestamp(typeof pendente === "object" ? pendente.openedAt : 0);
  const closedAt = toTimestamp(typeof conclusao === "object" ? conclusao.closedAt || conclusao.concludedAt : 0);
  return openedAt > closedAt;
}

function getQuestionarioPendenteSource(evento, teamIdx, missionId) {
  const entry = getQuestionarioPendenteEntry(evento, teamIdx, missionId);
  if (!entry) return null;
  if (typeof entry === "string") return "facilitator";
  return entry.source || "facilitator";
}

function getConclusaoEntry(evento, teamIdx, missionId) {
  const entry = evento.conclusoes?.[`${teamIdx}__${missionId}`] || null;
  if (!entry) return null;
  if (typeof entry === "object" && entry.source === "reopened") return null;
  const resetAt = getMissionResetAt(evento, teamIdx, missionId);
  const concludedAt = typeof entry === "object" ? (entry.closedAt || entry.concludedAt) : null;
  if (resetAt && concludedAt && concludedAt < resetAt) return null;
  return entry;
}

function isConcluida(evento, teamIdx, missionId) {
  return Boolean(getConclusaoEntry(evento, teamIdx, missionId));
}

function getConclusaoSource(evento, teamIdx, missionId) {
  const entry = getConclusaoEntry(evento, teamIdx, missionId);
  if (!entry) return null;
  if (typeof entry === "string") return "legacy";
  return entry.source || "legacy";
}

function canFacilitatorReopenMissionForTeam(evento, teamIdx, missionId) {
  const closureSource = getConclusaoSource(evento, teamIdx, missionId);
  if (closureSource === "facilitator" || closureSource === "facilitator_no_evaluation") return true;
  return getQuestionarioPendenteSource(evento, teamIdx, missionId) === "facilitator";
}

function getMissionClosureStatus(evento, teamIdx, missionId) {
  if (isConcluida(evento, teamIdx, missionId)) return "concluida";
  if (isQuestionarioPendente(evento, teamIdx, missionId)) return "aguardando_questionario";
  return "aberta";
}

function getFirstPendingMissionIndex(evento, teamIdx) {
  if (!evento || teamIdx === null || teamIdx === undefined) return -1;
  return (evento.missions || []).findIndex((mission) => isQuestionarioPendente(evento, teamIdx, mission.id));
}

function getMissionUsageKey(teamIdx, missionId) {
  return `${teamIdx}__${missionId}`;
}

function getMissionGlossaryKey(teamIdx, missionId) {
  return `${teamIdx}__${missionId}`;
}

function getAnalysisMissionId(missionId, { isTraining = false } = {}) {
  if (isTraining || missionId === TRAINING_THREAD_ID || !missionId) return TRAINING_THREAD_ID;
  return missionId;
}

function getMissionGlossary(evento, teamIdx, missionId, { isTraining = false } = {}) {
  const analysisMissionId = getAnalysisMissionId(missionId, { isTraining });
  return evento?.missionGlossaries?.[getMissionGlossaryKey(teamIdx, analysisMissionId)] || [];
}

function getPreservedMissionUsage(evento, teamIdx, missionId) {
  return (
    evento.preservedMissionUsage?.[getMissionUsageKey(teamIdx, missionId)] || {
      total: 0,
      input: 0,
      output: 0,
      cost: 0,
    }
  );
}

function getMissionTokenGrants(evento, missionId, teamIdx = null, { isTraining = false } = {}) {
  const tokenMissionId = getTokenMissionId(missionId, { isTraining });
  return (evento?.tokenGrants || []).filter((grant) => {
    if (grant.missionId !== tokenMissionId) return false;
    if (grant.scope === "turma") return true;
    if (teamIdx === null || teamIdx === undefined) return false;
    return grant.teamIdx === teamIdx;
  });
}

function getMissionTokenUsage(evento, teamIdx, missionId, { isTraining = false } = {}) {
  if (!evento || teamIdx === null || teamIdx === undefined || !missionId) {
    return {
      missionId: getTokenMissionId(missionId, { isTraining }),
      promptTokens: 0,
      responseTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      analysisTokens: 0,
      analysisCost: 0,
    };
  }

  if (isTraining || missionId === TOKEN_MISSION_TRAINING_ID) {
    const trainingRuns = getTrainingRuns(evento, teamIdx);
    return trainingRuns.reduce(
      (acc, exec) => ({
        ...acc,
        promptTokens: acc.promptTokens + (exec.inputTokens || 0),
        responseTokens: acc.responseTokens + (exec.outputTokens || 0),
        totalTokens: acc.totalTokens + (exec.tokens || 0),
        totalCost: acc.totalCost + (exec.custo || 0),
        analysisTokens: acc.analysisTokens + (exec.technicalAnalysisUsage?.totalTokens || 0),
        analysisCost: acc.analysisCost + (exec.technicalAnalysisUsage?.cost || 0),
      }),
      {
        missionId: TOKEN_MISSION_TRAINING_ID,
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        analysisTokens: 0,
        analysisCost: 0,
      },
    );
  }

  const execs = getExecucoes(evento, teamIdx, missionId);
  const preservedUsage = getPreservedMissionUsage(evento, teamIdx, missionId);
  return execs.reduce(
    (acc, exec) => ({
      ...acc,
      promptTokens: acc.promptTokens + (exec.inputTokens || 0),
      responseTokens: acc.responseTokens + (exec.outputTokens || 0),
      totalTokens: acc.totalTokens + (exec.tokens || 0),
      totalCost: acc.totalCost + (exec.custo || 0),
      analysisTokens: acc.analysisTokens + (exec.technicalAnalysisUsage?.totalTokens || 0),
      analysisCost: acc.analysisCost + (exec.technicalAnalysisUsage?.cost || 0),
    }),
    {
      missionId,
      promptTokens: preservedUsage.input || 0,
      responseTokens: preservedUsage.output || 0,
      totalTokens: preservedUsage.total || 0,
      totalCost: preservedUsage.cost || 0,
      analysisTokens: preservedUsage.explanationTotal || 0,
      analysisCost: preservedUsage.explanationCost || 0,
    },
  );
}

function getEffectiveMissionTokenBudget(evento, teamIdx, missionId, options = {}) {
  const policy = getMissionTokenPolicy(evento, missionId, options);
  const grants = getMissionTokenGrants(evento, missionId, teamIdx, options);
  const baseLimit = getMissionTokenBaseLimit(policy);
  const extraTokens = grants.reduce((sum, grant) => sum + Math.max(0, Number(grant.amount || 0)), 0);
  const effectiveLimit = baseLimit === null ? null : baseLimit + extraTokens;
  const usage = getMissionTokenUsage(evento, teamIdx, missionId, options);
  return {
    missionId: policy.missionId,
    policy,
    grants,
    usage,
    extraTokens,
    baseLimit,
    effectiveLimit,
    unlimited: effectiveLimit === null,
    blocked: effectiveLimit !== null && usage.totalTokens >= effectiveLimit,
  };
}

function getMissionTokenOperationalLogs(evento, missionId, teamIdx = null, { isTraining = false } = {}) {
  const tokenMissionId = getTokenMissionId(missionId, { isTraining });
  return (evento?.tokenOperationalLogs || [])
    .filter((item) => {
      if (item.missionId !== tokenMissionId) return false;
      if (teamIdx === null || teamIdx === undefined) return true;
      return item.teamIdx === null || item.teamIdx === undefined || item.teamIdx === teamIdx;
    })
    .sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function getHelpRequests(evento, teamIdx, missionId) {
  return (evento.helpRequests || []).filter((request) => request.teamIdx === teamIdx && request.missionId === missionId);
}

function getTrainingHelpRequests(evento, teamIdx = null) {
  return (evento.trainingHelpRequests || []).filter((request) => teamIdx === null || request.teamIdx === teamIdx);
}

function getTrainingTokenRequests(evento, teamIdx = null) {
  return (evento.helpRequests || []).filter(
    (request) =>
      request.missionId === TOKEN_MISSION_TRAINING_ID &&
      (teamIdx === null || request.teamIdx === teamIdx),
  );
}

function isHelpDisabledForTeam(evento, teamIdx) {
  if (!evento || teamIdx === null || teamIdx === undefined) return false;
  return Boolean(evento.helpDisabledMap?.[teamIdx]?.disabled);
}

function getEventAnnouncements(evento) {
  const directAnnouncements = Array.isArray(evento?.announcements) ? evento.announcements : [];
  const legacyAnnouncement =
    directAnnouncements.length === 0 && evento?.announcement?.message?.trim()
      ? [
          {
            ...evento.announcement,
            id: evento.announcement.id || `announcement_legacy_${evento.id || Date.now()}`,
            createdAt: evento.announcement.createdAt || new Date().toISOString(),
            updatedAt: evento.announcement.updatedAt || evento.announcement.createdAt || new Date().toISOString(),
            message: evento.announcement.message.trim(),
            dismissedBy: evento.announcement.dismissedBy || {},
            readBy: evento.announcement.readBy || {},
          },
        ]
      : [];

  return [...directAnnouncements, ...legacyAnnouncement]
    .map((announcement) => ({
      ...announcement,
      message: `${announcement.message || ""}`.trim(),
      createdAt: announcement.createdAt || new Date().toISOString(),
      updatedAt: announcement.updatedAt || announcement.createdAt || new Date().toISOString(),
      dismissedBy: announcement.dismissedBy || {},
      readBy: announcement.readBy || {},
    }))
    .filter((announcement) => announcement.message)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function getUnreadAnnouncementsForTeam(evento, teamIdx) {
  if (teamIdx === null || teamIdx === undefined) return [];
  return getEventAnnouncements(evento).filter((announcement) => !announcement.readBy?.[teamIdx]);
}

function getLatestUnreadAnnouncementForTeam(evento, teamIdx) {
  const unread = getUnreadAnnouncementsForTeam(evento, teamIdx);
  return unread.length ? unread[unread.length - 1] : null;
}

function isAnnouncementDismissedForTeam(evento, teamIdx, announcementId) {
  if (teamIdx === null || teamIdx === undefined || !announcementId) return false;
  const announcement = getEventAnnouncements(evento).find((item) => item.id === announcementId);
  if (!announcement) return false;
  return Boolean(announcement.dismissedBy?.[teamIdx]);
}

function getSessionTimer(evento) {
  return {
    active: false,
    startedAt: null,
    endsAt: null,
    durationMs: 0,
    updatedAt: null,
    ...(evento?.sessionTimer || {}),
  };
}

function getSessionTimerNotice(evento, now = Date.now()) {
  const notice = evento?.sessionTimerNotice;
  if (!notice?.message || !notice?.createdAt || notice.dismissedAt) return null;
  const age = now - new Date(notice.createdAt).getTime();
  if (age >= TIMER_NOTICE_TTL_MS) return null;
  return {
    ...notice,
    expiresInMs: Math.max(0, TIMER_NOTICE_TTL_MS - age),
  };
}

function getSessionTimerRemainingMs(evento, now = Date.now()) {
  const timer = getSessionTimer(evento);
  if (!timer.active || !timer.endsAt) return 0;
  return Math.max(0, new Date(timer.endsAt).getTime() - now);
}

function isSessionTimerRunning(evento, now = Date.now()) {
  const timer = getSessionTimer(evento);
  return Boolean(timer.active && timer.endsAt && getSessionTimerRemainingMs(evento, now) > 0);
}

function isSessionTimerExpired(evento, now = Date.now()) {
  const timer = getSessionTimer(evento);
  return Boolean(timer.active && timer.endsAt && getSessionTimerRemainingMs(evento, now) <= 0);
}

function isSessionTimerLockActive(evento, now = Date.now()) {
  const timer = getSessionTimer(evento);
  if (!timer.active || !timer.endsAt) return false;
  const endsAtMs = new Date(timer.endsAt).getTime();
  if (endsAtMs > now) return false;
  return now - endsAtMs < TIMER_LOCK_TTL_MS;
}

function parseTimerInputToMs(rawValue) {
  const value = `${rawValue || ""}`.trim();
  if (!value) return null;
  const mmssMatch = value.match(/^(\d{1,3}):([0-5]\d)$/);
  if (mmssMatch) {
    const minutes = Number(mmssMatch[1]);
    const seconds = Number(mmssMatch[2]);
    const totalMs = (minutes * 60 + seconds) * 1000;
    return totalMs > 0 ? totalMs : null;
  }
  const asMinutes = Number(value);
  if (!Number.isFinite(asMinutes) || asMinutes <= 0) return null;
  return Math.round(asMinutes * 60 * 1000);
}

function getOpenHelpRequests(evento) {
  return getEventMode(evento) === TRAINING_MODE_EVENT
    ? [...getTrainingHelpRequests(evento), ...getTrainingTokenRequests(evento)].filter((request) => request.status === "open")
    : (evento.helpRequests || []).filter((request) => request.status === "open");
}

function getLatestTrainingRun(evento, teamIdx) {
  const runs = getTrainingRuns(evento, teamIdx);
  if (!runs.length) return null;
  return [...runs].sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0))[0];
}

async function fetchServerConfig() {
  const response = await fetch(`/api/config?ts=${Date.now()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Falha ao carregar configuração do servidor.");
  }
  return response.json();
}

async function saveServerOpenAIKey(apiKey) {
  const response = await fetch("/api/config/openai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ apiKey }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao salvar chave OpenAI no servidor.");
  }
  return response.json();
}

async function removeServerOpenAIKey() {
  const response = await fetch("/api/config/openai", {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao remover chave OpenAI do servidor.");
  }
  return response.json();
}

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function getFileExtension(name = "") {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

function toTimestamp(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function mergeRecordArraysById(remoteItems = [], localItems = [], candidateFields = ["updatedAt", "submittedAt", "resolvedAt", "cancelledAt", "createdAt", "ts"]) {
  const merged = new globalThis.Map();
  [...remoteItems, ...localItems].forEach((item) => {
    if (!item?.id) return;
    const previous = merged.get(item.id);
    if (!previous) {
      merged.set(item.id, item);
      return;
    }
    merged.set(item.id, pickLatestByTimestamp(previous, item, candidateFields));
  });
  return [...merged.values()];
}

function mergeObjectMaps(remoteMap = {}, localMap = {}, pickValue) {
  const keys = new Set([...Object.keys(remoteMap || {}), ...Object.keys(localMap || {})]);
  return Object.fromEntries(
    [...keys].map((key) => {
      const remoteValue = remoteMap?.[key];
      const localValue = localMap?.[key];
      return [key, pickValue ? pickValue(remoteValue, localValue) : localValue ?? remoteValue];
    }),
  );
}

function mergeExecucaoMaps(remoteMap = {}, localMap = {}) {
  const keys = new Set([...Object.keys(remoteMap || {}), ...Object.keys(localMap || {})]);
  return Object.fromEntries(
    [...keys].map((key) => {
      const mergedRuns = mergeRecordArraysById(remoteMap?.[key] || [], localMap?.[key] || [], ["ts"]);
      mergedRuns.sort((a, b) => toTimestamp(a.ts) - toTimestamp(b.ts));
      return [key, mergedRuns];
    }),
  );
}

function pickLatestByTimestamp(remoteValue, localValue, candidateFields = []) {
  if (!remoteValue) return localValue;
  if (!localValue) return remoteValue;

  const remoteTs = Math.max(...candidateFields.map((field) => toTimestamp(remoteValue?.[field])), 0);
  const localTs = Math.max(...candidateFields.map((field) => toTimestamp(localValue?.[field])), 0);

  if (localTs >= remoteTs) return { ...remoteValue, ...localValue };
  return { ...localValue, ...remoteValue };
}

function mergePresenceMaps(remoteMap = {}, localMap = {}) {
  return mergeObjectMaps(remoteMap, localMap, (remoteValue, localValue) =>
    pickLatestByTimestamp(remoteValue, localValue, ["lastSeenAt"]),
  );
}

function mergeAnnouncements(remoteItems = [], localItems = []) {
  const merged = new globalThis.Map();
  [...remoteItems, ...localItems].forEach((item) => {
    if (!item?.id) return;
    const previous = merged.get(item.id) || {};
    const remoteLike = previous;
    const localLike = item;
    const newestBase = pickLatestByTimestamp(remoteLike, localLike, ["updatedAt", "createdAt"]);
    merged.set(item.id, {
      ...previous,
      ...newestBase,
      dismissedBy: {
        ...(previous.dismissedBy || {}),
        ...(item.dismissedBy || {}),
      },
      readBy: {
        ...(previous.readBy || {}),
        ...(item.readBy || {}),
      },
    });
  });
  return [...merged.values()].sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function mergeHelpRequestArrays(remoteItems = [], localItems = []) {
  const merged = mergeRecordArraysById(remoteItems, localItems, ["resolvedAt", "cancelledAt", "updatedAt", "createdAt"]);
  return merged.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function mergeTokenPolicies(remotePolicies = {}, localPolicies = {}) {
  return mergeObjectMaps(remotePolicies, localPolicies, (remoteValue, localValue) =>
    pickLatestByTimestamp(remoteValue, localValue, ["updatedAt"]),
  );
}

function mergeTokenGrants(remoteItems = [], localItems = []) {
  const merged = mergeRecordArraysById(remoteItems, localItems, ["updatedAt", "createdAt"]);
  return merged.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function mergeTokenOperationalLogs(remoteItems = [], localItems = []) {
  const merged = mergeRecordArraysById(remoteItems, localItems, ["createdAt", "updatedAt"]);
  return merged.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function mergeMissionGlossaries(remoteGlossaries = {}, localGlossaries = {}) {
  const keys = new Set([...Object.keys(remoteGlossaries || {}), ...Object.keys(localGlossaries || {})]);
  const merged = {};
  keys.forEach((key) => {
    merged[key] = mergeGlossaryEntries(remoteGlossaries?.[key] || [], localGlossaries?.[key] || []);
  });
  return merged;
}

function mergeScreenShareState(remoteState = {}, localState = {}) {
  return pickLatestByTimestamp(remoteState, localState, ["startedAt", "endedAt"]);
}

function mergeSessionTimerState(remoteTimer = {}, localTimer = {}) {
  const remoteUpdatedAt = toTimestamp(remoteTimer?.updatedAt);
  const localUpdatedAt = toTimestamp(localTimer?.updatedAt);

  if (remoteUpdatedAt || localUpdatedAt) {
    return remoteUpdatedAt >= localUpdatedAt
      ? { ...localTimer, ...remoteTimer }
      : { ...remoteTimer, ...localTimer };
  }

  return pickLatestByTimestamp(remoteTimer, localTimer, ["startedAt", "endsAt"]);
}

function mergeTimerNotice(remoteNotice, localNotice) {
  return pickLatestByTimestamp(remoteNotice, localNotice, ["createdAt"]);
}

function mergeMissions(remoteMissions = [], localMissions = []) {
  const mergedById = new globalThis.Map();

  [...remoteMissions, ...localMissions].forEach((mission, index) => {
    const missionId = mission?.id || `__index_${index}`;
    const previous = mergedById.get(missionId);
    if (!previous) {
      mergedById.set(missionId, mission);
      return;
    }
    mergedById.set(missionId, pickLatestByTimestamp(previous, mission, ["updatedAt"]));
  });

  return [...mergedById.values()];
}

function mergeEventEntity(remoteEvent, localEvent) {
  if (!remoteEvent) return localEvent;
  if (!localEvent) return remoteEvent;

  const remoteUpdatedAt = toTimestamp(remoteEvent.updatedAt || remoteEvent.createdAt);
  const localUpdatedAt = toTimestamp(localEvent.updatedAt || localEvent.createdAt);
  const newestEvent = localUpdatedAt >= remoteUpdatedAt ? localEvent : remoteEvent;
  const oldestEvent = newestEvent === localEvent ? remoteEvent : localEvent;

  return {
    ...oldestEvent,
    ...newestEvent,
    teams: newestEvent.teams || oldestEvent.teams || [],
    missions: mergeMissions(remoteEvent.missions || [], localEvent.missions || []),
    execucoes: mergeExecucaoMaps(remoteEvent.execucoes, localEvent.execucoes),
    reflexoes: mergeObjectMaps(remoteEvent.reflexoes, localEvent.reflexoes, (remoteValue, localValue) =>
      pickLatestByTimestamp(remoteValue, localValue, ["submittedAt", "ts"]),
    ),
    questionariosPendentes: mergeObjectMaps(remoteEvent.questionariosPendentes, localEvent.questionariosPendentes, (remoteValue, localValue) =>
      pickLatestByTimestamp(remoteValue, localValue, ["updatedAt", "openedAt"]),
    ),
    conclusoes: mergeObjectMaps(remoteEvent.conclusoes, localEvent.conclusoes, (remoteValue, localValue) =>
      pickLatestByTimestamp(remoteValue, localValue, ["updatedAt", "closedAt", "concludedAt"]),
    ),
    preservedMissionUsage: {
      ...(remoteEvent.preservedMissionUsage || {}),
      ...(localEvent.preservedMissionUsage || {}),
    },
    missionGlossaries: mergeMissionGlossaries(remoteEvent.missionGlossaries, localEvent.missionGlossaries),
    missionTokenPolicies: mergeTokenPolicies(remoteEvent.missionTokenPolicies, localEvent.missionTokenPolicies),
    tokenGrants: mergeTokenGrants(remoteEvent.tokenGrants, localEvent.tokenGrants),
    tokenOperationalLogs: mergeTokenOperationalLogs(remoteEvent.tokenOperationalLogs, localEvent.tokenOperationalLogs),
    helpRequests: mergeHelpRequestArrays(remoteEvent.helpRequests, localEvent.helpRequests),
    helpDisabledMap: mergeObjectMaps(remoteEvent.helpDisabledMap, localEvent.helpDisabledMap, (remoteValue, localValue) =>
      pickLatestByTimestamp(remoteValue, localValue, ["updatedAt"]),
    ),
    anamnesisEnabled: newestEvent.anamnesisEnabled ?? oldestEvent.anamnesisEnabled ?? false,
    anamnesisResponses: mergeObjectMaps(
      remoteEvent.anamnesisResponses,
      localEvent.anamnesisResponses,
      (remoteValue, localValue) => pickLatestByTimestamp(remoteValue, localValue, ["submittedAt", "updatedAt"]),
    ),
    missionResets: mergeObjectMaps(remoteEvent.missionResets, localEvent.missionResets, (r, l) => {
      if (!r) return l;
      if (!l) return r;
      return r >= l ? r : l;
    }),
    trainingRuns: mergeExecucaoMaps(remoteEvent.trainingRuns, localEvent.trainingRuns),
    trainingHelpRequests: mergeHelpRequestArrays(remoteEvent.trainingHelpRequests, localEvent.trainingHelpRequests),
    announcements: mergeAnnouncements(getEventAnnouncements(remoteEvent), getEventAnnouncements(localEvent)),
    presenceMap: mergePresenceMaps(remoteEvent.presenceMap, localEvent.presenceMap),
    sessionTimer: mergeSessionTimerState(remoteEvent.sessionTimer, localEvent.sessionTimer),
    sessionTimerNotice: mergeTimerNotice(remoteEvent.sessionTimerNotice, localEvent.sessionTimerNotice),
    screenShare: mergeScreenShareState(remoteEvent.screenShare, localEvent.screenShare),
    updatedAt: newestEvent.updatedAt || oldestEvent.updatedAt || new Date().toISOString(),
    createdAt: remoteEvent.createdAt || localEvent.createdAt || newestEvent.createdAt || oldestEvent.createdAt || new Date().toISOString(),
  };
}

function mergeEventCollections(remoteEvents = [], localEvents = []) {
  const mergedById = new globalThis.Map();
  [...remoteEvents, ...localEvents].forEach((event) => {
    if (!event?.id) return;
    const previous = mergedById.get(event.id);
    mergedById.set(event.id, mergeEventEntity(previous, event));
  });
  return [...mergedById.values()].sort((a, b) => toTimestamp(a.createdAt || a.updatedAt) - toTimestamp(b.createdAt || b.updatedAt));
}

function stampUpdatedEvents(previousEvents = [], nextEvents = []) {
  const previousById = new globalThis.Map(previousEvents.map((event) => [event.id, event]));
  const now = new Date().toISOString();
  return nextEvents.map((event) => {
    const previous = previousById.get(event.id);
    if (!previous) {
      return {
        ...event,
        createdAt: event.createdAt || now,
        updatedAt: now,
      };
    }
    const previousSerialized = JSON.stringify(previous);
    const nextSerialized = JSON.stringify(event);
    return {
      ...event,
      createdAt: previous.createdAt || event.createdAt || now,
      updatedAt: previousSerialized === nextSerialized ? previous.updatedAt || event.updatedAt || now : now,
    };
  });
}

function isFixedMissionsEvent(event) {
  if (event?.missionTemplate !== FIXED_MISSION_TEMPLATE) return false;
  const currentMissionIds = buildFixedMissionList().map((mission) => mission.id);
  const eventMissionIds = (event?.missions || []).map((mission) => mission?.id).filter(Boolean);
  if (eventMissionIds.length !== currentMissionIds.length) return false;
  return currentMissionIds.every((missionId, index) => eventMissionIds[index] === missionId);
}

function buildFixedMissionList() {
  const now = new Date().toISOString();
  return FIXED_MISSIONS_CATALOG.map((mission, index) => ({
    ...normalizeMission(mission),
    unlocked: index === 0,
    updatedAt: mission.updatedAt || now,
  }));
}

function buildCanonicalFixedMissionList(event) {
  const currentMissionsById = new globalThis.Map((event?.missions || []).map((mission) => [mission.id, mission]));
  return buildFixedMissionList().map((mission, index) => {
    const savedMission = currentMissionsById.get(mission.id);
    if (!savedMission) return mission;
    return {
      ...mission,
      unlocked: typeof savedMission.unlocked === "boolean" ? savedMission.unlocked : index === 0,
      aiMode: getMissionAiMode(savedMission),
      updatedAt: savedMission.updatedAt || mission.updatedAt || event?.updatedAt || event?.createdAt || new Date().toISOString(),
    };
  });
}

function migrateEventToFixedMissions(event) {
  if (!event) return event;

  const announcements = getEventAnnouncements(event);
  const baseEvent = {
    ...event,
    announcements,
    announcement: null,
    sessionTimerNotice: event.sessionTimerNotice || null,
    missionGlossaries: event.missionGlossaries || {},
    missionTokenPolicies: event.missionTokenPolicies || {},
    tokenGrants: event.tokenGrants || [],
    tokenOperationalLogs: event.tokenOperationalLogs || [],
    anamnesisEnabled: Boolean(event.anamnesisEnabled),
    anamnesisResponses: event.anamnesisResponses || {},
  };

  if (getEventMode(baseEvent) !== MISSIONS_MODE_EVENT) {
    return baseEvent;
  }

  const alreadyCanonical = isFixedMissionsEvent(baseEvent);
  return {
    ...baseEvent,
    missionTemplate: FIXED_MISSION_TEMPLATE,
    legacyMissionArchive: alreadyCanonical
      ? baseEvent.legacyMissionArchive || null
      : baseEvent.legacyMissionArchive || {
          migratedAt: new Date().toISOString(),
          missions: baseEvent.missions || [],
          execucoes: baseEvent.execucoes || {},
          reflexoes: baseEvent.reflexoes || {},
          questionariosPendentes: baseEvent.questionariosPendentes || {},
          conclusoes: baseEvent.conclusoes || {},
          preservedMissionUsage: baseEvent.preservedMissionUsage || {},
          helpRequests: baseEvent.helpRequests || [],
          helpDisabledMap: baseEvent.helpDisabledMap || {},
        },
    missions: buildCanonicalFixedMissionList(baseEvent),
    execucoes: alreadyCanonical ? baseEvent.execucoes || {} : {},
    reflexoes: alreadyCanonical ? baseEvent.reflexoes || {} : {},
    questionariosPendentes: alreadyCanonical ? baseEvent.questionariosPendentes || {} : {},
    conclusoes: alreadyCanonical ? baseEvent.conclusoes || {} : {},
    preservedMissionUsage: alreadyCanonical ? baseEvent.preservedMissionUsage || {} : {},
    missionGlossaries: alreadyCanonical ? baseEvent.missionGlossaries || {} : {},
    helpRequests: alreadyCanonical ? baseEvent.helpRequests || [] : [],
    helpDisabledMap: alreadyCanonical ? baseEvent.helpDisabledMap || {} : {},
  };
}

function normalizeEventsForProduct(events = []) {
  return events.map((event) => migrateEventToFixedMissions(event));
}

function classifyAttachment(file) {
  const ext = getFileExtension(file.name);
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "image";
  if (["txt", "md", "csv"].includes(ext)) return "text";
  if (["pdf", "docx"].includes(ext)) return "document";
  return "unsupported";
}

function formatAttachmentSize(bytes = 0) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function normalizeAttachmentText(text = "") {
  return text.replace(/\r/g, "").trim();
}

function truncateAttachmentText(text = "", max = MAX_ATTACHMENT_TEXT_CHARS) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[trecho truncado para caber no contexto]`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const base64 = raw.includes(",") ? raw.split(",")[1] : raw;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function extractDocumentAttachmentText(file) {
  const contentBase64 = await readFileAsBase64(file);
  return extractDocumentAttachmentTextFromBase64(file.name, contentBase64);
}

async function extractDocumentAttachmentTextFromBase64(fileName, contentBase64) {
  const response = await fetch("/api/attachments/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      contentBase64,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Falha ao extrair ${file.name}`);
  }

  const data = await response.json();
  return truncateAttachmentText(normalizeAttachmentText(data.text || ""));
}

function canSendAttachmentDirectlyToOpenAI(fileName = "") {
  return getFileExtension(fileName) === "pdf";
}

function sanitizeAttachmentsForStorage(attachments = []) {
  return attachments.map(({ openAiFileBase64, openAiMimeType, openAiDirectFile, ...attachment }) => attachment);
}

async function createAttachmentRecord(file) {
  const kind = classifyAttachment(file);
  if (kind === "unsupported") {
    throw new Error(`${file.name}: tipo de arquivo não suportado.`);
  }

  const base = {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    sizeLabel: formatAttachmentSize(file.size),
    extension: getFileExtension(file.name),
    kind,
  };

  if (kind === "image") {
    return {
      ...base,
      previewMode: "image",
      dataUrl: await readFileAsDataUrl(file),
      summary: "Imagem anexada para análise visual.",
    };
  }

  if (kind === "text") {
    const text = truncateAttachmentText(normalizeAttachmentText(await file.text()));
    return {
      ...base,
      previewMode: "text",
      extractedText: text,
      summary: "Texto extraído e enviado junto da rodada.",
    };
  }

  if (kind === "document") {
    const contentBase64 = await readFileAsBase64(file);
    const canSendDirectly = canSendAttachmentDirectlyToOpenAI(file.name);
    const directFileFields = canSendDirectly
      ? {
          openAiDirectFile: true,
          openAiMimeType: file.type || "application/pdf",
          openAiFileBase64: contentBase64,
        }
      : {};
    try {
      const text = await extractDocumentAttachmentTextFromBase64(file.name, contentBase64);
      if (text) {
        return {
          ...base,
          ...directFileFields,
          previewMode: "text",
          extractedText: text,
          summary: "Texto extraído do documento e enviado junto da rodada.",
        };
      }
      throw new Error(`${file.name}: não foi possível extrair texto do documento.`);
    } catch (error) {
      console.warn(`Falha ao extrair ${file.name}:`, error);
      return {
        ...base,
        ...directFileFields,
        previewMode: "metadata",
        extractedText: "",
        extractionFailed: !canSendDirectly,
        summary: canSendDirectly
          ? "PDF anexado e enviado diretamente para a IA."
          : "Documento anexado sem leitura automática de conteúdo.",
        warningMessage: canSendDirectly
          ? ""
          : `${file.name}: o documento foi anexado, mas a leitura automática falhou. Só os metadados seguirão para a IA nesta rodada.`,
      };
    }
  }

  return {
    ...base,
    previewMode: "metadata",
    extractedText: "",
    summary: "Arquivo anexado sem extração automática de texto nesta versão.",
  };
}

async function buildAttachmentRecordsFromFiles(files = []) {
  const validFiles = files.filter((file) => {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      return false;
    }
    return classifyAttachment(file) !== "unsupported";
  });
  const settled = await Promise.allSettled(validFiles.map((file) => createAttachmentRecord(file)));
  const records = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  const failures = settled.flatMap((result, index) =>
    result.status === "rejected"
      ? [{ fileName: validFiles[index]?.name || "arquivo", message: result.reason?.message || "Falha ao anexar arquivo." }]
      : [],
  );
  const warnings = records.map((record) => record.warningMessage).filter(Boolean);
  return { records, failures, warnings, validFiles };
}

function buildAttachmentContext(attachments = []) {
  const textBlocks = attachments
    .filter((attachment) => attachment.extractedText)
    .map(
      (attachment, index) =>
        `Arquivo ${index + 1}: ${attachment.name}\nConteúdo extraído:\n${attachment.extractedText}`,
    );

  const metadataBlocks = attachments
    .filter((attachment) => attachment.kind === "document" && !attachment.extractedText && !attachment.openAiDirectFile)
    .map(
      (attachment, index) =>
        `Arquivo ${index + 1}: ${attachment.name} (${attachment.extension.toUpperCase()}, ${attachment.sizeLabel})\nObservação: o arquivo foi anexado, mas o conteúdo não pôde ser lido automaticamente. Só os metadados seguem para a IA nesta rodada.`,
    );

  return [...textBlocks, ...metadataBlocks].join("\n\n");
}

function buildAttachmentSummary(attachments = []) {
  if (!attachments.length) return "";
  const labels = attachments.map((attachment) => attachment.name);
  return `Anexos: ${labels.join(", ")}`;
}

function buildUserMessageContent(input, attachments = []) {
  const attachmentContext = buildAttachmentContext(attachments);
  const textPart = attachmentContext
    ? `${input || "Considere os anexos desta rodada."}\n\nArquivos anexados para contexto:\n${attachmentContext}`
    : input;

  const images = attachments.filter((attachment) => attachment.kind === "image" && attachment.dataUrl);
  const directFiles = attachments.filter(
    (attachment) => attachment.kind === "document" && attachment.openAiDirectFile && attachment.openAiFileBase64,
  );
  if (!images.length && !directFiles.length) return textPart;

  return [
    { type: "text", text: textPart || "Considere os anexos desta rodada." },
    ...directFiles.map((attachment) => ({
      type: "input_file",
      filename: attachment.name,
      file_data: `data:${attachment.openAiMimeType || "application/pdf"};base64,${attachment.openAiFileBase64}`,
    })),
    ...images.map((attachment) => ({
      type: "image_url",
      image_url: { url: attachment.dataUrl },
    })),
  ];
}

function buildResponsesApiInput(input, attachments = []) {
  const content = buildUserMessageContent(input, attachments);
  if (Array.isArray(content)) {
    return [
      {
        role: "user",
        content: content.map((item) =>
          item.type === "image_url"
            ? {
                type: "input_image",
                image_url: item.image_url?.url,
              }
            : item.type === "input_file"
              ? {
                  type: "input_file",
                  filename: item.filename || "anexo.pdf",
                  file_data: item.file_data || "",
                }
            : {
                type: "input_text",
                text: item.text || "",
              },
        ),
      },
    ];
  }

  return [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: content || "Considere a mensagem enviada nesta rodada.",
        },
      ],
    },
  ];
}

function buildHistoryContext(execs) {
  return execs.slice(-3).map((exec, index) => ({
    ordem: index + 1,
    acao: exec.isFreeInstruction ? "Instrucao livre" : getActionLabel(exec.acao),
    input: exec.input,
    anexos: buildAttachmentSummary(exec.attachments || []),
    output: exec.output,
  }));
}

function getTechnicalAnalysisLeadText(technicalAnalysis = {}) {
  return (
    technicalAnalysis.objectiveInterpreted ||
    technicalAnalysis.unavailableReason ||
    technicalAnalysis.promptReading?.explicit?.find(isMeaningfulAnalysisText) ||
    ANALYSIS_NOT_APPLICABLE
  );
}

function getTechnicalAnalysisReasoningSummary(technicalAnalysis = {}) {
  return (
    technicalAnalysis.strategyUsed ||
    technicalAnalysis.chainOfThought?.strategyChosen?.find(isMeaningfulAnalysisText) ||
    technicalAnalysis.unavailableReason ||
    ANALYSIS_NOT_APPLICABLE
  );
}

function modelSupportsReasoning(model = "") {
  return /^gpt-5/i.test(model) || /^o[134]/i.test(model);
}

function resolvePlanningRuntime(model, planningMode = "off") {
  if (planningMode !== "on") {
    return {
      requestModel: model,
      reasoningEffort: undefined,
      planningModeReal: false,
      planningResolution: "off",
    };
  }

  if (modelSupportsReasoning(model)) {
    return {
      requestModel: model,
      reasoningEffort: "medium",
      planningModeReal: true,
      planningResolution: "reasoning-medium",
    };
  }

  return {
    requestModel: model,
    reasoningEffort: undefined,
    planningModeReal: true,
    planningResolution: "prompt-only",
  };
}

function buildPromptApplied({ mission, acao, historyContext, planningMode = "off" }) {
  const historyBlock = historyContext.length
    ? `\n\nContexto anterior desta missao:\n${historyContext
        .map(
          (item) =>
            `Rodada ${item.ordem}\nAcao: ${item.acao}\nInput: ${item.input}${item.anexos ? `\n${item.anexos}` : ""}\nResposta: ${item.output}`,
        )
        .join("\n\n")}`
    : "";
  const actionBlock = isFreeInstructionAction(acao)
    ? "Diretriz da rodada: o time escreveu a propria instrucao livremente, sem usar uma acao rapida predefinida."
    : `Acao selecionada: ${getActionLabel(acao)}.`;
  const aiMode = getMissionAiMode(mission);
  const systemPrompt = getSystemPrompt(aiMode, planningMode);
  return [systemPrompt, actionBlock]
    .filter(Boolean)
    .join("\n\n")
    .concat(historyBlock);
}

function buildConceptSummary(mission) {
  return (MISSION_CONCEPTS[mission.id] || []).map((concept) => concept.name).join(", ");
}

function buildTechnicalTerms(mission) {
  const aiMode = getMissionAiMode(mission);
  const missionSpecific = {
    mission_general_chat: [
      { term: "Compressao semantica", meaning: "reduzir o texto preservando a intencao central e descartando redundancias." },
      { term: "Saliência", meaning: "dar mais peso aos trechos com maior densidade de decisao ou informacao." },
      { term: "Condicionamento por prompt", meaning: "usar a instrucao da missao para definir tom, estrutura e nivel de concisao." },
    ],
    mission_programming_coding: [
      { term: "Debugging orientado por hipótese", meaning: "isolar a causa provável de um problema antes de alterar código ou arquitetura." },
      { term: "Refatoração incremental", meaning: "melhorar estrutura e legibilidade sem mudar o comportamento esperado da solução." },
      { term: "Trade-off técnico", meaning: "explicar o custo, o risco e o benefício das decisões de implementação." },
    ],
  };

  if (missionSpecific[mission.id]) return missionSpecific[mission.id];
  return aiMode === CODING_AI_MODE
    ? [
        { term: "Tokenização contextual", meaning: "quebrar o pedido e os trechos de código em unidades que o modelo usa para analisar dependências e padrões." },
        { term: "Atenção sobre dependências", meaning: "priorizar linhas, funções e sinais do prompt que mais influenciam a correção ou arquitetura proposta." },
        { term: "Decisão de implementação", meaning: "escolher o caminho mais seguro e reproduzível diante de contexto incompleto ou ambíguo." },
      ]
    : [
        { term: "Tokenizacao", meaning: "quebrar entrada e saida em unidades que o modelo usa para processar linguagem." },
        { term: "Predicao do proximo token", meaning: "escolher iterativamente a proxima parte da resposta com base no contexto anterior." },
        { term: "Atenção", meaning: "priorizar partes do input e do prompt que mais influenciam a saida final." },
      ];
}

function buildAlternativeAnswerPaths({ mission, acao, freeInstruction }) {
  if (mission.id === "mission_general_chat") {
    return [
      "um resumo mais executivo, com menos contexto e mais decisoes",
      "uma lista de pontos principais, preservando mais granularidade",
      "um plano de acao, se a instrucao pedisse saida orientada a proximo passo",
    ];
  }
  if (getMissionAiMode(mission) === CODING_AI_MODE) {
    return [
      "uma resposta mais orientada a correção imediata, com patch direto no código",
      "uma resposta mais arquitetural, explicando trade-offs antes de codar",
      "uma resposta mais didática, com exemplo mínimo reproduzível antes da solução final",
    ];
  }
  return [
    freeInstruction
      ? "uma resposta mais tecnica ou mais simples, dependendo de como a instrucao fosse formulada"
      : `uma resposta com outra ênfase, se a acao deixasse de ser "${getActionLabel(acao)}"`,
    "uma resposta mais longa, cobrindo mais contexto e mais excecoes",
    "uma resposta mais curta, sacrificando cobertura para ganhar objetividade",
  ];
}

function buildHowToAskBetter({ mission, acao, freeInstruction }) {
  const actionHint = freeInstruction
    ? "defina explicitamente o formato esperado, o nivel de detalhe e o criterio de prioridade"
    : `diga o que precisa preservar alem da acao "${getActionLabel(acao)}"`;
  return [
    `Para ganhar precisao: informe objetivo, destinatario e limite de tamanho da resposta.`,
    `Para mudar a saida: ${actionHint}.`,
    "Para explorar variacoes: peça uma segunda versao com outro tom, outra estrutura ou outro nivel de criticidade.",
  ];
}

function buildBestPractices({ mission }) {
  const aiMode = getMissionAiMode(mission);
  const missionHint =
    mission.id === "mission_general_chat"
      ? "Se quiser um resumo melhor, marque o que e central, o que pode ser cortado e para quem o material sera entregue."
      : aiMode === CODING_AI_MODE
        ? "Se quiser um resultado técnico melhor, diga ambiente, erro observado, código atual e o comportamento esperado."
        : "Se quiser outra resposta, explicite qual criterio deve pesar mais: cobertura, objetividade, criticidade ou estrutura.";
  return [
    "Comece delimitando objetivo, formato e profundidade.",
    missionHint,
    "Quando a resposta importar de verdade, peça uma segunda versao e compare os trade-offs entre elas.",
  ];
}

function buildConceptDetails(mission, acao, output) {
  const concepts = MISSION_CONCEPTS[mission.id] || [];
  const actionText = isFreeInstructionAction(acao)
    ? "a instrucao escrita livremente pelo time"
    : `a acao "${getActionLabel(acao)}"`;
  return concepts.map((concept) => ({
    ...concept,
    whyItMatters: `Esse conceito ajuda a deixar a resposta mais adequada para ${actionText}.`,
    appliedToCase: `Nesta rodada, o conceito foi aplicado para apoiar ${actionText} e organizar a resposta em torno de: ${
      output.slice(0, 140).replace(/\n+/g, " ") || "saida gerada"
    }.`,
    visualExample: "Exemplo visual: a IA transformou um problema difuso em uma resposta com recorte e ordem mais claros.",
    warning: "Se esse conceito for mal aplicado, a resposta pode soar convincente, mas ficar superficial ou desalinhada com o objetivo.",
  }));
}

function buildReasoningDetails({ mission, input, acao, historyContext, promptApplied, apiConfigured }) {
  const shortenedInput = input.length > 280 ? `${input.slice(0, 280)}...` : input;
  const usedHistory = historyContext.length > 0;
  const freeInstruction = isFreeInstructionAction(acao);
  const actionText = freeInstruction ? "a instrucao escrita pelo time" : `a acao "${getActionLabel(acao)}"`;
  const technicalTerms = buildTechnicalTerms(mission);
  const alternativeAnswerPaths = buildAlternativeAnswerPaths({ mission, acao, freeInstruction });
  const howToAskBetter = buildHowToAskBetter({ mission, acao, freeInstruction });
  const bestPractices = buildBestPractices({ mission });
  const aiMode = getMissionAiMode(mission);
  const mechanismSummary =
    mission.id === "mission_general_chat"
      ? "A IA tratou seu pedido como uma tarefa de compressao semantica: leu o texto, detectou redundancias, puxou os trechos mais salientes e reorganizou o material em uma forma mais curta e util."
      : aiMode === CODING_AI_MODE
        ? "A IA tratou esta rodada como um problema técnico: identificou o objetivo de implementação, isolou sinais do erro ou da arquitetura e montou uma resposta priorizando código, debugging e decisões práticas."
        : `A IA tratou esta rodada como uma tarefa de ${mission.category}: primeiro enquadrou o tipo de saida pedido, depois usou o prompt para priorizar certos sinais do input e enfim montou uma resposta coerente com esse recorte.`;
  const selectionLogic = freeInstruction
    ? "Como a rodada foi em instrucao livre, o modelo usou a forma da sua pergunta como principal guia de recorte, tom e estrutura."
    : `A acao "${getActionLabel(acao)}" funcionou como trilho de decisao: ela limitou o tipo de saida, o nivel de condensacao e o que deveria entrar ou ficar de fora.`;
  const whyThisAnswer = usedHistory
    ? `Essa resposta saiu assim porque a IA combinou o input atual com ${historyContext.length} rodada(s) anteriores, tentando manter continuidade sem abandonar o pedido desta vez.`
    : "Essa resposta saiu assim porque a IA priorizou o que parecia mais central no pedido atual e sacrificou detalhes periféricos para entregar uma saida mais util ao objetivo.";
  const limitations = usedHistory
    ? "O historico ajuda na continuidade, mas pode reforcar uma leitura anterior e empurrar o modelo para repetir recortes que nem sempre sao os melhores."
    : "Toda resposta desse tipo e uma escolha entre cobertura e concisao: se uma informacao parecer pouco saliente, ela pode ficar resumida demais ou desaparecer.";

  return {
    mechanismTitle: `Engenharia reversa: ${mission.name}`,
    mechanismSummary,
    selectionLogic,
    whyThisAnswer,
    alternativeAnswerPaths,
    howToAskBetter,
    technicalTerms,
    bestPractices,
    strategy: EXPLICACOES[mission.id] || "A IA aplicou a estrategia definida para esta missao.",
    consideredInput: shortenedInput,
    actionInfluence: freeInstruction
      ? "Nesta rodada, a propria instrucao escrita pelo time guiou o recorte, o tom e a estrutura da resposta final."
      : `A escolha "${getActionLabel(acao)}" guiou o recorte, o tom e a estrutura da resposta final.`,
    limitations,
    promptApplied,
    usedHistory,
    historySignal: buildHistorySignal(historyContext),
    sourceLabel: apiConfigured ? "Resposta gerada com chamada OpenAI" : "Resposta gerada em simulacao local de IA",
    sourceType: apiConfigured ? "openai-runtime" : "local-fallback",
    conceptSummary: buildConceptSummary(mission),
    summary: mechanismSummary,
  };
}

function buildTechnicalAnalysisUnavailable({ apiConfigured, historyContext, reason = "" }) {
  return normalizeTechnicalAnalysis({
    unavailable: true,
    analysisTarget: "latest_prompt",
    usedHistoryContext: historyContext.length > 0,
    historySignal: buildHistorySignal(historyContext),
    sourceLabel: apiConfigured ? "Análise técnica indisponível" : "Análise técnica depende da API",
    sourceType: apiConfigured ? "openai-unavailable" : "api-not-configured",
    unavailableReason:
      reason ||
      (apiConfigured
        ? "A resposta principal foi gerada, mas a análise pedagógica desta rodada não pôde ser retornada pela API."
        : "Conecte a OpenAI para gerar a análise pedagógica desta rodada."),
  }, { historyContext });
}

function buildTechnicalAnalysisPending({ historyContext }) {
  return normalizeTechnicalAnalysis({
    pending: true,
    analysisTarget: "latest_prompt",
    usedHistoryContext: historyContext.length > 0,
    historySignal: buildHistorySignal(historyContext),
    sourceLabel: "Análise técnica em processamento",
    sourceType: "openai-pending",
    unavailableReason: "A resposta principal já foi entregue. A análise técnica desta rodada ainda está sendo preparada.",
  }, { historyContext });
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJsonObject(text) {
  if (!text) return null;
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) return fencedMatch[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return null;
}

function truncateForAnalysis(text = "", limit = 1800) {
  const normalized = `${text || ""}`.trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}...`;
}

function isHtmlPrototypeRequest(input = "") {
  const normalized = `${input || ""}`.toLowerCase();
  return /(front[\s-]?end|html|css|landing page|landing|pagina|página|site|webapp|web app|interface|ui|tela|prototype|prot[oó]tipo|componente visual)/i.test(normalized);
}

function inferArtifactExtension(language = "") {
  const normalized = `${language || ""}`.toLowerCase();
  if (["html", "htm"].includes(normalized)) return "html";
  if (["css", "scss", "sass"].includes(normalized)) return "css";
  if (["javascript", "js", "jsx"].includes(normalized)) return "js";
  if (["typescript", "ts", "tsx"].includes(normalized)) return "ts";
  if (["json"].includes(normalized)) return "json";
  if (["markdown", "md"].includes(normalized)) return "md";
  if (["python", "py"].includes(normalized)) return "py";
  if (["sql"].includes(normalized)) return "sql";
  if (["xml", "svg"].includes(normalized)) return normalized;
  return "txt";
}

function inferArtifactMimeType(extension = "") {
  const normalized = `${extension || ""}`.toLowerCase();
  if (normalized === "html") return "text/html;charset=utf-8";
  if (normalized === "css") return "text/css;charset=utf-8";
  if (normalized === "js") return "text/javascript;charset=utf-8";
  if (normalized === "ts") return "text/plain;charset=utf-8";
  if (normalized === "json") return "application/json;charset=utf-8";
  if (normalized === "md") return "text/markdown;charset=utf-8";
  if (normalized === "py") return "text/x-python;charset=utf-8";
  if (normalized === "sql") return "application/sql;charset=utf-8";
  if (normalized === "svg") return "image/svg+xml;charset=utf-8";
  if (normalized === "xml") return "application/xml;charset=utf-8";
  return "text/plain;charset=utf-8";
}

function sanitizeArtifactFileName(fileName = "", fallbackBase = "artifact", fallbackExtension = "txt") {
  const cleaned = `${fileName || ""}`.trim().replace(/^["'`]+|["'`]+$/g, "").replace(/[\\/:*?"<>|]+/g, "-");
  if (cleaned && /\.[a-z0-9]+$/i.test(cleaned)) return cleaned;
  const base = cleaned || fallbackBase;
  return `${base}.${fallbackExtension}`;
}

function extractRunnableHtml(output = "") {
  if (!output) return null;
  const fencedBlocks = [...output.matchAll(/```html\s*([\s\S]*?)```/gi)];
  for (const match of fencedBlocks) {
    const candidate = match[1]?.trim();
    if (candidate && /<(?:!doctype|html|head|body|main|section|div)\b/i.test(candidate)) {
      return candidate;
    }
  }

  const trimmed = output.trim();
  if (/^<!doctype html>/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function extractGeneratedArtifacts(output = "", baseName = "artifact") {
  const artifacts = [];
  const fencedBlocks = [...`${output || ""}`.matchAll(/```([a-zA-Z0-9_+-]+)?(?:\s+([^\n`]+))?\n([\s\S]*?)```/g)];

  fencedBlocks.forEach((match, index) => {
    const language = `${match[1] || ""}`.trim().toLowerCase();
    const explicitName = `${match[2] || ""}`.trim();
    const content = `${match[3] || ""}`.replace(/^\n+|\n+$/g, "");
    if (!content.trim()) return;
    const extension = explicitName.includes(".") ? getFileExtension(explicitName) || inferArtifactExtension(language) : inferArtifactExtension(language);
    const fileName = sanitizeArtifactFileName(explicitName, `${baseName}-${index + 1}`, extension);
    artifacts.push({
      id: `artifact_${index}_${fileName}`,
      fileName,
      extension,
      language: language || extension,
      mimeType: inferArtifactMimeType(extension),
      content,
      previewMode: extension === "html" ? "html" : "code",
    });
  });

  if (!artifacts.length) {
    const html = extractRunnableHtml(output);
    if (html) {
      artifacts.push({
        id: `${baseName}-html`,
        fileName: sanitizeArtifactFileName(`${baseName}.html`, baseName, "html"),
        extension: "html",
        language: "html",
        mimeType: inferArtifactMimeType("html"),
        content: html,
        previewMode: "html",
      });
    }
  }

  const deduped = new globalThis.Map();
  artifacts.forEach((artifact) => {
    const key = `${artifact.fileName}__${artifact.content}`;
    if (!deduped.has(key)) deduped.set(key, artifact);
  });

  return [...deduped.values()];
}

function buildHtmlArtifact(exec) {
  const generated = Array.isArray(exec?.generatedArtifacts) ? exec.generatedArtifacts : [];
  const htmlArtifact = generated.find((artifact) => artifact.previewMode === "html");
  if (htmlArtifact) {
    return {
      html: htmlArtifact.content,
      fileName: htmlArtifact.fileName,
    };
  }

  const html = extractRunnableHtml(exec?.output || "");
  if (!html) return null;
  const fileBase = (exec?.iterationNumber ? `rodada-${exec.iterationNumber}` : exec?.id || "prototipo")
    .toString()
    .replace(/[^a-z0-9_-]+/gi, "-")
    .toLowerCase();
  return {
    html,
    fileName: `${fileBase}.html`,
  };
}

function estimateStreamedOutputTokens(text = "") {
  return Math.max(0, Math.round(`${text || ""}`.length / 4));
}

function renderPreviewWindowPlaceholder(previewWindow, title, message) {
  writePreviewWindowDocument(
    previewWindow,
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f4f8ff;
        color: #14213d;
        font: 500 16px/1.6 Inter, system-ui, sans-serif;
      }
      .shell {
        width: min(520px, calc(100vw - 48px));
        padding: 28px 30px;
        border: 1px solid rgba(20, 33, 61, 0.14);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 22px 48px rgba(20, 33, 61, 0.12);
      }
      h1 {
        margin: 0 0 10px;
        font-size: 26px;
        line-height: 1.1;
      }
      p {
        margin: 0;
        color: rgba(20, 33, 61, 0.74);
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <h1>${title}</h1>
      <p>${message}</p>
    </div>
  </body>
</html>`,
  );
}

async function gerarExplicacaoGuiadaIA({ model, modelPricing, mission, input, attachments = [], acao, output, historyContext }) {
  const historySignal = buildHistorySignal(historyContext);
  const compactHistory = historyContext.slice(-2).map((item) => truncateForAnalysis(item, 260));
  const historyBlock = compactHistory.length
    ? compactHistory.map((item, index) => `Rodada ${index + 1}: ${item}`).join("\n\n")
    : "Sem histórico anterior nesta missão.";
  const attachmentSummary = attachments.length
    ? attachments.map((attachment, index) => `Arquivo ${index + 1}: ${attachment.name} (${attachment.kind})`).join("\n")
    : "Sem arquivos anexados nesta rodada.";
  const aiMode = getMissionAiMode(mission);
  const analysisModel = TECHNICAL_ANALYSIS_MODEL;
  const prompt = [
    "Você é um sistema de análise pedagógica em tempo real.",
    "Seu trabalho é explicar para o aluno, de forma técnica e didática, como a IA leu o prompt e construiu a resposta desta rodada.",
    "Fale diretamente com quem escreveu o prompt. Use 'você' quando indicar ajustes, riscos e próximos passos.",
    "O objeto principal da análise é sempre o ÚLTIMO prompt enviado nesta rodada.",
    "O histórico anterior da missão entra apenas como contexto secundário.",
    "Reconstrua o chain of thought de modo pedagógico. Nunca exponha raciocínio interno literal bruto.",
    "Use linguagem direta, técnica e assertiva. Evite soar como se estivesse descrevendo o comportamento de outra pessoa.",
    "Evite redundância entre seções. Se um ponto já apareceu no highlight, aprofunde nos blocos seguintes em vez de repetir a mesma frase.",
    `Quando faltar conteúdo em qualquer campo, use exatamente: "${ANALYSIS_NOT_APPLICABLE}".`,
    "Retorne JSON válido, sem markdown, com esta estrutura exata:",
    `{
  "executiveSummary": {
    "takeaway": "...",
    "risk": "...",
    "nextMove": "..."
  },
  "promptReading": {
    "explicit": ["..."],
    "inferred": ["..."],
    "assumed": ["..."],
    "ambiguities": ["..."]
  },
  "chainOfThought": {
    "contextConsidered": ["..."],
    "strategyChosen": ["..."],
    "discarded": ["..."],
    "expandedExplanation": "..."
  },
  "responseConstruction": {
    "toneAndFormat": ["..."],
    "conceptsActivated": ["..."],
    "generationLimitations": ["..."]
  },
  "outputEvaluation": {
    "whatWorked": ["..."],
    "whatStayedGeneric": ["..."],
    "gapBetweenRequestAndDelivery": ["..."]
  },
  "nextStep": {
    "howToReformulate": ["..."],
    "whatToTestNext": ["..."]
  },
  "glossary": {
    "round": [
      { "term": "...", "definition": "..." }
    ]
  }
}`,
    "O bloco executiveSummary deve ser curto, direto e acionável.",
    "Cada array deve ter no máximo 3 itens curtos.",
    "As recomendações precisam ser específicas, assertivas e utilizáveis já na próxima rodada.",
    "No glossário, inclua apenas termos técnicos realmente novos ou necessários nesta rodada. Se não houver termo novo, retorne array vazio.",
    "Cada definição do glossário deve ter uma linha em linguagem simples.",
    aiMode === CODING_AI_MODE
      ? "Missão em modo coding: enfatize implementação, debugging, arquitetura e refatoração."
      : "Missão em modo chat: enfatize clareza estrutural, intenção do prompt e qualidade da resposta.",
    `Missao: ${mission.name}`,
    `AI Mode: ${AI_MODE_LABELS[aiMode]}`,
    isFreeInstructionAction(acao)
      ? "A rodada foi feita em modo de instrução livre, sem ação rápida predefinida."
      : `Ação escolhida: ${getActionLabel(acao)}`,
    `Sinal de histórico: ${historySignal}`,
    `Último prompt do usuário (foco principal):\n${truncateForAnalysis(input, 1200)}`,
    `Arquivos anexados considerados nesta rodada:\n${attachmentSummary}`,
    `Histórico anterior da missão (apenas contexto secundário):\n${historyBlock}`,
    `Resposta da IA para esta rodada:\n${truncateForAnalysis(output, 1600)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  // Jitter: spread concurrent class requests over 0–4s to avoid simultaneous rate-limit spikes
  await sleep(Math.random() * 4000);

  const analysisMessages = [
    {
      role: "system",
      content: "Produza apenas JSON valido. Nao use markdown. Nao inclua texto fora do JSON.",
    },
    { role: "user", content: prompt },
  ];

  let result;
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(2000 * attempt);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      result = await fetchChatCompletion({
        model: analysisModel,
        reasoningEffort: "low",
        signal: controller.signal,
        messages: analysisMessages,
      });
      break;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timeout);
    }
  }
  if (!result) throw lastError;

  const parsed = tryParseJson(result.output) || tryParseJson(extractJsonObject(result.output));
  if (!parsed) return null;
  return normalizeTechnicalAnalysis({
    ...parsed,
    sourceType: "openai-guided",
    sourceLabel: "Análise pedagógica gerada com OpenAI",
    analysisTarget: "latest_prompt",
    usedHistoryContext: historyContext.length > 0,
    historySignal,
    usage: {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.inputTokens + result.outputTokens,
      cost: estimateCost(modelPricing, analysisModel, result.inputTokens, result.outputTokens),
      model: analysisModel,
    },
  }, { historyContext });
}

async function fetchChatCompletion({ model, messages, reasoningEffort, signal }) {
  const requestBody = {
    model,
    temperature: 0.4,
    messages,
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
  };
  const response = await fetch("/api/openai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao consultar a OpenAI.");
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  const output = Array.isArray(rawContent)
    ? rawContent
        .map((item) => item?.text || "")
        .join("\n")
        .trim()
    : `${rawContent || ""}`.trim();
  return {
    output: output || "Sem conteudo retornado.",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

function extractResponsesOutputText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const outputItems = Array.isArray(data?.output) ? data.output : [];
  return outputItems
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .map((part) => {
      if (typeof part?.text === "string") return part.text;
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function fetchResponsesCompletion({ model, instructions, input, previousResponseId, reasoningEffort }) {
  const requestBody = {
    model,
    instructions,
    input,
    ...(previousResponseId ? { previousResponseId } : {}),
    ...(reasoningEffort ? { reasoningEffort } : {}),
  };

  const response = await fetch("/api/openai/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao consultar a OpenAI.");
  }

  const data = await response.json();
  return {
    id: data.id || "",
    output: extractResponsesOutputText(data) || "Sem conteudo retornado.",
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };
}

async function fetchResponsesCompletionStream({
  model,
  instructions,
  input,
  previousResponseId,
  reasoningEffort,
  onDelta,
  onReasoning,
}) {
  const requestBody = {
    model,
    instructions,
    input,
    ...(previousResponseId ? { previousResponseId } : {}),
    ...(reasoningEffort ? { reasoningEffort } : {}),
  };

  const response = await fetch("/api/openai/responses/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao consultar a OpenAI.");
  }

  if (!response.body) {
    return fetchResponsesCompletion({ model, instructions, input, previousResponseId, reasoningEffort });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";
  let responseId = "";
  let usage = null;
  let streamingFailed = false;
  let reasoning = "";
  const UI_FLUSH_INTERVAL_MS = 60;
  let lastEmitAt = 0;
  let lastReasoningAt = 0;

  function emitDelta(force = false) {
    if (!onDelta) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (!force && now - lastEmitAt < UI_FLUSH_INTERVAL_MS) return;
    lastEmitAt = now;
    onDelta(accumulated);
  }

  function emitReasoning(force = false) {
    if (!onReasoning) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (!force && now - lastReasoningAt < UI_FLUSH_INTERVAL_MS) return;
    lastReasoningAt = now;
    onReasoning(reasoning);
  }

  function handleStreamEvent(payload) {
    if (!payload || typeof payload !== "object") return;

    if (payload.type === "response.reasoning_summary_text.delta" && typeof payload.delta === "string") {
      reasoning += payload.delta;
      emitReasoning(false);
      return;
    }

    if (payload.type === "response.reasoning_summary_part.added" && reasoning) {
      reasoning += "\n\n";
      return;
    }

    if (payload.type === "response.output_text.delta" && typeof payload.delta === "string") {
      accumulated += payload.delta;
      emitDelta(false);
      return;
    }

    if (payload.type === "response.completed") {
      const completed = payload.response || payload;
      responseId = completed.id || responseId;
      usage = completed.usage || usage;
      const finalOutput = extractResponsesOutputText(completed);
      if (finalOutput && finalOutput !== accumulated) {
        accumulated = finalOutput;
      }
      emitReasoning(true);
      emitDelta(true);
      return;
    }

    if (payload.type === "error") {
      streamingFailed = true;
      throw new Error(payload.error?.message || "Falha ao consultar a OpenAI.");
    }

    if (payload.response?.id) {
      responseId = payload.response.id;
    }
  }

  function drainBuffer(force = false) {
    buffer = buffer.replace(/\r\n/g, "\n");
    let boundaryIndex = buffer.indexOf("\n\n");
    while (boundaryIndex >= 0) {
      const chunk = buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + 2);
      const dataPayload = chunk
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (dataPayload && dataPayload !== "[DONE]") {
        try {
          handleStreamEvent(JSON.parse(dataPayload));
        } catch (error) {
          streamingFailed = true;
          throw error;
        }
      }
      boundaryIndex = buffer.indexOf("\n\n");
    }

    if (force && buffer.trim()) {
      const dataPayload = buffer
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      buffer = "";
      if (dataPayload && dataPayload !== "[DONE]") {
        handleStreamEvent(JSON.parse(dataPayload));
      }
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      drainBuffer(done);
      if (done) break;
    }
  } catch (error) {
    if (!streamingFailed) {
      return fetchResponsesCompletion({ model, instructions, input, previousResponseId, reasoningEffort });
    }
    throw error;
  }

  emitReasoning(true);
  emitDelta(true);

  return {
    id: responseId || "",
    output: accumulated.trim() || "Sem conteudo retornado.",
    reasoningText: reasoning.trim(),
    inputTokens: usage?.input_tokens || 0,
    outputTokens: usage?.output_tokens || estimateStreamedOutputTokens(accumulated),
  };
}

async function executarComIA({
  mission,
  input,
  attachments = [],
  acao,
  model,
  modelPricing,
  planningMode,
  historyContext,
  previousResponseId = "",
  onDelta,
  onReasoning,
}) {
  const aiMode = getMissionAiMode(mission);
  const planningRuntime = resolvePlanningRuntime(model, planningMode);
  const promptBase = buildPromptApplied({
    mission,
    acao,
    historyContext: aiMode === CODING_AI_MODE ? [] : historyContext,
    planningMode,
  });
  const promptApplied = promptBase;
  const effectiveRuntime = { ...planningRuntime };
  if (aiMode === CODING_AI_MODE && !effectiveRuntime.reasoningEffort) {
    effectiveRuntime.reasoningEffort = CODING_AI_REASONING_EFFORT;
  }

  const result = await fetchResponsesCompletionStream({
    model: effectiveRuntime.requestModel,
    instructions: promptApplied,
    input: buildResponsesApiInput(input, attachments),
    previousResponseId: aiMode === CODING_AI_MODE ? previousResponseId : "",
    reasoningEffort: effectiveRuntime.reasoningEffort,
    onDelta,
    onReasoning,
  });

  const custo = estimateCost(modelPricing, effectiveRuntime.requestModel, result.inputTokens, result.outputTokens);
  return {
    output: result.output,
    promptApplied,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    tokens: result.inputTokens + result.outputTokens,
    custo,
    aiMode,
    effectiveModel: effectiveRuntime.requestModel,
    selectedModel: model,
    planningModeReal: effectiveRuntime.planningModeReal,
    planningResolution: effectiveRuntime.planningResolution,
    responseId: result.id || "",
    reasoningText: result.reasoningText || "",
  };
}

function executarMock({ mission, input, acao, model, modelPricing, planningMode, historyContext }) {
  const aiMode = getMissionAiMode(mission);
  const effectiveModel = model;
  const output = (MOCKS[mission.id] || (() => "Sem mock configurado."))(input, getActionLabel(acao));
  const inputTokens = Math.max(120, Math.round(input.length / 3.5));
  const outputTokens = Math.max(180, Math.round(output.length / 3.8));
  return {
    output,
    promptApplied: buildPromptApplied({ mission, acao, historyContext, planningMode }),
    inputTokens,
    outputTokens,
    tokens: inputTokens + outputTokens,
    custo: estimateCost(modelPricing, effectiveModel, inputTokens, outputTokens),
    aiMode,
    selectedModel: model,
    effectiveModel,
    planningModeReal: false,
    planningResolution: "mock-runtime",
  };
}

function App() {
  const isLocalDev = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const initialPathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const initialIsSurvivalRoute = isSurvivalPath(initialPathname);
  const rawInitialLocalStore = loadStore();
  const initialParticipantSession = initialIsSurvivalRoute ? {} : rawInitialLocalStore.participantSession || {};
  const initialSurvivalStore = loadSurvivalStore();
  const initialLocalStore = {
    ...rawInitialLocalStore,
    events: normalizeEventsForProduct(rawInitialLocalStore.events || []),
    archivedEvents: rawInitialLocalStore.archivedEvents || [],
  };
  const [store, setStore] = useState(() => ({
    events: initialLocalStore.events || [],
    archivedEvents: initialLocalStore.archivedEvents || [],
    chatModel: initialLocalStore.chatModel || initialLocalStore.model || DEFAULT_CHAT_MODEL,
    codingModel: initialLocalStore.codingModel || DEFAULT_CODING_MODEL,
    planningMode: initialLocalStore.planningMode || "off",
  }));
  const [screen, setScreen] = useState(initialIsSurvivalRoute ? "survival" : initialParticipantSession.screen || "home");
  const [facSelectedId, setFacSelectedId] = useState(null);
  const [facTab, setFacTab] = useState("dashboard");
  const [dashboardView, setDashboardView] = useState("team");
  const [promptInsightsView, setPromptInsightsView] = useState("team");
  const [entryCode, setEntryCode] = useState(initialParticipantSession.entryCode || initialParticipantSession.timeEventId || "");
  const [entryError, setEntryError] = useState("");
  const [timeEventId, setTimeEventId] = useState(initialParticipantSession.timeEventId || null);
  const [timeTeamIdx, setTimeTeamIdx] = useState(
    Number.isInteger(initialParticipantSession.timeTeamIdx) ? initialParticipantSession.timeTeamIdx : null,
  );
  const [timeMissionIdx, setTimeMissionIdx] = useState(
    Number.isInteger(initialParticipantSession.timeMissionIdx) ? initialParticipantSession.timeMissionIdx : null,
  );
  const [missionInput, setMissionInput] = useState("");
  const [missionAttachments, setMissionAttachments] = useState([]);
  const [activePrompt, setActivePrompt] = useState("");
  const [activeAttachments, setActiveAttachments] = useState([]);
  const [running, setRunning] = useState(false);
  const [runState, setRunState] = useState(null);
  const liveAnswerRef = useRef(null);
  const [runError, setRunError] = useState("");
  const [toastText, setToastText] = useState("");
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [facAccessOpen, setFacAccessOpen] = useState(false);
  const [facAccessPassword, setFacAccessPassword] = useState("");
  const [facAccessError, setFacAccessError] = useState("");
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    body: "",
    onConfirm: null,
    secondaryAction: null,
    confirmTone: "danger",
    requiresPassword: false,
    confirmValue: "",
    confirmLabel: "",
    confirmPlaceholder: "",
    confirmHint: "",
  });
  const [confirmInput, setConfirmInput] = useState("");
  const [missionFlow, setMissionFlow] = useState({ stage: "idle", exec: null });
  const [newEventForm, setNewEventForm] = useState({
    name: "",
    desc: "",
    teams: "",
    eventMode: MISSIONS_MODE_EVENT,
    anamnesisEnabled: false,
    teamMode: "manual",
    studentsRaw: "",
    importMode: "solo",
    randomTeamCount: 2,
  });
  const [configForm, setConfigForm] = useState({ apiKey: "", chatModel: DEFAULT_CHAT_MODEL, codingModel: DEFAULT_CODING_MODEL, planningMode: "off" });
  const [eventMetaForm, setEventMetaForm] = useState({ name: "", desc: "" });
  const [newTeamName, setNewTeamName] = useState("");
  const [teamImportForm, setTeamImportForm] = useState({
    studentsRaw: "",
    importMode: "solo",
    randomTeamCount: 2,
  });
  const [reflectionAnswers, setReflectionAnswers] = useState({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [teamAnnouncementOpen, setTeamAnnouncementOpen] = useState(false);
  const [teamAnnouncementInboxOpen, setTeamAnnouncementInboxOpen] = useState(false);
  const [anamnesisOpen, setAnamnesisOpen] = useState(Boolean(initialParticipantSession.anamnesis?.open));
  const [anamnesisAnswers, setAnamnesisAnswers] = useState(initialParticipantSession.anamnesis?.answers || {});
  const [anamnesisError, setAnamnesisError] = useState("");
  const [anamnesisContext, setAnamnesisContext] = useState(initialParticipantSession.anamnesis?.context || null);
  const [anamnesisStep, setAnamnesisStep] = useState(initialParticipantSession.anamnesis?.step || 0);
  const [reflectionComment, setReflectionComment] = useState("");
  const [reflectionError, setReflectionError] = useState("");
  const [missionMenuOpen, setMissionMenuOpen] = useState(null);
  const [missionFeedbackOpen, setMissionFeedbackOpen] = useState({});
  const [missionTeamRowsOpen, setMissionTeamRowsOpen] = useState({});
  const [missionTogglePending, setMissionTogglePending] = useState({});
  const [tokenDrawerOpen, setTokenDrawerOpen] = useState(false);
  const [materialsDrawerOpen, setMaterialsDrawerOpen] = useState(false);
  const [studentResourcePreview, setStudentResourcePreview] = useState(null);
  const [planningApprovalState, setPlanningApprovalState] = useState({
    open: false,
    input: "",
    attachments: [],
    missionName: "",
  });
  const [dismissedScreenShareSession, setDismissedScreenShareSession] = useState("");
  const [tokenLimitModalOpen, setTokenLimitModalOpen] = useState(false);
  const [facilitatorToolsOpen, setFacilitatorToolsOpen] = useState(false);
  const [facilitatorToolView, setFacilitatorToolView] = useState(FACILITATOR_TOOL_VIEWS.MENU);
  const [tokenGrantTargetMissionId, setTokenGrantTargetMissionId] = useState("");
  const [tokenPolicyCustomInput, setTokenPolicyCustomInput] = useState("15000");
  const [activeStudentName, setActiveStudentName] = useState(initialParticipantSession.activeStudentName || "");
  const [brandLoaderOpen, setBrandLoaderOpen] = useState(true);
  const [timerMinutesInput, setTimerMinutesInput] = useState("10:00");
  const [clockNow, setClockNow] = useState(Date.now());
  const serverClockOffsetRef = useRef(0);
  const [survivalAccessGranted, setSurvivalAccessGranted] = useState(Boolean(initialSurvivalStore.authenticated));
  const [survivalPasswordInput, setSurvivalPasswordInput] = useState("");
  const [survivalAuthError, setSurvivalAuthError] = useState("");
  const [survivalSelectedMode, setSurvivalSelectedMode] = useState(
    [CHAT_AI_MODE, CODING_AI_MODE].includes(initialSurvivalStore.selectedMode) ? initialSurvivalStore.selectedMode : null,
  );
  const [survivalConversations, setSurvivalConversations] = useState(() => ({
    [CHAT_AI_MODE]: Array.isArray(initialSurvivalStore.conversations?.[CHAT_AI_MODE])
      ? initialSurvivalStore.conversations[CHAT_AI_MODE]
      : [],
    [CODING_AI_MODE]: Array.isArray(initialSurvivalStore.conversations?.[CODING_AI_MODE])
      ? initialSurvivalStore.conversations[CODING_AI_MODE]
      : [],
  }));
  const [survivalDrafts, setSurvivalDrafts] = useState(() => ({
    [CHAT_AI_MODE]: `${initialSurvivalStore.drafts?.[CHAT_AI_MODE] || ""}`,
    [CODING_AI_MODE]: `${initialSurvivalStore.drafts?.[CODING_AI_MODE] || ""}`,
  }));
  const [survivalModels, setSurvivalModels] = useState(() => ({
    [CHAT_AI_MODE]: initialSurvivalStore.models?.[CHAT_AI_MODE] || initialLocalStore.chatModel || DEFAULT_CHAT_MODEL,
    [CODING_AI_MODE]: initialSurvivalStore.models?.[CODING_AI_MODE] || initialLocalStore.codingModel || DEFAULT_CODING_MODEL,
  }));
  const [survivalPlanningMode, setSurvivalPlanningMode] = useState(initialSurvivalStore.planningMode || "off");
  const [survivalTheme, setSurvivalTheme] = useState(
    initialSurvivalStore.theme === SURVIVAL_THEME_LIGHT ? SURVIVAL_THEME_LIGHT : SURVIVAL_THEME_DARK,
  );
  const [survivalAttachments, setSurvivalAttachments] = useState([]);
  const [survivalPendingAttachments, setSurvivalPendingAttachments] = useState([]);
  const [survivalRunning, setSurvivalRunning] = useState(false);
  const [survivalRunState, setSurvivalRunState] = useState(null);
  const [survivalPendingPrompt, setSurvivalPendingPrompt] = useState("");
  const [survivalError, setSurvivalError] = useState("");
  const survivalLiveAnswerRef = useRef(null);
  const survivalFileInputRef = useRef(null);
  const [serverConfig, setServerConfig] = useState({
    openaiConfigured: false,
    openaiSource: "none",
    livekitConfigured: false,
    supabaseConfigured: false,
    sharedStateConfigured: false,
    supabaseUrl: "",
    supabaseAnonKey: "",
    remoteStateKey: "techhall-v1",
  });
  const [storeHydrated, setStoreHydrated] = useState(false);
  const composerFileInputRef = useRef(null);
  const lastEventMetaSavedRef = useRef({ id: null, name: "", desc: "" });
  const lastRemoteEventsRef = useRef(JSON.stringify(initialLocalStore.events || []));
  const currentEventsRef = useRef(initialLocalStore.events || []);
  const brandLoaderTimerRef = useRef(null);

  function clearBrandLoaderTimer() {
    if (!brandLoaderTimerRef.current) return;
    window.clearTimeout(brandLoaderTimerRef.current);
    brandLoaderTimerRef.current = null;
  }

  function runBrandLoaderTransition(action, duration = BRAND_LOADER_DURATION_MS) {
    clearBrandLoaderTimer();
    setBrandLoaderOpen(true);
    brandLoaderTimerRef.current = window.setTimeout(() => {
      action?.();
      setBrandLoaderOpen(false);
      brandLoaderTimerRef.current = null;
    }, duration);
  }

  useEffect(() => {
    saveStore(store);
  }, [store]);

  function syncServerClock(serverNowMs) {
    if (!Number.isFinite(serverNowMs) || serverNowMs <= 0) return;
    serverClockOffsetRef.current = serverNowMs - Date.now();
    setClockNow(Date.now() + serverClockOffsetRef.current);
  }

  function getSyncedNowMs() {
    return Date.now() + serverClockOffsetRef.current;
  }

  useEffect(() => {
    if (screen === "survival") return;
    saveStore({
      participantSession: {
        screen,
        entryCode,
        timeEventId,
        timeTeamIdx,
        timeMissionIdx,
        activeStudentName,
        anamnesis: anamnesisOpen
          ? {
              open: true,
              answers: anamnesisAnswers,
              context: anamnesisContext,
              step: anamnesisStep,
            }
          : null,
      },
    });
  }, [
    activeStudentName,
    anamnesisAnswers,
    anamnesisContext,
    anamnesisOpen,
    anamnesisStep,
    entryCode,
    screen,
    timeEventId,
    timeMissionIdx,
    timeTeamIdx,
  ]);

  useEffect(() => {
    replaceAppPath(screen === "survival" ? SURVIVAL_ROUTE : "/");
  }, [screen]);

  useEffect(() => {
    saveSurvivalStore({
      authenticated: survivalAccessGranted,
      selectedMode: survivalSelectedMode,
      conversations: survivalConversations,
      drafts: survivalDrafts,
      models: survivalModels,
      planningMode: survivalPlanningMode,
      theme: survivalTheme,
    });
  }, [survivalAccessGranted, survivalConversations, survivalDrafts, survivalModels, survivalPlanningMode, survivalSelectedMode, survivalTheme]);

  useEffect(() => {
    currentEventsRef.current = store.events || [];
  }, [store.events]);

  useEffect(() => {
    runBrandLoaderTransition();
    return () => clearBrandLoaderTimer();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapStore() {
      try {
        const config = await fetchServerConfig();
        if (cancelled) return;
        setServerConfig(config);

        if (config.sharedStateConfigured) {
          const remoteState = await fetchRemoteState();
          if (cancelled) return;
          syncServerClock(remoteState.serverNowMs);
          const normalizedRemoteEvents = normalizeEventsForProduct(remoteState.events || []);
          lastRemoteEventsRef.current = JSON.stringify(normalizedRemoteEvents);
          setStore((current) => ({
            ...current,
            events: normalizedRemoteEvents,
          }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setStoreHydrated(true);
      }
    }

    bootstrapStore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toastText) return undefined;
    const timer = window.setTimeout(() => setToastText(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toastText]);

  function handleOpenStudentResource(item, sectionTitle) {
    if (!item?.href) return;
    setStudentResourcePreview({
      id: item.id,
      title: item.title,
      sectionTitle,
      href: item.href,
      previewHref: getStudentResourcePreviewUrl(item.href),
      description: item.description || "",
    });
  }

  function handleOpenStudentResourceInNewTab() {
    if (!studentResourcePreview?.href) return;
    window.open(studentResourcePreview.href, "_blank", "noopener,noreferrer");
  }

  const supabaseRealtimeClient = useMemo(() => {
    if (!serverConfig.supabaseConfigured || !serverConfig.supabaseUrl || !serverConfig.supabaseAnonKey) return null;
    return createClient(serverConfig.supabaseUrl, serverConfig.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }, [serverConfig.supabaseAnonKey, serverConfig.supabaseConfigured, serverConfig.supabaseUrl]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now() + serverClockOffsetRef.current), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!storeHydrated) return undefined;

    const serializedEvents = JSON.stringify(store.events || []);
    if (serializedEvents === lastRemoteEventsRef.current) return undefined;

    if (!serverConfig.sharedStateConfigured) return undefined;

    const timer = window.setTimeout(() => {
      (async () => {
        try {
          const remoteState = await fetchRemoteState();
          syncServerClock(remoteState.serverNowMs);
          const normalizedRemoteEvents = normalizeEventsForProduct(remoteState.events || []);
          const mergedEvents = normalizeEventsForProduct(mergeEventCollections(normalizedRemoteEvents, store.events || []));
          const saveResult = await saveRemoteState(mergedEvents);
          syncServerClock(saveResult.serverNowMs);
          // Re-merge with current state to preserve any updates that happened during the async fetch
          setStore((current) => {
            const safeMerged = normalizeEventsForProduct(mergeEventCollections(mergedEvents, current.events || []));
            const safeSerialized = JSON.stringify(safeMerged);
            lastRemoteEventsRef.current = safeSerialized;
            return JSON.stringify(current.events || []) === safeSerialized
              ? current
              : { ...current, events: safeMerged };
          });
        } catch (error) {
          console.error(error);
        }
      })();
    }, REMOTE_SYNC_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [serverConfig.sharedStateConfigured, store.events, storeHydrated]);

  useEffect(() => {
    if (!storeHydrated || !supabaseRealtimeClient || !serverConfig.remoteStateKey) return undefined;

    const channel = supabaseRealtimeClient
      .channel(`app-state-${serverConfig.remoteStateKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_state",
          filter: `id=eq.${serverConfig.remoteStateKey}`,
        },
        (payload) => {
          const nextEvents = normalizeEventsForProduct(payload.new?.payload?.events || []);
          setStore((current) => {
            const mergedEvents = normalizeEventsForProduct(mergeEventCollections(nextEvents, current.events || []));
            lastRemoteEventsRef.current = JSON.stringify(mergedEvents);
            return {
              ...current,
              events: mergedEvents,
            };
          });
        },
      )
      .subscribe();

    return () => {
      supabaseRealtimeClient.removeChannel(channel);
    };
  }, [serverConfig.remoteStateKey, storeHydrated, supabaseRealtimeClient]);

  // Poll config at a low frequency — it rarely changes and doesn't need realtime cadence
  useEffect(() => {
    if (!["workspace", "facilitador", "team", "entry"].includes(screen)) return undefined;

    const timer = window.setInterval(async () => {
      try {
        const config = await fetchServerConfig();
        setServerConfig(config);
      } catch (error) {
        console.error(error);
      }
    }, CONFIG_POLL_MS);

    return () => window.clearInterval(timer);
  }, [screen]);

  // Poll state as fallback — slower when Realtime is active, faster when it's not
  useEffect(() => {
    if (!["workspace", "facilitador", "team", "entry"].includes(screen)) return undefined;

    const interval = supabaseRealtimeClient ? STATE_POLL_MS_WITH_REALTIME : STATE_POLL_MS_WITHOUT_REALTIME;

    const timer = window.setInterval(async () => {
      try {
        if (serverConfig.sharedStateConfigured) {
          const remoteState = await fetchRemoteState();
          syncServerClock(remoteState.serverNowMs);
          const remoteEvents = normalizeEventsForProduct(remoteState.events || []);
          setStore((current) => {
            const mergedEvents = normalizeEventsForProduct(mergeEventCollections(remoteEvents, current.events || []));
            lastRemoteEventsRef.current = JSON.stringify(mergedEvents);
            return { ...current, events: mergedEvents };
          });
          return;
        }
        // Bootstrap may have failed — try to recover config so next tick fetches remote
        const recoveredConfig = await fetchServerConfig();
        setServerConfig(recoveredConfig);
        if (recoveredConfig.sharedStateConfigured) {
          const remoteState = await fetchRemoteState();
          syncServerClock(remoteState.serverNowMs);
          const remoteEvents = normalizeEventsForProduct(remoteState.events || []);
          setStore((current) => {
            const mergedEvents = normalizeEventsForProduct(mergeEventCollections(remoteEvents, current.events || []));
            lastRemoteEventsRef.current = JSON.stringify(mergedEvents);
            return { ...current, events: mergedEvents };
          });
          return;
        }
      } catch (error) {
        console.error(error);
      }

      setStore((current) => {
        const normalizedCurrentEvents = normalizeEventsForProduct(current.events || []);
        lastRemoteEventsRef.current = JSON.stringify(normalizedCurrentEvents);
        return { ...current, events: normalizedCurrentEvents };
      });
    }, interval);

    return () => window.clearInterval(timer);
  }, [screen, serverConfig.sharedStateConfigured, supabaseRealtimeClient]);

  useEffect(() => {
    if (!["workspace", "facilitador", "team"].includes(screen)) return undefined;
    if (!serverConfig.sharedStateConfigured) return undefined;

    let cancelled = false;
    const syncImmediately = async () => {
      if (cancelled) return;
      try {
        const remoteState = await fetchRemoteState();
        if (cancelled) return;
        syncServerClock(remoteState.serverNowMs);
        const remoteEvents = normalizeEventsForProduct(remoteState.events || []);
        setStore((current) => {
          const mergedEvents = normalizeEventsForProduct(mergeEventCollections(remoteEvents, current.events || []));
          lastRemoteEventsRef.current = JSON.stringify(mergedEvents);
          return { ...current, events: mergedEvents };
        });
      } catch (error) {
        console.error(error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncImmediately();
      }
    };

    const handleFocus = () => {
      void syncImmediately();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [screen, serverConfig.sharedStateConfigured]);

  useEffect(() => {
    if (!storeHydrated || !isLocalDev) return;
    if ((store.events || []).length > 0) return;

    const labEvent = makeDevLabEvent();
    setStore((current) => ({
      ...current,
      events: [labEvent],
    }));
    setFacSelectedId(labEvent.id);
    setTimeEventId(labEvent.id);
    setTimeTeamIdx(0);
    setTimeMissionIdx(0);
    setEntryCode(labEvent.id);
    setFacTab("dashboard");
  }, [isLocalDev, store.events, storeHydrated]);

  useEffect(() => {
    if (!isLocalDev) return;
    if (!(store.events || []).length) return;
    const firstVisibleEvent = (store.events || []).find((event) => !isEventHidden(event));
    if (!firstVisibleEvent) return;
    if (!facSelectedId || !(store.events || []).some((event) => event.id === facSelectedId && !isEventHidden(event))) {
      setFacSelectedId(firstVisibleEvent.id);
    }
    if (!timeEventId || !(store.events || []).some((event) => event.id === timeEventId && !isEventHidden(event))) {
      setTimeEventId(firstVisibleEvent.id);
    }
  }, [facSelectedId, isLocalDev, store.events, timeEventId]);

  const allEvents = store.events || [];
  const events = allEvents.filter((event) => !isEventHidden(event));
  const selectedEvent = events.find((event) => event.id === facSelectedId) || null;
  const teamEvent = events.find((event) => event.id === timeEventId) || null;
  const selectedEventMode = getEventMode(selectedEvent);
  const teamEventMode = getEventMode(teamEvent);
  const isTrainingEvent = teamEventMode === TRAINING_MODE_EVENT;
  const team = teamEvent && timeTeamIdx !== null ? teamEvent.teams[timeTeamIdx] : null;
  const selectedEventAnnouncements = getEventAnnouncements(selectedEvent);
  const selectedEventLatestAnnouncement = selectedEventAnnouncements.length ? selectedEventAnnouncements[selectedEventAnnouncements.length - 1] : null;
  const teamEventAnnouncements = getEventAnnouncements(teamEvent);
  const teamUnreadAnnouncements = teamEvent && timeTeamIdx !== null ? getUnreadAnnouncementsForTeam(teamEvent, timeTeamIdx) : [];
  const teamUnreadAnnouncementCount = teamUnreadAnnouncements.length;
  const latestUnreadAnnouncement = teamEvent && timeTeamIdx !== null ? getLatestUnreadAnnouncementForTeam(teamEvent, timeTeamIdx) : null;
  const selectedEventTimer = getSessionTimer(selectedEvent);
  const selectedEventTimerRemainingMs = getSessionTimerRemainingMs(selectedEvent, clockNow);
  const selectedEventTimerRunning = isSessionTimerRunning(selectedEvent, clockNow);
  const selectedEventTimerNotice = getSessionTimerNotice(selectedEvent, clockNow);
  const teamEventTimer = getSessionTimer(teamEvent);
  const teamEventTimerRemainingMs = getSessionTimerRemainingMs(teamEvent, clockNow);
  const teamEventTimerRunning = isSessionTimerRunning(teamEvent, clockNow);
  const teamEventTimerNotice = getSessionTimerNotice(teamEvent, clockNow);
  const teamTimerExpired = isSessionTimerExpired(teamEvent, clockNow);
  const teamTimerLockActive = isSessionTimerLockActive(teamEvent, clockNow);
  const selectedEventScreenShare = selectedEvent ? getScreenShareState(selectedEvent) : null;
  const teamEventScreenShare = teamEvent ? getScreenShareState(teamEvent) : null;
  const teamScreenShareSessionId =
    teamEventScreenShare?.active && teamEvent
      ? `${teamEvent.id}:${teamEventScreenShare.roomName || ""}:${teamEventScreenShare.startedAt || ""}`
      : "";
  const teamScreenShareVisible = Boolean(teamScreenShareSessionId && dismissedScreenShareSession !== teamScreenShareSessionId);

  useEffect(() => {
    if (!teamScreenShareSessionId) {
      setDismissedScreenShareSession("");
    }
  }, [teamScreenShareSessionId]);

  useEffect(() => {
    if (!storeHydrated) return;
    if (!events.length) {
      if (facSelectedId) setFacSelectedId(null);
      if (timeEventId) {
        setTimeEventId(null);
        setTimeTeamIdx(null);
        setTimeMissionIdx(null);
      }
      return;
    }
    if (facSelectedId && !events.some((event) => event.id === facSelectedId)) {
      setFacSelectedId(events[0].id);
    }
    if (timeEventId && !events.some((event) => event.id === timeEventId)) {
      setTimeEventId(null);
      setTimeTeamIdx(null);
      setTimeMissionIdx(null);
      if (screen !== "home") setScreen("entry");
    }
  }, [events, facSelectedId, screen, storeHydrated, timeEventId]);
  const currentMission = isTrainingEvent ? TRAINING_MISSION : teamEvent && timeMissionIdx !== null ? normalizeMission(teamEvent.missions[timeMissionIdx]) : null;
  const currentMissionLocked = Boolean(!isTrainingEvent && currentMission && !currentMission.unlocked);
  const currentExecs = currentMission && teamEvent
    ? isTrainingEvent
      ? getTrainingRuns(teamEvent, timeTeamIdx)
      : getExecucoes(teamEvent, timeTeamIdx, currentMission.id)
    : [];
  const currentReflexao = currentMission && teamEvent && !isTrainingEvent ? getReflexao(teamEvent, timeTeamIdx, currentMission.id) : null;
  const currentQuestionarioPendente = currentMission && teamEvent && !isTrainingEvent ? isQuestionarioPendente(teamEvent, timeTeamIdx, currentMission.id) : false;
  const currentQuestionarioPendenteSource = currentMission && teamEvent && !isTrainingEvent
    ? getQuestionarioPendenteSource(teamEvent, timeTeamIdx, currentMission.id)
    : null;
  const currentConcluida = currentMission && teamEvent && !isTrainingEvent ? isConcluida(teamEvent, timeTeamIdx, currentMission.id) : false;
  const currentConclusaoSource = currentMission && teamEvent && !isTrainingEvent
    ? getConclusaoSource(teamEvent, timeTeamIdx, currentMission.id)
    : null;
  const currentMissionStatus = currentMission && teamEvent && !isTrainingEvent ? getMissionClosureStatus(teamEvent, timeTeamIdx, currentMission.id) : "aberta";
  const latestCurrentExec = currentExecs.length ? currentExecs[currentExecs.length - 1] : null;
  const readingExec = missionFlow.exec || latestCurrentExec || null;
  const readingStage = Boolean(readingExec);
  const hasMissionHistory = currentMission && teamEvent
    ? isTrainingEvent
      ? currentExecs.length > 0
      : currentExecs.length > 0 || Boolean(currentReflexao) || currentQuestionarioPendente || currentConcluida
    : false;
  const preservedUsage = currentMission && teamEvent && !isTrainingEvent ? getPreservedMissionUsage(teamEvent, timeTeamIdx, currentMission.id) : null;
  const currentHelpRequests = currentMission && teamEvent
    ? isTrainingEvent
      ? [...getTrainingHelpRequests(teamEvent, timeTeamIdx), ...getTrainingTokenRequests(teamEvent, timeTeamIdx)]
      : getHelpRequests(teamEvent, timeTeamIdx, currentMission.id)
    : [];
  const currentOpenHelpCount = currentHelpRequests.filter((request) => request.status === "open" && request.kind !== "tokens").length;
  const currentOpenHelpRequest = currentHelpRequests.find((request) => request.status === "open" && request.kind !== "tokens") || null;
  const currentTokenMissionId = currentMission ? getTokenMissionId(currentMission.id, { isTraining: isTrainingEvent }) : null;
  const currentTokenBudget = currentMission && teamEvent && timeTeamIdx !== null
    ? getEffectiveMissionTokenBudget(teamEvent, timeTeamIdx, currentMission.id, { isTraining: isTrainingEvent })
    : null;
  const currentOpenTokenRequest =
    currentMission && teamEvent
      ? currentHelpRequests.find((request) => request.status === "open" && request.kind === "tokens") || null
      : null;
  const currentMissionOperationalLogs =
    currentMission && teamEvent && timeTeamIdx !== null
      ? getMissionTokenOperationalLogs(teamEvent, currentMission.id, timeTeamIdx, { isTraining: isTrainingEvent })
      : [];
  const facilitatorTabs = selectedEvent && isAnamnesisEnabled(selectedEvent)
    ? ["dashboard", "missoes", "prompts", "anamnese"]
    : ["dashboard", "missoes", "prompts"];
  const selectedTokenPolicy = selectedEvent && tokenGrantTargetMissionId
    ? getMissionTokenPolicy(selectedEvent, tokenGrantTargetMissionId, {
        isTraining: tokenGrantTargetMissionId === TOKEN_MISSION_TRAINING_ID,
      })
    : null;
  const teamHelpDisabled = teamEvent && timeTeamIdx !== null ? isHelpDisabledForTeam(teamEvent, timeTeamIdx) : false;
  const newEventStudents = parseStudentList(newEventForm.studentsRaw || "");
  const anamnesisTargetEvent = anamnesisContext ? events.find((event) => event.id === anamnesisContext.eventId) || null : null;
  const answeredAnamnesisCount = countAnsweredAnamnesisQuestions(anamnesisAnswers);
  const currentAnamnesisQuestion = ANAMNESIS_QUESTIONS[anamnesisStep] || null;
  const currentAnamnesisAnswer = currentAnamnesisQuestion ? anamnesisAnswers[currentAnamnesisQuestion.id] : null;
  const currentAnamnesisChoiceValue = currentAnamnesisQuestion
    ? getAnamnesisAnswerChoice(currentAnamnesisQuestion, currentAnamnesisAnswer)
    : null;
  const currentAnamnesisNoteValue = currentAnamnesisQuestion
    ? getAnamnesisAnswerNote(currentAnamnesisQuestion, currentAnamnesisAnswer)
    : "";
  const isCurrentAnamnesisAnswered = currentAnamnesisQuestion
    ? isAnamnesisAnswerFilled(currentAnamnesisQuestion, currentAnamnesisAnswer)
    : false;

  useEffect(() => {
    if (tokenLimitModalOpen && currentTokenBudget && !currentTokenBudget.blocked) {
      setTokenLimitModalOpen(false);
    }
  }, [currentTokenBudget, tokenLimitModalOpen]);

  useEffect(() => {
    if (screen !== "workspace" || !teamEvent || timeTeamIdx === null || !currentMission || isTrainingEvent) return;
    if (currentMissionStatus !== "aberta") return;
    if (!["concluida", "questionario_final"].includes(missionFlow.stage)) return;
    setReflectionAnswers({});
    setReflectionComment("");
    setReflectionError("");
    setMissionFlow((current) => {
      if (!["concluida", "questionario_final"].includes(current.stage)) return current;
      return {
        ...current,
        stage: current.exec ? "cot_aberto" : "idle",
      };
    });
  }, [currentMission, currentMissionStatus, isTrainingEvent, missionFlow.stage, screen, teamEvent, timeTeamIdx]);

  useEffect(() => {
    const isStudentScreen = ["workspace", "team", "entry"].includes(screen);
    if (!isStudentScreen || !teamEvent || timeTeamIdx === null) {
      setTeamAnnouncementOpen(false);
      return;
    }
    const announcement = getLatestUnreadAnnouncementForTeam(teamEvent, timeTeamIdx);
    if (!announcement) {
      setTeamAnnouncementOpen(false);
      return;
    }
    if (!isAnnouncementDismissedForTeam(teamEvent, timeTeamIdx, announcement.id)) {
      setTeamAnnouncementOpen(true);
      return;
    }
    setTeamAnnouncementOpen(false);
  }, [screen, teamEvent, timeTeamIdx, clockNow]);
  const importedStudents = parseStudentList(teamImportForm.studentsRaw || "");

  useEffect(() => {
    if (!currentMission) {
      setMissionInput("");
      setRunState(null);
      setMissionFlow({ stage: "idle", exec: null });
      setHistoryOpen(false);
      setHelpOpen(false);
      setHelpMessage("");
      setReflectionAnswers({});
      setReflectionComment("");
      setReflectionError("");
      setMissionAttachments([]);
      return;
    }
    setMissionInput("");
    setMissionAttachments([]);
    setRunError("");
    setHistoryOpen(false);
    setHelpOpen(false);
    setHelpMessage("");
    setReflectionAnswers({});
    setReflectionComment("");
    setReflectionError("");
    setMissionMenuOpen(null);
  }, [timeMissionIdx, timeEventId]);

  useEffect(() => {
    if (!currentMission) return;
    if (isTrainingEvent) {
      setMissionFlow({
        stage: latestCurrentExec ? "cot_aberto" : "idle",
        exec: latestCurrentExec || null,
      });
      return;
    }
    if (currentQuestionarioPendente) {
      setMissionFlow({
        stage: "questionario_final",
        exec: latestCurrentExec || null,
      });
      return;
    }
    if (currentConcluida) {
      setMissionFlow({
        stage: "concluida",
        exec: latestCurrentExec || null,
      });
      return;
    }
    setMissionFlow({
      stage: latestCurrentExec ? "cot_aberto" : "idle",
      exec: latestCurrentExec || null,
    });
  }, [currentConcluida, currentMission?.id, currentQuestionarioPendente, isTrainingEvent, latestCurrentExec]);

  useEffect(() => {
    if (isTrainingEvent || !currentQuestionarioPendente) return;
    setReflectionAnswers({});
    setReflectionComment("");
    setReflectionError("");
  }, [currentMission?.id, currentQuestionarioPendente, isTrainingEvent]);

  useEffect(() => {
    if (!teamEvent || timeTeamIdx === null || isTrainingEvent) return;
    const pendingMissionIdx = getFirstPendingMissionIndex(teamEvent, timeTeamIdx);
    if (pendingMissionIdx >= 0 && timeMissionIdx !== pendingMissionIdx) {
      setTimeMissionIdx(pendingMissionIdx);
    }
  }, [isTrainingEvent, teamEvent, timeMissionIdx, timeTeamIdx]);

  useEffect(() => {
    if (!teamEvent || timeTeamIdx === null || isTrainingEvent || !currentMissionLocked) return;

    const pendingMissionIdx = getFirstPendingMissionIndex(teamEvent, timeTeamIdx);
    const firstUnlockedMissionIdx = teamEvent.missions.findIndex((mission) => mission.unlocked);
    const fallbackMissionIdx = pendingMissionIdx >= 0 ? pendingMissionIdx : firstUnlockedMissionIdx >= 0 ? firstUnlockedMissionIdx : null;

    if (fallbackMissionIdx !== timeMissionIdx) {
      setTimeMissionIdx(fallbackMissionIdx);
    } else if (fallbackMissionIdx === null && timeMissionIdx !== null) {
      setTimeMissionIdx(null);
    }

    setMissionInput("");
    setMissionAttachments([]);
    setRunError("Esta missão foi bloqueada pelo facilitador.");
  }, [currentMissionLocked, isTrainingEvent, teamEvent, timeMissionIdx, timeTeamIdx]);

  useEffect(() => {
    if (!selectedEvent) {
      setEventMetaForm({ name: "", desc: "" });
      lastEventMetaSavedRef.current = { id: null, name: "", desc: "" };
      return;
    }
    const nextMeta = {
      name: selectedEvent.name || "",
      desc: selectedEvent.desc || "",
    };
    setEventMetaForm(nextMeta);
    lastEventMetaSavedRef.current = { id: selectedEvent.id, ...nextMeta };
  }, [selectedEvent?.id, selectedEvent?.name, selectedEvent?.desc]);

  useEffect(() => {
    if (!selectedEvent) {
      setTokenGrantTargetMissionId("");
      return;
    }
    const availableMissionId =
      getEventMode(selectedEvent) === TRAINING_MODE_EVENT
        ? TOKEN_MISSION_TRAINING_ID
        : selectedEvent.missions?.[0]?.id || "";
    setTokenGrantTargetMissionId((current) => (current ? current : availableMissionId));
  }, [selectedEvent]);

  useEffect(() => {
    if (!selectedEvent || !tokenGrantTargetMissionId || !selectedTokenPolicy) return;
    setTokenPolicyCustomInput(
      formatTokenLimitInput(
        selectedTokenPolicy.mode === TOKEN_POLICY_MODE_CUSTOM ? Math.max(1, Number(selectedTokenPolicy.customLimit || 0)) : DEFAULT_MISSION_TOKEN_LIMIT,
      ),
    );
  }, [
    selectedEvent?.id,
    tokenGrantTargetMissionId,
    selectedTokenPolicy?.mode,
    selectedTokenPolicy?.customLimit,
    selectedTokenPolicy?.updatedAt,
  ]);

  useEffect(() => {
    if (facTab === "anamnese" && (!selectedEvent || !isAnamnesisEnabled(selectedEvent))) {
      setFacTab("dashboard");
    }
  }, [facTab, selectedEvent]);

  useEffect(() => {
    if (!selectedEvent) return undefined;

    const normalizedName = eventMetaForm.name.trim();
    const normalizedDesc = eventMetaForm.desc.trim();
    const currentSaved = lastEventMetaSavedRef.current;
    const selectedName = (selectedEvent.name || "").trim();
    const selectedDesc = (selectedEvent.desc || "").trim();

    if (normalizedName === selectedName && normalizedDesc === selectedDesc) return undefined;
    if (!normalizedName) return undefined;
    if (
      currentSaved.id === selectedEvent.id &&
      currentSaved.name === normalizedName &&
      currentSaved.desc === normalizedDesc
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      updateEvents((current) =>
        current.map((event) => (event.id === selectedEvent.id ? { ...event, name: normalizedName, desc: normalizedDesc } : event)),
      );
      lastEventMetaSavedRef.current = {
        id: selectedEvent.id,
        name: normalizedName,
        desc: normalizedDesc,
      };
      showToast("Dados do evento atualizados");
    }, 700);

    return () => window.clearTimeout(timer);
  }, [eventMetaForm.desc, eventMetaForm.name, selectedEvent]);

  useEffect(() => {
    if (screen !== "workspace" || !teamEvent || timeTeamIdx === null) return undefined;

    const presenceName = activeStudentName || team?.name || "";
    markTeamPresence(teamEvent.id, timeTeamIdx, presenceName);

    const timer = window.setInterval(() => {
      markTeamPresence(teamEvent.id, timeTeamIdx, presenceName);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [activeStudentName, screen, team?.name, teamEvent?.id, timeTeamIdx]);


  const openEventsForTeamEntry = useMemo(
    () => events.filter((event) => event.status === "open"),
    [events],
  );

  const teamStudentOptions = useMemo(() => getEventStudentOptions(teamEvent), [teamEvent]);

  const apiConfigured = Boolean(serverConfig.openaiConfigured);
  const modelCatalog = useMemo(() => getModelCatalog(serverConfig), [serverConfig]);
  const modelPricingMap = useMemo(() => getModelPricingMap(modelCatalog), [modelCatalog]);
  const currentMissionAiMode = currentMission ? getMissionAiMode(currentMission) : CHAT_AI_MODE;
  const composerModelOptions = getModelsForMode(modelCatalog, currentMissionAiMode);
  const storedModelForMode =
    currentMissionAiMode === CODING_AI_MODE ? store.codingModel : store.chatModel;
  const selectedModelForMode = composerModelOptions.some((entry) => entry.id === storedModelForMode)
    ? storedModelForMode
    : getDefaultModelForMode(serverConfig, currentMissionAiMode);
  const survivalModeOptions = survivalSelectedMode ? getModelsForMode(modelCatalog, survivalSelectedMode) : [];
  const survivalStoredModel = survivalSelectedMode ? survivalModels[survivalSelectedMode] : "";
  const survivalSelectedModel = survivalSelectedMode
    ? survivalModeOptions.some((entry) => entry.id === survivalStoredModel)
      ? survivalStoredModel
      : getDefaultModelForMode(serverConfig, survivalSelectedMode)
    : "";
  const survivalExecs = survivalSelectedMode ? survivalConversations[survivalSelectedMode] || [] : [];
  const survivalDraft = survivalSelectedMode ? survivalDrafts[survivalSelectedMode] || "" : "";
  const survivalTokenTotal = survivalExecs.reduce((sum, exec) => sum + (exec.tokens || 0), 0);
  const survivalRecentTransactions = [...survivalExecs].slice(-5).reverse();
  const devEventId = timeEventId || facSelectedId || events[0]?.id || "";
  const devEvent = events.find((event) => event.id === devEventId) || null;
  const devTeamIdx = devEvent && timeTeamIdx !== null && devEvent.teams[timeTeamIdx] ? timeTeamIdx : "";
  const devQuickSwitch = import.meta.env.DEV && isLocalDev && SHOW_DEV_SWITCH ? (
    <DevQuickSwitch
      events={events}
      currentEventId={devEventId}
      currentTeamIdx={devTeamIdx}
      currentScreen={screen}
      selectedEvent={devEvent}
      onPickEvent={handleDevPickEvent}
      onPickTeam={handleDevPickTeam}
      onOpenFacilitador={handleDevOpenFacilitador}
      onOpenEntrada={handleDevOpenEntrada}
      onOpenTeamSelection={handleDevOpenTimeSelection}
      onOpenWorkspace={handleDevOpenWorkspace}
    />
  ) : null;

  function updateEvents(updater) {
    setStore((current) => {
      const previousEvents = current.events || [];
      const nextEvents = updater(previousEvents);
      if (nextEvents === previousEvents) return current;
      return {
        ...current,
        events: stampUpdatedEvents(previousEvents, nextEvents),
      };
    });
  }

  function markTeamPresence(eventId, teamIdx, memberName) {
    if (!eventId || teamIdx === null || teamIdx === undefined) return;
    const normalizedName = normalizeStudentName(memberName || "");
    const now = Date.now();
    updateEvents((current) => {
      let changed = false;
      const next = current.map((event) => {
        if (event.id !== eventId) return event;
        const existing = event.presenceMap?.[teamIdx];
        const nextName = normalizedName || event.teams?.[teamIdx]?.name || `Time ${Number(teamIdx) + 1}`;
        if (existing && existing.memberName === nextName && now - new Date(existing.lastSeenAt).getTime() < 10000) {
          return event;
        }
        changed = true;
        return {
          ...event,
          presenceMap: {
            ...(event.presenceMap || {}),
            [teamIdx]: { teamIdx, memberName: nextName, lastSeenAt: new Date(now).toISOString() },
          },
        };
      });
      return changed ? next : current;
    });
  }

  function showToast(message) {
    setToastText(message);
  }

  function getMissionTogglePendingKey(eventId, index) {
    return `${eventId}__${index}`;
  }

  async function handleCopyResponse(text) {
    try {
      const copied = await copyTextToClipboard(text);
      showToast(copied ? "Resposta copiada" : "Não foi possível copiar a resposta");
    } catch (error) {
      console.error(error);
      showToast("Não foi possível copiar a resposta");
    }
  }

  async function flushCriticalEvents(nextEvents) {
    if (!serverConfig.sharedStateConfigured) return;
    try {
      const remoteState = await fetchRemoteState();
      const normalizedRemoteEvents = normalizeEventsForProduct(remoteState.events || []);
      const mergedEvents = normalizeEventsForProduct(mergeEventCollections(normalizedRemoteEvents, nextEvents || []));
      const mergedSerialized = JSON.stringify(mergedEvents);
      lastRemoteEventsRef.current = mergedSerialized;
      currentEventsRef.current = mergedEvents;
      await saveRemoteState(mergedEvents);
      setStore((current) =>
        JSON.stringify(current.events || []) === mergedSerialized
          ? current
          : {
              ...current,
              events: mergedEvents,
            },
      );
    } catch (error) {
      lastRemoteEventsRef.current = "__out_of_sync__";
      console.error(error);
    }
  }

  function updateCriticalEvents(updater) {
    const previousEvents = currentEventsRef.current || [];
    const nextEvents = updater(previousEvents);
    if (nextEvents === previousEvents) return;
    const stampedEvents = stampUpdatedEvents(previousEvents, nextEvents);
    const serializedEvents = JSON.stringify(stampedEvents);
    currentEventsRef.current = stampedEvents;
    lastRemoteEventsRef.current = serializedEvents;
    setStore((current) => ({
      ...current,
      events: stampedEvents,
    }));
    void flushCriticalEvents(stampedEvents);
  }

  function appendTokenOperationalLog(event, entry) {
    return {
      ...event,
      tokenOperationalLogs: [
        ...(event.tokenOperationalLogs || []),
        {
          id: `token_log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          ...entry,
        },
      ],
    };
  }

  function commitCriticalEventsDirect(nextEvents) {
    const stampedEvents = stampUpdatedEvents(currentEventsRef.current || [], nextEvents);
    currentEventsRef.current = stampedEvents;
    lastRemoteEventsRef.current = JSON.stringify(stampedEvents);
    setStore((current) => ({ ...current, events: stampedEvents }));

    if (serverConfig.sharedStateConfigured) {
      void saveRemoteState(stampedEvents)
        .then((saveResult) => {
          syncServerClock(saveResult.serverNowMs);
        })
        .catch((error) => {
          lastRemoteEventsRef.current = "__out_of_sync__";
          console.error("Failed to save critical event state:", error);
        });
    }
  }

  function handleUpdateMissionTokenPolicy(eventId, missionId, nextPolicyInput) {
    updateCriticalEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const tokenMissionId = getTokenMissionId(missionId, { isTraining: missionId === TOKEN_MISSION_TRAINING_ID });
        const currentPolicy = getMissionTokenPolicy(event, tokenMissionId, { isTraining: tokenMissionId === TOKEN_MISSION_TRAINING_ID });
        const nextPolicy = {
          ...currentPolicy,
          ...nextPolicyInput,
          updatedAt: new Date().toISOString(),
        };
        const nextEvent = {
          ...event,
          missionTokenPolicies: {
            ...(event.missionTokenPolicies || {}),
            [tokenMissionId]: nextPolicy,
          },
        };
        if (Object.prototype.hasOwnProperty.call(nextPolicyInput, "temporaryUnlimited")) {
          return appendTokenOperationalLog(nextEvent, {
            missionId: tokenMissionId,
            teamIdx: null,
            type: nextPolicyInput.temporaryUnlimited ? "temporary_unlimited_on" : "temporary_unlimited_off",
            message: nextPolicyInput.temporaryUnlimited
              ? "Missão ficou temporariamente ilimitada."
              : "Missão voltou a respeitar o limite de tokens.",
          });
        }
        if (Object.prototype.hasOwnProperty.call(nextPolicyInput, "mode")) {
          const modeMessage =
            nextPolicy.mode === TOKEN_POLICY_MODE_UNLIMITED
              ? "Missão configurada como ilimitada."
              : nextPolicy.mode === TOKEN_POLICY_MODE_CUSTOM
                ? `Missão configurada com limite personalizado de ${Math.max(1, Number(nextPolicy.customLimit || 0)).toLocaleString("pt-BR")} tokens.`
                : `Missão configurada com limite padrão de ${DEFAULT_MISSION_TOKEN_LIMIT.toLocaleString("pt-BR")} tokens.`;
          return appendTokenOperationalLog(nextEvent, {
            missionId: tokenMissionId,
            teamIdx: null,
            type: "policy_change",
            message: modeMessage,
          });
        }
        return nextEvent;
      }),
    );
  }

  function handleGrantTokens({ eventId, missionId, scope, teamIdx = null, amount, source = "facilitator", note = "" }) {
    const numericAmount = Math.max(0, Number(amount || 0));
    if (!numericAmount) {
      showToast("Defina uma quantidade válida de tokens");
      return;
    }
    const createdAt = new Date(getSyncedNowMs()).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((event) => {
      if (event.id !== eventId) return event;
      const tokenMissionId = getTokenMissionId(missionId, { isTraining: missionId === TOKEN_MISSION_TRAINING_ID });
      const nextEvent = {
        ...event,
        tokenGrants: [
          ...(event.tokenGrants || []),
          {
            id: `grant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            missionId: tokenMissionId,
            scope,
            teamIdx: scope === "turma" ? null : teamIdx,
            amount: numericAmount,
            createdAt,
            updatedAt: createdAt,
            note,
            source,
          },
        ],
        helpRequests: (event.helpRequests || []).map((request) =>
          request.kind === "tokens" &&
          request.status === "open" &&
          request.missionId === tokenMissionId &&
          (scope === "turma" || request.teamIdx === teamIdx)
            ? {
                ...request,
                status: "resolved",
                resolvedAt: createdAt,
                updatedAt: createdAt,
              }
            : request,
        ),
      };
      return appendTokenOperationalLog(nextEvent, {
        missionId: tokenMissionId,
        teamIdx: scope === "turma" ? null : teamIdx,
        type: "grant",
        message: `Facilitador liberou +${numericAmount.toLocaleString("pt-BR")} tokens.`,
      });
    });

    commitCriticalEventsDirect(nextEvents);

    showToast(`+${numericAmount.toLocaleString("pt-BR")} tokens liberados`);
  }

  function handleSendTokenRequest() {
    if (!teamEvent || timeTeamIdx === null || !currentMission || !currentTokenBudget) return;
    if (teamHelpDisabled) {
      showToast("Ajuda desativada para este time");
      return;
    }
    if (!currentTokenBudget.blocked) {
      showToast("A solicitação de tokens só libera quando o limite da missão for atingido");
      return;
    }
    if (currentOpenTokenRequest) {
      showToast("Já existe uma solicitação de tokens em aberto");
      return;
    }

    const createdAt = new Date(getSyncedNowMs()).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== teamEvent.id
        ? event
        : {
            ...event,
            helpRequests: [
              ...(event.helpRequests || []),
              {
                id: `token_help_${Date.now()}`,
                kind: "tokens",
                teamIdx: timeTeamIdx,
                missionId: currentTokenBudget.missionId,
                message: "Solicitação de liberação de tokens.",
                status: "open",
                createdAt,
                updatedAt: createdAt,
                currentUsage: currentTokenBudget.usage.totalTokens,
                currentLimit: currentTokenBudget.effectiveLimit,
              },
            ],
          },
    );
    commitCriticalEventsDirect(nextEvents);
    showToast("Solicitação enviada ao facilitador.");
  }

  function handleQuickModelChange(nextModel) {
    const storeKey = currentMissionAiMode === CODING_AI_MODE ? "codingModel" : "chatModel";
    setStore((current) => ({ ...current, [storeKey]: nextModel }));
    setConfigForm((current) => ({ ...current, [storeKey]: nextModel }));
  }

  function handleQuickPlanningModeChange(nextPlanningMode) {
    setStore((current) => ({ ...current, planningMode: nextPlanningMode }));
    setConfigForm((current) => ({ ...current, planningMode: nextPlanningMode }));
  }

  async function handleAttachFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    if (missionAttachments.length >= MAX_ATTACHMENT_COUNT) {
      showToast(`Limite de ${MAX_ATTACHMENT_COUNT} arquivos por rodada.`);
      return;
    }

    const availableSlots = MAX_ATTACHMENT_COUNT - missionAttachments.length;
    const nextFiles = files.slice(0, availableSlots);

    try {
      const validFiles = nextFiles.filter((file) => {
        if (file.size > MAX_ATTACHMENT_SIZE) {
          showToast(`${file.name} excede o limite de 10 MB.`);
          return false;
        }
        if (classifyAttachment(file) === "unsupported") {
          showToast(`${file.name} não é um tipo permitido.`);
          return false;
        }
        return true;
      });

      const settled = await Promise.allSettled(validFiles.map((file) => createAttachmentRecord(file)));
      const records = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
      const failures = settled
        .flatMap((result, index) =>
          result.status === "rejected"
            ? [{ fileName: validFiles[index]?.name || "arquivo", message: result.reason?.message || "Falha ao anexar arquivo." }]
            : [],
        );
      const warnings = records
        .map((record) => record.warningMessage)
        .filter(Boolean);
      failures.forEach((failure) => showToast(failure.message || `${failure.fileName}: falha ao anexar.`));
      warnings.forEach((warning) => showToast(warning));
      if (!records.length) return;
      setMissionAttachments((current) => [...current, ...records].slice(0, MAX_ATTACHMENT_COUNT));
      showToast(`${records.length} arquivo(s) anexado(s)`);
    } catch (error) {
      console.error(error);
      showToast("Falha ao anexar arquivo.");
    }
  }

  function handleRemoveAttachment(attachmentId) {
    setMissionAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  }

  function openConfirm(title, body, onConfirm, options = {}) {
    setConfirmInput("");
    setConfirmState({
      open: true,
      title,
      body,
      onConfirm,
      secondaryAction: options.secondaryAction || null,
      confirmTone: options.confirmTone || "danger",
      requiresPassword: Boolean(options.requiresPassword),
      confirmValue: options.confirmValue || "",
      confirmLabel: options.confirmLabel || "Senha de confirmação",
      confirmPlaceholder: options.confirmPlaceholder || "",
      confirmHint: options.confirmHint || "",
      confirmActionLabel: options.confirmActionLabel || "Confirmar",
    });
  }

  function closeConfirm() {
    setConfirmInput("");
    setConfirmState({
      open: false,
      title: "",
      body: "",
      onConfirm: null,
      secondaryAction: null,
      confirmTone: "danger",
      requiresPassword: false,
      confirmValue: "",
      confirmLabel: "",
      confirmPlaceholder: "",
      confirmHint: "",
      confirmActionLabel: "Confirmar",
    });
  }

  function openDeleteConfirm({
    eventId,
    title,
    body,
    onConfirm,
    onArchive,
    passwordMode = "event_code",
    confirmActionLabel = "Confirmar",
    secondaryActionLabel = "Salvar histórico",
    facilitatorHint = "Digite a mesma senha do facilitador para liberar esta exclusão.",
  }) {
    const usesFacilitatorPassword = passwordMode === "facilitator";
    openConfirm(title, body, onConfirm, {
      requiresPassword: true,
      confirmValue: usesFacilitatorPassword ? FACILITATOR_PASSWORD : eventId,
      confirmLabel: "Senha de segurança",
      confirmPlaceholder: usesFacilitatorPassword ? "Digite a senha do facilitador" : `Digite o código do evento (${eventId})`,
      confirmHint: usesFacilitatorPassword
        ? facilitatorHint
        : "Digite exatamente o código do evento para liberar esta exclusão.",
      secondaryAction: onArchive
        ? {
            label: secondaryActionLabel,
            className: "btn-primary",
            onClick: onArchive,
          }
        : null,
      confirmActionLabel,
    });
  }

  function goHome() {
    setScreen("home");
    setEntryError("");
    setActiveStudentName("");
    setMaterialsDrawerOpen(false);
    setAnamnesisOpen(false);
    setAnamnesisAnswers({});
    setAnamnesisError("");
    setAnamnesisContext(null);
  }

  function goSurvival() {
    setScreen("survival");
    setSurvivalAuthError("");
    setSurvivalError("");
  }

  function handleUnlockSurvival() {
    if (survivalPasswordInput.trim() !== SURVIVAL_PASSWORD) {
      setSurvivalAuthError("Senha incorreta.");
      return;
    }
    setSurvivalAccessGranted(true);
    setSurvivalPasswordInput("");
    setSurvivalAuthError("");
  }

  function handleLeaveSurvival() {
    setSurvivalAccessGranted(false);
    setSurvivalPasswordInput("");
    setSurvivalAuthError("");
    setSurvivalRunning(false);
    setSurvivalRunState(null);
    setSurvivalPendingPrompt("");
    setSurvivalPendingAttachments([]);
    setSurvivalAttachments([]);
    setSurvivalError("");
    goHome();
  }

  function handleSelectSurvivalMode(aiMode) {
    setSurvivalSelectedMode(aiMode);
    setSurvivalError("");
  }

  function handleChangeSurvivalDraft(value) {
    if (!survivalSelectedMode) return;
    setSurvivalDrafts((current) => ({
      ...current,
      [survivalSelectedMode]: value,
    }));
  }

  function handleChangeSurvivalModel(nextModel) {
    if (!survivalSelectedMode) return;
    setSurvivalModels((current) => ({
      ...current,
      [survivalSelectedMode]: nextModel,
    }));
  }

  function handleToggleSurvivalPlanningMode() {
    setSurvivalPlanningMode((current) => (current === "on" ? "off" : "on"));
  }

  function handleToggleSurvivalTheme() {
    setSurvivalTheme((current) => (current === SURVIVAL_THEME_DARK ? SURVIVAL_THEME_LIGHT : SURVIVAL_THEME_DARK));
  }

  function handleClearSurvivalConversation() {
    if (!survivalSelectedMode || survivalRunning) return;
    setSurvivalConversations((current) => ({
      ...current,
      [survivalSelectedMode]: [],
    }));
    setSurvivalDrafts((current) => ({
      ...current,
      [survivalSelectedMode]: "",
    }));
    setSurvivalPendingPrompt("");
    setSurvivalPendingAttachments([]);
    setSurvivalAttachments([]);
    setSurvivalRunState(null);
    setSurvivalError("");
    showToast("Conversa local limpa");
  }

  async function handleAttachSurvivalFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    if (survivalAttachments.length >= MAX_ATTACHMENT_COUNT) {
      showToast(`Limite de ${MAX_ATTACHMENT_COUNT} arquivos por rodada.`);
      return;
    }

    const availableSlots = MAX_ATTACHMENT_COUNT - survivalAttachments.length;
    const nextFiles = files.slice(0, availableSlots);

    nextFiles.forEach((file) => {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        showToast(`${file.name} excede o limite de 10 MB.`);
      } else if (classifyAttachment(file) === "unsupported") {
        showToast(`${file.name} não é um tipo permitido.`);
      }
    });

    try {
      const { records, failures, warnings } = await buildAttachmentRecordsFromFiles(nextFiles);
      failures.forEach((failure) => showToast(failure.message || `${failure.fileName}: falha ao anexar.`));
      warnings.forEach((warning) => showToast(warning));
      if (!records.length) return;
      setSurvivalAttachments((current) => [...current, ...records].slice(0, MAX_ATTACHMENT_COUNT));
      showToast(`${records.length} arquivo(s) anexado(s)`);
    } catch (error) {
      console.error(error);
      showToast("Falha ao anexar arquivo.");
    }
  }

  function handleRemoveSurvivalAttachment(attachmentId) {
    setSurvivalAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  }

  function goFacilitador() {
    setFacAccessPassword("");
    setFacAccessError("");
    setFacAccessOpen(true);
  }

  function handleFacilitadorAccess() {
    if (facAccessPassword.trim() !== FACILITATOR_PASSWORD) {
      setFacAccessError("Senha incorreta.");
      return;
    }
    setFacAccessOpen(false);
    setScreen("facilitador");
  }

  function goEntradaTime() {
    setMaterialsDrawerOpen(false);
    setAnamnesisOpen(false);
    setAnamnesisAnswers({});
    setAnamnesisError("");
    setAnamnesisContext(null);
    runBrandLoaderTransition(() => {
      setScreen("entry");
      setEntryError("");
      setTimeEventId(null);
      setTimeTeamIdx(null);
      setTimeMissionIdx(null);
      setActiveStudentName("");
    });
  }

  function goEscolhaTime() {
    setMaterialsDrawerOpen(false);
    setAnamnesisOpen(false);
    setAnamnesisAnswers({});
    setAnamnesisError("");
    setAnamnesisContext(null);
    setScreen("team");
    setTimeTeamIdx(null);
    setTimeMissionIdx(null);
  }

  function handleDevPickEvent(eventId) {
    if (!eventId) return;
    setFacSelectedId(eventId);
    setTimeEventId(eventId);
    setEntryCode(eventId);
    setEntryError("");
  }

  function handleDevPickTeam(teamIndex) {
    if (teamIndex === "" || teamIndex === null || teamIndex === undefined) return;
    const nextIndex = Number(teamIndex);
    if (Number.isNaN(nextIndex)) return;
    setTimeTeamIdx(nextIndex);
  }

  function handleDevOpenFacilitador() {
    const fallbackEventId = facSelectedId || timeEventId || events[0]?.id || null;
    if (fallbackEventId) setFacSelectedId(fallbackEventId);
    setScreen("facilitador");
  }

  function handleDevOpenEntrada() {
    if (timeEventId) setEntryCode(timeEventId);
    setEntryError("");
    setScreen("entry");
  }

  function handleDevOpenTimeSelection() {
    const fallbackEventId = timeEventId || facSelectedId || events[0]?.id || null;
    if (fallbackEventId) {
      setTimeEventId(fallbackEventId);
      setEntryCode(fallbackEventId);
    }
    setScreen("team");
  }

  function handleDevOpenWorkspace() {
    const fallbackEventId = timeEventId || facSelectedId || events[0]?.id || null;
    const fallbackEvent = events.find((event) => event.id === fallbackEventId) || null;
    const fallbackTeamIdx = timeTeamIdx ?? 0;
    if (!fallbackEvent || !fallbackEvent.teams[fallbackTeamIdx]) return;
    setTimeEventId(fallbackEvent.id);
    setTimeTeamIdx(fallbackTeamIdx);
    setScreen("workspace");
  }

  async function handleExecutarSurvival() {
    if (!survivalSelectedMode) return;
    const input = survivalDraft.trim();
    const attachments = survivalAttachments;
    if (!input && !attachments.length) {
      setSurvivalError("Escreva um prompt ou anexe pelo menos um arquivo.");
      return;
    }

    const mission = getSurvivalMission(survivalSelectedMode);
    const selectedModel = survivalSelectedModel;
    const historyContext = buildHistoryContext(survivalExecs);
    const wasPlanningOn = survivalPlanningMode === "on";
    const shouldAutoOpenPreview = apiConfigured && survivalSelectedMode === CODING_AI_MODE && isHtmlPrototypeRequest(input);
    const previousCodingResponseId =
      survivalSelectedMode === CODING_AI_MODE ? survivalExecs[survivalExecs.length - 1]?.codingResponseId || "" : "";

    setSurvivalPendingPrompt(input);
    setSurvivalPendingAttachments(attachments);
    setSurvivalAttachments([]);
    handleChangeSurvivalDraft("");
    setSurvivalRunning(true);
    setSurvivalError("");
    setSurvivalRunState({
      phase: "analisando",
      stepIndex: 0,
      displayedOutput: "",
      fullOutput: "",
      reasoningText: "",
      processingSteps: buildRunSteps(apiConfigured),
      reasoningDetails: null,
      usedHistory: historyContext.length > 0,
      simulationMode: apiConfigured ? "openai-live" : "mock-stream",
    });

    const previewWindow =
      shouldAutoOpenPreview && typeof window !== "undefined"
        ? window.open("", "_blank")
        : null;
    if (previewWindow) {
      renderPreviewWindowPlaceholder(previewWindow, "Preview em preparação", "A IA começou a montar a instância HTML desta rodada.");
    }

    try {
      if (!apiConfigured) {
        for (let index = 0; index < 2; index += 1) {
          setSurvivalRunState((current) =>
            current
              ? {
                  ...current,
                  phase: SIMULATION_STEPS[index].key,
                  stepIndex: index,
                  processingSteps: current.processingSteps.map((step, stepIndex) => ({
                    ...step,
                    status: stepIndex < index ? "done" : stepIndex === index ? "active" : "pending",
                  })),
                }
              : current,
          );
          await sleep(index === 0 ? 700 : 850);
        }
      } else {
        setSurvivalRunState((current) =>
          current
            ? {
                ...current,
                phase: "estrategia",
                stepIndex: 1,
                processingSteps: current.processingSteps.map((step, stepIndex) => ({
                  ...step,
                  status: stepIndex < 1 ? "done" : stepIndex === 1 ? "active" : "pending",
                })),
              }
            : current,
        );
      }

      const result = apiConfigured
        ? await executarComIA({
            mission,
            input,
            attachments,
            acao: FREE_ACTION_KEY,
            model: selectedModel,
            modelPricing: modelPricingMap,
            planningMode: survivalPlanningMode,
            historyContext,
            previousResponseId: previousCodingResponseId,
            onDelta: (nextText) => {
              survivalLiveAnswerRef.current?.pushAnswer(nextText);
            },
            onReasoning: (nextReasoning) => {
              survivalLiveAnswerRef.current?.pushReasoning(nextReasoning);
            },
          })
        : executarMock({
            mission,
            input,
            acao: FREE_ACTION_KEY,
            attachments,
            model: selectedModel,
            modelPricing: modelPricingMap,
            planningMode: survivalPlanningMode,
            historyContext,
          });

      setSurvivalRunState((current) =>
        current
          ? {
              ...current,
              phase: "gerando",
              stepIndex: 2,
              fullOutput: result.output,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
              custo: result.custo,
              processingSteps: current.processingSteps.map((step, stepIndex) => ({
                ...step,
                status: stepIndex < 2 ? "done" : stepIndex === 2 ? "active" : "pending",
              })),
            }
          : current,
      );

      if (!apiConfigured) {
        let cursor = 0;
        const chunkSize = 30;
        while (cursor < result.output.length) {
          cursor = Math.min(result.output.length, cursor + chunkSize);
          survivalLiveAnswerRef.current?.pushAnswer(result.output.slice(0, cursor));
          await sleep(40);
        }
      }

      setSurvivalRunState((current) =>
        current
          ? {
              ...current,
              phase: "finalizando",
              stepIndex: 3,
              processingSteps: current.processingSteps.map((step, stepIndex) => ({
                ...step,
                status: stepIndex < 3 ? "done" : stepIndex === 3 ? "active" : "pending",
              })),
            }
          : current,
      );

      if (!apiConfigured) {
        await sleep(350);
      }

      const generatedArtifacts = survivalSelectedMode === CODING_AI_MODE ? extractGeneratedArtifacts(result.output, `survival-${Date.now()}`) : [];
      const htmlArtifact = generatedArtifacts.find((artifact) => artifact.previewMode === "html");
      if (previewWindow) {
        if (htmlArtifact) {
          writePreviewWindowDocument(
            previewWindow,
            buildPreviewWindowHtmlDocument(htmlArtifact.content, htmlArtifact.fileName || "Preview HTML"),
          );
        } else {
          renderPreviewWindowPlaceholder(
            previewWindow,
            "Sem preview executável",
            "Esta rodada terminou, mas a IA não devolveu um HTML completo para abrir automaticamente.",
          );
        }
      }

      const execRecord = {
        id: `survival_${Date.now()}`,
        ts: new Date().toISOString(),
        input,
        attachments: sanitizeAttachmentsForStorage(attachments),
        acao: FREE_ACTION_KEY,
        actionMode: "free",
        isFreeInstruction: true,
        output: result.output,
        reasoningText: result.reasoningText || "",
        promptApplied: result.promptApplied || "",
        processingSteps: buildRunSteps(apiConfigured).map((step) => ({ ...step, status: "done" })),
        inputTokens: result.inputTokens || 0,
        outputTokens: result.outputTokens || 0,
        tokens: result.tokens || (result.inputTokens || 0) + (result.outputTokens || 0),
        custo: result.custo || 0,
        iterationNumber: survivalExecs.length + 1,
        generatedArtifacts,
        codingResponseId: result.responseId || "",
        effectiveModel: result.effectiveModel || selectedModel,
        selectedModel,
        aiMode: survivalSelectedMode,
      };

      setSurvivalConversations((current) => ({
        ...current,
        [survivalSelectedMode]: [...(current[survivalSelectedMode] || []), execRecord],
      }));
      setSurvivalPendingPrompt("");
      setSurvivalPendingAttachments([]);
      setSurvivalRunState(null);
      if (wasPlanningOn) {
        setSurvivalPlanningMode("off");
      }
      showToast(wasPlanningOn ? "Plano survival concluído" : "Rodada survival concluída");
    } catch (error) {
      if (previewWindow) {
        renderPreviewWindowPlaceholder(
          previewWindow,
          "Preview interrompido",
          "A rodada falhou antes de devolver um HTML executável. Você pode tentar novamente com um pedido mais específico.",
        );
      }
      console.error(error);
      setSurvivalError(error?.message || "Falha ao executar no modo survival.");
      setSurvivalAttachments(attachments);
      setSurvivalPendingPrompt("");
      setSurvivalPendingAttachments([]);
      setSurvivalRunState(null);
    } finally {
      setSurvivalRunning(false);
    }
  }

  function handleCreateEvent() {
    const trimmedName = newEventForm.name.trim();
    const trimmedDesc = newEventForm.desc.trim();
    const trimmedTeams = newEventForm.teams.trim();

    if (!trimmedName) {
      showToast("Digite um nome para criar o evento");
      return;
    }

    try {
      const event = migrateEventToFixedMissions(
        Object.assign(
          makeEvent({
            name: trimmedName,
            desc: trimmedDesc,
            rawTeams: trimmedTeams,
          }),
          {
            eventMode: newEventForm.eventMode,
            anamnesisEnabled: Boolean(newEventForm.anamnesisEnabled),
          },
        ),
      );

      if (newEventForm.teamMode === "import") {
        if (!newEventStudents.length) {
          showToast("Cole pelo menos um nome para importar");
          return;
        }
        const generatedTeams = buildTeamsFromStudents(newEventStudents, "solo", 1);
        event.teams = generatedTeams;
      }

      updateEvents((current) => [...current, event]);
      setFacSelectedId(event.id);
      setFacTab("dashboard");
      setNewEventForm({
        name: "",
        desc: "",
        teams: "",
        eventMode: MISSIONS_MODE_EVENT,
        anamnesisEnabled: false,
        teamMode: "manual",
        studentsRaw: "",
        importMode: "solo",
        randomTeamCount: 2,
      });
      setNewEventOpen(false);
      setScreen("facilitador");
      showToast("Evento criado");
    } catch (error) {
      console.error(error);
      showToast(error?.message || "Falha ao criar evento");
    }
  }

  function handleSetAnamnesisEnabled(eventId, enabled) {
    updateEvents((current) =>
      current.map((event) => (event.id === eventId ? { ...event, anamnesisEnabled: enabled } : event)),
    );
    showToast(enabled ? "Anamnese habilitada no evento" : "Anamnese desabilitada no evento");
  }

  async function removeEventFromActiveList(eventId, { archive = false } = {}) {
    const currentEvents = store.events || [];
    const removedEvent = currentEvents.find((event) => event.id === eventId) || null;
    if (!removedEvent) {
      showToast("Não foi possível localizar o evento para excluir");
      return;
    }
    const hiddenAt = new Date().toISOString();
    const nextEventsSnapshot = currentEvents.map((event) =>
      event.id !== eventId
        ? event
        : {
            ...event,
            hiddenAt,
            hiddenReason: archive ? "archived" : "hidden",
          },
    );
    const archivedRecord = archive
      ? {
          archivedAt: hiddenAt,
          event: removedEvent,
        }
      : null;

    setStore((current) => ({
      ...current,
      events: nextEventsSnapshot,
      archivedEvents: archivedRecord ? [archivedRecord, ...(current.archivedEvents || [])] : current.archivedEvents || [],
    }));

    if (facSelectedId === eventId) setFacSelectedId(null);
    if (timeEventId === eventId) {
      setTimeEventId(null);
      setTimeTeamIdx(null);
      setTimeMissionIdx(null);
      setScreen("entry");
    }

    try {
      if (serverConfig.supabaseConfigured) {
        const normalizedEvents = normalizeEventsForProduct(nextEventsSnapshot);
        lastRemoteEventsRef.current = JSON.stringify(normalizedEvents);
        await saveRemoteState(normalizedEvents);
      }
      showToast(archive ? "Evento ocultado e histórico salvo" : "Evento ocultado da lista ativa");
    } catch (error) {
      console.error(error);
      showToast(archive ? "Evento ocultado localmente e histórico salvo, mas falhou na sincronização" : "Evento ocultado localmente, mas falhou na sincronização");
    }
  }

  function archiveEventSnapshot(eventId) {
    void removeEventFromActiveList(eventId, { archive: true });
  }

  function handleDeleteEvent(eventId) {
    void removeEventFromActiveList(eventId, { archive: false });
  }

  function handleSetStatus(eventId, status) {
    updateEvents((current) => current.map((event) => (event.id === eventId ? { ...event, status } : event)));
    showToast(status === "open" ? "Evento aberto" : status === "closed" ? "Evento encerrado" : "Evento voltou para preparação");
  }

  function handleSetEventMode(eventId, eventMode) {
    updateEvents((current) => current.map((event) => (event.id === eventId ? { ...event, eventMode } : event)));
    if (timeEventId === eventId) {
      setTimeMissionIdx(null);
      setMissionFlow({ stage: "idle", exec: null });
      setMissionInput("");
      setRunError("");
    }
    showToast(eventMode === TRAINING_MODE_EVENT ? "Modo treino ativado" : "Modo por missões ativado");
  }

  function handleAddTeam() {
    if (!newTeamName.trim() || !selectedEvent) return;
    updateEvents((current) =>
      current.map((event) =>
        event.id !== selectedEvent.id
          ? event
          : { ...event, teams: [...event.teams, makeTeam(newTeamName.trim())] },
      ),
    );
    setNewTeamName("");
    setAddTeamOpen(false);
    showToast("Time adicionado");
  }

  function applyImportedTeams(eventId, teams) {
    updateEvents((current) =>
      current.map((event) =>
        event.id !== eventId
          ? event
          : {
              ...event,
              teams,
              execucoes: {},
              reflexoes: {},
              questionariosPendentes: {},
              conclusoes: {},
              preservedMissionUsage: {},
              helpRequests: [],
              helpDisabledMap: {},
            },
      ),
    );
    if (timeEventId === eventId) {
      setTimeTeamIdx(null);
      setTimeMissionIdx(null);
      setMissionFlow({ stage: "idle", exec: null });
      setHistoryOpen(false);
      setMissionInput("");
    }
    setTeamImportForm({
      studentsRaw: "",
      importMode: "solo",
      randomTeamCount: 2,
    });
    setAddTeamOpen(false);
    showToast("Times gerados");
  }

  function handleGenerateTeamsForEvent() {
    if (!selectedEvent) return;
    if (!importedStudents.length) {
      showToast("Cole pelo menos um nome para importar");
      return;
    }
    if (teamImportForm.importMode === "random" && (!teamImportForm.randomTeamCount || teamImportForm.randomTeamCount > importedStudents.length)) {
      showToast("Defina uma quantidade de times válida");
      return;
    }

    const teams = buildTeamsFromStudents(importedStudents, teamImportForm.importMode, teamImportForm.randomTeamCount);
    if (selectedEvent.teams.length) {
      openConfirm(
        "Substituir estrutura de times",
        "Os times atuais serão substituídos e os vínculos operacionais desta turma serão zerados para reconfigurar o evento do zero. Deseja continuar?",
        () => applyImportedTeams(selectedEvent.id, teams),
        { confirmTone: "primary" },
      );
      return;
    }

    applyImportedTeams(selectedEvent.id, teams);
  }

  function handleRemoveTeam(eventId, index) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const teams = [...event.teams];
        teams.splice(index, 1);
        const filterMissionKeyMap = (map = {}) =>
          Object.fromEntries(
            Object.entries(map).filter(([key]) => {
              const teamIdx = Number(`${key}`.split("__")[0]);
              return teamIdx !== index;
            }),
          );
        const remapTeamScopedMap = (map = {}) =>
          Object.fromEntries(
            Object.entries(map).flatMap(([key, value]) => {
              const teamIdx = Number(key);
              if (!Number.isFinite(teamIdx) || teamIdx === index) return [];
              const nextKey = teamIdx > index ? `${teamIdx - 1}` : `${teamIdx}`;
              return [[nextKey, value]];
            }),
          );
        return {
          ...event,
          teams,
          execucoes: filterMissionKeyMap(event.execucoes),
          reflexoes: filterMissionKeyMap(event.reflexoes),
          questionariosPendentes: filterMissionKeyMap(event.questionariosPendentes),
          conclusoes: filterMissionKeyMap(event.conclusoes),
          preservedMissionUsage: filterMissionKeyMap(event.preservedMissionUsage),
          helpRequests: (event.helpRequests || []).filter((request) => request.teamIdx !== index),
          helpDisabledMap: remapTeamScopedMap(event.helpDisabledMap),
          trainingRuns: Object.fromEntries(
            Object.entries(event.trainingRuns || {}).filter(([key]) => Number(key) !== index),
          ),
          trainingHelpRequests: (event.trainingHelpRequests || []).filter((request) => request.teamIdx !== index),
        };
      }),
    );
    showToast("Time removido");
  }

  async function handleToggleMission(eventId, index, unlocked) {
    const pendingKey = getMissionTogglePendingKey(eventId, index);
    if (missionTogglePending[pendingKey]) return;

    const previousEvents = currentEventsRef.current || [];
    const currentEvent = previousEvents.find((event) => event.id === eventId);
    const currentMission = currentEvent?.missions?.[index];
    const previousUnlocked = Boolean(currentMission?.unlocked);
    if (!currentMission || previousUnlocked === unlocked) return;

    setMissionTogglePending((current) => ({ ...current, [pendingKey]: true }));
    const missionUpdatedAt = new Date().toISOString();
    const nextEvents = previousEvents.map((event) =>
      event.id !== eventId
        ? event
        : {
            ...event,
            missions: event.missions.map((mission, missionIndex) =>
              missionIndex === index ? { ...mission, unlocked, updatedAt: missionUpdatedAt } : mission,
            ),
          },
    );
    const updatedEvents = stampUpdatedEvents(previousEvents, nextEvents);

    currentEventsRef.current = updatedEvents;
    lastRemoteEventsRef.current = JSON.stringify(updatedEvents);
    setStore((current) => ({ ...current, events: updatedEvents }));

    try {
      if (serverConfig.sharedStateConfigured) {
        const saveResult = await saveRemoteState(updatedEvents);
        syncServerClock(saveResult.serverNowMs);
      }
      showToast(unlocked ? "Missão liberada" : "Missão bloqueada");
    } catch (error) {
      console.error("Failed to save mission toggle:", error);
      setStore((current) => {
        const revertedEvents = stampUpdatedEvents(
          current.events || [],
          (current.events || []).map((event) =>
            event.id !== eventId
              ? event
              : {
                  ...event,
                  missions: event.missions.map((mission, missionIndex) =>
                    missionIndex === index && mission.unlocked === unlocked
                      ? { ...mission, unlocked: previousUnlocked, updatedAt: missionUpdatedAt }
                      : mission,
                  ),
                },
          ),
        );
        currentEventsRef.current = revertedEvents;
        lastRemoteEventsRef.current = "__out_of_sync__";
        return { ...current, events: revertedEvents };
      });
      showToast(error.message || "Falha ao salvar a missão");
    } finally {
      setMissionTogglePending((current) => {
        const next = { ...current };
        delete next[pendingKey];
        return next;
      });
    }
  }

  function handleMissionAiModeChange(eventId, index, aiMode) {
    const missionUpdatedAt = new Date().toISOString();
    updateEvents((current) =>
      current.map((event) =>
        event.id !== eventId
          ? event
          : {
              ...event,
              missions: event.missions.map((mission, missionIndex) =>
                missionIndex === index
                  ? {
                      ...mission,
                      aiMode: aiMode === CODING_AI_MODE ? CODING_AI_MODE : CHAT_AI_MODE,
                      updatedAt: missionUpdatedAt,
                    }
                  : mission,
              ),
            },
      ),
    );
    showToast(`Missão ajustada para ${AI_MODE_LABELS[aiMode] || AI_MODE_LABELS[CHAT_AI_MODE]}`);
  }

  function handleSaveEventConfig() {
    if (!selectedEvent) return;
    const name = eventMetaForm.name.trim();
    const desc = eventMetaForm.desc.trim() || "";
    if (!name) return;
    updateEvents((current) => current.map((event) => (event.id === selectedEvent.id ? { ...event, name, desc } : event)));
    showToast("Salvo");
  }

  async function handleSaveConfig() {
    try {
      const trimmedKey = configForm.apiKey.trim();
      if (trimmedKey) {
        const nextConfig = await saveServerOpenAIKey(trimmedKey);
        setServerConfig(nextConfig);
      }
      setStore((current) => ({
        ...current,
        chatModel: configForm.chatModel,
        codingModel: configForm.codingModel,
      }));
      setConfigForm((current) => ({ ...current, apiKey: "" }));
      setConfigOpen(false);
      showToast(trimmedKey ? "Chave salva no servidor local" : "Modelo atualizado");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Falha ao salvar configuração da IA");
    }
  }

  async function handleRemoveKey() {
    try {
      const nextConfig = await removeServerOpenAIKey();
      setServerConfig(nextConfig);
      setConfigForm((current) => ({ ...current, apiKey: "" }));
      setConfigOpen(false);
      showToast("Chave persistente removida");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Falha ao remover chave persistente");
    }
  }

  function handleEntrarEvento() {
    if (!entryCode.trim()) {
      setEntryError("Informe o código do evento.");
      return;
    }
    const event = events.find((item) => item.id === entryCode.trim());
    if (!event) {
      setEntryError("Evento não encontrado. Verifique o código com o facilitador.");
      return;
    }
    if (event.status === "draft") {
      setEntryError("Este evento ainda não foi aberto. Aguarde o facilitador.");
      return;
    }
    if (event.status === "closed") {
      setEntryError("Este evento já foi encerrado.");
      return;
    }
    setEntryError("");
    setTimeEventId(event.id);
    setTimeTeamIdx(null);
    setScreen("team");
  }

  function handleEscolherTime(index, memberName = "") {
    const selectedEvent = events.find((event) => event.id === timeEventId) || null;
    const eventMode = selectedEvent ? getEventMode(selectedEvent) : MISSIONS_MODE_EVENT;
    const pendingMissionIdx =
      selectedEvent && eventMode !== TRAINING_MODE_EVENT ? getFirstPendingMissionIndex(selectedEvent, index) : -1;
    const firstUnlockedMissionIdx =
      selectedEvent && eventMode !== TRAINING_MODE_EVENT
        ? selectedEvent.missions.findIndex((mission) => mission.unlocked)
        : -1;
    const normalizedMemberName = normalizeStudentName(memberName || "") || selectedEvent?.teams?.[index]?.name || "";

    if (selectedEvent && isAnamnesisEnabled(selectedEvent) && !hasCompletedAnamnesis(selectedEvent, index)) {
      setActiveStudentName(normalizedMemberName);
      setAnamnesisAnswers({});
      setAnamnesisError("");
      setAnamnesisStep(0);
      setAnamnesisContext({
        eventId: selectedEvent.id,
        teamIdx: index,
        memberName: normalizedMemberName,
        nextMissionIdx: pendingMissionIdx >= 0 ? pendingMissionIdx : firstUnlockedMissionIdx >= 0 ? firstUnlockedMissionIdx : null,
      });
      setAnamnesisOpen(true);
      return;
    }

    runBrandLoaderTransition(() => {
      setActiveStudentName(normalizedMemberName);
      setTimeTeamIdx(index);
      setTimeMissionIdx(pendingMissionIdx >= 0 ? pendingMissionIdx : firstUnlockedMissionIdx >= 0 ? firstUnlockedMissionIdx : null);
      setScreen("workspace");
    });
  }

  function handleSelectEntryEvent(eventId) {
    setEntryError("");
    setTimeEventId(eventId);
    setTimeTeamIdx(null);
    setTimeMissionIdx(null);
    setScreen("team");
  }

  function handleEscolherAluno(teamIdx) {
    const selectedStudent = teamStudentOptions.find((item) => item.teamIdx === teamIdx);
    const label = selectedStudent?.name || teamEvent?.teams?.[teamIdx]?.name || "este nome";
    openConfirm(
      "Confirmar identidade",
      `Confirmar que você é ${label}?`,
      () => handleEscolherTime(teamIdx, label),
      { confirmTone: "primary" },
    );
  }

  function handleToggleAnamnesisOption(question, optionIdx) {
    setAnamnesisError("");
    setAnamnesisAnswers((current) => {
      const currentValue = current[question.id];
      const unknownSelected = optionIdx === ANAMNESIS_UNKNOWN_VALUE;
      const currentChoice = question.optionalText ? getAnamnesisAnswerChoice(question, currentValue) : currentValue;
      const currentNote = question.optionalText ? getAnamnesisAnswerNote(question, currentValue) : "";

      if (question.type === "multi") {
        const next = Array.isArray(currentChoice) ? [...currentChoice] : [];
        let nextValue;
        if (unknownSelected) {
          nextValue = next.includes(ANAMNESIS_UNKNOWN_VALUE) ? [] : [ANAMNESIS_UNKNOWN_VALUE];
        } else {
          const withoutUnknown = next.filter((item) => item !== ANAMNESIS_UNKNOWN_VALUE);
          nextValue = withoutUnknown.includes(optionIdx)
            ? withoutUnknown.filter((item) => item !== optionIdx)
            : [...withoutUnknown, optionIdx].sort((a, b) => a - b);
        }
        return {
          ...current,
          [question.id]: question.optionalText ? { choice: nextValue, note: currentNote } : nextValue,
        };
      }

      const nextValue = currentChoice === optionIdx ? "" : optionIdx;
      const finalChoice = unknownSelected ? ANAMNESIS_UNKNOWN_VALUE : nextValue;
      return {
        ...current,
        [question.id]: question.optionalText ? { choice: finalChoice, note: currentNote } : finalChoice,
      };
    });
  }

  function handleChangeAnamnesisText(questionId, value) {
    setAnamnesisError("");
    const question = ANAMNESIS_QUESTIONS.find((item) => item.id === questionId);
    if (!question) return;
    setAnamnesisAnswers((current) => {
      if (!question.optionalText) return { ...current, [questionId]: value };
      const currentValue = current[questionId];
      return {
        ...current,
        [questionId]: {
          choice: getAnamnesisAnswerChoice(question, currentValue) ?? (question.type === "multi" ? [] : ""),
          note: value,
        },
      };
    });
  }

  function handleCloseAnamnesisModal() {
    setAnamnesisOpen(false);
    setAnamnesisAnswers({});
    setAnamnesisError("");
    setAnamnesisContext(null);
    setAnamnesisStep(0);
    setActiveStudentName("");
  }

  function handleAdvanceAnamnesisStep() {
    if (!currentAnamnesisQuestion) return;
    if (!isCurrentAnamnesisAnswered) {
      setAnamnesisError(`Responda a pergunta ${currentAnamnesisQuestion.number} antes de continuar.`);
      return;
    }
    setAnamnesisError("");
    setAnamnesisStep((current) => Math.min(current + 1, ANAMNESIS_QUESTIONS.length - 1));
  }

  function handleReturnAnamnesisStep() {
    setAnamnesisError("");
    setAnamnesisStep((current) => Math.max(current - 1, 0));
  }

  function handleSubmitAnamnesis() {
    if (!anamnesisContext) return;
    const missingQuestion = ANAMNESIS_QUESTIONS.find(
      (question) => !isAnamnesisAnswerFilled(question, anamnesisAnswers[question.id]),
    );
    if (missingQuestion) {
      setAnamnesisError(`Responda a pergunta ${missingQuestion.number} antes de continuar.`);
      setAnamnesisStep(Math.max(0, ANAMNESIS_QUESTIONS.findIndex((question) => question.id === missingQuestion.id)));
      return;
    }

    const normalizedAnswers = ANAMNESIS_QUESTIONS.reduce((accumulator, question) => {
      accumulator[question.id] = normalizeAnamnesisAnswer(question, anamnesisAnswers[question.id]);
      return accumulator;
    }, {});
    const submittedAt = new Date().toISOString();

    updateEvents((current) =>
      current.map((event) =>
        event.id !== anamnesisContext.eventId
          ? event
          : {
              ...event,
              anamnesisResponses: {
                ...(event.anamnesisResponses || {}),
                [anamnesisContext.teamIdx]: {
                  teamIdx: anamnesisContext.teamIdx,
                  memberName: anamnesisContext.memberName,
                  answers: normalizedAnswers,
                  submittedAt,
                  updatedAt: submittedAt,
                },
              },
            },
      ),
    );

    setAnamnesisOpen(false);
    setAnamnesisAnswers({});
    setAnamnesisError("");
    setAnamnesisStep(0);
    const nextContext = anamnesisContext;
    setAnamnesisContext(null);
    runBrandLoaderTransition(() => {
      setTimeEventId(nextContext.eventId);
      setTimeTeamIdx(nextContext.teamIdx);
      setTimeMissionIdx(nextContext.nextMissionIdx);
      setActiveStudentName(nextContext.memberName);
      setScreen("workspace");
    });
    showToast("Obrigado. Sua anamnese foi enviada.");
  }

  function handleSelectMission(index) {
    if (teamEvent && timeTeamIdx !== null) {
      const pendingMissionIdx = getFirstPendingMissionIndex(teamEvent, timeTeamIdx);
      if (pendingMissionIdx >= 0 && pendingMissionIdx !== index) {
        setTimeMissionIdx(pendingMissionIdx);
        return;
      }
    }
    setTimeMissionIdx(index);
  }

  function saveExecution(eventId, teamIdx, missionId, execData) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const key = `${teamIdx}__${missionId}`;
        const execucoes = { ...(event.execucoes || {}) };
        execucoes[key] = [...(execucoes[key] || []), execData];
        const teams = event.teams.map((item, index) => (index === teamIdx ? { ...item, runs: (item.runs || 0) + 1 } : item));
        return { ...event, execucoes, teams };
      }),
    );
  }

  function saveTrainingExecution(eventId, teamIdx, execData) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const key = `${teamIdx}`;
        const trainingRuns = { ...(event.trainingRuns || {}) };
        trainingRuns[key] = [...(trainingRuns[key] || []), execData];
        const teams = event.teams.map((item, index) => (index === teamIdx ? { ...item, runs: (item.runs || 0) + 1 } : item));
        return { ...event, trainingRuns, teams };
      }),
    );
  }

  function updateExecutionAnalysis(eventId, teamIdx, missionId, execId, technicalAnalysis, technicalAnalysisUsage) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const isTraining = !missionId;
        const glossaryMissionId = getAnalysisMissionId(missionId, { isTraining });
        const currentGlossary = getMissionGlossary(event, teamIdx, glossaryMissionId, { isTraining });
        const normalizedAnalysis = normalizeTechnicalAnalysis(technicalAnalysis, {
          accumulatedGlossary: currentGlossary,
        });
        const missionGlossaries = {
          ...(event.missionGlossaries || {}),
          [getMissionGlossaryKey(teamIdx, glossaryMissionId)]: normalizedAnalysis.glossary.accumulated,
        };
        if (missionId) {
          const key = `${teamIdx}__${missionId}`;
          const execucoes = { ...(event.execucoes || {}) };
          execucoes[key] = (execucoes[key] || []).map((exec) =>
            exec.id !== execId
              ? exec
              : {
                  ...exec,
                  explicacao: getTechnicalAnalysisLeadText(normalizedAnalysis) || exec.explicacao,
                  reasoningSummary: getTechnicalAnalysisReasoningSummary(normalizedAnalysis) || exec.reasoningSummary,
                  reasoningDetails: normalizedAnalysis,
                  technicalAnalysis: normalizedAnalysis,
                  technicalAnalysisUsage,
                },
          );
          return { ...event, execucoes, missionGlossaries };
        }

        const key = `${teamIdx}`;
        const trainingRuns = { ...(event.trainingRuns || {}) };
        trainingRuns[key] = (trainingRuns[key] || []).map((exec) =>
          exec.id !== execId
            ? exec
            : {
                ...exec,
                explicacao: getTechnicalAnalysisLeadText(normalizedAnalysis) || exec.explicacao,
                reasoningSummary: getTechnicalAnalysisReasoningSummary(normalizedAnalysis) || exec.reasoningSummary,
                reasoningDetails: normalizedAnalysis,
                technicalAnalysis: normalizedAnalysis,
                technicalAnalysisUsage,
              },
        );
        return { ...event, trainingRuns, missionGlossaries };
      }),
    );

    const normalizedAnalysis = normalizeTechnicalAnalysis(technicalAnalysis, {
      accumulatedGlossary: missionFlow.exec?.technicalAnalysis?.glossary?.accumulated || [],
    });
    setMissionFlow((current) =>
      current.exec?.id !== execId
        ? current
        : {
            ...current,
            exec: {
              ...current.exec,
              explicacao: getTechnicalAnalysisLeadText(normalizedAnalysis) || current.exec.explicacao,
              reasoningSummary: getTechnicalAnalysisReasoningSummary(normalizedAnalysis) || current.exec.reasoningSummary,
              reasoningDetails: normalizedAnalysis,
              technicalAnalysis: normalizedAnalysis,
              technicalAnalysisUsage,
            },
          },
    );
  }

  function updateExecutionTechnicalFeedback(eventId, teamIdx, missionId, execId, feedback) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const nextFeedback = {
          rating: feedback.rating,
          reason: feedback.reason || "",
          comment: feedback.comment || "",
          submittedAt: new Date().toISOString(),
        };
        if (missionId) {
          const key = `${teamIdx}__${missionId}`;
          const execucoes = { ...(event.execucoes || {}) };
          execucoes[key] = (execucoes[key] || []).map((exec) =>
            exec.id !== execId
              ? exec
              : {
                  ...exec,
                  technicalFeedback: nextFeedback,
                },
          );
          return { ...event, execucoes };
        }

        const key = `${teamIdx}`;
        const trainingRuns = { ...(event.trainingRuns || {}) };
        trainingRuns[key] = (trainingRuns[key] || []).map((exec) =>
          exec.id !== execId
            ? exec
            : {
                ...exec,
                technicalFeedback: nextFeedback,
              },
        );
        return { ...event, trainingRuns };
      }),
    );

    setMissionFlow((current) =>
      current.exec?.id !== execId
        ? current
        : {
            ...current,
            exec: {
              ...current.exec,
              technicalFeedback: {
                rating: feedback.rating,
                reason: feedback.reason || "",
                comment: feedback.comment || "",
                submittedAt: new Date().toISOString(),
              },
            },
          },
    );
  }

  function saveReflection(eventId, teamIdx, missionId, missionName, respostas, comment) {
    updateCriticalEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const key = `${teamIdx}__${missionId}`;
        const submittedAt = new Date().toISOString();
        const questionariosPendentes = { ...(event.questionariosPendentes || {}) };
        const pendingSource =
          typeof questionariosPendentes[key] === "object" && questionariosPendentes[key]
            ? questionariosPendentes[key].source
            : "team";
        delete questionariosPendentes[key];
        return {
          ...event,
          reflexoes: {
            ...(event.reflexoes || {}),
            [key]: {
              key,
              teamIdx,
              missionId,
              missionName,
              respostas,
              comment: comment || "",
              submittedAt,
              ts: submittedAt,
            },
          },
          questionariosPendentes,
          conclusoes: {
            ...(event.conclusoes || {}),
            [key]: {
              closedAt: submittedAt,
              updatedAt: submittedAt,
              source: pendingSource === "team" ? "team" : "facilitator",
            },
          },
        };
      }),
    );
  }

  function openMissionQuestionnaireForTeams(eventId, missionId, teamIndexes, source = "facilitator") {
    if (!teamIndexes.length) return;
    updateCriticalEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const pendingMap = { ...(event.questionariosPendentes || {}) };
        teamIndexes.forEach((teamIdx) => {
          const key = `${teamIdx}__${missionId}`;
          if (!getConclusaoEntry(event, teamIdx, missionId)) {
            const openedAt = new Date().toISOString();
            pendingMap[key] = {
              openedAt,
              updatedAt: openedAt,
              source,
            };
          }
        });
        return {
          ...event,
          questionariosPendentes: pendingMap,
        };
      }),
    );
  }

  function handleTeamCloseMission() {
    if (!teamEvent || timeTeamIdx === null || !currentMission || isTrainingEvent) return;
    openMissionQuestionnaireForTeams(teamEvent.id, currentMission.id, [timeTeamIdx], "team");
    setReflectionAnswers({});
    setReflectionComment("");
    setReflectionError("");
    setMissionFlow((current) => ({ ...current, stage: "questionario_final" }));
    setMissionInput("");
    setMissionAttachments([]);
    showToast("Missão encerrada para este time");
  }

  function handleCancelTeamMissionClosure() {
    if (!teamEvent || timeTeamIdx === null || !currentMission || isTrainingEvent) return;
    if (getQuestionarioPendenteSource(teamEvent, timeTeamIdx, currentMission.id) !== "team") return;
    const key = `${timeTeamIdx}__${currentMission.id}`;
    updateCriticalEvents((current) =>
      current.map((event) => {
        if (event.id !== teamEvent.id) return event;
        const questionariosPendentes = { ...(event.questionariosPendentes || {}) };
        delete questionariosPendentes[key];
        return {
          ...event,
          questionariosPendentes,
        };
      }),
    );
    setReflectionAnswers({});
    setReflectionComment("");
    setReflectionError("");
    setMissionFlow((current) => ({ ...current, stage: current.exec ? current.stage : "idle" }));
    showToast("Encerramento cancelado");
  }

  function handleFacilitatorCloseMission(eventId, missionId) {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    const teamIndexes = event.teams
      .map((_, teamIdx) => teamIdx)
      .filter((teamIdx) => getMissionClosureStatus(event, teamIdx, missionId) === "aberta");
    if (!teamIndexes.length) {
      showToast("Todos os times desta missão já foram encerrados");
      return;
    }
    openMissionQuestionnaireForTeams(eventId, missionId, teamIndexes, "facilitator");
    showToast("Questionário liberado para os times ainda abertos");
  }

  function handleFacilitatorCloseMissionWithoutEvaluation(eventId, missionId) {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    const teamIndexes = event.teams
      .map((_, teamIdx) => teamIdx)
      .filter((teamIdx) => !isConcluida(event, teamIdx, missionId));
    if (!teamIndexes.length) {
      showToast("Todos os times desta missão já foram concluídos");
      return;
    }
    const concludedAt = new Date().toISOString();
    updateCriticalEvents((current) =>
      current.map((item) => {
        if (item.id !== eventId) return item;
        const questionariosPendentes = { ...(item.questionariosPendentes || {}) };
        const conclusoes = { ...(item.conclusoes || {}) };
        teamIndexes.forEach((teamIdx) => {
          const key = `${teamIdx}__${missionId}`;
          delete questionariosPendentes[key];
          conclusoes[key] = {
            closedAt: concludedAt,
            updatedAt: concludedAt,
            source: "facilitator_no_evaluation",
          };
        });
        return {
          ...item,
          questionariosPendentes,
          conclusoes,
        };
      }),
    );
    showToast("Missão encerrada sem avaliação para os times restantes");
  }

  function handleFacilitatorReopenMission(eventId, missionId) {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    const teamIndexes = event.teams
      .map((_, teamIdx) => teamIdx)
      .filter((teamIdx) => canFacilitatorReopenMissionForTeam(event, teamIdx, missionId));
    if (!teamIndexes.length) {
      showToast("Nenhum time elegível para reabertura nesta missão");
      return;
    }
    const resetAt = new Date(getSyncedNowMs()).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((item) => {
      if (item.id !== eventId) return item;
      const questionariosPendentes = { ...(item.questionariosPendentes || {}) };
      const conclusoes = { ...(item.conclusoes || {}) };
      const reflexoes = { ...(item.reflexoes || {}) };
      const missionResets = { ...(item.missionResets || {}) };
      teamIndexes.forEach((teamIdx) => {
        const key = `${teamIdx}__${missionId}`;
        questionariosPendentes[key] = {
          source: "reopened",
          updatedAt: resetAt,
        };
        conclusoes[key] = {
          source: "reopened",
          updatedAt: resetAt,
        };
        delete reflexoes[key];
        missionResets[key] = resetAt;
      });
      return {
        ...item,
        questionariosPendentes,
        conclusoes,
        reflexoes,
        missionResets,
      };
    });
    commitCriticalEventsDirect(nextEvents);
    showToast("Missão reaberta do zero para os times concluídos");
  }

  function handleOpenHelp() {
    if (teamHelpDisabled) {
      showToast("Ajuda desativada para este time");
      return;
    }
    setHelpMessage(currentOpenHelpRequest?.message || "");
    setHelpOpen(true);
  }

  function handleToggleHelpDisabled() {
    if (!teamEvent || timeTeamIdx === null) return;
    const nextDisabled = !teamHelpDisabled;
    const nowIso = new Date().toISOString();

    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== teamEvent.id) return event;

        const baseEvent = {
          ...event,
          helpDisabledMap: {
            ...(event.helpDisabledMap || {}),
            [timeTeamIdx]: {
              disabled: nextDisabled,
              updatedAt: nowIso,
            },
          },
        };

        if (!nextDisabled) return baseEvent;

        const cancelRequest = (request) =>
          request.teamIdx === timeTeamIdx && request.status === "open"
            ? {
                ...request,
                status: "cancelled",
                cancelledAt: nowIso,
                updatedAt: nowIso,
              }
            : request;

        return {
          ...baseEvent,
          helpRequests: (baseEvent.helpRequests || []).map(cancelRequest),
          trainingHelpRequests: (baseEvent.trainingHelpRequests || []).map(cancelRequest),
        };
      }),
    );

    if (nextDisabled) {
      setHelpOpen(false);
      setHelpMessage("");
      showToast(currentOpenHelpRequest ? "Ajuda desativada e pedido cancelado" : "Ajuda desativada para este time");
      return;
    }

    showToast("Ajuda reativada para este time");
  }

  function handleOpenBroadcastModal() {
    if (!selectedEvent) return;
    setBroadcastMessage("");
    setBroadcastOpen(true);
  }

  function handleStartSessionTimer() {
    if (!selectedEvent) return;
    const durationMs = parseTimerInputToMs(timerMinutesInput);
    if (!durationMs) {
      showToast("Defina um tempo válido em MM:SS");
      return;
    }
    const nowMs = getSyncedNowMs();
    const startedAt = new Date(nowMs).toISOString();
    const endsAt = new Date(nowMs + durationMs).toISOString();
    const timerUpdatedAt = new Date(nowMs).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== selectedEvent.id
        ? event
        : {
            ...event,
            sessionTimer: {
              active: true,
              startedAt,
              endsAt,
              durationMs,
              updatedAt: timerUpdatedAt,
            },
            sessionTimerNotice: {
              id: `timer_notice_${Date.now()}`,
              message: `Cronômetro iniciado com ${formatCountdown(durationMs)}.`,
              createdAt: new Date(nowMs).toISOString(),
              dismissedAt: null,
            },
          },
    );
    commitCriticalEventsDirect(nextEvents);
    showToast("Cronômetro iniciado");
  }

  function handleAddSessionTimer(extraMinutes = null) {
    if (!selectedEvent) return;
    const extraDurationMs = extraMinutes !== null ? Math.round(extraMinutes * 60 * 1000) : parseTimerInputToMs(timerMinutesInput);
    if (!extraDurationMs) {
      showToast("Defina um tempo válido para acrescentar");
      return;
    }
    const currentTimer = getSessionTimer(selectedEvent);
    const now = getSyncedNowMs();
    const currentEndsAt = currentTimer.endsAt ? new Date(currentTimer.endsAt).getTime() : now;
    const baseTime = Math.max(now, currentEndsAt);
    const nextEndsAt = new Date(baseTime + extraDurationMs).toISOString();
    const timerUpdatedAt = new Date(now).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== selectedEvent.id
        ? event
        : {
            ...event,
            sessionTimer: {
              active: true,
              startedAt: currentTimer.startedAt || new Date(now).toISOString(),
              endsAt: nextEndsAt,
              durationMs: Math.max(0, currentTimer.durationMs || 0) + extraDurationMs,
              updatedAt: timerUpdatedAt,
            },
            sessionTimerNotice: {
              id: `timer_notice_${Date.now()}`,
              message: `Tempo acrescentado: +${formatCountdown(extraDurationMs)}.`,
              createdAt: new Date(now).toISOString(),
              dismissedAt: null,
            },
          },
    );
    commitCriticalEventsDirect(nextEvents);
    showToast(`+${formatCountdown(extraDurationMs)} adicionados`);
  }

  function handleClearSessionTimer() {
    if (!selectedEvent) return;
    const timerUpdatedAt = new Date(getSyncedNowMs()).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== selectedEvent.id
        ? event
        : {
            ...event,
            sessionTimer: {
              active: false,
              startedAt: null,
              endsAt: null,
              durationMs: 0,
              updatedAt: timerUpdatedAt,
            },
            sessionTimerNotice: null,
          },
    );
    commitCriticalEventsDirect(nextEvents);
    showToast("Cronômetro encerrado");
  }

  function handleDismissSessionTimerNotice() {
    if (!selectedEvent) return;
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== selectedEvent.id
        ? event
        : {
            ...event,
            sessionTimerNotice: event.sessionTimerNotice
              ? {
                  ...event.sessionTimerNotice,
                  dismissedAt: new Date(getSyncedNowMs()).toISOString(),
                }
              : null,
          },
    );
    commitCriticalEventsDirect(nextEvents);
  }

  function handleSaveMissionTokenPolicy(missionId, nextPolicyInput) {
    if (!selectedEvent || !missionId) return;
    handleUpdateMissionTokenPolicy(selectedEvent.id, missionId, nextPolicyInput);
    showToast("Política de tokens atualizada");
  }

  function handleToggleMissionTemporaryUnlimited(missionId, nextValue) {
    if (!selectedEvent || !missionId) return;
    handleUpdateMissionTokenPolicy(selectedEvent.id, missionId, { temporaryUnlimited: nextValue });
    showToast(nextValue ? "Missão temporariamente ilimitada" : "Missão voltou ao limite configurado");
  }

  function handleSaveBroadcastMessage() {
    if (!selectedEvent) return;
    const message = broadcastMessage.trim();
    if (!message) return;
    const nowIso = new Date(getSyncedNowMs()).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== selectedEvent.id
        ? event
        : {
            ...event,
            announcements: [
              ...getEventAnnouncements(event),
              {
                id: `announcement_${Date.now()}`,
                message,
                createdAt: nowIso,
                updatedAt: nowIso,
                dismissedBy: {},
                readBy: {},
              },
            ],
            announcement: null,
          },
    );
    commitCriticalEventsDirect(nextEvents);
    setBroadcastOpen(false);
    showToast("Mensagem enviada para a turma");
  }

  function handleClearBroadcastMessage() {
    if (!selectedEvent) return;
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== selectedEvent.id
        ? event
        : {
            ...event,
            announcements: [],
            announcement: null,
          },
    );
    commitCriticalEventsDirect(nextEvents);
    setBroadcastOpen(false);
    setBroadcastMessage("");
    setTeamAnnouncementOpen(false);
    showToast("Mensagem da turma removida");
  }

  function handleDismissTeamAnnouncement() {
    if (!teamEvent || timeTeamIdx === null || !latestUnreadAnnouncement) {
      setTeamAnnouncementOpen(false);
      return;
    }
    const nowIso = new Date(getSyncedNowMs()).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== teamEvent.id
        ? event
        : {
            ...event,
            announcements: getEventAnnouncements(event).map((announcement) =>
              announcement.id !== latestUnreadAnnouncement.id
                ? announcement
                : {
                    ...announcement,
                    updatedAt: nowIso,
                    dismissedBy: {
                      ...(announcement.dismissedBy || {}),
                      [timeTeamIdx]: nowIso,
                    },
                    readBy: {
                      ...(announcement.readBy || {}),
                      [timeTeamIdx]: nowIso,
                    },
                  },
            ),
            announcement: null,
          },
    );
    commitCriticalEventsDirect(nextEvents);
    setTeamAnnouncementOpen(false);
  }

  function handleOpenTeamAnnouncementInbox() {
    if (!teamEvent || timeTeamIdx === null) {
      setTeamAnnouncementInboxOpen(true);
      return;
    }
    const nowIso = new Date(getSyncedNowMs()).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== teamEvent.id
        ? event
        : {
            ...event,
            announcements: getEventAnnouncements(event).map((announcement) => ({
              ...announcement,
              updatedAt: nowIso,
              readBy: {
                ...(announcement.readBy || {}),
                [timeTeamIdx]: nowIso,
              },
            })),
            announcement: null,
          },
    );
    commitCriticalEventsDirect(nextEvents);
    setTeamAnnouncementOpen(false);
    setTeamAnnouncementInboxOpen(true);
  }

  function handleSendHelpRequest() {
    if (!teamEvent || timeTeamIdx === null || !currentMission) return;
    if (teamHelpDisabled) {
      showToast("Ajuda desativada para este time");
      return;
    }
    const message = helpMessage.trim();
    if (!message) return;
    if (currentOpenHelpRequest) return;
    const nowIso = new Date(getSyncedNowMs()).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== teamEvent.id
        ? event
        : {
            ...event,
            ...(isTrainingEvent
              ? {
                  trainingHelpRequests: [
                    ...(event.trainingHelpRequests || []),
                    {
                      id: `help_${Date.now()}`,
                      teamIdx: timeTeamIdx,
                      message,
                      status: "open",
                      createdAt: nowIso,
                      updatedAt: nowIso,
                    },
                  ],
                }
              : {
                  helpRequests: [
                    ...(event.helpRequests || []),
                    {
                      id: `help_${Date.now()}`,
                      teamIdx: timeTeamIdx,
                      missionId: currentMission.id,
                      message,
                      status: "open",
                      createdAt: nowIso,
                      updatedAt: nowIso,
                    },
                  ],
                }),
          },
    );
    commitCriticalEventsDirect(nextEvents);

    setHelpOpen(false);
    setHelpMessage("");
    showToast("Pedido de ajuda enviado ao facilitador");
  }

  function handleCancelHelpRequest(eventId, requestId) {
    const nowIso = new Date(getSyncedNowMs()).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== eventId
        ? event
        : {
            ...event,
            ...(isTrainingEvent && !(event.helpRequests || []).some((request) => request.id === requestId)
              ? {
                  trainingHelpRequests: (event.trainingHelpRequests || []).map((request) =>
                    request.id !== requestId
                      ? request
                      : {
                          ...request,
                          status: "cancelled",
                          cancelledAt: nowIso,
                          updatedAt: nowIso,
                        },
                  ),
                }
              : {
                  helpRequests: (event.helpRequests || []).map((request) =>
                    request.id !== requestId
                      ? request
                      : {
                          ...request,
                          status: "cancelled",
                          cancelledAt: nowIso,
                          updatedAt: nowIso,
                        },
                  ),
                }),
          },
    );
    commitCriticalEventsDirect(nextEvents);
    setHelpOpen(false);
    setHelpMessage("");
    showToast("Pedido de ajuda cancelado");
  }

  function handleResolveHelpRequest(eventId, requestId) {
    const nowIso = new Date(getSyncedNowMs()).toISOString();
    const nextEvents = (currentEventsRef.current || []).map((event) =>
      event.id !== eventId
        ? event
        : {
            ...event,
            ...(getEventMode(event) === TRAINING_MODE_EVENT && !(event.helpRequests || []).some((request) => request.id === requestId)
              ? {
                  trainingHelpRequests: (event.trainingHelpRequests || []).map((request) =>
                    request.id !== requestId
                      ? request
                      : {
                          ...request,
                          status: "resolved",
                          resolvedAt: nowIso,
                          updatedAt: nowIso,
                        },
                  ),
                }
              : {
                  helpRequests: (event.helpRequests || []).map((request) =>
                    request.id !== requestId
                      ? request
                      : {
                          ...request,
                          status: "resolved",
                          resolvedAt: nowIso,
                          updatedAt: nowIso,
                        },
                  ),
                }),
          },
    );
    commitCriticalEventsDirect(nextEvents);
    showToast("Pedido marcado como resolvido");
  }

  function handlePublishScreenShare(eventId, nextState) {
    const previousEvents = currentEventsRef.current || [];
    const nextEvents = previousEvents.map((event) =>
      event.id !== eventId
        ? event
        : { ...event, screenShare: { ...getScreenShareState(event), ...nextState } },
    );
    const stampedEvents = stampUpdatedEvents(previousEvents, nextEvents);
    currentEventsRef.current = stampedEvents;
    lastRemoteEventsRef.current = JSON.stringify(stampedEvents);
    setStore((current) => ({ ...current, events: stampedEvents }));

    // Save directly without fetch-merge cycle — only facilitator writes screenShare
    if (serverConfig.sharedStateConfigured) {
      saveRemoteState(stampedEvents)
        .then((saveResult) => {
          syncServerClock(saveResult.serverNowMs);
        })
        .catch((error) => {
          console.error("Failed to save screen share state:", error);
        });
    }
  }

  function handleResetMissionFromZero() {
    if (!teamEvent || timeTeamIdx === null || !currentMission) return;
    const key = getMissionUsageKey(timeTeamIdx, currentMission.id);
    const resetAt = new Date(getSyncedNowMs()).toISOString();

    const removedTotals = currentExecs.reduce(
      (acc, exec) => ({
        total: acc.total + (exec.tokens || 0),
        input: acc.input + (exec.inputTokens || 0),
        output: acc.output + (exec.outputTokens || 0),
        cost: acc.cost + (exec.custo || 0),
        explanationTotal: acc.explanationTotal + (exec.technicalAnalysisUsage?.totalTokens || 0),
        explanationInput: acc.explanationInput + (exec.technicalAnalysisUsage?.inputTokens || 0),
        explanationOutput: acc.explanationOutput + (exec.technicalAnalysisUsage?.outputTokens || 0),
        explanationCost: acc.explanationCost + (exec.technicalAnalysisUsage?.cost || 0),
      }),
      { total: 0, input: 0, output: 0, cost: 0, explanationTotal: 0, explanationInput: 0, explanationOutput: 0, explanationCost: 0 },
    );

    updateCriticalEvents((current) =>
      current.map((event) => {
        if (event.id !== teamEvent.id) return event;
        const preservedMissionUsage = { ...(event.preservedMissionUsage || {}) };
        const currentPreserved = preservedMissionUsage[key] || {
          total: 0, input: 0, output: 0, cost: 0,
          explanationTotal: 0, explanationInput: 0, explanationOutput: 0, explanationCost: 0,
        };
        preservedMissionUsage[key] = {
          total: currentPreserved.total + removedTotals.total,
          input: currentPreserved.input + removedTotals.input,
          output: currentPreserved.output + removedTotals.output,
          cost: currentPreserved.cost + removedTotals.cost,
          explanationTotal: currentPreserved.explanationTotal + removedTotals.explanationTotal,
          explanationInput: currentPreserved.explanationInput + removedTotals.explanationInput,
          explanationOutput: currentPreserved.explanationOutput + removedTotals.explanationOutput,
          explanationCost: currentPreserved.explanationCost + removedTotals.explanationCost,
        };
        return {
          ...event,
          missionResets: { ...(event.missionResets || {}), [key]: resetAt },
          preservedMissionUsage,
        };
      }),
    );

    setMissionInput("");
    setRunError("");
    setRunState(null);
    setMissionFlow({ stage: "idle", exec: null });
    showToast("Missão reaberta do zero");
  }

  function handleResetTrainingConversation() {
    if (!teamEvent || timeTeamIdx === null) return;

    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== teamEvent.id) return event;
        const trainingRuns = { ...(event.trainingRuns || {}) };
        delete trainingRuns[`${timeTeamIdx}`];
        return {
          ...event,
          trainingRuns,
          trainingHelpRequests: (event.trainingHelpRequests || []).filter((request) => request.teamIdx !== timeTeamIdx),
        };
      }),
    );

    setMissionInput("");
    setRunError("");
    setRunState(null);
    setMissionFlow({ stage: "idle", exec: null });
    showToast("Conversa do time reiniciada");
  }

  async function executeMissionRun({
    input,
    attachments,
    planningModeOverride = store.planningMode,
  }) {
    if (!teamEvent || timeTeamIdx === null || !currentMission) return;
    const acao = FREE_ACTION_KEY;
    const historyContext = buildHistoryContext(currentExecs);
    const aiMode = getMissionAiMode(currentMission);
    const selectedModel = selectedModelForMode;
    const wasPlanningOn = planningModeOverride === "on";
    const shouldStreamCoding = apiConfigured && aiMode === CODING_AI_MODE;
    const shouldAutoOpenPreview = shouldStreamCoding && !wasPlanningOn && isHtmlPrototypeRequest(input);
    const previousCodingResponseId =
      aiMode === CODING_AI_MODE
        ? currentExecs[currentExecs.length - 1]?.codingResponseId || ""
        : "";
    if (!input && !attachments.length) {
      setRunError("Escreva um input ou anexe pelo menos um arquivo.");
      return;
    }

    setActivePrompt(input);
    setActiveAttachments(attachments);
    setMissionInput("");
    setMissionAttachments([]);

    setRunning(true);
    setRunError("");
    setMissionFlow({
      stage: "executando",
      exec: {
        id: `pending_${Date.now()}`,
        iterationNumber: currentExecs.length + 1,
        historySignal: buildHistorySignal(historyContext),
        technicalAnalysis: buildTechnicalAnalysisPending({
          historyContext,
        }),
      },
    });
    setRunState({
      phase: "analisando",
      stepIndex: 0,
      displayedOutput: "",
      fullOutput: "",
      reasoningText: "",
      processingSteps: buildRunSteps(apiConfigured),
      reasoningDetails: null,
      usedHistory: historyContext.length > 0,
      simulationMode: apiConfigured ? "openai-live" : "mock-stream",
    });

    const previewWindow =
      shouldAutoOpenPreview && typeof window !== "undefined"
        ? window.open("", "_blank")
        : null;
    if (previewWindow) {
      renderPreviewWindowPlaceholder(previewWindow, "Preview em preparação", "A IA já começou a montar a instância HTML desta rodada.");
    }

    try {
      if (!apiConfigured) {
        for (let index = 0; index < 2; index += 1) {
          setRunState((current) =>
            current
              ? {
                  ...current,
                  phase: SIMULATION_STEPS[index].key,
                  stepIndex: index,
                  processingSteps: current.processingSteps.map((step, stepIndex) => ({
                    ...step,
                    status: stepIndex < index ? "done" : stepIndex === index ? "active" : "pending",
                  })),
                }
              : current,
          );
          await sleep(index === 0 ? 700 : 850);
        }
      } else {
        setRunState((current) =>
          current
            ? {
                ...current,
                phase: "estrategia",
                stepIndex: 1,
                processingSteps: current.processingSteps.map((step, stepIndex) => ({
                  ...step,
                  status: stepIndex < 1 ? "done" : stepIndex === 1 ? "active" : "pending",
                })),
              }
            : current,
        );
      }

      const result = apiConfigured
        ? await executarComIA({
            mission: currentMission,
            input,
            attachments,
            acao,
            model: selectedModel,
            modelPricing: modelPricingMap,
            planningMode: planningModeOverride,
            historyContext,
            previousResponseId: previousCodingResponseId,
            onDelta: apiConfigured
              ? (nextText) => {
                  liveAnswerRef.current?.pushAnswer(nextText);
                }
              : undefined,
            onReasoning: apiConfigured
              ? (nextReasoning) => {
                  liveAnswerRef.current?.pushReasoning(nextReasoning);
                }
              : undefined,
          })
        : executarMock({
            mission: currentMission,
            input,
            acao,
            model: selectedModel,
            modelPricing: modelPricingMap,
            planningMode: planningModeOverride,
            historyContext,
          });

      setRunState((current) =>
        current
          ? {
              ...current,
              phase: "gerando",
              stepIndex: 2,
              fullOutput: result.output,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
              custo: result.custo,
              reasoningDetails: null,
              processingSteps: current.processingSteps.map((step, stepIndex) => ({
                ...step,
                status: stepIndex < 2 ? "done" : stepIndex === 2 ? "active" : "pending",
              })),
            }
          : current,
      );

      if (!apiConfigured) {
        let cursor = 0;
        const chunkSize = 30;
        while (cursor < result.output.length) {
          cursor = Math.min(result.output.length, cursor + chunkSize);
          liveAnswerRef.current?.pushAnswer(result.output.slice(0, cursor));
          await sleep(40);
        }
      }

      setRunState((current) =>
        current
          ? {
              ...current,
              phase: "finalizando",
              stepIndex: 3,
              processingSteps: current.processingSteps.map((step, stepIndex) => ({
                ...step,
                status: stepIndex < 3 ? "done" : stepIndex === 3 ? "active" : "pending",
              })),
            }
          : current,
      );
      if (!apiConfigured) {
        await sleep(350);
      }

      const initialTechnicalAnalysis = apiConfigured
        ? buildTechnicalAnalysisPending({
            historyContext,
          })
        : buildTechnicalAnalysisUnavailable({
            apiConfigured,
            historyContext,
          });
      const iterationNumber = currentExecs.length + 1;
      const generatedArtifacts = aiMode === CODING_AI_MODE
        ? extractGeneratedArtifacts(result.output, `rodada-${iterationNumber}`)
        : [];
      const htmlArtifact = generatedArtifacts.find((artifact) => artifact.previewMode === "html");
      if (previewWindow) {
        if (htmlArtifact) {
          writePreviewWindowDocument(
            previewWindow,
            buildPreviewWindowHtmlDocument(htmlArtifact.content, htmlArtifact.fileName || "Preview HTML"),
          );
        } else {
          renderPreviewWindowPlaceholder(
            previewWindow,
            "Sem preview executável",
            "Esta rodada terminou, mas a IA não devolveu um arquivo HTML completo para abrir automaticamente.",
          );
        }
      }
      const execRecord = {
        id: `run_${Date.now()}`,
        ts: new Date().toISOString(),
        input,
        attachments: sanitizeAttachmentsForStorage(attachments),
        acao,
        actionMode: isFreeInstructionAction(acao) ? "free" : "preset",
        isFreeInstruction: isFreeInstructionAction(acao),
        output: result.output,
        explicacao: getTechnicalAnalysisLeadText(initialTechnicalAnalysis),
        reasoningSummary: getTechnicalAnalysisReasoningSummary(initialTechnicalAnalysis),
        reasoningDetails: initialTechnicalAnalysis,
        technicalAnalysis: initialTechnicalAnalysis,
        technicalAnalysisUsage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: 0,
          model: result.effectiveModel || selectedModel,
        },
        processingSteps: buildRunSteps(apiConfigured).map((step) => ({ ...step, status: "done" })),
        simulationMode: apiConfigured ? "openai-live" : "mock-stream",
        promptApplied: result.promptApplied,
        usedHistory: historyContext.length > 0,
        historySignal: buildHistorySignal(historyContext),
        analysisTarget: "latest_prompt",
        usedHistoryContext: historyContext.length > 0,
        iterationNumber,
        aiMode,
        generatedArtifacts,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        tokens: result.tokens,
        custo: result.custo,
        selectedModel: result.selectedModel || selectedModel,
        effectiveModel: result.effectiveModel || selectedModel,
        codingResponseId: result.responseId || "",
        reasoningText: result.reasoningText || "",
        planningMode: planningModeOverride,
        planningModeReal: Boolean(result.planningModeReal),
        planningResolution: result.planningResolution || "off",
      };

      if (isTrainingEvent) {
        saveTrainingExecution(teamEvent.id, timeTeamIdx, execRecord);
      } else {
        saveExecution(teamEvent.id, timeTeamIdx, currentMission.id, execRecord);
      }
      const nextTokenUsageTotal = (currentTokenBudget?.usage.totalTokens || 0) + (execRecord.tokens || 0);
      if (currentTokenBudget && !currentTokenBudget.unlimited && currentTokenBudget.effectiveLimit !== null && nextTokenUsageTotal >= currentTokenBudget.effectiveLimit) {
        updateEvents((current) =>
          current.map((event) => {
            if (event.id !== teamEvent.id) return event;
            const alreadyLogged = (event.tokenOperationalLogs || []).some(
              (item) =>
                item.type === "limit_reached" &&
                item.missionId === currentTokenBudget.missionId &&
                item.teamIdx === timeTeamIdx &&
                item.referenceExecId === execRecord.id,
            );
            if (alreadyLogged) return event;
            return appendTokenOperationalLog(event, {
              missionId: currentTokenBudget.missionId,
              teamIdx: timeTeamIdx,
              type: "limit_reached",
              referenceExecId: execRecord.id,
              message: "Limite de tokens excedido na missão.",
              detail: `${nextTokenUsageTotal.toLocaleString("pt-BR")} / ${currentTokenBudget.effectiveLimit.toLocaleString("pt-BR")} tokens utilizados.`,
            });
          }),
        );
      }
      setRunState(null);
      setMissionFlow({ stage: "cot_aberto", exec: execRecord });
      showToast(wasPlanningOn ? "Plano concluído" : apiConfigured ? "Execução concluída" : "Execução simulada");

      if (wasPlanningOn) {
        setStore((current) => ({ ...current, planningMode: "off" }));
        setConfigForm((current) => ({ ...current, planningMode: "off" }));
        setPlanningApprovalState({
          open: true,
          input,
          attachments,
          missionName: currentMission.name || "Missão atual",
        });
      }

      if (apiConfigured) {
        void gerarExplicacaoGuiadaIA({
          model: result.effectiveModel || selectedModel,
          modelPricing: modelPricingMap,
          mission: currentMission,
          input,
          attachments,
          acao,
          output: result.output,
          historyContext,
        })
          .then((guidedReasoning) => {
            const finalTechnicalAnalysis =
              guidedReasoning ||
              buildTechnicalAnalysisUnavailable({
                apiConfigured,
                historyContext,
              });
            updateExecutionAnalysis(
              teamEvent.id,
              timeTeamIdx,
              isTrainingEvent ? null : currentMission.id,
              execRecord.id,
              finalTechnicalAnalysis,
              guidedReasoning?.usage || {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                cost: 0,
                model: result.effectiveModel || selectedModel,
              },
            );
          })
          .catch(() => {
            updateExecutionAnalysis(
              teamEvent.id,
              timeTeamIdx,
              isTrainingEvent ? null : currentMission.id,
              execRecord.id,
              buildTechnicalAnalysisUnavailable({
                apiConfigured,
                historyContext,
              }),
              {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                cost: 0,
                model: result.effectiveModel || selectedModel,
              },
            );
          });
      }
    } catch (error) {
      if (previewWindow) {
        renderPreviewWindowPlaceholder(
          previewWindow,
          "Preview interrompido",
          "A rodada falhou antes de devolver um HTML executável. Você pode tentar novamente com um pedido mais específico.",
        );
      }
      const failedModelLabel = getModelLabel(modelCatalog, selectedModel);
      setRunError(`Falha ao executar com ${failedModelLabel}. Verifique a chave, o acesso ao modelo ou a conexão.`);
      setRunState(null);
      setMissionFlow({ stage: "idle", exec: null });
      setMissionInput(input);
      setMissionAttachments(attachments);
      console.error(error);
    } finally {
      setRunning(false);
    }
  }

  async function handleExecutarMissao() {
    if (!teamEvent || timeTeamIdx === null || !currentMission) return;
    if (!isTrainingEvent && currentMissionLocked) {
      setRunError("Esta missão foi bloqueada pelo facilitador.");
      return;
    }
    if (!isTrainingEvent && currentMissionStatus !== "aberta") return;
    if (teamTimerLockActive) {
      setRunError("O cronômetro desta atividade foi encerrado pelo facilitador.");
      return;
    }
    if (currentTokenBudget?.blocked) {
      setTokenLimitModalOpen(true);
      return;
    }
    const input = missionInput.trim();
    const attachments = missionAttachments;
    if (!input && !attachments.length) {
      setRunError("Escreva um input ou anexe pelo menos um arquivo.");
      return;
    }
    await executeMissionRun({
      input,
      attachments,
      planningModeOverride: store.planningMode,
    });
  }

  async function handleApprovePlannedMission() {
    const nextInput = planningApprovalState.input.trim();
    const nextAttachments = planningApprovalState.attachments || [];
    setPlanningApprovalState({ open: false, input: "", attachments: [], missionName: "" });
    if (!nextInput && !nextAttachments.length) return;
    await executeMissionRun({
      input: nextInput,
      attachments: nextAttachments,
      planningModeOverride: "off",
    });
  }

  function handleAdjustPlannedMission() {
    setMissionInput(planningApprovalState.input || "");
    setMissionAttachments(planningApprovalState.attachments || []);
    setPlanningApprovalState({ open: false, input: "", attachments: [], missionName: "" });
    setStore((current) => ({ ...current, planningMode: "on" }));
    setConfigForm((current) => ({ ...current, planningMode: "on" }));
  }

  function handleSaveReflection() {
    if (!teamEvent || timeTeamIdx === null || !currentMission) return;
    const answered = PERGUNTAS_REFLEXAO.every((question) => reflectionAnswers[question.id]);
    if (!answered) {
      setReflectionError("Responda as 3 perguntas para concluir a missão.");
      showToast("Responda as 3 perguntas antes de enviar");
      return;
    }
    setReflectionError("");
    saveReflection(
      teamEvent.id,
      timeTeamIdx,
      currentMission.id,
      currentMission.name,
      reflectionAnswers,
      reflectionComment.trim(),
    );
    setReflectionAnswers({});
    setReflectionComment("");
    setReflectionError("");
    setMissionFlow((current) => ({ ...current, stage: "concluida" }));
    showToast("Reflexão enviada");
  }

  return (
    <>
      <BrandLoaderOverlay open={brandLoaderOpen} />
      {screen === "survival" && (
        <div className={`screen active survival-screen survival-theme-${survivalTheme}`}>
          <Topbar
            onLogoClick={survivalAccessGranted ? goHome : goSurvival}
            right={
              <div className="survival-topbar-actions">
                <span className={`topbar-api-pill${apiConfigured ? " is-connected" : ""}`}>
                  {apiConfigured ? "API ligada" : "API não configurada"}
                </span>
                <button className="btn btn-sm btn-ghost survival-theme-btn" type="button" onClick={handleToggleSurvivalTheme}>
                  {survivalTheme === SURVIVAL_THEME_DARK ? "Modo claro" : "Modo escuro"}
                </button>
                {survivalAccessGranted ? (
                  <button className="btn btn-sm btn-ghost" type="button" onClick={handleLeaveSurvival}>
                    Sair
                  </button>
                ) : null}
              </div>
            }
            leftMeta={<div className="survival-topbar-meta">Modo survival</div>}
          />
          <div className="survival-shell">
            {!survivalAccessGranted ? (
              <div className="survival-gate">
                <div className="survival-gate-panel">
                  <div className="survival-gate-kicker">Contingência ativa</div>
                  <h1>Modo survival</h1>
                  <p>
                    Se o banco, a interface ou o sync falharem, este trilho segue vivo. Tudo fica salvo só neste navegador.
                  </p>
                  <div className="survival-gate-field">
                    <label htmlFor="survival-password">Senha de acesso</label>
                    <input
                      id="survival-password"
                      type="password"
                      value={survivalPasswordInput}
                      onChange={(event) => {
                        setSurvivalAuthError("");
                        setSurvivalPasswordInput(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleUnlockSurvival();
                        }
                      }}
                      placeholder="Digite a senha"
                    />
                  </div>
                  {survivalAuthError ? <div className="error-box">{survivalAuthError}</div> : null}
                  <div className="survival-gate-actions">
                    <button className="btn btn-primary" type="button" onClick={handleUnlockSurvival}>
                      Entrar no survival
                    </button>
                  </div>
                </div>
              </div>
            ) : !survivalSelectedMode ? (
              <div className="survival-intro">
                <div className="survival-intro-copy">
                  <div className="survival-intro-kicker">Sem evento. Sem facilitador. Sem banco.</div>
                  <h1>Escolha sua pílula</h1>
                  <p>
                    A azul abre um chat livre para pensar, refinar e organizar. A vermelha abre o trilho técnico para código,
                    protótipos e debugging.
                  </p>
                </div>
                <div className="survival-pill-grid">
                  <button
                    className="survival-pill-card is-blue"
                    type="button"
                    onClick={() => handleSelectSurvivalMode(CHAT_AI_MODE)}
                  >
                    <span className="survival-pill-orb" aria-hidden="true" />
                    <span className="survival-pill-label">Pílula azul</span>
                    <strong>Chat</strong>
                    <p>Converse, esclareça, sintetize e pense com a IA sem depender da infraestrutura do LAB.</p>
                  </button>
                  <button
                    className="survival-pill-card is-red"
                    type="button"
                    onClick={() => handleSelectSurvivalMode(CODING_AI_MODE)}
                  >
                    <span className="survival-pill-orb" aria-hidden="true" />
                    <span className="survival-pill-label">Pílula vermelha</span>
                    <strong>Codex</strong>
                    <p>Peça código, debug, refatoração e protótipos num trilho local de contingência.</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="survival-workspace">
                <aside className="survival-sidebar">
                  <div className="survival-sidebar-copy">
                    <div className="survival-sidebar-kicker">Matrix fallback</div>
                    <h2>{survivalSelectedMode === CHAT_AI_MODE ? "Pílula azul" : "Pílula vermelha"}</h2>
                  </div>
                  <div className="survival-mode-switch">
                    <button
                      className={`survival-mini-pill is-blue${survivalSelectedMode === CHAT_AI_MODE ? " active" : ""}`}
                      type="button"
                      onClick={() => handleSelectSurvivalMode(CHAT_AI_MODE)}
                      disabled={survivalRunning}
                    >
                      <MessageSquareText size={15} strokeWidth={1.7} />
                      Chat
                    </button>
                    <button
                      className={`survival-mini-pill is-red${survivalSelectedMode === CODING_AI_MODE ? " active" : ""}`}
                      type="button"
                      onClick={() => handleSelectSurvivalMode(CODING_AI_MODE)}
                      disabled={survivalRunning}
                    >
                      <Code2 size={15} strokeWidth={1.7} />
                      Codex
                    </button>
                  </div>
                  <div className="survival-side-meta">
                    <div className="survival-side-meta-row">
                      <span>Persistência</span>
                      <strong>Só neste navegador</strong>
                    </div>
                    <div className="survival-side-meta-row">
                      <span>Registro no evento</span>
                      <strong>Desligado</strong>
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-ghost survival-clear-btn"
                    type="button"
                    onClick={handleClearSurvivalConversation}
                    disabled={survivalRunning}
                  >
                    Limpar conversa local
                  </button>
                  <div className="survival-token-rail">
                    <div className="survival-token-rail-head">
                      <span>Extrato local</span>
                      <strong>{survivalTokenTotal.toLocaleString("pt-BR")} tok</strong>
                    </div>
                    <div className="survival-token-rail-subtitle">Últimas 5 transações</div>
                    {survivalRecentTransactions.length ? (
                      <div className="survival-token-list">
                        {survivalRecentTransactions.map((exec) => (
                          <div className="survival-token-item" key={exec.id}>
                            <img
                              className="survival-token-item-logo"
                              src={techHallFooterIcon}
                              alt=""
                              aria-hidden="true"
                            />
                            <div className="survival-token-item-copy">
                              <strong>
                                {exec.iterationNumber ? `Rodada ${exec.iterationNumber}` : "Rodada survival"}
                              </strong>
                              <span>{formatDateTime(exec.ts)}</span>
                            </div>
                            <div className="survival-token-item-total">
                              <strong>{(exec.tokens || 0).toLocaleString("pt-BR")}</strong>
                              <span>tok</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="survival-token-empty">Sem consumo ainda.</div>
                    )}
                  </div>
                </aside>
                <main className="survival-main">
                  <div className="workspace-col-label is-block survival-column-label">
                    <span className="ws-column-label-icon" aria-hidden="true">
                      {survivalSelectedMode === CHAT_AI_MODE ? (
                        <MessageSquareText size={15} strokeWidth={1.7} />
                      ) : (
                        <Code2 size={15} strokeWidth={1.7} />
                      )}
                    </span>
                    <div className="workspace-col-label-copy workspace-col-label-copy-inline">
                      <span className="workspace-col-label-title">
                        {survivalSelectedMode === CHAT_AI_MODE ? "SURVIVAL CHAT" : "SURVIVAL CODEX"}
                      </span>
                      <span className="workspace-col-label-sub workspace-col-label-sub-inline">
                        LOCAL ONLY · SEM EVENTO · SEM SYNC
                      </span>
                    </div>
                  </div>
                  <div className="survival-chat-body">
                    <div className="input-card input-card-chat survival-input-card">
                      <div className="prompt-composer">
                        <PromptConversation
                          execs={survivalExecs}
                          pendingPrompt={survivalPendingPrompt}
                          pendingAttachments={survivalPendingAttachments}
                          runState={survivalRunning ? survivalRunState : null}
                          liveAnswerRef={survivalLiveAnswerRef}
                          onCopyResponse={handleCopyResponse}
                        />
                        <div className="prompt-entry-shell">
                          {survivalAttachments.length ? (
                            <div className="composer-attachments">
                              {survivalAttachments.map((attachment) => (
                                <div className={`composer-attachment-chip is-${attachment.kind}`} key={attachment.id}>
                                  <div className="composer-attachment-copy">
                                    <span>{attachment.name}</span>
                                    <small>
                                      {attachment.kind === "document"
                                        ? attachment.extractedText
                                          ? `${attachment.sizeLabel} · texto extraído`
                                          : attachment.extractionFailed
                                            ? `${attachment.sizeLabel} · leitura indisponível`
                                            : attachment.sizeLabel
                                        : attachment.sizeLabel}
                                    </small>
                                  </div>
                                  <button
                                    className="composer-attachment-remove"
                                    type="button"
                                    aria-label={`Remover ${attachment.name}`}
                                    onClick={() => handleRemoveSurvivalAttachment(attachment.id)}
                                    disabled={survivalRunning}
                                  >
                                    <X size={14} strokeWidth={1.8} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <textarea
                            value={survivalDraft}
                            onChange={(event) => {
                              setSurvivalError("");
                              handleChangeSurvivalDraft(event.target.value);
                            }}
                            disabled={survivalRunning}
                            placeholder={getSurvivalMission(survivalSelectedMode).placeholder}
                          />
                          <input
                            ref={survivalFileInputRef}
                            type="file"
                            accept={ATTACHMENT_ACCEPT}
                            multiple
                            className="visually-hidden-file-input"
                            onChange={handleAttachSurvivalFiles}
                          />
                          <div className="input-actions input-compose-bar">
                            <div className="input-compose-meta">
                              <button
                                className="input-attach-btn"
                                type="button"
                                onClick={() => survivalFileInputRef.current?.click()}
                                disabled={survivalRunning || survivalAttachments.length >= MAX_ATTACHMENT_COUNT}
                                title={`Anexar arquivo (${MAX_ATTACHMENT_COUNT} por rodada, até 10 MB cada)`}
                              >
                                <Paperclip size={14} strokeWidth={1.8} />
                                <span>Anexar</span>
                              </button>
                              <div className="input-compact-control">
                                <button
                                  type="button"
                                  className={`plan-toggle-btn${survivalPlanningMode === "on" ? " is-on" : ""}`}
                                  aria-label="Planejar"
                                  aria-pressed={survivalPlanningMode === "on"}
                                  onClick={handleToggleSurvivalPlanningMode}
                                  disabled={survivalRunning}
                                >
                                  Planejar
                                </button>
                              </div>
                              <div className="input-compact-control input-compact-control-model">
                                <ModelSelect
                                  ariaLabel="Modelo survival"
                                  options={survivalModeOptions}
                                  value={survivalSelectedModel}
                                  onChange={handleChangeSurvivalModel}
                                  disabled={survivalRunning}
                                  dropUp
                                />
                              </div>
                            </div>
                            <button
                              className="input-send-btn"
                              aria-label={survivalRunning ? "Executando no modo survival" : "Executar no modo survival"}
                              disabled={survivalRunning}
                              onClick={handleExecutarSurvival}
                            >
                              <span className="input-send-btn-icon">{survivalRunning ? "…" : "↑"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      {survivalError ? <div className="error-box top-gap-sm">{survivalError}</div> : null}
                    </div>
                  </div>
                </main>
              </div>
            )}
          </div>
        </div>
      )}
      {screen === "home" && (
        <div className="screen active">
          <Topbar
            onLogoClick={goHome}
            right={
              <>
                {devQuickSwitch}
              </>
            }
          />
          <div className="center-wrap">
            <div className="center-box home-box">
              <div className="brand-kicker hero-kicker">Tech Hall AI Lab</div>
              <div className="hero-grid">
                <button className="card hero-card" onClick={goFacilitador}>
                  <div className="hero-card-icon" aria-hidden="true">
                    <Waypoints strokeWidth={1.6} />
                  </div>
                  <div className="hero-card-title">Facilitador</div>
                  <div className="hero-card-text">Criar eventos, organizar times e liberar missões.</div>
                </button>
                <button className="card hero-card" onClick={goEntradaTime}>
                  <div className="hero-card-icon" aria-hidden="true">
                    <Users strokeWidth={1.6} />
                  </div>
                  <div className="hero-card-title">Participante</div>
                  <div className="hero-card-text">Entrar num evento, escolher o time e executar missões.</div>
                </button>
              </div>
            </div>
          </div>
          <AppFooter />
        </div>
      )}

      {screen === "facilitador" && (
        <div className="screen active facilitator-screen">
          <Topbar
            onLogoClick={goHome}
            right={
              <>
                {devQuickSwitch}
                <div className="topbar-status-strip">
                  <span className={`topbar-api-pill${apiConfigured ? " is-connected" : ""}`}>
                    {apiConfigured ? "API ligada" : "API não configurada"}
                  </span>
                  {selectedEvent && getOpenHelpRequests(selectedEvent).length > 0 ? (
                    <span className="topbar-help-pill">{getOpenHelpRequests(selectedEvent).length} ajuda(s)</span>
                  ) : null}
                  {selectedEventTimerRunning ? (
                    <span className="topbar-live-pill">
                      <Clock3 size={12} strokeWidth={1.8} aria-hidden="true" />
                      {formatCountdown(selectedEventTimerRemainingMs)}
                    </span>
                  ) : null}
                  {selectedEventScreenShare?.active ? <span className="topbar-live-pill">tela ao vivo</span> : null}
                </div>
                <div className="topbar-actions-main">
                  <FacilitatorScreenShareButton
                    event={selectedEvent}
                    screenShare={selectedEventScreenShare}
                    onPublishState={(nextState) => {
                      if (!selectedEvent) return;
                      handlePublishScreenShare(selectedEvent.id, nextState);
                    }}
                    iconOnly
                  />
                  <button
                    className="btn btn-sm topbar-tools-btn"
                    onClick={() => {
                      setFacilitatorToolView(FACILITATOR_TOOL_VIEWS.MENU);
                      setFacilitatorToolsOpen(true);
                    }}
                  >
                    <SlidersHorizontal size={14} strokeWidth={1.7} aria-hidden="true" />
                    Ferramentas do facilitador
                  </button>
                </div>
              </>
            }
          />

          <div className="fac-layout">
            <aside className="sidebar">
              <div className="sidebar-label section-title-with-icon sidebar-label-with-icon">
                <span className="section-title-icon" aria-hidden="true">
                  <CalendarDays size={16} strokeWidth={1.6} />
                </span>
                <span>Eventos</span>
              </div>
              {!events.length && <div className="empty-list-text">Nenhum evento ainda.</div>}
              {events.map((event) => {
                const isSelected = facSelectedId === event.id;
                const isCollapsed = isSelected && event.status !== "open";
                return (
                <div className={`event-item-card${isSelected ? " active" : ""}${isCollapsed ? " is-collapsed" : ""}`} key={event.id}>
                  {isSelected ? (
                    <div className="event-item-status-toggle-row">
                      <div className="event-item-top-actions">
                        <button
                          className={`event-status-toggle${event.status === "open" ? " is-on" : ""}`}
                          aria-label={event.status === "open" ? "Desligar evento" : "Ligar evento"}
                          title={event.status === "open" ? "Desligar evento" : "Ligar evento"}
                          onClick={() => handleSetStatus(event.id, event.status === "open" ? "closed" : "open")}
                        >
                          <span className="event-status-toggle-track">
                            <span className="event-status-toggle-thumb" />
                          </span>
                        </button>
                        {event.status === "open" ? (
                          <button
                            className="icon-copy-btn team-remove-icon event-delete-btn"
                            aria-label={`Excluir evento ${event.name}`}
                            title="Excluir evento"
                            onClick={() =>
                              openDeleteConfirm({
                                eventId: event.id,
                                title: "Ocultar evento",
                                body: "Escolha se você quer apenas ocultar este evento da lista ativa ou ocultar e salvar um histórico local antes disso. Para liberar as opções, digite a senha do facilitador.",
                                onConfirm: () => handleDeleteEvent(event.id),
                                onArchive: () => archiveEventSnapshot(event.id),
                                passwordMode: "facilitator",
                                confirmActionLabel: "Ocultar evento",
                                secondaryActionLabel: "Ocultar e salvar histórico",
                                facilitatorHint: "Digite a mesma senha do facilitador para ocultar este evento da lista ativa.",
                              })
                            }
                          >
                            Ocultar evento
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <button
                    className={`event-item${isSelected ? " active" : ""}`}
                    onClick={() => {
                      setFacSelectedId(event.id);
                      setFacTab("dashboard");
                    }}
                  >
                    <div className="event-item-name">
                      {event.status === "open" ? <span className="live-dot" /> : null}
                      {event.name}
                    </div>
                    {event.desc ? <div className="event-item-desc">{event.desc}</div> : null}
                  </button>
                  {isSelected && event.status === "open" ? (
                    <div className="event-item-details">
                      <div className="event-item-detail-block">
                        <EventCardSectionLabel icon="mode">Modo do evento</EventCardSectionLabel>
                        <div className="inline-choice-row event-mode-row">
                          <button
                            className={`choice-pill${getEventMode(event) === MISSIONS_MODE_EVENT ? " active" : ""}`}
                            onClick={() => handleSetEventMode(event.id, MISSIONS_MODE_EVENT)}
                          >
                            Missões
                          </button>
                          <button
                            className={`choice-pill${getEventMode(event) === TRAINING_MODE_EVENT ? " active" : ""}`}
                            onClick={() => handleSetEventMode(event.id, TRAINING_MODE_EVENT)}
                          >
                            Treino
                          </button>
                        </div>
                      </div>
                      <div className="event-item-detail-block">
                        <EventCardSectionLabel icon="summary">Anamnese da turma</EventCardSectionLabel>
                        <div className="inline-choice-row event-mode-row">
                          <button
                            className={`choice-pill${!isAnamnesisEnabled(event) ? " active" : ""}`}
                            onClick={() => handleSetAnamnesisEnabled(event.id, false)}
                          >
                            Desligada
                          </button>
                          <button
                            className={`choice-pill${isAnamnesisEnabled(event) ? " active" : ""}`}
                            onClick={() => handleSetAnamnesisEnabled(event.id, true)}
                          >
                            Ligada
                          </button>
                        </div>
                      </div>
                      <div className="event-item-management-actions">
                        <div className="event-item-management-head">
                          <EventCardSectionLabel icon="teams">Incluir pessoas no LAB</EventCardSectionLabel>
                        </div>
                        <div className="event-item-management-grid">
                          <div className="event-item-management-option">
                            <button className="btn btn-sm event-management-btn" onClick={() => setAddTeamOpen(true)}>
                              Por lote
                            </button>
                          </div>
                          <div className="event-item-management-option">
                            <button className="btn btn-sm event-management-btn is-secondary" onClick={() => setAddTeamOpen("manual")}>
                              Individual
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )})}
              <button className="btn btn-add-full" onClick={() => setNewEventOpen(true)}>
                + Novo evento
              </button>
            </aside>

            <main className="fac-content">
              {!selectedEvent ? (
                <EmptyState icon="⬡" title="Nenhum evento selecionado" sub="Crie ou selecione um evento." />
              ) : (
                <>
                  <div className="tabs">
                    {facilitatorTabs.map((tab) => (
                      <button
                        key={tab}
                        className={`tab${facTab === tab ? " active" : ""}`}
                        onClick={() => setFacTab(tab)}
                      >
                        <FacilitatorTabLabel tab={tab} />
                      </button>
                    ))}
                  </div>

                  {facTab === "dashboard" && (
                    <DashboardPanel
                      evento={selectedEvent}
                      dashboardView={dashboardView}
                      setDashboardView={setDashboardView}
                      openConfirm={openConfirm}
                      openDeleteConfirm={openDeleteConfirm}
                      handleFacilitatorCloseMission={handleFacilitatorCloseMission}
                      handleFacilitatorCloseMissionWithoutEvaluation={handleFacilitatorCloseMissionWithoutEvaluation}
                      handleFacilitatorReopenMission={handleFacilitatorReopenMission}
                      handleGrantTokens={handleGrantTokens}
                      handleRemoveTeam={handleRemoveTeam}
                      handleResolveHelpRequest={handleResolveHelpRequest}
                    />
                  )}


                  {facTab === "missoes" && (
                    <MissionsPanel
                      evento={selectedEvent}
                      eventMode={selectedEventMode}
                      missionTogglePending={missionTogglePending}
                      missionFeedbackOpen={missionFeedbackOpen}
                      missionTeamRowsOpen={missionTeamRowsOpen}
                      missionMenuOpen={missionMenuOpen}
                      setMissionFeedbackOpen={setMissionFeedbackOpen}
                      setMissionTeamRowsOpen={setMissionTeamRowsOpen}
                      setMissionMenuOpen={setMissionMenuOpen}
                      openConfirm={openConfirm}
                      handleToggleMission={handleToggleMission}
                      handleMissionAiModeChange={handleMissionAiModeChange}
                      handleFacilitatorCloseMission={handleFacilitatorCloseMission}
                      handleFacilitatorReopenMission={handleFacilitatorReopenMission}
                      handleFacilitatorCloseMissionWithoutEvaluation={handleFacilitatorCloseMissionWithoutEvaluation}
                    />
                  )}

                  {facTab === "prompts" && <PromptInsightsPanel evento={selectedEvent} />}

                  {facTab === "anamnese" && <AnamnesisInsightsPanel evento={selectedEvent} />}

                </>
              )}
            </main>
          </div>
          <AppFooter compact />
        </div>
      )}

      {screen === "entry" && (
        <div className="screen active selection-screen">
          <Topbar
            onLogoClick={goHome}
            right={
              <>
                {devQuickSwitch}
                <button className="btn btn-ghost btn-sm" onClick={goHome}>Início</button>
              </>
            }
          />
          <div className="center-wrap">
            <div className="center-box entry-selection-box">
              <div className="center-box-title">Escolha seu evento</div>
              <div className="center-box-sub">Selecione o laboratório em que você vai entrar.</div>
              <div className="entry-event-grid">
                {!openEventsForTeamEntry.length ? (
                  <div className="card entry-empty-card">Nenhum evento aberto no momento.</div>
                ) : (
                  openEventsForTeamEntry.map((event) => (
                    <button className="card entry-event-card" key={event.id} onClick={() => handleSelectEntryEvent(event.id)}>
                      <div className="entry-event-card-icon" aria-hidden="true">
                        <CalendarDays strokeWidth={1.6} />
                      </div>
                      <div className="entry-event-card-body">
                        <div className="entry-event-card-title">{event.name}</div>
                        {event.desc ? <div className="entry-event-card-sub">{event.desc}</div> : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
          <AppFooter />
        </div>
      )}

      {screen === "team" && teamEvent && (
        <div className="screen active selection-screen">
          <Topbar
            onLogoClick={goHome}
            right={
              <>
                {devQuickSwitch}
                {teamEventAnnouncements.length ? (
                  <button className="btn btn-sm topbar-participant-action" onClick={handleOpenTeamAnnouncementInbox}>
                    <MessageSquareText size={14} strokeWidth={1.7} aria-hidden="true" />
                    Mensagens
                    <span className="help-trigger-badge">{teamEventAnnouncements.length}</span>
                  </button>
                ) : null}
                <span className="topbar-caption">{teamEvent.name}</span>
                <button className="btn btn-ghost btn-sm" onClick={goEntradaTime}>
                  Trocar evento
                </button>
              </>
            }
          />
          <div className="center-wrap">
            <div className="center-box entry-selection-box">
              <div className="center-box-title">Escolha seu nome</div>
              <div className="entry-selected-event">{teamEvent.name}</div>
              <div className="student-card-grid">
                {!teamStudentOptions.length ? (
                  <div className="card entry-empty-card">Nenhum aluno cadastrado ainda.</div>
                ) : (
                  teamStudentOptions.map((student) => (
                    <button className="student-entry-card" key={student.id} onClick={() => handleEscolherAluno(student.teamIdx)}>
                      <div className="student-entry-icon" aria-hidden="true">
                        <Monitor strokeWidth={1.6} />
                      </div>
                      <div className="student-entry-name">{student.name}</div>
                      {student.showTeamName ? <div className="student-entry-team">{student.teamName}</div> : null}
                    </button>
                  ))
                )}
              </div>
              <div className="entry-back-row">
                <button className="btn btn-ghost btn-sm" onClick={goEntradaTime}>
                  Trocar evento
                </button>
              </div>
            </div>
          </div>
          <AppFooter />
        </div>
      )}

      {screen === "workspace" && teamEvent && team && (
        <div className="screen active workspace-screen">
          <Topbar
            onLogoClick={goHome}
            leftMeta={
              <div className="topbar-context-strip">
                <span className="topbar-context-item">
                  <CalendarDays size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span className="topbar-context-value">{teamEvent.name}</span>
                </span>
                <span className="topbar-context-item">
                  <Users size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span className="topbar-context-value">{team.name}</span>
                </span>
              </div>
            }
            right={
              <>
                {teamEventAnnouncements.length ? (
                  <button className="btn btn-sm topbar-participant-action" onClick={handleOpenTeamAnnouncementInbox}>
                    <MessageSquareText size={14} strokeWidth={1.7} aria-hidden="true" />
                    Mensagens
                    {teamUnreadAnnouncementCount ? <span className="help-trigger-badge">{teamUnreadAnnouncementCount}</span> : null}
                  </button>
                ) : null}
                {!teamScreenShareVisible ? (
                  <button className="btn btn-sm topbar-participant-action" onClick={() => setTokenDrawerOpen(true)}>
                    <FileText size={14} strokeWidth={1.7} aria-hidden="true" />
                    Extrato de tokens
                  </button>
                ) : null}
                {(currentMission || isTrainingEvent) && !teamScreenShareVisible ? (
                  <>
                    <button
                      className={`btn btn-sm topbar-participant-action${teamHelpDisabled ? " is-disabled" : ""}`}
                      onClick={handleOpenHelp}
                      disabled={teamHelpDisabled}
                    >
                      <LifeBuoy size={14} strokeWidth={1.7} aria-hidden="true" />
                      {currentOpenHelpRequest ? "Ajuda enviada" : "Pedir ajuda"}
                      {currentOpenHelpCount ? <span className="help-trigger-badge">{currentOpenHelpCount}</span> : null}
                    </button>
                    <button
                      className={`btn btn-sm topbar-participant-action topbar-token-request-btn${teamHelpDisabled ? " is-disabled" : ""}`}
                      onClick={handleSendTokenRequest}
                      disabled={teamHelpDisabled || !currentMission || !currentTokenBudget?.blocked || Boolean(currentOpenTokenRequest)}
                      title={!currentTokenBudget?.blocked ? "Disponível quando o limite da missão for atingido" : undefined}
                    >
                      <Coins size={14} strokeWidth={1.7} aria-hidden="true" />
                      {currentOpenTokenRequest ? "Tokens solicitados" : "Solicitar tokens"}
                    </button>
                  </>
                ) : null}
                {!teamScreenShareVisible ? (
                  <button className="btn btn-sm topbar-participant-action topbar-student-area-btn" onClick={() => setMaterialsDrawerOpen(true)}>
                    <Users size={14} strokeWidth={1.7} aria-hidden="true" />
                    Área do aluno
                  </button>
                ) : null}
              </>
            }
          />
          {devQuickSwitch ? <div className="dev-toolbar-shell">{devQuickSwitch}</div> : null}
          {!apiConfigured && <div className="demo-banner">Modo demonstração - sem chave OpenAI. Respostas são simuladas.</div>}
          {teamScreenShareVisible ? (
            <div className="live-share-banner">
              Compartilhamento de tela ao vivo. O facilitador está projetando a própria tela.
            </div>
          ) : null}
          {teamEventTimerNotice ? (
            <div className="team-timer-notice-banner">
              <span className="team-timer-notice-kicker">Atualização do cronômetro</span>
              <span className="team-timer-notice-text">{teamEventTimerNotice.message}</span>
            </div>
          ) : null}
          <div className={`workspace${teamScreenShareVisible ? " workspace-live-focus" : ""}`}>
            {!teamScreenShareVisible ? (
              <aside className="ws-sidebar">
                <div className="ws-sidebar-label workspace-col-label is-block">
                  <span className="ws-column-label-icon" aria-hidden="true">
                    {isTrainingEvent ? <Sparkles size={15} strokeWidth={1.7} /> : <ListChecks size={15} strokeWidth={1.7} />}
                  </span>
                  <div className="workspace-col-label-copy">
                    <span className="workspace-col-label-title">{isTrainingEvent ? "Modo treino" : "Missões"}</span>
                    <span className="workspace-col-label-sub workspace-col-label-sub-empty" aria-hidden="true">.</span>
                  </div>
                </div>
                {isTrainingEvent ? (
                  <div className="training-sidebar-panel">
                    <div className="mission-item-brief-meta">
                      <span>Modo: livre</span>
                      <span>Tipo: laboratório</span>
                    </div>
                    <div className="mission-item-brief-block">
                      <strong className="mini-label mission-brief-label">
                        <CircleAlert size={15} strokeWidth={1.6} aria-hidden="true" />
                        <span>Situação</span>
                      </strong>
                      <p>{TRAINING_MISSION.situacao}</p>
                    </div>
                    <div className="mission-item-brief-block">
                      <strong className="mini-label mission-brief-label">
                        <WandSparkles size={15} strokeWidth={1.6} aria-hidden="true" />
                        <span>O que fazer</span>
                      </strong>
                      <p>{TRAINING_MISSION.instrucao}</p>
                    </div>
                    {hasMissionHistory ? (
                      <button
                        className="mission-reset-btn"
                        onClick={() =>
                          openConfirm(
                            "Reiniciar conversa do time",
                            "Isso apaga o histórico livre, os pedidos de ajuda do treino e reinicia a conversa deste time do zero. Deseja continuar?",
                            handleResetTrainingConversation,
                          )
                        }
                      >
                        Reiniciar conversa do time
                      </button>
                    ) : null}
                  </div>
                ) : !teamEvent.missions.length ? (
                  <div className="empty-list-text">Nenhuma missão disponível.</div>
                ) : (
                  <div className="ws-mission-list">
                    {teamEvent.missions.map((mission, index) => {
                      const locked = !mission.unlocked;
                      const missionStatus = getMissionClosureStatus(teamEvent, timeTeamIdx, mission.id);
                      const concluida = missionStatus === "concluida";
                      const aguardandoQuestionario = missionStatus === "aguardando_questionario";
                      const execs = getExecucoes(teamEvent, timeTeamIdx, mission.id);
                      const meta = concluida
                        ? "feito"
                        : aguardandoQuestionario
                          ? "questionário"
                          : locked
                            ? "bloqueada"
                            : execs.length
                              ? "em andamento"
                              : "liberada";
                      const isCurrentMission = timeMissionIdx === index;
                      const canResetMission = isCurrentMission && hasMissionHistory;
                      return (
                        <div className="mission-item-wrap" key={`${mission.id}-${index}`}>
                          <button
                            className={`mission-item${isCurrentMission ? " active" : ""}${locked ? " locked" : ""}${concluida ? " done" : ""}`}
                            disabled={locked}
                            onClick={() => handleSelectMission(index)}
                            title={locked ? "Bloqueada pelo facilitador" : ""}
                          >
                            <div className="mission-item-head">
                              <div className="mission-item-name">
                                {mission.num ? `${mission.num}. ` : ""}
                                {mission.name}
                              </div>
                              <span
                                className={`mission-item-status-dot${locked ? " is-locked" : concluida ? " is-done" : aguardandoQuestionario ? " is-open" : " is-open"}`}
                                aria-label={meta}
                                title={meta}
                              />
                            </div>
                          </button>
                          {isCurrentMission ? (
                            <div className="mission-item-brief">
                              <div className="mission-item-brief-meta">
                                <span>IA: {AI_MODE_LABELS[getMissionAiMode(mission)]}</span>
                              </div>
                              <div className="mission-item-brief-block">
                                <strong className="mini-label mission-brief-label">
                                  <CircleAlert size={15} strokeWidth={1.6} aria-hidden="true" />
                                  <span>Situação</span>
                                </strong>
                                <p>{mission.situacao || mission.desc}</p>
                              </div>
                              <div className="mission-item-brief-block">
                                <strong className="mini-label mission-brief-label">
                                  <WandSparkles size={15} strokeWidth={1.6} aria-hidden="true" />
                                  <span>O que fazer</span>
                                </strong>
                                <p>{mission.instrucao || "Escreva o input abaixo e escolha a ação."}</p>
                              </div>
                            </div>
                          ) : null}
                          {canResetMission ? (
                            <button
                              className="mission-reset-btn"
                              onClick={() =>
                                openConfirm(
                                  "Reabrir missão do zero",
                                  "Isso vai apagar respostas, explicações, histórico, questionário e status de concluída desta missão para o time atual. Os tokens consumidos permanecerão no acumulado histórico. Deseja continuar?",
                                  handleResetMissionFromZero,
                                )
                              }
                            >
                              Reabrir missão do zero
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </aside>
            ) : null}

            <main className={`ws-content${teamScreenShareVisible ? " ws-content-live" : ""}`}>
              {teamScreenShareVisible ? (
                <TeamScreenShareViewer
                  event={teamEvent}
                  screenShare={teamEventScreenShare}
                  team={team}
                  onDismiss={() => setDismissedScreenShareSession(teamScreenShareSessionId)}
                />
              ) : !currentMission ? (
                <EmptyState
                  icon="◎"
                  title="Nenhuma missão disponível"
                  sub="Aguarde o facilitador liberar uma missão para continuar."
                />
              ) : (
                <>
                  {!isTrainingEvent && !currentConcluida && !currentQuestionarioPendente ? (
                    <div className="workspace-mission-top-actions">
                      <button
                        className="mission-close-btn is-compact"
                        type="button"
                        onClick={() =>
                          openConfirm(
                            "Encerrar missão",
                            "Ao encerrar, este time para de conversar nesta missão e entra direto no questionário final. Deseja continuar?",
                            handleTeamCloseMission,
                            { confirmTone: "primary" },
                          )
                        }
                        disabled={running}
                      >
                        Encerrar missão
                      </button>
                    </div>
                  ) : null}
                  <div className="workspace-col-label is-block">
                    <span className="ws-column-label-icon" aria-hidden="true">
                      <MessageSquareText size={15} strokeWidth={1.7} />
                    </span>
                    <div className="workspace-col-label-copy workspace-col-label-copy-inline">
                      <span className="workspace-col-label-title">TECH HALL GPT</span>
                      <span className="workspace-col-label-sub workspace-col-label-sub-inline">
                        {apiConfigured ? "CONNECTED TO OPENAI API" : "DEMO MODE"}
                      </span>
                    </div>
                  </div>
                  <div className="workspace-chat-body">
                    {(!currentConcluida && !currentQuestionarioPendente) ? (
                      <div className="input-card input-card-chat">
                        <div className="prompt-composer">
                          <PromptConversation
                            execs={currentExecs}
                            pendingPrompt={activePrompt}
                            pendingAttachments={activeAttachments}
                            runState={running ? runState : null}
                            liveAnswerRef={liveAnswerRef}
                            onCopyResponse={handleCopyResponse}
                            planningApproval={planningApprovalState}
                            onApprovePlanning={() => void handleApprovePlannedMission()}
                            onAdjustPlanning={handleAdjustPlannedMission}
                          />
                          <div className="prompt-entry-shell">
                            {missionAttachments.length ? (
                              <div className="composer-attachments">
                                {missionAttachments.map((attachment) => (
                                  <div className={`composer-attachment-chip is-${attachment.kind}`} key={attachment.id}>
                                    <div className="composer-attachment-copy">
                                      <span>{attachment.name}</span>
                                      <small>
                                        {attachment.kind === "document"
                                          ? attachment.extractedText
                                            ? `${attachment.sizeLabel} · texto extraído`
                                            : attachment.extractionFailed
                                              ? `${attachment.sizeLabel} · leitura indisponível`
                                              : attachment.sizeLabel
                                          : attachment.sizeLabel}
                                      </small>
                                    </div>
                                    <button
                                      className="composer-attachment-remove"
                                      type="button"
                                      aria-label={`Remover ${attachment.name}`}
                                      onClick={() => handleRemoveAttachment(attachment.id)}
                                      disabled={running}
                                    >
                                      <X size={14} strokeWidth={1.8} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            <textarea
                              value={missionInput}
                              onChange={(event) => setMissionInput(event.target.value)}
                              disabled={running || teamTimerLockActive || planningApprovalState.open}
                              placeholder={planningApprovalState.open ? "Aceite ou reformule o plano acima" : "Escreva sua mensagem ou anexe até 3 arquivos"}
                            />
                            <input
                              ref={composerFileInputRef}
                              type="file"
                              accept={ATTACHMENT_ACCEPT}
                              multiple
                              className="visually-hidden-file-input"
                              onChange={handleAttachFiles}
                            />
                            <div className="input-actions input-compose-bar">
                              <div className="input-compose-meta">
                                <button
                                  className="input-attach-btn"
                                  type="button"
                                  onClick={() => composerFileInputRef.current?.click()}
                                  disabled={running || missionAttachments.length >= MAX_ATTACHMENT_COUNT}
                                  title={`Anexar arquivo (${MAX_ATTACHMENT_COUNT} por rodada, até 10 MB cada)`}
                                >
                                  <Paperclip size={14} strokeWidth={1.8} />
                                  <span>Anexar</span>
                                </button>
                                <div className="input-compact-control">
                                  <button
                                    id="mission-planning-toggle"
                                    type="button"
                                    className={`plan-toggle-btn${store.planningMode === "on" ? " is-on" : ""}`}
                                    aria-label="Planejar"
                                    aria-pressed={store.planningMode === "on"}
                                    onClick={() => handleQuickPlanningModeChange(store.planningMode === "on" ? "off" : "on")}
                                    disabled={running || planningApprovalState.open}
                                  >
                                    Planejar
                                  </button>
                                </div>
                                <div className="input-compact-control input-compact-control-model">
                                  <ModelSelect
                                    ariaLabel="Modelo"
                                    options={composerModelOptions}
                                    value={selectedModelForMode}
                                    onChange={handleQuickModelChange}
                                    disabled={running}
                                    dropUp
                                  />
                                </div>
                              </div>
                                <button
                                  className="input-send-btn"
                                  aria-label={running ? "Executando com IA" : "Executar com IA"}
                                  disabled={running || teamTimerLockActive || planningApprovalState.open}
                                  onClick={handleExecutarMissao}
                                  title={planningApprovalState.open ? "Aceite ou reformule o plano acima" : teamTimerLockActive ? "Tempo encerrado pelo facilitador" : running ? "Executando com IA" : "Executar com IA"}
                                >
                                  <span className="input-send-btn-icon">{running ? "…" : "↑"}</span>
                                </button>
                            </div>
                          </div>
                        </div>
                        {runError ? <div className="error-box top-gap-sm">{runError}</div> : null}
                      </div>
                    ) : null}

                    {!isTrainingEvent && currentQuestionarioPendente ? (
                      <div className="done-inline-banner is-pending-survey">
                        {currentQuestionarioPendenteSource === "team"
                          ? "Missão encerrada para este time."
                          : "Missão encerrada pelo facilitador para este time."}
                        <span className="done-sub">Preencha o questionário final para concluir esta missão.</span>
                      </div>
                    ) : null}

                    {!isTrainingEvent ? (
                      <>
                        <MissionClosurePanel
                          stage={missionFlow.stage}
                          reflectionAnswers={reflectionAnswers}
                          reflectionComment={reflectionComment}
                          reflectionError={reflectionError}
                          canClose={currentQuestionarioPendenteSource === "team"}
                          onClose={handleCancelTeamMissionClosure}
                          onSelectAnswer={(questionId, score) =>
                            {
                              setReflectionError("");
                              setReflectionAnswers((current) => ({ ...current, [questionId]: score }));
                            }
                          }
                          onChangeComment={(value) => {
                            setReflectionError("");
                            setReflectionComment(value);
                          }}
                          onSubmitReflection={handleSaveReflection}
                        />

                        {currentConcluida ? (
                          <div className="workspace-finish-state">
                            <div className="done-inline-banner">
                              {currentConclusaoSource === "team"
                                ? "Missão concluída pelo seu time."
                                : "Missão encerrada pelo facilitador para este time."}
                              <span className="done-sub">Aguarde a próxima missão ser liberada pelo facilitador.</span>
                            </div>
                            {currentReflexao ? <ReflectionSummary reflexao={currentReflexao} /> : null}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </main>

            {!teamScreenShareVisible ? (
              <aside className="workspace-explain-shell">
                <div className="workspace-col-label is-block">
                  <span className="ws-column-label-icon" aria-hidden="true">
                    <BookOpen size={15} strokeWidth={1.7} />
                  </span>
                  <div className="workspace-col-label-copy">
                    <span className="workspace-col-label-title">Explicação técnica</span>
                    <span className="workspace-col-label-sub workspace-col-label-sub-empty" aria-hidden="true">.</span>
                  </div>
                </div>
                <div className="workspace-explain-body">
                  {readingStage && readingExec ? (
                    <MissionReadingPanel
                      exec={readingExec}
                      onSubmitFeedback={(feedback) => {
                        if (!teamEvent || timeTeamIdx === null || timeTeamIdx === undefined || !readingExec?.id) return;
                        updateExecutionTechnicalFeedback(
                          teamEvent.id,
                          timeTeamIdx,
                          isTrainingEvent ? null : currentMission?.id,
                          readingExec.id,
                          feedback,
                        );
                      }}
                    />
                  ) : (
                    <div className="reading-placeholder workspace-reading-placeholder">
                      <div className="reading-placeholder-title">Explicação técnica</div>
                      <div className="reading-placeholder-text">
                        Depois de executar uma rodada, a leitura técnica aparece aqui automaticamente com mecanismo, critérios e limites da resposta.
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            ) : null}
          </div>
          {teamTimerLockActive ? (
            <div className="team-timer-lock-overlay">
              <div className="team-timer-lock-card">
                <div className="team-timer-lock-kicker">Tempo encerrado</div>
                <div className="team-timer-lock-title">A atividade foi pausada pelo cronômetro.</div>
                <div className="team-timer-lock-text">
                  A sala será liberada automaticamente em alguns segundos, a menos que o facilitador acrescente mais tempo antes.
                </div>
              </div>
            </div>
          ) : null}
          {teamEventTimerRunning && !teamScreenShareVisible ? (
            <div className={`team-timer-widget${teamTimerExpired ? " is-expired" : ""}`}>
              <span className="team-timer-widget-icon" aria-hidden="true">
                <Clock3 size={18} strokeWidth={1.8} />
              </span>
              <span className="team-timer-widget-label">Cronômetro</span>
              <span className="team-timer-widget-value">{formatCountdown(teamEventTimerRemainingMs)}</span>
            </div>
          ) : null}
          <AppFooter compact />
        </div>
      )}

      {screen === "workspace" && tokenDrawerOpen ? (
        <div className="side-sheet-backdrop" onClick={() => setTokenDrawerOpen(false)}>
          <aside className="side-sheet side-sheet-right" onClick={(event) => event.stopPropagation()}>
            <div className="side-sheet-header">
              <div>
                <div className="side-sheet-kicker">Extrato</div>
                <div className="side-sheet-title">Uso de tokens</div>
              </div>
              <button
                className="side-sheet-close"
                aria-label="Fechar extrato de tokens"
                onClick={() => setTokenDrawerOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="side-sheet-body">
              <MissionTokenRail
                execs={currentExecs}
                runState={runState}
                flowStage={missionFlow.stage}
                model={getModelLabel(modelCatalog, selectedModelForMode)}
                preservedUsage={preservedUsage}
                tokenBudget={currentTokenBudget}
                operationalLogs={currentMissionOperationalLogs}
              />
            </div>
          </aside>
        </div>
      ) : null}

      {screen === "workspace" && materialsDrawerOpen ? (
        <div className="side-sheet-backdrop" onClick={() => setMaterialsDrawerOpen(false)}>
          <aside className="side-sheet side-sheet-right" onClick={(event) => event.stopPropagation()}>
            <div className="side-sheet-header">
              <div>
                <div className="side-sheet-kicker">Participante</div>
                <div className="side-sheet-title">Área do aluno</div>
              </div>
              <button
                className="side-sheet-close"
                aria-label="Fechar materiais"
                onClick={() => setMaterialsDrawerOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="side-sheet-body materials-sheet-body">
              {STUDENT_RESOURCE_SECTIONS.map((section) => (
                <section className="materials-section" key={section.id}>
                  <div className="materials-section-title">
                    <span className="materials-section-title-icon" aria-hidden="true">
                      {section.id === "materials" ? <FolderOpen size={18} strokeWidth={1.45} /> : <Newspaper size={18} strokeWidth={1.45} />}
                    </span>
                    <span>{section.title}</span>
                  </div>
                  <div className="materials-group-list">
                    {section.groups.map((group) => (
                      <div className="materials-group-card" key={group.id}>
                        <div className="materials-group-head">
                          {section.id !== "materials" && group.title ? <div className="materials-group-title">{group.title}</div> : null}
                          {group.description ? <div className="materials-group-description">{group.description}</div> : null}
                        </div>
                        <div className="materials-link-list">
                          {group.items.map((item) =>
                            item.href ? (
                              <button
                                type="button"
                                key={item.id}
                                className={`materials-link-card materials-link-card-${section.id}`}
                                onClick={() => handleOpenStudentResource(item, section.title)}
                              >
                                <div className="materials-link-copy">
                                  <strong>{item.title}</strong>
                                  {item.description ? <span>{item.description}</span> : null}
                                </div>
                              </button>
                            ) : (
                              <div key={item.id} className={`materials-link-card materials-link-card-${section.id} is-disabled`}>
                                <div className="materials-link-copy">
                                  <strong>{item.title}</strong>
                                  {item.description ? <span>{item.description}</span> : null}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      <Modal
        open={Boolean(studentResourcePreview)}
        onClose={() => setStudentResourcePreview(null)}
        className="student-resource-preview-modal"
      >
        {studentResourcePreview ? (
          <div className="student-resource-preview-shell">
            <div className="student-resource-preview-header">
              <div className="student-resource-preview-kicker">{studentResourcePreview.sectionTitle}</div>
              <div className="student-resource-preview-title">{studentResourcePreview.title}</div>
              {studentResourcePreview.description ? (
                <div className="student-resource-preview-description">{studentResourcePreview.description}</div>
              ) : null}
            </div>
            <div className="student-resource-preview-frame-wrap">
              <iframe
                className="student-resource-preview-frame"
                src={studentResourcePreview.previewHref}
                title={studentResourcePreview.title}
              />
            </div>
            <div className="student-resource-preview-note">
              Se o conteúdo não abrir bem aqui, você pode continuar em outra aba.
            </div>
            <div className="student-resource-preview-actions">
              <button type="button" className="btn secondary" onClick={() => setStudentResourcePreview(null)}>
                Fechar
              </button>
              <button type="button" className="btn primary" onClick={handleOpenStudentResourceInNewTab}>
                Abrir em outra aba
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {screen === "facilitador" && facilitatorToolsOpen ? (
        <FacilitatorToolsDrawer
          event={selectedEvent}
          activeView={facilitatorToolView}
          apiConfigured={apiConfigured}
          announcement={selectedEventLatestAnnouncement}
          announcementCount={selectedEventAnnouncements.length}
          timer={selectedEventTimer}
          timerRunning={selectedEventTimerRunning}
          timerRemainingMs={selectedEventTimerRemainingMs}
          timerNotice={selectedEventTimerNotice}
          timerMinutesInput={timerMinutesInput}
          onChangeTimerMinutes={setTimerMinutesInput}
          onChangeView={setFacilitatorToolView}
          onClose={() => {
            setFacilitatorToolsOpen(false);
            setFacilitatorToolView(FACILITATOR_TOOL_VIEWS.MENU);
          }}
          onOpenConfig={() => {
            setFacilitatorToolsOpen(false);
            setFacilitatorToolView(FACILITATOR_TOOL_VIEWS.MENU);
            setConfigForm({
              apiKey: "",
              chatModel: store.chatModel || getDefaultModelForMode(serverConfig, CHAT_AI_MODE),
              codingModel: store.codingModel || getDefaultModelForMode(serverConfig, CODING_AI_MODE),
              planningMode: store.planningMode,
            });
            setConfigOpen(true);
          }}
          onOpenBroadcast={() => {
            setFacilitatorToolsOpen(false);
            setFacilitatorToolView(FACILITATOR_TOOL_VIEWS.MENU);
            handleOpenBroadcastModal();
          }}
          onStartTimer={handleStartSessionTimer}
          onAddTimer={handleAddSessionTimer}
          onClearTimer={handleClearSessionTimer}
          onDismissTimerNotice={handleDismissSessionTimerNotice}
          onPublishScreenShare={(nextState) => {
            if (!selectedEvent) return;
            handlePublishScreenShare(selectedEvent.id, nextState);
          }}
          screenShare={selectedEventScreenShare}
          tokenGrantTargetMissionId={tokenGrantTargetMissionId}
          onChangeTokenGrantTargetMissionId={setTokenGrantTargetMissionId}
          tokenPolicyCustomInput={tokenPolicyCustomInput}
          onChangeTokenPolicyCustomInput={setTokenPolicyCustomInput}
          onSaveMissionTokenPolicy={handleSaveMissionTokenPolicy}
        />
      ) : null}

      <Modal open={tokenLimitModalOpen} onClose={() => setTokenLimitModalOpen(false)} small className="token-limit-modal">
        <div className="modal-title">Limite de tokens atingido</div>
        <div className="modal-sub">
          Você usou todo o limite disponível para esta missão.
        </div>
        <div className="modal-sub">
          Para continuar, solicite mais tokens ao facilitador.
        </div>
        <div className="modal-actions">
          <button className="btn" type="button" onClick={() => setTokenLimitModalOpen(false)}>
            Fechar
          </button>
          <button
            className="btn btn-primary topbar-token-request-btn"
            type="button"
            onClick={() => {
              setTokenLimitModalOpen(false);
              handleSendTokenRequest();
            }}
            disabled={Boolean(currentOpenTokenRequest)}
          >
            <Coins size={14} strokeWidth={1.7} aria-hidden="true" />
            {currentOpenTokenRequest ? "Solicitação enviada" : "Solicitar tokens"}
          </button>
        </div>
      </Modal>

      <Modal
        open={anamnesisOpen}
        onClose={handleCloseAnamnesisModal}
        dismissible
        className="anamnesis-modal-shell"
      >
        <div className="anamnesis-modal-header">
          <div className="anamnesis-modal-kicker">Check-in da turma</div>
          <div className="modal-title">Antes de começar</div>
          <div className="modal-sub">
            {anamnesisContext?.memberName ? `${anamnesisContext.memberName},` : "Antes de entrar,"} responda esta anamnese. Ela ajuda o facilitador a conhecer o perfil agregado da turma.
          </div>
          <div className="anamnesis-progress-row">
            <div className="anamnesis-progress-track" aria-hidden="true">
              <div className="anamnesis-progress-fill" style={{ width: `${(answeredAnamnesisCount / ANAMNESIS_QUESTIONS.length) * 100}%` }} />
            </div>
            <div className="anamnesis-progress-label">
              Pergunta {Math.min(anamnesisStep + 1, ANAMNESIS_QUESTIONS.length)}/{ANAMNESIS_QUESTIONS.length}
            </div>
          </div>
          {anamnesisTargetEvent?.name ? <div className="anamnesis-context-line">{anamnesisTargetEvent.name}</div> : null}
        </div>

        <div className="anamnesis-modal-body">
          {currentAnamnesisQuestion ? (
            <section className="anamnesis-form-question-card">
              <div className="anamnesis-form-question-label">
                <span className="anamnesis-form-question-number">{currentAnamnesisQuestion.number}.</span>
                <div className="anamnesis-form-question-copy">
                  <span className="anamnesis-form-question-prompt">{currentAnamnesisQuestion.prompt}</span>
                  {currentAnamnesisQuestion.optionalText ? <span className="anamnesis-question-optional-tag">Complemento opcional</span> : null}
                </div>
              </div>

              {currentAnamnesisQuestion.type === "text" ? (
                <textarea
                  className="anamnesis-textarea"
                  rows={currentAnamnesisQuestion.id === "q9" ? 2 : 3}
                  value={currentAnamnesisNoteValue}
                  placeholder={currentAnamnesisQuestion.placeholder || ""}
                  onChange={(event) => handleChangeAnamnesisText(currentAnamnesisQuestion.id, event.target.value)}
                />
              ) : currentAnamnesisQuestion.type === "scale" ? (
                <>
                  <div className="scale-pills anamnesis-scale-pills">
                    {currentAnamnesisQuestion.options.map((option, optionIdx) => (
                      <button
                        key={`${currentAnamnesisQuestion.id}-${optionIdx}`}
                        type="button"
                        className={`scale-pill${currentAnamnesisChoiceValue === optionIdx ? " sel" : ""}`}
                        onClick={() => handleToggleAnamnesisOption(currentAnamnesisQuestion, optionIdx)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={`anamnesis-unknown-btn${currentAnamnesisChoiceValue === ANAMNESIS_UNKNOWN_VALUE ? " is-selected" : ""}`}
                    onClick={() => handleToggleAnamnesisOption(currentAnamnesisQuestion, ANAMNESIS_UNKNOWN_VALUE)}
                  >
                    Não sei responder
                  </button>
                </>
              ) : (
                <>
                  <div className="opts anamnesis-opts">
                    {currentAnamnesisQuestion.options.map((option, optionIdx) => {
                      const selected = currentAnamnesisQuestion.type === "multi"
                        ? Array.isArray(currentAnamnesisChoiceValue) && currentAnamnesisChoiceValue.includes(optionIdx)
                        : currentAnamnesisChoiceValue === optionIdx;
                      return (
                        <button
                          key={`${currentAnamnesisQuestion.id}-${optionIdx}`}
                          type="button"
                          className={`opt${currentAnamnesisQuestion.type === "multi" ? " opt-sq" : ""}${selected ? " sel" : ""}`}
                          onClick={() => handleToggleAnamnesisOption(currentAnamnesisQuestion, optionIdx)}
                        >
                          <span className="opt-mark" aria-hidden="true">
                            <span className="opt-mark-inner" />
                          </span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className={`anamnesis-unknown-btn${isAnamnesisUnknownChoice(currentAnamnesisChoiceValue) ? " is-selected" : ""}`}
                    onClick={() => handleToggleAnamnesisOption(currentAnamnesisQuestion, ANAMNESIS_UNKNOWN_VALUE)}
                  >
                    Não sei responder
                  </button>
                  {currentAnamnesisQuestion.optionalText ? (
                    <div className="anamnesis-optional-shell">
                      <div className="anamnesis-optional-label">Campo opcional</div>
                      <textarea
                        className="anamnesis-textarea anamnesis-textarea-optional"
                        rows={currentAnamnesisQuestion.id === "q9" ? 2 : 3}
                        value={currentAnamnesisNoteValue}
                        placeholder={currentAnamnesisQuestion.placeholder || ""}
                        onChange={(event) => handleChangeAnamnesisText(currentAnamnesisQuestion.id, event.target.value)}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </section>
          ) : null}
        </div>

        {anamnesisError ? <div className="error-box top-gap-sm">{anamnesisError}</div> : null}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={handleCloseAnamnesisModal}>
            Voltar
          </button>
          <div className="anamnesis-step-actions">
            {anamnesisStep > 0 ? (
              <button type="button" className="btn" onClick={handleReturnAnamnesisStep}>
                Anterior
              </button>
            ) : null}
            {anamnesisStep < ANAMNESIS_QUESTIONS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={handleAdvanceAnamnesisStep}>
                Próxima
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleSubmitAnamnesis} disabled={!isCurrentAnamnesisAnswered}>
                Enviar anamnese
              </button>
            )}
          </div>
        </div>
      </Modal>

      <Modal open={newEventOpen} onClose={() => setNewEventOpen(false)}>
            <div className="modal-title">Criar novo evento</div>
        <div className="form-group">
          <label className="form-label">Nome *</label>
          <input
            type="text"
            value={newEventForm.name}
            onChange={(event) => setNewEventForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ex: Turma A - Maio 2026"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Descrição</label>
          <input
            type="text"
            value={newEventForm.desc}
            onChange={(event) => setNewEventForm((current) => ({ ...current, desc: event.target.value }))}
            placeholder="Ex: Aula de IA generativa"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Como montar os times</label>
          <div className="inline-choice-row">
            <button
              type="button"
              className={`choice-pill${newEventForm.teamMode === "manual" ? " active" : ""}`}
              onClick={() => setNewEventForm((current) => ({ ...current, teamMode: "manual" }))}
            >
              Digitar times
            </button>
            <button
              type="button"
              className={`choice-pill${newEventForm.teamMode === "import" ? " active" : ""}`}
              onClick={() => setNewEventForm((current) => ({ ...current, teamMode: "import" }))}
            >
              Importar alunos
            </button>
          </div>
        </div>
        {newEventForm.teamMode === "manual" ? (
          <div className="form-group">
            <label className="form-label">Times</label>
            <textarea
              value={newEventForm.teams}
              onChange={(event) => setNewEventForm((current) => ({ ...current, teams: event.target.value }))}
              placeholder={"Um por linha\nTime 1\nTime 2\nTime 3"}
            />
            <div className="form-hint">Um por linha.</div>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Lista de alunos</label>
              <textarea
                value={newEventForm.studentsRaw}
                onChange={(event) => setNewEventForm((current) => ({ ...current, studentsRaw: event.target.value }))}
                placeholder={"Um nome por linha\nAna Souza\nBruno Lima\nCamila Rocha"}
              />
              <div className="form-hint">{newEventStudents.length} aluno(s) validado(s).</div>
            </div>
          </>
        )}
        <div className="form-group">
          <label className="form-label">Anamnese antes do laboratório</label>
          <div className="inline-choice-row">
            <button
              type="button"
              className={`choice-pill${!newEventForm.anamnesisEnabled ? " active" : ""}`}
              onClick={() => setNewEventForm((current) => ({ ...current, anamnesisEnabled: false }))}
            >
              Desligada
            </button>
            <button
              type="button"
              className={`choice-pill${newEventForm.anamnesisEnabled ? " active" : ""}`}
              onClick={() => setNewEventForm((current) => ({ ...current, anamnesisEnabled: true }))}
            >
              Ligada
            </button>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={() => setNewEventOpen(false)}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCreateEvent}>
            Criar
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(addTeamOpen)} onClose={() => setAddTeamOpen(false)}>
        {addTeamOpen === "manual" ? (
          <>
            <div className="modal-title">Adicionar time</div>
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input type="text" value={newTeamName} onChange={(event) => setNewTeamName(event.target.value)} placeholder="Ex: Zeta" />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setAddTeamOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleAddTeam}>
                Adicionar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-title">Importar alunos e gerar times</div>
            <div className="modal-sub">
              Cole uma lista com um nome por linha. Depois escolha entre criar uma sala por aluno ou randomizar em grupos.
            </div>
            <div className="form-group">
              <label className="form-label">Lista de alunos</label>
              <textarea
                value={teamImportForm.studentsRaw}
                onChange={(event) => setTeamImportForm((current) => ({ ...current, studentsRaw: event.target.value }))}
                placeholder={"Um nome por linha\nAna Souza\nBruno Lima\nCamila Rocha"}
              />
              <div className="form-hint">{importedStudents.length} aluno(s) valido(s).</div>
            </div>
            <div className="form-group">
              <label className="form-label">Como gerar</label>
              <div className="inline-choice-row">
                <button
                  className={`choice-pill${teamImportForm.importMode === "solo" ? " active" : ""}`}
                  onClick={() => setTeamImportForm((current) => ({ ...current, importMode: "solo" }))}
                >
                  1 sala por aluno
                </button>
                <button
                  className={`choice-pill${teamImportForm.importMode === "random" ? " active" : ""}`}
                  onClick={() => setTeamImportForm((current) => ({ ...current, importMode: "random" }))}
                >
                  Randomizar em times
                </button>
              </div>
            </div>
            {teamImportForm.importMode === "random" ? (
              <div className="form-group">
                <label className="form-label">Quantidade de times</label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, importedStudents.length || 1)}
                  value={teamImportForm.randomTeamCount}
                  onChange={(event) =>
                    setTeamImportForm((current) => ({ ...current, randomTeamCount: Number(event.target.value) || 1 }))
                  }
                />
              </div>
            ) : null}
            {importedStudents.length ? (
              <div className="import-preview">
                <div className="mini-label">Prévia</div>
                <div className="import-preview-list">
                  {importedStudents.slice(0, 10).map((student) => (
                    <span className="import-preview-chip" key={student}>
                      {student}
                    </span>
                  ))}
                  {importedStudents.length > 10 ? <span className="import-preview-more">+{importedStudents.length - 10} nomes</span> : null}
                </div>
              </div>
            ) : null}
            <div className="modal-actions">
              <button className="btn" onClick={() => setAddTeamOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleGenerateTeamsForEvent}>
                Gerar times
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={configOpen} onClose={() => setConfigOpen(false)}>
        <div className="modal-title">Configuração da IA</div>
        <div className="notice">
          {serverConfig.deploymentTarget === "vercel"
            ? serverConfig.openaiConfigured
              ? "Há uma chave OpenAI ativa neste deploy. No Vercel, ela vem das variáveis do projeto."
              : "No Vercel, configure OPENAI_API_KEY nas variáveis do projeto para ativar a IA."
            : serverConfig.openaiConfigured
              ? `Há uma chave persistente ativa no servidor local (${serverConfig.openaiSource === "env" ? "vinda do .env" : "salva neste projeto"}).`
              : "Se você salvar uma chave aqui, ela fica persistente no servidor local deste projeto e não depende da porta do navegador."}
        </div>
        <div className="form-group">
          <label className="form-label">Chave OpenAI</label>
          <input
            type="password"
            value={configForm.apiKey}
            onChange={(event) => setConfigForm((current) => ({ ...current, apiKey: event.target.value }))}
            placeholder={
              serverConfig.deploymentTarget === "vercel"
                ? "Em produção, prefira configurar OPENAI_API_KEY no Vercel"
                : serverConfig.openaiConfigured
                  ? "Cole uma nova chave para substituir a atual"
                  : "sk-..."
            }
          />
        </div>
        <div className="form-group">
          <label className="form-label">Modelo padrão (chat)</label>
          <ModelSelect
            ariaLabel="Modelo padrão de chat"
            options={modelCatalog.chat}
            value={configForm.chatModel}
            onChange={(nextId) => setConfigForm((current) => ({ ...current, chatModel: nextId }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Modelo padrão (programação)</label>
          <ModelSelect
            ariaLabel="Modelo padrão de programação"
            options={modelCatalog.coding}
            value={configForm.codingModel}
            onChange={(nextId) => setConfigForm((current) => ({ ...current, codingModel: nextId }))}
          />
        </div>
        <div className="modal-actions">
          {serverConfig.deploymentTarget !== "vercel" ? (
            <button className="btn btn-ghost btn-danger" onClick={handleRemoveKey}>
              Remover chave
            </button>
          ) : null}
          <button className="btn" onClick={() => setConfigOpen(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSaveConfig}>
            Salvar
          </button>
        </div>
      </Modal>

      <Modal
        open={facAccessOpen}
        onClose={() => {
          setFacAccessOpen(false);
          setFacAccessPassword("");
          setFacAccessError("");
        }}
        small
      >
        <div className="modal-title">Acesso do facilitador</div>
        <div className="modal-sub">Digite a senha para entrar no painel do facilitador.</div>
        <div className="form-group">
          <label className="form-label">Senha</label>
          <input
            type="password"
            value={facAccessPassword}
            onChange={(event) => {
              setFacAccessPassword(event.target.value);
              if (facAccessError) setFacAccessError("");
            }}
            placeholder="Digite a senha"
            onKeyDown={(event) => {
              if (event.key === "Enter") handleFacilitadorAccess();
            }}
          />
          {facAccessError ? <div className="error-box top-gap-sm">{facAccessError}</div> : null}
        </div>
        <div className="modal-actions">
          <button
            className="btn"
            onClick={() => {
              setFacAccessOpen(false);
              setFacAccessPassword("");
              setFacAccessError("");
            }}
          >
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleFacilitadorAccess}>
            Entrar
          </button>
        </div>
      </Modal>

      <Modal open={confirmState.open} onClose={closeConfirm} small>
        <div className="modal-title">{confirmState.title}</div>
        <div className="confirm-body">{confirmState.body}</div>
        {confirmState.requiresPassword ? (
          <div className="form-group top-gap-sm">
            <label className="form-label">{confirmState.confirmLabel}</label>
            <input
              type="password"
              value={confirmInput}
              onChange={(event) => setConfirmInput(event.target.value)}
              placeholder={confirmState.confirmPlaceholder}
            />
            <div className="form-hint">{confirmState.confirmHint || "Digite exatamente o código do evento para liberar esta exclusão."}</div>
          </div>
        ) : null}
        <div className="modal-actions">
          <button className="btn" onClick={closeConfirm}>
            Cancelar
          </button>
          {confirmState.secondaryAction ? (
            <button
              className={`btn ${confirmState.secondaryAction.className || ""}`.trim()}
              disabled={confirmState.requiresPassword && confirmInput.trim() !== confirmState.confirmValue}
              onClick={() => {
                confirmState.secondaryAction.onClick?.();
                closeConfirm();
              }}
            >
              {confirmState.secondaryAction.label}
            </button>
          ) : null}
          <button
            className={`btn ${confirmState.confirmTone === "primary" ? "btn-primary" : "btn-primary btn-danger"}`}
            disabled={confirmState.requiresPassword && confirmInput.trim() !== confirmState.confirmValue}
            onClick={() => {
              confirmState.onConfirm?.();
              closeConfirm();
            }}
          >
            {confirmState.confirmActionLabel || (confirmState.secondaryAction ? "Confirmar" : "Confirmar")}
          </button>
        </div>
      </Modal>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} small>
        <div className="modal-title">Pedir ajuda ao facilitador</div>
        <div className="modal-sub">
          {teamHelpDisabled
            ? "A ajuda está desativada para este time. Reative no topo da tela quando quiser voltar a falar com o facilitador."
            : currentOpenHelpRequest
            ? "Seu pedido já foi enviado. Você pode revisar a mensagem ou cancelar se não precisar mais de ajuda."
            : "O facilitador vai receber este pedido junto com o contexto da missão e do seu time."}
        </div>
        <div className="form-group">
          <label className="form-label">Mensagem curta</label>
          <textarea
            value={helpMessage}
            onChange={(event) => setHelpMessage(event.target.value)}
            placeholder="Ex: Estamos travados para escolher a melhor ação e validar a resposta."
            disabled={teamHelpDisabled || Boolean(currentOpenHelpRequest)}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setHelpOpen(false)}>
            Fechar
          </button>
          {teamHelpDisabled ? (
            <button className="btn btn-primary" onClick={handleToggleHelpDisabled}>
              Reativar ajuda
            </button>
          ) : currentOpenHelpRequest ? (
            <button className="btn btn-primary btn-danger" onClick={() => handleCancelHelpRequest(teamEvent.id, currentOpenHelpRequest.id)}>
              Cancelar pedido
            </button>
          ) : (
            <button className="btn btn-primary" disabled={!helpMessage.trim()} onClick={handleSendHelpRequest}>
              Enviar ajuda
            </button>
          )}
        </div>
      </Modal>

      <Modal open={broadcastOpen} onClose={() => setBroadcastOpen(false)}>
        <div className="modal-title">Mensagem para a turma</div>
        <div className="modal-sub">
          Publique avisos para todos os times deste evento. Cada envio entra na caixa de entrada da turma e pode reaparecer pelo ícone de mensagens no header.
        </div>
        <div className="form-group">
          <label className="form-label">Mensagem</label>
          <textarea
            value={broadcastMessage}
            onChange={(event) => setBroadcastMessage(event.target.value)}
            placeholder="Ex: Pessoal, fechem a Missão 1 até 14h20. Depois vamos discutir os resultados em conjunto."
          />
        </div>
        <div className="modal-actions">
          {selectedEventAnnouncements.length ? (
            <button className="btn btn-ghost btn-danger" onClick={handleClearBroadcastMessage}>
              Limpar mensagens
            </button>
          ) : null}
          <button className="btn" onClick={() => setBroadcastOpen(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={!broadcastMessage.trim()} onClick={handleSaveBroadcastMessage}>
            Enviar
          </button>
        </div>
      </Modal>

      <Modal open={teamAnnouncementOpen} onClose={handleDismissTeamAnnouncement} small className="team-announcement-modal">
        <div className="modal-title">Mensagem do facilitador</div>
        <div className="team-announcement-modal-copy">{latestUnreadAnnouncement?.message}</div>
        <div className="modal-actions">
          <button className="btn" onClick={handleOpenTeamAnnouncementInbox}>
            Abrir caixa de entrada
          </button>
          <button className="btn btn-primary" onClick={handleDismissTeamAnnouncement}>
            Fechar
          </button>
        </div>
      </Modal>

      <Modal open={teamAnnouncementInboxOpen} onClose={() => setTeamAnnouncementInboxOpen(false)} className="team-announcement-inbox-modal">
        <div className="modal-title">Mensagens do facilitador</div>
        <div className="modal-sub">Tudo o que foi enviado para esta turma neste evento fica guardado aqui.</div>
        <div className="team-announcement-inbox-list">
          {teamEventAnnouncements.length ? (
            [...teamEventAnnouncements].reverse().map((announcement) => (
              <article key={announcement.id} className="team-announcement-inbox-item">
                <div className="team-announcement-inbox-meta">
                  <span>Facilitador</span>
                  <span>{new Date(announcement.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="team-announcement-inbox-copy">{announcement.message}</div>
              </article>
            ))
          ) : (
            <div className="teams-empty">Nenhuma mensagem registrada neste evento.</div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => setTeamAnnouncementInboxOpen(false)}>
            Fechar
          </button>
        </div>
      </Modal>

      <div className={`toast${toastText ? " show" : ""}`}>{toastText}</div>
    </>
  );
}

export default App;
