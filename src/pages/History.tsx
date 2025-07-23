import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export default function History() {
  const { workoutSessions, workoutPlans } = useWorkoutStore();
  const { formatWeight, formatDate: formatAppDate, getText } = useSettings();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    const dayOfWeek = format(date, 'EEE'); // Mon, Tue, etc.
    const dayNumber = format(date, 'dd'); // 01, 02, etc.
    const month = format(date, 'MMMM').toUpperCase(); // JANUARY, FEBRUARY, etc.
    const year = format(date, 'yyyy'); // 2024, 2025, etc.
    
    return { dayOfWeek, dayNumber, month, year };
  };

  // Sort sessions by date (most recent first)
  const sortedSessions = [...workoutSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Workout History</h1>
        <p className="text-muted-foreground">
          View all your completed workouts
        </p>
      </div>

      {sortedSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No workouts completed yet
              </h3>
              <p className="text-muted-foreground">
                Complete your first workout to see it here!
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
                            <CardTitle className="text-xl">{planName}</CardTitle>
                            <p className="text-muted-foreground text-sm">
                              {session.exercises.length} exercises completed
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Click to view details
                            </p>
                          </div>
                        </div>
                        <Badge variant="default">Completed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid gap-3">
                        {session.exercises.slice(0, 2).map((exercise, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <h4 className="font-medium text-foreground">{exercise.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {exercise.sets} sets completed
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
                          <div className="text-center text-sm text-muted-foreground">
                            +{session.exercises.length - 2} more exercises...
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
                        <p className="text-muted-foreground text-sm font-normal">
                          {session.exercises.length} exercises completed
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
                             {Array.from({ length: exercise.sets }, (_, setIndex) => (
                               <div key={setIndex} className="grid grid-cols-3 gap-2 p-2 bg-muted rounded">
                                 <div className="font-medium">{setIndex + 1}</div>
                                 <div>{formatWeight(exercise.weight)}</div>
                                 <div>{exercise.reps}</div>
                               </div>
                             ))}
                             <div className="mt-2 pt-2 border-t border-border">
                               <div className="text-sm text-muted-foreground">
                                 <strong>Total Volume:</strong> {formatWeight(exercise.weight * exercise.reps * exercise.sets)}
                               </div>
                             </div>
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