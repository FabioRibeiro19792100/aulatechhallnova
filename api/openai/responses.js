import { createOpenAIResponse } from "../../lib/backend.mjs";
import { readJsonBody, sendError } from "../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      res.status(405).send("Metodo nao permitido.");
      return;
    }

    const body = await readJsonBody(req);
    const responseText = await createOpenAIResponse(body || {});
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(responseText);
  } catch (error) {
    sendError(res, error);
  }
}
