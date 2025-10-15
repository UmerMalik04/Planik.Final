import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Check, Plus, Minus, Dumbbell, Timer, Play, Pause, RotateCcw, Share2 } from "lucide-react";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { CompletedExercise } from "@/stores/useWorkoutStore";
import { useSettings } from "@/contexts/SettingsContext";
import { useShare } from "@/hooks/useShare";
import { ShareWorkout } from "@/components/ShareWorkout";

export default function StartWorkout() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const { workoutPlans, startWorkout, completeWorkout, getExerciseHistory, resumeWorkout, currentWorkoutSession, addExerciseToCurrentWorkout } = useWorkoutStore();
  const { settings } = useSettings();
  
  const plan = workoutPlans.find(p => p.id === planId);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
  const [showAddExerciseDialog, setShowAddExerciseDialog] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseReps, setNewExerciseReps] = useState(10);
  const [newExerciseSets, setNewExerciseSets] = useState(3);
  
  // Bottom timer state
  const [bottomTimerRunning, setBottomTimerRunning] = useState(false);
  const [bottomTimerSeconds, setBottomTimerSeconds] = useState(0);
  const [bottomTimerRecords, setBottomTimerRecords] = useState<{exerciseIndex: number, setIndex: number, restTime: number}[]>([]);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [timerInputMinutes, setTimerInputMinutes] = useState("0");
  const [timerInputSeconds, setTimerInputSeconds] = useState("0");
  const [showShareSheet, setShowShareSheet] = useState(false);

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
    if (plan && !currentSession) {
      const session = startWorkout(plan.id);
      setCurrentSession(session);
      initializeWorkout(session, plan);
    }
  }, [plan, planId]);

  // Bottom timer effect
  useEffect(() => {
    if (!bottomTimerRunning) return;
    
    const interval = setInterval(() => {
      setBottomTimerSeconds(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [bottomTimerRunning]);

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
        previousReps: lastPerformance?.reps,
        previousSetData: lastPerformance?.setData
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
      previousReps: lastPerformance?.reps,
      previousSetData: lastPerformance?.setData
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
      
      const oldSet = updated[exerciseIndex][setIndex];
      updated[exerciseIndex][setIndex] = {
        ...updated[exerciseIndex][setIndex],
        [field]: value
      };
      
      // Check if set is now complete (both weight and reps > 0) and wasn't before
      const newSet = updated[exerciseIndex][setIndex];
      const wasIncomplete = !oldSet || oldSet.weight === 0 || oldSet.reps === 0;
      const isNowComplete = newSet.weight > 0 && newSet.reps > 0;
      
      // Record rest time when set is completed (but don't auto-start timer)
      if (wasIncomplete && isNowComplete) {
        // Record the rest time for this set
        if (bottomTimerRunning) {
          setBottomTimerRecords(prev => [...prev, {
            exerciseIndex,
            setIndex,
            restTime: bottomTimerSeconds
          }]);
          // Stop the timer when a set is completed
          setBottomTimerRunning(false);
        }
      }
      
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
    if (!previous || current === 0) return 'border-border bg-background text-foreground';
    
    if (current > previous) return 'border-2 border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100 focus:ring-green-500';
    if (current < previous) return 'border-2 border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100 focus:ring-red-500';
    return 'border-2 border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100 focus:ring-yellow-500';
  };

  const handleCompleteWorkout = () => {
    if (!currentSession) return;
    
    const validExercises = completedExercises.filter(exercise => 
      exercise.weight > 0 && exercise.reps > 0
    ).map((exercise) => {
      // Find the correct set data for this exercise by finding its index in completedExercises
      const originalIndex = completedExercises.findIndex(e => e.id === exercise.id);
      return {
        ...exercise,
        setData: exerciseSets[originalIndex] || []
      };
    });
    
    if (validExercises.length === 0) {
      alert("Please complete at least one exercise before finishing the workout.");
      return;
    }
    
    completeWorkout(currentSession.id, validExercises);
    navigate("/");
  };

  const getTotalSets = () => {
    return completedExercises.reduce((total, exercise, index) => {
      return total + (exercise.sets + (extraSets[index] || 0));
    }, 0);
  };

  const getTotalWeight = () => {
    return Object.values(exerciseSets).reduce((total, sets) => {
      return total + sets.reduce((setTotal, set) => setTotal + (set.weight * set.reps), 0);
    }, 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleBottomTimer = () => {
    setBottomTimerRunning(!bottomTimerRunning);
  };

  const resetBottomTimer = () => {
    setBottomTimerSeconds(0);
    setBottomTimerRunning(false);
  };

  const handleShareWorkout = () => {
    setShowShareSheet(true);
  };

  const handleTimerEdit = () => {
    const mins = Math.floor(bottomTimerSeconds / 60);
    const secs = bottomTimerSeconds % 60;
    setTimerInputMinutes(mins.toString());
    setTimerInputSeconds(secs.toString());
    setIsEditingTimer(true);
    setBottomTimerRunning(false);
  };

  const handleTimerSave = () => {
    const mins = parseInt(timerInputMinutes) || 0;
    const secs = parseInt(timerInputSeconds) || 0;
    setBottomTimerSeconds(mins * 60 + secs);
    setIsEditingTimer(false);
  };

  return (
    <>
      {/* Share Workout Sheet */}
      <ShareWorkout 
        open={showShareSheet}
        onOpenChange={setShowShareSheet}
        workoutData={{
          planName: plan?.name || 'Workout',
          exerciseCount: completedExercises.length,
          totalSets: getTotalSets(),
          totalWeight: getTotalWeight()
        }}
      />

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
        <div className="flex items-center justify-between gap-4">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShareWorkout}
            className="hover:bg-accent"
          >
            <Share2 className="w-5 h-5" />
          </Button>
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
                {/* Rest Timer for this exercise */}
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Rest Timer</p>
                        {isEditingTimer ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={timerInputMinutes}
                              onChange={(e) => setTimerInputMinutes(e.target.value)}
                              className="w-16 h-8 text-center font-mono text-lg"
                              placeholder="0"
                              min="0"
                              max="99"
                            />
                            <span className="text-lg">:</span>
                            <Input
                              type="number"
                              value={timerInputSeconds}
                              onChange={(e) => setTimerInputSeconds(e.target.value)}
                              className="w-16 h-8 text-center font-mono text-lg"
                              placeholder="00"
                              min="0"
                              max="59"
                            />
                            <Button
                              size="sm"
                              onClick={handleTimerSave}
                              className="ml-2"
                            >
                              Set
                            </Button>
                          </div>
                        ) : (
                          <button 
                            onClick={handleTimerEdit}
                            className="text-2xl font-mono font-bold hover:text-primary transition-colors"
                          >
                            {formatTime(bottomTimerSeconds)}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {!isEditingTimer && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleBottomTimer}
                        >
                          {bottomTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetBottomTimer}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

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
                          <Input
                            type="number"
                            placeholder={
                              exercise.previousSetData?.[setIndex]?.weight 
                                ? `Prev: ${exercise.previousSetData[setIndex].weight}kg` 
                                : exercise.previousWeight 
                                ? `Prev: ${exercise.previousWeight}kg` 
                                : "0"
                            }
                            value={exerciseSets[index]?.[setIndex]?.weight || ''}
                            onChange={(e) => updateExerciseSet(index, setIndex, 'weight', Number(e.target.value))}
                            className={`mt-1 antialiased placeholder:text-xs sm:placeholder:text-sm ${getPerformanceColor(
                              exerciseSets[index]?.[setIndex]?.weight || 0, 
                              exercise.previousSetData?.[setIndex]?.weight || exercise.previousWeight, 
                              'weight'
                            )}`}
                          />
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs font-medium">Reps</Label>
                          <Input
                            type="number"
                            placeholder={
                              exercise.previousSetData?.[setIndex]?.reps 
                                ? `Prev: ${exercise.previousSetData[setIndex].reps}` 
                                : exercise.previousReps 
                                ? `Prev: ${exercise.previousReps}` 
                                : "0"
                            }
                            value={exerciseSets[index]?.[setIndex]?.reps || ''}
                            onChange={(e) => updateExerciseSet(index, setIndex, 'reps', Number(e.target.value))}
                            className={`mt-1 antialiased placeholder:text-xs sm:placeholder:text-sm ${getPerformanceColor(
                              exerciseSets[index]?.[setIndex]?.reps || 0, 
                              exercise.previousSetData?.[setIndex]?.reps || exercise.previousReps, 
                              'reps'
                            )}`}
                          />
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
        <div className="space-y-3 pb-24">
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