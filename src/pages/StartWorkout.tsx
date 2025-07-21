import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { CompletedExercise } from "@/stores/useWorkoutStore";

export default function StartWorkout() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const { workoutPlans, startWorkout, completeWorkout, getExerciseHistory } = useWorkoutStore();
  
  const plan = workoutPlans.find(p => p.id === planId);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);

  interface SetData {
    weight: number;
    reps: number;
  }
  
  const [exerciseSets, setExerciseSets] = useState<{ [exerciseIndex: number]: SetData[] }>({});
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit'
  });

  useEffect(() => {
    if (plan && !currentSession) {
      const session = startWorkout(plan.id);
      setCurrentSession(session);
      
      // Initialize completed exercises with plan exercises
      const initialExercises: CompletedExercise[] = plan.exercises.map((exercise, index) => {
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
      plan.exercises.forEach((exercise, index) => {
        initialSetsData[index] = Array(exercise.sets || 3).fill(null).map(() => ({ weight: 0, reps: 0 }));
      });
      setExerciseSets(initialSetsData);
    }
  }, [plan]);

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

  const updateExerciseSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setExerciseSets(prev => {
      const updated = { ...prev };
      if (!updated[exerciseIndex]) {
        updated[exerciseIndex] = Array(3).fill(null).map(() => ({ weight: 0, reps: 0 }));
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
      }, { weight: 0, reps: 0 });
      
      setCompletedExercises(prevExercises =>
        prevExercises.map((exercise, i) =>
          i === exerciseIndex ? { ...exercise, weight: bestSet.weight, reps: bestSet.reps } : exercise
        )
      );
      
      return updated;
    });
  };

  const getPerformanceColor = (current: number, previous: number | undefined, field: 'weight' | 'reps') => {
    if (!previous) return 'border-gray-300';
    
    let currentScore = field === 'weight' ? current : current;
    let previousScore = field === 'weight' ? previous : previous;
    
    if (currentScore > previousScore) return 'border-green-500 bg-green-50';
    if (currentScore < previousScore) return 'border-red-500 bg-red-50';
    return 'border-yellow-500 bg-yellow-50';
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
    <div className="min-h-screen p-6 space-y-6 bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/workout-plan/${plan.id}`)}
          className="text-white hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{plan.name}</h1>
          <p className="text-gray-400">{currentDate}</p>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {completedExercises.map((exercise, index) => (
          <Card key={index} className="bg-black border-2 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">{exercise.name}</CardTitle>
              {exercise.previousWeight && exercise.previousReps && (
                <p className="text-sm text-gray-400">
                  Last time: {exercise.previousWeight}kg × {exercise.previousReps} reps
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-gray-400 mb-4">
                Sets: {exercise.sets}
              </div>
              
              {/* Individual Sets */}
              <div className="space-y-3">
                {Array(exercise.sets).fill(0).map((_, setIndex) => (
                  <div key={setIndex} className="border border-gray-700 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Set {setIndex + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-400 text-xs">Weight (kg)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={exerciseSets[index]?.[setIndex]?.weight || ''}
                          onChange={(e) => updateExerciseSet(index, setIndex, 'weight', Number(e.target.value))}
                          className={`mt-1 ${getPerformanceColor(
                            exerciseSets[index]?.[setIndex]?.weight || 0, 
                            exercise.previousWeight, 
                            'weight'
                          )}`}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 text-xs">Reps</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={exerciseSets[index]?.[setIndex]?.reps || ''}
                          onChange={(e) => updateExerciseSet(index, setIndex, 'reps', Number(e.target.value))}
                          className={`mt-1 ${getPerformanceColor(
                            exerciseSets[index]?.[setIndex]?.reps || 0, 
                            exercise.previousReps, 
                            'reps'
                          )}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Progress indicators */}
              <div className="flex gap-2 text-xs">
                {exercise.weight > 0 && exercise.previousWeight && (
                  <span className={
                    exercise.weight > exercise.previousWeight ? 'text-green-400' :
                    exercise.weight < exercise.previousWeight ? 'text-red-400' :
                    'text-yellow-400'
                  }>
                    Weight: {exercise.weight > exercise.previousWeight ? '+' : ''}
                    {exercise.weight - exercise.previousWeight}kg
                  </span>
                )}
                {exercise.reps > 0 && exercise.previousReps && (
                  <span className={
                    exercise.reps > exercise.previousReps ? 'text-green-400' :
                    exercise.reps < exercise.previousReps ? 'text-red-400' :
                    'text-yellow-400'
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
          className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="w-5 h-5 mr-2" />
          Complete Workout
        </Button>
        
        <Button
          variant="outline"
          onClick={() => navigate(`/workout-plan/${plan.id}`)}
          className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}