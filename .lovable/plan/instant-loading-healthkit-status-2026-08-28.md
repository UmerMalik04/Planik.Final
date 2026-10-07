# Instant loading + HealthKit status

## Part 1 — Make every screen feel instant

Route chunks are already code-split, idle-warmed and pointer-prefetched, so the remaining
delay you feel is **data**, not code: each screen mounts, then waits on a Supabase round
trip before it paints anything real. Fixes:

1. **Persist the query cache to disk.** Wrap React Query with a localStorage/IndexedDB
   persister so data from your last session is on screen on the very first frame, then
   silently revalidates in the background. This is what removes the "blank then pop"
   feel on Home, Progress, History, Diet and Step History.
2. **Prefetch data, not just code.** Extend the existing idle prefetcher so that when a
   route chunk is warmed, its primary query (workouts, diet log, step map, exercises) is
   also prefetched into the cache. On pointer-down over a nav item, prefetch that
   screen's query immediately.
3. **Kill blocking spinners.** Any screen that currently renders a loader when data is
   absent renders cached/placeholder content instead and only shows a subtle inline
   refresh indicator. No skeleton lives longer than ~100 ms (matches your existing rule).
4. **Warm the heavy screens' assets.** Exercise thumbnails for the first visible rows get
   `preload` hints so the Exercises grid paints images with the layout, not after it.

Result: taps switch screens on the same frame, with real data already there.

## Part 2 — Is HealthKit actually fixed?

**In the web/JS layer: yes, except one bug still present.** `syncMonthFromHealthKit` still
skips any day whose value is `0`, so genuine zero-step days never get written and the
calendar leaves them blank rather than showing `0`. That will be fixed.

**In the native layer: the code is correct but not yet in your installed app.** The step
plugin reads `HKQuantityTypeIdentifierStepCount` via `HKStatisticsQuery` day by day,
which is correct but slow for a month view — it will be switched to a single
`HKStatisticsCollectionQuery` per month so a month syncs in one query instead of 30.

Important: these native changes only reach your phone when a **new iOS binary is built in
Xcode and submitted**. Publishing from here updates the web layer only. Until that
rebuild, the App Store copy keeps running the older native step code.

## Technical notes

- `@tanstack/react-query-persist-client` + `createSyncStoragePersister`, `maxAge` ~24 h,
  buster keyed to app version so a deploy can't serve stale shapes.
- `usePrefetchRoutes` / `Layout` pointer handlers gain a `queryClient.prefetchQuery` per
  `RouteKey`; queries keep the existing 10-minute `staleTime`.
- `HealthService.syncMonthFromHealthKit`: drop the `result.steps > 0` guard, upsert `0`
  rows; `StepHistory` already renders `0` correctly.
- `StepCounterPlugin.swift`: add a `getStepsForMonth` method backed by
  `HKStatisticsCollectionQuery` (daily interval), with the existing per-day method kept as
  a fallback for older binaries.
- No RLS changes: `daily_steps` stays scoped to `auth.uid()`.
