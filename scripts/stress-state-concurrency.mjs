import { performance } from "node:perf_hooks";
import { setTimeout as sleep } from "node:timers/promises";
import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

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

function toFloat(value, fallback) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function ms(value) {
  return `${value.toFixed(1)}ms`;
}

function pct(values, target) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((target / 100) * sorted.length) - 1));
  return sorted[index];
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function printUsage() {
  console.log(`Usage:
  node scripts/stress-state-concurrency.mjs --base-url <url> [options]

Required:
  --base-url <url>        Base URL of the running server (e.g. https://app.example.com).

Scheduler (how writes are dispatched):
  --scheduler <name>      rate    - fire at fixed --target-rps regardless of completion
                                    latency (default; recommended for high rps).
                          client  - per-client loop. Each client awaits its POST before
                                    sleeping the interval. Throughput capped at
                                    1 / saveLatency per client (matches App.jsx behaviour).
                          serial  - one POST at a time. Control case. Forces clients=1.
  --max-in-flight <N>     Cap for rate scheduler. When reached, fires are counted as
                          skipped rather than queued. Default: 200.

Write strategy (how each POST builds its body):
  --mode <name>           blind   - re-use a fixed snapshot. Maximises clobbering.
                                    Mimics commitCriticalEventsDirect in App.jsx. (default)
                          refetch - GET before each POST, overlay the entry on the latest.
                                    Mimics the debounced effect WITHOUT per-field merge.

Workload:
  --clients <N>           Virtual client count (round-robin in rate mode). Default: 20.
  --events <N>            Synthetic test events to spread writes across. Default: 4.
                          Ignored when --event-id is provided.
  --target-rps <N>        Aggregate target writes per second. Default: 100.
  --duration-s <N>        Test duration in seconds. Default: 30.
  --jitter <0..1>         Random jitter on per-client interval (client scheduler only).
                          Default: 0.25.

Discovery / safety:
  --list-events           Fetch the live state and print every event id+name, then exit.
  --event-id <id>         Skip synthetic event creation, write entries onto this real
                          event id instead. Other events still ride along on every POST.
  --reset-target-entries  Strip stressEntries from --event-id at start so per-run loss is
                          measurable without leftovers from previous runs.
  --dry-run               Run probes and print the plan but do not write anything.
  --i-am-sure             Required to perform writes when --base-url is non-local.
  --keep-events           Skip cleanup of synthetic events at end.

Output:
  Writes stress-baseline-<runId>.json and stress-report-<runId>.json to the CWD.
  Exits with code 2 if any accepted writes were lost.
`);
}

async function fetchState(baseUrl) {
  const response = await fetch(`${baseUrl}/api/state?ts=${Date.now()}`, {
    headers: { "cache-control": "no-store" },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET /api/state -> ${response.status} ${text.slice(0, 240)}`);
  }
  return response.json();
}

async function postState(baseUrl, events) {
  const startedAt = performance.now();
  let response;
  let networkError = null;
  try {
    response = await fetch(`${baseUrl}/api/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
  } catch (error) {
    networkError = error;
  }
  const durationMs = performance.now() - startedAt;
  if (networkError) {
    return { status: 0, durationMs, bodyText: `${networkError?.message || networkError}` };
  }
  let bodyText = "";
  try {
    bodyText = await response.text();
  } catch {}
  return { status: response.status, durationMs, bodyText };
}

async function saveStateOrThrow(baseUrl, events) {
  const result = await postState(baseUrl, events);
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`POST /api/state -> ${result.status} ${result.bodyText.slice(0, 240)}`);
  }
  return result;
}

