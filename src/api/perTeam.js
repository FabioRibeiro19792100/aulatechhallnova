async function jsonOrText(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  const body = await jsonOrText(response);
  if (!response.ok) {
    const error = new Error(typeof body === "string" ? body : body?.message || `HTTP ${response.status}`);
    error.statusCode = response.status;
    error.body = typeof body === "object" ? body : null;
    throw error;
  }
  return body;
}

export function listEvents() {
  return request("/api/event/list");
}

export function getEventState(eventId) {
  return request(`/api/event/${encodeURIComponent(eventId)}`);
}

export function getTeamState(eventId, teamIdx) {
  return request(`/api/event/${encodeURIComponent(eventId)}/team/${teamIdx}`);
}

export function getDashboard(eventId) {
  return request(`/api/event/${encodeURIComponent(eventId)}/dashboard`);
}

export function listTeamExecutions(eventId, teamIdx, { missionId, limit = 50 } = {}) {
  const qs = new URLSearchParams();
  if (missionId) qs.set("mission_id", missionId);
  qs.set("limit", String(limit));
  return request(`/api/event/${encodeURIComponent(eventId)}/team/${teamIdx}/executions?${qs}`);
}

export function postExecution(eventId, teamIdx, execution) {
  return request(`/api/event/${encodeURIComponent(eventId)}/team/${teamIdx}/executions`, {
    method: "POST",
    body: execution,
  });
}

export function patchExecutionPayload(eventId, teamIdx, execId, payloadPatch) {
  return request(`/api/event/${encodeURIComponent(eventId)}/team/${teamIdx}/executions/${encodeURIComponent(execId)}`, {
    method: "PATCH",
    body: { payload_patch: payloadPatch },
  });
}

export function deleteAllEventData(eventId) {
  return request(`/api/event/${encodeURIComponent(eventId)}`, { method: "DELETE" });
}

export function deleteTeamScopedData(eventId, teamIdx) {
  return request(`/api/event/${encodeURIComponent(eventId)}/team/${teamIdx}`, { method: "DELETE" });
}

export function deleteTeamExecutions(eventId, teamIdx, { missionId } = {}) {
  const qs = missionId ? `?mission_id=${encodeURIComponent(missionId)}` : "";
  return request(`/api/event/${encodeURIComponent(eventId)}/team/${teamIdx}/executions${qs}`, { method: "DELETE" });
}

export function postPresence(eventId, teamIdx, memberName) {
  return request(`/api/event/${encodeURIComponent(eventId)}/team/${teamIdx}/presence`, {
    method: "POST",
    body: { member_name: memberName || "" },
  });
}

export function postHelpRequest(eventId, request_) {
  return request(`/api/event/${encodeURIComponent(eventId)}/help-request`, {
    method: "POST",
    body: request_,
  });
}

export function putHelpRequest(eventId, id, patch) {
  return request(`/api/event/${encodeURIComponent(eventId)}/help-request/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: patch,
  });
}

export function listHelpRequests(eventId, { status, limit = 100 } = {}) {
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  qs.set("limit", String(limit));
  return request(`/api/event/${encodeURIComponent(eventId)}/help-request?${qs}`);
}

export function postTokenLog(eventId, entry) {
  return request(`/api/event/${encodeURIComponent(eventId)}/token-log`, {
    method: "POST",
    body: entry,
  });
}

export function listTokenLogs(eventId, { teamIdx, limit = 200 } = {}) {
  const qs = new URLSearchParams();
  if (teamIdx !== undefined && teamIdx !== null) qs.set("team_idx", String(teamIdx));
  qs.set("limit", String(limit));
  return request(`/api/event/${encodeURIComponent(eventId)}/token-log?${qs}`);
}

export async function putEventStateOCC({ eventId, initial, merge, maxAttempts = 3 }) {
  let current = initial;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const nextPayload = merge(current.payload);
    try {
      const result = await request(`/api/event/${encodeURIComponent(eventId)}`, {
        method: "PUT",
        body: { payload: nextPayload, expected_version: current.version },
      });
      return { ok: true, payload: result.payload, version: result.version, updated_at: result.updated_at };
    } catch (err) {
      if (err.statusCode !== 409 || !err.body) throw err;
      current = { payload: err.body.current_payload, version: err.body.current_version };
    }
  }
  return { ok: false, conflict: { current_payload: current.payload, current_version: current.version } };
}

export async function putTeamStateOCC({ eventId, teamIdx, initial, merge, maxAttempts = 3 }) {
  let current = initial;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const nextPayload = merge(current.payload);
    try {
      const result = await request(`/api/event/${encodeURIComponent(eventId)}/team/${teamIdx}`, {
        method: "PUT",
        body: { payload: nextPayload, expected_version: current.version },
      });
      return { ok: true, payload: result.payload, version: result.version, updated_at: result.updated_at };
    } catch (err) {
      if (err.statusCode !== 409 || !err.body) throw err;
      current = { payload: err.body.current_payload, version: err.body.current_version };
    }
  }
  return { ok: false, conflict: { current_payload: current.payload, current_version: current.version } };
}
