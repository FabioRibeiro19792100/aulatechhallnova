import { getRuntimeConfig } from "../../lib/backend.mjs";
import { sendError } from "../../lib/api-response.mjs";

export default async function handler(_req, res) {
  try {
    res.status(200).json(await getRuntimeConfig());
  } catch (error) {
    sendError(res, error);
  }
}
