import { useCallback, useEffect, useRef } from "react";
import { postPresence } from "../api/perTeam.js";

export function usePresence({ eventId, teamIdx, memberName, intervalMs = 5000, enabled = true }) {
  const lastRef = useRef("");
  const sendNow = useCallback(() => {
    if (!enabled || !eventId || teamIdx === null || teamIdx === undefined) return Promise.resolve();
    return postPresence(eventId, teamIdx, memberName).catch(() => undefined);
  }, [enabled, eventId, teamIdx, memberName]);

  useEffect(() => {
    if (!enabled) return undefined;
    lastRef.current = `${eventId}__${teamIdx}__${memberName}`;
    sendNow();
    const timer = window.setInterval(sendNow, intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, eventId, teamIdx, memberName, intervalMs, sendNow]);

  return { sendNow };
}
