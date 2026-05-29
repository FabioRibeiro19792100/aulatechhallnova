let testFetcher = null;

export function setSupabaseFetcherForTests(fn) {
  testFetcher = fn;
}

export function resetSupabaseFetcherForTests() {
  testFetcher = null;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    const error = new Error("SUPABASE_URL e SUPABASE_ANON_KEY precisam estar configurados.");
    error.statusCode = 500;
    throw error;
  }
  return { url: url.replace(/\/+$/, ""), anonKey };
}

async function realFetch(pathname, { method = "GET", body, headers = {}, timeoutMs = 8000 } = {}) {
  const { url, anonKey } = getSupabaseConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`${url}${pathname}`, {
      method,
      signal: controller.signal,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (fetchError) {
    clearTimeout(timer);
    const error = new Error(
      fetchError?.name === "AbortError"
        ? `Supabase nao respondeu em ${timeoutMs}ms.`
        : "Falha de rede ao consultar o Supabase.",
    );
    error.statusCode = 504;
    throw error;
  }
  clearTimeout(timer);
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(text || "Falha ao consultar o Supabase.");
    error.statusCode = response.status;
    throw error;
  }
  return text ? JSON.parse(text) : null;
}

async function db(pathname, options) {
  if (testFetcher) return testFetcher(pathname, options || {});
  return realFetch(pathname, options || {});
}

function nowIso() {
  return new Date().toISOString();
}

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

function conflict(body) {
  const error = new Error("Conflito de versao.");
  error.statusCode = 409;
  error.body = body;
  return error;
}

export async function getEventState(eventId) {
  const rows = await db(`/rest/v1/event_state?event_id=eq.${encodeURIComponent(eventId)}&select=event_id,payload,version,updated_at&limit=1`);
  const row = rows?.[0];
  if (!row) throw notFound(`event_state ${eventId} nao encontrado.`);
  return {
    payload: row.payload || {},
    version: row.version,
    updated_at: row.updated_at,
    serverNow: nowIso(),
  };
}

export async function putEventStateOCC(eventId, { payload, expected_version }) {
  const nextVersion = expected_version + 1;
  const updatedAt = nowIso();
  const rows = await db(
    `/rest/v1/event_state?event_id=eq.${encodeURIComponent(eventId)}&version=eq.${expected_version}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: { payload, version: nextVersion, updated_at: updatedAt },
    },
  );
  if (Array.isArray(rows) && rows.length) {
    const row = rows[0];
    return { payload: row.payload, version: row.version, updated_at: row.updated_at, serverNow: nowIso() };
  }
  const current = await db(`/rest/v1/event_state?event_id=eq.${encodeURIComponent(eventId)}&select=payload,version,updated_at&limit=1`);
  const row = current?.[0];
  if (!row) throw notFound(`event_state ${eventId} nao encontrado.`);
  throw conflict({ current_payload: row.payload, current_version: row.version, current_updated_at: row.updated_at });
}

export async function listEvents() {
  const rows = await db(`/rest/v1/event_state?select=event_id,payload,updated_at&order=updated_at.desc`);
  return (rows || []).map((row) => ({
    event_id: row.event_id,
    name: row.payload?.name || row.event_id,
    status: row.payload?.status || "draft",
    mode: row.payload?.mode || "missions",
    updated_at: row.updated_at,
  }));
}

export async function getTeamState(eventId, teamIdx) {
  const rows = await db(`/rest/v1/team_state?event_id=eq.${encodeURIComponent(eventId)}&team_idx=eq.${teamIdx}&select=event_id,team_idx,payload,version,updated_at&limit=1`);
  const row = rows?.[0];
  if (!row) throw notFound(`team_state ${eventId}/${teamIdx} nao encontrado.`);
  return { payload: row.payload || {}, version: row.version, updated_at: row.updated_at, serverNow: nowIso() };
}

export async function putTeamStateOCC(eventId, teamIdx, { payload, expected_version }) {
  const nextVersion = expected_version + 1;
  const updatedAt = nowIso();
  const filter = `event_id=eq.${encodeURIComponent(eventId)}&team_idx=eq.${teamIdx}&version=eq.${expected_version}`;
  const rows = await db(`/rest/v1/team_state?${filter}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: { payload, version: nextVersion, updated_at: updatedAt },
  });
  if (Array.isArray(rows) && rows.length) {
    const row = rows[0];
    return { payload: row.payload, version: row.version, updated_at: row.updated_at, serverNow: nowIso() };
  }
  const current = await db(`/rest/v1/team_state?event_id=eq.${encodeURIComponent(eventId)}&team_idx=eq.${teamIdx}&select=payload,version,updated_at&limit=1`);
  const row = current?.[0];
  if (!row) {
    if (expected_version !== 0) {
      throw notFound(`team_state ${eventId}/${teamIdx} nao encontrado.`);
    }
    const inserted = await db("/rest/v1/team_state", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: [{ event_id: eventId, team_idx: teamIdx, payload, version: 1, updated_at: updatedAt }],
    });
    if (Array.isArray(inserted) && inserted.length) {
      const insertedRow = inserted[0];
      return {
        payload: insertedRow.payload,
        version: insertedRow.version,
        updated_at: insertedRow.updated_at,
        serverNow: nowIso(),
      };
    }
    const reread = await db(
      `/rest/v1/team_state?event_id=eq.${encodeURIComponent(eventId)}&team_idx=eq.${teamIdx}&select=payload,version,updated_at&limit=1`,
    );
    const rereadRow = reread?.[0];
    if (!rereadRow) {
      throw notFound(`team_state ${eventId}/${teamIdx} nao encontrado.`);
    }
    throw conflict({
      current_payload: rereadRow.payload,
      current_version: rereadRow.version,
      current_updated_at: rereadRow.updated_at,
    });
  }
  throw conflict({ current_payload: row.payload, current_version: row.version, current_updated_at: row.updated_at });
}

