import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Capacitor } from '@capacitor/core';
import {
  BarcodeScanner as MLKitBarcodeScanner,
  BarcodeFormat,
  LensFacing,
} from '@capacitor-mlkit/barcode-scanning';
import { Button } from '@/components/ui/button';
import { X, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
  /** Optional escape hatch so a failed camera never dead-ends the user. */
  onManualEntry?: () => void;
}

const NATIVE = Capacitor.isNativePlatform();

/** Which camera backend actually ended up running. */
type Backend = 'mlkit' | 'web';

/**
 * Barcode scanner with a runtime-detected fallback chain.
 *
 * 1. ML Kit native preview (Capacitor plugin) — best on device: it renders a
 *    real AVFoundation / CameraX preview *behind* the webview. We only take
 *    this path if the plugin is genuinely compiled into the installed binary,
 *    which we probe at runtime — a published web update can add JS but never
 *    native code, so an older store binary may not have it.
 * 2. In-webview camera via html5-qrcode / getUserMedia — works once the page
 *    has camera permission, and is the only option on the web.
 * 3. Manual barcode entry — surfaced from the error state.
 */
export function BarcodeScanner({ onScanSuccess, onClose, isOpen, onManualEntry }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const nativeActiveRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [backend, setBackend] = useState<Backend | null>(null);

  /** Make the webview see-through so the native camera preview is visible. */
  const setTransparent = (on: boolean) => {
    document.documentElement.classList.toggle('native-scanner-active', on);
    document.body.classList.toggle('native-scanner-active', on);
  };

  const stopScanner = useCallback(async () => {
    if (nativeActiveRef.current) {
      nativeActiveRef.current = false;
      try {
        await MLKitBarcodeScanner.removeAllListeners();
        await MLKitBarcodeScanner.stopScan();
      } catch {
        /* swallow cleanup errors */
      }
      setTransparent(false);
    }

    const scanner = scannerRef.current;
    if (scanner) {
      try {
        const state = scanner.getState();
        if (
          state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED
        ) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch {
        /* swallow cleanup errors */
      }
      scannerRef.current = null;
    }
    setBackend(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    /**
     * True only when the ML Kit plugin is really present in this binary.
     * `isPluginAvailable` catches the "published JS, old native binary" case;
     * `isSupported()` catches devices where the scanner can't run.
     */
    const mlKitUsable = async () => {
      if (!NATIVE || !Capacitor.isPluginAvailable('BarcodeScanner')) return false;
      try {
        const { supported } = await MLKitBarcodeScanner.isSupported();
        return !!supported;
      } catch {
        return false;
      }
    };

    const startNative = async () => {
      // Native OS permission prompt must happen before the preview starts.
      const status = await MLKitBarcodeScanner.checkPermissions();
      if (status.camera !== 'granted' && status.camera !== 'limited') {
        const requested = await MLKitBarcodeScanner.requestPermissions();
        if (requested.camera !== 'granted' && requested.camera !== 'limited') {
          throw new Error('Camera permission denied. Please enable camera access in Settings.');
        }
      }

      await MLKitBarcodeScanner.addListener('barcodesScanned', async (event) => {
        const value = event?.barcodes?.[0]?.rawValue;
        if (!value) return;
        await stopScanner();
        onScanSuccess(value);
      });

      nativeActiveRef.current = true;
      setTransparent(true);

      await MLKitBarcodeScanner.startScan({
        formats: [
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE,
          BarcodeFormat.Code128,
          BarcodeFormat.Code39,
          BarcodeFormat.Itf,
          BarcodeFormat.Codabar,
        ],
        lensFacing: LensFacing.Back,
      });
    };

    const startWeb = async () => {
      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length === 0) throw new Error('No cameras found');

      const backCamera = cameras.find(
        (c) =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment'),
      );

      await scanner.start(
        backCamera?.id || cameras[0].id,
        { fps: 15, qrbox: { width: 280, height: 140 }, aspectRatio: 1.0 },
        (decodedText) => {
          stopScanner();
          onScanSuccess(decodedText);
        },
        () => {
          /* per-frame errors are noise */
        },
      );
    };

    const describe = (err: any) => {
      const message = String(err?.message || '');
      if (message.includes('Permission denied') || err?.name === 'NotAllowedError') {
        return 'Camera access is blocked. Allow camera access, or type the barcode instead.';
      }
      if (message.includes('No cameras found') || err?.name === 'NotFoundError') {
        return 'No camera found on this device. Type the barcode instead.';
      }
      return message || 'Could not start the camera. Type the barcode instead.';
    };

    const start = async () => {
      setIsStarting(true);
      setError(null);

      // 1. Native ML Kit preview, only if the plugin really exists here.
      if (await mlKitUsable()) {
        try {
          await startNative();
          setIsStarting(false);
          setBackend('mlkit');
          return;
        } catch (err) {
          // Clean up the half-started native path, then fall through to web.
          nativeActiveRef.current = false;
          setTransparent(false);
          try {
            await MLKitBarcodeScanner.removeAllListeners();
            await MLKitBarcodeScanner.stopScan();
          } catch {
            /* ignore */
          }
          console.warn('[BarcodeScanner] native path unavailable, falling back to webview camera', err);
        }
      }

      // 2. In-webview camera.
      try {
        await startWeb();
        setIsStarting(false);
        setBackend('web');
      } catch (err) {
        setIsStarting(false);
        setBackend(null);
        setTransparent(false);
        setError(describe(err));
      }
    };

    const timeoutId = setTimeout(start, 50);
    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, [isOpen, onScanSuccess, stopScanner]);

  const handleClose = () => {
    stopScanner();
    setError(null);
    onClose();
  };

  const handleManual = () => {
    stopScanner();
    setError(null);
    onManualEntry?.();
  };

  if (!isOpen) return null;

  const isScanning = backend !== null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden ${
        backend === 'mlkit' && !error ? 'bg-transparent' : 'bg-black'
      }`}
    >
      {/* Web camera feed host. Kept mounted until we know ML Kit is driving the
          preview, because html5-qrcode needs the element to exist on start. */}
      {backend !== 'mlkit' && <div id="barcode-reader" className="absolute inset-0 w-full h-full" />}

      {/* Close button */}
      <div className="absolute top-0 right-0 z-30 pt-[calc(env(safe-area-inset-top)+12px)] pr-3">
        <button
          onClick={handleClose}
          aria-label="Close scanner"
          className="h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Loading state */}
      {isStarting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white text-sm font-medium">Opening camera…</p>
          </div>
        </div>
      )}

      {/* Error state — always offers the manual path so this never dead-ends. */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20 px-6">
          <div className="text-center max-w-sm w-full">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/15 flex items-center justify-center">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-white text-base font-semibold mb-1">Camera unavailable</p>
            <p className="text-white/60 text-sm mb-5">{error}</p>
            {onManualEntry && (
              <Button onClick={handleManual} className="w-full rounded-full mb-2 gap-2">
                <Keyboard className="h-4 w-4" />
                Type the barcode instead
              </Button>
            )}
            <Button onClick={handleClose} variant="outline" className="w-full rounded-full">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Corner-bracket viewfinder + hint. Only for the in-webview camera —
          the ML Kit preview draws its own frame, so ours would double it. */}
      {backend === 'web' && !error && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">

          <div className="relative w-72 h-44">
            {/* Top-left corner */}
            <div className="absolute -top-1.5 -left-1.5">
              <div className="w-16 h-1.5 bg-white rounded-full" />
              <div className="w-1.5 h-16 bg-white rounded-full absolute top-0 left-0" />
            </div>
            {/* Top-right corner */}
            <div className="absolute -top-1.5 -right-1.5">
              <div className="w-16 h-1.5 bg-white rounded-full" />
              <div className="w-1.5 h-16 bg-white rounded-full absolute top-0 right-0" />
            </div>
            {/* Bottom-left corner */}
            <div className="absolute -bottom-1.5 -left-1.5">
              <div className="w-16 h-1.5 bg-white rounded-full" />
              <div className="w-1.5 h-16 bg-white rounded-full absolute bottom-0 left-0" />
            </div>
            {/* Bottom-right corner */}
            <div className="absolute -bottom-1.5 -right-1.5">
              <div className="w-16 h-1.5 bg-white rounded-full" />
              <div className="w-1.5 h-16 bg-white rounded-full absolute bottom-0 right-0" />
            </div>
          </div>

          <p className="mt-8 text-white/90 text-sm font-medium text-center px-6">
            Align barcode within the frame
          </p>
        </div>
      )}

      {/* Native hint (the ML Kit preview draws the frame itself) */}
      {backend === 'mlkit' && !error && (
        <div className="absolute inset-x-0 bottom-24 z-10 pointer-events-none">
          <p className="text-white/90 text-sm font-medium text-center px-6">
            Align barcode within the frame
          </p>
        </div>
      )}

      {/* Bottom actions */}
      {isScanning && !error && (
        <div className="absolute bottom-0 left-0 right-0 z-30 pb-[max(env(safe-area-inset-bottom),16px)] flex flex-col items-center gap-3 pointer-events-auto">
          {onManualEntry && (
            <button
              onClick={handleManual}
              className="rounded-full bg-white/15 text-white text-sm font-medium px-6 py-2 backdrop-blur-sm"
            >
              Enter barcode manually
            </button>
          )}
          <button
            onClick={handleClose}
            className="rounded-full bg-white text-black text-sm font-semibold px-8 py-2.5"
          >
            Cancel
          </button>
        </div>
      )}

      <style>{`
        #barcode-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        #barcode-reader__scan_region {
          background: transparent !important;
          border: none !important;
        }
        #barcode-reader__dashboard_section_swaplink,
        #barcode-reader__dashboard_section_csr button,
        #barcode-reader img[alt="Info icon"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
