import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import CreatePlan from "./pages/CreatePlan";
import WorkoutPlan from "./pages/WorkoutPlan";
import AddExercise from "./pages/AddExercise";
import EditExercise from "./pages/EditExercise";
import StartWorkout from "./pages/StartWorkout";
import History from "./pages/History";
import Progress from "./pages/Progress";
import DietTracker from "./pages/DietTracker";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Demo from "./pages/Demo";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Exercises from "./pages/Exercises";
import ExerciseDetail from "./pages/ExerciseDetail";
import BodyMap from "./pages/BodyMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
