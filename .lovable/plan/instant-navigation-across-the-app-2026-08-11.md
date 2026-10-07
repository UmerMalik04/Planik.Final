# Instant navigation across the app

Goal: every tab or link the user taps renders content immediately — no blank gap while a page chunk downloads, no empty screen while data loads.

## Current state (verified)

- All pages except Home are `lazy()`-loaded in `src/App.tsx`, and both `Suspense` boundaries use `fallback={null}`. So on first visit to a screen the chunk has to download over the network and the user sees an empty area until it arrives.
- Route chunks are never prefetched: `src/hooks/useDataPrefetch.ts` only contains a `resetPrefetchState()` stub — there is no prefetching logic anywhere.
- React Query is already tuned well (10 min `staleTime`, 30 min `gcTime`, no refetch on focus), and Zustand stores hydrate once after auth, so repeat visits within a session are already fast. The gap is the *first* visit to each screen plus any screen whose data isn't in a store yet.

## What will change

1. Warm the route chunks ahead of time
   - After the app is idle (`requestIdleCallback`, ~1s after first paint), preload the chunks for the screens reachable from the bottom nav and Home: Exercises, Progress, History, Diet Tracker, Body Map, Step History, Profile, Settings.
   - Also preload a chunk on `pointerdown`/`touchstart` of a nav item or card, so even a not-yet-warmed screen starts downloading before the tap completes.
   - Implemented as a small `routePreload` map plus a `usePrefetchRoutes` hook, replacing the empty `useDataPrefetch` stub.

2. Never show a blank screen while a chunk loads
   - Replace `fallback={null}` in both `Suspense` boundaries with a lightweight page-shell placeholder (header bar + a few muted blocks, same layout as the real page) so navigation feels immediate instead of frozen. Placeholder appears only if the chunk takes longer than a frame.

3. Render from local data first
   - Screens that already have store/IndexedDB data render it instantly and refresh in the background rather than waiting for the network round trip. This covers Home widgets, History, Diet Tracker and Step History.

4. Trim what blocks the first render
   - Warm the heavier deferred deps (charts on Progress, the exercise catalog) during idle time so opening those screens doesn't kick off a fresh download.
   - Exercise thumbnails on list screens keep eager loading for above-the-fold rows and switch to lazy below the fold, so the visible grid paints without competing downloads.

## Technical notes

- Chunk warming uses the same dynamic `import()` promises as the `lazy()` calls, cached in a module-level map, so a preload and a later navigation share one network request.
- Prefetching runs inside `requestIdleCallback` (with a `setTimeout` fallback) and is skipped when `navigator.connection.saveData` is true or the connection reports `2g`, to avoid burning mobile data.
- No changes to data models, Supabase schema, or business logic — this is loading and presentation only.

## Result

Tapping any nav item or card shows the screen's structure instantly, with real content appearing from cache in the same frame on repeat visits and within one network hop on the very first visit.
