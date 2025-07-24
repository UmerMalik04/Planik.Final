import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export interface BiometricResult {
  isAvailable: boolean;
  biometryType?: 'fingerprint' | 'face' | 'iris' | 'voice';
  reason?: string;
}

export class BiometricService {
  static async isAvailable(): Promise<BiometricResult> {
    if (!Capacitor.isNativePlatform()) {
      return { 
        isAvailable: false, 
        reason: 'Biometric authentication is only available on mobile devices' 
      };
    }

    try {
      const deviceInfo = await Device.getInfo();
      
      // For now, simulate biometric availability based on platform
      if (deviceInfo.platform === 'ios' || deviceInfo.platform === 'android') {
        return {
          isAvailable: true,
          biometryType: deviceInfo.platform === 'ios' ? 'face' : 'fingerprint'
        };
      }
      
      return { 
        isAvailable: false, 
        reason: 'Biometric authentication not supported on this platform' 
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return { 
        isAvailable: false, 
        reason: 'Error checking biometric support' 
      };
    }
  }

  static async authenticate(reason: string = 'Please authenticate to continue'): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // For web, show a confirmation dialog
      return confirm(`${reason}\n\nBiometric authentication is not available on web. Click OK to continue.`);
    }

    try {
      // In a real implementation, you would use a biometric plugin here
      // For now, simulate successful authentication
      console.log('Biometric authentication requested:', reason);
      
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  static async promptForBiometricSetup(): Promise<boolean> {
    const result = await this.isAvailable();
    
    if (!result.isAvailable) {
      alert(result.reason || 'Biometric authentication is not available');
      return false;
    }

    return confirm(`Enable ${result.biometryType} authentication for quick login?`);
  }
}