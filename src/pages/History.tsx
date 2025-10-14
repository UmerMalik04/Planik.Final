import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export default function History() {
  const { workoutSessions, workoutPlans, initializeUserData } = useWorkoutStore();
  const { formatWeight, formatDate: formatAppDate, getText } = useSettings();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Refresh data when page loads
  useEffect(() => {
    console.log('History page loading...');
    initializeUserData().then(() => {
      console.log('Workout sessions loaded:', workoutSessions);
    });
  }, []);

  const formatDate = (date: Date) => {
    const dayOfWeek = format(date, 'EEE'); // Mon, Tue, etc.
    const dayNumber = format(date, 'dd'); // 01, 02, etc.
    const month = format(date, 'MMMM').toUpperCase(); // JANUARY, FEBRUARY, etc.
    const year = format(date, 'yyyy'); // 2024, 2025, etc.
    
    return { dayOfWeek, dayNumber, month, year };
  };

  // Sort sessions by date (most recent first) and filter completed sessions
  const sortedSessions = [...workoutSessions]
    .filter(session => session.exercises && session.exercises.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  console.log('Filtered sessions with exercises:', sortedSessions);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{getText('workout_history')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {getText('view_completed_workouts')}
        </p>
      </div>

      {sortedSessions.length === 0 ? (
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
        <div className="space-y-4">
          {sortedSessions.map((session) => {
            const date = new Date(session.date);
            const { dayOfWeek, dayNumber, month, year } = formatDate(date);
            const plan = workoutPlans.find(p => p.id === session.planId);
            const planName = plan?.name || "Unknown Plan";
            
            return (
              <Dialog key={session.id}>
                <DialogTrigger asChild>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-center min-w-[120px]">
                            <div className="text-sm font-medium">{dayOfWeek}</div>
                            <div className="text-xl font-bold">{dayNumber}</div>
                            <div className="text-xs">{month}</div>
                            <div className="text-xs opacity-90">{year}</div>
                          </div>
                          <div>
                            <CardTitle className="text-lg sm:text-xl">{planName}</CardTitle>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                              {session.exercises.length} {getText('exercises_completed')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getText('click_view_details')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default">{getText('completed')}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid gap-3">
                        {session.exercises.slice(0, 2).map((exercise, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <h4 className="font-medium text-foreground">{exercise.name}</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {exercise.sets} {getText('sets_completed')}
                              </p>
                            </div>
                             <div className="text-right">
                               <div className="text-sm font-medium text-muted-foreground">
                                 {exercise.reps} reps × {formatWeight(exercise.weight)}
                               </div>
                             </div>
                          </div>
                        ))}
                        {session.exercises.length > 2 && (
                          <div className="text-center text-xs sm:text-sm text-muted-foreground">
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
                        <div className="text-sm font-medium">{dayOfWeek}</div>
                        <div className="text-xl font-bold">{dayNumber}</div>
                        <div className="text-xs">{month} {year}</div>
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
  );
}