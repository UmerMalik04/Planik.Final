/**
 * Web fallback for the StepCounter Capacitor plugin.
 *
 * Browsers have no general-purpose API for reading the device's step count
 * (the Sensors API only exposes raw accelerometer events, which we'd have to
 * integrate over time — error-prone and battery-heavy). So on web we return
 * zeros and rely on previously-synced data from Supabase via HealthService.
 */
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

  async getStepsForMonth(): Promise<{ days: { date: string; steps: number }[] }> {
    console.log('Step counter not available on web');
    return { days: [] };
  }
}

