import { WebPlugin } from '@capacitor/core';
import type { StepCounterPlugin } from './StepCounter';

// Browsers have no step counter. Reads reject so callers fall back to the
// steps saved from the phone instead of treating "unavailable" as 0 steps.
export class StepCounterWeb extends WebPlugin implements StepCounterPlugin {
  async requestPermissions(): Promise<{ granted: boolean }> {
    return { granted: false };
  }

  async getStepsToday(): Promise<{ steps: number }> {
    throw this.unavailable('Step counter not available on web');
  }

  async getStepsForDateRange(): Promise<{ steps: number }> {
    throw this.unavailable('Step counter not available on web');
  }
}
