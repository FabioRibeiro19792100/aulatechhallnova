import "dotenv/config";
import express from "express";
import {
  createLiveKitToken,
  createOpenAIChatCompletion,
  createOpenAIResponse,
  createOpenAIResponseStream,
  extractDocumentText,
  getRuntimeConfig,
  removeOpenAIKey,
  saveOpenAIKey,
} from "./lib/backend.mjs";
import {
  listEvents as listEventsPerTeam,
  getEventState as getEventStatePerTeam,
  putEventStateOCC as putEventStatePerTeam,
  getTeamState as getTeamStatePerTeam,
  putTeamStateOCC as putTeamStatePerTeam,
  upsertPresence as upsertPresencePerTeam,
  listExecutions as listExecutionsPerTeam,
  insertExecution as insertExecutionPerTeam,
  insertTokenLog as insertTokenLogPerTeam,
  listTokenLogs as listTokenLogsPerTeam,
  insertHelpRequest as insertHelpRequestPerTeam,
  updateHelpRequestStatus as updateHelpRequestStatusPerTeam,
  listHelpRequests as listHelpRequestsPerTeam,
  getDashboard as getDashboardPerTeam,
} from "./lib/per-team-backend.mjs";

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(express.json({ limit: "10mb" }));

app.get("/api/health", async (_req, res) => {
  const runtimeConfig = await getRuntimeConfig();
  res.json({
    ok: true,
    ...runtimeConfig,
  });
});

app.get("/api/config", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.json(await getRuntimeConfig());
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

app.post("/api/openai/responses", async (req, res) => {
  try {
    const responseText = await createOpenAIResponse(req.body || {});
    res.type("application/json").send(responseText);
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message || "Falha ao consultar a OpenAI.");
  }
});

app.post("/api/openai/responses/stream", async (req, res) => {
  try {
    const upstream = await createOpenAIResponseStream(req.body || {});
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") res.flushHeaders();
    for await (const chunk of upstream.body) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message || "Falha ao consultar a OpenAI.");
  }
});

app.post("/api/attachments/extract", async (req, res) => {
  try {
    res.json(await extractDocumentText(req.body || {}));
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message || "Falha ao extrair arquivo.");
  }
});

app.post("/api/livekit/token", async (req, res) => {
  try {
    res.json(await createLiveKitToken(req.body || {}));
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message || "Falha ao gerar token LiveKit.");
  }
});

function bindPerTeamRoutes(app) {
  const wrap = (fn) => async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err.statusCode === 409 && err.body) {
        res.status(409).json(err.body);
        return;
      }
      res.status(err.statusCode || 500).send(err.message || "Erro interno.");
    }
  };

  app.get("/api/event/list", wrap(async (_req, res) => res.json(await listEventsPerTeam())));

  app.get("/api/event/:eventId", wrap(async (req, res) => {
    res.json(await getEventStatePerTeam(req.params.eventId));
  }));

  app.put("/api/event/:eventId", wrap(async (req, res) => {
    res.json(await putEventStatePerTeam(req.params.eventId, req.body));
  }));

  app.get("/api/event/:eventId/dashboard", wrap(async (req, res) => {
    res.json(await getDashboardPerTeam(req.params.eventId));
  }));

  app.get("/api/event/:eventId/team/:teamIdx", wrap(async (req, res) => {
    res.json(await getTeamStatePerTeam(req.params.eventId, Number(req.params.teamIdx)));
  }));

  app.put("/api/event/:eventId/team/:teamIdx", wrap(async (req, res) => {
    res.json(await putTeamStatePerTeam(req.params.eventId, Number(req.params.teamIdx), req.body));
  }));

  app.post("/api/event/:eventId/team/:teamIdx/presence", wrap(async (req, res) => {
    await upsertPresencePerTeam({
      event_id: req.params.eventId,
      team_idx: Number(req.params.teamIdx),
      member_name: `${req.body?.member_name || ""}`,
    });
    res.json({ ok: true });
  }));

  app.get("/api/event/:eventId/team/:teamIdx/executions", wrap(async (req, res) => {
    const limit = Number.parseInt(req.query.limit, 10) || 50;
    res.json(
      await listExecutionsPerTeam({
        event_id: req.params.eventId,
        team_idx: Number(req.params.teamIdx),
        mission_id: req.query.mission_id || undefined,
        limit,
      }),
    );
  }));

  app.post("/api/event/:eventId/team/:teamIdx/executions", wrap(async (req, res) => {
    await insertExecutionPerTeam({
      id: `${req.body.id}`,
      event_id: req.params.eventId,
      team_idx: Number(req.params.teamIdx),
      mission_id: `${req.body.mission_id}`,
      kind: req.body.kind || "chat",
      payload: req.body.payload || {},
      tokens: req.body.tokens || {},
      custo: req.body.custo ?? null,
      created_at: req.body.created_at || new Date().toISOString(),
    });
    res.status(201).json({ ok: true });
  }));

  app.get("/api/event/:eventId/executions", wrap(async (req, res) => {
    const limit = Number.parseInt(req.query.limit, 10) || 100;
    res.json(await listExecutionsPerTeam({ event_id: req.params.eventId, limit }));
  }));

  app.post("/api/event/:eventId/token-log", wrap(async (req, res) => {
    await insertTokenLogPerTeam({
      event_id: req.params.eventId,
      team_idx: req.body.team_idx ?? null,
      mission_id: req.body.mission_id || null,
      payload: req.body.payload || {},
      created_at: req.body.created_at || new Date().toISOString(),
    });
    res.status(201).json({ ok: true });
  }));

  app.get("/api/event/:eventId/token-log", wrap(async (req, res) => {
    const team_idx = req.query.team_idx ? Number(req.query.team_idx) : null;
    const limit = Number.parseInt(req.query.limit, 10) || 200;
    res.json(await listTokenLogsPerTeam({ event_id: req.params.eventId, team_idx, limit }));
  }));

  app.post("/api/event/:eventId/help-request", wrap(async (req, res) => {
    await insertHelpRequestPerTeam({
      id: `${req.body.id}`,
      event_id: req.params.eventId,
      team_idx: Number(req.body.team_idx),
      mission_id: req.body.mission_id || null,
      status: req.body.status || "open",
      payload: req.body.payload || {},
      created_at: req.body.created_at || new Date().toISOString(),
      updated_at: req.body.created_at || new Date().toISOString(),
    });
    res.status(201).json({ ok: true });
  }));

  app.put("/api/event/:eventId/help-request/:id", wrap(async (req, res) => {
    await updateHelpRequestStatusPerTeam(req.params.id, {
      status: req.body?.status,
      payloadPatch: req.body?.payload,
    });
    res.json({ ok: true });
  }));

  app.get("/api/event/:eventId/help-request", wrap(async (req, res) => {
    res.json(
      await listHelpRequestsPerTeam({
        event_id: req.params.eventId,
        status: req.query.status,
        limit: Number.parseInt(req.query.limit, 10) || 100,
      }),
    );
  }));
}

bindPerTeamRoutes(app);

app.listen(port, () => {
  console.log(`LiveKit token server listening on http://localhost:${port}`);
});
