import { useEffect } from "react";

export function useTableChange(client, { table, filter, enabled }, onChange) {
  useEffect(() => {
    if (!enabled || !client) return undefined;
    const channelName = `${table}__${filter || "all"}`;
    const subscription = client
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table, filter }, (payload) => onChange(payload))
      .subscribe();
    return () => {
      client.removeChannel(subscription);
    };
  }, [client, table, filter, enabled, onChange]);
}
