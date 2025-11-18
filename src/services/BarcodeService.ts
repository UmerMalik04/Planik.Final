import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

export class BarcodeService {
  static async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
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
      const { camera } = await BarcodeScanner.requestPermissions();
      return camera === 'granted' || camera === 'limited';
    } catch {
      return false;
    }
  }

  static async scanBarcode(): Promise<string | null> {
    try {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Camera permission denied');
      }

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
