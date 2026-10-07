/**
 * usePrefetchRoutes — warms route chunks AND their first-paint data during
 * browser idle time, so the first tap on any tab renders from an
 * already-downloaded chunk with real data already in memory.
 *
 * Runs once per app session, ordered by likelihood of use. Skipped entirely on
 * metered/slow connections (Data Saver, 2g) so we never spend a user's mobile
 * data on screens they may not open.
 */
import { useEffect } from 'react';
import { preload, type RouteKey } from '@/lib/routePreload';
import { HealthService } from '@/services/HealthService';
import { exercisesData } from '@/data/exercises_full';

/** Bottom-nav + Home-reachable screens first, secondary screens after. */
const WARM_ORDER: RouteKey[] = [
  'exercises',
  'progress',
  'history',
  'bodyMap',
  'dietTracker',
  'stepHistory',
  'profile',
  'settings',
  'exerciseDetail',
  'startWorkout',
  'workoutPlan',
  'createPlan',
  'templates',
];

/** Pull the images the Exercises list paints first into the HTTP cache. */
function warmExerciseThumbnails(): void {
  exercisesData.slice(0, 8).forEach((exercise) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = exercise.thumbnail;
  });
}

/**
 * Per-route data warmers. Workout + diet data is already hydrated app-wide by
 * DataInitializer, so only screens with their own fetch need an entry here.
 * Each warmer must be idempotent and swallow its own errors — a failed warm
 * should never surface to the user.
 */
const DATA_WARMERS: Partial<Record<RouteKey, () => void | Promise<unknown>>> = {
  exercises: warmExerciseThumbnails,
  stepHistory: () => HealthService.prefetchCurrentMonth(),
};

/** Warm a single screen's data immediately (used on nav pointerdown/hover). */
export function prefetchRouteData(route: RouteKey): void {
  warmDataFor(route);
}

function warmDataFor(route: RouteKey): void {
  const warmer = DATA_WARMERS[route];
  if (!warmer) return;
  try {
    void Promise.resolve(warmer()).catch(() => {});
  } catch {
    // Warming is best-effort only.
  }
}


function connectionAllowsPrefetch(): boolean {
  const connection = (navigator as any).connection;
  if (!connection) return true;
  if (connection.saveData) return false;
  const type = String(connection.effectiveType ?? '');
  return !(type.includes('2g') || type === 'slow-2g');
}

function whenIdle(callback: () => void, timeout = 1000): () => void {
  const ric = (window as any).requestIdleCallback as
    | ((cb: IdleRequestCallback, opts?: { timeout: number }) => number)
    | undefined;

  if (ric) {
    const handle = ric(() => callback(), { timeout });
    return () => (window as any).cancelIdleCallback?.(handle);
  }

  const timer = window.setTimeout(callback, timeout);
  return () => window.clearTimeout(timer);
}

let warmed = false;

export function usePrefetchRoutes(): void {
  useEffect(() => {
    if (warmed || !connectionAllowsPrefetch()) return;
    warmed = true;

    // Sequential, one chunk per idle slot: keeps the main thread free and
    // avoids competing with the current screen's own requests.
    let cancelled = false;
    let cancelIdle = () => {};

    const warmNext = (index: number) => {
      if (cancelled || index >= WARM_ORDER.length) return;
      const route = WARM_ORDER[index];
      cancelIdle = whenIdle(() => {
        void preload(route).then(() => {
          // Chunk is in memory — now fill that screen's data cache too.
          warmDataFor(route);
          warmNext(index + 1);
        });
      });
    };


    warmNext(0);

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, []);
}
