import { createOpenAIResponseStream } from "../../../lib/backend.mjs";
import { readJsonBody, sendError } from "../../../lib/api-response.mjs";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      res.status(405).send("Metodo nao permitido.");
      return;
    }

    const body = await readJsonBody(req);
    const upstream = await createOpenAIResponseStream(body || {});

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of upstream.body) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    sendError(res, error);
  }
}
