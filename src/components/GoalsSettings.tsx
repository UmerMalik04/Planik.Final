import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Target, TrendingUp, Utensils, Activity } from 'lucide-react';

interface UserGoals {
  id?: string;
  target_weight?: number;
  weekly_workout_frequency?: number;
  daily_calorie_target?: number;
  daily_protein_target?: number;
  daily_water_target?: number;
  target_date?: string;
}

export default function GoalsSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<UserGoals>({
    target_weight: undefined,
    weekly_workout_frequency: 4,
    daily_calorie_target: 2000,
    daily_protein_target: 150,
    daily_water_target: 2000,
    target_date: '',
  });

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
      
      if (data) {
        setGoals({
          id: data.id,
          target_weight: data.target_weight,
          weekly_workout_frequency: data.weekly_workout_frequency,
          daily_calorie_target: data.daily_calorie_target,
          daily_protein_target: data.daily_protein_target,
          daily_water_target: data.daily_water_target,
          target_date: data.target_date || '',
        });
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const goalsData = {
        user_id: user.id,
        target_weight: goals.target_weight || null,
        weekly_workout_frequency: goals.weekly_workout_frequency || null,
        daily_calorie_target: goals.daily_calorie_target || null,
        daily_protein_target: goals.daily_protein_target || null,
        daily_water_target: goals.daily_water_target || null,
        target_date: goals.target_date || null,
      };

      if (goals.id) {
        // Update existing goals
        const { error } = await supabase
          .from('user_goals')
          .update(goalsData)
          .eq('id', goals.id);
        
        if (error) throw error;
      } else {
        // Create new goals
        const { data, error } = await supabase
          .from('user_goals')
          .insert([goalsData])
          .select()
          .single();
        
        if (error) throw error;
        if (data) setGoals({ ...goals, id: data.id });
      }

      toast({
        title: 'Goals saved',
        description: 'Your fitness goals have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to save goals. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-[hsl(var(--widget-border))]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Fitness Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target Weight */}
        <div className="space-y-1.5">
          <Label htmlFor="target-weight" className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-primary" />
            Target Weight (kg)
          </Label>
          <Input
            id="target-weight"
            type="number"
            step="0.1"
            placeholder="e.g., 75"
            className="h-9"
            value={goals.target_weight || ''}
            onChange={(e) => setGoals({ ...goals, target_weight: parseFloat(e.target.value) || undefined })}
          />
        </div>

        {/* Weekly Workout Frequency */}
        <div className="space-y-1.5">
          <Label htmlFor="workout-frequency" className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-primary" />
            Weekly Workout Frequency
          </Label>
          <Input
            id="workout-frequency"
            type="number"
            min="1"
            max="7"
            placeholder="e.g., 4"
            className="h-9"
            value={goals.weekly_workout_frequency || ''}
            onChange={(e) => setGoals({ ...goals, weekly_workout_frequency: parseInt(e.target.value) || undefined })}
          />
          <p className="text-xs text-muted-foreground">How many days per week do you want to workout?</p>
        </div>

        {/* Daily Calorie Target */}
        <div className="space-y-1.5">
          <Label htmlFor="calorie-target" className="flex items-center gap-2 text-sm">
            <Utensils className="w-4 h-4 text-primary" />
            Daily Calorie Target
          </Label>
          <Input
            id="calorie-target"
            type="number"
            placeholder="e.g., 2000"
            className="h-9"
            value={goals.daily_calorie_target || ''}
            onChange={(e) => setGoals({ ...goals, daily_calorie_target: parseInt(e.target.value) || undefined })}
          />
        </div>

        {/* Daily Protein Target */}
        <div className="space-y-1.5">
          <Label htmlFor="protein-target" className="flex items-center gap-2 text-sm">
            <Utensils className="w-4 h-4 text-primary" />
            Daily Protein Target (g)
          </Label>
          <Input
            id="protein-target"
            type="number"
            placeholder="e.g., 150"
            className="h-9"
            value={goals.daily_protein_target || ''}
            onChange={(e) => setGoals({ ...goals, daily_protein_target: parseFloat(e.target.value) || undefined })}
          />
        </div>

        {/* Daily Water Target */}
        <div className="space-y-1.5">
          <Label htmlFor="water-target" className="flex items-center gap-2 text-sm">
            <Utensils className="w-4 h-4 text-primary" />
            Daily Water Target (ml)
          </Label>
          <Input
            id="water-target"
            type="number"
            placeholder="e.g., 2000"
            className="h-9"
            value={goals.daily_water_target || ''}
            onChange={(e) => setGoals({ ...goals, daily_water_target: parseInt(e.target.value) || undefined })}
          />
        </div>

        {/* Target Date */}
        <div className="space-y-1.5">
          <Label htmlFor="target-date" className="text-sm">Target Date (Optional)</Label>
          <Input
            id="target-date"
            type="date"
            className="h-9 text-sm"
            value={goals.target_date}
            onChange={(e) => setGoals({ ...goals, target_date: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">When do you want to achieve your goals?</p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Saving...' : 'Save Goals'}
        </Button>
      </CardContent>
    </Card>
  );
}