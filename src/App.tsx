import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import { useWorkoutStore } from "./stores/useWorkoutStore";
import { useDietStore } from "./stores/useDietStore";
import { supabase } from "./integrations/supabase/client";
import Layout from "./components/Layout";

// Lazy load route components for code splitting
const Home = lazy(() => import("./pages/Home"));
const CreatePlan = lazy(() => import("./pages/CreatePlan"));
const Templates = lazy(() => import("./pages/Templates"));
const WorkoutPlan = lazy(() => import("./pages/WorkoutPlan"));
const AddExercise = lazy(() => import("./pages/AddExercise"));
const EditExercise = lazy(() => import("./pages/EditExercise"));
const StartWorkout = lazy(() => import("./pages/StartWorkout"));
const History = lazy(() => import("./pages/History"));
const Progress = lazy(() => import("./pages/Progress"));
const DietTracker = lazy(() => import("./pages/DietTracker"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Demo = lazy(() => import("./pages/Demo"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Exercises = lazy(() => import("./pages/Exercises"));
const ExerciseDetail = lazy(() => import("./pages/ExerciseDetail"));
const BodyMap = lazy(() => import("./pages/BodyMap"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function DataInitializer() {
  const initWorkout = useWorkoutStore(state => state.initializeUserData);
  const initDiet = useDietStore(state => state.initializeDietData);

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await Promise.all([initWorkout(), initDiet()]);
      }
    };

    initData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setTimeout(() => {
          initData();
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [initWorkout, initDiet]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DataInitializer />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/" element={
              <AuthGuard>
                <Layout>
                  <Home />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/create-plan" element={
              <AuthGuard>
                <Layout>
                  <CreatePlan />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/templates" element={
              <AuthGuard>
                <Layout>
                  <Templates />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/workout-plan/:planId" element={
              <AuthGuard>
                <Layout>
                  <WorkoutPlan />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/add-exercise/:planId" element={
              <AuthGuard>
                <Layout>
                  <AddExercise />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/edit-exercise/:exerciseId" element={
              <AuthGuard>
                <Layout>
                  <EditExercise />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/start-workout/:planId" element={
              <AuthGuard>
                <Layout>
                  <StartWorkout />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/history" element={
              <AuthGuard>
                <Layout>
                  <History />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/progress" element={
              <AuthGuard>
                <Layout>
                  <Progress />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/diet-tracker" element={
              <AuthGuard>
                <Layout>
                  <DietTracker />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/profile" element={
              <AuthGuard>
                <Layout>
                  <Profile />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/settings" element={
              <AuthGuard>
                <Layout>
                  <Settings />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/exercises" element={
              <AuthGuard>
                <Layout>
                  <Exercises />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/exercises/:exerciseName" element={
              <AuthGuard>
                <Layout>
                  <ExerciseDetail />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/body-map" element={
              <AuthGuard>
                <Layout>
                  <BodyMap />
                </Layout>
              </AuthGuard>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
