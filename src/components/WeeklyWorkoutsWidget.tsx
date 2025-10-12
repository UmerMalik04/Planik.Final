import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from 'lucide-react';

interface WeeklyWorkoutsWidgetProps {
  workoutSessionsThisWeek: number;
}

export const WeeklyWorkoutsWidget = ({ workoutSessionsThisWeek }: WeeklyWorkoutsWidgetProps) => {
  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(null);

  useEffect(() => {
    loadGoal();
  }, []);

  const loadGoal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_goals')
        .select('weekly_workout_frequency')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.weekly_workout_frequency) {
        setWeeklyGoal(data.weekly_workout_frequency);
      }
    } catch (error) {
      console.error('Error loading goal:', error);
    }
  };

  if (!weeklyGoal) return null;

  const progress = Math.min((workoutSessionsThisWeek / weeklyGoal) * 100, 100);

  return (
    <Card className="border-2 border-[hsl(var(--widget-border))]">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Weekly Workouts</p>
            <p className="text-xs text-muted-foreground">
              {workoutSessionsThisWeek}/{weeklyGoal} completed
            </p>
          </div>
          <span className="text-lg font-bold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardContent>
    </Card>
  );
};
