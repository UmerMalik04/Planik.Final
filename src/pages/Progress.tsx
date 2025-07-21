import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Progress() {
  const navigate = useNavigate();
  const { personalRecords, getExerciseHistory, workoutSessions } = useWorkoutStore();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // Get all unique exercises with their progress
  const getAllExercisesWithProgress = () => {
    const uniqueExercises = Array.from(new Set(
      workoutSessions.flatMap(session => 
        session.exercises.map(exercise => exercise.name)
      )
    ));

    return uniqueExercises.map(exerciseName => {
      const history = getExerciseHistory(exerciseName);
      const latest = history[0];
      const previous = history[1];
      
      let trend = 'none';
      let weightDiff = 0;
      
      if (latest && previous) {
        const latestTotal = latest.weight * latest.reps;
        const previousTotal = previous.weight * previous.reps;
        weightDiff = latestTotal - previousTotal;
        
        if (weightDiff > 0) trend = 'increase';
        else if (weightDiff < 0) trend = 'decrease';
        else trend = 'same';
      }

      return {
        name: exerciseName,
        latest,
        trend,
        weightDiff,
        history: history.length
      };
    }).filter(exercise => exercise.latest);
  };

  const exercisesProgress = getAllExercisesWithProgress();

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleRecordClick = (exerciseName: string) => {
    setSelectedExercise(exerciseName);
  };

  const getChartData = (exerciseName: string) => {
    const history = getExerciseHistory(exerciseName);
    return history
      .reverse()
      .map((exercise, index) => ({
        session: index + 1,
        weight: exercise.weight,
        reps: exercise.reps,
        total: exercise.weight * exercise.reps,
        date: new Date(exercise.date).toLocaleDateString()
      }));
  };

  return (
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
        <div>
          <h1 className="text-2xl font-bold">Personal Records</h1>
          <p className="text-muted-foreground">Your best performances</p>
        </div>
      </div>

      {/* Personal Records Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Personal Records</h2>
        {personalRecords.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No records yet</h3>
              <p className="text-muted-foreground mb-4">
                Start working out to see your personal records here!
              </p>
              <Button onClick={() => navigate("/")}>
                Start Your First Workout
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {personalRecords.map((record) => (
              <Card 
                key={record.exerciseName} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => handleRecordClick(record.exerciseName)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-center">
                    {record.exerciseName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {record.weight}kg
                    </div>
                    <div className="text-sm text-muted-foreground">
                      × {record.reps} reps
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-primary font-medium mt-1">
                      Total: {record.weight * record.reps}kg
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Progress Strips */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Exercise Progress</h2>
        {exercisesProgress.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No exercise data yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {exercisesProgress.map((exercise) => (
              <Card key={exercise.name} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-semibold">{exercise.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          Latest: {exercise.latest?.weight}kg × {exercise.latest?.reps} reps
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(exercise.latest?.date || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {exercise.trend !== 'none' && (
                        <>
                          {exercise.trend === 'increase' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : exercise.trend === 'decrease' ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-yellow-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            exercise.trend === 'increase' ? 'text-green-500' : 
                            exercise.trend === 'decrease' ? 'text-red-500' : 'text-yellow-500'
                          }`}>
                            {exercise.weightDiff > 0 ? '+' : ''}{exercise.weightDiff}kg
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Progress Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedExercise} Progress</DialogTitle>
          </DialogHeader>
          {selectedExercise && (
            <div className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData(selectedExercise)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="session" 
                      label={{ value: 'Session', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Total Weight (kg)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'total' ? `${value}kg` : value,
                        name === 'total' ? 'Total Weight' : name
                      ]}
                      labelFormatter={(label) => `Session ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Tap outside to close
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Button */}
      <div className="mt-8 pt-6 border-t border-border">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-destructive/10 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              Reset All Progress
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset All Progress</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all your workout data, plans, and progress. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground">
                Reset Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}