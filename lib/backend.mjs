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

// ── In-memory cache ──────────────────────────────────────────────────────────
// Serve reads direto da memória (sub-ms) e faz flush para Supabase/arquivo a
// cada FLUSH_INTERVAL_MS. Elimina race conditions em processo único e reduz
// drasticamente os round-trips ao Supabase durante uma aula.

const FLUSH_INTERVAL_MS = 30_000;

let memCache = null;          // { events: [], updatedAt: string }
let isDirty = false;
let flushTimer = null;
let hydratePromise = null;

async function hydrateCache() {
  if (memCache) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    const serverNow = new Date().toISOString();
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      const local = await readLocalAppState();
      memCache = {
        events: Array.isArray(local?.events) ? local.events : [],
        updatedAt: local?.updatedAt || serverNow,
      };
      return;
    }
    const rows = await fetchSupabase(
      `/rest/v1/app_state?id=eq.${remoteStateKey}&select=payload,updated_at&limit=1`,
    );
    const record = rows?.[0];
    memCache = {
      events: Array.isArray(record?.payload?.events) ? record.payload.events : [],
      updatedAt: record?.updated_at || serverNow,
    };
    console.log(`[cache] hydrated — ${memCache.events.length} eventos carregados`);
  })();

  return hydratePromise;
}

async function flushToStorage() {
  if (!isDirty || !memCache) return;
  isDirty = false;

  const { events, updatedAt } = memCache;

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      await writeLocalAppState({ id: remoteStateKey, events, updatedAt });
    } else {
      await fetchSupabase("/rest/v1/app_state", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: [{ id: remoteStateKey, payload: { events }, updated_at: updatedAt }],
      });
    }
    console.log(`[cache] flush ok — ${new Date(updatedAt).toISOString()}`);
  } catch (err) {
    isDirty = true; // garante retry no próximo flush
    console.error("[cache] flush falhou:", err.message);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    await flushToStorage();
    if (isDirty) scheduleFlush(); // reagenda se houve escrita durante o flush
  }, FLUSH_INTERVAL_MS);
}

export async function initCache() {
  await hydrateCache();

  const shutdown = async (signal) => {
    console.log(`[cache] ${signal} — fazendo flush final...`);
    clearTimeout(flushTimer);
    flushTimer = null;
    await flushToStorage();
    console.log("[cache] flush final concluído.");
    process.exit(0);
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

export async function forceFlush() {
  clearTimeout(flushTimer);
  flushTimer = null;
  isDirty = true;
  await flushToStorage();
}

// ── Server-side merge ────────────────────────────────────────────────────────
// Replica da lógica do cliente. Mantida aqui para que o POST /api/state faça
// read-merge-write em vez de replace cego, evitando race conditions com N alunos.

function mergeArraysById(remote = [], local = []) {
  const map = new Map();
  for (const item of remote) {
    const key = item.id || item.ts;
    if (key) map.set(key, item);
  }
  for (const item of local) {
    const key = item.id || item.ts;
    if (key && !map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function mergeExecMaps(remote = {}, local = {}) {
  const keys = new Set([...Object.keys(remote), ...Object.keys(local)]);
  return Object.fromEntries(
    [...keys].map((key) => {
      const merged = mergeArraysById(remote[key] || [], local[key] || []);
      merged.sort((a, b) => new Date(a.ts || 0) - new Date(b.ts || 0));
      return [key, merged];
    }),
  );
}

function mergeEventCollections(remoteEvents = [], incomingEvents = []) {
  const byId = new Map();
  for (const ev of remoteEvents) byId.set(ev.id, ev);
  for (const ev of incomingEvents) {
    if (!byId.has(ev.id)) { byId.set(ev.id, ev); continue; }
    const base = byId.get(ev.id);
    byId.set(ev.id, {
      ...base,
      ...ev,
      execucoes: mergeExecMaps(base.execucoes, ev.execucoes),
      trainingRuns: mergeExecMaps(base.trainingRuns, ev.trainingRuns),
    });
  }
  return [...byId.values()];
}

// ── Write queue (mutex) ──────────────────────────────────────────────────────
// Serializa escritas concorrentes no mesmo processo Node.js.
// Sem isso, N requests simultâneos fazem read-merge-write em paralelo
// e os últimos a escrever sobrescrevem os anteriores.

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
  await hydrateCache();
  return {
    events: memCache.events,
    updatedAt: memCache.updatedAt,
    serverNow,
  };
}

export async function saveRemoteAppState(payload) {
  if (!payload || !Array.isArray(payload.events)) {
    const error = new Error("payload.events obrigatorio.");
    error.statusCode = 400;
    throw error;
  }

  await hydrateCache();

  // Write lock serializa no processo — sem round-trip ao Supabase por request.
  // O flush periódico (scheduleFlush) persiste o cache de forma assíncrona.
  return withWriteLock(() => {
    const updatedAt = new Date().toISOString();
    const merged = mergeEventCollections(memCache.events, payload.events);
    memCache = { events: merged, updatedAt };
    isDirty = true;
    scheduleFlush();
    return { ok: true, updatedAt, serverNow: updatedAt };
  });
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
