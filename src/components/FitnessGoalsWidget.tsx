import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Target, Activity, Utensils, TrendingUp, ChevronDown, ChevronUp, Settings as SettingsIcon } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await loadGoals(user.id);

      // Realtime: refresh the widget instantly when this user's goals change
      channel = supabase
        .channel('user_goals_widget')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_goals', filter: `user_id=eq.${user.id}` },
          () => loadGoals(user.id)
        )
        .subscribe();
    };

    init();

    // Also refresh when the user returns from the Settings tab
    const refresh = () => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) loadGoals(user.id);
      });
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const loadGoals = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  // Render the widget always — when goals are missing, show a corner CTA badge.

  const calculateProgress = (current: number, target: number) => {
    if (!target) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const workoutProgress = calculateProgress(workoutSessionsThisWeek, goals?.weekly_workout_frequency || 0);
  const calorieProgress = calculateProgress(totalCaloriesToday, goals?.daily_calorie_target || 0);
  const proteinProgress = calculateProgress(totalProteinToday, goals?.daily_protein_target || 0);

  // Calculate overall progress
  const activeGoals = [
    goals?.weekly_workout_frequency ? workoutProgress : null,
    goals?.daily_calorie_target ? calorieProgress : null,
    goals?.daily_protein_target ? proteinProgress : null,
  ].filter(p => p !== null);

  const overallProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, p) => sum + (p || 0), 0) / activeGoals.length
    : 0;

  const hasNoGoals = !goals || activeGoals.length === 0;

  return (
    <Card
      className="border-2 border-[hsl(var(--widget-border))] cursor-pointer hover:shadow-soft transition-all relative"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Corner badge: prompts user to set goals in Settings when none exist */}
      {hasNoGoals && (
        <Link
          to="/settings"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 z-10"
          aria-label="Set up fitness goals in settings"
        >
          <Badge variant="outline" className="gap-1 text-[10px] font-medium bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors">
            <SettingsIcon className="w-3 h-3" />
            Needs data — set in Settings
          </Badge>
        </Link>
      )}

      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Fitness Goals</p>
              <p className="text-xs text-muted-foreground">
                {hasNoGoals
                  ? 'No goals configured yet'
                  : `${activeGoals.length} active goal${activeGoals.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasNoGoals && (
              <span className="text-lg font-bold text-primary">
                {Math.round(overallProgress)}%
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
        {!hasNoGoals && <Progress value={overallProgress} className="h-2" />}

        {isExpanded && (
          <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            {hasNoGoals && (
              <div className="border-t pt-3 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No fitness goals configured yet.
                </p>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Open Settings
                </Link>
              </div>
            )}
            {/* Workout Frequency Goal */}
            {goals?.weekly_workout_frequency && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Weekly Workouts</p>
                    <p className="text-xs text-muted-foreground">
                      {workoutSessionsThisWeek}/{goals?.weekly_workout_frequency} completed
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
            {goals?.daily_calorie_target && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Utensils className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Daily Calories</p>
                    <p className="text-xs text-muted-foreground">
                      {totalCaloriesToday}/{goals?.daily_calorie_target} cal
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
            {goals?.daily_protein_target && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Daily Protein</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(totalProteinToday)}/{goals?.daily_protein_target}g
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
            {goals?.target_weight && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Target Weight</p>
                    <p className="text-xs text-muted-foreground">
                      Goal: {goals?.target_weight} kg
                      {goals?.target_date && ` by ${new Date(goals.target_date).toLocaleDateString()}`}
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
