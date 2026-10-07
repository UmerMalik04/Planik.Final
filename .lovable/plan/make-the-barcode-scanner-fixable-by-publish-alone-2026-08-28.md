# Make the barcode scanner fixable by Publish alone

## Short answer
Yes for the JavaScript side — your app loads the live site (`planik.org.uk`), so anything in the web code updates the installed iOS/Android apps the moment you publish. The one thing Publish can never change is native code already compiled into the store binary. Today the scanner takes the native ML Kit camera path on device; if the installed binary doesn't contain that plugin, it fails and you see a black screen no matter how many times you publish.

So the fix is to stop depending on the native plugin being present, and make the scanner detect at runtime what it can actually use.

## What will change (all web code — ships on Publish)
1. **Runtime capability check.** Before choosing a camera backend, ask the ML Kit plugin whether it's actually available in this binary (`Capacitor.isPluginAvailable` + an `isSupported()` probe wrapped in try/catch).
2. **Fallback chain instead of a hard native/web split:**
   - ML Kit native preview if the plugin really exists (best case, current behaviour).
   - Otherwise in-webview camera via `html5-qrcode` / `getUserMedia`, which does work in WKWebView once the page has camera permission.
   - Otherwise show a clear "Type the barcode instead" path rather than a black screen.
3. **Better manual entry.** Replace the browser `prompt()` used for manual barcode entry with a proper in-app numeric input dialog, so the always-works path doesn't look broken.
4. **Honest error text.** If both camera paths fail, say why (camera blocked vs unsupported) and offer manual entry plus a Cancel that always closes.

## What Publish still cannot do
If the installed binary lacks the ML Kit plugin, the *native* full-screen preview stays unavailable until you rebuild once in Xcode / Android Studio. After that single rebuild, every future scanner change is Publish-only. The plan above ensures the scanner is usable right now without that rebuild.

## Technical notes
- Only `src/components/BarcodeScanner.tsx` and the manual-entry bits of `src/pages/DietTracker.tsx` change. No native project edits, no version bump needed.
- The `.native-scanner-active` transparency class in `src/index.css` is applied only when the ML Kit path is genuinely active, so the web fallback keeps its solid background.
- Corner brackets stay web/fallback-only, so there is still no double outline on the native path.

## Verification
- Web preview: scanner opens a live camera feed and decodes an EAN-13.
- Simulated missing plugin: scanner silently falls back to the in-webview camera instead of a black screen.
- Manual entry: typing a barcode runs the same `lookup-barcode` flow as a scan.
