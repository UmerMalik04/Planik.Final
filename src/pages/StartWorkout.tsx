import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import { WorkoutImprovementSummary } from "@/components/WorkoutImprovementSummary";

interface TemplateState {
  templateId: string;
  templateName: string;
  templateType: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    hasWarmup: boolean;
  }>;
}

/**
 * StartWorkout page ("/start-workout/:planId").
 * The active-workout screen. Tracks per-set weight/reps, supports drop sets
 * and extra sets, runs a rest timer between sets, and on completion shows
 * an improvement summary before saving the session.
 */
export default function StartWorkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { planId } = useParams();
  const { workoutPlans, startWorkout, completeWorkout, getExerciseHistory, resumeWorkout, currentWorkoutSession, addExerciseToCurrentWorkout } = useWorkoutStore();
  const { settings } = useSettings();
  
  // Check if we're coming from a template (instant navigation)
  const templateState = location.state as TemplateState | undefined;
  const isFromTemplate = planId === 'template' && templateState;
  
  // Create a virtual plan from template data or use existing plan
  const plan = useMemo(() => {
    if (isFromTemplate) {
      return {
        id: `template-${templateState.templateId}`,
        name: templateState.templateName,
        type: templateState.templateType,
        exercises: templateState.exercises.map((ex, idx) => ({
          id: `temp-${idx}`,
          planId: `template-${templateState.templateId}`,
          ...ex
        })),
        restTimer: 90
      };
    }
    return workoutPlans.find(p => p.id === planId);
  }, [isFromTemplate, templateState, workoutPlans, planId]);

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
  const [showSummary, setShowSummary] = useState(false);

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
    const initSession = async () => {
      if (plan && !currentSession) {
        // For templates, create a temporary session
        const session = isFromTemplate 
          ? { id: `temp-session-${Date.now()}`, planId: plan.id, date: new Date().toISOString() }
          : await startWorkout(plan.id);
        console.log('Session created:', session);
        setCurrentSession(session);
        initializeWorkout(session, plan);
      }
    };
    
    initSession();
  }, [plan, planId, isFromTemplate]);

  // Bottom timer effect
  useEffect(() => {
    if (!bottomTimerRunning) return;
    
    const interval = setInterval(() => {
      setBottomTimerSeconds(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [bottomTimerRunning]);

  /**
   * Build the in-memory exercise list for this session, pre-filling each
   * exercise with its previous performance so the user can see if they're
   * improving in real time.
   */
  const initializeWorkout = (session: any, workoutPlan: any) => {
    console.log('Initializing workout with session:', session);
    console.log('Workout plan exercises:', workoutPlan.exercises);
    
    // Initialize completed exercises with plan exercises
    const initialExercises: CompletedExercise[] = workoutPlan.exercises.map((exercise: any, index: number) => {
      const history = getExerciseHistory(exercise.name);
      console.log(`Exercise: ${exercise.name}, History:`, history);
      const lastPerformance = history[0]; // Most recent
      
      console.log(`Last performance for ${exercise.name}:`, lastPerformance);
      
      return {
        id: `${session.id}-${index}`,
        name: exercise.name,
        weight: 0,
        reps: 0,
        sets: exercise.sets || 3,
        date: session.date,
        previousWeight: lastPerformance?.weight,
        previousReps: lastPerformance?.reps,
        previousSetData: lastPerformance?.setData,
        setData: []
      };
    });
    
    console.log('Initial exercises with previous data:', initialExercises);
    setCompletedExercises(initialExercises);
    
    // Initialize sets data
    const initialSetsData: { [key: number]: SetData[] } = {};
    const initialSetTypes: { [key: string]: 'normal' | 'dropset' } = {};
    
    workoutPlan.exercises.forEach((exercise: any, index: number) => {
      initialSetsData[index] = Array(exercise.sets || 3).fill(null).map(() => ({ weight: null as any, reps: null as any, type: 'normal' as const }));
      
      // Initialize set types for all sets to 'normal'
      Array(exercise.sets || 3).fill(0).forEach((_, setIndex) => {
        initialSetTypes[`${index}-${setIndex}`] = 'normal';
      });
    });
    
    setExerciseSets(initialSetsData);
    setSetTypes(initialSetTypes);
  };

  /** Add an ad-hoc exercise to the in-progress workout (also writes it to the plan). */
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

  /**
   * Update one field of one set. When a set transitions from incomplete to
   * complete (weight & reps both > 0), records the rest time and stops the
   * bottom timer. Also recomputes the "best set" for the exercise card.
   */
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

  /** Append an additional set beyond the planned count for the given exercise. */
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

  /** Pop the last extra set off the given exercise. */
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

  /** Switch a single set between 'normal' and 'dropset' types. */
  const updateSetType = (exerciseIndex: number, setIndex: number, type: 'normal' | 'dropset') => {
    const key = `${exerciseIndex}-${setIndex}`;
    setSetTypes(prev => ({
      ...prev,
      [key]: type
    }));
  };

  /** Look up the set type for a given (exercise, set) pair, defaulting to 'normal'. */
  const getSetType = (exerciseIndex: number, setIndex: number): 'normal' | 'dropset' => {
    return setTypes[`${exerciseIndex}-${setIndex}`] || 'normal';
  };

  /** Pick a coloured border for an input based on whether you beat your last performance. */
  const getPerformanceColor = (current: number, previous: number | undefined, field: 'weight' | 'reps') => {
    if (!previous) return 'border-border bg-background text-foreground';
    if (!current || current === 0) return 'border-border bg-background text-foreground';
    
    if (current > previous) return 'border-2 border-success bg-success-light text-success-dark dark:bg-success-dark/20 dark:text-success focus:ring-success';
    if (current < previous) return 'border-2 border-error bg-error-light text-error-dark dark:bg-error-dark/20 dark:text-error focus:ring-error';
    return 'border-2 border-warning bg-warning-light text-warning-dark dark:bg-warning-dark/20 dark:text-warning focus:ring-warning';
  };

  /** Validate the workout (≥ 1 valid exercise) and open the summary dialog. */
  const handleCompleteWorkout = () => {
    if (!currentSession) return;
    
    const validExercises = completedExercises.filter(exercise => 
      exercise.weight > 0 && exercise.reps > 0
    ).map((exercise) => {
      // Find the correct set data for this exercise by finding its index in completedExercises
      const originalIndex = completedExercises.findIndex(e => e.id === exercise.id);
      const setDataForExercise = exerciseSets[originalIndex] || [];
      
      console.log(`Completing ${exercise.name}:`, {
        exercise,
        setData: setDataForExercise,
        previousWeight: exercise.previousWeight,
        previousReps: exercise.previousReps,
        previousSetData: exercise.previousSetData
      });
      
      return {
        ...exercise,
        setData: setDataForExercise
      };
    });
    
    console.log('Valid exercises to save:', validExercises);
    
    if (validExercises.length === 0) {
      alert("Please complete at least one exercise before finishing the workout.");
      return;
    }
    
    // Show summary before completing
    setShowSummary(true);
  };

  /** User confirmed the summary — persist the session and navigate home. */
  const confirmCompleteWorkout = async () => {
    if (!currentSession) return;
    
    const validExercises = completedExercises.filter(exercise => 
      exercise.weight > 0 && exercise.reps > 0
    ).map((exercise) => {
      const originalIndex = completedExercises.findIndex(e => e.id === exercise.id);
      return {
        ...exercise,
        setData: exerciseSets[originalIndex] || []
      };
    });
    
    console.log('Saving workout with session ID:', currentSession.id);
    console.log('Valid exercises:', validExercises);
    
    await completeWorkout(currentSession.id, validExercises);
    navigate("/");
  };

  /** Total sets across all exercises, including extra sets the user added. */
  const getTotalSets = () => {
    return completedExercises.reduce((total, exercise, index) => {
      return total + (exercise.sets + (extraSets[index] || 0));
    }, 0);
  };

  /** Total volume (Σ weight × reps) lifted in this session. */
  const getTotalWeight = () => {
    return Object.values(exerciseSets).reduce((total, sets) => {
      return total + sets.reduce((setTotal, set) => setTotal + (set.weight * set.reps), 0);
    }, 0);
  };

  /** Format a duration in seconds as "M:SS". */
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

      {/* Workout Improvement Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workout Complete! 🎉</DialogTitle>
          </DialogHeader>
          <WorkoutImprovementSummary 
            exercises={completedExercises.filter(e => e.weight > 0 && e.reps > 0)} 
          />
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowSummary(false)} className="flex-1">
              Back to Workout
            </Button>
            <Button onClick={confirmCompleteWorkout} className="flex-1">
              Finish & Save
            </Button>
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
                {(exercise.previousWeight || exercise.previousReps || exercise.previousSetData) && (
                  <div className="mt-2 p-2 bg-muted/50 rounded border border-border/50">
                    <p className="text-xs text-muted-foreground/80 font-medium mb-1">Previous Workout:</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                      {exercise.previousWeight && (
                        <span>Weight: <span className="font-semibold">{exercise.previousWeight}kg</span></span>
                      )}
                      {exercise.previousReps && (
                        <span>Reps: <span className="font-semibold">{exercise.previousReps}</span></span>
                      )}
                      {exercise.previousSetData && (
                        <span>Sets: <span className="font-semibold">{exercise.previousSetData.length}</span></span>
                      )}
                    </div>
                  </div>
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
                  {Array(exercise.sets + (extraSets[index] || 0)).fill(0).map((_, setIndex) => {
                    const currentWeight = exerciseSets[index]?.[setIndex]?.weight;
                    const currentReps = exerciseSets[index]?.[setIndex]?.reps;
                    const previousWeight = exercise.previousSetData?.[setIndex]?.weight || exercise.previousWeight || 0;
                    const previousReps = exercise.previousSetData?.[setIndex]?.reps || exercise.previousReps || 0;
                    const showWeightArrow = currentWeight && currentWeight > 0 && previousWeight > 0;
                    const showRepsArrow = currentReps && currentReps > 0 && previousReps > 0;
                    const isWeightImprovement = currentWeight > previousWeight;
                    const isWeightWorse = currentWeight < previousWeight;
                    const isRepsImprovement = currentReps > previousReps;
                    const isRepsWorse = currentReps < previousReps;
                    
                    return (
                      <div key={setIndex} className="border border-border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              {setIndex < exercise.sets ? `Set ${setIndex + 1}` : `Extra Set ${setIndex - exercise.sets + 1}`}
                            </span>
                            {showWeightArrow && isWeightImprovement && (
                              <span className="text-success text-lg font-bold">↑</span>
                            )}
                            {showWeightArrow && isWeightWorse && (
                              <span className="text-error text-lg font-bold">↓</span>
                            )}
                            {showRepsArrow && isRepsImprovement && !showWeightArrow && (
                              <span className="text-success text-lg font-bold">↑</span>
                            )}
                            {showRepsArrow && isRepsWorse && !showWeightArrow && (
                              <span className="text-error text-lg font-bold">↓</span>
                            )}
                          </div>
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
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-muted-foreground text-xs font-medium">Weight (kg)</Label>
                            {(exercise.previousSetData?.[setIndex]?.weight || exercise.previousWeight) && (
                              <div className="flex items-center gap-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  exerciseSets[index]?.[setIndex]?.weight > 0
                                    ? exerciseSets[index][setIndex].weight > (exercise.previousSetData?.[setIndex]?.weight || exercise.previousWeight || 0)
                                      ? 'bg-success-light text-success-dark border border-success'
                                      : exerciseSets[index][setIndex].weight < (exercise.previousSetData?.[setIndex]?.weight || exercise.previousWeight || 0)
                                      ? 'bg-error-light text-error-dark border border-error'
                                      : 'bg-warning-light text-warning-dark border border-warning'
                                    : 'bg-muted/50 text-muted-foreground/60 border border-border/50'
                                }`}>
                                  Prev: {exercise.previousSetData?.[setIndex]?.weight || exercise.previousWeight}kg
                                </span>
                                {exerciseSets[index]?.[setIndex]?.weight > 0 && (
                                  <span className={`text-xs font-bold ${
                                    exerciseSets[index][setIndex].weight > (exercise.previousSetData?.[setIndex]?.weight || exercise.previousWeight || 0)
                                      ? 'text-success'
                                      : exerciseSets[index][setIndex].weight < (exercise.previousSetData?.[setIndex]?.weight || exercise.previousWeight || 0)
                                      ? 'text-error'
                                      : 'text-warning'
                                  }`}>
                                    {exerciseSets[index][setIndex].weight > (exercise.previousSetData?.[setIndex]?.weight || exercise.previousWeight || 0) && '+'}
                                    {(exerciseSets[index][setIndex].weight - (exercise.previousSetData?.[setIndex]?.weight || exercise.previousWeight || 0)).toFixed(1)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <Input
                            type="number"
                            placeholder={previousWeight > 0 ? previousWeight.toString() : '0'}
                            value={currentWeight ?? ''}
                            onChange={(e) => updateExerciseSet(index, setIndex, 'weight', e.target.value === '' ? null : Number(e.target.value))}
                            className={`antialiased ${getPerformanceColor(
                              currentWeight || 0, 
                              previousWeight, 
                              'weight'
                            )}`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-muted-foreground text-xs font-medium">Reps</Label>
                            {(exercise.previousSetData?.[setIndex]?.reps || exercise.previousReps) && (
                              <div className="flex items-center gap-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  exerciseSets[index]?.[setIndex]?.reps > 0
                                    ? exerciseSets[index][setIndex].reps > (exercise.previousSetData?.[setIndex]?.reps || exercise.previousReps || 0)
                                      ? 'bg-success-light text-success-dark border border-success'
                                      : exerciseSets[index][setIndex].reps < (exercise.previousSetData?.[setIndex]?.reps || exercise.previousReps || 0)
                                      ? 'bg-error-light text-error-dark border border-error'
                                      : 'bg-warning-light text-warning-dark border border-warning'
                                    : 'bg-muted/50 text-muted-foreground/60 border border-border/50'
                                }`}>
                                  Prev: {exercise.previousSetData?.[setIndex]?.reps || exercise.previousReps}
                                </span>
                                {exerciseSets[index]?.[setIndex]?.reps > 0 && (
                                  <span className={`text-xs font-bold ${
                                    exerciseSets[index][setIndex].reps > (exercise.previousSetData?.[setIndex]?.reps || exercise.previousReps || 0)
                                      ? 'text-success'
                                      : exerciseSets[index][setIndex].reps < (exercise.previousSetData?.[setIndex]?.reps || exercise.previousReps || 0)
                                      ? 'text-error'
                                      : 'text-warning'
                                  }`}>
                                    {exerciseSets[index][setIndex].reps > (exercise.previousSetData?.[setIndex]?.reps || exercise.previousReps || 0) && '+'}
                                    {exerciseSets[index][setIndex].reps - (exercise.previousSetData?.[setIndex]?.reps || exercise.previousReps || 0)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <Input
                            type="number"
                            placeholder={previousReps > 0 ? previousReps.toString() : '0'}
                            value={currentReps ?? ''}
                            onChange={(e) => updateExerciseSet(index, setIndex, 'reps', e.target.value === '' ? null : Number(e.target.value))}
                            className={`antialiased ${getPerformanceColor(
                              currentReps || 0, 
                              previousReps, 
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
                    );
                  })}
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