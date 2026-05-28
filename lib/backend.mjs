import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AccessToken } from "livekit-server-sdk";

const configPath = path.resolve(".local-config.json");
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

async function fetchSupabase(pathname, { method = "GET", body, headers = {} } = {}) {
  const { url, anonKey } = getSupabaseConfig();
  const response = await fetch(`${url}${pathname}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error(responseText || "Falha ao consultar o Supabase.");
    error.statusCode = response.status;
    throw error;
  }

  return responseText ? JSON.parse(responseText) : null;
}

export async function getRemoteAppState() {
  const rows = await fetchSupabase(`/rest/v1/app_state?id=eq.${remoteStateKey}&select=payload,updated_at&limit=1`);
  const record = rows?.[0];
  return {
    events: Array.isArray(record?.payload?.events) ? record.payload.events : [],
    updatedAt: record?.updated_at || null,
  };
}

export async function saveRemoteAppState(payload) {
  if (!payload || !Array.isArray(payload.events)) {
    const error = new Error("payload.events obrigatorio.");
    error.statusCode = 400;
    throw error;
  }

  const updatedAt = new Date().toISOString();
  await fetchSupabase("/rest/v1/app_state", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: [
      {
        id: remoteStateKey,
        payload: {
          events: payload.events,
        },
        updated_at: updatedAt,
      },
    ],
  });

  return {
    ok: true,
    updatedAt,
  };
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

function ensurePdfRuntimePolyfills() {
  const g = globalThis;
  if (typeof g.DOMMatrix !== "undefined") return;
  class DOMMatrixPolyfill {
    constructor(init) {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
      if (Array.isArray(init)) {
        if (init.length === 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        } else if (init.length === 16) {
          this.a = init[0]; this.b = init[1]; this.c = init[4]; this.d = init[5]; this.e = init[12]; this.f = init[13];
        }
      } else if (init && typeof init === "object") {
        this.a = init.a ?? init.m11 ?? 1;
        this.b = init.b ?? init.m12 ?? 0;
        this.c = init.c ?? init.m21 ?? 0;
        this.d = init.d ?? init.m22 ?? 1;
        this.e = init.e ?? init.m41 ?? 0;
        this.f = init.f ?? init.m42 ?? 0;
      }
    }
    get m11() { return this.a; } set m11(v) { this.a = v; }
    get m12() { return this.b; } set m12(v) { this.b = v; }
    get m21() { return this.c; } set m21(v) { this.c = v; }
    get m22() { return this.d; } set m22(v) { this.d = v; }
    get m41() { return this.e; } set m41(v) { this.e = v; }
    get m42() { return this.f; } set m42(v) { this.f = v; }
    get is2D() { return true; }
    get isIdentity() { return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0; }
    static _mul(m1, m2) {
      return new DOMMatrixPolyfill([
        m1.a * m2.a + m1.c * m2.b,
        m1.b * m2.a + m1.d * m2.b,
        m1.a * m2.c + m1.c * m2.d,
        m1.b * m2.c + m1.d * m2.d,
        m1.a * m2.e + m1.c * m2.f + m1.e,
        m1.b * m2.e + m1.d * m2.f + m1.f,
      ]);
    }
    multiply(o) { return DOMMatrixPolyfill._mul(this, o); }
    multiplySelf(o) { return Object.assign(this, DOMMatrixPolyfill._mul(this, o)); }
    preMultiplySelf(o) { return Object.assign(this, DOMMatrixPolyfill._mul(o, this)); }
    translate(tx = 0, ty = 0) { return this.multiply(new DOMMatrixPolyfill([1, 0, 0, 1, tx, ty])); }
    translateSelf(tx = 0, ty = 0) { return this.multiplySelf(new DOMMatrixPolyfill([1, 0, 0, 1, tx, ty])); }
    scale(sx = 1, sy) { return this.multiply(new DOMMatrixPolyfill([sx, 0, 0, sy === undefined ? sx : sy, 0, 0])); }
    scaleSelf(sx = 1, sy) { return this.multiplySelf(new DOMMatrixPolyfill([sx, 0, 0, sy === undefined ? sx : sy, 0, 0])); }
    rotate(deg = 0) { const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return this.multiply(new DOMMatrixPolyfill([c, s, -s, c, 0, 0])); }
    rotateSelf(deg = 0) { const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return this.multiplySelf(new DOMMatrixPolyfill([c, s, -s, c, 0, 0])); }
    inverse() {
      const det = this.a * this.d - this.b * this.c;
      if (!det) return new DOMMatrixPolyfill();
      const ia = this.d / det, ib = -this.b / det, ic = -this.c / det, id = this.a / det;
      return new DOMMatrixPolyfill([ia, ib, ic, id, -(ia * this.e + ic * this.f), -(ib * this.e + id * this.f)]);
    }
    transformPoint(p = {}) {
      const x = p.x || 0, y = p.y || 0;
      return { x: this.a * x + this.c * y + this.e, y: this.b * x + this.d * y + this.f, z: p.z || 0, w: p.w == null ? 1 : p.w };
    }
  }
  g.DOMMatrix = DOMMatrixPolyfill;
}

async function extractPdfText(buffer) {
  ensurePdfRuntimePolyfills();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  });
  const pdf = await loadingTask.promise;
  const parts = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = (content.items || [])
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) parts.push(pageText);
  }

  return parts.join("\n\n").trim();
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
