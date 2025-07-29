# Native Health Tracking Setup Guide

This guide walks you through setting up native step tracking with HealthKit (iOS) and Google Fit (Android).

## ✅ Current Implementation Status

The app now includes:
- Native step tracking service with proper fallbacks
- Permission handling for iOS HealthKit and Android Google Fit
- Automatic step count updates every minute
- Visual indicators for permission status
- Settings button to guide users when permissions are denied

## 🚀 Setup Instructions

### Step 1: Sync Capacitor Configuration

Run this command to sync the native platform configuration:

```bash
npx cap sync
```

### Step 2: iOS Setup (HealthKit)

1. **Open the iOS project in Xcode:**
   ```bash
   npx cap open ios
   ```

2. **Enable HealthKit Capability:**
   - In Xcode, select your project in the navigator
   - Go to "Signing & Capabilities" tab
   - Click "+ Capability" and add "HealthKit"

3. **Add Health Usage Description:**
   - Open `ios/App/App/Info.plist`
   - Add these entries:
   ```xml
   <key>NSHealthShareUsageDescription</key>
   <string>This app needs access to your step count data to track your daily activity.</string>
   <key>NSHealthUpdateUsageDescription</key>
   <string>This app needs to access your health data to provide personalized fitness tracking.</string>
   ```

4. **Install Health Plugin (if needed):**
   ```bash
   npm install @capacitor-community/health
   npx cap sync ios
   ```

5. **Build and Test:**
   ```bash
   npx cap run ios
   ```

### Step 3: Android Setup (Google Fit)

1. **Open the Android project in Android Studio:**
   ```bash
   npx cap open android
   ```

2. **Add Required Permissions:**
   - Open `android/app/src/main/AndroidManifest.xml`
   - Add these permissions:
   ```xml
   <uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
   <uses-permission android:name="com.google.android.gms.permission.ACTIVITY_RECOGNITION" />
   ```

3. **Configure Google Fit API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the "Fitness API"
   - Create OAuth 2.0 credentials for Android
   - Add your app's SHA-1 fingerprint

4. **Add Google Play Services:**
   - Open `android/app/build.gradle`
   - Add to dependencies:
   ```gradle
   implementation 'com.google.android.gms:play-services-fitness:21.1.0'
   implementation 'com.google.android.gms:play-services-auth:20.7.0'
   ```

5. **Build and Test:**
   ```bash
   npx cap run android
   ```

## 📱 Testing on Real Devices

### iOS Testing:
1. Connect an iPhone with iOS 8.0+
2. Make sure HealthKit is available (not on simulators)
3. Test permission flow in Settings > Privacy & Security > Health

### Android Testing:
1. Install Google Fit app on the device
2. Connect device and run the app
3. Test permission flow in device settings

## 🔧 Troubleshooting

### Common Issues:

1. **"Health plugin not available"**
   - Ensure you've run `npx cap sync`
   - Check that the health plugin is installed
   - Verify native platform setup

2. **iOS: "HealthKit not available"**
   - HealthKit only works on real devices, not simulators
   - Ensure HealthKit capability is enabled in Xcode

3. **Android: "Google Fit access denied"**
   - Install Google Fit app
   - Check Google Fit API is enabled in Cloud Console
   - Verify OAuth credentials are configured

4. **Permission denied after granting****
   - Check app permissions in device settings
   - Re-install the app to reset permissions

## 📋 Current Features

- ✅ **Web Fallback**: Shows mock data on web browsers
- ✅ **Permission Management**: Proper request/denial handling
- ✅ **Auto Updates**: Step count updates every minute
- ✅ **Visual Feedback**: Different UI states for permission status
- ✅ **Settings Integration**: Button to guide users to settings
- ✅ **Error Handling**: Graceful fallbacks when health data unavailable

## 🔄 Current App Status

The step counter on the home screen will:
- Show mock data in web browsers
- Request health permissions on mobile devices
- Display real step data when permissions granted
- Show helpful messages when permissions denied
- Update automatically every minute

To see the native integration working, build and test on real iOS/Android devices following the setup steps above.