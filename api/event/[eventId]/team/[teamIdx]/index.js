import { getTeamState, putTeamStateOCC } from "../../../../../lib/per-team-backend.mjs";
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
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(await getTeamState(eventId, idx));
      return;
    }
    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      if (!body || typeof body.expected_version !== "number") {
        const err = new Error("expected_version obrigatorio.");
        err.statusCode = 400;
        throw err;
      }
      res.status(200).json(await putTeamStateOCC(eventId, idx, body));
      return;
    }
    res.setHeader("Allow", "GET, PUT");
    res.status(405).send("Metodo nao permitido.");
  } catch (err) {
    if (err.statusCode === 409 && err.body) {
      res.status(409).json(err.body);
      return;
    }
    sendError(res, err);
  }
}
