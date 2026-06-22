import "dotenv/config";
import {
  splitEventIntoRows,
  extractExecutions,
  extractTokenLogs,
  extractHelpRequests,
  extractPresence,
} from "./migration/transform.mjs";

const APP_STATE_KEY = "techhall-v1";

function readEnv() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL e SUPABASE_ANON_KEY precisam estar configurados.");
  }
  return { url: url.replace(/\/+$/, ""), anonKey };
}

async function call(env, pathname, options = {}) {
  const response = await fetch(`${env.url}${pathname}`, {
    method: options.method || "GET",
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${env.anonKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${pathname} → ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function loadAppState(env) {
  const rows = await call(env, `/rest/v1/app_state?id=eq.${APP_STATE_KEY}&select=payload`);
  if (!rows?.length) throw new Error(`app_state ${APP_STATE_KEY} não encontrado.`);
  const events = rows[0].payload?.events;
  if (!Array.isArray(events)) {
    throw new Error(`app_state ${APP_STATE_KEY}.payload.events não é um array.`);
  }
  return events;
}

async function insertMany(env, table, rows, { chunkSize = 200 } = {}) {
  if (!rows.length) return { inserted: 0 };
  for (let i = 0; i < rows.length; i += chunkSize) {
    await call(env, `/rest/v1/${table}`, {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: rows.slice(i, i + chunkSize),
    });
  }
  return { inserted: rows.length };
}

async function migrateEvent(env, event, { dryRun }) {
  const { eventRow, teamRows } = splitEventIntoRows(event);
  const executions = extractExecutions(event);
  const tokenLogs = extractTokenLogs(event);
  const helpRequests = extractHelpRequests(event);
  const presence = extractPresence(event);

  const summary = {
    event_id: event.id,
    counts: {
      event_state: 1,
      team_state: teamRows.length,
      executions: executions.length,
      token_operational_logs: tokenLogs.length,
      help_requests: helpRequests.length,
      team_presence: presence.length,
    },
  };

  if (dryRun) return summary;

  await insertMany(env, "event_state", [eventRow]);
  await insertMany(env, "team_state", teamRows);
  await insertMany(env, "executions", executions);
  await insertMany(env, "token_operational_logs", tokenLogs);
  await insertMany(env, "help_requests", helpRequests);
  await insertMany(env, "team_presence", presence);

  return summary;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = !args.has("--apply");

  const env = readEnv();
  const events = await loadAppState(env);

  const summaries = [];
  for (const event of events) {
    summaries.push(await migrateEvent(env, event, { dryRun }));
  }

  const totals = summaries.reduce(
    (acc, s) => {
      for (const [k, v] of Object.entries(s.counts)) acc[k] = (acc[k] || 0) + v;
      return acc;
    },
    {},
  );

  console.log(JSON.stringify({ dryRun, events: summaries, totals }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
