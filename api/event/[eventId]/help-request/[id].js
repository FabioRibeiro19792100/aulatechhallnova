import { updateHelpRequestStatus } from "../../../../lib/per-team-backend.mjs";
import { readJsonBody, sendError } from "../../../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    if (req.method !== "PUT") {
      res.setHeader("Allow", "PUT");
      res.status(405).send("Metodo nao permitido.");
      return;
    }
    const body = (await readJsonBody(req)) || {};
    await updateHelpRequestStatus(req.query.id, {
      status: body.status,
      payloadPatch: body.payload,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
}
