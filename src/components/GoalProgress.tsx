import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Target, Activity, Utensils, TrendingUp } from 'lucide-react';

interface GoalProgressProps {
  workoutSessionsThisWeek: number;
  totalCaloriesToday: number;
  totalProteinToday: number;
}

export default function GoalProgress({ 
  workoutSessionsThisWeek, 
  totalCaloriesToday,
  totalProteinToday 
}: GoalProgressProps) {
  const [goals, setGoals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-3">
      {/* Workout Frequency Goal */}
      {goals.weekly_workout_frequency && (
        <Card className="border-2 border-[hsl(var(--widget-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Weekly Workouts</p>
                <p className="text-xs text-muted-foreground">
                  {workoutSessionsThisWeek}/{goals.weekly_workout_frequency} completed
                </p>
              </div>
              <span className="text-lg font-bold text-primary">
                {Math.round(workoutProgress)}%
              </span>
            </div>
            <Progress value={workoutProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Daily Calorie Goal */}
      {goals.daily_calorie_target && (
        <Card className="border-2 border-[hsl(var(--widget-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Utensils className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Daily Calories</p>
                <p className="text-xs text-muted-foreground">
                  {totalCaloriesToday}/{goals.daily_calorie_target} cal
                </p>
              </div>
              <span className="text-lg font-bold text-primary">
                {Math.round(calorieProgress)}%
              </span>
            </div>
            <Progress value={calorieProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Daily Protein Goal */}
      {goals.daily_protein_target && (
        <Card className="border-2 border-[hsl(var(--widget-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Daily Protein</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(totalProteinToday)}/{goals.daily_protein_target}g
                </p>
              </div>
              <span className="text-lg font-bold text-primary">
                {Math.round(proteinProgress)}%
              </span>
            </div>
            <Progress value={proteinProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Target Weight */}
      {goals.target_weight && (
        <Card className="border-2 border-[hsl(var(--widget-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Target Weight</p>
                <p className="text-xs text-muted-foreground">
                  Goal: {goals.target_weight} kg
                  {goals.target_date && ` by ${new Date(goals.target_date).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}