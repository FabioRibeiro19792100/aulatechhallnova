/**
 * Load test: simula N alunos usando a plataforma simultaneamente.
 *
 * Cada aluno executa o ciclo completo:
 *   1. GET  /api/state          — lê estado atual
 *   2. POST /api/openai/...     — chama a IA
 *   3. GET  /api/state          — re-lê para merge antes de escrever
 *   4. POST /api/state          — salva execução de volta no Supabase
 *
 * Ao final verifica se todas as execuções chegaram sem perda (detects race conditions).
 *
 * Uso:
 *   node scripts/load-platform.mjs [opções]
 *
 * Opções:
 *   --students  N      Nº de alunos simultâneos        (padrão: 20)
 *   --eventId   ID     ID do evento a usar             (padrão: primeiro evento encontrado)
 *   --missionId ID     ID da missão a usar             (padrão: primeira missão do evento)
 *   --baseUrl   URL    URL do servidor                 (padrão: http://127.0.0.1:8787)
 *   --dry              Só lê estado, não escreve nada
 *   --cleanup          Remove execuções de teste após rodar
 */

import { performance } from "node:perf_hooks";
import { randomUUID } from "node:crypto";

// ─── helpers ───────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) { parsed[key] = true; continue; }
    parsed[key] = next;
    i++;
  }
  return parsed;
}

