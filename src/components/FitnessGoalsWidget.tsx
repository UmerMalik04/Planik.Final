import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Target, Activity, Utensils, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FitnessGoalsWidgetProps {
  workoutSessionsThisWeek: number;
  totalCaloriesToday: number;
  totalProteinToday: number;
}

export const FitnessGoalsWidget = ({ 
  workoutSessionsThisWeek, 
  totalCaloriesToday,
  totalProteinToday 
}: FitnessGoalsWidgetProps) => {
  const [goals, setGoals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !goals) return null;

  const calculateProgress = (current: number, target: number) => {
    if (!target) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const workoutProgress = calculateProgress(workoutSessionsThisWeek, goals.weekly_workout_frequency || 0);
  const calorieProgress = calculateProgress(totalCaloriesToday, goals.daily_calorie_target || 0);
  const proteinProgress = calculateProgress(totalProteinToday, goals.daily_protein_target || 0);

  const hasAnyGoals = goals.weekly_workout_frequency || goals.daily_calorie_target || goals.daily_protein_target || goals.target_weight;

  if (!hasAnyGoals) return null;

  return (
    <Card className="border-2 border-[hsl(var(--widget-border))]">
      <CardHeader 
        className="cursor-pointer pb-3" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            Fitness Goals
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3 pt-0">
          {/* Workout Frequency Goal */}
          {goals.weekly_workout_frequency && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Weekly Workouts</p>
                  <p className="text-xs text-muted-foreground">
                    {workoutSessionsThisWeek}/{goals.weekly_workout_frequency} completed
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">
                  {Math.round(workoutProgress)}%
                </span>
              </div>
              <Progress value={workoutProgress} className="h-1.5" />
            </div>
          )}

          {/* Daily Calorie Goal */}
          {goals.daily_calorie_target && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Utensils className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Daily Calories</p>
                  <p className="text-xs text-muted-foreground">
                    {totalCaloriesToday}/{goals.daily_calorie_target} cal
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">
                  {Math.round(calorieProgress)}%
                </span>
              </div>
              <Progress value={calorieProgress} className="h-1.5" />
            </div>
          )}

          {/* Daily Protein Goal */}
          {goals.daily_protein_target && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Daily Protein</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(totalProteinToday)}/{goals.daily_protein_target}g
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">
                  {Math.round(proteinProgress)}%
                </span>
              </div>
              <Progress value={proteinProgress} className="h-1.5" />
            </div>
          )}

          {/* Target Weight */}
          {goals.target_weight && (
            <div className="flex items-center gap-3 pt-1">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Target Weight</p>
                <p className="text-xs text-muted-foreground">
                  Goal: {goals.target_weight} kg
                  {goals.target_date && ` by ${new Date(goals.target_date).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
