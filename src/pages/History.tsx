import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Search, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function History() {
  const { workoutSessions, workoutPlans, initializeUserData } = useWorkoutStore();
  const { formatWeight, formatDate: formatAppDate, getText } = useSettings();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

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
                        
                        <div className="space-y-4 mt-6">
                          {session.exercises.map((exercise, index) => (
                            <Card key={index} className="border">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg">{exercise.name}</CardTitle>
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
                          ))}
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