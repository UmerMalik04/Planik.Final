import { useNavigate } from "react-router-dom";
import { ArrowLeft, Dumbbell, Target, Calendar, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { workoutTemplates } from "@/data/workoutTemplates";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useRef } from "react";
import { SEO } from "@/components/SEO";

/**
 * Templates page ("/templates").
 * Browse pre-built workout templates and instantiate one as a personal
 * plan. Uses a ref-based guard to swallow rapid double-clicks.
 */
const Templates = () => {
  const navigate = useNavigate();
  const { addWorkoutPlan, initializeUserData } = useWorkoutStore();
  const processingRef = useRef<Set<string>>(new Set());

  /** Clone the chosen template into a new workout plan for the current user. */
  const handleUseTemplate = useCallback((templateId: string) => {
    // Prevent duplicate clicks
    if (processingRef.current.has(templateId)) return;
    processingRef.current.add(templateId);
    
    const template = workoutTemplates.find(t => t.id === templateId);
    if (!template) {
      processingRef.current.delete(templateId);
      return;
    }

    // Determine workout type
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

    // INSTANT NAVIGATION - navigate immediately with template data in state
    // The StartWorkout page will handle creating the plan if needed
    navigate('/start-workout/template', { 
      state: { 
        templateId,
        templateName: template.name,
        templateType: workoutType,
        exercises: template.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets,
          reps: parseInt(ex.reps.split('-')[0]) || 10,
          hasWarmup: false
        }))
      } 
    });

    // Background: Create the plan in database (fire and forget)
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Add plan to store
        const newPlan = {
          name: template.name,
          type: workoutType,
          exercises: [] as any[],
          restTimer: 90
        };

        await addWorkoutPlan(newPlan);
        
        // Get the newly created plan to add exercises
        const plans = useWorkoutStore.getState().workoutPlans;
        const createdPlan = plans.find(p => p.name === template.name && p.type === workoutType);
        
        if (createdPlan) {
          const { addExercise } = useWorkoutStore.getState();
          for (const ex of template.exercises) {
            await addExercise(createdPlan.id, {
              name: ex.name,
              sets: ex.sets,
              reps: parseInt(ex.reps.split('-')[0]) || 10,
              hasWarmup: false
            });
          }
        }

        await initializeUserData();
        toast.success(`${template.name} saved to your workouts!`);
      } catch (error) {
        console.error("Background sync error:", error);
      } finally {
        processingRef.current.delete(templateId);
      }
    })();
  }, [addWorkoutPlan, initializeUserData, navigate]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title="Workout Templates — Planik"
        description="Start fast with curated workout templates for strength, hypertrophy, fat loss, and conditioning. One tap to clone a plan into your library."
      />
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
            aria-label="Go back"
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

              {/* Start Workout Button - Instant action */}
              <Button 
                className="w-full"
                onClick={() => handleUseTemplate(template.id)}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Workout
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Templates;
