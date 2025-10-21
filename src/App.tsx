import { useEffect } from 'react';
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

// Import frequently used pages directly for instant navigation
import Home from "./pages/Home";
import History from "./pages/History";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import Exercises from "./pages/Exercises";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import CreatePlan from "./pages/CreatePlan";
import Templates from "./pages/Templates";
import WorkoutPlan from "./pages/WorkoutPlan";
import AddExercise from "./pages/AddExercise";
import EditExercise from "./pages/EditExercise";
import StartWorkout from "./pages/StartWorkout";
import DietTracker from "./pages/DietTracker";
import Demo from "./pages/Demo";
import Profile from "./pages/Profile";
import ExerciseDetail from "./pages/ExerciseDetail";
import BodyMap from "./pages/BodyMap";
import NotFound from "./pages/NotFound";

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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
