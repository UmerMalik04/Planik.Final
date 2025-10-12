import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Utensils } from 'lucide-react';

interface DailyCaloriesWidgetProps {
  totalCaloriesToday: number;
}

export const DailyCaloriesWidget = ({ totalCaloriesToday }: DailyCaloriesWidgetProps) => {
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);

  useEffect(() => {
    loadGoal();
  }, []);

  const loadGoal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_goals')
        .select('daily_calorie_target')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.daily_calorie_target) {
        setDailyGoal(data.daily_calorie_target);
      }
    } catch (error) {
      console.error('Error loading goal:', error);
    }
  };

  if (!dailyGoal) return null;

  const progress = Math.min((totalCaloriesToday / dailyGoal) * 100, 100);

  return (
    <Card className="border-2 border-[hsl(var(--widget-border))]">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Utensils className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Daily Calories</p>
            <p className="text-xs text-muted-foreground">
              {totalCaloriesToday}/{dailyGoal} cal
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
