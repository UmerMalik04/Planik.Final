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
      // For web/browser, we'll simulate biometric availability for demo purposes
      return { 
        isAvailable: true, 
        biometryType: 'fingerprint',
        reason: 'Demo mode - biometrics simulated for web'
      };
    }

    try {
      const deviceInfo = await Device.getInfo();
      
      // For mobile devices, assume biometric is available
      if (deviceInfo.platform === 'ios' || deviceInfo.platform === 'android') {
        return {
          isAvailable: true,
          biometryType: deviceInfo.platform === 'ios' ? 'face' : 'fingerprint'
        };
      }
      
      return { 
        isAvailable: true, // Changed to true for demo
        biometryType: 'fingerprint',
        reason: 'Demo mode available' 
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return { 
        isAvailable: true, // Changed to true for demo
        biometryType: 'fingerprint',
        reason: 'Demo mode available' 
      };
    }
  }

  static async authenticate(reason: string = 'Please authenticate to continue'): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // For web, show a confirmation dialog as demo
      return confirm(`🔐 Biometric Authentication\n\n${reason}\n\nSimulated biometric prompt - Click OK to authenticate.`);
    }

    try {
      // In a real implementation, you would use a biometric plugin here
      console.log('Biometric authentication requested:', reason);
      
      // Simulate authentication delay and success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      alert('✅ Biometric authentication successful!');
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      alert('❌ Biometric authentication failed. Please try again.');
      return false;
    }
  }

  static async promptForBiometricSetup(): Promise<boolean> {
    const result = await this.isAvailable();
    
    if (!result.isAvailable) {
      alert(result.reason || 'Biometric authentication is not available');
      return false;
    }

    const userChoice = confirm(`🔐 Enable ${result.biometryType === 'face' ? 'Face ID' : 'Fingerprint'} Authentication?\n\nThis will allow you to login quickly using your ${result.biometryType === 'face' ? 'face' : 'fingerprint'}.`);
    
    if (userChoice) {
      // Test the biometric authentication
      const authSuccess = await this.authenticate('Testing biometric setup...');
      return authSuccess;
    }
    
    return false;
  }
}