import { listExecutions, insertExecution, deleteTeamExecutions } from "../../../../../lib/per-team-backend.mjs";
import { readJsonBody, sendError } from "../../../../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    const { eventId, teamIdx } = req.query;
    const idx = Number.parseInt(teamIdx, 10);
    if (Number.isNaN(idx)) {
      const err = new Error("teamIdx invalido.");
      err.statusCode = 400;
      throw err;
    }
    if (req.method === "GET") {
      const limit = Number.parseInt(req.query.limit, 10) || 50;
      const mission_id = req.query.mission_id || undefined;
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(await listExecutions({ event_id: eventId, team_idx: idx, mission_id, limit }));
      return;
    }
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (!body?.id || !body?.mission_id) {
        const err = new Error("id e mission_id obrigatorios.");
        err.statusCode = 400;
        throw err;
      }
      await insertExecution({
        id: `${body.id}`,
        event_id: eventId,
        team_idx: idx,
        mission_id: `${body.mission_id}`,
        kind: body.kind || "chat",
        payload: body.payload || {},
        tokens: body.tokens || {},
        custo: body.custo ?? null,
        created_at: body.created_at || new Date().toISOString(),
      });
      res.status(201).json({ ok: true });
      return;
    }
    if (req.method === "DELETE") {
      const mission_id = req.query.mission_id || undefined;
      await deleteTeamExecutions(eventId, idx, mission_id);
      res.status(204).end();
      return;
    }
    res.setHeader("Allow", "GET, POST, DELETE");
    res.status(405).send("Metodo nao permitido.");
  } catch (err) {
    sendError(res, err);
  }
}
