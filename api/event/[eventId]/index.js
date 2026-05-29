import { getEventState, putEventStateOCC } from "../../../lib/per-team-backend.mjs";
import { readJsonBody, sendError } from "../../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    const { eventId } = req.query;
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(await getEventState(eventId));
      return;
    }
    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      if (!body || typeof body.expected_version !== "number") {
        const err = new Error("expected_version obrigatorio.");
        err.statusCode = 400;
        throw err;
      }
      const result = await putEventStateOCC(eventId, body);
      res.status(200).json(result);
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
