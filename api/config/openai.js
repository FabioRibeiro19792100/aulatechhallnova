import { removeOpenAIKey, saveOpenAIKey } from "../../lib/backend.mjs";
import { readJsonBody, sendError } from "../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      res.status(200).json(await saveOpenAIKey(body?.apiKey));
      return;
    }

    if (req.method === "DELETE") {
      res.status(200).json(await removeOpenAIKey());
      return;
    }

    res.setHeader("Allow", "POST, DELETE");
    res.status(405).send("Metodo nao permitido.");
  } catch (error) {
    sendError(res, error);
  }
}
