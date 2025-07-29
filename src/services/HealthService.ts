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
  shouldShowSettings?: boolean;
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
      console.log('Requesting health permissions for:', deviceInfo.platform);
      
      if (deviceInfo.platform === 'ios') {
        // For iOS, inform user about HealthKit setup needed
        return { 
          granted: false, 
          reason: 'Please enable HealthKit access in Settings > Privacy & Security > Health > Data Access & Devices',
          shouldShowSettings: true
        };
      } else if (deviceInfo.platform === 'android') {
        // For Android, we need Google Fit permissions
        return { 
          granted: false, 
          reason: 'Please install Google Fit app and enable step tracking. Then allow this app to access Google Fit data in your device settings.',
          shouldShowSettings: true
        };
      }
      
      return { 
        granted: false, 
        reason: 'Health tracking not supported on this platform' 
      };
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      return { 
        granted: false, 
        reason: 'Failed to request health permissions',
        shouldShowSettings: false
      };
    }
  }

  static async getStepCount(): Promise<number> {
    if (!Capacitor.isNativePlatform()) {
      // Return mock step data for web
      return this.getMockSteps();
    }

    try {
      const deviceInfo = await Device.getInfo();
      
      if (deviceInfo.platform === 'ios') {
        // For iOS, use mock data for now (real implementation would require HealthKit plugin)
        return this.getMockSteps();
      } else {
        // For Android and other platforms, use mock data for now
        return this.getMockSteps();
      }
    } catch (error) {
      console.error('Error getting step count:', error);
      return this.getMockSteps();
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
      
      if (deviceInfo.platform === 'ios') {
        // iOS devices generally support HealthKit
        return true;
      } else if (deviceInfo.platform === 'android') {
        // Android support would require Google Fit integration
        return true; // Return true but actual implementation needed
      }
      
      return false;
    } catch {
      return false;
    }
  }
  
  static openHealthSettings(): void {
    if (Capacitor.isNativePlatform()) {
      // Guide user to open settings
      console.log('Please open your device settings and enable health data access for this app');
    }
  }
}