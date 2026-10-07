# Offline-first sync queue

Today the app mirrors data *downward* only: the Zustand stores write straight to Supabase, and `useOfflineSync` copies the resulting in-memory snapshot into IndexedDB. If the device is offline when the user logs a set, finishes a workout, or adds a food item, the Supabase call fails and the change is lost — there is no queue and no replay.

This plan adds a real write path for offline use: every mutation is recorded locally, applied optimistically to the UI, then replayed against Supabase when connectivity returns, with a defined rule for resolving conflicts.

## What the user will experience

- Logging workouts, sets, personal records, water, and food works fully offline — nothing silently fails.
- A small status indicator shows "X changes pending" while offline and clears once synced.
- Reopening the app offline shows the same data, including changes made while offline.
- On reconnect, pending changes upload in the background. Anything that genuinely conflicts (the same record edited on another device) resolves to the newest edit, and the user is told only if something could not be applied.

## How it works

```text
UI action
   |
   v
store action --> optimistic state update
   |                    |
   |                    +--> IndexedDB: entity snapshot
   v
mutation queue (IndexedDB, ordered, with clientId + timestamp)
   |
   |  online?  no  -> stays queued
   |          yes  -> replay worker
   v
Supabase (source of truth) --> re-pull --> reconcile stores
```

### 1. Mutation queue store

Bump `OfflineStorage` to DB_VERSION 2 and add an `outbox` object store keyed by an auto-increment sequence, each entry holding: table name, operation (`insert` / `update` / `delete`), payload, `clientId` (a UUID generated on the device), `createdAt`, and `attempts`.

Add methods: `enqueue`, `listOutbox`, `removeFromOutbox`, `bumpAttempts`, `clearOutbox`.

### 2. Client-generated IDs

Offline inserts need an ID before the server sees them. All affected tables already default `id` to `gen_random_uuid()`, so the client can generate the UUID itself and send it explicitly. This makes replay idempotent: re-sending the same insert with the same ID after a partial failure upserts rather than duplicating.

No schema change is required for this.

### 3. Store changes

Route mutations through a shared helper (e.g. `src/services/SyncQueue.ts`) instead of calling `supabase.from(...)` inline:

- `useWorkoutStore`: create/update/delete plan, add/update/delete exercise, start/finish session, completed exercises, personal record upsert and delete.
- `useDietStore`: add and delete food items.
- `WaterTracker`: add and remove water intake.

Each helper call: apply optimistic state, mirror to IndexedDB, then either send immediately (online) or enqueue (offline). A failed send while online also enqueues rather than dropping the change.

### 4. Replay worker

Extend `useOfflineSync`:

- On the offline to online rising edge, and on app start, drain the outbox in insertion order with a concurrency of 1 (order matters: a session must exist before its completed exercises).
- Retry with backoff; after a small number of failed attempts on a specific entry, park it and surface one error toast (matching the app's error-only toast rule).
- After the outbox is empty, run the existing `initializeUserData(true)` pull so the local mirror matches the server.

### 5. Conflict resolution

Last-write-wins on `updated_at` / row timestamp, decided client-side at replay time: before applying an `update`, compare the queued entry's `createdAt` with the server row's timestamp and skip the queued write if the server copy is newer. Deletes always win over pending updates for the same ID. Inserts are idempotent via the client-generated ID.

### 6. Pending-changes indicator

A compact badge (count of outbox entries) shown in the app header or alongside the existing online-status usage, hidden when the outbox is empty. Uses existing semantic tokens; no new colours.

## Technical notes

- New file: `src/services/SyncQueue.ts` — enqueue/replay logic and the last-write-wins comparison.
- Changed: `src/services/OfflineStorage.ts` (DB v2 + outbox), `src/hooks/useOfflineSync.tsx` (replay worker), `src/stores/useWorkoutStore.ts`, `src/stores/useDietStore.ts`, `src/components/WaterTracker.tsx`.
- Also mirror `food_items` and `water_intake` into IndexedDB — today only plans, sessions, and PRs are mirrored, so diet and water data is unavailable offline.
- No database migration and no RLS change: all writes still go through the authenticated client and existing `auth.uid()` policies, so a queued write replayed later is still scoped to its owner. Queue entries live in the device's IndexedDB and are cleared on sign-out via `offlineStorage.clearAll()`.
- Zero-latency rule preserved: the UI updates from optimistic state immediately; network work never blocks a render.
