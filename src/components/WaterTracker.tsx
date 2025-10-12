import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Droplets, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const WaterTracker = () => {
  const [todayIntake, setTodayIntake] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayIntake();
    fetchWaterGoal();
  }, []);

  const fetchTodayIntake = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('water_intake')
      .select('amount_ml')
      .eq('user_id', user.id)
      .eq('date', today);

    if (!error && data) {
      const total = data.reduce((sum, entry) => sum + entry.amount_ml, 0);
      setTodayIntake(total);
    }
  };

  const fetchWaterGoal = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_goals')
      .select('daily_water_target')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.daily_water_target) {
      setDailyGoal(data.daily_water_target);
    }
  };

  const addWater = async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('water_intake')
      .insert({
        user_id: user.id,
        amount_ml: amount,
        date: format(new Date(), 'yyyy-MM-dd')
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to log water intake',
        variant: 'destructive'
      });
    } else {
      setTodayIntake(prev => prev + amount);
      toast({
        title: 'Water logged!',
        description: `Added ${amount}ml to today's intake`
      });
    }
  };

  const percentage = Math.min(Math.round((todayIntake / dailyGoal) * 100), 100);

  return (
    <Card className="border-2 border-[hsl(var(--widget-border))]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Droplets className="h-4 w-4 text-blue-500" />
          Water Intake
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Today's Progress</span>
            <span className="font-medium">{todayIntake}ml / {dailyGoal}ml</span>
          </div>
          <Progress value={percentage} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center">{percentage}%</p>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addWater(250)}
            className="flex items-center gap-1 h-8 text-xs px-2"
          >
            <Plus className="h-3 w-3" />
            250ml
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addWater(500)}
            className="flex items-center gap-1 h-8 text-xs px-2"
          >
            <Plus className="h-3 w-3" />
            500ml
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addWater(750)}
            className="flex items-center gap-1 h-8 text-xs px-2"
          >
            <Plus className="h-3 w-3" />
            750ml
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
