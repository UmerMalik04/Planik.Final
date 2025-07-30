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

export class HealthService {
  private static mockSteps = 0;
  private static stepInterval: NodeJS.Timeout | null = null;

  static async requestPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      // For web, we can't access real health data
      return { 
        granted: true, 
        reason: 'Using mock data on web platform' 
      };
    }

    try {
      const deviceInfo = await Device.getInfo();
      
      // Simulate permission request
      console.log('Requesting health permissions for:', deviceInfo.platform);
      
      // In a real app, you would request actual permissions here
      return { granted: true };
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      return { 
        granted: false, 
        reason: 'Failed to request health permissions' 
      };
    }
  }

  static async getStepCount(): Promise<number> {
    if (!Capacitor.isNativePlatform()) {
      // Return mock step data for web
      return this.getMockSteps();
    }

    try {
      // In a real implementation, you would use a health plugin here
      // For now, return mock data
      return this.getMockSteps();
    } catch (error) {
      console.error('Error getting step count:', error);
      return 0;
    }
  }

  static async getHealthData(): Promise<HealthData> {
    const steps = await this.getStepCount();
    
    return {
      steps,
      calories: Math.round(steps * 0.04), // Rough estimate: 0.04 calories per step
      distance: Math.round(steps * 0.0008 * 100) / 100, // Rough estimate: 0.8m per step in km
    };
  }

  private static getMockSteps(): number {
    // Simulate realistic step count that increases throughout the day
    const now = new Date();
    const hoursInDay = now.getHours() + now.getMinutes() / 60;
    const baseSteps = Math.floor((hoursInDay / 24) * 8000); // Up to 8000 steps per day
    const randomVariation = Math.floor(Math.random() * 500); // Add some randomness
    
    this.mockSteps = baseSteps + randomVariation;
    return this.mockSteps;
  }

  static startStepTracking(): void {
    // Simulate step tracking with periodic updates
    this.stopStepTracking(); // Clear existing interval
    
    this.stepInterval = setInterval(() => {
      // Randomly add 1-3 steps every minute (simulating walking)
      if (Math.random() > 0.7) { // 30% chance of adding steps
        this.mockSteps += Math.floor(Math.random() * 3) + 1;
      }
    }, 60000); // Update every minute
  }

  static stopStepTracking(): void {
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
  }

  static async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true; // Mock data is always available
    }

    try {
      const deviceInfo = await Device.getInfo();
      return deviceInfo.platform === 'ios' || deviceInfo.platform === 'android';
    } catch {
      return false;
    }
  }
}