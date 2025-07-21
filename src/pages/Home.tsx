import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import mascotImage from "@/assets/mascot.jpg";

const workoutTypes = [
  { name: "Push Day", color: "bg-red-100 border-red-300 text-red-800" },
  { name: "Pull Day", color: "bg-blue-100 border-blue-300 text-blue-800" },
  { name: "Leg Day", color: "bg-green-100 border-green-300 text-green-800" },
  { name: "Arm Day", color: "bg-purple-100 border-purple-300 text-purple-800" }
];

export default function Home() {
  const navigate = useNavigate();
  const { workoutPlans, exercises, currentStreak } = useWorkoutStore();

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
              <div className="text-2xl font-bold text-primary">{currentStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
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

      {/* Mascot */}
      <div className="flex justify-center">
        <div className="relative">
          <img
            src={mascotImage}
            alt="Planik Mascot"
            className={`w-48 h-48 rounded-full border-4 border-primary object-cover ${
              currentStreak > 0 ? 'animate-flex-bounce' : ''
            }`}
          />
          {currentStreak > 0 && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
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
        <h2 className="text-xl font-semibold text-center">Choose Your Workout</h2>
        <div className="grid grid-cols-2 gap-4">
          {workoutTypes.map((workout) => {
            const hasExistingPlan = workoutPlans.some(plan => plan.type === workout.name);
            return (
              <Button
                key={workout.name}
                variant="outline"
                onClick={() => handleWorkoutTypeClick(workout.name)}
                className={`h-20 text-lg font-semibold border-2 transition-all duration-200 hover:scale-105 ${workout.color}`}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}