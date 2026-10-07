import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthService } from "@/services/HealthService";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from "date-fns";
import { HealthKitDisclosure } from "@/components/HealthKitDisclosure";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DaySteps {
  date: Date;
  steps: number;
}

/**
 * StepHistory page ("/step-history").
 * Day / week / month views of step counts. Subscribes to a user-scoped
 * realtime channel so cells update live as new step data is synced.
 */
export default function StepHistory() {
  const navigate = useNavigate();
  const [dailyGoal, setDailyGoal] = useState(9000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlySteps, setMonthlySteps] = useState<DaySteps[]>([]);
  const [weeklySteps, setWeeklySteps] = useState<{ date: string; steps: number }[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [longestStreak, setLongestStreak] = useState(0);
  const [bestMonth, setBestMonth] = useState<{ month: string; steps: number }>({ month: '', steps: 0 });
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const generateEmptyCalendar = (month: Date): DaySteps[] => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    return days.map(date => ({ date, steps: 0 }));
  };

  /**
   * Build the calendar rows for a month from a date -> steps map.
   * Pure, so it can be used both for the instant first paint (from the device
   * snapshot) and for the later server/native results.
   */
  const buildCalendar = (month: Date, stepsMap: Map<string, number>): DaySteps[] => {
    const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
    return days.map((date) => ({
      date,
      steps: stepsMap.get(format(date, 'yyyy-MM-dd')) ?? 0,
    }));
  };

  const applyStepsToCalendar = useCallback((month: Date, stepsMap: Map<string, number>) => {
    setMonthlySteps(buildCalendar(month, stepsMap));
  }, []);

  // Load data when month changes
  useEffect(() => {
    let cancelled = false;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Frame 1: paint the last-known numbers for this month straight from the
    // device snapshot (no network, no await) so the calendar is never blank.
    const snapshot = HealthService.getMonthlyStepsSnapshot(year, month);
    setMonthlySteps(snapshot ? buildCalendar(currentMonth, snapshot) : generateEmptyCalendar(currentMonth));

    const loadData = async () => {
      // Step 1: reuse the prefetched/warm fetch when the idle prefetcher
      // already loaded this month, otherwise fetch it now.
      const dbSteps = await HealthService.getMonthlySteps(year, month);
      if (cancelled) return;
      applyStepsToCalendar(currentMonth, dbSteps);

      // Step 2: Sync from native health store in background
      setIsSyncing(true);
      try {
        const healthSteps = await HealthService.syncMonthFromHealthKit(year, month, dbSteps);
        if (cancelled) return;

        if (healthSteps.size > 0) {
          const merged = new Map(dbSteps);
          // A native 0 must never blank out a day we already recorded.
          healthSteps.forEach((steps, date) => {
            if (steps > 0 || !(dbSteps.get(date) ?? 0)) merged.set(date, steps);
          });
          applyStepsToCalendar(currentMonth, merged);
          setLastSynced(new Date());
        }

      } finally {
        if (!cancelled) setIsSyncing(false);
      }

      if (!cancelled) loadStats();
    };

    loadData();
    HealthService.getWeeklySteps().then(w => { if (!cancelled) setWeeklySteps(w); });


    return () => { cancelled = true; };
  }, [currentMonth, applyStepsToCalendar]);

  // Realtime subscription for daily_steps
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`daily-steps-realtime:${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'daily_steps',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          const record = payload.eventType === 'DELETE' ? payload.old : payload.new;
          // Note: check for null/undefined, not falsiness — a legitimate 0-step day must still update the calendar.
          if (!record?.date || record?.steps == null) return;

          setMonthlySteps(prev => {
            return prev.map(day => {
              const dayStr = format(day.date, 'yyyy-MM-dd');
              if (dayStr === record.date) {
                return { ...day, steps: record.steps as number };
              }
              return day;
            });
          });
        })
        .subscribe();
    };

    setupRealtime();
    return () => { channel?.unsubscribe(); };
  }, [currentMonth]);

  /** Load aggregate stats (longest streak, best month) from the health store. */
  const loadStats = async () => {
    const stats = await HealthService.getStepStats();
    setLongestStreak(stats.longestStreak);
    setBestMonth(stats.bestMonth);
  };

  /** Force a fresh sync from HealthKit / Health Connect. */
  const handleManualRefresh = async () => {
    setIsSyncing(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const { stepsMap, syncedFromNative } = await HealthService.refreshMonth(year, month);
      applyStepsToCalendar(currentMonth, stepsMap);
      setLastSynced(new Date());
      await loadStats();
      toast.success(syncedFromNative ? 'Synced from Health app' : 'Loaded from database');
    } catch (error) {
      toast.error('Failed to sync steps');
    } finally {
      setIsSyncing(false);
    }
  };

  /** Pick a tailwind text color for a step count based on how close it is to the goal. */
  const getStepColor = (steps: number) => {
    if (steps >= 10000) return "text-primary font-bold";
    if (steps >= 5000) return "text-primary";
    if (steps > 0) return "text-primary/70";
    return "text-muted-foreground/40";
  };

  const totalMonthSteps = monthlySteps.reduce((sum, day) => sum + day.steps, 0);
  const totalWeekSteps = weeklySteps.reduce((sum, day) => sum + day.steps, 0);

  /** Format a step count as a compact label (e.g. 12500 → "12.5K"). */
  const formatSteps = (steps: number) => {
    if (steps >= 1000) return `${(steps / 1000).toFixed(steps >= 10000 ? 0 : 1)}K`;
    return steps.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Step History</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleManualRefresh}
            disabled={isSyncing}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-primary-foreground/80">Daily goal:</span>
            <div className="flex items-center gap-1">
              {isEditingGoal ? (
                <input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded w-24 text-right text-sm"
                  onBlur={() => setIsEditingGoal(false)}
                  autoFocus
                />
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsEditingGoal(true)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <span className="font-medium">{dailyGoal.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-primary-foreground/80">Longest streak:</span>
            <span className="font-medium">{longestStreak} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-primary-foreground/80">Best month:</span>
            <span className="font-medium">
              {bestMonth.month}{bestMonth.steps > 0 ? ` · ${formatSteps(bestMonth.steps)}` : ''}
            </span>
          </div>
          {lastSynced && (
            <div className="text-xs text-primary-foreground/50 text-right">
              Last synced: {format(lastSynced, 'h:mm a')}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="month" className="w-full">
        <TabsList className="w-full grid grid-cols-3 rounded-none bg-muted">
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>

        {/* Month View */}
        <TabsContent value="month" className="mt-0">
          <div className="p-4 space-y-4">
            <HealthKitDisclosure variant="compact" />

            {/* Manual native sync trigger (HealthKit on iOS / Health Connect on Android) */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleManualRefresh}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing steps…' : 'Sync steps now'}
            </Button>


            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                ←
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {totalMonthSteps > 0 ? `${totalMonthSteps.toLocaleString()} steps` : 'No data'}
                  {isSyncing && <span className="ml-1 text-xs">(syncing...)</span>}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                disabled={currentMonth >= new Date()}
              >
                →
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 text-center">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div key={`${day}-${i}`} className="text-xs text-muted-foreground font-medium py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {monthlySteps.map((day) => {
                  const isToday = isSameDay(day.date, new Date());
                  return (
                    <div
                      key={day.date.toISOString()}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg text-center ${
                        isToday ? "bg-primary/15 ring-1.5 ring-primary" : ""
                      }`}
                    >
                      <div className={`text-[11px] leading-tight ${getStepColor(day.steps)}`}>
                        {day.steps > 0 ? formatSteps(day.steps) : '–'}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {format(day.date, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week" className="mt-0 p-4">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">This Week</h2>
              <p className="text-sm text-muted-foreground">{formatSteps(totalWeekSteps)} steps</p>
            </div>
            <div className="space-y-2">
              {weeklySteps.map((day, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{day.date}</span>
                    <span className={`text-sm font-bold ${getStepColor(day.steps)}`}>
                      {day.steps.toLocaleString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Day View */}
        <TabsContent value="day" className="mt-0 p-4">
          <Card className="p-6 text-center">
            <h2 className="text-lg font-bold text-foreground mb-2">Today</h2>
            <p className="text-4xl font-bold text-primary">
              {weeklySteps[weeklySteps.length - 1]?.steps.toLocaleString() || 0}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">steps</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
