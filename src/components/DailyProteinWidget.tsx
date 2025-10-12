import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp } from 'lucide-react';

interface DailyProteinWidgetProps {
  totalProteinToday: number;
}

export const DailyProteinWidget = ({ totalProteinToday }: DailyProteinWidgetProps) => {
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
        .select('daily_protein_target')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.daily_protein_target) {
        setDailyGoal(data.daily_protein_target);
      }
    } catch (error) {
      console.error('Error loading goal:', error);
    }
  };

  if (!dailyGoal) return null;

  const progress = Math.min((totalProteinToday / dailyGoal) * 100, 100);

  return (
    <Card className="border-2 border-[hsl(var(--widget-border))]">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Daily Protein</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(totalProteinToday)}/{dailyGoal}g
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
