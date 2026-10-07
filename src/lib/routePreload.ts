/**
 * routePreload — shared registry of the app's lazy route imports.
 *
 * Every route chunk is declared exactly once here. `React.lazy()` in App.tsx
 * and the idle/pointer prefetchers both go through `preload()`, so a warmed
 * chunk and a real navigation share a single network request (the dynamic
 * `import()` promise is cached by the module system, and again here).
 */
export type RouteKey =
  | 'exercises'
  | 'exerciseDetail'
  | 'progress'
  | 'history'
  | 'bodyMap'
  | 'dietTracker'
  | 'stepHistory'
  | 'profile'
  | 'settings'
  | 'createPlan'
  | 'templates'
  | 'workoutPlan'
  | 'addExercise'
  | 'editExercise'
  | 'startWorkout'
  | 'auth'
  | 'authCallback'
  | 'help'
  | 'healthKitSettings'
  | 'privacy'
  | 'oauthConsent'
  | 'notFound';

type Loader = () => Promise<{ default: React.ComponentType<any> }>;

export const routeLoaders: Record<RouteKey, Loader> = {
  exercises: () => import('@/pages/Exercises'),
  exerciseDetail: () => import('@/pages/ExerciseDetail'),
  progress: () => import('@/pages/Progress'),
  history: () => import('@/pages/History'),
  bodyMap: () => import('@/pages/BodyMap'),
  dietTracker: () => import('@/pages/DietTracker'),
  stepHistory: () => import('@/pages/StepHistory'),
  profile: () => import('@/pages/Profile'),
  settings: () => import('@/pages/Settings'),
  createPlan: () => import('@/pages/CreatePlan'),
  templates: () => import('@/pages/Templates'),
  workoutPlan: () => import('@/pages/WorkoutPlan'),
  addExercise: () => import('@/pages/AddExercise'),
  editExercise: () => import('@/pages/EditExercise'),
  startWorkout: () => import('@/pages/StartWorkout'),
  auth: () => import('@/pages/Auth'),
  authCallback: () => import('@/pages/AuthCallback'),
  help: () => import('@/pages/Help'),
  healthKitSettings: () => import('@/pages/HealthKitSettings'),
  privacy: () => import('@/pages/Privacy'),
  oauthConsent: () => import('@/pages/OAuthConsent'),
  notFound: () => import('@/pages/NotFound'),
};

/** URL path -> chunk, so a nav item / link can warm itself on pointerdown. */
export const pathToRoute: Record<string, RouteKey> = {
  '/exercises': 'exercises',
  '/progress': 'progress',
  '/history': 'history',
  '/body-map': 'bodyMap',
  '/diet-tracker': 'dietTracker',
  '/step-history': 'stepHistory',
  '/profile': 'profile',
  '/settings': 'settings',
  '/create-plan': 'createPlan',
  '/templates': 'templates',
  '/help': 'help',
  '/healthkit-settings': 'healthKitSettings',
  '/privacy': 'privacy',
  '/auth': 'auth',
};

const inFlight = new Map<RouteKey, Promise<unknown>>();

/** Start (or reuse) the download of a route chunk. Never throws. */
export function preload(key: RouteKey): Promise<unknown> {
  let promise = inFlight.get(key);
  if (!promise) {
    promise = routeLoaders[key]().catch(() => undefined);
    inFlight.set(key, promise);
  }
  return promise;
}

/**
 * Warm the chunk behind a URL path *and* that screen's first-paint data.
 *
 * The data warmers live in `usePrefetchRoutes`, imported lazily here to keep
 * this module dependency-free (it's imported by the app shell on first paint).
 */
export function preloadPath(path: string): void {
  const key = pathToRoute[path];
  if (!key) return;
  void preload(key);
  void import('@/hooks/usePrefetchRoutes')
    .then((m) => m.prefetchRouteData(key))
    .catch(() => {});
}