async function fetchConfig(baseUrl) {
  const response = await fetch(`${baseUrl}/api/config`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET /api/config -> ${response.status} ${text.slice(0, 240)}`);
  }
  return response.json();
}

function isLocalUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1";
  } catch {
    return false;
  }
}

function buildSyntheticEvent(eventId, runId, index) {
  const nowIso = new Date().toISOString();
  return {
    id: eventId,
    name: `[STRESSTEST ${runId} #${index}]`,
    status: "draft",
    eventMode: "missions",
    hiddenAt: nowIso,
    hiddenReason: "stresstest",
    createdAt: nowIso,
    updatedAt: nowIso,
    teams: [],
    missions: [],
    execucoes: {},
    reflexoes: {},
    questionariosPendentes: {},
    conclusoes: {},
    missionGlossaries: {},
    missionTokenPolicies: {},
    tokenGrants: [],
    tokenOperationalLogs: [],
    helpRequests: [],
    helpDisabledMap: {},
    anamnesisResponses: {},
    missionResets: {},
    trainingRuns: {},
    trainingHelpRequests: [],
    announcements: [],
    presenceMap: {},
    sessionTimer: null,
    sessionTimerNotice: null,
    screenShare: null,
    stressEntries: [],
    stressRunId: runId,
  };
}

function appendStressEntry(events, targetEventId, entry) {
  return events.map((event) => {
    if (event.id !== targetEventId) return event;
    const previous = Array.isArray(event.stressEntries) ? event.stressEntries : [];
    return {
      ...event,
      stressEntries: [...previous, entry],
      updatedAt: new Date().toISOString(),
    };
  });
}

function stripStressEntries(events, targetEventId) {
  return events.map((event) => {
    if (event.id !== targetEventId) return event;
    const { stressEntries: _drop, ...rest } = event;
    return { ...rest, stressEntries: [] };
  });
}

async function resetTargetEntries(baseUrl, targetEventId) {
  const state = await fetchState(baseUrl);
  const exists = (state.events || []).some((event) => event.id === targetEventId);
  if (!exists) throw new Error(`event ${targetEventId} not found while resetting entries`);
  const cleaned = stripStressEntries(state.events || [], targetEventId);
  await saveStateOrThrow(baseUrl, cleaned);
}

async function setupSyntheticEvents(baseUrl, runId, count) {
  console.log(`[setup] creating ${count} synthetic event(s)`);
  const created = [];
  for (let index = 0; index < count; index += 1) {
    const eventId = `stresstest_${runId}_e${index}`;
    const refreshed = await fetchState(baseUrl);
    const others = (refreshed.events || []).filter((existing) => existing.id !== eventId);
    const nextEvents = [...others, buildSyntheticEvent(eventId, runId, index)];
    await saveStateOrThrow(baseUrl, nextEvents);
    created.push(eventId);
  }
  return created;
}

async function cleanupSyntheticEvents(baseUrl, eventIds) {
  console.log(`[cleanup] removing ${eventIds.length} synthetic event(s)`);
  try {
    const state = await fetchState(baseUrl);
    const filtered = (state.events || []).filter((event) => !eventIds.includes(event.id));
    await saveStateOrThrow(baseUrl, filtered);
    console.log("[cleanup] done");
  } catch (error) {
    console.error("[cleanup] failed:", error?.message || error);
  }
}

function createStats(clientCount, targetEventIds) {
  return {
    attempted: 0,
    accepted: 0,
    conflict: 0,
    errored: 0,
    skipped: 0,
    inFlightPeak: 0,
    latencies: [],
    statusCounts: new Map(),
    sampleErrors: [],
    attemptedByClient: Array.from({ length: clientCount }, () => new Set()),
    acceptedByClient: Array.from({ length: clientCount }, () => new Set()),
    attemptedByEvent: new Map(targetEventIds.map((id) => [id, new Set()])),
    acceptedByEvent: new Map(targetEventIds.map((id) => [id, new Set()])),
  };
}

function recordResult(stats, clientIdx, targetEventId, entryId, result) {
  stats.latencies.push(result.durationMs);
  const status = result.status;
  stats.statusCounts.set(status, (stats.statusCounts.get(status) || 0) + 1);
  if (status >= 200 && status < 300) {
    stats.accepted += 1;
    stats.acceptedByClient[clientIdx].add(entryId);
    stats.acceptedByEvent.get(targetEventId).add(entryId);
  } else if (status === 409) {
    stats.conflict += 1;
  } else {
    stats.errored += 1;
    if (stats.sampleErrors.length < 5) {
      stats.sampleErrors.push({ status, body: (result.bodyText || "").slice(0, 200) });
    }
  }
}

function buildEntry(runId, clientIdx, seq) {
  const entryId = `stress_${runId}_c${clientIdx}_s${seq}_${randomUUID().slice(0, 8)}`;
  return {
    entryId,
    payload: {
      id: entryId,
      seq,
      clientId: `c${clientIdx}`,
      ts: new Date().toISOString(),
    },
  };
}

async function fireOnce({ baseUrl, mode, snapshotRef, targetEventId, entry }) {
  let snapshot = snapshotRef.value;
  if (mode === "refetch") {
    try {
      snapshot = await fetchState(baseUrl);
    } catch (error) {
      return { status: 0, durationMs: 0, bodyText: `refetch failed: ${error?.message || error}` };
    }
  }
  const nextEvents = appendStressEntry(snapshot.events || [], targetEventId, entry.payload);
  return postState(baseUrl, nextEvents);
}

async function runRateScheduler({
  baseUrl,
  mode,
  runId,
  targetRps,
  durationS,
  maxInFlight,
  clientCount,
  targetEventIds,
  snapshotRef,
  stats,
}) {
  const intervalMs = 1000 / targetRps;
  const stopAt = Date.now() + durationS * 1000;
  const inFlight = new Set();
  const seqByClient = new Array(clientCount).fill(0);
  let fireCount = 0;
  let nextDeadline = performance.now();

  while (Date.now() < stopAt) {
    if (inFlight.size >= maxInFlight) {
      stats.skipped += 1;
      await sleep(intervalMs);
      nextDeadline = performance.now() + intervalMs;
      continue;
    }

    const clientIdx = fireCount % clientCount;
    seqByClient[clientIdx] += 1;
    const seq = seqByClient[clientIdx];
    const targetEventId = targetEventIds[clientIdx % targetEventIds.length];
    const entry = buildEntry(runId, clientIdx, seq);

    stats.attempted += 1;
    stats.attemptedByClient[clientIdx].add(entry.entryId);
    stats.attemptedByEvent.get(targetEventId).add(entry.entryId);

    const promise = fireOnce({ baseUrl, mode, snapshotRef, targetEventId, entry })
      .then((result) => recordResult(stats, clientIdx, targetEventId, entry.entryId, result))
      .catch(() => {
        stats.errored += 1;
      })
      .finally(() => inFlight.delete(promise));

    inFlight.add(promise);
    if (inFlight.size > stats.inFlightPeak) stats.inFlightPeak = inFlight.size;
    fireCount += 1;

    nextDeadline += intervalMs;
    const sleepMs = nextDeadline - performance.now();
    if (sleepMs > 0) await sleep(sleepMs);
  }

  console.log(`[run] producer stopped at attempted=${stats.attempted} inFlight=${inFlight.size}; awaiting completions`);
  await Promise.allSettled([...inFlight]);
}

async function runClientLoop({
  baseUrl,
  mode,
  runId,
  clientCount,
  targetRps,
  durationS,
  jitter,
  targetEventIds,
  initialSnapshot,
  stats,
}) {
  const perClientIntervalMs = 1000 / (targetRps / clientCount);
  const stopAt = Date.now() + durationS * 1000;

  await Promise.all(
    Array.from({ length: clientCount }, async (_, clientIdx) => {
      const snapshotRef = { value: initialSnapshot };
      const targetEventId = targetEventIds[clientIdx % targetEventIds.length];
      let seq = 0;
      while (Date.now() < stopAt) {
        seq += 1;
        const entry = buildEntry(runId, clientIdx, seq);
        stats.attempted += 1;
        stats.attemptedByClient[clientIdx].add(entry.entryId);
        stats.attemptedByEvent.get(targetEventId).add(entry.entryId);

        const result = await fireOnce({ baseUrl, mode, snapshotRef, targetEventId, entry });
        recordResult(stats, clientIdx, targetEventId, entry.entryId, result);

        if (result.status >= 200 && result.status < 300 && mode !== "refetch") {
          snapshotRef.value = { events: appendStressEntry(snapshotRef.value.events || [], targetEventId, entry.payload) };
        }

        const drift = (Math.random() * 2 - 1) * jitter * perClientIntervalMs;
        const waitMs = Math.max(0, perClientIntervalMs + drift);
        if (waitMs > 0) await sleep(waitMs);
      }
    }),
  );
}

async function runSerial({ baseUrl, mode, runId, targetRps, durationS, targetEventIds, stats }) {
  const totalWrites = Math.max(1, Math.round(targetRps * durationS));
  console.log(`[run] scheduler=serial writes=${totalWrites}`);
  const snapshotRef = { value: await fetchState(baseUrl) };
  for (let index = 0; index < totalWrites; index += 1) {
    const targetEventId = targetEventIds[index % targetEventIds.length];
    const entry = buildEntry(runId, 0, index + 1);
    stats.attempted += 1;
    stats.attemptedByClient[0].add(entry.entryId);
    stats.attemptedByEvent.get(targetEventId).add(entry.entryId);

    const result = await fireOnce({ baseUrl, mode, snapshotRef, targetEventId, entry });
    recordResult(stats, 0, targetEventId, entry.entryId, result);

    if (result.status >= 200 && result.status < 300) {
      snapshotRef.value = { events: appendStressEntry(snapshotRef.value.events || [], targetEventId, entry.payload) };
    } else if (mode === "refetch") {
      try {
        snapshotRef.value = await fetchState(baseUrl);
      } catch {}
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    printUsage();
    return;
  }

  const baseUrlRaw = `${args["base-url"] || ""}`.trim();
  if (!baseUrlRaw) {
    printUsage();
    console.error("\n[error] --base-url is required.");
    process.exitCode = 1;
    return;
  }
  const baseUrl = baseUrlRaw.replace(/\/+$/, "");

  if (args["list-events"]) {
    const state = await fetchState(baseUrl);
    const events = (state.events || []).map((event) => ({
      id: event.id,
      name: event.name,
      status: event.status,
      hidden: Boolean(event.hiddenAt),
      teams: (event.teams || []).length,
      stressEntries: Array.isArray(event.stressEntries) ? event.stressEntries.length : 0,
      updatedAt: event.updatedAt || null,
    }));
    console.log(JSON.stringify(events, null, 2));
    return;
  }

  const scheduler = `${args.scheduler || "rate"}`.toLowerCase();
  if (!["rate", "client", "serial"].includes(scheduler)) {
    console.error(`[error] unknown --scheduler ${scheduler}. Use rate|client|serial.`);
    process.exitCode = 1;
    return;
  }
  const mode = `${args.mode || "blind"}`.toLowerCase();
  if (!["blind", "refetch"].includes(mode)) {
    console.error(`[error] unknown --mode ${mode}. Use blind|refetch.`);
    process.exitCode = 1;
    return;
  }

  const clientCount = scheduler === "serial" ? 1 : toInt(args.clients, 20);
  const eventCount = toInt(args.events, 4);
  const targetRps = toFloat(args["target-rps"], 100);
  const duration = toFloat(args["duration-s"], 30);
  const jitter = Math.min(1, Math.max(0, toFloat(args.jitter, 0.25)));
  const maxInFlight = toInt(args["max-in-flight"], 200);

  const runId = `${Date.now().toString(36)}_${randomUUID().slice(0, 6)}`;
  const dryRun = Boolean(args["dry-run"]);
  const reuseEventId = `${args["event-id"] || ""}`.trim();
  const shouldResetTarget = Boolean(args["reset-target-entries"]);

  console.log("[probe] checking server config");
  const config = await fetchConfig(baseUrl);
  console.log(`[probe] sharedStateConfigured=${config.sharedStateConfigured} supabase=${config.supabaseConfigured} deployment=${config.deploymentTarget}`);
  if (!config.sharedStateConfigured) {
    console.error("[error] target server has no shared state configured. Aborting.");
    process.exitCode = 1;
    return;
  }

  console.log("[probe] fetching baseline state");
  const baselineStart = performance.now();
  const baseline = await fetchState(baseUrl);
  const baselineBytes = JSON.stringify(baseline).length;
  const baselineGetMs = performance.now() - baselineStart;
  const baselineFile = `stress-baseline-${runId}.json`;
  await writeFile(baselineFile, JSON.stringify(baseline, null, 2));
  console.log(`[probe] baseline events=${(baseline.events || []).length} bytes=${baselineBytes} get_ms=${baselineGetMs.toFixed(0)} saved=${baselineFile}`);

  if (!isLocalUrl(baseUrl) && !args["i-am-sure"] && !dryRun) {
    console.error(`[abort] --base-url ${baseUrl} is not local. Add --i-am-sure to confirm.`);
    process.exitCode = 1;
    return;
  }

  const plan = {
    runId,
    baseUrl,
    scheduler,
    mode,
    clientCount,
    eventCount,
    targetRps,
    duration,
    maxInFlight,
    jitter,
    estimatedWrites: Math.round(targetRps * duration),
    payloadBytes: baselineBytes,
  };
  console.log("[plan]", JSON.stringify(plan, null, 2));

  if (dryRun) {
    console.log("[dry-run] no writes will be made. exiting.");
    return;
  }

  let targetEventIds = [];
  let createdEventIds = [];
  if (reuseEventId) {
    const exists = (baseline.events || []).some((event) => event.id === reuseEventId);
    if (!exists) {
      console.error(`[error] --event-id ${reuseEventId} not found in current state.`);
      process.exitCode = 1;
      return;
    }
    targetEventIds = [reuseEventId];
    console.log(`[setup] reusing existing event id=${reuseEventId}`);
    if (shouldResetTarget) {
      console.log(`[setup] stripping stressEntries from ${reuseEventId}`);
      await resetTargetEntries(baseUrl, reuseEventId);
    }
  } else {
    createdEventIds = await setupSyntheticEvents(baseUrl, runId, eventCount);
    targetEventIds = createdEventIds;
  }

  let interrupted = false;
  const handleSignal = async () => {
    if (interrupted) return;
    interrupted = true;
    console.log("\n[signal] interrupt received - cleaning up");
    if (!args["keep-events"] && createdEventIds.length) {
      await cleanupSyntheticEvents(baseUrl, createdEventIds);
    }
    process.exit(130);
  };
  process.on("SIGINT", handleSignal);
  process.on("SIGTERM", handleSignal);

  const stats = createStats(clientCount, targetEventIds);
  const initialSnapshot = await fetchState(baseUrl);
  const snapshotRef = { value: initialSnapshot };
  const startedAt = performance.now();

  const progressTimer = setInterval(() => {
    const elapsedSec = (performance.now() - startedAt) / 1000;
    const rate = stats.attempted / Math.max(elapsedSec, 0.001);
    console.log(
      `[progress] elapsed=${elapsedSec.toFixed(1)}s attempted=${stats.attempted} accepted=${stats.accepted} conflict=${stats.conflict} errored=${stats.errored} skipped=${stats.skipped} inflight=${stats.inFlightPeak} rate=${rate.toFixed(1)}/s`,
    );
  }, 2000);

  if (scheduler === "rate") {
    console.log(`[run] scheduler=rate mode=${mode} clients=${clientCount} target_rps=${targetRps} max_in_flight=${maxInFlight}`);
    await runRateScheduler({
      baseUrl,
      mode,
      runId,
      targetRps,
      durationS: duration,
      maxInFlight,
      clientCount,
      targetEventIds,
      snapshotRef,
      stats,
    });
  } else if (scheduler === "client") {
    console.log(`[run] scheduler=client mode=${mode} clients=${clientCount} per_client_interval=${(1000 / (targetRps / clientCount)).toFixed(1)}ms`);
    await runClientLoop({
      baseUrl,
      mode,
      runId,
      clientCount,
      targetRps,
      durationS: duration,
      jitter,
      targetEventIds,
      initialSnapshot,
      stats,
    });
  } else {
    await runSerial({
      baseUrl,
      mode,
      runId,
      targetRps,
      durationS: duration,
      targetEventIds,
      stats,
    });
  }

  clearInterval(progressTimer);

  const wallSeconds = (performance.now() - startedAt) / 1000;
  console.log(
    `[run] complete attempted=${stats.attempted} accepted=${stats.accepted} conflict=${stats.conflict} errored=${stats.errored} skipped=${stats.skipped} wall=${wallSeconds.toFixed(1)}s`,
  );

  console.log("[check] re-fetching final state");
  const finalState = await fetchState(baseUrl);

  const perEventReport = targetEventIds.map((eventId) => {
    const acceptedIds = stats.acceptedByEvent.get(eventId) || new Set();
    const attemptedIds = stats.attemptedByEvent.get(eventId) || new Set();
    const event = finalState.events.find((candidate) => candidate.id === eventId);
    const observedIds = new Set((event?.stressEntries || []).map((entry) => entry.id));
    let survived = 0;
    for (const id of acceptedIds) if (observedIds.has(id)) survived += 1;
    const lost = acceptedIds.size - survived;
    return {
      eventId,
      attempted: attemptedIds.size,
      accepted: acceptedIds.size,
      observed: observedIds.size,
      survived,
      lost,
      lossRate: acceptedIds.size ? lost / acceptedIds.size : 0,
    };
  });

  const perClientReport = stats.attemptedByClient.map((attemptedSet, clientIdx) => {
    const targetEventId = targetEventIds[clientIdx % targetEventIds.length];
    const event = finalState.events.find((candidate) => candidate.id === targetEventId);
    const observedIds = new Set((event?.stressEntries || []).map((entry) => entry.id));
    const acceptedSet = stats.acceptedByClient[clientIdx];
    let survived = 0;
    for (const id of acceptedSet) if (observedIds.has(id)) survived += 1;
    const lost = acceptedSet.size - survived;
    return {
      clientIdx,
      eventId: targetEventId,
      attempted: attemptedSet.size,
      accepted: acceptedSet.size,
      lost,
      lossRate: acceptedSet.size ? lost / acceptedSet.size : 0,
    };
  });

  const totalAccepted = stats.accepted;
  const totalSurvived = perEventReport.reduce((sum, row) => sum + row.survived, 0);
  const totalLost = totalAccepted - totalSurvived;
  const lossRate = totalAccepted ? totalLost / totalAccepted : 0;

  const statusBreakdown = Object.fromEntries([...stats.statusCounts.entries()].sort());

  const report = {
    runId,
    baseUrl,
    scheduler,
    mode,
    clientCount,
    targetRps,
    actualRps: stats.attempted / Math.max(wallSeconds, 0.001),
    acceptRps: stats.accepted / Math.max(wallSeconds, 0.001),
    durationS: wallSeconds,
    payloadBytes: baselineBytes,
    counts: {
      attempted: stats.attempted,
      accepted: stats.accepted,
      conflict: stats.conflict,
      errored: stats.errored,
      skipped: stats.skipped,
      inFlightPeak: stats.inFlightPeak,
    },
    statusBreakdown,
    latency: {
      avgMs: avg(stats.latencies),
      p50Ms: pct(stats.latencies, 50),
      p95Ms: pct(stats.latencies, 95),
      p99Ms: pct(stats.latencies, 99),
      maxMs: stats.latencies.length ? Math.max(...stats.latencies) : 0,
    },
    summary: {
      acceptedTotal: totalAccepted,
      survivedTotal: totalSurvived,
      lostTotal: totalLost,
      lossRate,
    },
    perEvent: perEventReport,
    perClient: perClientReport,
    targetEventIds,
    createdEventIds,
    sampleErrors: stats.sampleErrors,
  };

  const reportFile = `stress-report-${runId}.json`;
  await writeFile(reportFile, JSON.stringify(report, null, 2));

  console.log("\n========== STRESS TEST REPORT ==========");
  console.log(`runId: ${runId}`);
  console.log(`scheduler: ${scheduler}  mode: ${mode}  clients: ${clientCount}  events: ${targetEventIds.length}`);
  console.log(`target rps: ${targetRps}  actual attempted rps: ${report.actualRps.toFixed(1)}  accepted rps: ${report.acceptRps.toFixed(1)}`);
  console.log(`attempted: ${stats.attempted}  accepted: ${stats.accepted}  conflict(409): ${stats.conflict}  errored: ${stats.errored}  skipped: ${stats.skipped}  in_flight_peak: ${stats.inFlightPeak}`);
  console.log(`status breakdown: ${JSON.stringify(statusBreakdown)}`);
  console.log(`latency avg=${ms(report.latency.avgMs)} p50=${ms(report.latency.p50Ms)} p95=${ms(report.latency.p95Ms)} p99=${ms(report.latency.p99Ms)} max=${ms(report.latency.maxMs)}`);
  console.log(`payload size on baseline: ${(baselineBytes / 1024).toFixed(0)} KB`);
  console.log(`accepted writes that ended up in DB: ${totalSurvived}/${totalAccepted}`);
  console.log(`DATA LOSS (accepted - survived): ${totalLost}  loss_rate=${(lossRate * 100).toFixed(2)}%`);
  if (stats.sampleErrors.length) {
    console.log("\nSample error responses:");
    for (const sample of stats.sampleErrors) {
      console.log(`  status=${sample.status} body=${sample.body}`);
    }
  }
  console.log("\nPer-event breakdown:");
  for (const row of perEventReport) {
    console.log(`  ${row.eventId}  attempted=${row.attempted}  accepted=${row.accepted}  observed=${row.observed}  survived=${row.survived}  lost=${row.lost}  loss=${(row.lossRate * 100).toFixed(1)}%`);
  }
  console.log(`\nFull report: ${reportFile}`);
  console.log(`Baseline: ${baselineFile}`);

  if (!args["keep-events"] && createdEventIds.length) {
    await cleanupSyntheticEvents(baseUrl, createdEventIds);
  } else if (createdEventIds.length) {
    console.log(`[note] synthetic events kept: ${createdEventIds.join(", ")}`);
  }

  if (totalLost > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error("[fatal]", error?.stack || error?.message || error);
  process.exitCode = 1;
});
