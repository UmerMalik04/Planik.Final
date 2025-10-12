import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Target, Activity, Utensils, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface FitnessGoalsWidgetProps {
  workoutSessionsThisWeek: number;
  totalCaloriesToday: number;
  totalProteinToday: number;
}

export default function FitnessGoalsWidget({ 
  workoutSessionsThisWeek, 
  totalCaloriesToday,
  totalProteinToday 
}: FitnessGoalsWidgetProps) {
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

  // Calculate overall progress
  const activeGoals = [
    goals.weekly_workout_frequency ? workoutProgress : null,
    goals.daily_calorie_target ? calorieProgress : null,
    goals.daily_protein_target ? proteinProgress : null,
  ].filter(p => p !== null);
  
  const overallProgress = activeGoals.length > 0 
    ? activeGoals.reduce((sum, p) => sum + (p || 0), 0) / activeGoals.length 
    : 0;

  return (
    <Card 
      className="border-2 border-[hsl(var(--widget-border))] cursor-pointer hover:shadow-md transition-all"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Fitness Goals</p>
              <p className="text-xs text-muted-foreground">
                {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {Math.round(overallProgress)}%
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
        <Progress value={overallProgress} className="h-2" />

        {isExpanded && (
          <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            {/* Workout Frequency Goal */}
            {goals.weekly_workout_frequency && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Activity className="w-4 h-4 text-primary" />
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
              </div>
            )}

            {/* Daily Calorie Goal */}
            {goals.daily_calorie_target && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Utensils className="w-4 h-4 text-primary" />
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
              </div>
            )}

            {/* Daily Protein Goal */}
            {goals.daily_protein_target && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-primary" />
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
              </div>
            )}

            {/* Target Weight */}
            {goals.target_weight && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-3">
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
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
