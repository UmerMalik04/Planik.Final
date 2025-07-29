import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

// Health plugin interface
interface HealthPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  requestAuthorization(options: { read: string[]; write?: string[] }): Promise<{ granted: boolean }>;
  queryHKitSampleType(options: {
    sampleName: string;
    startDate: Date;
    endDate: Date;
    limit?: number;
  }): Promise<{ samples?: Array<{ quantity: number; startDate: string; endDate: string }> }>;
}

// Declare Capacitor plugin
declare global {
  interface Window {
    Capacitor?: {
      Plugins?: {
        Health?: HealthPlugin;
      };
    };
  }
}

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
  private static healthPlugin: HealthPlugin | null = null;

  private static getHealthPlugin(): HealthPlugin | null {
    if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.Health) {
      return window.Capacitor.Plugins.Health;
    }
    return null;
  }

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
      
      const healthPlugin = this.getHealthPlugin();
      
      if (healthPlugin) {
        try {
          // Check if health data is available
          const available = await healthPlugin.isAvailable();
          
          if (available.available) {
            // Request authorization for step data
            const result = await healthPlugin.requestAuthorization({
              read: ['steps']
            });
            
            if (result.granted) {
              console.log('Health permissions granted');
              return { granted: true };
            } else {
              return {
                granted: false,
                reason: deviceInfo.platform === 'ios' 
                  ? 'Please enable HealthKit access in Settings > Privacy & Security > Health > Data Access & Devices'
                  : 'Please enable Google Fit access and install Google Fit app',
                shouldShowSettings: true
              };
            }
          } else {
            return {
              granted: false,
              reason: 'Health tracking not available on this device',
              shouldShowSettings: false
            };
          }
        } catch (error) {
          console.error('Health plugin error:', error);
          return {
            granted: false,
            reason: 'Health plugin error: ' + (error as Error).message,
            shouldShowSettings: false
          };
        }
      } else {
        // Health plugin not available, provide guidance
        return {
          granted: false,
          reason: deviceInfo.platform === 'ios' 
            ? 'HealthKit integration requires native build. Please enable in Settings > Privacy & Security > Health'
            : 'Google Fit integration requires native build. Please install Google Fit app',
          shouldShowSettings: true
        };
      }
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
      const healthPlugin = this.getHealthPlugin();
      
      if (healthPlugin) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date();
        
        try {
          const result = await healthPlugin.queryHKitSampleType({
            sampleName: 'steps',
            startDate: startOfDay,
            endDate: endOfDay,
            limit: 1000
          });
          
          // Sum up all step data for today
          const totalSteps = result.samples?.reduce((sum, entry) => sum + (entry.quantity || 0), 0) || 0;
          console.log('Native step count:', totalSteps);
          return Math.floor(totalSteps);
        } catch (error) {
          console.error('Error getting native step count:', error);
          return this.getMockSteps();
        }
      } else {
        // Fallback to mock data
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
    // Stop any existing interval
    this.stopStepTracking();
    
    // Update steps every minute
    this.stepInterval = setInterval(() => {
      // For mock data, randomly add steps
      if (!Capacitor.isNativePlatform() || !this.getHealthPlugin()) {
        if (Math.random() > 0.7) { // 30% chance of adding steps
          this.mockSteps += Math.floor(Math.random() * 3) + 1;
        }
      }
      // For native platforms, step count will be fetched in the component
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
      const healthPlugin = this.getHealthPlugin();
      
      if (healthPlugin) {
        const result = await healthPlugin.isAvailable();
        return result.available;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }
  
  static openHealthSettings(): void {
    if (Capacitor.isNativePlatform()) {
      // Guide user to open settings
      console.log('Please open your device settings and enable health data access for this app');
      
      // You could implement deep linking to settings here
      // For iOS: App-Prefs:Privacy&path=HEALTH
      // For Android: Intent to open settings
    }
  }
}