import { listExecutions } from "../../../lib/per-team-backend.mjs";
import { sendError } from "../../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      res.status(405).send("Metodo nao permitido.");
      return;
    }
    const limit = Number.parseInt(req.query.limit, 10) || 100;
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await listExecutions({ event_id: req.query.eventId, limit }));
  } catch (err) {
    sendError(res, err);
  }
}
