/**
 * CreatePlan page ("/create-plan").
 * Lets the user name a new workout plan and set its default rest timer,
 * then routes to the AddExercise page for that newly-created plan.
 */

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { SEO } from "@/components/SEO";

export default function CreatePlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workoutType = searchParams.get("type") || "";
  const { addWorkoutPlan } = useWorkoutStore();

  const [planName, setPlanName] = useState(`My ${workoutType} Plan`);
  const [restTimer, setRestTimer] = useState("1.5");

  /**
   * Persist the new plan, then look it up by name+type to grab its ID and
   * navigate the user straight into adding exercises.
   */
  const handleCreatePlan = async () => {
    const newPlan = {
      name: planName,
      type: workoutType,
      exercises: [],
      restTimer: Math.round((Number(restTimer) || 1.5) * 60),
    };

    await addWorkoutPlan(newPlan);

    const plans = useWorkoutStore.getState().workoutPlans;
    const createdPlan = plans.find(p => p.name === planName && p.type === workoutType);
    if (createdPlan) {
      navigate(`/add-exercise/${createdPlan.id}`);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <SEO
        title="Create Workout Plan — Planik"
        description="Build a new workout plan in seconds. Name it, set your default rest timer, then add exercises tailored to your goals."
      />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Workout Plan</h1>
          <p className="text-muted-foreground">{workoutType}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="planName">Workout Plan Name</Label>
            <Input
              id="planName"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g., Chest Shred"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="restTimer">Rest Timer Between Sets (minutes)</Label>
            <Input
              id="restTimer"
              type="number"
              step="0.5"
              value={restTimer}
              onChange={(e) => setRestTimer(e.target.value)}
              min="0.5"
              max="5"
              placeholder="1.5"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button onClick={handleCreatePlan} className="w-full h-12 text-lg" disabled={!planName.trim()}>
          <Plus className="w-5 h-5 mr-2" />
          Create Plan & Add Exercises
        </Button>

        <Button variant="outline" onClick={() => navigate("/")} className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}
