/**
 * main.tsx — Application bootstrap.
 *
 * Responsibilities:
 *  1. Mount the React tree into <div id="root"> from index.html.
 *  2. Wire up every top-level provider (theming, settings, routing, SEO head,
 *     error boundary) in the correct order. Order matters: providers higher in
 *     the tree are available to everything beneath them.
 *  3. Register the PWA service worker so the app can run offline once cached.
 *  4. Self-heal "stale chunk" errors that happen when the user opens an old
 *     tab after we ship a new build (the JS files they have references no
 *     longer exist on the server). We catch the error, wipe caches, reload.
 *
 * This file is the FIRST thing the browser runs after parsing index.html, so
 * keep it tiny and synchronous — heavy work belongs in the components below.
 */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { SplashScreen } from "./components/SplashScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
// `virtual:pwa-register` is a magic import provided by vite-plugin-pwa.
// It returns a function we can call to opt into auto-updates.
import { registerSW } from 'virtual:pwa-register';

// ---- Stale-chunk self-healer ------------------------------------------------
// When we redeploy, the hashed JS filenames change. A user with the app open
// might try to lazy-load a chunk that no longer exists → "Importing a module
// script failed". Instead of leaving them stuck on a blank page, we detect
// that exact error and force a clean reload (after clearing the SW + caches
// so they pull the fresh bundle).
const RELOAD_KEY = 'chunk-reload-ts';
const RELOAD_THROTTLE_MS = 10_000; // Don't loop-reload faster than every 10s.
const CHUNK_ERR_RE = /Importing a module script failed|Failed to fetch dynamically imported module|Loading chunk .* failed|error loading dynamically imported module/i;
const handleChunkError = (msg: string) => {
  if (!CHUNK_ERR_RE.test(msg)) return;
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - last < RELOAD_THROTTLE_MS) return; // throttle guard
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  const reload = () => window.location.reload();
  const tasks: Promise<unknown>[] = [];
  // Unregister every service worker so the next load fetches a fresh one.
  if ('serviceWorker' in navigator) {
    tasks.push(navigator.serviceWorker.getRegistrations().then((rs) => Promise.all(rs.map((r) => r.unregister()))));
  }
  // Nuke the Cache Storage entries the SW was serving from.
  if ('caches' in window) {
    tasks.push(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
  Promise.all(tasks).finally(reload);
};
// Two listeners because errors arrive through different channels:
//   - synchronous render/script errors → 'error'
//   - failed dynamic import() promises → 'unhandledrejection'
window.addEventListener('error', (e) => handleChunkError(e.message || String((e as ErrorEvent).error || '')));
window.addEventListener('unhandledrejection', (e) => handleChunkError(String(e.reason?.message || e.reason || '')));

// ---- PWA service worker registration ----------------------------------------
// `registerSW` returns an "update" function. When a new SW is detected we
// immediately call it with `true` to skip the "click to refresh" prompt — the
// app just silently swaps to the new version on the next route change.
const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true); // auto-update silently to avoid stale chunks
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

/**
 * Top-level component that decides whether to show the splash screen or the
 * real app. We only show the splash ONCE per browser session (tracked in
 * sessionStorage) so navigating around doesn't replay it.
 */
const MainApp = () => {
  // Lazy initializer: this function only runs on the very first render.
  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem('splashShown') !== 'true';
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  // Provider order (outer → inner):
  //   HelmetProvider   → manages <title>/<meta> tags for SEO per route
  //   BrowserRouter    → enables react-router hooks/components below it
  //   ThemeProvider    → light/dark/system theme + CSS variable swapping
  //   SettingsProvider → user preferences (units, locale, etc.)
  //   ErrorBoundary    → last line of defense: catches render crashes and
  //                      shows a friendly "Reload" screen instead of white.
  return (
    <>
    {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <SettingsProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </SettingsProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
    </>
  );
};

// Grab the mount node defined in index.html. If it's missing the HTML is
// broken — fail loudly rather than render nothing.
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

// StrictMode double-invokes effects in development to surface side-effect
// bugs early. It is a no-op in production builds.
createRoot(rootElement).render(
  <StrictMode>
    <MainApp />
  </StrictMode>
);
