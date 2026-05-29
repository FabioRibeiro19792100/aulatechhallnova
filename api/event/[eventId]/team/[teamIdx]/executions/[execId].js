import { patchExecutionPayload } from "../../../../../../lib/per-team-backend.mjs";
import { readJsonBody, sendError } from "../../../../../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    if (req.method !== "PATCH") {
      res.setHeader("Allow", "PATCH");
      res.status(405).send("Metodo nao permitido.");
      return;
    }
    const body = (await readJsonBody(req)) || {};
    await patchExecutionPayload(req.query.execId, body.payload_patch || {});
    res.status(200).json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
}
