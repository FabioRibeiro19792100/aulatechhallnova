import "dotenv/config";
import express from "express";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AccessToken } from "livekit-server-sdk";

const app = express();
const port = Number(process.env.PORT || 8787);
const livekitUrl = process.env.LIVEKIT_URL;
const livekitApiKey = process.env.LIVEKIT_API_KEY;
const livekitApiSecret = process.env.LIVEKIT_API_SECRET;
const configPath = path.resolve(".local-config.json");

app.use(express.json());

async function readLocalConfig() {
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeLocalConfig(nextConfig) {
  await fs.writeFile(configPath, JSON.stringify(nextConfig, null, 2));
}

async function getOpenAIApiKey() {
  const localConfig = await readLocalConfig();
  return localConfig.openaiApiKey || process.env.OPENAI_API_KEY || "";
}

async function getRuntimeConfig() {
  const localConfig = await readLocalConfig();
  return {
    livekitConfigured: Boolean(livekitUrl && livekitApiKey && livekitApiSecret),
    openaiConfigured: Boolean(localConfig.openaiApiKey || process.env.OPENAI_API_KEY),
    openaiSource: localConfig.openaiApiKey ? "local-file" : process.env.OPENAI_API_KEY ? "env" : "none",
  };
}

app.get("/api/health", async (_req, res) => {
  const runtimeConfig = await getRuntimeConfig();
  res.json({
    ok: true,
    ...runtimeConfig,
  });
});

app.get("/api/config", async (_req, res) => {
  res.json(await getRuntimeConfig());
});

app.post("/api/config/openai", async (req, res) => {
  const apiKey = req.body?.apiKey?.trim();
  if (!apiKey) {
    res.status(400).send("apiKey obrigatoria.");
    return;
  }
  const localConfig = await readLocalConfig();
  await writeLocalConfig({
    ...localConfig,
    openaiApiKey: apiKey,
  });
  res.json(await getRuntimeConfig());
});

app.delete("/api/config/openai", async (_req, res) => {
  const localConfig = await readLocalConfig();
  delete localConfig.openaiApiKey;
  await writeLocalConfig(localConfig);
  res.json(await getRuntimeConfig());
});

app.post("/api/openai/chat", async (req, res) => {
  const runtimeApiKey = await getOpenAIApiKey();
  if (!runtimeApiKey) {
    res.status(500).send("OPENAI_API_KEY nao configurada no servidor local.");
    return;
  }

  const { model, messages, temperature = 0.4 } = req.body || {};
  if (!model || !Array.isArray(messages)) {
    res.status(400).send("model e messages sao obrigatorios.");
    return;
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
    res.status(response.status).send(responseText || "Falha ao consultar a OpenAI.");
    return;
  }

  res.type("application/json").send(responseText);
});

app.post("/api/livekit/token", async (req, res) => {
  if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
    res.status(500).send("LIVEKIT_URL, LIVEKIT_API_KEY e LIVEKIT_API_SECRET precisam estar configurados.");
    return;
  }

  const { roomName, identity, name, canPublish = false } = req.body || {};

  if (!roomName || !identity) {
    res.status(400).send("roomName e identity sao obrigatorios.");
    return;
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

  res.json({
    token: await token.toJwt(),
    url: livekitUrl,
  });
});

app.listen(port, () => {
  console.log(`LiveKit token server listening on http://localhost:${port}`);
});
