import { listEvents } from "../../lib/per-team-backend.mjs";
import { sendError } from "../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      res.status(405).send("Metodo nao permitido.");
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await listEvents());
  } catch (err) {
    sendError(res, err);
  }
}
