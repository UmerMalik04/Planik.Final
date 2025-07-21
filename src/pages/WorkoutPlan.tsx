import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function WorkoutPlan() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const { workoutPlans, deleteExercise, deleteWorkoutPlan } = useWorkoutStore();

  const plan = workoutPlans.find(p => p.id === planId);

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

  const handleDeletePlan = () => {
    deleteWorkoutPlan(plan.id);
    navigate("/");
  };

  const handleDeleteExercise = (exerciseId: string) => {
    deleteExercise(exerciseId);
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{plan.name}</h1>
          <p className="text-muted-foreground">{plan.type} • {plan.sets} sets</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="w-5 h-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workout Plan</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete "{plan.name}" and all its exercises. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive text-destructive-foreground">
                Delete Plan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Exercises */}
      <Card>
        <CardHeader>
          <CardTitle>Exercises ({plan.exercises.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {plan.exercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No exercises added yet</p>
              <p className="text-sm">Tap the + button to add your first exercise</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plan.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {exercise.weight}kg × {exercise.reps} reps
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(exercise.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/edit-exercise/${exercise.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove "{exercise.name}" from this workout plan?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteExercise(exercise.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Exercise Button */}
      <Button
        onClick={() => navigate(`/add-exercise/${plan.id}`)}
        className="w-full h-12 text-lg"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Exercise
      </Button>
    </div>
  );
}