export async function insertExecution(execution) {
  await db("/rest/v1/executions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: [execution],
  });
  return { ok: true };
}

export async function listExecutions({ event_id, team_idx, mission_id, limit = 50 }) {
  const parts = [`event_id=eq.${encodeURIComponent(event_id)}`];
  if (team_idx !== undefined && team_idx !== null) parts.push(`team_idx=eq.${team_idx}`);
  if (mission_id) parts.push(`mission_id=eq.${encodeURIComponent(mission_id)}`);
  parts.push(`order=created_at.desc`);
  parts.push(`limit=${limit}`);
  const rows = await db(`/rest/v1/executions?${parts.join("&")}`);
  return rows || [];
}

export async function insertTokenLog(entry) {
  await db("/rest/v1/token_operational_logs", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: [entry],
  });
  return { ok: true };
}

export async function listTokenLogs({ event_id, team_idx, limit = 200 }) {
  const parts = [`event_id=eq.${encodeURIComponent(event_id)}`];
  if (team_idx !== undefined && team_idx !== null) parts.push(`team_idx=eq.${team_idx}`);
  parts.push(`order=created_at.desc`);
  parts.push(`limit=${limit}`);
  const rows = await db(`/rest/v1/token_operational_logs?${parts.join("&")}`);
  return rows || [];
}

export async function insertHelpRequest(entry) {
  await db("/rest/v1/help_requests", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: [entry],
  });
  return { ok: true };
}

export async function updateHelpRequestStatus(id, { status, payloadPatch }) {
  const body = { status, updated_at: nowIso() };
  if (payloadPatch !== undefined) body.payload = payloadPatch;
  await db(`/rest/v1/help_requests?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body,
  });
  return { ok: true };
}

export async function listHelpRequests({ event_id, status, limit = 100 }) {
  const parts = [`event_id=eq.${encodeURIComponent(event_id)}`];
  if (status) parts.push(`status=eq.${encodeURIComponent(status)}`);
  parts.push(`order=created_at.desc`);
  parts.push(`limit=${limit}`);
  const rows = await db(`/rest/v1/help_requests?${parts.join("&")}`);
  return rows || [];
}

export async function upsertPresence(entry) {
  await db("/rest/v1/team_presence", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: [{ ...entry, last_seen_at: nowIso() }],
  });
  return { ok: true };
}

export async function listPresence(event_id) {
  const rows = await db(`/rest/v1/team_presence?event_id=eq.${encodeURIComponent(event_id)}&select=event_id,team_idx,member_name,last_seen_at`);
  return rows || [];
}

export async function getDashboard(eventId) {
  const [event, teams, presence, helpRequests, recentExecutions, tokenLogs] = await Promise.all([
    getEventState(eventId).catch((e) => (e.statusCode === 404 ? null : Promise.reject(e))),
    db(`/rest/v1/team_state?event_id=eq.${encodeURIComponent(eventId)}&select=team_idx,payload,version,updated_at`),
    listPresence(eventId),
    listHelpRequests({ event_id: eventId, limit: 100 }),
    listExecutions({ event_id: eventId, limit: 50 }),
    listTokenLogs({ event_id: eventId, limit: 100 }),
  ]);
  return {
    event,
    teams: teams || [],
    presence,
    helpRequests,
    recentExecutions,
    tokenLogs,
    serverNow: nowIso(),
  };
}
