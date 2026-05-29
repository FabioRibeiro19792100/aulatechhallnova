import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AccessToken } from "livekit-server-sdk";

const configPath = path.resolve(".local-config.json");
const appStatePath = path.resolve(".local-app-state.json");
const remoteStateKey = "techhall-v1";

export const MODEL_CATALOG = {
  chat: [
    { id: "gpt-4o-mini", label: "GPT-4o mini", releasedAt: "2024-07", pricing: { input: 0.15, output: 0.6 } },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini", releasedAt: "2025-04", pricing: { input: 0.4, output: 1.6 } },
    { id: "gpt-4o", label: "GPT-4o", releasedAt: "2024-05", pricing: { input: 5, output: 15 } },
    { id: "gpt-4.1", label: "GPT-4.1", releasedAt: "2025-04", pricing: { input: 2, output: 8 } },
    { id: "gpt-5-mini", label: "GPT-5 mini", releasedAt: "2025-08", pricing: { input: 0.25, output: 2 } },
    { id: "gpt-5", label: "GPT-5", releasedAt: "2025-08", pricing: { input: 1.25, output: 10 } },
  ],
  coding: [
    { id: "gpt-5.1-codex-mini", label: "GPT-5.1 Codex Mini", releasedAt: "2025-11", pricing: { input: 0.25, output: 2 } },
    { id: "gpt-5.1-codex", label: "GPT-5.1 Codex", releasedAt: "2025-11", pricing: { input: 1.25, output: 10 } },
    { id: "gpt-5.3-codex", label: "GPT-5.3 Codex", releasedAt: "2026-02", pricing: { input: 1.75, output: 14 } },
  ],
};

export const DEFAULT_CHAT_MODEL = "gpt-4.1-mini";
export const DEFAULT_CODING_MODEL = "gpt-5.1-codex-mini";

export function getAllowedModelIds() {
  return [...MODEL_CATALOG.chat, ...MODEL_CATALOG.coding].map((model) => model.id);
}

export function isAllowedModel(id) {
  return getAllowedModelIds().includes(id);
}

function assertAllowedModel(model) {
  if (!isAllowedModel(model)) {
    const error = new Error(`Modelo não permitido: ${model}`);
    error.statusCode = 400;
    throw error;
  }
}

function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}

export async function readLocalConfig() {
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function writeLocalConfig(nextConfig) {
  await fs.writeFile(configPath, JSON.stringify(nextConfig, null, 2));
}

export async function getOpenAIApiKey() {
  const localConfig = await readLocalConfig();
  return localConfig.openaiApiKey || process.env.OPENAI_API_KEY || "";
}

export async function getRuntimeConfig() {
  const localConfig = await readLocalConfig();
  const supabaseConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  return {
    livekitConfigured: Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET),
    supabaseConfigured,
    sharedStateConfigured: supabaseConfigured || !isVercelRuntime(),
    openaiConfigured: Boolean(localConfig.openaiApiKey || process.env.OPENAI_API_KEY),
    openaiSource: localConfig.openaiApiKey ? "local-file" : process.env.OPENAI_API_KEY ? "env" : "none",
    openaiPersistence: isVercelRuntime() ? "env-only" : "local-file",
    deploymentTarget: isVercelRuntime() ? "vercel" : "local-server",
    supabaseUrl: supabaseConfigured ? process.env.SUPABASE_URL : "",
    supabaseAnonKey: supabaseConfigured ? process.env.SUPABASE_ANON_KEY : "",
    remoteStateKey,
    models: MODEL_CATALOG,
    defaultChatModel: DEFAULT_CHAT_MODEL,
    defaultCodingModel: DEFAULT_CODING_MODEL,
  };
}

