import { useCallback, useEffect, useState } from "react";
import { getEventState, putEventStateOCC } from "../api/perTeam.js";
import { useTableChange } from "./useRealtime.js";

export function useEventState(eventId, { realtimeClient } = {}) {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const next = await getEventState(eventId);
      setState({ payload: next.payload, version: next.version, updated_at: next.updated_at });
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useTableChange(
    realtimeClient,
    { table: "event_state", filter: eventId ? `event_id=eq.${eventId}` : null, enabled: Boolean(eventId) },
    useCallback((change) => {
      if (change.eventType === "DELETE") return;
      const row = change.new;
      if (!row || row.version === undefined) return;
      setState({ payload: row.payload || {}, version: row.version, updated_at: row.updated_at });
    }, []),
  );

  const update = useCallback(
    async (mergeFn) => {
      if (!state) return { ok: false, error: "Estado nao carregado." };
      const result = await putEventStateOCC({
        eventId,
        initial: { payload: state.payload, version: state.version },
        merge: mergeFn,
      });
      if (result.ok) setState({ payload: result.payload, version: result.version, updated_at: result.updated_at });
      return result;
    },
    [eventId, state],
  );

  return { state, error, loading, reload, update };
}
