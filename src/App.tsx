import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import CreatePlan from "./pages/CreatePlan";
import WorkoutPlan from "./pages/WorkoutPlan";
import AddExercise from "./pages/AddExercise";
import EditExercise from "./pages/EditExercise";
import StartWorkout from "./pages/StartWorkout";
import DietTracker from "./pages/DietTracker";
import Progress from "./pages/Progress";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-plan" element={<CreatePlan />} />
            <Route path="/workout-plan/:planId" element={<WorkoutPlan />} />
            <Route path="/add-exercise/:planId" element={<AddExercise />} />
            <Route path="/edit-exercise/:exerciseId" element={<EditExercise />} />
          <Route path="/start-workout/:planId" element={<StartWorkout />} />
          <Route path="/diet-tracker" element={<DietTracker />} />
          <Route path="/history" element={<History />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
