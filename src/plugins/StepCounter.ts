import { registerPlugin } from '@capacitor/core';

export interface StepCounterPlugin {
  requestPermissions(): Promise<{ granted: boolean }>;
  getStepsToday(): Promise<{ steps: number }>;
  getStepsForDateRange(options: { 
    startDate: string; 
    endDate: string 
  }): Promise<{ steps: number }>;
}

const StepCounter = registerPlugin<StepCounterPlugin>('StepCounter', {
  web: () => import('./web').then(m => new m.StepCounterWeb()),
});

export default StepCounter;
