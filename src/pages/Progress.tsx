import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Edit3, Plus, Calendar, Trash2, MoreVertical } from "lucide-react";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Progress() {
  const navigate = useNavigate();
  const { personalRecords, getExerciseHistory, workoutSessions, updatePersonalRecord, workoutTypes, workoutPlans } = useWorkoutStore();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editForm, setEditForm] = useState({ weight: "", reps: "", date: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({ exerciseName: "", weight: "", date: new Date() });
  const [recordToDelete, setRecordToDelete] = useState<any>(null);

  const defaultExercises = ["Bench press", "Deadlift", "Squat"];

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

  // Get workout type progress with weekly averages
  const getWorkoutTypeProgress = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    return workoutTypes.map(workoutType => {
      // Get sessions from current week and previous week
      const currentWeekSessions = workoutSessions.filter(session => {
        const plan = workoutPlans.find(plan => plan.id === session.planId);
        return plan?.type === workoutType.name && new Date(session.date) >= oneWeekAgo;
      });
      
      const previousWeekSessions = workoutSessions.filter(session => {
        const plan = workoutPlans.find(plan => plan.id === session.planId);
        return plan?.type === workoutType.name && 
               new Date(session.date) >= twoWeeksAgo && 
               new Date(session.date) < oneWeekAgo;
      });

      // Calculate average weights
      const getCurrentWeekAverage = () => {
        if (currentWeekSessions.length === 0) return 0;
        const totalWeight = currentWeekSessions.reduce((sum, session) => 
          sum + session.exercises.reduce((exerciseSum, exercise) => 
            exerciseSum + exercise.weight, 0), 0);
        const totalExercises = currentWeekSessions.reduce((sum, session) => 
          sum + session.exercises.length, 0);
        return totalExercises > 0 ? totalWeight / totalExercises : 0;
      };

      const getPreviousWeekAverage = () => {
        if (previousWeekSessions.length === 0) return 0;
        const totalWeight = previousWeekSessions.reduce((sum, session) => 
          sum + session.exercises.reduce((exerciseSum, exercise) => 
            exerciseSum + exercise.weight, 0), 0);
        const totalExercises = previousWeekSessions.reduce((sum, session) => 
          sum + session.exercises.length, 0);
        return totalExercises > 0 ? totalWeight / totalExercises : 0;
      };

      const currentAvg = getCurrentWeekAverage();
      const previousAvg = getPreviousWeekAverage();
      const difference = currentAvg - previousAvg;
      
      let trend = 'none';
      if (currentAvg > 0 && previousAvg > 0) {
        if (difference > 0.5) trend = 'increase';
        else if (difference < -0.5) trend = 'decrease';
        else trend = 'same';
      }

      return {
        name: workoutType.name,
        currentWeekAverage: currentAvg,
        previousWeekAverage: previousAvg,
        difference,
        trend,
        hasData: currentWeekSessions.length > 0 || previousWeekSessions.length > 0
      };
    }).filter(workoutType => workoutType.hasData);
  };

  const workoutTypeProgress = getWorkoutTypeProgress();

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleRecordClick = (exerciseName: string) => {
    setSelectedExercise(exerciseName);
  };

  const handleEditRecord = (record: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRecord(record);
    setEditForm({
      weight: record.weight.toString(),
      reps: record.reps.toString(),
      date: new Date(record.date).toISOString().split('T')[0]
    });
  };

  const handleSaveEdit = () => {
    if (editingRecord && editForm.weight && editForm.reps) {
      updatePersonalRecord(
        editingRecord.exerciseName,
        Number(editForm.weight),
        Number(editForm.reps)
      );
      setEditingRecord(null);
      setEditForm({ weight: "", reps: "", date: "" });
    }
  };

  const handleAddRecord = () => {
    if (newRecord.exerciseName && newRecord.weight) {
      updatePersonalRecord(
        newRecord.exerciseName,
        Number(newRecord.weight),
        1
      );
      setNewRecord({ exerciseName: "", weight: "", date: new Date() });
      setShowAddForm(false);
    }
  };

  const handleDeleteRecord = () => {
    if (recordToDelete) {
      // Remove record from store - we'll need to add this method to the store
      const updatedRecords = personalRecords.filter(
        record => !(record.exerciseName === recordToDelete.exerciseName && record.reps === recordToDelete.reps)
      );
      // For now, we'll use localStorage directly since the store doesn't have a delete method
      localStorage.setItem('workout-storage', JSON.stringify({
        ...JSON.parse(localStorage.getItem('workout-storage') || '{}'),
        state: {
          ...JSON.parse(localStorage.getItem('workout-storage') || '{}').state,
          personalRecords: updatedRecords
        }
      }));
      window.location.reload(); // Refresh to see changes
    }
    setRecordToDelete(null);
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Personal Records (1 Rep Max)</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Exercise
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {defaultExercises.map((exerciseName) => {
            const record = personalRecords.find(r => r.exerciseName === exerciseName && r.reps === 1);
            return (
              <Card 
                key={exerciseName} 
                className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 relative group ${
                  !record ? 'border-dashed border-2 border-muted-foreground/20' : ''
                }`}
                onClick={() => record ? handleRecordClick(record.exerciseName) : (setNewRecord(prev => ({ ...prev, exerciseName })), setShowAddForm(true))}
              >
                {record && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-6 w-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRecord(record, e);
                        }}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecordToDelete(record);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-center">
                    {exerciseName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-center">
                    {record ? (
                      <>
                        <div className="text-2xl font-bold text-primary">
                          {record.weight}kg
                        </div>
                        <div className="text-sm text-muted-foreground">
                          × {record.reps} reps
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                      </>
                    ) : (
                      <div className="py-4">
                        <Plus className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Add record</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Show additional user-added exercises */}
          {personalRecords
            .filter(record => record.reps === 1 && !defaultExercises.includes(record.exerciseName))
            .map((record) => (
              <Card 
                key={record.exerciseName} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 relative group"
                onClick={() => handleRecordClick(record.exerciseName)}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-6 w-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRecord(record, e);
                      }}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecordToDelete(record);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                    <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
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
              <Card 
                key={exercise.name} 
                className="border-l-4 border-l-primary cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => handleRecordClick(exercise.name)}
              >
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

      {/* Custom Exercise Progress Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Custom Exercise Progress</h2>
        {workoutTypeProgress.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No workout type data yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {workoutTypeProgress.map((workoutType) => (
              <Card key={workoutType.name} className="border-l-4 border-l-secondary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-semibold">{workoutType.name}</h3>
                       <div className="flex items-center gap-4 mt-1">
                         <span className="text-sm text-muted-foreground">
                           Average: {workoutType.previousWeekAverage > 0 
                             ? `${((workoutType.currentWeekAverage / workoutType.previousWeekAverage - 1) * 100).toFixed(1)}%`
                             : workoutType.currentWeekAverage > 0 ? '+100%' : '0%'
                           }
                         </span>
                         <span className="text-xs text-muted-foreground">
                           Previous: {workoutType.previousWeekAverage.toFixed(1)}kg
                         </span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {workoutType.trend !== 'none' && (
                        <>
                          {workoutType.trend === 'increase' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : workoutType.trend === 'decrease' ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-yellow-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            workoutType.trend === 'increase' ? 'text-green-500' : 
                            workoutType.trend === 'decrease' ? 'text-red-500' : 'text-yellow-500'
                          }`}>
                            {workoutType.difference > 0 ? '+' : ''}{workoutType.difference.toFixed(1)}kg
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
                      dataKey="date" 
                      label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'weight' ? `${value}kg` : value,
                        name === 'weight' ? 'Weight' : name
                      ]}
                      labelFormatter={(label) => label}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
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

      {/* Edit Record Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Personal Record</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-weight">Weight (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  value={editForm.weight}
                  onChange={(e) => setEditForm(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="Weight"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <Label htmlFor="edit-reps">Reps</Label>
                <Input
                  id="edit-reps"
                  type="number"
                  value={editForm.reps}
                  onChange={(e) => setEditForm(prev => ({ ...prev, reps: e.target.value }))}
                  placeholder="Reps"
                  min="1"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveEdit}
                  disabled={!editForm.weight || !editForm.reps}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingRecord(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add 1 Rep Max Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exercise-name">Exercise Name</Label>
              <Input
                id="exercise-name"
                value={newRecord.exerciseName}
                onChange={(e) => setNewRecord(prev => ({ ...prev, exerciseName: e.target.value }))}
                placeholder="Enter exercise name"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={newRecord.weight}
                onChange={(e) => setNewRecord(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="Weight"
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newRecord.date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {newRecord.date ? format(newRecord.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newRecord.date}
                    onSelect={(date) => date && setNewRecord(prev => ({ ...prev, date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAddRecord}
                disabled={!newRecord.exerciseName || !newRecord.weight}
                className="flex-1"
              >
                Add Record
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!recordToDelete} onOpenChange={() => setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Personal Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your {recordToDelete?.exerciseName} personal record of {recordToDelete?.weight}kg? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRecord}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            Reset All Data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your workout data, progress, and records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}