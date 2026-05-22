import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AccessToken } from "livekit-server-sdk";

const configPath = path.resolve(".local-config.json");

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
  return {
    livekitConfigured: Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET),
    openaiConfigured: Boolean(localConfig.openaiApiKey || process.env.OPENAI_API_KEY),
    openaiSource: localConfig.openaiApiKey ? "local-file" : process.env.OPENAI_API_KEY ? "env" : "none",
    openaiPersistence: isVercelRuntime() ? "env-only" : "local-file",
    deploymentTarget: isVercelRuntime() ? "vercel" : "local-server",
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

export async function createOpenAIChatCompletion({ model, messages, temperature = 0.4 }) {
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
