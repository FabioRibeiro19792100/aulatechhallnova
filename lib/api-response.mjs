export async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", resolve);
    req.on("error", reject);
  });

  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("JSON invalido no corpo da requisicao.");
    error.statusCode = 400;
    throw error;
  }
}

export function sendError(res, error) {
  const statusCode = error?.statusCode || 500;
  res.status(statusCode).send(error?.message || "Falha inesperada.");
}
