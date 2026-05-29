import { upsertPresence } from "../../../../../lib/per-team-backend.mjs";
import { readJsonBody, sendError } from "../../../../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      res.status(405).send("Metodo nao permitido.");
      return;
    }
    const { eventId, teamIdx } = req.query;
    const idx = Number.parseInt(teamIdx, 10);
    const body = (await readJsonBody(req)) || {};
    await upsertPresence({
      event_id: eventId,
      team_idx: idx,
      member_name: `${body.member_name || ""}`,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
}
