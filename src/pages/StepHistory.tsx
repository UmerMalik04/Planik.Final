import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthService } from "@/services/HealthService";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from "date-fns";

interface DaySteps {
  date: Date;
  steps: number;
}

export default function StepHistory() {
  const navigate = useNavigate();
  const [dailyGoal, setDailyGoal] = useState(9000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlySteps, setMonthlySteps] = useState<DaySteps[]>([]);
  const [weeklySteps, setWeeklySteps] = useState<{ date: string; steps: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStepData();
  }, [currentMonth]);

  const loadStepData = async () => {
    setLoading(true);
    
    // Load weekly data
    const weekly = await HealthService.getWeeklySteps();
    setWeeklySteps(weekly);

    // Load monthly data
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    const monthData = await Promise.all(
      days.map(async (date) => {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        const steps = await HealthService.getStepsForDateRange(startOfDay, endOfDay);
        return { date, steps };
      })
    );
    
    setMonthlySteps(monthData);
    setLoading(false);
  };

  const getStepColor = (steps: number) => {
    if (steps >= 14000) return "text-success"; // Green
    if (steps >= 10000) return "text-primary"; // Primary blue
    if (steps >= 5000) return "text-accent"; // Accent
    if (steps >= 2000) return "text-primary/70"; // Light primary
    return "text-muted-foreground";
  };

  const totalMonthSteps = monthlySteps.reduce((sum, day) => sum + day.steps, 0);
  const totalWeekSteps = weeklySteps.reduce((sum, day) => sum + day.steps, 0);
  
  const longestStreak = 7; // Calculate from data
  const bestMonth = "Aug 24 · 255k steps"; // Calculate from data

  const formatSteps = (steps: number) => {
    if (steps >= 1000) return `${Math.floor(steps / 1000)}k`;
    return steps.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold">Step history</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <CalendarIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-primary-foreground/90">Daily goal:</span>
            <div className="flex items-center gap-2">
              {isEditingGoal ? (
                <input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="bg-primary-foreground/20 text-primary-foreground px-3 py-1 rounded w-32 text-right"
                  onBlur={() => setIsEditingGoal(false)}
                  autoFocus
                />
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsEditingGoal(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <span className="text-primary-foreground font-medium">
                    {dailyGoal.toLocaleString()} steps
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-primary-foreground/90">Longest streak:</span>
            <span className="text-primary-foreground font-medium">{longestStreak} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-primary-foreground/90">Best month:</span>
            <span className="text-primary-foreground font-medium">{bestMonth}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="month" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-primary rounded-none border-t border-primary-foreground/20">
          <TabsTrigger value="day" className="data-[state=active]:bg-primary/80 text-primary-foreground">
            Day
          </TabsTrigger>
          <TabsTrigger value="week" className="data-[state=active]:bg-primary/80 text-primary-foreground">
            Week
          </TabsTrigger>
          <TabsTrigger value="month" className="data-[state=active]:bg-primary/80 text-primary-foreground">
            Month
          </TabsTrigger>
        </TabsList>

        {/* Month View */}
        <TabsContent value="month" className="mt-0 bg-background">
          <div className="p-4 space-y-6">
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
                <h2 className="text-2xl font-bold text-foreground">
                  {format(currentMonth, "MMM yyyy")}
                </h2>
                <p className="text-muted-foreground">
                  {formatSteps(totalMonthSteps)} steps
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
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1 text-center">
                {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
                  <div key={day} className="text-xs text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {/* Days with step counts */}
                {monthlySteps.map((day) => {
                  const isToday = isSameDay(day.date, new Date());
                  return (
                  <div
                      key={day.date.toISOString()}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg ${
                        isToday ? "bg-primary/20 ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className={`text-sm font-medium ${getStepColor(day.steps)}`}>
                        {formatSteps(day.steps)}
                      </div>
                      <div className="text-xs text-muted-foreground">
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
        <TabsContent value="week" className="mt-0 bg-background p-4">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">This Week</h2>
              <p className="text-muted-foreground">{formatSteps(totalWeekSteps)} steps</p>
            </div>
            <div className="space-y-2">
              {weeklySteps.map((day, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">{day.date}</span>
                    <span className={`font-bold ${getStepColor(day.steps)}`}>
                      {day.steps.toLocaleString()} steps
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Day View */}
        <TabsContent value="day" className="mt-0 bg-background p-4">
          <Card className="p-6 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Today</h2>
            <p className="text-4xl font-bold text-primary">
              {weeklySteps[weeklySteps.length - 1]?.steps.toLocaleString() || 0}
            </p>
            <p className="text-muted-foreground mt-2">steps</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
