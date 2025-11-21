import { useNavigate } from "react-router-dom";
import { ArrowLeft, Dumbbell, Target, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { workoutTemplates } from "@/data/workoutTemplates";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useCallback } from "react";

const Templates = () => {
  const navigate = useNavigate();
  const { initializeUserData } = useWorkoutStore();
  const [isCreating, setIsCreating] = useState(false);

  const handleUseTemplate = useCallback(async (templateId: string) => {
    if (isCreating) return;
    
    const template = workoutTemplates.find(t => t.id === templateId);
    if (!template) return;

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to create a workout");
        setIsCreating(false);
        return;
      }

      let workoutType = template.name;
      if (template.name.toLowerCase().includes('push')) {
        workoutType = 'Push Day';
      } else if (template.name.toLowerCase().includes('pull') || template.name.toLowerCase().includes('back')) {
        workoutType = 'Pull Day';
      } else if (template.name.toLowerCase().includes('leg')) {
        workoutType = 'Leg Day';
      } else if (template.name.toLowerCase().includes('arm') || template.name.toLowerCase().includes('bicep') || template.name.toLowerCase().includes('tricep')) {
        workoutType = 'Arm Day';
      }

      const { data: planData, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: template.name,
          type: workoutType,
          description: template.goal,
        })
        .select()
        .single();

      if (planError || !planData) {
        console.error("Error creating workout plan:", planError);
        toast.error("Failed to create workout plan");
        setIsCreating(false);
        return;
      }

      const exercisePromises = template.exercises.map((exercise, index) => {
        const repsNum = parseInt(exercise.reps.split('-')[0]) || 10;
        
        return supabase
          .from('exercises')
          .insert({
            user_id: user.id,
            workout_plan_id: planData.id,
            name: exercise.name,
            reps: repsNum,
            sets: exercise.sets,
            has_warmup: false,
            order_index: index,
          });
      });

      await Promise.all(exercisePromises);

      toast.success(`${template.name} template added!`);
      await initializeUserData();
      navigate(`/workout-plan/${planData.id}`);
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create workout from template");
      setIsCreating(false);
    }
  }, [initializeUserData, navigate, isCreating]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Workout Templates</h1>
            <p className="text-sm text-muted-foreground">Choose a pre-made workout plan</p>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="p-4 space-y-4">
        {workoutTemplates.map((template) => (
          <Card key={template.id} className="p-5 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Template Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${template.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                    {template.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {template.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {template.exercises.length} exercises
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal */}
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{template.goal}</p>
              </div>

              {/* Frequency */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{template.frequency}</p>
              </div>

              {/* Exercise List Preview */}
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">EXERCISES</p>
                <div className="space-y-1.5">
                  {template.exercises.slice(0, 4).map((exercise, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Dumbbell className="h-3 w-3 text-muted-foreground" />
                      <span className="text-foreground">{exercise.name}</span>
                      <span className="text-muted-foreground ml-auto">
                        {exercise.sets} × {exercise.reps}
                      </span>
                    </div>
                  ))}
                  {template.exercises.length > 4 && (
                    <p className="text-xs text-muted-foreground pl-5">
                      +{template.exercises.length - 4} more exercises
                    </p>
                  )}
                </div>
              </div>

              {/* Use Template Button */}
              <Button 
                className="w-full" 
                onClick={() => handleUseTemplate(template.id)}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Use This Template'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Templates;