function toInt(v, fallback) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function ms(v) { return `${v.toFixed(1)}ms`; }

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function pct(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

function makeExecId() {
  return `load_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// ─── API calls ─────────────────────────────────────────────────────────────

async function fetchState(baseUrl) {
  const t0 = performance.now();
  const res = await fetch(`${baseUrl}/api/state?ts=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /api/state → ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { data, latencyMs: performance.now() - t0 };
}

async function saveState(baseUrl, events) {
  const t0 = performance.now();
  const res = await fetch(`${baseUrl}/api/state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  });
  if (!res.ok) throw new Error(`POST /api/state → ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { data, latencyMs: performance.now() - t0 };
}

async function callAI(baseUrl, missionId) {
  const isCoding = missionId?.includes("coding") || missionId?.includes("programming");
  const t0 = performance.now();
  const res = await fetch(`${baseUrl}/api/openai/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: isCoding ? "gpt-5.1-codex-mini" : "gpt-4.1-mini",
      instructions: isCoding
        ? "Voce esta em teste de carga. Responda em portugues do Brasil com uma frase tecnica curta."
        : "Voce esta em teste de carga. Responda em portugues do Brasil com uma frase curta e direta.",
      input: [{
        role: "user",
        content: [{ type: "input_text", text: "[LOAD TEST] Responda em uma frase." }],
      }],
    }),
  });
  if (!res.ok) throw new Error(`POST /api/openai/responses → ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { data, latencyMs: performance.now() - t0 };
}

// ─── merge helpers (replica da lógica do App.jsx) ──────────────────────────

function mergeByIdField(remote = [], local = [], fields = ["id", "ts"]) {
  const map = new globalThis.Map();
  for (const item of remote) {
    const key = fields.map((f) => item[f]).join("|");
    if (key) map.set(key, item);
  }
  for (const item of local) {
    const key = fields.map((f) => item[f]).join("|");
    if (key && !map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function mergeExecucaoMaps(remote = {}, local = {}) {
  const keys = new Set([...Object.keys(remote), ...Object.keys(local)]);
  return Object.fromEntries(
    [...keys].map((key) => {
      const merged = mergeByIdField(remote[key] || [], local[key] || [], ["id", "ts"]);
      merged.sort((a, b) => new Date(a.ts || 0) - new Date(b.ts || 0));
      return [key, merged];
    }),
  );
}

function mergeEvents(remoteEvents = [], localEvents = []) {
  const byId = new globalThis.Map();
  for (const ev of remoteEvents) byId.set(ev.id, ev);
  for (const ev of localEvents) {
    if (!byId.has(ev.id)) { byId.set(ev.id, ev); continue; }
    const remote = byId.get(ev.id);
    byId.set(ev.id, {
      ...remote,
      ...ev,
      execucoes: mergeExecucaoMaps(remote.execucoes, ev.execucoes),
    });
  }
  return [...byId.values()];
}

// ─── single student simulation ─────────────────────────────────────────────

async function runStudent({ studentId, teamIdx, eventId, missionId, baseUrl, dry }) {
  const timings = {};
  const execId = makeExecId();
  const ts = new Date().toISOString();

  // 1. Lê estado atual
  const read1 = await fetchState(baseUrl);
  timings.read1Ms = read1.latencyMs;
  const remoteEvents1 = read1.data.events || [];

  // 2. Chama a IA
  const ai = await callAI(baseUrl, missionId);
  timings.aiMs = ai.latencyMs;
  const aiOutput = ai.data?.output?.[0]?.content?.[0]?.text
    || ai.data?.output
    || "[sem resposta]";

  if (dry) {
    return { studentId, execId, ok: true, dry: true, timings };
  }

  // Monta o registro de execução
  const execRecord = {
    id: execId,
    ts,
    input: "[LOAD TEST] Responda em uma frase.",
    output: typeof aiOutput === "string" ? aiOutput : JSON.stringify(aiOutput),
    acao: "execucao",
    aiMode: missionId?.includes("coding") ? "coding" : "chat",
    isFreeInstruction: false,
    tokens: ai.data?.usage?.total_tokens || 0,
    inputTokens: ai.data?.usage?.input_tokens || 0,
    outputTokens: ai.data?.usage?.output_tokens || 0,
    custo: 0,
    selectedModel: missionId?.includes("coding") ? "gpt-5.1-codex-mini" : "gpt-4.1-mini",
    effectiveModel: missionId?.includes("coding") ? "gpt-5.1-codex-mini" : "gpt-4.1-mini",
    iterationNumber: 1,
    isLoadTest: true,
  };

  const execKey = `${teamIdx}__${missionId}`;

  // Adiciona execução localmente
  const localEvents = remoteEvents1.map((ev) => {
    if (ev.id !== eventId) return ev;
    const execucoes = { ...(ev.execucoes || {}) };
    execucoes[execKey] = [...(execucoes[execKey] || []), execRecord];
    return { ...ev, execucoes };
  });

  // 3. Re-lê para merge antes de escrever
  const read2 = await fetchState(baseUrl);
  timings.read2Ms = read2.latencyMs;
  const remoteEvents2 = read2.data.events || [];

  // Merge: remoto + local
  const merged = mergeEvents(remoteEvents2, localEvents);

  // 4. Salva
  const save = await saveState(baseUrl, merged);
  timings.saveMs = save.latencyMs;

  return { studentId, execId, ok: true, timings };
}

// ─── cleanup ───────────────────────────────────────────────────────────────

async function cleanupLoadTestExecs(baseUrl, eventId, missionId, teamCount) {
  const { data } = await fetchState(baseUrl);
  const events = (data.events || []).map((ev) => {
    if (ev.id !== eventId) return ev;
    const execucoes = { ...(ev.execucoes || {}) };
    for (let t = 0; t < teamCount; t++) {
      const key = `${t}__${missionId}`;
      if (execucoes[key]) {
        execucoes[key] = execucoes[key].filter((e) => !e.isLoadTest);
      }
    }
    return { ...ev, execucoes };
  });
  await saveState(baseUrl, events);
  console.log("Execuções de teste removidas.");
}

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const students = toInt(args.students, 20);
  const baseUrl = (args.baseUrl || "http://127.0.0.1:8787").replace(/\/+$/, "");
  const dry = Boolean(args.dry);
  const cleanup = Boolean(args.cleanup);

  // Lê estado inicial para descobrir eventId e missionId
  console.log(`Conectando em ${baseUrl}…`);
  const { data: initialState } = await fetchState(baseUrl);
  const events = initialState.events || [];

  if (!events.length) {
    console.error("Nenhum evento encontrado. Crie um evento na plataforma antes de rodar o load test.");
    process.exitCode = 1;
    return;
  }

  const event = events.find((e) => e.id === args.eventId) || events[0];
  const mission = event.missions?.find((m) => m.id === args.missionId) || event.missions?.[0];

  if (!event) { console.error("Evento não encontrado."); process.exitCode = 1; return; }
  if (!mission) { console.error("Missão não encontrada no evento."); process.exitCode = 1; return; }

  const teamCount = event.teams?.length || 1;

  if (cleanup) {
    await cleanupLoadTestExecs(baseUrl, event.id, mission.id, teamCount);
    return;
  }

  console.log(`\nEvento:  ${event.name} (${event.id})`);
  console.log(`Missão:  ${mission.name} (${mission.id})`);
  console.log(`Times:   ${teamCount}`);
  console.log(`Alunos:  ${students} simultâneos`);
  console.log(`Modo:    ${dry ? "DRY (apenas leitura, sem escrita)" : "FULL (leitura + IA + escrita)"}\n`);

  const t0 = performance.now();
  const results = await Promise.allSettled(
    Array.from({ length: students }, (_, i) =>
      runStudent({
        studentId: i + 1,
        teamIdx: i % teamCount,
        eventId: event.id,
        missionId: mission.id,
        baseUrl,
        dry,
      }).then((r) => { process.stdout.write(`[${i + 1}] `); return r; })
       .catch((err) => { process.stdout.write(`[!${i + 1}] `); throw err; }),
    ),
  );
  process.stdout.write("\n");

  const wallMs = performance.now() - t0;
  const succeeded = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
  const failed = results.filter((r) => r.status === "rejected");
  const execIds = succeeded.map((r) => r.execId);

  // ── Latências ─────────────────────────────────────────────────────────────
  const aiTimes = succeeded.map((r) => r.timings.aiMs).filter(Boolean);
  const saveTimes = succeeded.map((r) => r.timings.saveMs).filter(Boolean);
  const read1Times = succeeded.map((r) => r.timings.read1Ms).filter(Boolean);

  console.log(`\n${"─".repeat(52)}`);
  console.log(`Wall time total:   ${ms(wallMs)}`);
  console.log(`Alunos ok / falha: ${succeeded.length} / ${failed.length}`);
  if (read1Times.length) {
    console.log(`\nGET /api/state`);
    console.log(`  avg: ${ms(avg(read1Times))}  p95: ${ms(pct(read1Times, 95))}  max: ${ms(Math.max(...read1Times))}`);
  }
  if (aiTimes.length) {
    console.log(`\nPOST /api/openai/responses (IA)`);
    console.log(`  avg: ${ms(avg(aiTimes))}  p95: ${ms(pct(aiTimes, 95))}  max: ${ms(Math.max(...aiTimes))}`);
  }
  if (saveTimes.length) {
    console.log(`\nPOST /api/state (Supabase)`);
    console.log(`  avg: ${ms(avg(saveTimes))}  p95: ${ms(pct(saveTimes, 95))}  max: ${ms(Math.max(...saveTimes))}`);
  }

  // ── Verificação de integridade ────────────────────────────────────────────
  if (!dry && succeeded.length > 0) {
    console.log(`\n${"─".repeat(52)}`);
    console.log("Verificando integridade das execuções no estado final…");
    const { data: finalState } = await fetchState(baseUrl);
    const finalEvent = (finalState.events || []).find((e) => e.id === event.id);
    const allExecs = [];
    for (let t = 0; t < teamCount; t++) {
      const key = `${t}__${mission.id}`;
      const execs = finalEvent?.execucoes?.[key] || [];
      allExecs.push(...execs.filter((e) => e.isLoadTest));
    }

    const foundIds = new Set(allExecs.map((e) => e.id));
    const missing = execIds.filter((id) => !foundIds.has(id));
    const extra = [...foundIds].filter((id) => !execIds.includes(id));

    console.log(`Execuções esperadas: ${execIds.length}`);
    console.log(`Execuções gravadas:  ${foundIds.size}`);

    if (missing.length === 0) {
      console.log(`\n✓ INTEGRIDADE OK — todas as ${execIds.length} execuções foram preservadas.`);
    } else {
      console.log(`\n✗ PERDA DE DADOS — ${missing.length} execuções foram sobrescritas (race condition).`);
      console.log(`  IDs perdidos: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`);
    }
    if (extra.length) {
      console.log(`  IDs extras inesperados: ${extra.length}`);
    }

    console.log(`\nPara remover as execuções de teste:`);
    console.log(`  node scripts/load-platform.mjs --cleanup --eventId ${event.id} --missionId ${mission.id}`);
  }

  if (failed.length) {
    console.log(`\nFalhas:`);
    failed.slice(0, 5).forEach((r, i) => console.log(`  ${i + 1}. ${r.reason?.message || r.reason}`));
  }

  if (failed.length) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
