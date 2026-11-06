import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Decouple build from a specific Supabase project — read host from env
  // so the same codebase can ship to multiple backends (dev/prod, forks).
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseHost = (env.VITE_SUPABASE_URL || 'https://ismbryaopmkffztxbpoi.supabase.co')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  const restPattern = new RegExp(`^https://${supabaseHost.replace(/\./g, '\\.')}/rest/.*`, 'i');
  const authPattern = new RegExp(`^https://${supabaseHost.replace(/\./g, '\\.')}/auth/.*`, 'i');

  return ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png', 'sw-push.js'],
      manifest: {
        name: 'Planik Fitness',
        short_name: 'Planik',
        description: 'Your personal fitness tracking companion',
        theme_color: '#8B5CF6',
        background_color: '#0F172A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        id: '/',
        categories: ['health', 'fitness', 'lifestyle'],
        // iOS specific
        prefer_related_applications: false,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff2}'],
        // Activate new SW immediately so updated thumbnails/assets appear on first open
        // (otherwise the old SW keeps serving stale precached PNGs until all tabs close).
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Skip the sw-push.js from being overwritten
        navigateFallbackDenylist: [/^\/sw-push\.js$/, /^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: restPattern,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: authPattern,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  });
});
