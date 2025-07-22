import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Check, Plus, Minus, Dumbbell } from "lucide-react";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { CompletedExercise } from "@/stores/useWorkoutStore";

export default function StartWorkout() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const { workoutPlans, startWorkout, completeWorkout, getExerciseHistory, resumeWorkout, currentWorkoutSession, addExerciseToCurrentWorkout } = useWorkoutStore();
  
  const plan = workoutPlans.find(p => p.id === planId);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showAddExerciseDialog, setShowAddExerciseDialog] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseReps, setNewExerciseReps] = useState(10);
  const [newExerciseSets, setNewExerciseSets] = useState(3);

  interface SetData {
    weight: number;
    reps: number;
    dropSetWeight?: number;
    dropSetReps?: number;
    type: 'normal' | 'dropset';
  }
  
  const [exerciseSets, setExerciseSets] = useState<{ [exerciseIndex: number]: SetData[] }>({});
  const [extraSets, setExtraSets] = useState<{ [exerciseIndex: number]: number }>({});
  const [setTypes, setSetTypes] = useState<{ [key: string]: 'normal' | 'dropset' }>({});
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit'
  });

  useEffect(() => {
    // Check for existing workout session first
    if (currentWorkoutSession && currentWorkoutSession.planId === planId) {
      setShowResumeDialog(true);
      return;
    }
    
    if (plan && !currentSession) {
      const session = startWorkout(plan.id);
      setCurrentSession(session);
      initializeWorkout(session, plan);
    }
  }, [plan, currentWorkoutSession, planId]);

  const initializeWorkout = (session: any, workoutPlan: any) => {
    // Initialize completed exercises with plan exercises
    const initialExercises: CompletedExercise[] = workoutPlan.exercises.map((exercise: any, index: number) => {
      const history = getExerciseHistory(exercise.name);
      const lastPerformance = history[0]; // Most recent
      
      return {
        id: `${session.id}-${index}`,
        name: exercise.name,
        weight: 0,
        reps: 0,
        sets: exercise.sets || 3,
        date: session.date,
        previousWeight: lastPerformance?.weight,
        previousReps: lastPerformance?.reps
      };
    });
    
    setCompletedExercises(initialExercises);
    
    // Initialize sets data
    const initialSetsData: { [key: number]: SetData[] } = {};
    const initialSetTypes: { [key: string]: 'normal' | 'dropset' } = {};
    
    workoutPlan.exercises.forEach((exercise: any, index: number) => {
      initialSetsData[index] = Array(exercise.sets || 3).fill(null).map(() => ({ weight: 0, reps: 0, type: 'normal' as const }));
      
      // Initialize set types for all sets to 'normal'
      Array(exercise.sets || 3).fill(0).forEach((_, setIndex) => {
        initialSetTypes[`${index}-${setIndex}`] = 'normal';
      });
    });
    
    setExerciseSets(initialSetsData);
    setSetTypes(initialSetTypes);
  };

  const handleResumeWorkout = () => {
    if (currentWorkoutSession && plan) {
      setCurrentSession(currentWorkoutSession);
      initializeWorkout(currentWorkoutSession, plan);
    }
    setShowResumeDialog(false);
  };

  const handleStartNewWorkout = () => {
    if (plan) {
      const session = startWorkout(plan.id);
      setCurrentSession(session);
      initializeWorkout(session, plan);
    }
    setShowResumeDialog(false);
  };

  const addNewExercise = () => {
    if (!newExerciseName.trim() || !currentSession) return;
    
    const newExercise = {
      name: newExerciseName,
      reps: newExerciseReps,
      sets: newExerciseSets,
    };
    
    addExerciseToCurrentWorkout(newExercise);
    
    // Add to current completed exercises
    const history = getExerciseHistory(newExerciseName);
    const lastPerformance = history[0];
    
    const newCompletedExercise: CompletedExercise = {
      id: `${currentSession.id}-${completedExercises.length}`,
      name: newExerciseName,
      weight: 0,
      reps: 0,
      sets: newExerciseSets,
      date: currentSession.date,
      previousWeight: lastPerformance?.weight,
      previousReps: lastPerformance?.reps
    };
    
    setCompletedExercises(prev => [...prev, newCompletedExercise]);
    
    // Initialize sets data for new exercise
    const exerciseIndex = completedExercises.length;
    setExerciseSets(prev => ({
      ...prev,
      [exerciseIndex]: Array(newExerciseSets).fill(null).map(() => ({ weight: 0, reps: 0, type: 'normal' as const }))
    }));
    
    // Initialize set types for new exercise
    const newSetTypes: { [key: string]: 'normal' | 'dropset' } = {};
    Array(newExerciseSets).fill(0).forEach((_, setIndex) => {
      newSetTypes[`${exerciseIndex}-${setIndex}`] = 'normal';
    });
    setSetTypes(prev => ({ ...prev, ...newSetTypes }));
    
    // Reset form
    setNewExerciseName("");
    setNewExerciseReps(10);
    setNewExerciseSets(3);
    setShowAddExerciseDialog(false);
  };

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

  const updateExerciseSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps' | 'dropSetWeight' | 'dropSetReps', value: number) => {
    setExerciseSets(prev => {
      const updated = { ...prev };
      if (!updated[exerciseIndex]) {
        updated[exerciseIndex] = Array(3).fill(null).map(() => ({ weight: 0, reps: 0, type: 'normal' as const }));
      }
      updated[exerciseIndex][setIndex] = {
        ...updated[exerciseIndex][setIndex],
        [field]: value
      };
      
      // Update completed exercise with best set values
      const sets = updated[exerciseIndex];
      const bestSet = sets.reduce((best, current) => {
        const bestTotal = best.weight * best.reps;
        const currentTotal = current.weight * current.reps;
        return currentTotal > bestTotal ? current : best;
      }, { weight: 0, reps: 0, type: 'normal' as const });
      
      setCompletedExercises(prevExercises =>
        prevExercises.map((exercise, i) =>
          i === exerciseIndex ? { ...exercise, weight: bestSet.weight, reps: bestSet.reps } : exercise
        )
      );
      
      return updated;
    });
  };

  const addExtraSet = (exerciseIndex: number) => {
    setExtraSets(prev => ({
      ...prev,
      [exerciseIndex]: (prev[exerciseIndex] || 0) + 1
    }));
    
    setExerciseSets(prev => {
      const updated = { ...prev };
      if (!updated[exerciseIndex]) {
        updated[exerciseIndex] = [];
      }
      updated[exerciseIndex].push({ weight: 0, reps: 0, type: 'normal' as const });
      return updated;
    });
    
    // Initialize set type for new extra set
    const totalSets = (completedExercises[exerciseIndex]?.sets || 3) + (extraSets[exerciseIndex] || 0);
    setSetTypes(prev => ({
      ...prev,
      [`${exerciseIndex}-${totalSets}`]: 'normal'
    }));
  };

  const removeExtraSet = (exerciseIndex: number) => {
    setExtraSets(prev => ({
      ...prev,
      [exerciseIndex]: Math.max(0, (prev[exerciseIndex] || 0) - 1)
    }));
    
    setExerciseSets(prev => {
      const updated = { ...prev };
      if (updated[exerciseIndex] && updated[exerciseIndex].length > 0) {
        updated[exerciseIndex].pop();
      }
      return updated;
    });
  };

  const updateSetType = (exerciseIndex: number, setIndex: number, type: 'normal' | 'dropset') => {
    const key = `${exerciseIndex}-${setIndex}`;
    setSetTypes(prev => ({
      ...prev,
      [key]: type
    }));
  };

  const getSetType = (exerciseIndex: number, setIndex: number): 'normal' | 'dropset' => {
    return setTypes[`${exerciseIndex}-${setIndex}`] || 'normal';
  };

  const getPerformanceColor = (current: number, previous: number | undefined, field: 'weight' | 'reps') => {
    if (!previous) return 'border-border bg-background text-foreground';
    
    let currentScore = field === 'weight' ? current : current;
    let previousScore = field === 'weight' ? previous : previous;
    
    if (currentScore > previousScore) return 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100';
    if (currentScore < previousScore) return 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100';
    return 'border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100';
  };

  const handleCompleteWorkout = () => {
    if (!currentSession) return;
    
    const validExercises = completedExercises.filter(exercise => 
      exercise.weight > 0 && exercise.reps > 0
    );
    
    if (validExercises.length === 0) {
      alert("Please complete at least one exercise before finishing the workout.");
      return;
    }
    
    completeWorkout(currentSession.id, validExercises);
    navigate("/");
  };

  return (
    <>
      {/* Resume Workout Dialog */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Resume Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              You have an ongoing workout session. Would you like to resume where you left off or start a new workout?
            </p>
            <div className="flex gap-3">
              <Button onClick={handleResumeWorkout} className="flex-1">
                Resume Workout
              </Button>
              <Button onClick={handleStartNewWorkout} variant="outline" className="flex-1">
                Start New
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Exercise Dialog */}
      <Dialog open={showAddExerciseDialog} onOpenChange={setShowAddExerciseDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">Exercise Name</Label>
              <Input
                placeholder="Exercise name"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground">Target Reps</Label>
                <Input
                  type="number"
                  value={newExerciseReps}
                  onChange={(e) => setNewExerciseReps(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-foreground">Sets</Label>
                <Input
                  type="number"
                  value={newExerciseSets}
                  onChange={(e) => setNewExerciseSets(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <Button onClick={addNewExercise} className="w-full">
              Add Exercise
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen p-6 space-y-6 bg-background text-foreground">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/workout-plan/${plan?.id}`)}
            className="hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{plan?.name}</h1>
            <p className="text-muted-foreground">{currentDate}</p>
          </div>
        </div>

        {/* Add Exercise Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => setShowAddExerciseDialog(true)}
            variant="outline"
            className="border-dashed"
          >
            <Dumbbell className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        </div>

        {/* Exercises */}
        <div className="space-y-4">
          {completedExercises.map((exercise, index) => (
            <Card key={index} className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground">{exercise.name}</CardTitle>
                {exercise.previousWeight && exercise.previousReps && (
                  <p className="text-sm text-muted-foreground">
                    Last time: {exercise.previousWeight}kg × {exercise.previousReps} reps
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center text-sm text-muted-foreground mb-4">
                  Sets: {exercise.sets}
                </div>
                
                {/* Individual Sets */}
                <div className="space-y-3">
                  {Array(exercise.sets + (extraSets[index] || 0)).fill(0).map((_, setIndex) => (
                    <div key={setIndex} className="border border-border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {setIndex < exercise.sets ? `Set ${setIndex + 1}` : `Extra Set ${setIndex - exercise.sets + 1}`}
                        </span>
                        <Select 
                          defaultValue="normal"
                          onValueChange={(value: 'normal' | 'dropset') => updateSetType(index, setIndex, value)}
                        >
                          <SelectTrigger className="w-24 h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="dropset">Drop Set</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-muted-foreground text-xs font-medium">Weight (kg)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder={exercise.previousWeight ? `Previous: ${exercise.previousWeight}kg` : "0"}
                              value={exerciseSets[index]?.[setIndex]?.weight || ''}
                              onChange={(e) => updateExerciseSet(index, setIndex, 'weight', Number(e.target.value))}
                              className={`mt-1 ${getPerformanceColor(
                                exerciseSets[index]?.[setIndex]?.weight || 0, 
                                exercise.previousWeight, 
                                'weight'
                              )}`}
                            />
                            {exercise.previousWeight && !exerciseSets[index]?.[setIndex]?.weight && (
                              <div className="absolute inset-0 flex items-center px-3 mt-1 pointer-events-none">
                                <span className="text-muted-foreground/40 text-sm">
                                  Previous: {exercise.previousWeight}kg
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs font-medium">Reps</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder={exercise.previousReps ? `Previous: ${exercise.previousReps}` : "0"}
                              value={exerciseSets[index]?.[setIndex]?.reps || ''}
                              onChange={(e) => updateExerciseSet(index, setIndex, 'reps', Number(e.target.value))}
                              className={`mt-1 ${getPerformanceColor(
                                exerciseSets[index]?.[setIndex]?.reps || 0, 
                                exercise.previousReps, 
                                'reps'
                              )}`}
                            />
                            {exercise.previousReps && !exerciseSets[index]?.[setIndex]?.reps && (
                              <div className="absolute inset-0 flex items-center px-3 mt-1 pointer-events-none">
                                <span className="text-muted-foreground/40 text-sm">
                                  Previous: {exercise.previousReps}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Drop Set Fields - Only show when dropset is selected */}
                      {getSetType(index, setIndex) === 'dropset' && (
                        <div className="mt-3 p-2 bg-muted rounded border">
                          <Label className="text-muted-foreground text-xs">Drop Set</Label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <Input
                              type="number"
                              placeholder="Drop weight"
                              value={exerciseSets[index]?.[setIndex]?.dropSetWeight || ''}
                              onChange={(e) => updateExerciseSet(index, setIndex, 'dropSetWeight', Number(e.target.value))}
                              className="h-8 text-xs"
                            />
                            <Input
                              type="number"
                              placeholder="Drop reps"
                              value={exerciseSets[index]?.[setIndex]?.dropSetReps || ''}
                              onChange={(e) => updateExerciseSet(index, setIndex, 'dropSetReps', Number(e.target.value))}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Add/Remove Set Buttons */}
                <div className="flex gap-2 justify-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addExtraSet(index)}
                    className="border-border"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Set
                  </Button>
                  {(extraSets[index] || 0) > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExtraSet(index)}
                      className="border-border"
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Remove Set
                    </Button>
                  )}
                </div>
                
                {/* Progress indicators */}
                <div className="flex gap-2 text-xs">
                  {exercise.weight > 0 && exercise.previousWeight && (
                    <span className={
                      exercise.weight > exercise.previousWeight ? 'text-green-500' :
                      exercise.weight < exercise.previousWeight ? 'text-red-500' :
                      'text-yellow-500'
                    }>
                      Weight: {exercise.weight > exercise.previousWeight ? '+' : ''}
                      {exercise.weight - exercise.previousWeight}kg
                    </span>
                  )}
                  {exercise.reps > 0 && exercise.previousReps && (
                    <span className={
                      exercise.reps > exercise.previousReps ? 'text-green-500' :
                      exercise.reps < exercise.previousReps ? 'text-red-500' :
                      'text-yellow-500'
                    }>
                      Reps: {exercise.reps > exercise.previousReps ? '+' : ''}
                      {exercise.reps - exercise.previousReps}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Complete Workout Button */}
        <div className="space-y-3">
          <Button
            onClick={handleCompleteWorkout}
            className="w-full h-12 text-lg"
          >
            <Check className="w-5 h-5 mr-2" />
            Complete Workout
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate(`/workout-plan/${plan?.id}`)}
            className="w-full border-border"
          >
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}