import { WebPlugin } from '@capacitor/core';
import type { StepCounterPlugin } from './StepCounter';

export class StepCounterWeb extends WebPlugin implements StepCounterPlugin {
  async requestPermissions(): Promise<{ granted: boolean }> {
    console.log('Step counter not available on web');
    return { granted: false };
  }

  async getStepsToday(): Promise<{ steps: number }> {
    console.log('Step counter not available on web');
    return { steps: 0 };
  }

  async getStepsForDateRange(): Promise<{ steps: number }> {
    console.log('Step counter not available on web');
    return { steps: 0 };
  }
}
