import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export class BarcodeService {
  static async isAvailable(): Promise<boolean> {
    // On web, we can use the Camera API to take a photo and scan it
    if (!Capacitor.isNativePlatform()) {
      return true; // Camera API works on web
    }
    
    try {
      const { supported } = await BarcodeScanner.isSupported();
      return supported;
    } catch {
      return false;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      // On native platforms, request barcode scanner permissions
      if (Capacitor.isNativePlatform()) {
        const { camera } = await BarcodeScanner.requestPermissions();
        return camera === 'granted' || camera === 'limited';
      }
      
      // On web, Camera plugin will handle permission requests
      return true;
    } catch {
      return false;
    }
  }

  static async scanBarcode(): Promise<string | null> {
    try {
      // On web browsers, camera scanning is not available
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Camera scanning requires the native app. Please use manual entry or build the native app.');
      }

      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Camera permission denied');
      }

      // Use the native barcode scanner
      const { barcodes } = await BarcodeScanner.scan();
      
      if (barcodes && barcodes.length > 0) {
        return barcodes[0].rawValue;
      }
      
      return null;
    } catch (error) {
      console.error('Barcode scan error:', error);
      throw error;
    }
  }

  // Fallback web-based barcode input
  static async promptBarcodeInput(): Promise<string | null> {
    const barcode = prompt('Enter barcode number:');
    return barcode || null;
  }
}
