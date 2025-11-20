import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { supabase } from '@/integrations/supabase/client';

export interface HealthData {
  steps: number;
  calories?: number;
  distance?: number;
  heartRate?: number;
}

export interface PermissionStatus {
  granted: boolean;
  reason?: string;
}

import StepCounter from '@/plugins/StepCounter';

export class HealthService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const result = await StepCounter.requestPermissions();
      return result.granted;
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      return false;
    }
  }

  static async getStepsToday(): Promise<number> {
    try {
      const result = await StepCounter.getStepsToday();
      
      // Save to database
      const today = new Date().toISOString().split('T')[0];
      await this.saveStepsToDatabase(today, result.steps);
      
      return result.steps;
    } catch (error) {
      console.error('Error getting steps today:', error);
      // Fallback to database
      const today = new Date().toISOString().split('T')[0];
      return await this.getStepsFromDatabase(today);
    }
  }

  static async getStepsForDateRange(startDate: Date, endDate: Date): Promise<number> {
    try {
      const result = await StepCounter.getStepsForDateRange({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      return result.steps;
    } catch (error) {
      console.error('Error getting steps for date range:', error);
      // Fallback to database for single day
      if (startDate.toDateString() === endDate.toDateString()) {
        const date = startDate.toISOString().split('T')[0];
        return await this.getStepsFromDatabase(date);
      }
      return 0;
    }
  }

  static async saveStepsToDatabase(date: string, steps: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('step_history')
        .upsert({
          user_id: user.id,
          date,
          steps,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        });

      if (error) console.error('Error saving steps:', error);
    } catch (error) {
      console.error('Error saving steps to database:', error);
    }
  }

  static async getStepsFromDatabase(date: string): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from('step_history')
        .select('steps')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();

      if (error) {
        console.error('Error fetching steps:', error);
        return 0;
      }

      return data?.steps || 0;
    } catch (error) {
      console.error('Error fetching steps from database:', error);
      return 0;
    }
  }

  static async getWeeklySteps(): Promise<{ date: string; steps: number }[]> {
    const weeklyData: { date: string; steps: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const steps = await this.getStepsForDateRange(startOfDay, endOfDay);
      
      weeklyData.push({
        date: startOfDay.toLocaleDateString('en-US', { weekday: 'short' }),
        steps,
      });
    }
    
    return weeklyData;
  }

  static async getStepStats(): Promise<{
    longestStreak: number;
    bestMonth: { month: string; steps: number };
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { longestStreak: 0, bestMonth: { month: '', steps: 0 } };

      const { data: allSteps } = await supabase
        .from('step_history')
        .select('date, steps')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (!allSteps || allSteps.length === 0) {
        return { longestStreak: 0, bestMonth: { month: '', steps: 0 } };
      }

      // Calculate longest streak
      let longestStreak = 0;
      let currentStreak = 0;
      let previousDate: Date | null = null;

      for (const record of allSteps) {
        const recordDate = new Date(record.date);
        
        if (record.steps > 0) {
          if (previousDate) {
            const dayDiff = Math.floor((recordDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayDiff === 1) {
              currentStreak++;
            } else {
              currentStreak = 1;
            }
          } else {
            currentStreak = 1;
          }
          
          longestStreak = Math.max(longestStreak, currentStreak);
          previousDate = recordDate;
        } else {
          currentStreak = 0;
          previousDate = null;
        }
      }

      // Calculate best month
      const monthlyTotals: { [key: string]: number } = {};
      
      for (const record of allSteps) {
        const monthKey = record.date.substring(0, 7); // YYYY-MM
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + record.steps;
      }

      let bestMonth = { month: '', steps: 0 };
      for (const [month, steps] of Object.entries(monthlyTotals)) {
        if (steps > bestMonth.steps) {
          const [year, monthNum] = month.split('-');
          const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { 
            month: 'short', 
            year: '2-digit' 
          });
          bestMonth = { month: monthName, steps };
        }
      }

      return { longestStreak, bestMonth };
    } catch (error) {
      console.error('Error calculating step stats:', error);
      return { longestStreak: 0, bestMonth: { month: '', steps: 0 } };
    }
  }
}