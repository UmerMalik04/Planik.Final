/**
 * CameraService — thin wrapper around @capacitor/camera.
 *
 * Centralises permission handling, error normalisation (e.g. silently
 * returning null when the user taps "Cancel" instead of bubbling an error),
 * and conversion from Capacitor's `dataUrl` result to a regular `File`
 * object that fits into the standard browser image pipeline (FileReader,
 * canvas resize, FormData uploads).
 *
 * On native: Capacitor talks to AVFoundation / CameraX.
 * On web:    Capacitor.isNativePlatform() is false and we bail out — the
 *            UI falls back to a plain `<input type="file" accept="image/*">`.
 */
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export class CameraService {
  /**
   * Check if camera is available (native platform with camera hardware)
   */
  static async isAvailable(): Promise<boolean> {
    return Capacitor.isNativePlatform();
  }

  /**
   * Request camera permissions on iOS/Android
   */
  static async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const permissions = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      });
      
      return permissions.camera === 'granted' || permissions.camera === 'limited';
    } catch (error) {
      console.error('Failed to request camera permissions:', error);
      return false;
    }
  }

  /**
   * Check current camera permissions
   */
  static async checkPermissions(): Promise<{ camera: string; photos: string }> {
    if (!Capacitor.isNativePlatform()) {
      return { camera: 'denied', photos: 'denied' };
    }

    try {
      const permissions = await Camera.checkPermissions();
      return {
        camera: permissions.camera || 'prompt',
        photos: permissions.photos || 'prompt'
      };
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return { camera: 'denied', photos: 'denied' };
    }
  }

  /**
   * Take a photo using the device camera
   */
  static async takePhoto(): Promise<File | null> {
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied. Please allow camera access in your device settings.');
      }

      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        correctOrientation: true,
        width: 1024,
        height: 1024,
      });

      if (!photo.dataUrl) {
        throw new Error('No photo was captured');
      }

      // Convert data URL to File
      const file = await this.dataUrlToFile(photo.dataUrl, 'photo.jpg');
      return file;
    } catch (error: any) {
      console.error('Camera capture error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('User cancelled')) {
        return null; // User cancelled, not an error
      }
      
      throw error;
    }
  }

  /**
   * Pick an image from the photo library
   */
  static async pickFromGallery(): Promise<File | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Photo library permission denied. Please allow access in your device settings.');
      }

      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true,
        width: 1024,
        height: 1024,
      });

      if (!photo.dataUrl) {
        throw new Error('No photo was selected');
      }

      const file = await this.dataUrlToFile(photo.dataUrl, 'photo.jpg');
      return file;
    } catch (error: any) {
      console.error('Gallery pick error:', error);
      
      if (error.message?.includes('User cancelled')) {
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Get photo with prompt for camera or gallery selection
   */
  static async getPhoto(): Promise<File | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera/Photo permission denied. Please allow access in your device settings.');
      }

      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Let user choose camera or gallery
        correctOrientation: true,
        width: 1024,
        height: 1024,
        promptLabelHeader: 'Select Image Source',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'From Gallery',
        promptLabelPicture: 'Take Photo',
      });

      if (!photo.dataUrl) {
        throw new Error('No photo was captured');
      }

      const file = await this.dataUrlToFile(photo.dataUrl, 'photo.jpg');
      return file;
    } catch (error: any) {
      console.error('Photo capture error:', error);
      
      if (error.message?.includes('User cancelled')) {
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Convert a data URL to a File object
   */
  private static async dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  }
}
