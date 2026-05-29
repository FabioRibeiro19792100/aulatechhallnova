import { useCallback, useEffect, useState } from "react";
import { listHelpRequests, postHelpRequest, putHelpRequest } from "../api/perTeam.js";
import { useTableChange } from "./useRealtime.js";

export function useHelpRequests(eventId, { realtimeClient, status } = {}) {
  const [items, setItems] = useState([]);

  const reload = useCallback(async () => {
    if (!eventId) return;
    setItems(await listHelpRequests(eventId, { status }));
  }, [eventId, status]);

  useEffect(() => {
    reload();
  }, [reload]);

  useTableChange(
    realtimeClient,
    {
      table: "help_requests",
      filter: eventId ? `event_id=eq.${eventId}` : null,
      enabled: Boolean(eventId),
    },
    useCallback((change) => {
      const row = change.new || change.old;
      if (!row) return;
      setItems((current) => {
        const without = current.filter((item) => item.id !== row.id);
        if (change.eventType === "DELETE") return without;
        return [row, ...without];
      });
    }, []),
  );

  const create = useCallback((entry) => postHelpRequest(eventId, entry), [eventId]);
  const updateStatus = useCallback((id, patch) => putHelpRequest(eventId, id, patch), [eventId]);

  return { items, reload, create, updateStatus };
}
