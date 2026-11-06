/**
 * App.tsx — Route table + global data wiring.
 *
 * What lives here:
 *  - The React Query client (caches every server fetch so the same data isn't
 *    re-downloaded between screens).
 *  - The route table (which URL renders which page).
 *  - DataInitializer: a tiny invisible component that bootstraps the user's
 *    workout + diet data the moment they're authenticated, and re-runs the
 *    bootstrap whenever a SIGNED_IN event fires.
 *  - Code-splitting: rarely-used pages are `lazy()`-loaded so the initial
 *    JS bundle stays small (faster cold start, important on mobile data).
 */
import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useWorkoutStore } from "./stores/useWorkoutStore";
import { useDietStore } from "./stores/useDietStore";
import { supabase } from "./integrations/supabase/client";
import { useOfflineSync } from "./hooks/useOfflineSync";
import { useNativeAppleAuth } from "./hooks/useNativeAppleAuth";
import { useNativeGoogleAuth } from "./hooks/useNativeGoogleAuth";
import Layout from "./components/Layout";
import PageShell from "./components/PageShell";
import { routeLoaders } from "@/lib/routePreload";
import { usePrefetchRoutes } from "@/hooks/usePrefetchRoutes";

// Eagerly load the landing page only — everything else is lazy so heavy
// dependencies (recharts, html5-qrcode, the exercise catalog) stay out of
// the initial JS bundle and load on demand when the user navigates.
// The loaders live in `routePreload` so idle prefetching and the real
// navigation share one dynamic import (and therefore one request).
import Home from "./pages/Home";
const Exercises = lazy(routeLoaders.exercises);
const Progress = lazy(routeLoaders.progress);
const History = lazy(routeLoaders.history);
const BodyMap = lazy(routeLoaders.bodyMap);

// Lazy load less frequently used pages
const Settings = lazy(routeLoaders.settings);
const Auth = lazy(routeLoaders.auth);
const AuthCallback = lazy(routeLoaders.authCallback);
const CreatePlan = lazy(routeLoaders.createPlan);
const Templates = lazy(routeLoaders.templates);
const WorkoutPlan = lazy(routeLoaders.workoutPlan);
const AddExercise = lazy(routeLoaders.addExercise);
const EditExercise = lazy(routeLoaders.editExercise);
const StartWorkout = lazy(routeLoaders.startWorkout);
const DietTracker = lazy(routeLoaders.dietTracker);
const Profile = lazy(routeLoaders.profile);
const ExerciseDetail = lazy(routeLoaders.exerciseDetail);
const StepHistory = lazy(routeLoaders.stepHistory);
const Help = lazy(routeLoaders.help);
const HealthKitSettings = lazy(routeLoaders.healthKitSettings);
const Privacy = lazy(routeLoaders.privacy);
const NotFound = lazy(routeLoaders.notFound);


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Treat cached data as "fresh" for 10 minutes — skip refetching during
      // that window when components remount. Big perceived-speed win on a
      // SPA where users navigate between the same screens repeatedly.
      staleTime: 10 * 60 * 1000,
      // Keep unused cached queries in memory for 30 minutes before garbage
      // collecting. So returning to a screen after a detour is instant.
      gcTime: 30 * 60 * 1000,
      // Don't auto-refetch every time the tab regains focus — it caused
      // flicker on mobile when switching apps and back.
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Invisible component (returns null) whose only job is to:
 *  1. Hydrate the Zustand stores from Supabase the moment we know who the
 *     user is.
 *  2. Spin up the offline-sync hook so local IndexedDB stays in step with
 *     the cloud — this is what lets the app keep working with no signal.
 *  3. Re-hydrate when an auth state change (SIGNED_IN) fires, e.g. after
 *     completing the Google OAuth redirect.
 */
function DataInitializer() {
  const initWorkout = useWorkoutStore(state => state.initializeUserData);
  const initDiet = useDietStore(state => state.initializeDietData);

  // Subscribes to online/offline transitions and mirrors data to IndexedDB.
  useOfflineSync();
  // Warms every route chunk during idle time so tapping a tab is instant.
  usePrefetchRoutes();

  // Bridges native iOS Apple Sign-In events into Supabase sessions.
  useNativeAppleAuth();
  // Same bridge for native Google Sign-In.
  useNativeGoogleAuth();

  useEffect(() => {
    // Guard against state updates after unmount (React would warn otherwise).
    let isMounted = true;

    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isMounted) {
        // Run both store inits in parallel — they hit different tables and
        // don't depend on each other.
        await Promise.all([initWorkout(), initDiet()]);
      }
    };

    initData();

    // Re-bootstrap when the user signs in mid-session (e.g. Google OAuth).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Deferred so data loading never runs inside the auth lock (deadlock).
      if (event === 'SIGNED_IN' && isMounted) {
        setTimeout(() => initData(), 0);
      }
    });

    // Clean up the listener and silence pending async work on unmount.
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initWorkout, initDiet]);

  return null;
}

/**
 * Wraps every authenticated route in:
 *  - ProtectedRoute: redirects to /auth if there is no session.
 *  - Layout:         persistent shell (top bar + bottom nav) so it doesn't
 *                    re-mount between page navigations (no flicker).
 *  - Suspense:       fallback while a lazy()-loaded page chunk downloads.
 *                    `null` (no spinner) because chunks are small and a
 *                    flashing spinner feels worse than a 50 ms gap.
 */
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<PageShell />}>

          <Outlet />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

/**
 * The full route table. Anything inside <ProtectedLayout /> requires a signed-in
 * user; everything else (auth screens, /demo) is reachable without a session.
 * The catch-all `*` route renders the NotFound page for any unknown URL.
 */
function AppRoutes() {
  return (
    <Suspense fallback={<PageShell />}>
      <Routes>
        {/* ---- Public routes (no auth required) ---- */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* ---- Protected routes that share the persistent Layout shell ---- */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/create-plan" element={<CreatePlan />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/workout-plan/:planId" element={<WorkoutPlan />} />
          <Route path="/add-exercise/:planId" element={<AddExercise />} />
          <Route path="/edit-exercise/:exerciseId" element={<EditExercise />} />
          <Route path="/start-workout/:planId" element={<StartWorkout />} />
          <Route path="/history" element={<History />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/diet-tracker" element={<DietTracker />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/exercises/:exerciseName" element={<ExerciseDetail />} />
          <Route path="/body-map" element={<BodyMap />} />
          <Route path="/step-history" element={<StepHistory />} />
          <Route path="/help" element={<Help />} />
          <Route path="/healthkit-settings" element={<HealthKitSettings />} />
        </Route>

        {/* 404 fallback — must be the LAST route so it only matches if
            nothing above did. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

/**
 * Root component. Composes the global providers in the order they're needed:
 *  - QueryClientProvider: server-state cache (React Query).
 *  - TooltipProvider:     shadcn tooltip primitives.
 *  - Toaster + Sonner:    two toast portals (legacy + new style).
 *  - AuthProvider:        exposes the current Supabase user via useAuth().
 *  - DataInitializer:     kicks off the post-auth data hydration.
 *  - AppRoutes:           the actual screens.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <DataInitializer />
          <AppRoutes />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
