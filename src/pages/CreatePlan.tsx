import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { useWorkoutStore } from "@/stores/useWorkoutStore";

export default function CreatePlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workoutType = searchParams.get("type") || "";
  const { addWorkoutPlan } = useWorkoutStore();

  const [planName, setPlanName] = useState(`My ${workoutType} Plan`);
  const [sets, setSets] = useState(3);

  const handleCreatePlan = () => {
    const newPlan = {
      name: planName,
      type: workoutType as "Push" | "Pull" | "Leg" | "Arm",
      exercises: [],
      sets: sets
    };

    addWorkoutPlan(newPlan);
    
    // Navigate to exercise entry for this new plan
    // We'll need to get the ID, but since it's based on timestamp, we can find it
    setTimeout(() => {
      const plans = useWorkoutStore.getState().workoutPlans;
      const createdPlan = plans.find(p => p.name === planName && p.type === workoutType);
      if (createdPlan) {
        navigate(`/add-exercise/${createdPlan.id}`);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Workout Plan</h1>
          <p className="text-muted-foreground">{workoutType}</p>
        </div>
      </div>

      {/* Plan Configuration */}
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
            <Label htmlFor="sets">Number of Sets</Label>
            <Input
              id="sets"
              type="number"
              value={sets}
              onChange={(e) => setSets(Number(e.target.value))}
              min="1"
              max="10"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleCreatePlan}
          className="w-full h-12 text-lg"
          disabled={!planName.trim()}
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Plan & Add Exercises
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}