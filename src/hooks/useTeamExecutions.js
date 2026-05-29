import { useCallback, useEffect, useRef, useState } from "react";
import { listTeamExecutions, postExecution } from "../api/perTeam.js";
import { useTableChange } from "./useRealtime.js";

export function useTeamExecutions(eventId, teamIdx, missionId, { realtimeClient, limit = 50 } = {}) {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const seenIdsRef = useRef(new Set());

  const reload = useCallback(async () => {
    if (!eventId || teamIdx === null || teamIdx === undefined || !missionId) return;
    setLoading(true);
    try {
      const rows = await listTeamExecutions(eventId, teamIdx, { missionId, limit });
      const sorted = [...rows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      seenIdsRef.current = new Set(sorted.map((row) => row.id));
      setExecutions(sorted);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [eventId, teamIdx, missionId, limit]);

  useEffect(() => {
    reload();
  }, [reload]);

  useTableChange(
    realtimeClient,
    {
      table: "executions",
      filter: eventId ? `event_id=eq.${eventId}` : null,
      enabled: Boolean(eventId),
    },
    useCallback(
      (change) => {
        const row = change.new;
        if (!row || row.team_idx !== teamIdx || row.mission_id !== missionId) return;
        if (seenIdsRef.current.has(row.id)) return;
        seenIdsRef.current.add(row.id);
        setExecutions((current) => [...current, row]);
      },
      [teamIdx, missionId],
    ),
  );

  const append = useCallback(
    async (execution) => {
      await postExecution(eventId, teamIdx, execution);
      if (!seenIdsRef.current.has(execution.id)) {
        seenIdsRef.current.add(execution.id);
        setExecutions((current) => [...current, execution]);
      }
    },
    [eventId, teamIdx],
  );

  return { executions, loading, error, reload, append };
}
