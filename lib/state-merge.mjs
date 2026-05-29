const TIMESTAMP_FIELDS = [
  "updatedAt",
  "resolvedAt",
  "cancelledAt",
  "submittedAt",
  "concludedAt",
  "closedAt",
  "openedAt",
  "dismissedAt",
  "endedAt",
  "endsAt",
  "startedAt",
  "lastSeenAt",
  "ts",
  "createdAt",
];

export function toTimestamp(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function entityTimestamp(value) {
  if (!isPlainObject(value)) return 0;
  let max = 0;
  for (const field of TIMESTAMP_FIELDS) {
    const candidate = toTimestamp(value[field]);
    if (candidate > max) max = candidate;
  }
  return max;
}

function identityKey(item) {
  if (!isPlainObject(item)) return null;
  if (item.id !== undefined && item.id !== null) return `id:${item.id}`;
  if (item.ts !== undefined && item.ts !== null) return `ts:${item.ts}`;
  return null;
}

function isIdentifiedArray(array) {
  return array.some((item) => identityKey(item) !== null);
}

export function mergeArrays(remote = [], local = []) {
  const all = [...remote, ...local];
  if (!isIdentifiedArray(all)) {
    return local;
  }
  const byKey = new Map();
  const orphans = [];
  for (const item of all) {
    const key = identityKey(item);
    if (key === null) {
      orphans.push(item);
      continue;
    }
    const previous = byKey.get(key);
    byKey.set(key, previous === undefined ? item : mergeObjects(previous, item));
  }
  const merged = [...byKey.values(), ...orphans];
  merged.sort((a, b) => entityTimestamp(a) - entityTimestamp(b));
  return merged;
}

export function mergeObjects(remote, local) {
  if (!isPlainObject(remote)) return local;
  if (!isPlainObject(local)) return remote;

  const newer = entityTimestamp(local) >= entityTimestamp(remote) ? local : remote;
  const older = newer === local ? remote : local;

  const result = {};
  const keys = new Set([...Object.keys(remote), ...Object.keys(local)]);
  for (const key of keys) {
    const remoteValue = remote[key];
    const localValue = local[key];

    if (remoteValue === undefined) {
      result[key] = localValue;
      continue;
    }
    if (localValue === undefined) {
      result[key] = remoteValue;
      continue;
    }
    if (Array.isArray(remoteValue) && Array.isArray(localValue)) {
      result[key] = isIdentifiedArray([...remoteValue, ...localValue])
        ? mergeArrays(remoteValue, localValue)
        : newer[key];
      continue;
    }
    if (isPlainObject(remoteValue) && isPlainObject(localValue)) {
      result[key] = mergeObjects(remoteValue, localValue);
      continue;
    }
    result[key] = newer[key] !== undefined ? newer[key] : older[key];
  }
  return result;
}

export function mergeAppEvents(remoteEvents = [], incomingEvents = []) {
  const safeRemote = Array.isArray(remoteEvents) ? remoteEvents : [];
  const safeIncoming = Array.isArray(incomingEvents) ? incomingEvents : [];
  const byId = new Map();
  for (const event of [...safeRemote, ...safeIncoming]) {
    if (!event || event.id === undefined || event.id === null) continue;
    const previous = byId.get(event.id);
    byId.set(event.id, previous === undefined ? event : mergeObjects(previous, event));
  }
  return [...byId.values()].sort(
    (a, b) => toTimestamp(a.createdAt || a.updatedAt) - toTimestamp(b.createdAt || b.updatedAt),
  );
}
