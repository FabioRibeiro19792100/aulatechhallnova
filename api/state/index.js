import { getRemoteAppState, saveRemoteAppState } from "../../lib/backend.mjs";
import { readJsonBody, sendError } from "../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.status(200).json(await getRemoteAppState());
      return;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      res.status(200).json(await saveRemoteAppState(body || {}));
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).send("Metodo nao permitido.");
  } catch (error) {
    sendError(res, error);
  }
}
