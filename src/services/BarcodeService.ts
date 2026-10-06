import {
  BarcodeScanner,
  GoogleBarcodeScannerModuleInstallState,
} from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

const SCAN_CANCELED_MESSAGE = 'scan canceled.';
const MODULE_INSTALL_TIMEOUT_MS = 60000;

export class BarcodeService {
  static async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false; // Only works on native platforms
    }

    try {
      const { supported } = await BarcodeScanner.isSupported();
      return supported;
    } catch {
      return false;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      return camera === 'granted' || camera === 'limited';
    } catch {
      return false;
    }
  }

  /**
   * On Android, scan() uses Google's code scanner, which Play Services
   * downloads on demand. Install it first if it isn't there yet.
   */
  static async ensureGoogleScannerModule(): Promise<void> {
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (available) return;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => finish(new Error('Downloading the barcode scanner took too long. Please try again.')), MODULE_INSTALL_TIMEOUT_MS);
      const listener = BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', (event) => {
        if (event.state === GoogleBarcodeScannerModuleInstallState.COMPLETED) {
          finish();
        } else if (
          event.state === GoogleBarcodeScannerModuleInstallState.FAILED ||
          event.state === GoogleBarcodeScannerModuleInstallState.CANCELED
        ) {
          finish(new Error('Could not download the barcode scanner. Check your connection and try again.'));
        }
      });

      function finish(error?: Error) {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        listener.then((handle) => handle.remove());
        if (error) reject(error);
        else resolve();
      }

      BarcodeScanner.installGoogleBarcodeScannerModule().catch((error) => finish(error));
    });
  }

  static async scanBarcode(): Promise<string | null> {
    try {
      // Only works on native platforms
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Camera scanning requires the native app. Please use manual entry or build the native app.');
      }

      if (Capacitor.getPlatform() === 'android') {
        // Google's code scanner needs no camera permission from the app
        await this.ensureGoogleScannerModule();
      } else {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Camera permission denied');
        }
      }

      const { barcodes } = await BarcodeScanner.scan();

      if (barcodes && barcodes.length > 0) {
        return barcodes[0].rawValue;
      }

      return null;
    } catch (error) {
      // Closing the scanner is not an error
      if (error instanceof Error && error.message === SCAN_CANCELED_MESSAGE) {
        return null;
      }
      console.error('Barcode scan error:', error);
      throw error;
    }
  }

  // Manual barcode input
  static async promptBarcodeInput(): Promise<string | null> {
    const barcode = prompt('Enter barcode number:');
    return barcode || null;
  }
}
