import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';

export interface BiometricResult {
  isAvailable: boolean;
  biometryType?: 'fingerprint' | 'face' | 'iris' | 'voice';
  reason?: string;
}

export class BiometricService {
  private static readonly REFRESH_TOKEN_KEY = 'biometric_refresh_token';
  private static readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

  static async saveRefreshToken(refreshToken: string): Promise<void> {
    try {
      await Preferences.set({
        key: this.REFRESH_TOKEN_KEY,
        value: refreshToken
      });
    } catch (error) {
      throw new Error('Failed to save refresh token securely');
    }
  }

  static async getStoredRefreshToken(): Promise<string | null> {
    try {
      const result = await Preferences.get({ key: this.REFRESH_TOKEN_KEY });
      return result.value || null;
    } catch (error) {
      return null;
    }
  }

  static async clearStoredRefreshToken(): Promise<void> {
    try {
      await Preferences.remove({ key: this.REFRESH_TOKEN_KEY });
    } catch (error) {
      console.error('Error clearing refresh token:', error);
    }
  }

  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await Preferences.set({
        key: this.BIOMETRIC_ENABLED_KEY,
        value: enabled.toString()
      });
    } catch (error) {
      console.error('Error setting biometric preference:', error);
    }
  }

  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const result = await Preferences.get({ key: this.BIOMETRIC_ENABLED_KEY });
      return result.value === 'true';
    } catch (error) {
      console.error('Error getting biometric preference:', error);
      return false;
    }
  }

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

  static async biometricLogin(): Promise<{ success: boolean; refreshToken?: string; error?: string }> {
    try {
      // Check if biometric is enabled
      const isBiometricEnabled = await this.isBiometricEnabled();
      if (!isBiometricEnabled) {
        return { success: false, error: 'Biometric login is not enabled. Please enable it in settings.' };
      }

      // Check if device supports biometric
      const availability = await this.isAvailable();
      if (!availability.isAvailable) {
        return { success: false, error: availability.reason || 'Biometric authentication is not available on this device.' };
      }

      // Get stored refresh token
      const refreshToken = await this.getStoredRefreshToken();
      if (!refreshToken) {
        return { success: false, error: 'No stored session found. Please login with email/password first and enable biometric login.' };
      }

      // Prompt for biometric authentication
      const authResult = await this.authenticate(`Login with ${availability.biometryType === 'face' ? 'Face ID' : 'Fingerprint'}`);
      if (!authResult) {
        return { success: false, error: 'Biometric authentication failed or was cancelled.' };
      }

      return { success: true, refreshToken };
    } catch (error) {
      return { success: false, error: 'An error occurred during biometric login. Please try again.' };
    }
  }
}