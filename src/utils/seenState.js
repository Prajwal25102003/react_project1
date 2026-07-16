/**
 * Factory to create localStorage-backed "seen" state helpers.
 * Used to track which items (activities, notifications) a user has viewed.
 */
export function createSeenStateHelpers(storagePrefix) {
  function storageKey(userKey) {
    return `${storagePrefix}${userKey}`;
  }

  function getSeenIds(userKey) {
    if (!userKey) return [];
    try {
      const raw = localStorage.getItem(storageKey(userKey));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  function writeSeenIds(userKey, ids) {
    if (!userKey) return;
    try {
      localStorage.setItem(storageKey(userKey), JSON.stringify(ids.map(String)));
    } catch {
      /* ignore quota / private mode */
    }
  }

  function markSeen(userKey, ids, { retainOnlyIds } = {}) {
    if (!userKey) return;
    const incoming = (ids || []).map(String).filter(Boolean);
    if (incoming.length === 0 && !retainOnlyIds) return;

    const merged = new Set([...getSeenIds(userKey), ...incoming]);

    let next = [...merged];
    if (retainOnlyIds) {
      const retain = new Set((retainOnlyIds || []).map(String).filter(Boolean));
      next = next.filter((id) => retain.has(id));
    }

    writeSeenIds(userKey, next);
  }

  /** Drop seen ids that are no longer in the limited feed. */
  function pruneSeenToIds(userKey, retainIds) {
    if (!userKey) return;
    const retain = new Set((retainIds || []).map(String).filter(Boolean));
    const next = getSeenIds(userKey).filter((id) => retain.has(id));
    writeSeenIds(userKey, next);
  }

  return { getSeenIds, markSeen, pruneSeenToIds };
}
