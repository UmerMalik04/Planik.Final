import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { Plus, Minus, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import mascotImage from "@/assets/mascot-3d.png";


export default function Home() {
  const navigate = useNavigate();
  const { 
    workoutPlans, 
    exercises, 
    currentStreak, 
    workoutTypes, 
    progressPercentage,
    addWorkoutType, 
    deleteWorkoutType, 
    calculateProgress 
  } = useWorkoutStore();
  
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customWorkoutName, setCustomWorkoutName] = useState("");

  useEffect(() => {
    calculateProgress();
  }, [exercises]);

  const getWorkoutSummary = () => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentExercises = exercises.filter(
      exercise => new Date(exercise.date) >= threeMonthsAgo
    );

    return {
      totalWorkouts: recentExercises.length,
      uniqueExercises: new Set(recentExercises.map(e => e.name)).size,
      totalWeight: recentExercises.reduce((sum, e) => sum + (e.weight * e.reps), 0)
    };
  };

  const summary = getWorkoutSummary();

  const handleWorkoutTypeClick = (workoutType: string) => {
    const existingPlan = workoutPlans.find(plan => plan.type === workoutType);
    if (existingPlan) {
      navigate(`/workout-plan/${existingPlan.id}`);
    } else {
      navigate(`/create-plan?type=${workoutType}`);
    }
  };

  const handleAddCustomWorkout = () => {
    if (customWorkoutName.trim()) {
      const colors = [
        "bg-orange-100 border-orange-300 text-orange-800",
        "bg-pink-100 border-pink-300 text-pink-800",
        "bg-teal-100 border-teal-300 text-teal-800",
        "bg-yellow-100 border-yellow-300 text-yellow-800",
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      addWorkoutType({
        name: customWorkoutName,
        color: randomColor
      });
      setCustomWorkoutName("");
      setShowCustomInput(false);
    }
  };

  const handleDeleteWorkout = (workoutName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteWorkoutType(workoutName);
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Welcome to Planik!</h1>
        <p className="text-muted-foreground mt-1">Your gym companion</p>
      </div>

      {/* User Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-2xl font-bold text-primary">{progressPercentage}%</div>
                {progressPercentage > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : progressPercentage < 0 ? (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                ) : null}
              </div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{summary.totalWorkouts}</div>
              <div className="text-sm text-muted-foreground">Workouts (3mo)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{summary.uniqueExercises}</div>
              <div className="text-sm text-muted-foreground">Exercises</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3D Mascot */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-48 h-48 rounded-full border-4 border-primary overflow-hidden shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <img
              src={mascotImage}
              alt="Planik 3D Mascot"
              className={`w-full h-full object-cover transition-transform duration-300 ${
                currentStreak > 0 ? 'animate-pulse hover:scale-110' : 'hover:scale-105'
              }`}
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(0, 123, 255, 0.3))'
              }}
            />
          </div>
          {currentStreak > 0 && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold animate-bounce">
              🔥
            </div>
          )}
        </div>
      </div>

      {/* Motivational Message */}
      <div className="text-center">
        <p className="text-lg font-medium text-foreground">
          {currentStreak === 0 
            ? "Ready to start your fitness journey?" 
            : currentStreak < 7 
            ? `Great start! ${currentStreak} day${currentStreak !== 1 ? 's' : ''} strong!` 
            : `Amazing! ${currentStreak} day streak! You're on fire! 🔥`
          }
        </p>
      </div>

      {/* Workout Type Buttons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Choose Your Workout</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Custom
          </Button>
        </div>
        
        {showCustomInput && (
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter workout name..."
                  value={customWorkoutName}
                  onChange={(e) => setCustomWorkoutName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomWorkout()}
                />
                <Button onClick={handleAddCustomWorkout} size="sm">
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          {workoutTypes.map((workout) => {
            const hasExistingPlan = workoutPlans.some(plan => plan.type === workout.name);
            return (
              <div key={workout.name} className="relative">
                <Button
                  variant="outline"
                  onClick={() => handleWorkoutTypeClick(workout.name)}
                  className={`w-full h-20 text-lg font-semibold border-2 transition-all duration-200 hover:scale-105 ${workout.color}`}
                >
                  <div className="flex flex-col items-center">
                    <span>{workout.name}</span>
                    {hasExistingPlan && (
                      <span className="text-xs opacity-75">Tap to continue</span>
                    )}
                    {!hasExistingPlan && (
                      <span className="text-xs opacity-75">Create plan</span>
                    )}
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                  onClick={(e) => handleDeleteWorkout(workout.name, e)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}