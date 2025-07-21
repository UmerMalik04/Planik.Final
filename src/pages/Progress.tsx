import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";
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
  const { personalRecords, getExerciseHistory } = useWorkoutStore();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

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

      {/* Personal Records Grid */}
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