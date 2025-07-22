import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { Plus, Minus, TrendingUp, TrendingDown, Utensils } from "lucide-react";
import { useState, useEffect } from "react";
import mascotImage from "@/assets/mascot-3d.png";


export default function Home() {
  const navigate = useNavigate();
  const { 
    workoutPlans, 
    workoutSessions, 
    currentStreak, 
    workoutTypes, 
    progressKg,
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
        "bg-black border-orange-500 text-white",
        "bg-black border-pink-500 text-white",
        "bg-black border-teal-500 text-white",
        "bg-black border-purple-500 text-white",
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
                <div className="text-2xl font-bold text-primary">{progressKg > 0 ? '+' : ''}{progressKg}kg</div>
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

      {/* 3D Mascot with Muscle Highlights */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-48 h-48 rounded-full border-4 border-primary overflow-hidden shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="relative w-full h-full">
              <img
                src={mascotImage}
                alt="Planik 3D Mascot"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0, 123, 255, 0.3))'
                }}
              />
              {/* Muscle Highlights */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Arms - Green for good progress */}
                <div className="absolute top-[30%] left-[15%] w-8 h-12 bg-green-400/30 rounded-full animate-pulse" />
                <div className="absolute top-[30%] right-[15%] w-8 h-12 bg-green-400/30 rounded-full animate-pulse" />
                
                {/* Chest - Yellow for moderate progress */}
                <div className="absolute top-[35%] left-[35%] w-12 h-8 bg-yellow-400/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                
                {/* Legs - Red for needs work */}
                <div className="absolute bottom-[20%] left-[25%] w-10 h-16 bg-red-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-[20%] right-[25%] w-10 h-16 bg-red-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
            </div>
          </div>
          {currentStreak > 0 && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold animate-bounce">
              🔥
            </div>
          )}
          {/* Muscle Legend */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1 text-xs">
            <div className="flex items-center gap-1 bg-green-400/20 px-2 py-1 rounded">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Good</span>
            </div>
            <div className="flex items-center gap-1 bg-yellow-400/20 px-2 py-1 rounded">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span>OK</span>
            </div>
            <div className="flex items-center gap-1 bg-red-400/20 px-2 py-1 rounded">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span>Needs Work</span>
            </div>
          </div>
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
                  className={`border-2 border-[hsl(var(--widget-border))] transition-all duration-200 hover:scale-105 cursor-pointer ${workout.color}`}
                  onClick={() => handleWorkoutTypeClick(workout.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-2">
                      <h3 className="text-lg font-bold">{workout.name}</h3>
                      <p className="text-sm opacity-80">{frequency} Times past 3 months</p>
                      {progress !== 'none' && (
                        <div className={`text-xs px-2 py-1 rounded border ${getProgressColor()} border-current`}>
                          {getProgressMessage()}
                        </div>
                      )}
                      <p className="text-xs opacity-60">
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
        className="p-4 cursor-pointer hover:shadow-md transition-all border-2 border-[hsl(var(--widget-border))] bg-black" 
        onClick={() => navigate("/diet-tracker")}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Diet Tracker</h3>
            <p className="text-sm text-gray-400">Track nutrition & calories</p>
          </div>
        </div>
      </Card>
    </div>
  );
}