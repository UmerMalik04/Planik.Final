import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";

export default function EditExercise() {
  const navigate = useNavigate();
  const { exerciseId } = useParams();
  const { exercises, workoutPlans, updateExercise } = useWorkoutStore();
  const { settings, getText } = useSettings();

  const exercise = exercises.find(e => e.id === exerciseId);
  const plan = workoutPlans.find(p => p.exercises.some(e => e.id === exerciseId));

  const [exerciseName, setExerciseName] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    if (exercise) {
      setExerciseName(exercise.name || "");
      setWeight(exercise.weight ? exercise.weight.toString() : "");
      setReps(exercise.reps ? exercise.reps.toString() : "");
      setDate(exercise.date ? new Date(exercise.date) : new Date());
    }
  }, [exercise]);

  if (!exercise || !plan) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Exercise not found</h2>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleSaveExercise = () => {
    if (!exerciseName.trim() || !weight || !reps) return;

    const updatedExercise = {
      name: exerciseName.trim(),
      weight: Number(weight),
      reps: Number(reps),
      date: date.toISOString()
    };

    updateExercise(exercise.id, updatedExercise);
    navigate(`/workout-plan/${plan.id}`);
  };

  const isValid = exerciseName.trim() && weight && reps && Number(weight) > 0 && Number(reps) > 0;

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
          <h1 className="text-2xl font-bold">Edit Exercise</h1>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Weight ({settings.units})</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="20"
                min="0"
                step="0.5"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="12"
                min="1"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
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
          Update Exercise
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