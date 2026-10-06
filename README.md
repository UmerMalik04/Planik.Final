# Planik

A fitness tracking app: workout plans and logging, progress charts, a body map, diet tracking with barcode and photo food recognition, and a daily step counter.

Built with Vite, React, TypeScript, Tailwind CSS and shadcn/ui, packaged for Android and iOS with Capacitor, and backed by Supabase.

## Web development

Requires Node.js 20 or newer.

```sh
npm install
npm run dev      # http://localhost:8080
npm run build    # production build in dist/
npm run lint
```

The Supabase URL and publishable key are in `.env` and `src/integrations/supabase/client.ts`.

## Native apps

The app ID is `com.planik.app`. After changing web code, rebuild and copy it into the native projects:

```sh
npm run build
npx cap sync
```

### Android

Open `android/` in Android Studio (`npx cap open android`) and run it.

- Step counting uses the phone's step counter sensor and needs the Physical activity permission. The sensor has no history, so past days come from the steps the app has saved to Supabase.
- Barcode scanning uses Google's code scanner. Google Play services downloads it the first time you scan.

### iOS

Needs macOS with Xcode and CocoaPods.

```sh
cd ios/App && pod install
npx cap open ios
```

- Minimum iOS version is 15.5, which the ML Kit barcode scanner requires.
- Step counting reads from HealthKit. The HealthKit entitlement is in `ios/App/App/App.entitlements`; select your team under Signing & Capabilities so Xcode can add HealthKit to the App ID.

## Supabase edge functions

Functions live in `supabase/functions`. Set these secrets on the Supabase project (`supabase secrets set NAME=value`):

| Secret | Used by |
| --- | --- |
| `GEMINI_API_KEY` | `recognize-food` (Google Gemini, from https://aistudio.google.com/apikey) |
| `RESEND_API_KEY` | `request-password-reset`, `send-email`, `send-feedback` |
| `SITE_URL` | `request-password-reset`, the URL that password reset links open, e.g. `https://planik.app` |

Deploy with `supabase functions deploy <name>`.