async function readLocalAppState() {
  try {
    const raw = await fs.readFile(appStatePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { events: [], updatedAt: null };
  }
}

async function writeLocalAppState(nextState) {
  await fs.writeFile(appStatePath, JSON.stringify(nextState, null, 2));
}

// ── Read-only cache com TTL de 10s ───────────────────────────────────────────
// Cada instância serverless tem seu próprio cache em memória.
// Leituras servem do cache enquanto válido; escritas vão direto ao Supabase.

const READ_CACHE_TTL_MS = 10_000;

let readCache = null;       // { events: [], updatedAt: string }
let readCacheExpiresAt = 0;

function invalidateReadCache() {
  readCache = null;
  readCacheExpiresAt = 0;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Exponential backoff com jitter: 100–300ms na primeira tentativa, até ~2s
function jitter(attempt) {
  const base = Math.min(100 * 2 ** attempt, 2000);
  return base / 2 + Math.random() * (base / 2);
}

// ── Server-side merge ────────────────────────────────────────────────────────
// Replica da lógica do cliente. Mantida aqui para que o POST /api/state faça
// read-merge-write em vez de replace cego, evitando race conditions com N alunos.

function toTimestamp(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function pickLatestByTimestamp(remoteValue, localValue, candidateFields = []) {
  if (!remoteValue) return localValue;
  if (!localValue) return remoteValue;
  const remoteTs = Math.max(...candidateFields.map((field) => toTimestamp(remoteValue?.[field])), 0);
  const localTs = Math.max(...candidateFields.map((field) => toTimestamp(localValue?.[field])), 0);
  if (localTs >= remoteTs) return { ...remoteValue, ...localValue };
  return { ...localValue, ...remoteValue };
}

function mergeRecordArraysById(remoteItems = [], localItems = [], candidateFields = ["updatedAt", "submittedAt", "resolvedAt", "cancelledAt", "createdAt", "ts"]) {
  const merged = new Map();
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

function mergePresenceMaps(remoteMap = {}, localMap = {}) {
  return mergeObjectMaps(remoteMap, localMap, (remoteValue, localValue) =>
    pickLatestByTimestamp(remoteValue, localValue, ["lastSeenAt"]),
  );
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
    const existingEntries = remoteGlossaries?.[key] || [];
    const nextEntries = localGlossaries?.[key] || [];
    const mapped = new Map();
    [...existingEntries, ...nextEntries].forEach((entry) => {
      if (entry && entry.term) {
        const entryKey = entry.term.toLowerCase();
        if (!mapped.has(entryKey)) {
          mapped.set(entryKey, entry);
          return;
        }
        const previous = mapped.get(entryKey);
        const previousDefinition = `${previous?.definition || ""}`.trim();
        if (!previousDefinition || previousDefinition === "Definição não informada nesta rodada.") {
          mapped.set(entryKey, entry);
        }
      }
    });
    merged[key] = [...mapped.values()];
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
  const mergedById = new Map();
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

function mergeSingleEvent(remote = {}, local = {}) {
  const remoteUpdatedAt = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
  const localUpdatedAt = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
  const newest = localUpdatedAt >= remoteUpdatedAt ? local : remote;
  const oldest = newest === local ? remote : local;

  return {
    ...oldest,
    ...newest,
    teams: newest.teams || oldest.teams || [],
    missions: mergeMissions(remote.missions || [], local.missions || []),
    execucoes: mergeExecucaoMaps(remote.execucoes || {}, local.execucoes || {}),
    trainingRuns: mergeExecucaoMaps(remote.trainingRuns || {}, local.trainingRuns || {}),
    reflexoes: mergeObjectMaps(remote.reflexoes || {}, local.reflexoes || {}, (r, l) => pickLatestByTimestamp(r, l, ["submittedAt", "ts"])),
    questionariosPendentes: mergeObjectMaps(remote.questionariosPendentes || {}, local.questionariosPendentes || {}, (r, l) => pickLatestByTimestamp(r, l, ["updatedAt", "openedAt"])),
    conclusoes: mergeObjectMaps(remote.conclusoes || {}, local.conclusoes || {}, (r, l) => pickLatestByTimestamp(r, l, ["updatedAt", "closedAt", "concludedAt"])),
    preservedMissionUsage: {
      ...(remote.preservedMissionUsage || {}),
      ...(local.preservedMissionUsage || {}),
    },
    missionGlossaries: mergeMissionGlossaries(remote.missionGlossaries || {}, local.missionGlossaries || {}),
    missionTokenPolicies: mergeTokenPolicies(remote.missionTokenPolicies || {}, local.missionTokenPolicies || {}),
    tokenGrants: mergeTokenGrants(remote.tokenGrants || [], local.tokenGrants || []),
    tokenOperationalLogs: mergeTokenOperationalLogs(remote.tokenOperationalLogs || [], local.tokenOperationalLogs || []),
    helpRequests: mergeHelpRequestArrays(remote.helpRequests || [], local.helpRequests || []),
    helpDisabledMap: mergeObjectMaps(remote.helpDisabledMap || {}, local.helpDisabledMap || {}, (r, l) => pickLatestByTimestamp(r, l, ["updatedAt"])),
    anamnesisEnabled: newest.anamnesisEnabled ?? oldest.anamnesisEnabled ?? false,
    anamnesisResponses: mergeObjectMaps(
      remote.anamnesisResponses || {},
      local.anamnesisResponses || {},
      (r, l) => pickLatestByTimestamp(r, l, ["submittedAt", "updatedAt"]),
    ),
    missionResets: mergeObjectMaps(remote.missionResets || {}, local.missionResets || {}, (r, l) => {
      if (!r) return l;
      if (!l) return r;
      return r >= l ? r : l;
    }),
    presenceMap: mergePresenceMaps(remote.presenceMap || {}, local.presenceMap || {}),
    sessionTimer: mergeSessionTimerState(remote.sessionTimer || {}, local.sessionTimer || {}),
    sessionTimerNotice: mergeTimerNotice(remote.sessionTimerNotice || {}, local.sessionTimerNotice || {}),
    screenShare: mergeScreenShareState(remote.screenShare || {}, local.screenShare || {}),
  };
}

function mergeEventCollections(remoteEvents = [], incomingEvents = []) {
  const byId = new Map();
  for (const ev of remoteEvents) byId.set(ev.id, ev);
  for (const ev of incomingEvents) {
    if (!ev?.id) continue;
    if (!byId.has(ev.id)) {
      byId.set(ev.id, ev);
      continue;
    }
    byId.set(ev.id, mergeSingleEvent(byId.get(ev.id), ev));
  }
  return [...byId.values()];
}

// ── Write queue (mutex para servidor local) ──────────────────────────────────
// Serializa escritas concorrentes no mesmo processo Node.js.
// No Vercel (serverless) cada instância é single-request, então não há disputa
// interna — a proteção contra race conditions vem do optimistic locking no DB.

let writeQueue = Promise.resolve();

function withWriteLock(fn) {
  const next = writeQueue.then(fn);
  writeQueue = next.catch(() => {});
  return next;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const error = new Error("SUPABASE_URL e SUPABASE_ANON_KEY precisam estar configurados.");
    error.statusCode = 500;
    throw error;
  }

  return {
    url: url.replace(/\/+$/, ""),
    anonKey,
  };
}

async function fetchSupabase(pathname, { method = "GET", body, headers = {}, timeoutMs = 8000 } = {}) {
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
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (fetchError) {
    clearTimeout(timer);
    const error = new Error(
      fetchError?.name === "AbortError"
        ? `Supabase nao respondeu em ${timeoutMs}ms.`
        : "Falha de rede ao consultar o Supabase.",
    );
    error.statusCode = 504;
    throw error;
  }
  clearTimeout(timer);

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error(responseText || "Falha ao consultar o Supabase.");
    error.statusCode = response.status;
    throw error;
  }

  return responseText ? JSON.parse(responseText) : null;
}

export async function getRemoteAppState() {
  const serverNow = new Date().toISOString();

  if (readCache && Date.now() < readCacheExpiresAt) {
    return { events: readCache.events, updatedAt: readCache.updatedAt, serverNow };
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    const local = await readLocalAppState();
    readCache = {
      events: Array.isArray(local?.events) ? local.events : [],
      updatedAt: local?.updatedAt || serverNow,
    };
    readCacheExpiresAt = Date.now() + READ_CACHE_TTL_MS;
    return { events: readCache.events, updatedAt: readCache.updatedAt, serverNow };
  }

  const rows = await fetchSupabase(
    "/rest/v1/app_state?select=id,payload,updated_at",
  );
  const eventsMap = new Map();
  let maxUpdatedAt = null;

  for (const row of rows || []) {
    if (row.id === remoteStateKey) {
      if (row.payload && Array.isArray(row.payload.events)) {
        for (const ev of row.payload.events) {
          if (ev && ev.id) {
            eventsMap.set(ev.id, ev);
          }
        }
      }
      if (!maxUpdatedAt || row.updated_at > maxUpdatedAt) {
        maxUpdatedAt = row.updated_at;
      }
    } else if (row.id.startsWith("event-")) {
      if (row.payload && typeof row.payload === "object" && row.payload.id) {
        eventsMap.set(row.payload.id, row.payload);
      }
      if (!maxUpdatedAt || row.updated_at > maxUpdatedAt) {
        maxUpdatedAt = row.updated_at;
      }
    }
  }

  const events = [...eventsMap.values()];
  const consolidatedUpdatedAt = maxUpdatedAt || serverNow;

  readCache = {
    events,
    updatedAt: consolidatedUpdatedAt,
  };
  readCacheExpiresAt = Date.now() + READ_CACHE_TTL_MS;
  return { events, updatedAt: consolidatedUpdatedAt, serverNow };
}

async function saveSingleEventState(event) {
  const eventKey = `event-${event.id}`;
  const MAX_RETRIES = 20;

  await sleep(Math.random() * 500);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const rows = await fetchSupabase(
      `/rest/v1/app_state?id=eq.${eventKey}&select=payload,updated_at&limit=1`,
      { timeoutMs: 12_000 },
    );
    const record = rows?.[0];
    const currentUpdatedAt = record?.updated_at ?? null;
    const currentEvent = record?.payload && typeof record.payload === "object" ? record.payload : null;

    const updatedAt = new Date().toISOString();
    const merged = currentEvent ? mergeSingleEvent(currentEvent, event) : event;

    try {
      if (!record) {
        await fetchSupabase("/rest/v1/app_state", {
          method: "POST",
          headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: [{ id: eventKey, payload: merged, updated_at: updatedAt }],
          timeoutMs: 12_000,
        });
        await sleep(jitter(attempt));
        continue;
      }

      const result = await fetchSupabase(
        `/rest/v1/app_state?id=eq.${eventKey}&updated_at=eq.${encodeURIComponent(currentUpdatedAt)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: { payload: merged, updated_at: updatedAt },
          timeoutMs: 12_000,
        },
      );
      if (Array.isArray(result) && result.length === 0) {
        await sleep(jitter(attempt));
        continue;
      }

      return merged;
    } catch (err) {
      if (err.statusCode === 409 || err.statusCode === 423 || err.statusCode === 504) {
        await sleep(jitter(attempt));
        continue;
      }
      throw err;
    }
  }

  const error = new Error(`Conflito de escrita persistente no evento ${event.id}.`);
  error.statusCode = 409;
  throw error;
}

export async function saveRemoteAppState(payload) {
  if (!payload || !Array.isArray(payload.events)) {
    const error = new Error("payload.events obrigatorio.");
    error.statusCode = 400;
    throw error;
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return withWriteLock(async () => {
      const local = await readLocalAppState();
      const merged = mergeEventCollections(
        Array.isArray(local?.events) ? local.events : [],
        payload.events,
      );
      const updatedAt = new Date().toISOString();
      await writeLocalAppState({ id: remoteStateKey, events: merged, updatedAt });
      invalidateReadCache();
      return { ok: true, updatedAt, serverNow: updatedAt };
    });
  }

  await Promise.all(
    payload.events.map(async (event) => {
      if (!event || !event.id) return null;
      return saveSingleEventState(event);
    })
  );

  const updatedAt = new Date().toISOString();
  invalidateReadCache();
  return { ok: true, updatedAt, serverNow: updatedAt };
}

export async function saveOpenAIKey(apiKey) {
  const normalizedKey = apiKey?.trim();
  if (!normalizedKey) {
    const error = new Error("apiKey obrigatoria.");
    error.statusCode = 400;
    throw error;
  }

  if (isVercelRuntime()) {
    const error = new Error("No Vercel, configure OPENAI_API_KEY nas variaveis do projeto. O app nao salva a chave no servidor em producao.");
    error.statusCode = 501;
    throw error;
  }

  const localConfig = await readLocalConfig();
  await writeLocalConfig({
    ...localConfig,
    openaiApiKey: normalizedKey,
  });
  return getRuntimeConfig();
}

export async function removeOpenAIKey() {
  if (isVercelRuntime()) {
    const error = new Error("No Vercel, remova OPENAI_API_KEY nas variaveis do projeto. O app nao altera segredos do deploy em runtime.");
    error.statusCode = 501;
    throw error;
  }

  const localConfig = await readLocalConfig();
  delete localConfig.openaiApiKey;
  await writeLocalConfig(localConfig);
  return getRuntimeConfig();
}

export async function createOpenAIChatCompletion({ model, messages, temperature = 0.4, reasoningEffort }) {
  const runtimeApiKey = await getOpenAIApiKey();
  if (!runtimeApiKey) {
    const error = new Error(
      isVercelRuntime()
        ? "OPENAI_API_KEY nao configurada no deploy do Vercel."
        : "OPENAI_API_KEY nao configurada no servidor local.",
    );
    error.statusCode = 500;
    throw error;
  }

  if (!model || !Array.isArray(messages)) {
    const error = new Error("model e messages sao obrigatorios.");
    error.statusCode = 400;
    throw error;
  }

  assertAllowedModel(model);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${runtimeApiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error(responseText || "Falha ao consultar a OpenAI.");
    error.statusCode = response.status;
    throw error;
  }

  return responseText;
}

export async function createOpenAIResponse({ model, instructions, input, previousResponseId, reasoningEffort }) {
  const runtimeApiKey = await getOpenAIApiKey();
  if (!runtimeApiKey) {
    const error = new Error(
      isVercelRuntime()
        ? "OPENAI_API_KEY nao configurada no deploy do Vercel."
        : "OPENAI_API_KEY nao configurada no servidor local.",
    );
    error.statusCode = 500;
    throw error;
  }

  if (!model || !input) {
    const error = new Error("model e input sao obrigatorios.");
    error.statusCode = 400;
    throw error;
  }

  assertAllowedModel(model);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${runtimeApiKey}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      store: true,
      ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
      ...(reasoningEffort ? { reasoning: { effort: reasoningEffort } } : {}),
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error(responseText || "Falha ao consultar a OpenAI Responses API.");
    error.statusCode = response.status;
    throw error;
  }

  return responseText;
}

export async function createOpenAIResponseStream({ model, instructions, input, previousResponseId, reasoningEffort }) {
  const runtimeApiKey = await getOpenAIApiKey();
  if (!runtimeApiKey) {
    const error = new Error(
      isVercelRuntime()
        ? "OPENAI_API_KEY nao configurada no deploy do Vercel."
        : "OPENAI_API_KEY nao configurada no servidor local.",
    );
    error.statusCode = 500;
    throw error;
  }

  if (!model || !input) {
    const error = new Error("model e input sao obrigatorios.");
    error.statusCode = 400;
    throw error;
  }

  assertAllowedModel(model);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${runtimeApiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      store: true,
      stream: true,
      ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
      ...(reasoningEffort ? { reasoning: { effort: reasoningEffort, summary: "auto" } } : {}),
    }),
  });

  if (!response.ok || !response.body) {
    const responseText = await response.text();
    const error = new Error(responseText || "Falha ao consultar a OpenAI Responses API.");
    error.statusCode = response.status || 500;
    throw error;
  }

  return response;
}

async function extractDocxText(buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return `${result.value || ""}`.trim();
}

async function extractPdfText(buffer) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return `${text || ""}`.trim();
}

export async function extractDocumentText({ fileName, contentBase64 }) {
  if (!fileName || !contentBase64) {
    const error = new Error("fileName e contentBase64 sao obrigatorios.");
    error.statusCode = 400;
    throw error;
  }

  const extension = path.extname(fileName).toLowerCase();
  const buffer = Buffer.from(contentBase64, "base64");

  try {
    let text = "";
    if (extension === ".docx") {
      text = await extractDocxText(buffer);
    } else if (extension === ".pdf") {
      text = await extractPdfText(buffer);
    } else {
      const error = new Error(`Extensão não suportada para extração: ${extension || "desconhecida"}`);
      error.statusCode = 400;
      throw error;
    }

    return { text };
  } catch (error) {
    if (error?.statusCode === 400) throw error;
    console.error("extractDocumentText failed:", error);
    const wrapped = new Error("Não foi possível extrair o texto deste arquivo.");
    wrapped.statusCode = 422;
    throw wrapped;
  }
}

export async function createLiveKitToken({ roomName, identity, name, canPublish = false }) {
  const livekitUrl = process.env.LIVEKIT_URL;
  const livekitApiKey = process.env.LIVEKIT_API_KEY;
  const livekitApiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
    const error = new Error("LIVEKIT_URL, LIVEKIT_API_KEY e LIVEKIT_API_SECRET precisam estar configurados.");
    error.statusCode = 500;
    throw error;
  }

  if (!roomName || !identity) {
    const error = new Error("roomName e identity sao obrigatorios.");
    error.statusCode = 400;
    throw error;
  }

  const token = new AccessToken(livekitApiKey, livekitApiSecret, {
    identity,
    name: name || identity,
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: canPublish,
  });

  return {
    token: await token.toJwt(),
    url: livekitUrl,
  };
}
