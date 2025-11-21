import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkoutStore } from "@/stores/useWorkoutStore";
import { Plus, Minus, TrendingUp, TrendingDown, Utensils, Activity, Edit3, Check } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { useDietStore } from "@/stores/useDietStore";
import { HealthService } from "@/services/HealthService";
import FitnessGoalsWidget from "@/components/FitnessGoalsWidget";
import { WaterTracker } from "@/components/WaterTracker";
import { DraggableWidget } from "@/components/DraggableWidget";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import muscularBodyDiagram from "@/assets/muscular-body-diagram.png";
import { supabase } from "@/integrations/supabase/client";


export default function Home() {
  const navigate = useNavigate();
  const { getText } = useSettings();
  const { getDailyNutrition } = useDietStore();
  const { 
    workoutPlans, 
    workoutSessions, 
    currentStreak, 
    workoutTypes, 
    progressKg,
    lastWeekProgress,
    addWorkoutType, 
    deleteWorkoutType, 
    getWorkoutFrequency,
    getWorkoutProgress,
    calculateProgress 
  } = useWorkoutStore();
  
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customWorkoutName, setCustomWorkoutName] = useState("");
  const [steps, setSteps] = useState(0);
  const [stepGoal] = useState(10000);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    'stats',
    'steps',
    'goals',
    'water',
    'workouts',
    'diet'
  ]);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);

  // Ensure goals widget is always visible on first load
  useEffect(() => {
    const ensureGoalsVisible = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_preferences')
        .select('hidden_widgets')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.hidden_widgets && (data.hidden_widgets as string[]).includes('goals')) {
        const newHidden = (data.hidden_widgets as string[]).filter(id => id !== 'goals');
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            widget_order: widgetOrder,
            hidden_widgets: newHidden
          }, { onConflict: 'user_id' });
        setHiddenWidgets(newHidden);
      }
    };
    ensureGoalsVisible();
  }, []);

  useEffect(() => {
    calculateProgress();
    initializeStepCounter();
    loadPreferences();
  }, [workoutSessions]);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_preferences')
      .select('widget_order, hidden_widgets')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      if (data.widget_order) setWidgetOrder(data.widget_order as string[]);
      if (data.hidden_widgets) setHiddenWidgets(data.hidden_widgets as string[]);
    }
  };

  const initializeStepCounter = async () => {
    // Request permissions for native step counter
    const granted = await HealthService.requestPermissions();
    setPermissionGranted(granted);
    
    if (granted) {
      // Get today's steps from native plugin
      const todaySteps = await HealthService.getStepsToday();
      setSteps(todaySteps);
      
      // Update steps every minute
      const stepInterval = setInterval(async () => {
        const currentSteps = await HealthService.getStepsToday();
        setSteps(currentSteps);
      }, 60000); // Update every 60 seconds
      
      return () => clearInterval(stepInterval);
    } else {
      // Fallback to simulated steps for web/demo
      const savedSteps = localStorage.getItem('daily-steps');
      const today = new Date().toDateString();
      const savedStepsData = savedSteps ? JSON.parse(savedSteps) : {};
      
      if (savedStepsData.date === today) {
        setSteps(savedStepsData.steps || 0);
      } else {
        setSteps(0);
        localStorage.setItem('daily-steps', JSON.stringify({
          date: today,
          steps: 0
        }));
      }
      
      // Simulate step counting for demo
      const stepInterval = setInterval(() => {
        setSteps(prev => {
          const newSteps = prev + Math.floor(Math.random() * 3);
          const today = new Date().toDateString();
          localStorage.setItem('daily-steps', JSON.stringify({
            date: today,
            steps: newSteps
          }));
          return newSteps;
        });
      }, 30000);
      
      return () => clearInterval(stepInterval);
    }
  };

  const getWorkoutSessionsThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    return workoutSessions.filter(session => 
      new Date(session.date) >= startOfWeek
    ).length;
  };

  const getTodayNutrition = () => {
    const today = new Date().toISOString().split('T')[0];
    return getDailyNutrition(today);
  };

  const getWorkoutSummary = () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const recentSessions = workoutSessions.filter(
      session => new Date(session.date) >= oneMonthAgo
    );

    const allRecentExercises = recentSessions.flatMap(session => session.exercises);

    return {
      totalWorkouts: recentSessions.length,
      uniqueExercises: new Set(allRecentExercises.map(e => e.name)).size,
      totalWeight: allRecentExercises.reduce((sum, e) => sum + (e.weight * e.reps * e.sets), 0)
    };
  };

  const summary = getWorkoutSummary();

  const handleWorkoutTypeClick = useCallback((workoutType: string) => {
    const existingPlan = workoutPlans.find(plan => plan.type === workoutType);
    if (existingPlan) {
      navigate(`/workout-plan/${existingPlan.id}`);
    } else {
      navigate(`/create-plan?type=${workoutType}`);
    }
  }, [workoutPlans, navigate]);

  const handleAddCustomWorkout = useCallback(() => {
    if (customWorkoutName.trim()) {
      const colors = [
        "bg-card border-orange-500 text-orange-600",
        "bg-card border-pink-500 text-pink-600", 
        "bg-card border-teal-500 text-teal-600",
        "bg-card border-purple-500 text-purple-600",
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      addWorkoutType({
        name: customWorkoutName,
        color: randomColor
      });
      setCustomWorkoutName("");
      setShowCustomInput(false);
    }
  }, [customWorkoutName, addWorkoutType]);

  const handleDeleteWorkout = useCallback((workoutName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteWorkoutType(workoutName);
  }, [deleteWorkoutType]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        const saveOrder = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('user_preferences')
              .upsert({
                user_id: user.id,
                widget_order: newOrder,
                hidden_widgets: hiddenWidgets
              }, { onConflict: 'user_id' });
          }
        };
        saveOrder();
        
        return newOrder;
      });
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    const newHidden = [...hiddenWidgets, widgetId];
    setHiddenWidgets(newHidden);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          widget_order: widgetOrder,
          hidden_widgets: newHidden
        }, { onConflict: 'user_id' });
    }
  };

  const handleRestoreWidget = async (widgetId: string) => {
    const newHidden = hiddenWidgets.filter(id => id !== widgetId);
    setHiddenWidgets(newHidden);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          widget_order: widgetOrder,
          hidden_widgets: newHidden
        }, { onConflict: 'user_id' });
    }
  };

  const visibleWidgets = widgetOrder.filter(id => !hiddenWidgets.includes(id));
  const availableWidgets = widgetOrder.filter(id => hiddenWidgets.includes(id));

  const widgets: Record<string, JSX.Element> = {
    stats: (
      <Card className="border-2 border-[hsl(var(--widget-border))]">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2">
                {(() => {
                  const getProgressDisplay = () => {
                    if (progressKg === 0) return { text: '0%', color: 'text-muted-foreground', arrow: null };
                    
                    if (lastWeekProgress > 0) {
                      const percentChange = ((progressKg / lastWeekProgress) * 100);
                      const isImproving = progressKg > 0;
                      return {
                        text: `${isImproving ? '+' : ''}${percentChange.toFixed(1)}%`,
                        color: isImproving ? 'text-green-600' : 'text-red-600',
                        arrow: isImproving ? 'up' : 'down'
                      };
                    } else {
                      const isImproving = progressKg > 0;
                      return {
                        text: isImproving ? '+100%' : '0%',
                        color: isImproving ? 'text-green-600' : 'text-muted-foreground',
                        arrow: isImproving ? 'up' : null
                      };
                    }
                  };
                  
                  const progress = getProgressDisplay();
                  
                  return (
                    <>
                      <div className={`text-2xl font-bold ${progress.color}`}>
                        {progress.text}
                      </div>
                      {progress.arrow === 'up' && (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      )}
                      {progress.arrow === 'down' && (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="text-sm text-muted-foreground">{getText('progress')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{summary.totalWorkouts}</div>
              <div className="text-sm text-muted-foreground">{getText('workouts')} (1mo)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{summary.uniqueExercises}</div>
              <div className="text-sm text-muted-foreground">{getText('exercises')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    steps: (
      <Card 
        className="border-2 border-[hsl(var(--widget-border))] cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate('/step-history')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{getText('daily_steps')}</h3>
                <p className="text-sm text-muted-foreground">{steps.toLocaleString()} / {stepGoal.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{Math.round((steps / stepGoal) * 100)}%</div>
              <div className="text-sm text-muted-foreground">{getText('goal_progress')}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((steps / stepGoal) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    goals: (
      <FitnessGoalsWidget 
        workoutSessionsThisWeek={getWorkoutSessionsThisWeek()}
        totalCaloriesToday={getTodayNutrition().totalCalories}
        totalProteinToday={getTodayNutrition().totalProtein}
      />
    ),
    water: <WaterTracker />,
    workouts: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold">{getText('choose_workout')}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/templates')}
              className="flex items-center gap-2"
            >
              Templates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {getText('custom')}
            </Button>
          </div>
        </div>
        
        {showCustomInput && (
          <Card className="border-2 border-[hsl(var(--widget-border))]">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter workout name..."
                  value={customWorkoutName}
                  onChange={(e) => setCustomWorkoutName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomWorkout()}
                />
                <Button onClick={handleAddCustomWorkout} size="sm">
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          {workoutTypes.map((workout) => {
            const hasExistingPlan = workoutPlans.some(plan => plan.type === workout.name);
            const frequency = getWorkoutFrequency(workout.name);
            const progress = getWorkoutProgress(workout.name);
            
            const getProgressMessage = () => {
              switch (progress) {
                case 'increase': return getText('seen_increase');
                case 'decrease': return getText('seen_decrease');
                case 'same': return getText('same_as_last_week');
                default: return getText('no_recent_activity');
              }
            };

            const getProgressColor = () => {
              switch (progress) {
                case 'increase': return 'text-green-400';
                case 'decrease': return 'text-red-400';
                case 'same': return 'text-yellow-400';
                default: return 'text-gray-400';
              }
            };

            return (
              <div key={workout.name} className="relative">
                <Card 
                  className="border-2 border-widget transition-all duration-200 hover:scale-105 cursor-pointer bg-card"
                  onClick={() => handleWorkoutTypeClick(workout.name)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col space-y-1 sm:space-y-2">
                      <h3 className="text-sm sm:text-lg font-bold text-foreground">{workout.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{frequency} {getText('times_past_month')}</p>
                      {progress !== 'none' && (
                        <div className={`text-xs px-2 py-1 rounded border ${getProgressColor()} border-current`}>
                          {getProgressMessage()}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {hasExistingPlan ? getText('tap_to_continue') : getText('create_plan')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                  onClick={(e) => handleDeleteWorkout(workout.name, e)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    ),
    diet: (
      <Card 
        className="p-4 cursor-pointer hover:shadow-md transition-all border-2 border-widget bg-background"
        onClick={() => navigate("/diet-tracker")}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{getText('diet_tracker')}</h3>
            <p className="text-sm text-muted-foreground">{getText('track_nutrition')}</p>
          </div>
        </div>
      </Card>
    )
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header with Edit Toggle */}
      <div className="flex items-start justify-between gap-4">
        <div className="text-center flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{getText('dynamic_greeting')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{getText('gym_companion')}</p>
        </div>
        <Button
          variant={isEditMode ? "default" : "outline"}
          size="icon"
          onClick={() => setIsEditMode(!isEditMode)}
          className="shrink-0"
        >
          {isEditMode ? (
            <Check className="w-4 h-4" />
          ) : (
            <Edit3 className="w-4 h-4" />
          )}
        </Button>
      </div>

      {isEditMode && (
        <>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-foreground">
            <p className="font-medium">Edit Mode Active</p>
            <p className="text-xs text-muted-foreground mt-1">Drag the grip handles to reorder widgets or click X to hide them</p>
          </div>

          {availableWidgets.length > 0 && (
            <div className="bg-muted/50 border border-muted rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Hidden Widgets</p>
              <div className="flex flex-wrap gap-2">
                {availableWidgets.map(widgetId => (
                  <Button
                    key={widgetId}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreWidget(widgetId)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Show {widgetId}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {visibleWidgets.map((widgetId) => (
              <DraggableWidget
                key={widgetId}
                id={widgetId}
                isEditMode={isEditMode}
                onRemove={() => handleRemoveWidget(widgetId)}
              >
                {widgets[widgetId]}
              </DraggableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}