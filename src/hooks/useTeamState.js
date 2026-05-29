import { useCallback, useEffect, useState } from "react";
import { getTeamState, putTeamStateOCC } from "../api/perTeam.js";
import { useTableChange } from "./useRealtime.js";

export function useTeamState(eventId, teamIdx, { realtimeClient } = {}) {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!eventId || teamIdx === null || teamIdx === undefined) return;
    setLoading(true);
    try {
      const next = await getTeamState(eventId, teamIdx);
      setState({ payload: next.payload, version: next.version, updated_at: next.updated_at });
      setError(null);
    } catch (err) {
      if (err.statusCode === 404) {
        setState({ payload: {}, version: 0, updated_at: null });
        setError(null);
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [eventId, teamIdx]);

  useEffect(() => {
    reload();
  }, [reload]);

  useTableChange(
    realtimeClient,
    {
      table: "team_state",
      filter: eventId ? `event_id=eq.${eventId}` : null,
      enabled: Boolean(eventId),
    },
    useCallback(
      (change) => {
        const row = change.new || change.old;
        if (!row || row.team_idx !== teamIdx) return;
        setState({ payload: row.payload || {}, version: row.version, updated_at: row.updated_at });
      },
      [teamIdx],
    ),
  );

  const update = useCallback(
    async (mergeFn) => {
      if (!state) return { ok: false, error: "Estado nao carregado." };
      const result = await putTeamStateOCC({
        eventId,
        teamIdx,
        initial: { payload: state.payload, version: state.version },
        merge: mergeFn,
      });
      if (result.ok) setState({ payload: result.payload, version: result.version, updated_at: result.updated_at });
      return result;
    },
    [eventId, teamIdx, state],
  );

  return { state, error, loading, reload, update };
}
