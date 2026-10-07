# Planik — Fitness & Health Tracking

Planik is a cross-platform fitness application I built to track workouts, nutrition, water intake, and daily steps. The app ships natively to iOS and Android via Capacitor and runs as a Progressive Web App on the web.

This project is part of my technical portfolio for the **Technical Intern role at Apple (Wallet, Payments, and Commerce)**, with a deliberate focus on:

- **Native bridging** — custom Capacitor plugins for Apple HealthKit (iOS) and Health Connect (Android) step counting
- **Offline-first synchronization** — IndexedDB-backed local stores with deferred reconciliation against the backend
- **Data privacy** — end-to-end Row-Level Security (RLS) on every table, anonymous guest sessions, and explicit health-data disclosures matching App Store review requirements

## Features

- Workout planning with templates, personal records, and a rest timer
- Diet tracking with barcode scanning (OpenFoodFacts) and food recognition
- Daily step sync from HealthKit / Health Connect with a 7-day history view
- Water intake and weight progress tracking against user-defined goals
- Customizable home dashboard (drag-and-drop widget ordering, hide/show)
- Light/dark themes with user-selectable accent color
- Guest mode for frictionless onboarding, with full account upgrade path

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS v3, shadcn/ui, semantic HSL design tokens |
| State | Zustand stores with selective persistence |
| Native | Capacitor 6 (iOS Swift / Android Kotlin bridges) |
| Backend | Supabase (Postgres, Auth, Edge Functions, Storage) |
| Security | Row-Level Security on every table, JWT validation in edge functions |
| Offline | IndexedDB via custom `OfflineStorage` service, online/offline transition sync |

## Architecture Highlights

### Native step counting
Custom Capacitor plugin (`StepCounterPlugin.swift` / `StepCounterPlugin.java`) bridges platform pedometer APIs into a unified TypeScript interface. Dates are formatted using the device's local timezone (`yyyy-MM-dd`) — never UTC ISO strings — to prevent day-boundary drift between the native layer and Supabase.

### Offline-first sync
`useOfflineSync` mirrors workout plans, sessions, and personal records to IndexedDB on every mutation. A reconnect transition triggers a single forced sync, avoiding the chatty server pings typical of always-online apps.

### Edge function security
All sensitive flows (password reset, feedback submission, food recognition, barcode lookup) live in Supabase Edge Functions. They enforce origin allowlists, escape user-supplied HTML before email rendering, and return generic error messages to prevent information leakage. A scheduled `keep-alive` job (`pg_cron` daily at 03:00 UTC) prevents the database from idling.

### Apple App Store compliance
The iOS build includes the required HealthKit privacy disclosure flow, Apple Sign-In as an OAuth option, and a documented demo account for App Review.

## Project Structure

```
src/
├── components/        # Reusable UI (shadcn-based + custom)
├── pages/             # Route-level views
├── stores/            # Zustand stores (workout, diet)
├── services/          # Native bridges, offline storage, notifications
├── plugins/           # Capacitor plugin TypeScript interfaces
├── contexts/          # Auth, theme, settings
└── integrations/      # Supabase client

supabase/
├── functions/         # Edge functions (Deno)
└── migrations/        # SQL schema migrations

ios/  android/         # Native projects (Capacitor)
```

## Getting Started

Requires Node.js 18+ and Bun (or npm).

```bash
bun install
bun run dev
```

### Building for native platforms

```bash
bun run build
npx cap sync
npx cap open ios       # requires Xcode
npx cap open android   # requires Android Studio
```

### Environment

Create a `.env` file with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

## License

Personal portfolio project. All rights reserved.
