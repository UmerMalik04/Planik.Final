import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Search, Dumbbell, TrendingUp, TrendingDown, Minus, Weight, Hash, Clock, Edit3, Save, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function History() {
  const { workoutSessions, workoutPlans, initializeUserData, getExerciseHistory } = useWorkoutStore();
  const { formatWeight, formatDate: formatAppDate, getText } = useSettings();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Refresh data when page loads
  useEffect(() => {
    initializeUserData();
  }, []);

  const formatDate = (date: Date) => {
    const dayOfWeek = format(date, 'EEE');
    const dayNumber = format(date, 'dd');
    const month = format(date, 'MMMM').toUpperCase();
    const year = format(date, 'yyyy');
    
    return { dayOfWeek, dayNumber, month, year };
  };

  // Get improvement status for an exercise compared to previous session
  const getExerciseImprovement = (exerciseName: string, currentSession: any, exercise: any) => {
    const history = getExerciseHistory(exerciseName);
    
    // Find current session in history
    const currentSessionIndex = history.findIndex(h => 
      new Date(h.date).getTime() === new Date(currentSession.date).getTime()
    );
    
    if (currentSessionIndex === -1 || currentSessionIndex === history.length - 1) {
      return { status: 'new', color: 'text-muted-foreground', icon: null, volumeDiff: 0 };
    }

    const previousExercise = history[currentSessionIndex + 1];
    
    if (!previousExercise) {
      return { status: 'new', color: 'text-muted-foreground', icon: null, volumeDiff: 0 };
    }

    // Calculate total volume (weight × reps × sets)
    const calculateVolume = (ex: any) => {
      if (ex.setData && ex.setData.length > 0) {
        return ex.setData.reduce((total: number, set: any) => 
          total + (set.weight * set.reps), 0
        );
      }
      return ex.weight * ex.reps * ex.sets;
    };

    const currentVolume = calculateVolume(exercise);
    const previousVolume = calculateVolume(previousExercise);
    const volumeDiff = currentVolume - previousVolume;

    if (volumeDiff > 0) {
      return { status: 'improved', color: 'text-green-500', icon: TrendingUp, volumeDiff };
    } else if (volumeDiff < 0) {
      return { status: 'decreased', color: 'text-red-500', icon: TrendingDown, volumeDiff };
    } else {
      return { status: 'same', color: 'text-muted-foreground', icon: Minus, volumeDiff: 0 };
    }
  };

  // Calculate workout statistics
  const calculateWorkoutStats = (session: any) => {
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let improved = 0;
    let decreased = 0;
    let same = 0;

    session.exercises.forEach((exercise: any) => {
      const improvement = getExerciseImprovement(exercise.name, session, exercise);
      
      if (improvement.status === 'improved') improved++;
      else if (improvement.status === 'decreased') decreased++;
      else if (improvement.status === 'same') same++;

      if (exercise.setData && exercise.setData.length > 0) {
        exercise.setData.forEach((set: any) => {
          totalVolume += set.weight * set.reps;
          totalSets += 1;
          totalReps += set.reps;
        });
      } else {
        totalVolume += exercise.weight * exercise.reps * exercise.sets;
        totalSets += exercise.sets;
        totalReps += exercise.reps * exercise.sets;
      }
    });

    return {
      totalVolume,
      totalSets,
      totalReps,
      improved,
      decreased,
      same,
      duration: session.duration || 0
    };
  };

  // Handle notes editing
  const handleEditNotes = (session: any) => {
    setCurrentSessionId(session.id);
    setNotesText(session.notes || "");
    setEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    if (!currentSessionId) return;

    // Validate notes length
    if (notesText.trim().length > 1000) {
      toast.error("Notes must be less than 1000 characters");
      return;
    }

    try {
      const { error } = await supabase
        .from('workout_sessions')
        .update({ notes: notesText.trim() || null })
        .eq('id', currentSessionId);

      if (error) throw error;

      // Update local state
      await initializeUserData();
      
      toast.success("Notes saved successfully");
      setEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error("Failed to save notes");
    }
  };

  const handleCancelNotes = () => {
    setEditingNotes(false);
    setNotesText("");
    setCurrentSessionId(null);
  };

  // Get workouts for a specific day
  const getWorkoutsForDay = (date: Date) => {
    return workoutSessions.filter(session => 
      isSameDay(new Date(session.date), date)
    );
  };

  // Filter sessions based on search query
  const filteredSessions = workoutSessions.filter(session => {
    if (!searchQuery) return true;
    
    const plan = workoutPlans.find(p => p.id === session.planId);
    const planName = plan?.name?.toLowerCase() || '';
    const exerciseNames = session.exercises.map(e => e.name.toLowerCase()).join(' ');
    const query = searchQuery.toLowerCase();
    
    return planName.includes(query) || exerciseNames.includes(query);
  });

  // Get days with workouts for calendar styling
  const daysWithWorkouts = workoutSessions.map(session => new Date(session.date));

  // Get workouts for selected date
  const selectedDateWorkouts = getWorkoutsForDay(selectedDate).filter(session => {
    if (!searchQuery) return true;
    
    const plan = workoutPlans.find(p => p.id === session.planId);
    const planName = plan?.name?.toLowerCase() || '';
    const exerciseNames = session.exercises.map(e => e.name.toLowerCase()).join(' ');
    const query = searchQuery.toLowerCase();
    
    return planName.includes(query) || exerciseNames.includes(query);
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{getText('workout_history')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {getText('view_completed_workouts')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workouts or exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {workoutSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                {getText('no_workouts_completed')}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {getText('complete_first_workout')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Calendar */}
          <Card className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className={cn("mx-auto pointer-events-auto")}
              modifiers={{
                hasWorkout: daysWithWorkouts
              }}
              modifiersStyles={{
                hasWorkout: {
                  fontWeight: 'bold',
                  position: 'relative'
                }
              }}
              modifiersClassNames={{
                hasWorkout: 'bg-primary/10 text-primary font-bold relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full'
              }}
            />
          </Card>

          {/* Workouts for Selected Date */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
            </div>

            {selectedDateWorkouts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 px-4">
                  <Dumbbell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-center text-muted-foreground font-medium mb-2">
                    {searchQuery ? "No workouts match your search" : "No workouts on this day"}
                  </p>
                  {!searchQuery && (
                    <p className="text-xs text-center text-muted-foreground">
                      Complete a workout to see it here
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {selectedDateWorkouts.map((session) => {
                  const plan = workoutPlans.find(p => p.id === session.planId);
                  const planName = plan?.name || "Unknown Plan";
                  
                  return (
                    <Dialog key={session.id}>
                      <DialogTrigger asChild>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{planName}</CardTitle>
                                <p className="text-muted-foreground text-xs sm:text-sm">
                                  {session.exercises.length} {getText('exercises_completed')}
                                </p>
                              </div>
                              <Badge variant="default">{getText('completed')}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid gap-2">
                              {session.exercises.slice(0, 2).map((exercise, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                                  <div>
                                    <h4 className="font-medium text-sm text-foreground">{exercise.name}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {exercise.sets} {getText('sets_completed')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-medium text-muted-foreground">
                                      {exercise.reps} reps × {formatWeight(exercise.weight)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {session.exercises.length > 2 && (
                                <div className="text-center text-xs text-muted-foreground">
                                  +{session.exercises.length - 2} {getText('more_exercises')}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-4">
                            <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-center min-w-[100px]">
                              <div className="text-sm font-medium">{format(selectedDate, 'EEE')}</div>
                              <div className="text-xl font-bold">{format(selectedDate, 'dd')}</div>
                              <div className="text-xs">{format(selectedDate, 'MMMM yyyy')}</div>
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">{planName}</h2>
                              <p className="text-muted-foreground text-xs sm:text-sm font-normal">
                                {session.exercises.length} {getText('exercises_completed')}
                              </p>
                            </div>
                          </DialogTitle>
                        </DialogHeader>

                        {/* Workout Statistics */}
                        {(() => {
                          const stats = calculateWorkoutStats(session);
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                              <Card className="bg-muted/50">
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Weight className="w-4 h-4 text-primary" />
                                    <span className="text-xs text-muted-foreground">Total Volume</span>
                                  </div>
                                  <p className="text-lg font-bold">{formatWeight(stats.totalVolume)}</p>
                                </CardContent>
                              </Card>
                              
                              <Card className="bg-muted/50">
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Hash className="w-4 h-4 text-primary" />
                                    <span className="text-xs text-muted-foreground">Total Sets</span>
                                  </div>
                                  <p className="text-lg font-bold">{stats.totalSets}</p>
                                </CardContent>
                              </Card>

                              <Card className="bg-muted/50">
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Hash className="w-4 h-4 text-primary" />
                                    <span className="text-xs text-muted-foreground">Total Reps</span>
                                  </div>
                                  <p className="text-lg font-bold">{stats.totalReps}</p>
                                </CardContent>
                              </Card>

                              {stats.duration > 0 && (
                                <Card className="bg-muted/50">
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Clock className="w-4 h-4 text-primary" />
                                      <span className="text-xs text-muted-foreground">Duration</span>
                                    </div>
                                    <p className="text-lg font-bold">{Math.floor(stats.duration / 60)}m</p>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Improvement Summary */}
                              {(stats.improved > 0 || stats.decreased > 0 || stats.same > 0) && (
                                <Card className="bg-muted/50 col-span-2 sm:col-span-4">
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <TrendingUp className="w-4 h-4 text-primary" />
                                      <span className="text-xs text-muted-foreground">Performance vs Previous</span>
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                      {stats.improved > 0 && (
                                        <div className="flex items-center gap-1 text-green-500">
                                          <TrendingUp className="w-3 h-3" />
                                          <span className="font-medium">{stats.improved} Better</span>
                                        </div>
                                      )}
                                      {stats.same > 0 && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <Minus className="w-3 h-3" />
                                          <span className="font-medium">{stats.same} Same</span>
                                        </div>
                                      )}
                                      {stats.decreased > 0 && (
                                        <div className="flex items-center gap-1 text-red-500">
                                          <TrendingDown className="w-3 h-3" />
                                          <span className="font-medium">{stats.decreased} Lower</span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          );
                        })()}

                        {/* Workout Notes Section */}
                        <Card className="mt-4">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-semibold">Workout Notes</h3>
                              </div>
                              {!editingNotes && currentSessionId !== session.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditNotes(session)}
                                  className="h-8"
                                >
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  {session.notes ? 'Edit' : 'Add'}
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            {editingNotes && currentSessionId === session.id ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={notesText}
                                  onChange={(e) => setNotesText(e.target.value)}
                                  placeholder="How did you feel during this workout? Any observations?"
                                  className="min-h-[100px] resize-none"
                                  maxLength={1000}
                                />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {notesText.length}/1000 characters
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleCancelNotes}
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={handleSaveNotes}
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {session.notes ? (
                                  <p className="text-sm text-foreground whitespace-pre-wrap">{session.notes}</p>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">
                                    No notes added yet. Click &quot;Add&quot; to record your thoughts about this workout.
                                  </p>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        <div className="space-y-4 mt-6">
                          {session.exercises.map((exercise, index) => {
                            const improvement = getExerciseImprovement(exercise.name, session, exercise);
                            const ImprovementIcon = improvement.icon;
                            
                            return (
                            <Card key={index} className="border">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                                  {ImprovementIcon && (
                                    <div className={cn("flex items-center gap-1.5", improvement.color)}>
                                      <ImprovementIcon className="w-4 h-4" />
                                      <div className="flex flex-col items-end">
                                        <span className="text-xs font-medium">
                                          {improvement.status === 'improved' && 'Better'}
                                          {improvement.status === 'decreased' && 'Lower'}
                                          {improvement.status === 'same' && 'Same'}
                                        </span>
                                        {improvement.volumeDiff !== 0 && (
                                          <span className="text-[10px] font-normal">
                                            {improvement.volumeDiff > 0 ? '+' : ''}{formatWeight(Math.abs(improvement.volumeDiff))} vol
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="grid gap-3">
                                  <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground">
                                    <div>Set</div>
                                    <div>Weight</div>
                                    <div>Reps</div>
                                  </div>
                                  {exercise.setData && exercise.setData.length > 0 ? (
                                    exercise.setData.map((setData, setIndex) => (
                                      <div key={`${exercise.id}-set-${setIndex}`} className="grid grid-cols-3 gap-2 p-2 bg-muted rounded">
                                        <div className="font-medium">{setIndex + 1}</div>
                                        <div>{formatWeight(setData.weight)}</div>
                                        <div>{setData.reps}</div>
                                      </div>
                                    ))
                                  ) : (
                                    Array.from({ length: exercise.sets }, (_, setIndex) => (
                                      <div key={`${exercise.id}-fallback-${setIndex}`} className="grid grid-cols-3 gap-2 p-2 bg-muted rounded">
                                        <div className="font-medium">{setIndex + 1}</div>
                                        <div>{formatWeight(exercise.weight)}</div>
                                        <div>{exercise.reps}</div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                            );
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}