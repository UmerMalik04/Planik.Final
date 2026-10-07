# Publish-ready barcode scanner fix + version bump

## Goal
Make the barcode scanner UI/function fix go live for **web**, **iOS**, and **Android** when you publish from Lovable, and bump the app version so the App Store / Google Play submission reflects the change.

## Current state
- `capacitor.config.ts` already loads the live site (`https://planik.org.uk`), so publishing updates the web app inside installed native apps.
- `BarcodeScanner.tsx` already uses the native ML Kit plugin on device and `html5-qrcode` on web.
- Android project exists and includes the ML Kit dependency, but `android/app/build.gradle` is missing the Capacitor auto-registration line that wires plugins into the binary.
- iOS native project (`ios/App/App.xcodeproj`) is not present in the repo, so no iOS binary can currently be built.
- Current version is `1.0.0` / `versionCode 1` / `versionName "1.0"` everywhere.

## What will change
1. **Version bump** to `1.1.0` (Android `versionCode 2`).
2. **Android** — add the Capacitor plugin auto-registration hook so `@capacitor-mlkit/barcode-scanning` is available in the binary.
3. **iOS** — add the iOS platform (`npx cap add ios`) and sync plugins so the ML Kit barcode pod is included.
4. **Web/native UI** — verify the transparent-webview CSS for the native scanner and the bracket-only-on-web logic are present.
5. **Publish** — ship the web update from Lovable; provide the exact native rebuild steps for iOS/Android.

## Steps

```text
1. Bump versions
   - package.json: 1.0.0 -> 1.1.0
   - android/app/build.gradle: versionCode 1 -> 2, versionName "1.0" -> "1.1.0"
   - ios/App/App.xcodeproj/project.pbxproj: MARKETING_VERSION 1.1.0, CURRENT_PROJECT_VERSION 2

2. Fix Android plugin wiring
   - Add `apply from: 'capacitor.build.gradle'` to android/app/build.gradle
   - Run `npx cap sync android`

3. Add iOS platform
   - Run `npx cap add ios` (creates ios/App/App.xcodeproj)
   - Run `npx cap sync ios`
   - Confirm Info.plist already has NSCameraUsageDescription

4. Verify scanner UI
   - Confirm .native-scanner-active CSS in src/index.css
   - Confirm BarcodeScanner.tsx only draws corner brackets when !NATIVE

5. Publish & rebuild
   - Click Publish in Lovable (updates web + in-app web content)
   - Build new iOS/Android binaries from the synced projects
   - Submit version 1.1.0 to App Store Connect / Google Play
```

## Verification
- Web preview opens scanner and shows camera feed via `html5-qrcode`.
- Android build succeeds and `MainActivity` auto-registers the ML Kit plugin.
- iOS project opens in Xcode with the barcode scanning plugin present in Pods.
- Type-check passes (`bun run build`).

## Notes
- If the installed native binary already includes the ML Kit plugin, simply publishing from Lovable will fix the scanner for existing users without an app-store update.
- If the old binary does not include the plugin (or still points to a deleted sandbox), a new binary is required — this plan covers that.
- Confirm whether you want version `1.1.0` or a different number before approval.
