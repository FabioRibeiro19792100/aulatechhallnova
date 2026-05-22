import { getRuntimeConfig } from "../lib/backend.mjs";
import { sendError } from "../lib/api-response.mjs";

export default async function handler(_req, res) {
  try {
    const runtimeConfig = await getRuntimeConfig();
    res.status(200).json({
      ok: true,
      ...runtimeConfig,
    });
  } catch (error) {
    sendError(res, error);
  }
}
