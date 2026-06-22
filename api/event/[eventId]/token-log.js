import { insertTokenLog, listTokenLogs } from "../../../lib/per-team-backend.mjs";
import { readJsonBody, sendError } from "../../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    const { eventId } = req.query;
    if (req.method === "GET") {
      const team_idx = req.query.team_idx ? Number(req.query.team_idx) : null;
      const limit = Number.parseInt(req.query.limit, 10) || 200;
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(await listTokenLogs({ event_id: eventId, team_idx, limit }));
      return;
    }
    if (req.method === "POST") {
      const body = (await readJsonBody(req)) || {};
      const id = `${body.id || `tl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`}`;
      await insertTokenLog({
        id,
        event_id: eventId,
        team_idx: body.team_idx ?? null,
        mission_id: body.mission_id || null,
        payload: body.payload || {},
        created_at: body.created_at || new Date().toISOString(),
      });
      res.status(201).json({ ok: true, id });
      return;
    }
    res.setHeader("Allow", "GET, POST");
    res.status(405).send("Metodo nao permitido.");
  } catch (err) {
    sendError(res, err);
  }
}
