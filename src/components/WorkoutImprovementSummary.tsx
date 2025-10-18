import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Trophy, Target } from "lucide-react";
import { CompletedExercise } from "@/stores/useWorkoutStore";

interface WorkoutImprovementSummaryProps {
  exercises: CompletedExercise[];
}

export const WorkoutImprovementSummary = ({ exercises }: WorkoutImprovementSummaryProps) => {
  const getExerciseImprovement = (exercise: CompletedExercise) => {
    if (!exercise.previousWeight && !exercise.previousReps) {
      return { type: 'new', message: 'First time!', color: 'bg-blue-500' };
    }

    // Calculate total volume using all sets if available
    let currentVolume = 0;
    let previousVolume = 0;
    
    if (exercise.setData && exercise.setData.length > 0) {
      currentVolume = exercise.setData.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    } else {
      currentVolume = exercise.weight * exercise.reps * (exercise.sets || 1);
    }
    
    if (exercise.previousSetData && exercise.previousSetData.length > 0) {
      previousVolume = exercise.previousSetData.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    } else {
      previousVolume = (exercise.previousWeight || 0) * (exercise.previousReps || 0) * (exercise.sets || 1);
    }

    const volumeDiff = currentVolume - previousVolume;
    const volumePercent = previousVolume > 0 ? ((volumeDiff / previousVolume) * 100).toFixed(1) : 0;

    if (volumeDiff > 0) {
      return {
        type: 'improved',
        message: `+${volumePercent}% volume`,
        color: 'bg-success',
        icon: TrendingUp,
        details: {
          currentVolume,
          previousVolume,
        }
      };
    } else if (volumeDiff < 0) {
      return {
        type: 'decreased',
        message: `${volumePercent}% volume`,
        color: 'bg-error',
        icon: TrendingDown,
        details: {
          currentVolume,
          previousVolume,
        }
      };
    } else {
      return {
        type: 'same',
        message: 'Same as last time',
        color: 'bg-warning',
        icon: Minus,
      };
    }
  };

  const stats = exercises.reduce((acc, exercise) => {
    const improvement = getExerciseImprovement(exercise);
    if (improvement.type === 'improved') acc.improved++;
    else if (improvement.type === 'decreased') acc.decreased++;
    else if (improvement.type === 'same') acc.same++;
    else acc.new++;
    return acc;
  }, { improved: 0, decreased: 0, same: 0, new: 0 });

  const totalExercises = exercises.length;
  const improvementRate = totalExercises > 0 ? ((stats.improved / totalExercises) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-4">
      {/* Overall Summary */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Workout Summary
            </CardTitle>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {improvementRate}% Improved
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-success/10 rounded-lg p-2">
              <div className="text-2xl font-bold text-success">{stats.improved}</div>
              <div className="text-xs text-muted-foreground">Better</div>
            </div>
            <div className="bg-warning/10 rounded-lg p-2">
              <div className="text-2xl font-bold text-warning">{stats.same}</div>
              <div className="text-xs text-muted-foreground">Same</div>
            </div>
            <div className="bg-error/10 rounded-lg p-2">
              <div className="text-2xl font-bold text-error">{stats.decreased}</div>
              <div className="text-xs text-muted-foreground">Lower</div>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-2">
              <div className="text-2xl font-bold text-blue-500">{stats.new}</div>
              <div className="text-xs text-muted-foreground">New</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Exercise Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {exercises.map((exercise, index) => {
            const improvement = getExerciseImprovement(exercise);
            const Icon = improvement.icon || Trophy;

            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-full ${improvement.color}/20`}>
                    <Icon className={`h-4 w-4 text-${improvement.color === 'bg-success' ? 'success' : improvement.color === 'bg-error' ? 'error' : improvement.color === 'bg-warning' ? 'warning' : 'blue-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{exercise.name}</div>
                    <div className="text-xs text-muted-foreground">{improvement.message}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {exercise.setData && exercise.setData.length > 0 
                      ? `${exercise.setData.length} sets`
                      : `${exercise.weight}kg × ${exercise.reps}`
                    }
                  </div>
                  {exercise.previousWeight && exercise.previousReps && (
                    <div className="text-xs text-muted-foreground">
                      {exercise.previousSetData && exercise.previousSetData.length > 0
                        ? `Was: ${exercise.previousSetData.length} sets`
                        : `Was: ${exercise.previousWeight}kg × ${exercise.previousReps}`
                      }
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
