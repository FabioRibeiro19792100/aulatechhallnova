import { useCallback, useEffect, useState } from "react";
import { getDashboard } from "../api/perTeam.js";

export function useDashboard(eventId, { realtimeClient, refreshMs = 4000 } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!eventId) return;
    try {
      setData(await getDashboard(eventId));
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [eventId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!eventId || !realtimeClient) return undefined;
    const tables = ["event_state", "team_state", "executions", "help_requests", "team_presence", "token_operational_logs"];
    const channels = tables.map((table) =>
      realtimeClient
        .channel(`dashboard__${table}__${eventId}`)
        .on("postgres_changes", { event: "*", schema: "public", table, filter: `event_id=eq.${eventId}` }, () => {
          reload();
        })
        .subscribe(),
    );
    return () => {
      channels.forEach((channel) => realtimeClient.removeChannel(channel));
    };
  }, [eventId, realtimeClient, reload]);

  useEffect(() => {
    if (!eventId || !refreshMs) return undefined;
    const timer = window.setInterval(reload, refreshMs);
    return () => window.clearInterval(timer);
  }, [eventId, refreshMs, reload]);

  return { data, error, reload };
}
