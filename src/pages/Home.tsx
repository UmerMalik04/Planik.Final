import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { Plus, Minus, TrendingUp, TrendingDown, Utensils, Activity } from "lucide-react";
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
  const [steps, setSteps] = useState(0);
  const [stepGoal] = useState(10000);

  useEffect(() => {
    calculateProgress();
    
    // Load steps from localStorage
    const savedSteps = localStorage.getItem('daily-steps');
    const today = new Date().toDateString();
    const savedStepsData = savedSteps ? JSON.parse(savedSteps) : {};
    
    if (savedStepsData.date === today) {
      setSteps(savedStepsData.steps || 0);
    } else {
      // New day, reset steps
      setSteps(0);
      localStorage.setItem('daily-steps', JSON.stringify({
        date: today,
        steps: 0
      }));
    }
    
    // Simulate step counting (in a real app, this would come from device sensors)
    const stepInterval = setInterval(() => {
      setSteps(prev => {
        const newSteps = prev + Math.floor(Math.random() * 3); // Random steps simulation
        const today = new Date().toDateString();
        localStorage.setItem('daily-steps', JSON.stringify({
          date: today,
          steps: newSteps
        }));
        return newSteps;
      });
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(stepInterval);
  }, [workoutSessions]);

  const getWorkoutSummary = () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const recentSessions = workoutSessions.filter(
      session => new Date(session.date) >= oneMonthAgo
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
                {(() => {
                  const getProgressDisplay = () => {
                    if (progressKg === 0) return { text: '0%', color: 'text-muted-foreground', arrow: null };
                    
                    if (lastWeekProgress > 0) {
                      const percentChange = ((progressKg / lastWeekProgress) * 100);
                      const isImproving = progressKg > 0;
                      return {
                        text: `${isImproving ? '+' : ''}${percentChange.toFixed(1)}%`,
                        color: isImproving ? 'text-green-600' : 'text-red-600',
                        arrow: isImproving ? 'up' : 'down'
                      };
                    } else {
                      // First week or no previous data
                      const isImproving = progressKg > 0;
                      return {
                        text: isImproving ? '+100%' : '0%',
                        color: isImproving ? 'text-green-600' : 'text-muted-foreground',
                        arrow: isImproving ? 'up' : null
                      };
                    }
                  };
                  
                  const progress = getProgressDisplay();
                  
                  return (
                    <>
                      <div className={`text-2xl font-bold ${progress.color}`}>
                        {progress.text}
                      </div>
                      {progress.arrow === 'up' && (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      )}
                      {progress.arrow === 'down' && (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{summary.totalWorkouts}</div>
              <div className="text-sm text-muted-foreground">Workouts (1mo)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{summary.uniqueExercises}</div>
              <div className="text-sm text-muted-foreground">Exercises</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Counter */}
      <Card className="border-2 border-[hsl(var(--widget-border))]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Daily Steps</h3>
                <p className="text-sm text-muted-foreground">{steps.toLocaleString()} / {stepGoal.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{Math.round((steps / stepGoal) * 100)}%</div>
              <div className="text-sm text-muted-foreground">Goal Progress</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((steps / stepGoal) * 100, 100)}%` }}
              ></div>
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
                      <p className="text-sm text-muted-foreground">{frequency} Times past 1 month</p>
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