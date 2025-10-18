import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { useWorkoutStore } from "@/stores/useWorkoutStore";

export default function AddExercise() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const { addExercise, workoutPlans } = useWorkoutStore();

  const plan = workoutPlans.find(p => p.id === planId);
  const [exerciseName, setExerciseName] = useState("");
  const [hasWarmup, setHasWarmup] = useState(false);

  if (!plan) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Plan not found</h2>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleSaveExercise = () => {
    if (!exerciseName.trim()) return;

    const exercise = {
      name: exerciseName.trim(),
      reps: 10,
      sets: 3,
      hasWarmup
    };

    addExercise(plan.id, exercise);
    navigate(`/workout-plan/${plan.id}`);
  };

  const isValid = exerciseName.trim();

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/workout-plan/${plan.id}`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Exercise</h1>
          <p className="text-muted-foreground">{plan.name}</p>
        </div>
      </div>

      {/* Exercise Form */}
      <Card>
        <CardHeader>
          <CardTitle>Exercise Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="exerciseName">Exercise Name</Label>
            <Input
              id="exerciseName"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g., Bicep Curls"
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="warmup"
              checked={hasWarmup}
              onCheckedChange={(checked) => setHasWarmup(!!checked)}
            />
            <Label htmlFor="warmup">Add warmup set</Label>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleSaveExercise}
          className="w-full h-12 text-lg"
          disabled={!isValid}
        >
          <Save className="w-5 h-5 mr-2" />
          Save Exercise
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate(`/workout-plan/${plan.id}`)}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}