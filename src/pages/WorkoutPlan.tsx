import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function WorkoutPlan() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const { workoutPlans, deleteExercise, deleteWorkoutPlan, updateExercise } = useWorkoutStore();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editReps, setEditReps] = useState(0);
  const [editSets, setEditSets] = useState(0);

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

  const handleEditClick = (exercise: any) => {
    setEditingExercise(exercise);
    setEditName(exercise.name);
    setEditReps(exercise.reps);
    setEditSets(exercise.sets);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingExercise || !editName.trim()) return;
    
    await updateExercise(editingExercise.id, {
      name: editName.trim(),
      reps: editReps,
      sets: editSets,
      weight: editingExercise.weight,
      hasWarmup: editingExercise.hasWarmup,
      planId: editingExercise.planId
    });
    
    setEditDialogOpen(false);
    setEditingExercise(null);
  };

  return (
    <>
      {/* Edit Exercise Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
            <DialogDescription>
              Update the exercise name and target sets
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Exercise Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Exercise name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-reps">Target Reps</Label>
                <Input
                  id="edit-reps"
                  type="number"
                  value={editReps}
                  onChange={(e) => setEditReps(Number(e.target.value))}
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-sets">Sets</Label>
                <Input
                  id="edit-sets"
                  type="number"
                  value={editSets}
                  onChange={(e) => setEditSets(Number(e.target.value))}
                  min="1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <p className="text-muted-foreground">{plan.type}</p>
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
                        Target: {exercise.reps} reps × {exercise.sets} sets
                      </div>
                      {exercise.hasWarmup && (
                        <div className="text-xs text-blue-600">
                          Includes warmup set
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(exercise)}
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

        {/* Action Buttons */}
        <div className="space-y-3">
          {plan.exercises.length > 0 && (
            <Button
              onClick={() => navigate(`/start-workout/${plan.id}`)}
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
            >
              Start Workout
            </Button>
          )}
          
          <Button
            onClick={() => navigate(`/add-exercise/${plan.id}`)}
            className="w-full h-12 text-lg"
            variant={plan.exercises.length > 0 ? "outline" : "default"}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Exercise
          </Button>
        </div>
      </div>
    </>
  );
}
