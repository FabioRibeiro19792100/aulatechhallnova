import { insertHelpRequest, listHelpRequests } from "../../../../lib/per-team-backend.mjs";
import { readJsonBody, sendError } from "../../../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    const { eventId } = req.query;
    if (req.method === "GET") {
      const status = req.query.status || undefined;
      const limit = Number.parseInt(req.query.limit, 10) || 100;
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(await listHelpRequests({ event_id: eventId, status, limit }));
      return;
    }
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (!body?.id || body?.team_idx === undefined) {
        const err = new Error("id e team_idx obrigatorios.");
        err.statusCode = 400;
        throw err;
      }
      await insertHelpRequest({
        id: `${body.id}`,
        event_id: eventId,
        team_idx: Number(body.team_idx),
        mission_id: body.mission_id || null,
        status: body.status || "open",
        payload: body.payload || {},
        created_at: body.created_at || new Date().toISOString(),
        updated_at: body.created_at || new Date().toISOString(),
      });
      res.status(201).json({ ok: true });
      return;
    }
    res.setHeader("Allow", "GET, POST");
    res.status(405).send("Metodo nao permitido.");
  } catch (err) {
    sendError(res, err);
  }
}
