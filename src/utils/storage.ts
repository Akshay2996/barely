/**
 * Ask the browser to keep our on-device data (IndexedDB + localStorage) from
 * being evicted under storage pressure or after periods of inactivity.
 *
 * This is best-effort: browsers decide whether to grant "persistent" storage
 * based on their own heuristics (installed PWA, site engagement, bookmarks),
 * so a `false` result is normal and not an error. Once granted, the data is
 * exempt from automatic eviction until the user clears it themselves.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
