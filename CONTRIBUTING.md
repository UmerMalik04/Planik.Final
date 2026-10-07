# Contributing to Planik

Thanks for taking the time to look at Planik. This is primarily a personal portfolio project, but contributions, suggestions, and bug reports are welcome.

## Code of Conduct

Be respectful. Assume good intent. Disagree on the technical merits.

## Development Setup

Requires **Node.js 18+** and **Bun** (or npm).

```bash
git clone https://github.com/UmerMalik04/planik.git
cd planik
bun install
bun run dev
```

The web app runs at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

These are publishable (anon) keys — safe to expose in client code. Server-only secrets live in Supabase Edge Function settings.

### Native Builds

```bash
bun run build
npx cap sync
npx cap open ios       # requires Xcode (macOS only)
npx cap open android   # requires Android Studio
```

## Project Structure

```
src/
├── components/     # Reusable UI (shadcn-based + custom)
├── pages/          # Route-level views
├── stores/         # Zustand stores (workout, diet)
├── services/       # Native bridges, offline storage, notifications
├── plugins/        # Capacitor plugin TypeScript interfaces
├── contexts/       # Auth, theme, settings
└── integrations/   # Supabase client

supabase/
├── functions/      # Edge functions (Deno)
└── migrations/     # SQL schema migrations

ios/  android/      # Native projects (Capacitor)
```

## Coding Conventions

- **TypeScript strict mode.** No `any` unless unavoidable.
- **Semantic design tokens.** Never hardcode colors in components — use the HSL tokens defined in `src/index.css` and `tailwind.config.ts`.
- **Local dates for health data.** Format dates as `yyyy-MM-dd` in the device's local timezone — never UTC ISO strings — to prevent day-boundary drift between native step counters and Supabase.
- **Optimistic UI.** No artificial delays or skeletons longer than 100ms. Update local state immediately, reconcile with the server in the background.
- **Silent success, visible failure.** Toasts only for errors — successful actions are reflected in the UI itself.

## Database Changes

Schema changes are managed via Supabase migrations in `supabase/migrations/`. Every table has Row-Level Security enabled — never bypass RLS, never store roles on the `profiles` or `users` table.

## Pull Requests

1. Fork the repo and create a feature branch from `main`.
2. Keep changes focused. One concern per PR.
3. Run `bun run build` locally to confirm TypeScript compiles cleanly.
4. Update `README.md` if you change setup, scripts, or architecture.
5. Open the PR with a short description of **what** changed and **why**.

## Reporting Bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser / OS / device (especially relevant for HealthKit / Health Connect issues)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
