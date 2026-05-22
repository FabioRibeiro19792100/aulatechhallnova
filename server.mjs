import "dotenv/config";
import express from "express";
import {
  createLiveKitToken,
  createOpenAIChatCompletion,
  getRemoteAppState,
  getRuntimeConfig,
  removeOpenAIKey,
  saveRemoteAppState,
  saveOpenAIKey,
} from "./lib/backend.mjs";

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(express.json());

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

app.get("/api/state", async (_req, res) => {
  try {
    res.json(await getRemoteAppState());
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message || "Falha ao carregar estado remoto.");
  }
});

app.post("/api/state", async (req, res) => {
  try {
    res.json(await saveRemoteAppState(req.body || {}));
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message || "Falha ao salvar estado remoto.");
  }
});

app.post("/api/config/openai", async (req, res) => {
  try {
    res.json(await saveOpenAIKey(req.body?.apiKey));
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message || "Falha ao salvar chave OpenAI.");
  }
});

app.delete("/api/config/openai", async (_req, res) => {
  try {
    res.json(await removeOpenAIKey());
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message || "Falha ao remover chave OpenAI.");
  }
});

app.post("/api/openai/chat", async (req, res) => {
  try {
    const responseText = await createOpenAIChatCompletion(req.body || {});
    res.type("application/json").send(responseText);
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message || "Falha ao consultar a OpenAI.");
  }
});

app.post("/api/livekit/token", async (req, res) => {
  try {
    res.json(await createLiveKitToken(req.body || {}));
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message || "Falha ao gerar token LiveKit.");
  }
});

app.listen(port, () => {
  console.log(`LiveKit token server listening on http://localhost:${port}`);
});
