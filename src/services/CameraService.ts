import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
  source?: CameraSource;
}

export class CameraService {
  static async isAvailable(): Promise<boolean> {
    return Capacitor.isNativePlatform();
  }

  static async takePicture(options: CameraOptions = {}): Promise<Photo | null> {
    try {
      if (!Capacitor.isNativePlatform()) {
        // For web, fall back to file input
        return await this.webFileInput();
      }

      const image = await Camera.getPhoto({
        quality: options.quality || 90,
        allowEditing: options.allowEditing || true,
        resultType: options.resultType || CameraResultType.Uri,
        source: options.source || CameraSource.Prompt,
      });

      return image;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  }

  static async pickFromGallery(): Promise<Photo | null> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return await this.webFileInput();
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      return image;
    } catch (error) {
      console.error('Error picking from gallery:', error);
      return null;
    }
  }

  private static async webFileInput(): Promise<Photo | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
          resolve({
            webPath: e.target?.result as string,
            format: file.type.split('/')[1] as any,
            saved: false
          });
          };
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };
      
      input.click();
    });
  }

  static async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true; // Web doesn't need explicit permissions
    }

    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }
}