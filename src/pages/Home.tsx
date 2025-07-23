import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { Plus, Minus, TrendingUp, TrendingDown, Utensils } from "lucide-react";
import { useState, useEffect } from "react";
import muscularBodyDiagram from "@/assets/muscular-body-diagram.png";


export default function Home() {
  const navigate = useNavigate();
  const { 
    workoutPlans, 
    workoutSessions, 
    currentStreak, 
    workoutTypes, 
    progressKg,
    lastWeekProgress,
    addWorkoutType, 
    deleteWorkoutType, 
    getWorkoutFrequency,
    getWorkoutProgress,
    calculateProgress 
  } = useWorkoutStore();
  
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customWorkoutName, setCustomWorkoutName] = useState("");

  useEffect(() => {
    calculateProgress();
  }, [workoutSessions]);

  const getWorkoutSummary = () => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentSessions = workoutSessions.filter(
      session => new Date(session.date) >= threeMonthsAgo
    );

    const allRecentExercises = recentSessions.flatMap(session => session.exercises);

    return {
      totalWorkouts: recentSessions.length,
      uniqueExercises: new Set(allRecentExercises.map(e => e.name)).size,
      totalWeight: allRecentExercises.reduce((sum, e) => sum + (e.weight * e.reps * e.sets), 0)
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
        "bg-white border-orange-500 text-orange-600",
        "bg-white border-pink-500 text-pink-600", 
        "bg-white border-teal-500 text-teal-600",
        "bg-white border-purple-500 text-purple-600",
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
      <Card className="border-2 border-[hsl(var(--widget-border))]">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-2xl font-bold text-primary">
                  {progressKg !== 0 && lastWeekProgress > 0 
                    ? `${progressKg > 0 ? '+' : ''}${((progressKg / lastWeekProgress) * 100).toFixed(1)}%`
                    : progressKg > 0 ? '+∞%' : progressKg < 0 ? '-100%' : '0%'
                  }
                </div>
                {progressKg > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : progressKg < 0 ? (
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
          <Card className="border-2 border-[hsl(var(--widget-border))]">
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
            const frequency = getWorkoutFrequency(workout.name);
            const progress = getWorkoutProgress(workout.name);
            
            const getProgressMessage = () => {
              switch (progress) {
                case 'increase': return 'Seen an Increase';
                case 'decrease': return 'Seen a Decrease';
                case 'same': return 'Same as Last Week';
                default: return 'No Recent Activity';
              }
            };

            const getProgressColor = () => {
              switch (progress) {
                case 'increase': return 'text-green-400';
                case 'decrease': return 'text-red-400';
                case 'same': return 'text-yellow-400';
                default: return 'text-gray-400';
              }
            };

            return (
              <div key={workout.name} className="relative">
                <Card 
                  className={`bg-white border-2 transition-all duration-200 hover:scale-105 cursor-pointer ${workout.color}`}
                  onClick={() => handleWorkoutTypeClick(workout.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-2">
                      <h3 className="text-lg font-bold text-foreground">{workout.name}</h3>
                      <p className="text-sm text-muted-foreground">{frequency} Times past 3 months</p>
                      {progress !== 'none' && (
                        <div className={`text-xs px-2 py-1 rounded border ${getProgressColor()} border-current`}>
                          {getProgressMessage()}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {hasExistingPlan ? "Tap to continue" : "Create plan"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
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

      {/* Diet Tracker */}
      <Card 
        className="p-4 cursor-pointer hover:shadow-md transition-all border-2 border-orange-500 bg-background"
        onClick={() => navigate("/diet-tracker")}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Diet Tracker</h3>
            <p className="text-sm text-muted-foreground">Track nutrition & calories</p>
          </div>
        </div>
      </Card>
    </div>
  );
}