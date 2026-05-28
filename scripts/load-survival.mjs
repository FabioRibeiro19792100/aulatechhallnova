import { performance } from "node:perf_hooks";

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

function toInt(value, fallback) {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function toMs(value) {
  return `${value.toFixed(1)}ms`;
}

function percentile(values, target) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((target / 100) * sorted.length) - 1));
  return sorted[index];
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildScenario(kind, prompt, baseUrl) {
  const trimmedBaseUrl = `${baseUrl || ""}`.replace(/\/+$/, "");
  if (kind === "page") {
    return {
      label: "Survival page load",
      url: `${trimmedBaseUrl}/survival`,
      requestInit: {
        method: "GET",
      },
    };
  }

  const isCoding = kind === "coding" || kind === "stream-coding";
  const isStream = kind === "stream-chat" || kind === "stream-coding";
  const model = isCoding ? "gpt-5.1-codex-mini" : "gpt-4.1-mini";
  const instructions = isCoding
    ? "Voce esta em modo survival coding. Responda em portugues do Brasil com foco tecnico e conciso."
    : "Voce esta em modo survival chat. Responda em portugues do Brasil com foco claro e conciso.";
  const input = [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text:
            prompt ||
            (isCoding
              ? "Explique em cinco linhas como validar a concorrencia de um endpoint HTTP e sugira um teste simples."
              : "Explique em cinco linhas como validar a concorrencia de um endpoint HTTP."),
        },
      ],
    },
  ];

  return {
    label: isStream ? "Survival OpenAI stream" : "Survival OpenAI response",
    url: `${trimmedBaseUrl}${isStream ? "/api/openai/responses/stream" : "/api/openai/responses"}`,
    requestInit: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: isStream ? "text/event-stream" : "application/json",
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        ...(isCoding ? { reasoningEffort: "medium" } : {}),
      }),
    },
  };
}

async function runOneRequest(scenario) {
  const startedAt = performance.now();
  let status = 0;
  try {
    const response = await fetch(scenario.url, scenario.requestInit);
    status = response.status;
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${status} ${body.slice(0, 240)}`);
    }

    if (scenario.requestInit.method === "GET") {
      await response.arrayBuffer();
    } else if (scenario.url.endsWith("/stream")) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error("stream body indisponivel");
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    } else {
      await response.json();
    }

    return {
      ok: true,
      status,
      durationMs: performance.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      status,
      durationMs: performance.now() - startedAt,
      error: error?.message || "erro desconhecido",
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const kind = `${args.kind || "chat"}`.toLowerCase();
  const concurrency = toInt(args.concurrency, 5);
  const requests = toInt(args.requests, 20);
  const baseUrl =
    args.baseUrl ||
    (kind === "page" ? "http://127.0.0.1:5178" : "http://127.0.0.1:8787");
  const scenario = buildScenario(kind, args.prompt, baseUrl);

  const queue = Array.from({ length: requests }, (_, index) => index);
  const results = [];
  const startedAt = performance.now();

  async function worker() {
    while (queue.length) {
      queue.shift();
      const result = await runOneRequest(scenario);
      results.push(result);
      const marker = result.ok ? "ok" : "xx";
      const statusLabel = result.status || "ERR";
      process.stdout.write(`[${marker} ${statusLabel} ${toMs(result.durationMs)}] `);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, () => worker()));
  process.stdout.write("\n");

  const totalDurationMs = performance.now() - startedAt;
  const successful = results.filter((result) => result.ok);
  const failures = results.filter((result) => !result.ok);
  const timings = successful.map((result) => result.durationMs);
  const statusCounts = results.reduce((acc, result) => {
    const key = `${result.status || "ERR"}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log(`\nScenario: ${scenario.label}`);
  console.log(`Target: ${scenario.url}`);
  console.log(`Requests: ${requests}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Total wall time: ${toMs(totalDurationMs)}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failures.length}`);
  console.log(`Status counts: ${JSON.stringify(statusCounts)}`);

  if (timings.length) {
    console.log(`Latency avg: ${toMs(average(timings))}`);
    console.log(`Latency p50: ${toMs(percentile(timings, 50))}`);
    console.log(`Latency p95: ${toMs(percentile(timings, 95))}`);
    console.log(`Latency max: ${toMs(Math.max(...timings))}`);
  }

  if (failures.length) {
    console.log("\nFailure samples:");
    failures.slice(0, 5).forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.error}`);
    });
  }

  if (failures.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
