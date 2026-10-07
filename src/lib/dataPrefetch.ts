/**
 * dataPrefetch — a tiny in-memory + localStorage cache used to make screen
 * transitions feel instant.
 *
 * The app's main data (workouts, diet) already hydrates from IndexedDB via the
 * Zustand stores. This module covers the remaining per-screen fetches (e.g. the
 * step calendar) with two layers:
 *
 *  1. `warmData()` — memoised in-flight/resolved promise per key, so a screen
 *     that was prefetched during idle time paints from memory on first render.
 *  2. `readSnapshot()` / `writeSnapshot()` — a JSON snapshot in localStorage so
 *     even a cold launch has real data on the very first frame, then quietly
 *     revalidates in the background.
 *
 * Privacy: snapshots stay on the device only, and are cleared on sign-out via
 * `clearSnapshots()`. Nothing here bypasses Supabase RLS — every fetch that
 * fills the cache is still an authenticated, row-scoped query.
 */

const SNAPSHOT_PREFIX = 'planik_snap:';
/** Bumped when a cached shape changes so old snapshots are ignored. */
const SNAPSHOT_VERSION = 'v1';

const resolved = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

/** Fetch once per key; later callers reuse the same promise/value. */
export function warmData<T>(key: string, loader: () => Promise<T>): Promise<T> {
  if (resolved.has(key)) return Promise.resolve(resolved.get(key) as T);

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = loader()
    .then((value) => {
      resolved.set(key, value);
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

/** Synchronously read an already-warmed value (undefined when not warmed). */
export function readWarmed<T>(key: string): T | undefined {
  return resolved.get(key) as T | undefined;
}

/** Overwrite a warmed value (used after a manual refresh). */
export function setWarmed<T>(key: string, value: T): void {
  resolved.set(key, value);
}

/** Drop a warmed value so the next read refetches. */
export function invalidateWarmed(key: string): void {
  resolved.delete(key);
  inflight.delete(key);
}

interface Snapshot<T> {
  v: string;
  t: number;
  d: T;
}

/** Read a device-local snapshot; `maxAgeMs` guards against very stale data. */
export function readSnapshot<T>(key: string, maxAgeMs = 24 * 60 * 60 * 1000): T | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot<T>;
    if (parsed.v !== SNAPSHOT_VERSION) return null;
    if (Date.now() - parsed.t > maxAgeMs) return null;
    return parsed.d;
  } catch {
    return null;
  }
}

/** Persist a snapshot for instant first paint on the next cold launch. */
export function writeSnapshot<T>(key: string, data: T): void {
  try {
    const payload: Snapshot<T> = { v: SNAPSHOT_VERSION, t: Date.now(), d: data };
    localStorage.setItem(SNAPSHOT_PREFIX + key, JSON.stringify(payload));
  } catch {
    // Storage full / private mode — snapshots are a pure optimisation.
  }
}

/** Wipe every snapshot + warmed value (call on sign-out). */
export function clearSnapshots(): void {
  resolved.clear();
  inflight.clear();
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(SNAPSHOT_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
