import { useCallback, useEffect, useState } from "react";
import { listTokenLogs, postTokenLog } from "../api/perTeam.js";
import { useTableChange } from "./useRealtime.js";

export function useTokenLogs(eventId, { realtimeClient, teamIdx } = {}) {
  const [items, setItems] = useState([]);

  const reload = useCallback(async () => {
    if (!eventId) return;
    setItems(await listTokenLogs(eventId, { teamIdx }));
  }, [eventId, teamIdx]);

  useEffect(() => {
    reload();
  }, [reload]);

  useTableChange(
    realtimeClient,
    {
      table: "token_operational_logs",
      filter: eventId ? `event_id=eq.${eventId}` : null,
      enabled: Boolean(eventId),
    },
    useCallback(
      (change) => {
        const row = change.new;
        if (!row) return;
        if (teamIdx !== undefined && teamIdx !== null && row.team_idx !== teamIdx) return;
        setItems((current) => [row, ...current]);
      },
      [teamIdx],
    ),
  );

  const append = useCallback((entry) => postTokenLog(eventId, entry), [eventId]);

  return { items, reload, append };
}
