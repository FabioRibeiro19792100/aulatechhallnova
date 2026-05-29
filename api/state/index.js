import { getRemoteAppState, saveRemoteAppState } from "../../lib/backend.mjs";
import { readJsonBody, sendError } from "../../lib/api-response.mjs";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      const state = await getRemoteAppState();
      const etag = `"${state.updatedAt}"`;
      res.setHeader("ETag", etag);
      if (req.headers["if-none-match"] === etag) {
        res.status(304).end();
        return;
      }
      res.status(200).json(state);
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
