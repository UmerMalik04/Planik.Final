import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

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
      return result.steps;
    } catch (error) {
      console.error('Error getting steps today:', error);
      return 0;
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
}